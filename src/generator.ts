export {
  tsTypeAnn,
  tsRecord,
  elmTypeAnn,
  elmTypeDecoder,
  elmTypeEncoder,
  elmRecord,
  tsEnum,
  elmEnum,
  tsUnion,
  elmUnion,
  elmRecordDecoder,
  elmRecordEncoder,
  elmEnumEncoder,
  elmEnumDecoder,
  elmUnionDecoder,
  isPortType,
  tycoFromStr,
  Config,
};

interface Config {
  elmPath?: string;
  tsPath?: string;
  types?: {
    records?: { [dynamic: string]: { [dynamic: string]: string } };
    enums?: { [dynamic: string]: string[] };
    unions?: {
      [dynamic: string]: { [dynamic: string]: { [dynamic: string]: string } };
    };
  };
  ports?: {
    toElm?: { [dynamic: string]: string };
    fromElm?: { [dynamic: string]: string };
  };
}

type TyCo =
  | { type: "Int" }
  | { type: "Unit" }
  | { type: "Bool" }
  | { type: "String" }
  | { type: "List"; value: string }
  | { type: "Dict"; value: string }
  | { type: "Maybe"; value: string }
  | { type: "Other"; tyCo: string };

function tycoFromStr(str: string): TyCo {
  const [tyco, ...arr] = str.replace(`Dict String`, `Dict`).trim().split(/\s+/);

  if (arr.length > 1) {
    throw new Error(
      `Invalid type: ${str}. Only types with a single type constructor arg supported`
    );
  }

  switch (tyco) {
    case "":
    case "()":
    case "Unit":
      if (arr.length) throw new Error(`Invalid unit type: ${str}`);
      return { type: "Unit" };
    case "Int":
      if (arr.length) throw new Error(`Invalid int type: ${str}`);
      return { type: "Int" };
    case "Bool":
      if (arr.length) throw new Error(`Invalid bool type: ${str}`);
      return { type: "Bool" };
    case "String":
      if (arr.length) throw new Error(`Invalid string type: ${str}`);
      return { type: "String" };
    case "List":
      if (arr.length !== 1) throw new Error(`Invalid list type: ${str}`);
      return { type: "List", value: arr[0] };
    case "Dict":
      if (arr.length !== 1) throw new Error(`Invalid dict type: ${str}`);
      return { type: "Dict", value: arr[0] };
    case "Maybe":
      if (arr.length !== 1) throw new Error(`Invalid maybe type: ${str}`);
      return { type: "Maybe", value: arr[0] };
    default:
      if (tyco[0] === tyco[0].toUpperCase()) {
        if (arr.length) throw new Error(`Invalid type: ${str}`);
        return { type: "Other", tyCo: tyco };
      } else {
        throw new Error("Invalid type: " + str);
      }
  }
}

function lcf(str: string): string {
  return str[0].toLowerCase() + str.slice(1);
}

function isPortType(str: string): boolean {
  const tyCo = tycoFromStr(str);
  switch (tyCo.type) {
    case "String":
    case "Int":
    case "Bool":
    case "Unit":
      return true;
    default:
      return false;
  }
}

// ts types

function tsTypeAnn(str: string): string {
  const tyCo = tycoFromStr(str);

  switch (tyCo.type) {
    case "String":
      return "string";
    case "Int":
      return "number";
    case "Bool":
      return "boolean";
    case "Unit":
      return "null";
    case "List":
      return tsTypeAnn(tyCo.value) + "[]";
    case "Dict":
      return `{ [dynamic:string]: ${tsTypeAnn(tyCo.value)} }`;
    case "Maybe":
      return tsTypeAnn(tyCo.value) + " | null";
    case "Other":
      return tyCo.tyCo;
  }
}

// elm types

function elmTypeAnn(str: string): string {
  const tyCo = tycoFromStr(str);

  if (tyCo.type === "Dict") {
    return "Dict String " + tyCo.value;
  } else {
    return str;
  }
}

// ts records

function tsRecord(name: string, fields: { [dynamic: string]: string }): string {
  return `export interface ${name} {
  ${Object.entries(fields).map(tsRecordField).join("\n  ")}
}`;
}

function tsRecordField([name, type]: string[]) {
  return `${name}: ${tsTypeAnn(type)};`;
}

// elm records

function elmRecord(
  name: string,
  fields: { [dynamic: string]: string }
): string {
  return `type alias ${name} =
    { ${Object.entries(fields).map(elmRecordField).join("\n    , ")}
    }`;
}

function elmRecordField([name, type]: string[]) {
  return `${name}: ${elmTypeAnn(type)}`;
}

// ts enums

function tsEnum(name: string, variants: string[]): string {
  return `export enum ${name} {
${variants.map((v) => `  ${v} = "${v}",`).join("\n")}
}`;
}

// elm enums

function elmEnum(name: string, variants: string[]): string {
  return `type ${name}
    = ${variants.map((v) => v).join("\n    | ")}`;
}

// ts union

function tsUnion(
  name: string,
  variants: { [dynamic: string]: { [dynamic: string]: string } }
): string {
  return `export type ${name} =
  ${Object.entries(variants).map(tsUnionVariant).join("\n  ")}`;
}

function tsUnionVariant([name, types]): string {
  return `| { type: "${name}"; ${Object.entries(types)
    .map(tsUnionType)
    .join("; ")} }`;
}

function tsUnionType([name, type]): string {
  return `${name}: ${tsTypeAnn(type)}`;
}

// elm union

function elmUnion(
  name: string,
  variants: { [dynamic: string]: { [dynamic: string]: string } }
): string {
  const elmUnionRecords = Object.entries(variants)
    .filter(([_, fields]) => Object.keys(fields).length)
    .map(([n, fields]) => elmRecord(n + name, fields))
    .join("\n\n");
  return `${elmUnionRecords}

type ${name}
    = ${Object.entries(variants)
      .map(([n, fields]) =>
        Object.keys(fields).length ? `${n} ${n}${name}` : n
      )
      .join("\n    | ")}`.trim();
}

// record decoder

function elmTypeDecoder(str: string) {
  if (!str) return "";

  const tyCo = tycoFromStr(str);

  switch (tyCo.type) {
    case "String":
      return `Decode.string`;
    case "Int":
      return `Decode.int`;
    case "Bool":
      return `Decode.bool`;
    case "Maybe":
      return `(Decode.maybe ${elmTypeDecoder(tyCo.value)})`;
    case "List":
      return `(Decode.list ${elmTypeDecoder(tyCo.value)})`;
    case "Dict":
      return `(Decode.dict ${elmTypeDecoder(tyCo.value)})`;
    case "Other":
      return `${lcf(tyCo.tyCo)}Decoder`;
  }
}

function elmDefaultDecoder(str: string) {
  const tyCo = tycoFromStr(str);

  switch (tyCo.type) {
    case "List":
      return "Decode.succeed []";
    case "Dict":
      return "Decode.succeed Dict.empty";
    case "Maybe":
      return "Decode.succeed Nothing";
    default:
      null;
  }
}

function elmRecordDecoder(
  name: string,
  fields: { [dynamic: string]: string }
): string {
  const body = Object.entries(fields)
    .map(([fieldName, fieldType]) => {
      const decoders = [
        `Decode.field "${fieldName}" ${elmTypeDecoder(fieldType)}`,
        elmDefaultDecoder(fieldType),
      ]
        .filter((d) => !!d)
        .join(", ");
      return `(Decode.oneOf [ ${decoders} ])`;
    })
    .join("\n        ");

  const numFields = Object.keys(fields).length;

  return `

${lcf(name)}Decoder : Decode.Decoder ${name}
${lcf(name)}Decoder =
    Decode.map${numFields > 1 ? numFields : ""} ${name}
        ${body}

  `;
}

// record nncoder

function elmTypeEncoder(str: string) {
  if (!str) return "";

  const tyCo = tycoFromStr(str);

  switch (tyCo.type) {
    case "String":
      return `Encode.string`;
    case "Int":
      return `Encode.int`;
    case "Bool":
      return `Encode.bool`;
    case "Maybe":
      return `Maybe.withDefault Encode.null <| Maybe.map ${elmTypeEncoder(
        tyCo.value
      )} <| `;
    case "List":
      return `(Encode.list ${elmTypeEncoder(tyCo.value)})`;
    case "Dict":
      return `(Encode.dict identity ${elmTypeEncoder(tyCo.value)})`;
    case "Other":
      return `${lcf(tyCo.tyCo)}Encoder`;
  }
}

function elmRecordEncoder(name: string, fields: { [dynamic: string]: string }) {
  const body = Object.entries(fields)
    .map(
      ([fieldName, fieldType]) =>
        `( "${fieldName}", (${elmTypeEncoder(fieldType)} ${lcf(
          name
        )}.${fieldName}))`
    )
    .join(",\n        ");

  return `

${lcf(name)}Encoder : ${name} -> Encode.Value
${lcf(name)}Encoder ${lcf(name)} =
    Encode.object
        [ ${body}
        ]
    `;
}

// enum decoders

function elmEnumDecoder(name: string, variants: string[]) {
  const variantDecoders = variants
    .map((type) => {
      return `"${type}" -> Decode.succeed ${type}`;
    })
    .join("\n                    ");

  return `

${lcf(name)}Decoder : Decode.Decoder ${name}
${lcf(name)}Decoder =
    Decode.string
        |> Decode.andThen
            (\\str ->
                case str of
                    ${variantDecoders}
                    unknown -> Decode.fail <| "Unknown ${name}: " ++ unknown
            )

    `;
}

// enum encoders

function elmEnumEncoder(name: string, variants: string[]) {
  const variantEncoders = variants
    .map((v) => {
      return `${v} -> Encode.string "${v}"`;
    })
    .join("\n        ");

  return `

${lcf(name)}Encoder : ${name} -> Encode.Value
${lcf(name)}Encoder ${lcf(name)} =
    case ${lcf(name)} of
        ${variantEncoders}

    `;
}

// custom type decoder

function elmUnionDecoder(
  name: string,
  variants: { [dynamic: string]: { [dynamic: string]: string } }
): string {
  const variantCodecs = Object.entries(variants)
    .map(([variantName, fields]) => {
      return Object.keys(fields).length
        ? [
            elmRecordDecoder(variantName + name, fields),
            elmRecordEncoder(variantName + name, fields),
          ].join("\n")
        : [];
    })
    .join("\n");

  return `${variantCodecs}

${lcf(name)}Decoder : Decode.Decoder (${name})
${lcf(name)}Decoder =
    Decode.field "type" Decode.string
        |> Decode.andThen
            (\\type_ ->
                case type_ of
                    ${Object.entries(variants)
                      .map(([variantName, fields]) => {
                        return (
                          `"${variantName}" -> ` +
                          (Object.keys(fields).length
                            ? `${lcf(
                                variantName
                              )}${name}Decoder |> Decode.andThen (Decode.succeed << ${variantName})`
                            : `Decode.succeed ${variantName}`)
                        );
                      })
                      .join("\n                    ")}

                    _-> Decode.fail <| "Unknown type " ++ type_
            )

  `;
}

import {
  elmTypeDecoder,
  elmTypeEncoder,
  elmTypeAnn,
  isPortType,
} from "./generator";

export default function (
  moduleName: string,
  typesModuleName: string,
  toElm: { [dynamic: string]: string } = {},
  fromElm: { [dynamic: string]: string } = {}
) {
  const exposing = Object.keys(fromElm).concat("subscribe").join(", ");

  const typesModuleDecl =
    (typesModuleName && `import ${typesModuleName} exposing (..)`) || "";

  return `port module ${moduleName} exposing (${exposing})

import Json.Encode as Encode
import Json.Decode as Decode
${typesModuleDecl}

${Object.entries(fromElm)
  .map(
    ([k, type]) =>
      `port ${k}Port : ${basicTypeOr(type, "Encode.Value")} -> Cmd msg`
  )
  .join("\n\n")}

${Object.entries(toElm)
  .map(
    ([k, type]) =>
      `port ${k}Sub : (${basicTypeOr(type, "Decode.Value")} -> msg) -> Sub msg`
  )
  .join("\n\n")}

${Object.entries(fromElm)
  .map(
    ([name, type]) => `

${name}: ${elmTypeAnn(type)} -> Cmd msg
${name} = ${name}Port ${isPortType(type) ? "" : "<< " + elmTypeEncoder(type)}

`
  )
  .join("\n")}

subscribe : { ${Object.entries(toElm)
    .map(([k, type]) => `${k}: ${subType(type)} -> msg`)
    .join(", ")} } -> Sub msg
subscribe subs =
    Sub.batch
        [ ${Object.entries(toElm)
          .map(([k, type]) => `${k}Sub ${subArg(k, type)}`)
          .join(", ")}
        ]
`;
}

function subArg(key: string, type_: string): string {
  switch (type_) {
    case "()":
    case "String":
    case "Int":
    case "Bool":
      return "subs." + key;
    default:
      return `(Decode.decodeValue ${elmTypeDecoder(type_)} >> subs.${key})`;
  }
}

function subType(type_: string): string {
  switch (type_) {
    case "()":
    case "String":
    case "Int":
    case "Bool":
      return type_;
    default:
      return `Result Decode.Error (${elmTypeAnn(type_)})`;
  }
}

function basicTypeOr(type: string, or: string) {
  switch (type) {
    case "()":
    case "String":
    case "Bool":
    case "Int":
      return type;
    default:
      return or;
  }
}

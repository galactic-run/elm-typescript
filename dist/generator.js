"use strict";
exports.__esModule = true;
exports.tycoFromStr = exports.isPortType = exports.elmUnionDecoder = exports.elmEnumDecoder = exports.elmEnumEncoder = exports.elmRecordEncoder = exports.elmRecordDecoder = exports.elmUnion = exports.tsUnion = exports.elmEnum = exports.tsEnum = exports.elmRecord = exports.elmTypeEncoder = exports.elmTypeDecoder = exports.elmTypeAnn = exports.tsRecord = exports.tsTypeAnn = void 0;
function tycoFromStr(str) {
    var _a = str.replace("Dict String", "Dict").trim().split(/\s+/), tyco = _a[0], arr = _a.slice(1);
    if (arr.length > 1) {
        throw new Error("Invalid type: " + str + ". Only types with a single type constructor arg supported");
    }
    switch (tyco) {
        case "":
        case "()":
        case "Unit":
            if (arr.length)
                throw new Error("Invalid unit type: " + str);
            return { type: "Unit" };
        case "Int":
            if (arr.length)
                throw new Error("Invalid int type: " + str);
            return { type: "Int" };
        case "Bool":
            if (arr.length)
                throw new Error("Invalid bool type: " + str);
            return { type: "Bool" };
        case "String":
            if (arr.length)
                throw new Error("Invalid string type: " + str);
            return { type: "String" };
        case "List":
            if (arr.length !== 1)
                throw new Error("Invalid list type: " + str);
            return { type: "List", value: arr[0] };
        case "Dict":
            if (arr.length !== 1)
                throw new Error("Invalid dict type: " + str);
            return { type: "Dict", value: arr[0] };
        case "Maybe":
            if (arr.length !== 1)
                throw new Error("Invalid maybe type: " + str);
            return { type: "Maybe", value: arr[0] };
        default:
            if (tyco[0] === tyco[0].toUpperCase()) {
                if (arr.length)
                    throw new Error("Invalid type: " + str);
                return { type: "Other", tyCo: tyco };
            }
            else {
                throw new Error("Invalid type: " + str);
            }
    }
}
exports.tycoFromStr = tycoFromStr;
function lcf(str) {
    return str[0].toLowerCase() + str.slice(1);
}
function isPortType(str) {
    var tyCo = tycoFromStr(str);
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
exports.isPortType = isPortType;
// ts types
function tsTypeAnn(str) {
    var tyCo = tycoFromStr(str);
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
            return "{ [dynamic:string]: " + tsTypeAnn(tyCo.value) + " }";
        case "Maybe":
            return tsTypeAnn(tyCo.value) + " | null";
        case "Other":
            return tyCo.tyCo;
    }
}
exports.tsTypeAnn = tsTypeAnn;
// elm types
function elmTypeAnn(str) {
    var tyCo = tycoFromStr(str);
    if (tyCo.type === "Dict") {
        return "Dict String " + tyCo.value;
    }
    else {
        return str;
    }
}
exports.elmTypeAnn = elmTypeAnn;
// ts records
function tsRecord(name, fields) {
    return "export interface " + name + " {\n  " + Object.entries(fields).map(tsRecordField).join("\n  ") + "\n}";
}
exports.tsRecord = tsRecord;
function tsRecordField(_a) {
    var name = _a[0], type = _a[1];
    return name + ": " + tsTypeAnn(type) + ";";
}
// elm records
function elmRecord(name, fields) {
    return "type alias " + name + " =\n    { " + Object.entries(fields).map(elmRecordField).join("\n    , ") + "\n    }";
}
exports.elmRecord = elmRecord;
function elmRecordField(_a) {
    var name = _a[0], type = _a[1];
    return name + ": " + elmTypeAnn(type);
}
// ts enums
function tsEnum(name, variants) {
    return "export enum " + name + " {\n" + variants.map(function (v) { return "  " + v + " = \"" + v + "\","; }).join("\n") + "\n}";
}
exports.tsEnum = tsEnum;
// elm enums
function elmEnum(name, variants) {
    return "type " + name + "\n    = " + variants.map(function (v) { return v; }).join("\n    | ");
}
exports.elmEnum = elmEnum;
// ts union
function tsUnion(name, variants) {
    return "export type " + name + " =\n  " + Object.entries(variants).map(tsUnionVariant).join("\n  ");
}
exports.tsUnion = tsUnion;
function tsUnionVariant(_a) {
    var name = _a[0], types = _a[1];
    return "| { type: \"" + name + "\"; " + Object.entries(types)
        .map(tsUnionType)
        .join("; ") + " }";
}
function tsUnionType(_a) {
    var name = _a[0], type = _a[1];
    return name + ": " + tsTypeAnn(type);
}
// elm union
function elmUnion(name, variants) {
    var elmUnionRecords = Object.entries(variants)
        .filter(function (_a) {
        var _ = _a[0], fields = _a[1];
        return Object.keys(fields).length;
    })
        .map(function (_a) {
        var n = _a[0], fields = _a[1];
        return elmRecord(n + name, fields);
    })
        .join("\n\n");
    return (elmUnionRecords + "\n\ntype " + name + "\n    = " + Object.entries(variants)
        .map(function (_a) {
        var n = _a[0], fields = _a[1];
        return Object.keys(fields).length ? n + " " + n + name : n;
    })
        .join("\n    | ")).trim();
}
exports.elmUnion = elmUnion;
// record decoder
function elmTypeDecoder(str) {
    if (!str)
        return "";
    var tyCo = tycoFromStr(str);
    switch (tyCo.type) {
        case "String":
            return "Decode.string";
        case "Int":
            return "Decode.int";
        case "Bool":
            return "Decode.bool";
        case "Maybe":
            return "(Decode.maybe " + elmTypeDecoder(tyCo.value) + ")";
        case "List":
            return "(Decode.list " + elmTypeDecoder(tyCo.value) + ")";
        case "Dict":
            return "(Decode.dict " + elmTypeDecoder(tyCo.value) + ")";
        case "Other":
            return lcf(tyCo.tyCo) + "Decoder";
    }
}
exports.elmTypeDecoder = elmTypeDecoder;
function elmDefaultDecoder(str) {
    var tyCo = tycoFromStr(str);
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
function elmRecordDecoder(name, fields) {
    var body = Object.entries(fields)
        .map(function (_a) {
        var fieldName = _a[0], fieldType = _a[1];
        var decoders = [
            "Decode.field \"" + fieldName + "\" " + elmTypeDecoder(fieldType),
            elmDefaultDecoder(fieldType),
        ]
            .filter(function (d) { return !!d; })
            .join(", ");
        return "(Decode.oneOf [ " + decoders + " ])";
    })
        .join("\n        ");
    var numFields = Object.keys(fields).length;
    return "\n\n" + lcf(name) + "Decoder : Decode.Decoder " + name + "\n" + lcf(name) + "Decoder =\n    Decode.map" + (numFields > 1 ? numFields : "") + " " + name + "\n        " + body + "\n\n  ";
}
exports.elmRecordDecoder = elmRecordDecoder;
// record nncoder
function elmTypeEncoder(str) {
    if (!str)
        return "";
    var tyCo = tycoFromStr(str);
    switch (tyCo.type) {
        case "String":
            return "Encode.string";
        case "Int":
            return "Encode.int";
        case "Bool":
            return "Encode.bool";
        case "Maybe":
            return "Maybe.withDefault Encode.null <| Maybe.map " + elmTypeEncoder(tyCo.value) + " <| ";
        case "List":
            return "(Encode.list " + elmTypeEncoder(tyCo.value) + ")";
        case "Dict":
            return "(Encode.dict identity " + elmTypeEncoder(tyCo.value) + ")";
        case "Other":
            return lcf(tyCo.tyCo) + "Encoder";
    }
}
exports.elmTypeEncoder = elmTypeEncoder;
function elmRecordEncoder(name, fields) {
    var body = Object.entries(fields)
        .map(function (_a) {
        var fieldName = _a[0], fieldType = _a[1];
        return "( \"" + fieldName + "\", (" + elmTypeEncoder(fieldType) + " " + lcf(name) + "." + fieldName + "))";
    })
        .join(",\n        ");
    return "\n\n" + lcf(name) + "Encoder : " + name + " -> Encode.Value\n" + lcf(name) + "Encoder " + lcf(name) + " =\n    Encode.object\n        [ " + body + "\n        ]\n    ";
}
exports.elmRecordEncoder = elmRecordEncoder;
// enum decoders
function elmEnumDecoder(name, variants) {
    var variantDecoders = variants
        .map(function (type) {
        return "\"" + type + "\" -> Decode.succeed " + type;
    })
        .join("\n                    ");
    return "\n\n" + lcf(name) + "Decoder : Decode.Decoder " + name + "\n" + lcf(name) + "Decoder =\n    Decode.string\n        |> Decode.andThen\n            (\\str ->\n                case str of\n                    " + variantDecoders + "\n                    unknown -> Decode.fail <| \"Unknown " + name + ": \" ++ unknown\n            )\n\n    ";
}
exports.elmEnumDecoder = elmEnumDecoder;
// enum encoders
function elmEnumEncoder(name, variants) {
    var variantEncoders = variants
        .map(function (v) {
        return v + " -> Encode.string \"" + v + "\"";
    })
        .join("\n        ");
    return "\n\n" + lcf(name) + "Encoder : " + name + " -> Encode.Value\n" + lcf(name) + "Encoder " + lcf(name) + " =\n    case " + lcf(name) + " of\n        " + variantEncoders + "\n\n    ";
}
exports.elmEnumEncoder = elmEnumEncoder;
// custom type decoder
function elmUnionDecoder(name, variants) {
    var variantCodecs = Object.entries(variants)
        .map(function (_a) {
        var variantName = _a[0], fields = _a[1];
        return Object.keys(fields).length
            ? [
                elmRecordDecoder(variantName + name, fields),
                elmRecordEncoder(variantName + name, fields),
            ].join("\n")
            : [];
    })
        .join("\n");
    return variantCodecs + "\n\n" + lcf(name) + "Decoder : Decode.Decoder (" + name + ")\n" + lcf(name) + "Decoder =\n    Decode.field \"type\" Decode.string\n        |> Decode.andThen\n            (\\type_ ->\n                case type_ of\n                    " + Object.entries(variants)
        .map(function (_a) {
        var variantName = _a[0], fields = _a[1];
        return ("\"" + variantName + "\" -> " +
            (Object.keys(fields).length
                ? "" + lcf(variantName) + name + "Decoder |> Decode.andThen (Decode.succeed << " + variantName + ")"
                : "Decode.succeed " + variantName));
    })
        .join("\n                    ") + "\n\n                    _-> Decode.fail <| \"Unknown type \" ++ type_\n            )\n\n  ";
}
exports.elmUnionDecoder = elmUnionDecoder;

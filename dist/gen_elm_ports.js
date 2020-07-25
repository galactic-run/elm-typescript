"use strict";
exports.__esModule = true;
var generator_1 = require("./generator");
function default_1(moduleName, typesModuleName, toElm, fromElm) {
    if (toElm === void 0) { toElm = {}; }
    if (fromElm === void 0) { fromElm = {}; }
    var exposing = Object.keys(fromElm).concat("subscribe").join(", ");
    var typesModuleDecl = (typesModuleName && "import " + typesModuleName + " exposing (..)") || "";
    return "port module " + moduleName + " exposing (" + exposing + ")\n\nimport Json.Encode as Encode\nimport Json.Decode as Decode\n" + typesModuleDecl + "\n\n" + Object.entries(fromElm)
        .map(function (_a) {
        var k = _a[0], type = _a[1];
        return "port " + k + "Port : " + basicTypeOr(type, "Encode.Value") + " -> Cmd msg";
    })
        .join("\n\n") + "\n\n" + Object.entries(toElm)
        .map(function (_a) {
        var k = _a[0], type = _a[1];
        return "port " + k + "Sub : (" + basicTypeOr(type, "Decode.Value") + " -> msg) -> Sub msg";
    })
        .join("\n\n") + "\n\n" + Object.entries(fromElm)
        .map(function (_a) {
        var name = _a[0], type = _a[1];
        return "\n\n" + name + ": " + generator_1.elmTypeAnn(type) + " -> Cmd msg\n" + name + " = " + name + "Port " + (generator_1.isPortType(type) ? "" : "<< " + generator_1.elmTypeEncoder(type)) + "\n\n";
    })
        .join("\n") + "\n\nsubscribe : { " + Object.entries(toElm)
        .map(function (_a) {
        var k = _a[0], type = _a[1];
        return k + ": " + subType(type) + " -> msg";
    })
        .join(", ") + " } -> Sub msg\nsubscribe subs =\n    Sub.batch\n        [ " + Object.entries(toElm)
        .map(function (_a) {
        var k = _a[0], type = _a[1];
        return k + "Sub " + subArg(k, type);
    })
        .join(", ") + "\n        ]\n";
}
exports["default"] = default_1;
function subArg(key, type_) {
    switch (type_) {
        case "()":
        case "String":
        case "Int":
        case "Bool":
            return "subs." + key;
        default:
            return "(Decode.decodeValue " + generator_1.elmTypeDecoder(type_) + " >> subs." + key + ")";
    }
}
function subType(type_) {
    switch (type_) {
        case "()":
        case "String":
        case "Int":
        case "Bool":
            return type_;
        default:
            return "Result Decode.Error (" + generator_1.elmTypeAnn(type_) + ")";
    }
}
function basicTypeOr(type, or) {
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

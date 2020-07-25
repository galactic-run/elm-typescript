"use strict";
exports.__esModule = true;
var prettier = require("prettier");
var generator_1 = require("./generator");
function typeToParam(type) {
    switch (type) {
        case "":
        case null:
            return "null";
        default:
            return "msg";
    }
}
function typesToImport(types) {
    return Array.from(new Set(types
        .map(function (t) {
        var tyCo = generator_1.tycoFromStr(t);
        return tyCo.type === "Other" ? tyCo.tyCo : null;
    })
        .filter(function (t) { return !!t; })));
}
function default_1(fromElm, toElm) {
    if (fromElm === void 0) { fromElm = {}; }
    if (toElm === void 0) { toElm = {}; }
    var tti = typesToImport([].concat(Object.values(toElm), Object.values(fromElm)));
    var ports_ts = "\n  " + (tti.length ? "import {" + tti.join(",") + "} from \"./types\";" : "") + "\n\n  interface FromElm {\n    " + Object.entries(fromElm)
        .map(function (_a) {
        var key = _a[0], type = _a[1];
        return key + ": (msg: " + generator_1.tsTypeAnn(type) + ", toElm: ToElm) => void;";
    })
        .join("\n    ") + "\n  }\n\n  interface ToElm {\n    " + Object.entries(toElm)
        .map(function (_a) {
        var key = _a[0], type = _a[1];
        return key + ": (msg:" + generator_1.tsTypeAnn(type) + ") => void;";
    })
        .join("\n") + "\n  }\n\n  export interface ElmApp {\n    ports: {\n      " + Object.entries(toElm)
        .map(function (_a) {
        var key = _a[0], type = _a[1];
        return key + "Sub: { send: (msg: " + generator_1.tsTypeAnn(type) + ") => void };";
    })
        .join("\n") + "\n      " + Object.entries(fromElm)
        .map(function (_a) {
        var key = _a[0], type = _a[1];
        return key + "Port: { subscribe: (sub: (msg: " + generator_1.tsTypeAnn(type) + ") => void) => void };";
    })
        .join("\n") + "\n    };\n  }\n\n  export const init = (app: ElmApp" + (Object.keys(fromElm).length === 0 ? "" : ", fromElm: FromElm") + ") : ToElm => {\n    const toElm = {\n      " + Object.entries(toElm)
        .map(function (_a) {
        var key = _a[0], type = _a[1];
        return key + ": (msg: " + generator_1.tsTypeAnn(type) + ") => app.ports." + key + "Sub.send(" + typeToParam(type) + ")";
    })
        .join(",\n") + "\n    };\n    " + Object.entries(fromElm)
        .map(function (_a) {
        var key = _a[0], _ = _a[1];
        return "if (typeof app.ports." + key + "Port !== 'undefined') { app.ports." + key + "Port.subscribe(msg => fromElm." + key + "(msg, toElm)); }";
    })
        .join("\n") + "\n    return toElm;\n  };\n\n  export default { init };\n  ";
    return prettier.format(ports_ts, { parser: "typescript" });
}
exports["default"] = default_1;

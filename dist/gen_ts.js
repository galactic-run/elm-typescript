"use strict";
exports.__esModule = true;
var prettier = require("prettier");
var generator_1 = require("./generator");
function default_1(_a) {
    var _b = _a.types, _c = _b.records, records = _c === void 0 ? {} : _c, _d = _b.enums, enums = _d === void 0 ? {} : _d, _e = _b.unions, unions = _e === void 0 ? {} : _e;
    var ts = "\n" + (records
        ? Object.entries(records)
            .map(function (_a) {
            var name = _a[0], fields = _a[1];
            return generator_1.tsRecord(name, fields);
        })
            .join("\n")
        : "") + "\n\n" + (enums
        ? Object.entries(enums)
            .map(function (_a) {
            var name = _a[0], variants = _a[1];
            return generator_1.tsEnum(name, variants);
        })
            .join("\n")
        : "") + "\n\n" + (unions
        ? Object.entries(unions)
            .map(function (_a) {
            var name = _a[0], variants = _a[1];
            return generator_1.tsUnion(name, variants);
        })
            .join("\n")
        : "") + "\n";
    return prettier.format(ts, { parser: "typescript" });
}
exports["default"] = default_1;

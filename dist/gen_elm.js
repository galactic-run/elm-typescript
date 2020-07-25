"use strict";
exports.__esModule = true;
var generator_1 = require("./generator");
function default_1(moduleName, _a) {
    var _b = _a.types, _c = _b.records, records = _c === void 0 ? {} : _c, _d = _b.enums, enums = _d === void 0 ? {} : _d, _e = _b.unions, unions = _e === void 0 ? {} : _e;
    return ("\n\nmodule " + moduleName + " exposing (..)\n\nimport Json.Decode as Decode\nimport Json.Encode as Encode\nimport Dict exposing (Dict)\n\n" + (records
        ? Object.entries(records)
            .map(function (_a) {
            var name = _a[0], fields = _a[1];
            return [
                generator_1.elmRecord(name, fields),
                generator_1.elmRecordDecoder(name, fields),
                generator_1.elmRecordEncoder(name, fields),
            ];
        })
            .reduce(function (acc, val) { return acc.concat(val); }, [])
            .join("\n")
        : "") + "\n\n" + (enums
        ? Object.entries(enums)
            .map(function (_a) {
            var name = _a[0], variants = _a[1];
            return [
                generator_1.elmEnum(name, variants),
                generator_1.elmEnumEncoder(name, variants),
                generator_1.elmEnumDecoder(name, variants),
            ];
        })
            .reduce(function (acc, val) { return acc.concat(val); }, [])
            .join("\n")
        : "") + "\n\n" + (unions
        ? Object.entries(unions)
            .map(function (_a) {
            var name = _a[0], variants = _a[1];
            return [
                generator_1.elmUnion(name, variants),
                generator_1.elmUnionDecoder(name, variants),
            ];
        })
            .reduce(function (acc, val) { return acc.concat(val); }, [])
            .join("\n")
        : "") + "\n\n  ").trim();
}
exports["default"] = default_1;

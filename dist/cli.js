"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var fs = require("fs");
var childProcess = require("child_process");
var index_js_1 = require("./index.js");
var path = require("path");
var configFile = "elm-typescript.json";
var elmTypesFilename = "Types.elm";
var elmPortsFilename = "Ports.elm";
var tsTypesFilename = "types.ts";
var tsPortsFilename = "ports.ts";
var tsPortsImport = "ports";
var elmGenSubfolder = "Gen";
var tsGenSubfolder = "gen";
var elmTypesModuleName = "Gen.Types";
var elmPortsModuleName = "Gen.Ports";
var defaultConfig = {
    elmPath: "./src/elm",
    tsPath: "./src/ts",
    types: { records: {}, enums: {}, unions: {} },
    ports: { toElm: {}, fromElm: {} }
};
var exampleConfig = __assign(__assign({}, defaultConfig), { types: {
        records: {
            User: {
                uid: "Int",
                name: "String",
                role: "Role"
            }
        },
        enums: {
            Role: ["Admin", "Regular"]
        },
        unions: {
            Event: {
                Login: {
                    uid: "Int",
                    timestamp: "Int"
                },
                Logout: {
                    uid: "Int",
                    timestamp: "Int"
                },
                Message: {
                    message: "String",
                    timestamp: "Int"
                }
            }
        }
    }, ports: {
        toElm: {
            userLoggedIn: "User",
            eventsFetched: "List Event"
        },
        fromElm: {
            logout: "()"
        }
    } });
// check commands
if (process.argv && process.argv[2] === "init") {
    if (fs.existsSync(configFile)) {
        exit("Existing config found. Remove it and run 'elm-typescript init' again to create new example config.");
    }
    else {
        fs.writeFileSync(configFile, JSON.stringify(exampleConfig, null, 2));
    }
}
// check if config exists
if (!fs.existsSync(configFile)) {
    exit("Config file " + configFile + " not found. Run 'elm-typescript init' to create an example config.");
}
// todo: validate config
var config = __assign(__assign({}, defaultConfig), readConfig());
if (!fs.existsSync(config.elmPath)) {
    exit("elmPath does not exist: " + config.elmPath + ". Create the directory, or change the config to continue");
}
if (!fs.existsSync(config.tsPath)) {
    exit("tsPath does not exist: " + config.tsPath + ". Create the directory, or change the config to continue");
}
if (config.tsPath === config.elmPath) {
    exit("tsPath and elmPath cannot be the same since generated files are put in the 'gen' and 'Gen' subfolders.");
}
// generate ts
if (!fs.existsSync(path.resolve(config.tsPath, tsGenSubfolder))) {
    fs.mkdirSync(path.resolve(config.tsPath, tsGenSubfolder));
}
fs.writeFileSync(path.resolve(config.tsPath, tsGenSubfolder, tsTypesFilename), index_js_1.generateTs(config));
// ts typings
var elmTyping = ("\nimport { ElmApp } from '" + path.relative(path.resolve(config.elmPath, "Main"), path.resolve(config.tsPath, tsGenSubfolder, tsPortsImport)) + "';\n\nexport namespace Elm {\n  namespace Main {\n    export function init(options?: { node?: HTMLElement | null; flags?: any }): ElmApp;\n  }\n}\n").trim();
if (!fs.existsSync(path.resolve(config.elmPath, "Main"))) {
    fs.mkdirSync(path.resolve(config.elmPath, "Main"));
}
fs.writeFileSync(path.resolve(config.elmPath, "Main/index.d.ts"), elmTyping);
// generate elm
var elm = index_js_1.generateElm(elmTypesModuleName, config);
var elmTypesFilenameAndPath = path.resolve(config.elmPath, elmGenSubfolder, elmTypesFilename);
if (!fs.existsSync(path.resolve(config.elmPath, elmGenSubfolder))) {
    fs.mkdirSync(path.resolve(config.elmPath, elmGenSubfolder));
}
fs.writeFileSync(elmTypesFilenameAndPath, elm);
execSync("npx elm-format --yes " + elmTypesFilenameAndPath);
execSync("npx elm make --output=/dev/null " + elmTypesFilenameAndPath);
// ports
var _a = config.ports || {}, _b = _a.fromElm, fromElm = _b === void 0 ? {} : _b, _c = _a.toElm, toElm = _c === void 0 ? {} : _c;
if (Object.keys(fromElm).length || Object.keys(toElm).length) {
    // ts ports
    fs.writeFileSync(path.resolve(config.tsPath, tsGenSubfolder, tsPortsFilename), index_js_1.generateTsPorts(fromElm, toElm));
    // todo: add eslint
    execSync("npx tsc --noEmit " + path.resolve(config.tsPath, tsGenSubfolder, "*.ts"));
    // elm ports
    var elmPortsFilenameAndPath = path.resolve(config.elmPath, elmGenSubfolder, elmPortsFilename);
    fs.writeFileSync(elmPortsFilenameAndPath, index_js_1.generateElmPorts(elmPortsModuleName, elmTypesModuleName, toElm, fromElm));
    execSync("npx elm-format --yes " + elmPortsFilenameAndPath);
    execSync("npx elm make --output=/dev/null " + elmPortsFilenameAndPath);
}
// helpers
function execSync(cmd) {
    try {
        childProcess.execSync(cmd, { stdio: ["inherit", "inherit", "inherit"] });
    }
    catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}
function exit(msg) {
    console.error("\n" + msg + "\n");
    return process.exit(1);
}
function readConfig() {
    try {
        return JSON.parse(fs.readFileSync(configFile).toString());
    }
    catch (e) {
        return exit("Unable to read " + configFile + ": " + e.message);
    }
}

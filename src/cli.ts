import * as fs from "fs";
import * as childProcess from "child_process";
import {
  generateTs,
  generateElm,
  generateTsPorts,
  generateElmPorts,
} from "./index.js";
import * as path from "path";
import { Config } from "./generator";

const configFile = "elm-typescript.json";

const elmTypesFilename = "Types.elm";
const elmPortsFilename = "Ports.elm";
const tsTypesFilename = "types.ts";
const tsPortsFilename = "ports.ts";
const tsPortsImport = "ports";

const elmGenSubfolder = "Gen";
const tsGenSubfolder = "gen";

const elmTypesModuleName = "Gen.Types";
const elmPortsModuleName = "Gen.Ports";

const defaultConfig = {
  elmPath: "./src/elm",
  tsPath: "./src/ts",
  types: { records: {}, enums: {}, unions: {} },
  ports: { toElm: {}, fromElm: {} },
};

const exampleConfig: Config = {
  ...defaultConfig,
  types: {
    records: {
      User: {
        uid: "Int",
        name: "String",
        role: "Role",
      },
    },
    enums: {
      Role: ["Admin", "Regular"],
    },
    unions: {
      Event: {
        Login: {
          uid: "Int",
          timestamp: "Int",
        },
        Logout: {
          uid: "Int",
          timestamp: "Int",
        },
        Message: {
          message: "String",
          timestamp: "Int",
        },
      },
    },
  },
  ports: {
    toElm: {
      userLoggedIn: "User",
      eventsFetched: "List Event",
    },
    fromElm: {
      logout: "()",
    },
  },
};

// check commands

if (process.argv && process.argv[2] === "init") {
  if (fs.existsSync(configFile)) {
    exit(
      `Existing config found. Remove it and run 'elm-typescript init' again to create new example config.`
    );
  } else {
    fs.writeFileSync(configFile, JSON.stringify(exampleConfig, null, 2));
  }
}

// check if config exists
if (!fs.existsSync(configFile)) {
  exit(
    `Config file ${configFile} not found. Run 'elm-typescript init' to create an example config.`
  );
}

// todo: validate config
const config: Config = { ...defaultConfig, ...readConfig() };

if (!fs.existsSync(config.elmPath)) {
  exit(
    `elmPath does not exist: ${config.elmPath}. Create the directory, or change the config to continue`
  );
}

if (!fs.existsSync(config.tsPath)) {
  exit(
    `tsPath does not exist: ${config.tsPath}. Create the directory, or change the config to continue`
  );
}

if (config.tsPath === config.elmPath) {
  exit(
    `tsPath and elmPath cannot be the same since generated files are put in the 'gen' and 'Gen' subfolders.`
  );
}

// generate ts

if (!fs.existsSync(path.resolve(config.tsPath, tsGenSubfolder))) {
  fs.mkdirSync(path.resolve(config.tsPath, tsGenSubfolder));
}

fs.writeFileSync(
  path.resolve(config.tsPath, tsGenSubfolder, tsTypesFilename),
  generateTs(config)
);

// ts typings

const elmTyping = `
import { ElmApp } from '${path.relative(
  path.resolve(config.elmPath, "Main"),
  path.resolve(config.tsPath, tsGenSubfolder, tsPortsImport)
)}';

export namespace Elm {
  namespace Main {
    export function init(options?: { node?: HTMLElement | null; flags?: any }): ElmApp;
  }
}
`.trim();

if (!fs.existsSync(path.resolve(config.elmPath, "Main"))) {
  fs.mkdirSync(path.resolve(config.elmPath, "Main"));
}
fs.writeFileSync(path.resolve(config.elmPath, "Main/index.d.ts"), elmTyping);

// generate elm
const elm = generateElm(elmTypesModuleName, config);

const elmTypesFilenameAndPath = path.resolve(
  config.elmPath,
  elmGenSubfolder,
  elmTypesFilename
);

if (!fs.existsSync(path.resolve(config.elmPath, elmGenSubfolder))) {
  fs.mkdirSync(path.resolve(config.elmPath, elmGenSubfolder));
}

fs.writeFileSync(elmTypesFilenameAndPath, elm);
execSync("npx elm-format --yes " + elmTypesFilenameAndPath);
execSync(`npx elm make --output=/dev/null ${elmTypesFilenameAndPath}`);

// ports

const { fromElm = {}, toElm = {} } = config.ports || {};

if (Object.keys(fromElm).length || Object.keys(toElm).length) {
  // ts ports
  fs.writeFileSync(
    path.resolve(config.tsPath, tsGenSubfolder, tsPortsFilename),
    generateTsPorts(fromElm, toElm)
  );

  // todo: add eslint
  execSync(
    `npx tsc --noEmit ${path.resolve(config.tsPath, tsGenSubfolder, "*.ts")}`
  );

  // elm ports
  const elmPortsFilenameAndPath = path.resolve(
    config.elmPath,
    elmGenSubfolder,
    elmPortsFilename
  );

  fs.writeFileSync(
    elmPortsFilenameAndPath,
    generateElmPorts(elmPortsModuleName, elmTypesModuleName, toElm, fromElm)
  );

  execSync("npx elm-format --yes " + elmPortsFilenameAndPath);
  execSync(`npx elm make --output=/dev/null ${elmPortsFilenameAndPath}`);
}

// helpers

function execSync(cmd: string): void {
  try {
    childProcess.execSync(cmd, { stdio: ["inherit", "inherit", "inherit"] });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

function exit(msg: string) {
  console.error("\n" + msg + "\n");
  return process.exit(1);
}

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configFile).toString());
  } catch (e) {
    return exit(`Unable to read ${configFile}: ${e.message}`);
  }
}

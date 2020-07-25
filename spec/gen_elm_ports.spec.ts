import gen from "../src/gen_elm_ports";

import { expect } from "chai";

import "mocha";

function toArr(str: string): string[] {
  return str.split("\n").filter((line) => line);
}

describe("Elm ports", () => {
  it("Minimal", () => {
    const result = toArr(gen("ModuleName", "TypesImport", {}, {}));
    expect(result).to.eql([
      "port module ModuleName exposing (subscribe)",
      "import Json.Encode as Encode",
      "import Json.Decode as Decode",
      "import TypesImport exposing (..)",
      "subscribe : {  } -> Sub msg",
      "subscribe subs =",
      "    Sub.batch",
      "        [ ",
      "        ]",
    ]);
  });

  it("Subs", () => {
    const result = toArr(
      gen("ModuleName", "TypesImport", { authenticated: "User" }, {})
    );
    expect(result).to.eql([
      "port module ModuleName exposing (subscribe)",
      "import Json.Encode as Encode",
      "import Json.Decode as Decode",
      "import TypesImport exposing (..)",
      "port authenticatedSub : (Decode.Value -> msg) -> Sub msg",
      "subscribe : { authenticated: Result Decode.Error (User) -> msg } -> Sub msg",
      "subscribe subs =",
      "    Sub.batch",
      "        [ authenticatedSub (Decode.decodeValue userDecoder >> subs.authenticated)",
      "        ]",
    ]);
  });

  it("Cmds", () => {
    const result = toArr(
      gen(
        "ModuleName",
        "TypesImport",
        {},
        {
          loginClicked: "UsernameAndPassword",
          logoutClicked: "()",
        }
      )
    );
    expect(result).to.eql([
      "port module ModuleName exposing (loginClicked, logoutClicked, subscribe)",
      "import Json.Encode as Encode",
      "import Json.Decode as Decode",
      "import TypesImport exposing (..)",
      "port loginClickedPort : Encode.Value -> Cmd msg",
      "port logoutClickedPort : () -> Cmd msg",
      "loginClicked: UsernameAndPassword -> Cmd msg",
      "loginClicked = loginClickedPort << usernameAndPasswordEncoder",
      "logoutClicked: () -> Cmd msg",
      "logoutClicked = logoutClickedPort ",
      "subscribe : {  } -> Sub msg",
      "subscribe subs =",
      "    Sub.batch",
      "        [ ",
      "        ]",
    ]);
  });
});

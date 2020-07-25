import gen from "../src/gen_elm";

import { expect } from "chai";

import "mocha";

function toArr(str: string): string[] {
  return str.split("\n").filter((line) => line.trim());
}

describe("Elm types", () => {
  it("Interfaces", () => {
    const result = toArr(
      gen("ModuleName", {
        types: {
          records: {
            User: { name: "String" },
          },
          unions: {},
          enums: {},
        },
      })
    );
    // console.log(result);
    expect(result).to.eql([
      "module ModuleName exposing (..)",
      "import Json.Decode as Decode",
      "import Json.Encode as Encode",
      "import Dict exposing (Dict)",
      "type alias User =",
      "    { name: String",
      "    }",
      "userDecoder : Decode.Decoder User",
      "userDecoder =",
      "    Decode.map User",
      '        (Decode.oneOf [ Decode.field "name" Decode.string ])',
      "userEncoder : User -> Encode.Value",
      "userEncoder user =",
      "    Encode.object",
      '        [ ( "name", (Encode.string user.name))',
      "        ]",
    ]);
  });

  it("Enums", () => {
    const result = toArr(
      gen("ModuleName", {
        types: {
          enums: { Color: ["Red", "Green", "Blue"] },
          records: {},
          unions: {},
        },
      })
    );
    // console.log(result);
    expect(result).to.eql([
      "module ModuleName exposing (..)",
      "import Json.Decode as Decode",
      "import Json.Encode as Encode",
      "import Dict exposing (Dict)",
      "type Color",
      "    = Red",
      "    | Green",
      "    | Blue",
      "colorEncoder : Color -> Encode.Value",
      "colorEncoder color =",
      "    case color of",
      '        Red -> Encode.string "Red"',
      '        Green -> Encode.string "Green"',
      '        Blue -> Encode.string "Blue"',
      "colorDecoder : Decode.Decoder Color",
      "colorDecoder =",
      "    Decode.string",
      "        |> Decode.andThen",
      "            (\\str ->",
      "                case str of",
      '                    "Red" -> Decode.succeed Red',
      '                    "Green" -> Decode.succeed Green',
      '                    "Blue" -> Decode.succeed Blue',
      '                    unknown -> Decode.fail <| "Unknown Color: " ++ unknown',
      "            )",
    ]);
  });

  it("Unions", () => {
    const result = toArr(
      gen("ModuleName", {
        types: {
          unions: { Event: { Login: { uid: "String" }, Logout: {} } },
          records: {},
          enums: {},
        },
      })
    );
    // console.log(result);
    expect(result).to.eql([
      "module ModuleName exposing (..)",
      "import Json.Decode as Decode",
      "import Json.Encode as Encode",
      "import Dict exposing (Dict)",
      "type alias LoginEvent =",
      "    { uid: String",
      "    }",
      "type Event",
      "    = Login LoginEvent",
      "    | Logout",
      "loginEventDecoder : Decode.Decoder LoginEvent",
      "loginEventDecoder =",
      "    Decode.map LoginEvent",
      '        (Decode.oneOf [ Decode.field "uid" Decode.string ])',
      "loginEventEncoder : LoginEvent -> Encode.Value",
      "loginEventEncoder loginEvent =",
      "    Encode.object",
      '        [ ( "uid", (Encode.string loginEvent.uid))',
      "        ]",
      "eventDecoder : Decode.Decoder (Event)",
      "eventDecoder =",
      '    Decode.field "type" Decode.string',
      "        |> Decode.andThen",
      "            (\\type_ ->",
      "                case type_ of",
      '                    "Login" -> loginEventDecoder |> Decode.andThen (Decode.succeed << Login)',
      '                    "Logout" -> Decode.succeed Logout',
      '                    _-> Decode.fail <| "Unknown type " ++ type_',
      "            )",
    ]);
  });
});

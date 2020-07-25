import {
  tsTypeAnn,
  elmTypeAnn,
  tsRecord,
  elmRecord,
  tsEnum,
  elmEnum,
  tsUnion,
  elmUnion,
  elmRecordDecoder,
  elmRecordEncoder,
  elmEnumEncoder,
  elmEnumDecoder,
  elmUnionDecoder,
} from "../src/generator";

import { expect } from "chai";

import "mocha";

function sw(str: string): string {
  return str
    .trim()
    .split("\n")
    .filter((f) => !!f.trim())
    .join("\n");
}

describe("Generator", () => {
  // it("Minimal", () => {
  //   const result = toArr(gen("ModuleName", {}, {}));
  //   expect(result).to.eql([]);
  // });

  it("can create TS types", () => {
    expect(tsTypeAnn("String")).to.eql("string");
    expect(tsTypeAnn("Int")).to.eql("number");
    expect(tsTypeAnn("Bool")).to.eql("boolean");
    expect(tsTypeAnn("()")).to.eql("null");
    expect(tsTypeAnn("Other")).to.eql("Other");

    expect(tsTypeAnn("List Foo")).to.eql("Foo[]");
    expect(tsTypeAnn("Dict Bar")).to.eql("{ [dynamic:string]: Bar }");
    expect(tsTypeAnn("Maybe Baz")).to.eql("Baz | null");

    expect(tsTypeAnn(" Other ")).to.eql("Other");
    expect(tsTypeAnn("List  String")).to.eql("string[]");

    expect(() => tsTypeAnn("Dict String String")).to.not.throw();

    // invalid
    expect(() => tsTypeAnn("Foo Bar")).to.throw();
  });

  it("can create Elm types", () => {
    expect(elmTypeAnn("String")).to.eql("String");
    expect(elmTypeAnn("Dict String String")).to.eql("Dict String String");
  });

  it("can create TS records", () => {
    expect(tsRecord("Foo", { bar: "List String", baz: "String" })).to.eql(
      `
export interface Foo {
  bar: string[];
  baz: string;
}

`.trim()
    );
  });

  it("can create Elm records", () => {
    expect(elmRecord("Foo", { bar: "List String", baz: "String" })).to.eql(
      `
type alias Foo =
    { bar: List String
    , baz: String
    }

`.trim()
    );
  });

  it("can create TS enums", () => {
    expect(tsEnum("Foo", ["Bar", "Baz"])).to.eql(
      `
export enum Foo {
  Bar = "Bar",
  Baz = "Baz",
}

  `.trim()
    );
  });

  it("can create Elm enums", () => {
    expect(elmEnum("Foo", ["Bar", "Baz"])).to.eql(
      `
type Foo
    = Bar
    | Baz

  `.trim()
    );
  });

  it("can create TS custom types", () => {
    expect(
      tsUnion("Foo", { Bar: { name: "String" }, Baz: { age: "Int" } })
    ).to.eql(
      `
export type Foo =
  | { type: "Bar"; name: string }
  | { type: "Baz"; age: number }

  `.trim()
    );
  });

  it("can create Elm custom types", () => {
    expect(
      elmUnion("Event", {
        Login: { user: "String" },
        Logout: { timestamp: "Int" },
      })
    ).to.eql(
      `
type alias LoginEvent =
    { user: String
    }

type alias LogoutEvent =
    { timestamp: Int
    }

type Event
    = Login LoginEvent
    | Logout LogoutEvent

  `.trim()
    );

    expect(
      elmUnion("Event", {
        Login: {},
      })
    ).to.eql(
      `
type Event
    = Login

  `.trim()
    );
  });

  it("can create Elm decoders", () => {
    expect(elmRecordDecoder("User", { name: "String" }).trim()).to.eql(
      `
userDecoder : Decode.Decoder User
userDecoder =
    Decode.map User
        (Decode.oneOf [ Decode.field "name" Decode.string ])
        `.trim()
    );
    expect(elmRecordDecoder("User", { name: "Maybe String" }).trim()).to.eql(
      `
userDecoder : Decode.Decoder User
userDecoder =
    Decode.map User
        (Decode.oneOf [ Decode.field "name" (Decode.maybe Decode.string), Decode.succeed Nothing ])
        `.trim()
    );
  });

  it("can create Elm encoders", () => {
    expect(elmRecordEncoder("User", { name: "String" }).trim()).to.eql(
      `
userEncoder : User -> Encode.Value
userEncoder user =
    Encode.object
        [ ( "name", (Encode.string user.name))
        ]
          `.trim()
    );
  });

  it("can create Elm enum encoders", () => {
    expect(elmEnumEncoder("Foo", ["Bar", "Baz"]).trim()).to.eql(
      `
fooEncoder : Foo -> Encode.Value
fooEncoder foo =
    case foo of
        Bar -> Encode.string "Bar"
        Baz -> Encode.string "Baz"
  `.trim()
    );
  });

  it("can create Elm enum decoders", () => {
    expect(elmEnumDecoder("Foo", ["Bar", "Baz"]).trim()).to.eql(
      `
fooDecoder : Decode.Decoder Foo
fooDecoder =
    Decode.string
        |> Decode.andThen
            (\\str ->
                case str of
                    "Bar" -> Decode.succeed Bar
                    "Baz" -> Decode.succeed Baz
                    unknown -> Decode.fail <| "Unknown Foo: " ++ unknown
            )

  `.trim()
    );
  });

  it("can create Elm custom decoders", () => {
    expect(
      sw(
        elmUnionDecoder("Event", {
          Login: { username: "String" },
          Logout: {},
        })
      )
    ).to.eql(
      sw(`
loginEventDecoder : Decode.Decoder LoginEvent
loginEventDecoder =
    Decode.map LoginEvent
        (Decode.oneOf [ Decode.field "username" Decode.string ])

loginEventEncoder : LoginEvent -> Encode.Value
loginEventEncoder loginEvent =
    Encode.object
        [ ( "username", (Encode.string loginEvent.username))
        ]

eventDecoder : Decode.Decoder (Event)
eventDecoder =
    Decode.field "type" Decode.string
        |> Decode.andThen
            (\\type_ ->
                case type_ of
                    "Login" -> loginEventDecoder |> Decode.andThen (Decode.succeed << Login)
                    "Logout" -> Decode.succeed Logout
                    _-> Decode.fail <| "Unknown type " ++ type_
            )
  `)
    );
  });
});

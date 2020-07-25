import gen from "../src/gen_ts";

import { expect } from "chai";

import "mocha";

function toArr(str: string): string[] {
  return str.split("\n").filter((line) => line.trim());
}

describe("TS types", () => {
  it("Interfaces", () => {
    const result = toArr(
      gen({
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
    expect(result).to.eql(["export interface User {", "  name: string;", "}"]);
  });

  it("Enums", () => {
    const result = toArr(
      gen({
        types: {
          enums: { Color: ["Red", "Green", "Blue"] },
          records: {},
          unions: {},
        },
      })
    );
    // console.log(result);
    expect(result).to.eql([
      "export enum Color {",
      '  Red = "Red",',
      '  Green = "Green",',
      '  Blue = "Blue",',
      "}",
    ]);
  });

  it("Unions", () => {
    const result = toArr(
      gen({
        types: {
          unions: { Event: { Login: { uid: "String" }, Logout: {} } },
          records: {},
          enums: {},
        },
      })
    );
    // console.log(result);
    expect(result).to.eql([
      'export type Event = { type: "Login"; uid: string } | { type: "Logout" };',
    ]);
  });
});

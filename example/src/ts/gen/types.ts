export interface Record {
  string: string;
  int: number;
  bool: boolean;
  listString: string[];
  dictInt: { [dynamic: string]: number };
  maybeBool: boolean | null;
  otherRecord: OtherRecord;
}
export interface OtherRecord {
  otherString: string;
}
export interface User {
  id: string;
  name: string;
}

export enum Color {
  Red = "Red",
  Green = "Green",
  Blue = "Blue",
  Yellow = "Yellow",
}

export type Event =
  | { type: "Login"; username: string; password: string }
  | { type: "Logout"; id: string; uid: string };

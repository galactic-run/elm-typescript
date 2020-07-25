import {
  elmRecord,
  elmRecordDecoder,
  elmRecordEncoder,
  elmEnum,
  elmEnumDecoder,
  elmEnumEncoder,
  elmUnion,
  elmUnionDecoder,
  Config,
} from "./generator";

export default function (
  moduleName: string,
  { types: { records = {}, enums = {}, unions = {} } }: Config
) {
  return `

module ${moduleName} exposing (..)

import Json.Decode as Decode
import Json.Encode as Encode
import Dict exposing (Dict)

${
  records
    ? Object.entries(records)
        .map(([name, fields]) => [
          elmRecord(name, fields),
          elmRecordDecoder(name, fields),
          elmRecordEncoder(name, fields),
        ])
        .reduce((acc, val) => acc.concat(val), [])
        .join("\n")
    : ""
}

${
  enums
    ? Object.entries(enums)
        .map(([name, variants]) => [
          elmEnum(name, variants),
          elmEnumEncoder(name, variants),
          elmEnumDecoder(name, variants),
        ])
        .reduce((acc, val) => acc.concat(val), [])
        .join("\n")
    : ""
}

${
  unions
    ? Object.entries(unions)
        .map(([name, variants]) => [
          elmUnion(name, variants),
          elmUnionDecoder(name, variants),
        ])
        .reduce((acc, val) => acc.concat(val), [])
        .join("\n")
    : ""
}

  `.trim();
}

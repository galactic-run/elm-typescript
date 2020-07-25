import * as prettier from "prettier";

import { tsRecord, tsEnum, tsUnion, Config } from "./generator";

export default function ({
  types: { records = {}, enums = {}, unions = {} },
}: Config) {
  const ts = `
${
  records
    ? Object.entries(records)
        .map(([name, fields]) => tsRecord(name, fields))
        .join("\n")
    : ""
}

${
  enums
    ? Object.entries(enums)
        .map(([name, variants]) => tsEnum(name, variants))
        .join("\n")
    : ""
}

${
  unions
    ? Object.entries(unions)
        .map(([name, variants]) => tsUnion(name, variants))
        .join("\n")
    : ""
}
`;
  return prettier.format(ts, { parser: "typescript" });
}

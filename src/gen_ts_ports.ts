import * as prettier from "prettier";

import { tsTypeAnn, tycoFromStr } from "./generator";

function typeToParam(type: string) {
  switch (type) {
    case "":
    case null:
      return "null";
    default:
      return "msg";
  }
}

function typesToImport(types: string[]): string[] {
  return Array.from(
    new Set(
      types
        .map((t) => {
          const tyCo = tycoFromStr(t);
          return tyCo.type === "Other" ? tyCo.tyCo : null;
        })
        .filter((t) => !!t)
    )
  );
}

export default function (
  fromElm: { [dynamic: string]: string } = {},
  toElm: { [dynamic: string]: string } = {}
) {
  const tti = typesToImport(
    [].concat(Object.values(toElm), Object.values(fromElm))
  );

  const ports_ts = `
  ${tti.length ? `import {${tti.join(",")}} from "./types";` : ""}

  interface FromElm {
    ${Object.entries(fromElm)
      .map(
        ([key, type]) =>
          `${key}: (msg: ${tsTypeAnn(type)}, toElm: ToElm) => void;`
      )
      .join("\n    ")}
  }

  interface ToElm {
    ${Object.entries(toElm)
      .map(([key, type]) => `${key}: (msg:${tsTypeAnn(type)}) => void;`)
      .join("\n")}
  }

  export interface ElmApp {
    ports: {
      ${Object.entries(toElm)
        .map(
          ([key, type]) =>
            `${key}Sub: { send: (msg: ${tsTypeAnn(type)}) => void };`
        )
        .join("\n")}
      ${Object.entries(fromElm)
        .map(
          ([key, type]) =>
            `${key}Port: { subscribe: (sub: (msg: ${tsTypeAnn(
              type
            )}) => void) => void };`
        )
        .join("\n")}
    };
  }

  export const init = (app: ElmApp${
    Object.keys(fromElm).length === 0 ? "" : ", fromElm: FromElm"
  }) : ToElm => {
    const toElm = {
      ${Object.entries(toElm)
        .map(
          ([key, type]) =>
            `${key}: (msg: ${tsTypeAnn(
              type
            )}) => app.ports.${key}Sub.send(${typeToParam(type)})`
        )
        .join(",\n")}
    };
    ${Object.entries(fromElm)
      .map(
        ([key, _]) =>
          `if (typeof app.ports.${key}Port !== 'undefined') { app.ports.${key}Port.subscribe(msg => fromElm.${key}(msg, toElm)); }`
      )
      .join("\n")}
    return toElm;
  };

  export default { init };
  `;

  return prettier.format(ports_ts, { parser: "typescript" });
}

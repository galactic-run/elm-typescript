import gen from "../src/gen_ts_ports";

import { expect } from "chai";

import "mocha";

describe("TS ports", () => {
  it("nothing", () => {
    expect(gen({}, {})).to.eq(
      `interface FromElm {}

interface ToElm {}

export interface ElmApp {
  ports: {};
}

export const init = (app: ElmApp): ToElm => {
  const toElm = {};

  return toElm;
};

export default { init };
`
    );
  });

  it("toElm", () => {
    expect(gen({}, { userAuthenticated: "User" })).to.eq(
      `import { User } from "./types";

interface FromElm {}

interface ToElm {
  userAuthenticated: (msg: User) => void;
}

export interface ElmApp {
  ports: {
    userAuthenticatedSub: { send: (msg: User) => void };
  };
}

export const init = (app: ElmApp): ToElm => {
  const toElm = {
    userAuthenticated: (msg: User) => app.ports.userAuthenticatedSub.send(msg),
  };

  return toElm;
};

export default { init };
`
    );
  });

  it("fromElm", () => {
    expect(gen({ loginClicked: "String" }, {})).to.eq(
      `interface FromElm {
  loginClicked: (msg: string, toElm: ToElm) => void;
}

interface ToElm {}

export interface ElmApp {
  ports: {
    loginClickedPort: { subscribe: (sub: (msg: string) => void) => void };
  };
}

export const init = (app: ElmApp, fromElm: FromElm): ToElm => {
  const toElm = {};
  if (typeof app.ports.loginClickedPort !== "undefined") {
    app.ports.loginClickedPort.subscribe((msg) =>
      fromElm.loginClicked(msg, toElm)
    );
  }
  return toElm;
};

export default { init };
`
    );
  });
});

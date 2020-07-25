import { User } from "./types";

interface FromElm {
  logout: (msg: null, toElm: ToElm) => void;
  userFromElm: (msg: User, toElm: ToElm) => void;
}

interface ToElm {
  userAuthenticated: (msg: User) => void;
  userToElm: (msg: User) => void;
}

export interface ElmApp {
  ports: {
    userAuthenticatedSub: { send: (msg: User) => void };
    userToElmSub: { send: (msg: User) => void };
    logoutPort: { subscribe: (sub: (msg: null) => void) => void };
    userFromElmPort: { subscribe: (sub: (msg: User) => void) => void };
  };
}

export const init = (app: ElmApp, fromElm: FromElm): ToElm => {
  const toElm = {
    userAuthenticated: (msg: User) => app.ports.userAuthenticatedSub.send(msg),
    userToElm: (msg: User) => app.ports.userToElmSub.send(msg),
  };
  if (typeof app.ports.logoutPort !== "undefined") {
    app.ports.logoutPort.subscribe((msg) => fromElm.logout(msg, toElm));
  }
  if (typeof app.ports.userFromElmPort !== "undefined") {
    app.ports.userFromElmPort.subscribe((msg) =>
      fromElm.userFromElm(msg, toElm)
    );
  }
  return toElm;
};

export default { init };

import { ElmApp } from '../../ts/gen/ports';

export namespace Elm {
  namespace Main {
    export function init(options?: { node?: HTMLElement | null; flags?: any }): ElmApp;
  }
}
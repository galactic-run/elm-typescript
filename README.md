# elm-typescript

Type safety from elm to typescript and back.

Caveat: This project is very alpha.

## Installation

`npm install elm-typescript`

## Usage

If you have an existing elm project simply run:

`npx elm-typescript init`

It assumes the paths `src/elm` and `src/ts` exists, and that `src/elm` is configured in `elm.json`. If this isn't the case you can modify the generated config `elm-typescript.json` with your paths.

To generate new types after you've modified the config: 

`npx elm-typescript`

Further down you'll find instructions how to set up a project from scratch with elm-typescript.


## Config

The config consist of two main parts. A types section and a ports section.

In the types section you can define records. enums and unions.

### Records

What you define in the records section is turned into Elm records, and TS interfaces. As an example, to represent an user, you would add something like:

```json
{
  "types": {
    "records": {
      "User": {
        "uid": "Int",
        "name": "String",
        "role": "Role"
      }
    }
  }
}
```

The field values can for now be one of `String`, `Int`, `Bool`, `Unit`, ‘List SomeType’, ‘Dict SomeType’ and any of the records, enums or unions you define yourself.

Dicts always use Strings for keys. I could have made the config require you to say Dict String SomeType but went for the shorter version.

### Enums

Enums are turned into Elm custom types and TS enums.

```json
{
  "types": {
    "enums": {
      "Role": [ "Admin", "Regular" ]
    }
  }
}
```

### Unions

Unions are turned into Elm custom types and TS union types.

The reason I added both enums and unions are that TS enums are nicer to use compared to TS union types.

I don’t think it makes sense to keep both the enums and unions sections. So my idea is to make them one, and when I can use TS enums I will, otherwise I’ll use TS union types.

Currently unions are defined like this:

```json
{
  "types": {
    "unions": {
      "Event": {
        "Login": {
          "uid": "Int",
          "timestamp": "Int"
        },
        "Logout": {
          "uid": "Int",
          "timestamp": "Int"
        },
        "Message": {
          "message": "String",
          "timestamp": "Int"
        }
      }
    }
  }
}
```

I think it was a mistake to use this anonymous record syntax, so my plan is to use the same syntax as record values:

```json
{
  "types": {
    "unions": {
      "Event": {
        "Login": "LoginEvent",
        "Logout": "LogoutEvent",
        "Message": "MessageEvent"
      }
    }
  }
}
```

And you’ll have to define the records yourself.

### Ports

In the ports section you define any incoming and outgoing messages:

```json
{
  "ports": {
    "toElm": {
      "userLoggedIn": "User",
      "eventsFetched": "List Event"
    },
    "fromElm": {
      "logout": "()"
    }
  }
}
```

## Codegen

The types are put in gen/types.ts and 'Gen/Types.elm. In Types.elm` there are also generated encoders and decoders. The only thing missing are encoders for union types. I’ve only used unions to send data to Elm so simply haven’t needed them. But should be easy enough to add.

The ports are put in gen/ports.ts and Gen/Ports.Elm.

### TS

To wire up the TS side of things you’ll do something like this:

```elm
import Ports from "./gen/ports";
import { User, Role } from "./gen/types";
import { Elm } from "../elm/Main";

const app = Elm.Main.init();

const ports = Ports.init(app, {
  logout: () => {
    // do something to logout the user
  },
});

// when user is logged in

const user: User = {
  uid: 42,
  name: "Smu",
  role: Role.Admin,
};

// the TS type signature enforces only valid `User` types as passed
ports.userLoggedIn(user);

// when events are fetched
// similarly, only a list of `Event` types are allowed
ports.eventsFetched([]);
```

Oh, I also generate a index.d.ts which is why the import { Elm } from "../elm/Main" bit works

### Elm

To wire up the Elm side of things you’d do something like:

```elm
import Gen.Ports as Ports

type Msg
    = UserLoggedIn User
    | EventsFetched (List Event)

subscriptions : Model -> Sub Msg
subscriptions _ =
    Ports.subscribe
        { userLoggedIn = UserLoggedIn
        , eventsFetched = EventsFetched
        }
```

Ports.elm also exposes functions for the outgoing ports ala logout : () -> Cmd msg.


## Setting up a elm project from scratch with elm-typescript

To test it out yourself follow these steps:

```bash
npm init -y
npm install elm 
npm install galactic-run/elm-typescript
mkdir src src/elm src/ts
```

Then we’ll need to init elm:

```
npx elm init
```

And install a dependency:

```
npx elm install elm/json
```

Then edit elm.json and update source-directories from src to src/elm.

Now to generate some code:

```
npx elm-typescript init
```

This will create an example config and generate a bunch of code. Have a look at the config in elm-typescript.json and the corresponding code in str/elm/Gen and src/ts/gen.

If you modify the config you simply run the codegen without the init option npx elm-typescript

If you use parcel bundler, which supports Elm and TS out of the box, you should be able to get going by adding a 'index.html, some TS to wire things up and a Main.elm.

I plan on adding a simplistic working example, and perhaps write some of this brain dump into a more structured blog post or something soon.


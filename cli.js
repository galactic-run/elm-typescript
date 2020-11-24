#!/usr/bin/env node

console.log(`elm-typescript ${process.env.npm_package_version || ""}`);

require("./dist/cli");

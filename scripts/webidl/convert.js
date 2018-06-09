/* eslint-disable no-console, no-process-exit */

"use strict";

const { resolve } = require("path");

const Webidl2js = require("webidl2js");

const transformer = new Webidl2js({
  implSuffix: "-impl",
  suppressErrors: true
});

function addDir(dir) {
  transformer.addSource(`idl/${dir}`, `imp/${dir}`);
}

addDir("abort-controller");
addDir("event-target");
addDir("events");
addDir("file");
addDir("form-data");
addDir("fetch");
addDir("navigator");
addDir("global");

const outputDir = resolve("./lib");

transformer.generate(outputDir).catch(err => {
  console.error(err);
  process.exit(1);
});

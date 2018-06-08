"use strict";
const { mixin } = require("../utils.js");

const { atob, btoa } = require("@platformparity/base64");

const fetch_PartialWindowOrWorkerGlobalScopeImpl = require("../fetch/WindowOrWorkerGlobalScope-impl.js")
  .implementation;

class WindowOrWorkerGlobalScopeImpl {
  get origin() {
    throw Error("not implemented");
  }
}

const setTimeout = global.setTimeout;
const clearTimeout = global.setTimeout;
const setInterval = global.setInterval;
const clearInterval = global.clearInterval;

// Attach methods directly to prototype
Object.assign(WindowOrWorkerGlobalScopeImpl.prototype, {
  atob,
  btoa,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval
});

mixin(
  WindowOrWorkerGlobalScopeImpl.prototype,
  fetch_PartialWindowOrWorkerGlobalScopeImpl.prototype
);

exports.implementation = WindowOrWorkerGlobalScopeImpl;

"use strict";
const { mixin } = require("../utils.js");

const { atob, btoa } = require("@platformparity/base64");

// FIXME: naming of partial interface mixins..
const fetch_PartialWindowOrWorkerGlobalScopeImpl = require("../fetch/WindowOrWorkerGlobalScope-impl.js")
  .implementation;

class WindowOrWorkerGlobalScopeImpl {
  get origin() {
    // TODO: is this right?
    return this.location.origin;
  }
}

const { setTimeout, clearTimeout, setInterval, clearInterval } = global;

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

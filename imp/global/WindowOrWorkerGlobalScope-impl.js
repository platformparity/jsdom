"use strict";
const { mixin } = require("../utils.js");

const { atob, btoa } = require("abab");

// FIXME: naming of partial interface mixins..
const FetchWindowOrWorkerGlobalScopeImpl = require("../fetch/WindowOrWorkerGlobalScope-impl.js")
  .implementation;

class WindowOrWorkerGlobalScopeImpl {
  get origin() {
    return this.location.origin;
  }

  atob(data) {
    const result = atob(data);
    if (result === null) {
      throw new DOMException(
        "The string to be decoded contains invalid characters.",
        "InvalidCharacterError"
      );
    }
    return result;
  }

  btoa(data) {
    const result = btoa(data);
    if (result === null) {
      throw new DOMException(
        "The string to be encoded contains invalid characters.",
        "InvalidCharacterError"
      );
    }
    return result;
  }
}

const { setTimeout, clearTimeout, setInterval, clearInterval } = global;

// Attach methods directly to prototype
Object.assign(WindowOrWorkerGlobalScopeImpl.prototype, {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval
});

mixin(
  WindowOrWorkerGlobalScopeImpl.prototype,
  FetchWindowOrWorkerGlobalScopeImpl.prototype
);

exports.implementation = WindowOrWorkerGlobalScopeImpl;

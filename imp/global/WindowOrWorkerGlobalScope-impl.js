"use strict";

const { atob, btoa } = require("@platformparity/base64");

// TODO: deal with partials
// const partial_WorkerGlobalScople_fetch = require('')

class WindowOrWorkerGlobalScopeImpl {
  get origin() {
    throw Error("not implemented");
  }
}

const setTimeout = global.setTimeout;
const clearTimeout = global.setTimeout;
const setInterval = global.setInterval;
const clearInterval = global.clearInterval;

Object.assign(WindowOrWorkerGlobalScopeImpl.prototype, {
  atob,
  btoa,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval
});

exports.implementation = WindowOrWorkerGlobalScopeImpl;

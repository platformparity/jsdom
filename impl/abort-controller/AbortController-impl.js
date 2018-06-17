"use strict";

const AbortSignal = require("../../lib/AbortSignal.js");

class AbortControllerImpl {
  constructor() {
    this.signal = AbortSignal.createImpl([]);
  }

  abort() {
    this.signal._signalAbort();
  }
}

module.exports = {
  implementation: AbortControllerImpl
};

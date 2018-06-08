"use strict";

class AbortControllerImpl {
  constructor(args, privateData) {
    // TODO: is this necessary?
    this.signal = privateData.AbortSignal.createImpl([]);
  }

  abort() {
    this.signal._signalAbort();
  }
}

module.exports = {
  implementation: AbortControllerImpl
};

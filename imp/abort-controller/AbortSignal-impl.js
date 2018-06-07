"use strict";

const { setupForSimpleEventAccessors } = require("../helpers/create-event-accessor.js");
const EventTargetImpl = require("../event-target/EventTarget-impl.js").implementation;

const Event = require("../../lib/Event.js");

class AbortSignalImpl extends EventTargetImpl {
  constructor(args, privateData) {
    super();

    // make event firing possible
    // this._ownerDocument = privateData.window.document;

    this.aborted = false;
    this.abortAlgorithms = new Set();
  }

  _signalAbort() {
    if (this.aborted) {
      return;
    }
    this.aborted = true;

    for (const algorithm of this.abortAlgorithms) {
      algorithm();
    }
    this.abortAlgorithms.clear();

    this._dispatch(Event.createImpl(
      [
        "abort",
        { bubbles: false, cancelable: false }
      ],
      { isTrusted: true }
    ));
  }

  _addAlgorithm(algorithm) {
    if (this.aborted) {
      return;
    }
    this.abortAlgorithms.add(algorithm);
  }

  _removeAlgorithm(algorithm) {
    this.abortAlgorithms.delete(algorithm);
  }
}

setupForSimpleEventAccessors(AbortSignalImpl.prototype, ["abort"]);

module.exports = {
  implementation: AbortSignalImpl
};

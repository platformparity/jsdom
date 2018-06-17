"use strict";

const EventImpl = require("./Event-impl.js").implementation;

const PromiseRejectionEventInit = require("../../lib/PromiseRejectionEventInit.js");

class PromiseRejectionEventImpl extends EventImpl {}
// FIXME: this causes an error when combined with `required` in the WebIDL
PromiseRejectionEventImpl.defaultInit = PromiseRejectionEventInit.convert(undefined);

module.exports = {
  implementation: PromiseRejectionEventImpl
};

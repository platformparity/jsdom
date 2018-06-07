"use strict";

const EventImpl = require("./Event-impl").implementation;

const ErrorEventInit = require("../../lib/ErrorEventInit");

class ErrorEventImpl extends EventImpl {

}
ErrorEventImpl.defaultInit = ErrorEventInit.convert(undefined);

module.exports = {
  implementation: ErrorEventImpl
};

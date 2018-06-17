"use strict";

// TODO: use `whatwg-encoding` instead
// const whatwgEncoding = require("whatwg-encoding");

const { TextEncoder } = require("text-encoding");

class TextEncoderImpl extends TextEncoder {
  constructor(args = []) {
    super(...args);
  }
}

exports.implementation = TextEncoderImpl;

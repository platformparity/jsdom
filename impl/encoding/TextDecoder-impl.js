"use strict";

// TODO: use `whatwg-encoding` instead
// const whatwgEncoding = require("whatwg-encoding");

const { TextDecoder } = require("text-encoding");

class TextDecoderImpl extends TextDecoder {
  constructor(args = []) {
    super(...args);
  }
}

exports.implementation = TextDecoderImpl;

"use strict";

const WorkerGlobalScope = require("./lib/WorkerGlobalScope.js");
const globalContext = WorkerGlobalScope.create([]);
require("./lib/bundle-entry.js").bootstrap("Worker", globalContext, {});

function getAllKeys(obj) {
  var props = [];

  do {
    props = props.concat(Reflect.ownKeys(obj));
  } while ((obj = Reflect.getPrototypeOf(obj)) && obj !== Object.prototype);

  return props;
}

// HACK
function bindFunctions(obj) {
  const keys = getAllKeys(obj);
  for (let i = 0; i < keys.length; ++i) {
    let x = obj[keys[i]];
    if (
      typeof x === "function" &&
      x.name[0] === String.prototype.toLowerCase.call(x.name[0]) // HACK
    ) {
      x = x.bind(obj);
      obj[keys[i]] = x;
    }
  }
  return obj;
}

module.exports = bindFunctions(globalContext);

// Patching a bunch of things manually..
const DOMException = require("domexception");
const { TextEncoder, TextDecoder } = require("text-encoding");

const Crypto = require("@trust/webcrypto/src/Crypto.js");
const SubtleCrypto = require("@trust/webcrypto/src/SubtleCrypto.js");
const CryptoKey = require("@trust/webcrypto/src/keys/CryptoKey.js");
const crypto = require("@trust/webcrypto");

const { URL, URLSearchParams } = require("url");

const {
  ReadableStream,
  WritableStream,
  TransformStream,
  ByteLengthQueuingStrategy,
  CountQueuingStrategy
} = require("@platformparity/streams");

Object.assign(module.exports, {
  DOMException,
  TextEncoder,
  TextDecoder,
  Crypto,
  SubtleCrypto,
  CryptoKey,
  crypto,
  URL,
  URLSearchParams,
  ReadableStream,
  WritableStream,
  TransformStream,
  ByteLengthQueuingStrategy,
  CountQueuingStrategy
});

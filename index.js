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
module.exports.DOMException = require("@platformparity/dom-exception").DOMException;
Object.assign(module.exports, require("@platformparity/web-cryptography"));

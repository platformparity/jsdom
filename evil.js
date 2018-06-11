const globalContext = require("./index.js");

// HACK
function getAllKeys(obj) {
  var props = [];

  do {
    props = props.concat(Reflect.ownKeys(obj));
  } while ((obj = Reflect.getPrototypeOf(obj)) && obj !== Object.prototype);

  return props;
}

function evilMixin(target, source) {
  const keys = getAllKeys(source);
  for (let i = 0; i < keys.length; ++i) {
    if (Reflect.has(target, keys[i])) continue;
    target[keys[i]] = source[keys[i]];
    // Reflect.defineProperty(target, keys[i], Reflect.getOwnPropertyDescriptor(source, keys[i]));
  }
}

// Use the first `toStrinTag` from `globalContext` instead:
delete global[Symbol.toStringTag];
// Will not be overwritten by our own `crypto` key otherwise:
delete global.crypto;
// to teh ting:
evilMixin(global, globalContext);

Object.setPrototypeOf(
  global,
  require("./lib/WorkerGlobalScope.js").interface.prototype
);

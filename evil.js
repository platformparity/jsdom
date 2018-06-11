var globalContext = require("./index.js");

//%%
function getAllKeys(obj) {
  var props = [];

  do {
    props = props.concat(Reflect.ownKeys(obj));
  } while ((obj = Reflect.getPrototypeOf(obj)) && obj !== Object.prototype);

  return props;
}

//%%
var keys = getAllKeys(globalContext);
keys;

//%%
function evilMixin(target, source, keys) {
  for (let i = 0; i < keys.length; ++i) {
    if (Reflect.has(target, keys[i])) {
      continue;
    }

    // HACK:...
    let x = source[keys[i]];
    if (
      typeof x === "function" &&
      x.name[0] === String.prototype.toLowerCase.call(x.name[0]) // HACK
    ) {
      x = x.bind(target);
    }

    target[keys[i]] = x;
    // Reflect.defineProperty(target, keys[i], Reflect.getOwnPropertyDescriptor(source, keys[i]));
  }
}

//%%

delete global[Symbol.toStringTag];
evilMixin(global, globalContext, keys);

//%%
Object.setPrototypeOf(
  global,
  require("./lib/WorkerGlobalScope.js").interface.prototype
);

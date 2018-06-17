"use strict";
const Headers = require("../../lib/Headers.js");

const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

const MAP = Symbol("map");

// TODO: guards? immutable?

class HeadersImpl {
  constructor([init]) {
    this[MAP] = Object.create(null);

    if (init == null) {
      // no op
      // TODO: needed?
    } else if (typeof init === "object") {
      const method = init[Symbol.iterator];
      if (method != null) {
        // sequence<sequence<ByteString>>
        for (const pair of init) {
          // NOTE: WebIDL doesn't support tuples, so we have to check the length manually
          if (pair.length !== 2) {
            throw new TypeError("Failed to construct 'Headers': Invalid value");
          }
          this.append(pair[0], pair[1]);
        }
      } else {
        // record<ByteString, ByteString>
        for (const key of Object.keys(init)) {
          const value = init[key];
          this.append(key, value);
        }
      }
    }
  }

  /**
   * Return combined header value given name
   *
   * @param   String  name  Header name
   * @return  Mixed
   */
  get(name) {
    const key = this.constructor.find(this[MAP], name);
    if (key === undefined) {
      return null;
    }

    return this[MAP][key].join(", ");
  }

  /**
   * Overwrite header values given name
   *
   * @param   String  name   Header name
   * @param   String  value  Header value
   * @return  Void
   */
  set(name, value) {
    const key = this.constructor.find(this[MAP], name);
    this[MAP][key !== undefined ? key : name] = [value];
  }

  /**
   * Append a value onto existing header
   *
   * @param   String  name   Header name
   * @param   String  value  Header value
   * @return  Void
   */
  append(name, value) {
    const key = this.constructor.find(this[MAP], name);
    if (key !== undefined) {
      this[MAP][key].push(value);
    } else {
      this[MAP][name] = [value];
    }
  }

  /**
   * Check for header name existence
   *
   * @param   String   name  Header name
   * @return  Boolean
   */
  has(name) {
    return this.constructor.find(this[MAP], name) !== undefined;
  }

  /**
   * Delete all header values given name
   *
   * @param   String  name  Header name
   * @return  Void
   */
  delete(name) {
    const key = this.constructor.find(this[MAP], name);
    if (key !== undefined) {
      delete this[MAP][key];
    }
  }

  *[Symbol.iterator]() {
    const keys = Object.keys(this[MAP]).sort();
    for (const k of keys) {
      yield [k.toLowerCase(), this[MAP][k].join(", ")];
    }
  }

  // PRIVATE METHODS
  // ---------------

  /**
   * Find the key in the map object given a header name.
   *
   * Returns undefined if not found.
   *
   * @param   String  name  Header name
   * @return  String|Undefined
   */
  static find(map, name) {
    name = name.toLowerCase();
    for (const key in map) {
      if (key.toLowerCase() === name) {
        return key;
      }
    }
    return undefined;
  }

  /**
   * Export the Headers object in a form that Node.js can consume.
   *
   * @return  Object
   */
  exportNodeCompatibleHeaders() {
    const obj = Object.assign({ __proto__: null }, this[MAP]);

    // http.request() only supports string as Host header. This hack makes
    // specifying custom Host header possible.
    const hostHeaderKey = this.constructor.find(this[MAP], "Host");
    if (hostHeaderKey !== undefined) {
      obj[hostHeaderKey] = obj[hostHeaderKey][0];
    }

    return obj;
  }

  /**
   * Create a Headers object from an object of headers, ignoring those that do
   * not conform to HTTP grammar productions.
   *
   * @param   Object  obj  Object of headers
   * @return  Headers
   */
  static createHeadersLenient(obj) {
    const headers = Headers.createImpl([]);

    for (const name of Object.keys(obj)) {
      if (invalidTokenRegex.test(name)) {
        continue;
      }
      if (Array.isArray(obj[name])) {
        for (const val of obj[name]) {
          if (invalidHeaderCharRegex.test(val)) {
            continue;
          }
          if (headers[MAP][name] === undefined) {
            headers[MAP][name] = [val];
          } else {
            headers[MAP][name].push(val);
          }
        }
      } else if (!invalidHeaderCharRegex.test(obj[name])) {
        headers[MAP][name] = [obj[name]];
      }
    }
    return headers;
  }
}

module.exports.implementation = HeadersImpl;

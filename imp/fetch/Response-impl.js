"use strict";
const { mixin } = require("../utils.js");
const { implementation: BodyImpl, clone } = require("./Body-impl.js");

const Headers = require("../../lib/Headers.js");
const Response = require("../../lib/Response.js");

const { STATUS_CODES } = require("http");

const INTERNALS = Symbol("Response internals");

class ResponseImpl {
  constructor(args) {
    this.bodyConstructor(args);

    const [body, init] = args;

    const status = init.status || 200;

    this[INTERNALS] = {
      url: init.url || "",
      status,
      statusText: init.statusText || STATUS_CODES[status],
      headers: Headers.createImpl([init.headers])
    };
  }

  get url() {
    return this[INTERNALS].url;
  }

  get status() {
    return this[INTERNALS].status;
  }

  get ok() {
    return this[INTERNALS].status >= 200 && this[INTERNALS].status < 300;
  }

  get statusText() {
    return this[INTERNALS].statusText;
  }

  get headers() {
    return this[INTERNALS].headers;
  }

  clone() {
    const res = Response.createImpl([
      this.cloneBody(),
      {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      }
    ]);

    res[INTERNALS].url = this.url;

    return res;
  }
}

mixin(ResponseImpl.prototype, BodyImpl.prototype);

exports.implementation = ResponseImpl;

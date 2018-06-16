"use strict";
const { mixin } = require("../utils.js");

const BodyImpl = require("./Body-impl.js").implementation;

const Headers = require("../../lib/Headers.js");
const Response = require("../../lib/Response.js");

const { STATUS_CODES } = require("http");

const INTERNALS = Symbol("Response internals");

class ResponseImpl {
  constructor([body, init]) {
    const headers = Headers.createImpl([init.headers]);

    this.initBody(body, headers);

    const url = init.url || "";
    const status = init.status || 200;
    const statusText = init.statusText || STATUS_CODES[status];

    this[INTERNALS] = { url, status, statusText, headers };
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
    const { url, status, statusText, headers } = this;
    const that = Response.createImpl([
      null,
      { url, status, statusText, headers }
    ]);
    this.cloneBodyTo(that);
    return that;
  }
}

mixin(ResponseImpl.prototype, BodyImpl.prototype);

exports.implementation = ResponseImpl;

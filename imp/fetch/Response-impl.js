"use strict";
const { mixin } = require("../utils.js");

const BodyImpl = require("./Body-impl.js").implementation;

const Headers = require("../../lib/Headers.js");
const Response = require("../../lib/Response.js");

const { STATUS_CODES } = require("http");

const INTERNALS = Symbol("Response internals");

class ResponseImpl {
  constructor([body, init]) {
    // FIXME: side effects in "constructor"
    const contentType = this.initBody(body);

    const status = init.status || 200;

    const headers = Headers.createImpl([init.headers]);
    if (body != null) {
      if (contentType !== null && !headers.has("Content-Type")) {
        headers.append("Content-Type", contentType);
      }
    }

    this[INTERNALS] = {
      url: init.url || "",
      status,
      statusText: init.statusText || STATUS_CODES[status],
      headers
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
        url: this.url,
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      }
    ]);

    return res;
  }
}

mixin(ResponseImpl.prototype, BodyImpl.prototype);

exports.implementation = ResponseImpl;

"use strict";
const { mixin } = require("../utils.js");

const BodyImpl = require("./Body-impl.js").implementation;

const Headers = require("../../lib/Headers.js");
const Response = require("../../lib/Response.js");

const { STATUS_CODES } = require("http");

const { format: formatURL, parse: parseURL } = require("url");

const INTERNALS = Symbol("Response internals");

class ResponseImpl {
  constructor([body, init]) {
    if (!this.isValidStatus(init.status)) {
      throw new RangeError("Status must be between 200 and 599");
    }

    const headers = Headers.createImpl([init.headers]);

    this.initBody(body, headers);

    const url = init.url || "";
    const status = init.status || 200;
    const statusText = init.statusText || STATUS_CODES[status];

    if (body != null && this.isNullBodyStatus(init.status)) {
      throw new TypeError("Response cannot have a body with the given status");
    }

    this[INTERNALS] = { url, status, statusText, headers };
  }

  static error() {}

  static redirect(url, status) {
    // TODO: "current settings object’s API base URL"?
    const parsedURL = parseURL(url);
    if (parsedURL.auth) {
      throw new TypeError("URL is not valid or contains user credentials");
    }

    if (!this.isRedirectStatus(status)) {
      throw new RangeError("Status must be a redirect status");
    }

    const headers = Headers.createImpl([[["Location", formatURL(parsedURL)]]]);

    return Response.createImpl([null, { url, status, headers }]);
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

  // PRIVATE METHDOS

  isValidStatus(code) {
    return code >= 200 && code < 600;
  }

  static isRedirectStatus(code) {
    return (
      code === 301 ||
      code === 302 ||
      code === 303 ||
      code === 307 ||
      code === 308
    );
  }

  isNullBodyStatus(code) {
    return code === 101 || code === 204 || code === 205 || code === 304;
  }
}

mixin(ResponseImpl.prototype, BodyImpl.prototype);

exports.implementation = ResponseImpl;

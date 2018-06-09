"use strict";
const { mixin } = require("../utils.js");

// const HeadersImpl = require("./HeadersImpl-impl.js").implementation;
const BodyImpl = require("./Body-impl.js").implementation;

const Headers = require("../../lib/Headers.js");
const Request = require("../../lib/Request.js");

const AbortController = require("../../lib/AbortController.js");

const { format: formatURL, parse: parseURL } = require("url");

const INTERNALS = Symbol("Request internals");

class RequestImpl {
  constructor([input, init = {}]) {
    const parsedURL = parseURL(input.url || input);

    const signal =
      init.signal || (input[INTERNALS] && input[INTERNALS].signal) || null;

    const method = (init.method || input.method || "GET").toUpperCase();

    if (
      (init.body != null || (Request.isImpl(input) && input.body !== null)) &&
      (method === "GET" || method === "HEAD")
    ) {
      throw new TypeError(" Request with GET/HEAD method cannot have body.");
    }

    // FIXME: does this make sense? spec?
    const inputBody =
      init.body != null
        ? init.body
        : Request.isImpl(input) && input.body !== null
          ? input.cloneBody()
          : null;

    this.bodyConstructor([
      inputBody,
      {
        nodeTimeout: init.nodeTimeout || input.nodeTimeout || 0,
        nodeMaxChunkSize: init.nodeMaxChunkSize || input.nodeMaxChunkSize || 0
      }
    ]);

    const headers = Headers.createImpl([init.headers || input.headers || {}]);

    if (init.body != null) {
      const contentType = this.extractContentType();
      if (contentType !== null && !headers.has("Content-Type")) {
        headers.append("Content-Type", contentType);
      }
    }

    const abortController = AbortController.createImpl([]);
    if (signal) {
      if (signal.aborted) {
        abortController.abort();
      } else {
        signal.addEventListener("abort", () => abortController.abort());
      }
    }

    this[INTERNALS] = {
      method,
      redirect: init.redirect || input.redirect || "follow",
      headers,
      parsedURL,
      signal: abortController.signal
    };

    // node-fetch-only options
    // FIXME: Is this needed? Just use defaults?
    //        Maybe use "prefixed" values, like `nodeFollow`, `nodeCompress`, etc.,
    //        so that it is clear that these aren't available/have no effect in the browser
    this.follow =
      init.follow !== undefined
        ? init.follow
        : input.follow !== undefined
          ? input.follow
          : 20;

    this.compress =
      init.compress !== undefined
        ? init.compress
        : input.compress !== undefined
          ? input.compress
          : true;

    this.counter = init.counter || input.counter || 0;

    this.agent = init.agent || input.agent;
  }

  get method() {
    return this[INTERNALS].method;
  }

  get url() {
    return formatURL(this[INTERNALS].parsedURL);
  }

  get headers() {
    return this[INTERNALS].headers;
  }

  get redirect() {
    return this[INTERNALS].redirect;
  }

  // TODO: something reasonable that can be done with these?
  // get destination() {}
  // get referrer() {}
  // get referrerPolicy() {}
  // get mode() {}
  // get credentials() {}
  // get cache() {}
  // get redirect() {} // Already implemented (see above)
  // get integrity() {}
  // get keepalive() {}
  // get isReloadNavigation() {}
  // get isHistoryNavigation() {}

  get signal() {
    return this[INTERNALS].signal;
  }

  clone() {
    return Request.createImpl([this]);
  }

  // PRIVATE METHODS
  // ---------------

  /**
   * Convert a Request to Node.js http request options.
   *
   * @param   Request  A Request instance
   * @return  Object   The options object to be passed to http.request
   */
  getNodeRequestOptions() {
    const parsedURL = this[INTERNALS].parsedURL;
    const headers = Headers.createImpl([this[INTERNALS].headers]);

    // fetch step 1.3
    if (!headers.has("Accept")) {
      headers.set("Accept", "*/*");
    }

    // Basic fetch
    if (!parsedURL.protocol || !parsedURL.hostname) {
      throw new TypeError("Only absolute URLs are supported");
    }

    if (!/^https?:$/.test(parsedURL.protocol)) {
      throw new TypeError("Only HTTP(S) protocols are supported");
    }

    // HTTP-network-or-cache fetch steps 2.4-2.7
    let contentLengthValue = null;
    if (this.body == null && /^(POST|PUT)$/i.test(this.method)) {
      contentLengthValue = "0";
    }
    if (this.body != null) {
      const totalBytes = this.getTotalBytes();
      if (typeof totalBytes === "number") {
        contentLengthValue = String(totalBytes);
      }
    }
    if (contentLengthValue) {
      headers.set("Content-Length", contentLengthValue);
    }

    // HTTP-network-or-cache fetch step 2.11
    if (!headers.has("User-Agent")) {
      headers.set(
        "User-Agent",
        (navigator && navigator.userAgent) || "platformparity-fetch/1.0 (https://github.com/platformparity/fetch)"
      );
    }

    // HTTP-network-or-cache fetch step 2.15
    if (this.compress) {
      headers.set("Accept-Encoding", "gzip,deflate");
    }
    if (!headers.has("Connection") && !this.agent) {
      headers.set("Connection", "close");
    }

    // HTTP-network fetch step 4.2
    // chunked encoding is handled by Node.js

    return Object.assign({}, parsedURL, {
      method: this.method,
      headers: headers.exportNodeCompatibleHeaders(),
      agent: this.agent
    });
  }
}

mixin(RequestImpl.prototype, BodyImpl.prototype);

exports.implementation = RequestImpl;

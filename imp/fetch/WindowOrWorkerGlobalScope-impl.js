"use strict";

const idlUtils = require("../../lib/utils.js");

const Headers = require("../../lib/Headers.js");
const Request = require("../../lib/Request.js");
const Response = require("../../lib/Response.js");

const HeadersImpl = require("./Headers-impl.js").implementation;

const http = require("http");
const https = require("https");
const { PassThrough } = require("stream");
const { resolve: resolveURL } = require("url");
const zlib = require("zlib");

class PartialWindowOrWorkerGlobalScopeImpl {
  fetch(input, init) {
    // wrap http.request into fetch
    return new Promise((resolve, reject) => {
      // build request object
      const request = Request.createImpl([input, init]);

      const { signal } = request;
      if (signal.aborted) {
        // TODO: is this a legit (spec'd) error?
        reject(
          new Error(`Fetch to ${request.url} has been aborted`, "aborted")
        );
        return;
      }

      const options = request.getNodeRequestOptions();

      const send = (options.protocol === "https:" ? https : http).request;

      // send request
      const req = send(options);
      let reqTimeout;
      let body;

      function abortCallback() {
        const error = new Error(
          `Fetch to ${request.url} has been aborted`,
          "aborted"
        );
        reject(error);
        if (body !== undefined) {
          body.emit("error", error);
        }
        finalize();
      }
      signal.addEventListener("abort", abortCallback);

      function finalize() {
        req.abort();
        clearTimeout(reqTimeout);
        signal.removeEventListener("abort", abortCallback);
      }

      if (request.timeout) {
        req.once("socket", socket => {
          reqTimeout = setTimeout(() => {
            reject(
              new Error(`network timeout at: ${request.url}`, "request-timeout")
            );
            finalize();
          }, request.timeout);
        });
      }

      function errorHandler(err) {
        reject(
          new Error(
            `request to ${request.url} failed, reason: ${err.message}`,
            "system",
            err
          )
        );
        if (body !== undefined) {
          body.emit("error", err);
        }
        finalize();
      }

      req.on("error", errorHandler);

      req.once("response", res => {
        clearTimeout(reqTimeout);

        const headers = HeadersImpl.createHeadersLenient(res.headers);

        // HTTP fetch step 5
        if (this.constructor.isRedirect(res.statusCode)) {
          // HTTP fetch step 5.2
          const location = headers.get("Location");

          // HTTP fetch step 5.3
          const locationURL =
            location === null ? null : resolveURL(request.url, location);

          // HTTP fetch step 5.5
          switch (request.redirect) {
            case "error":
              reject(
                new Error(
                  `redirect mode is set to error: ${request.url}`,
                  "no-redirect"
                )
              );
              finalize();
              return;
            case "manual":
              // node-fetch-specific step: make manual redirect a bit easier to use by setting the Location header value to the resolved URL.
              if (locationURL !== null) {
                headers.set("Location", locationURL);
              }
              break;
            case "follow":
              // HTTP-redirect fetch step 2
              if (locationURL === null) {
                break;
              }

              // HTTP-redirect fetch step 5
              if (request.counter >= request.follow) {
                reject(
                  new Error(
                    `maximum redirect reached at: ${request.url}`,
                    "max-redirect"
                  )
                );
                finalize();
                return;
              }

              // HTTP-redirect fetch step 6 (counter increment)
              // Create a new Request object.
              const requestOpts = {
                headers: Headers.createImpl([request.headers]),
                follow: request.follow,
                counter: request.counter + 1,
                agent: request.agent,
                compress: request.compress,
                method: request.method,
                body: request.body
              };

              // HTTP-redirect fetch step 9
              if (
                res.statusCode !== 303 &&
                request.body &&
                request.getTotalBytes() === null
              ) {
                reject(
                  new Error(
                    "Cannot follow redirect with body being a readable stream",
                    "unsupported-redirect"
                  )
                );
                finalize();
                return;
              }

              // HTTP-redirect fetch step 11
              if (
                res.statusCode === 303 ||
                ((res.statusCode === 301 || res.statusCode === 302) &&
                  request.method === "POST")
              ) {
                requestOpts.method = "GET";
                requestOpts.body = undefined;
                requestOpts.headers.delete("content-length");
              }

              // HTTP-redirect fetch step 15
              resolve(fetch(Request.createImpl([locationURL, requestOpts])));
              finalize();
              return;
          }
        }

        // prepare response
        res.on("error", errorHandler);
        body = res.pipe(new PassThrough());
        const responseOptions = {
          url: request.url,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers
          // size: request.size,
          // timeout: request.timeout
        };

        // HTTP-network fetch step 12.1.1.3
        const codings = headers.get("Content-Encoding");

        // HTTP-network fetch step 12.1.1.4: handle content codings

        // in following scenarios we ignore compression support
        // 1. compression support is disabled
        // 2. HEAD request
        // 3. no Content-Encoding header
        // 4. no content response (204)
        // 5. content not modified response (304)
        if (
          !request.compress ||
          request.method === "HEAD" ||
          codings === null ||
          res.statusCode === 204 ||
          res.statusCode === 304
        ) {
          resolve(Response.create([body, responseOptions]));
          return;
        }

        // For Node v6+
        // Be less strict when decoding compressed responses, since sometimes
        // servers send slightly invalid responses that are still accepted
        // by common browsers.
        // Always using Z_SYNC_FLUSH is what cURL does.
        const zlibOptions = {
          flush: zlib.Z_SYNC_FLUSH,
          finishFlush: zlib.Z_SYNC_FLUSH
        };

        // for gzip
        if (codings == "gzip" || codings == "x-gzip") {
          body = body.pipe(zlib.createGunzip(zlibOptions));
          resolve(Response.create([body, responseOptions]));
          return;
        }

        // for deflate
        if (codings == "deflate" || codings == "x-deflate") {
          // handle the infamous raw deflate response from old servers
          // a hack for old IIS and Apache servers
          const raw = res.pipe(new PassThrough());
          raw.once("data", chunk => {
            // see http://stackoverflow.com/questions/37519828
            if ((chunk[0] & 0x0f) === 0x08) {
              body = body.pipe(zlib.createInflate());
            } else {
              body = body.pipe(zlib.createInflateRaw());
            }
            resolve(Response.create([body, responseOptions]));
          });
          return;
        }

        // otherwise, use response as-is
        resolve(Response.create([body, responseOptions]));
      });

      request.writeToStream(req);
    });
  }

  // PRIVATE METHODS
  // ---------------

  static isRedirect(code) {
    return (
      code === 301 ||
      code === 302 ||
      code === 303 ||
      code === 307 ||
      code === 308
    );
  }
}

exports.implementation = PartialWindowOrWorkerGlobalScopeImpl;

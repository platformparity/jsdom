"use strict";
const Blob = require("../../lib/Blob.js");
const FormData = require("../../lib/FormData.js");

const Stream = require("stream");
const { PassThrough } = Stream;

const convert = require("encoding").convert;

const INTERNALS = Symbol("Body internals");

class BodyImpl {
  get body() {
    // TODO: ensure that it is of type readablestream...
    return this[INTERNALS].body;
  }

  get bodyUsed() {
    return this[INTERNALS].disturbed;
  }

  arrayBuffer() {
    return this.consumeBody().then(buf =>
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    );
  }

  blob() {
    let ct = (this.headers && this.headers.get("content-type")) || "";
    return this.consumeBody().then(buf =>
      Blob.create([[buf], { type: ct.toLowerCase() }])
    );
  }

  formData() {
    throw new Error("not implemented");
  }

  json() {
    return this.consumeBody().then(buffer => {
      return JSON.parse(buffer.toString());
    });
  }

  text() {
    return this.consumeBody().then(buffer => buffer.toString());
  }

  // PRIVATE METHODS
  // ---------------

  bodyConstructor([body, { nodeTimeout = 0, nodeMaxChunkSize = 0 } = {}]) {
    // TODO: necessary?
    if (
      !(
        body == null ||
        typeof body === "string" ||
        isURLSearchParams(body) ||
        Blob.isImpl(body) ||
        Buffer.isBuffer(body) ||
        body instanceof ArrayBuffer ||
        ArrayBuffer.isView(body) ||
        body instanceof Stream
      )
    ) {
      // none of the above
      // coerce to string
      body = String(body);
    }

    this[INTERNALS] = {
      body,
      disturbed: false,
      error: null,
      rejectCurrentPromise: undefined
    };

    this.nodeMaxChunkSize = size;
    this.nodeTimeout = timeout;

    if (body instanceof Stream) {
      // handle stream error, such as incorrect content-encoding
      body.on("error", err => {
        let error;
        if (err instanceof Error) {
          error = err;
        } else {
          error = new Error(
            `Invalid response body while trying to fetch ${this.url}: ${
              err.message
            }`,
            "system",
            err
          );
        }
        const { rejectCurrentPromise } = this[INTERNALS];
        if (typeof rejectCurrentPromise === "function") {
          rejectCurrentPromise(error);
        } else {
          this[INTERNALS].error = error;
        }
      });
    }
  }

  /**
   * Consume and convert an entire Body to a Buffer.
   *
   * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
   *
   * @return  Promise
   */
  consumeBody() {
    if (this[INTERNALS].disturbed) {
      return Promise.reject(new TypeError(`body stream already read`));
    }

    this[INTERNALS].disturbed = true;

    if (this[INTERNALS].error) {
      return Promise.reject(this[INTERNALS].error);
    }

    // body is null
    if (this.body === null) {
      return Promise.resolve(Buffer.alloc(0));
    }

    // body is string
    if (typeof this.body === "string") {
      return Promise.resolve(Buffer.from(this.body));
    }

    // body is blob
    if (Blob.isImpl(this.body)) {
      return Promise.resolve(this.body._buffer);
    }

    // body is buffer
    if (Buffer.isBuffer(this.body)) {
      return Promise.resolve(this.body);
    }

    // body is ArrayBuffer
    if (this.body instanceof ArrayBuffer) {
      return Promise.resolve(Buffer.from(this.body));
    }

    // istanbul ignore if: should never happen
    if (!(this.body instanceof Stream)) {
      return Promise.resolve(Buffer.alloc(0));
    }

    // body is stream
    // get ready to actually consume the body
    let accum = [];
    let accumBytes = 0;
    let abort = false;

    return new Promise((resolve, reject) => {
      let resTimeout;

      // allow timeout on slow response body
      if (this.nodeTimeout) {
        resTimeout = setTimeout(() => {
          abort = true;
          reject(
            new Error(
              `Response timeout while trying to fetch ${this.url} (over ${
                this.nodeTimeout
              }ms)`,
              "body-timeout"
            )
          );
        }, this.nodeTimeout);
      }

      this[INTERNALS].rejectCurrentPromise = reject;

      this.body.on("data", chunk => {
        if (abort || chunk === null) {
          return;
        }

        if (
          this.nodeMaxChunkSize &&
          accumBytes + chunk.length > this.nodeMaxChunkSize
        ) {
          abort = true;
          reject(
            new Error(
              `content size at ${this.url} over limit: ${
                this.nodeMaxChunkSize
              }`,
              "max-size"
            )
          );
          return;
        }

        accumBytes += chunk.length;
        accum.push(chunk);
      });

      this.body.once("end", () => {
        if (abort) {
          return;
        }

        clearTimeout(resTimeout);

        try {
          resolve(Buffer.concat(accum));
        } catch (err) {
          // handle streams that have accumulated too much data (issue #414)
          reject(
            new Error(
              `Could not create Buffer from response body for ${this.url}: ${
                err.message
              }`,
              "system",
              err
            )
          );
        }
      });
    });
  }

  /**
   * Detect buffer encoding and convert to target encoding
   * ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
   *
   * @param   Buffer  buffer    Incoming buffer
   * @return  String
   */
  convertBody(buffer) {
    const ct = this.headers.get("content-type");
    let charset = "utf-8";
    let res, str;

    // header
    if (ct) {
      res = /charset=([^;]*)/i.exec(ct);
    }

    // no charset in content type, peek at response body for at most 1024 bytes
    str = buffer.slice(0, 1024).toString();

    // html5
    if (!res && str) {
      res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
    }

    // html4
    if (!res && str) {
      res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(
        str
      );

      if (res) {
        res = /charset=(.*)/i.exec(res.pop());
      }
    }

    // xml
    if (!res && str) {
      res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
    }

    // found charset
    if (res) {
      charset = res.pop();

      // prevent decode issues when sites use incorrect encoding
      // ref: https://hsivonen.fi/encoding-menu/
      if (charset === "gb2312" || charset === "gbk") {
        charset = "gb18030";
      }
    }

    // turn raw buffers into a single utf-8 buffer
    return convert(buffer, "UTF-8", charset).toString();
  }

  /**
   * Clone body given Res/Req instance
   *
   * @param   Mixed  instance  Response or Request instance
   * @return  Mixed
   */
  cloneBody() {
    const { body, bodyUsed } = this;

    // don't allow cloning a used body
    if (bodyUsed) {
      throw new Error("cannot clone body after it is used");
    }

    // check that body is a stream and not form-data object
    // FIXME: we can't clone the form-data object without having it as a dependency
    if (body instanceof Stream && typeof body.getBoundary !== "function") {
      // tee instance body
      const p1 = new PassThrough();
      const p2 = new PassThrough();
      body.pipe(p1);
      body.pipe(p2);
      // set instance body to teed body and return the other teed body
      this[INTERNALS].body = p1;
      return p2;
    }

    return body;
  }

  /**
   * Performs the operation "extract a `Content-Type` value from |object|" as
   * specified in the specification:
   * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
   *
   * This function assumes that body is present.
   */
  extractContentType() {
    const { body } = this;

    // istanbul ignore if: Currently, because of a guard in Request, body
    // can never be null. Included here for completeness.
    if (body === null) {
      // body is null
      return null;
    } else if (typeof body === "string") {
      // body is string
      return "text/plain;charset=UTF-8";
    } else if (isURLSearchParams(body)) {
      // body is a URLSearchParams
      return "application/x-www-form-urlencoded;charset=UTF-8";
    } else if (Blob.isImpl(body)) {
      // body is blob
      return body.type || null;
    } else if (Buffer.isBuffer(body)) {
      // body is buffer
      return null;
    } else if (body instanceof ArrayBuffer) {
      // body is ArrayBuffer
      return null;
    } else if (ArrayBuffer.isView(body)) {
      // body is ArrayBufferView
      return null;
    } else if (typeof body.getBoundary === "function") {
      // detect form data input from form-data module
      return `multipart/form-data;boundary=${body.getBoundary()}`;
    } else {
      // body is stream
      // can't really do much about this
      return null;
    }
  }

  /**
   * The Fetch Standard treats this as if "total bytes" is a property on the body.
   * For us, we have to explicitly get it with a function.
   *
   * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
   *
   * @return  Number?            Number of bytes, or null if not possible
   */
  getTotalBytes() {
    const { body } = this;

    // istanbul ignore if: included for completion
    if (body === null) {
      // body is null
      return 0;
    } else if (typeof body === "string") {
      // body is string
      return Buffer.byteLength(body);
    } else if (isURLSearchParams(body)) {
      // body is URLSearchParams
      return Buffer.byteLength(String(body));
    } else if (Blob.isImpl(body)) {
      // body is blob
      return body.size;
    } else if (Buffer.isBuffer(body)) {
      // body is buffer
      return body.length;
    } else if (body instanceof ArrayBuffer) {
      // body is ArrayBuffer
      return body.byteLength;
    } else if (ArrayBuffer.isView(body)) {
      // body is ArrayBufferView
      return body.byteLength;
    } else if (body && typeof body.getLengthSync === "function") {
      // detect form data input from form-data module
      if (
        (body._lengthRetrievers && body._lengthRetrievers.length == 0) || // 1.x
        (body.hasKnownLength && body.hasKnownLength())
      ) {
        // 2.x
        return body.getLengthSync();
      }
      return null;
    } else {
      // body is stream
      // can't really do much about this
      return null;
    }
  }

  /**
   * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
   */
  writeToStream(dest) {
    const { body } = this;

    if (body === null) {
      // body is null
      dest.end();
    } else if (typeof body === "string") {
      // body is string
      dest.write(body);
      dest.end();
    } else if (isURLSearchParams(body)) {
      // body is URLSearchParams
      dest.write(Buffer.from(String(body)));
      dest.end();
    } else if (Blob.isImpl(body)) {
      // body is blob
      dest.write(body._buffer);
      dest.end();
    } else if (Buffer.isBuffer(body)) {
      // body is buffer
      dest.write(body);
      dest.end();
    } else if (body instanceof ArrayBuffer) {
      // body is ArrayBuffer
      dest.write(Buffer.from(body));
      dest.end();
    } else if (ArrayBuffer.isView(body)) {
      // body is ArrayBufferView
      dest.write(Buffer.from(body.buffer, body.byteOffset, body.byteLength));
      dest.end();
    } else {
      // body is stream
      body.pipe(dest);
    }
  }
}

/**
 * Detect a URLSearchParams object
 * ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
 *
 * @param   Object  obj     Object to detect by type or brand
 * @return  String
 */
function isURLSearchParams(obj) {
  // FIXME: replace with `instanceof` !?
  // Duck-typing as a necessary condition.
  if (
    typeof obj !== "object" ||
    typeof obj.append !== "function" ||
    typeof obj.delete !== "function" ||
    typeof obj.get !== "function" ||
    typeof obj.getAll !== "function" ||
    typeof obj.has !== "function" ||
    typeof obj.set !== "function"
  ) {
    return false;
  }

  // Brand-checking and more duck-typing as optional condition.
  return (
    obj.constructor.name === "URLSearchParams" ||
    Object.prototype.toString.call(obj) === "[object URLSearchParams]" ||
    typeof obj.sort === "function"
  );
}

exports.implementation = BodyImpl;

"use strict";

const Blob = require("../../lib/Blob.js");
const FormData = require("../../lib/FormData.js");

const { Buffer } = require("buffer");
const Stream = require("stream");
const { PassThrough } = Stream;

const { URLSearchParams } = require("url");
const {
  ReadableStream,
  readableStreamFromNode
} = require("@platformparity/streams");

const convert = require("encoding").convert;

// TODO: don't bother with the symbol, since impl class isn't exposed anyway
const INTERNALS = Symbol("Body internals");

class BodyImpl {
  get body() {
    return this[INTERNALS].body;
  }

  get bodyUsed() {
    // return this[INTERNALS].disturbed;
    return this[INTERNALS].body._disturbed;
  }

  // FIXME: pass "method" rather than chain, similar to spec..
  arrayBuffer() {
    return this.consumeBody().then(buf =>
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    );
  }

  blob() {
    const type = (this.headers && this.headers.get("content-type")) || "";
    return this.consumeBody().then(buf => Blob.create([[buf], { type }]));
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

  bodyConstructor([source]) {
    const [content, contentType, totalBytes] = this.extractContent(source);

    // meh...
    this[INTERNALS] = {
      transmittedBytes: 0,
      totalBytes
    };

    if (content instanceof ReadableStream) {
      // FIXME: If keepalive flag is set and object’s type is a ReadableStream object,
      // then throw a TypeError.
      Object.assign(this[INTERNALS], { body: content, source: null });
    } else {
      const stream = new PassThrough();
      stream.end(content);
      const body = readableStreamFromNode(stream);
      Object.assign(this[INTERNALS], { body, source });
    }

    // TODO: assume headers is present, and set directly?
    return contentType;

    // NOTE: Sorry, we're not dealing with node streams anymore.
    /*
    this.nodeMaxChunkSize = nodeMaxChunkSize;
    this.nodeTimeout = nodeTimeout;

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
    */
  }

  // https://fetch.spec.whatwg.org/#concept-body-consume-body
  consumeBody() {
    if (this.body.locked) {
      return Promise.reject(new TypeError("body stream locked")); // FIXME: same error as browser impls?
    } else if (this.body._disturbed) {
      return Promise.reject(new TypeError("body stream already read")); // FIXME: same error as brower?
    }

    const stream = this.body || new ReadableStream();

    let reader;
    try {
      reader = stream.getReader();
    } catch (e) {
      return Promise.reject(e);
    }

    return this.readAllBytes(reader);

    /*
    if (this[INTERNALS].disturbed) {
      return Promise.reject(new TypeError(`body stream already read`));
    }

    this[INTERNALS].disturbed = true;

    if (this[INTERNALS].error) {
      return Promise.reject(this[INTERNALS].error);
    }

    return Promise.resolve(null);
    */
  }

  // https://fetch.spec.whatwg.org/#concept-read-all-bytes-from-readablestream
  async readAllBytes(reader) {
    const bytes = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done === false && value instanceof Uint8Array) {
        bytes.push(value);
      } else if (done === true) {
        return Buffer.concat(bytes);
      } else {
        throw new TypeError("not done and value not type of Uint8Array");
      }
    }
  }

  /*
  function readAllBytes(reader) {
    const bytes = [];

    return pump();

    function pump() {
      return reader.read().then(({ value, done }) => {
        if (done === false && value instanceof Uint8Array) {
          bytes.push(value);
          return pump(); // TODO: call stack size?
        } else if (done === true) {
          return Buffer.concat(bytes);
        } else {
          throw new TypeError("not done and value not type of Uint8Array");
        }
      });
    }
  }
  */

  // FIXME: rename
  extractContent(source) {
    if (source === null) {
      return [Buffer.alloc(0), null, 0];
    }

    if (Blob.isImpl(source)) {
      return [source._buffer, source.type, source.size];
    }

    if (source instanceof ArrayBuffer) {
      return [Buffer.from(source), null, source.byteLength];
    }

    if (ArrayBuffer.isView(source)) {
      return [
        Buffer.from(source, source.byteOffset, source.byteLength),
        null,
        source.byteLength
      ];
    }

    if (FormData.isImpl(source)) {
      // ("multipart/form-data; boundary=----TODO");
      throw Error("not implemented");
    }

    if (source instanceof URLSearchParams) {
      const buffer = Buffer.from(String(body));
      return [
        buffer,
        "application/x-www-form-urlencoded;charset=UTF-8",
        buffer.byteLength
      ];
    }

    if (source instanceof ReadableStream) {
      return [source, null, null];
    }

    if (typeof source === "string") {
      const buffer = Buffer.from(source);
      return [buffer, "text/plain;charset=UTF-8", buffer.byteLength];
    }

    throw Error("this should never happen");

    // NOTE: Sorry, we're not dealing with node streams anymore.
    // // istanbul ignore if: should never happen
    // if (!(source instanceof Stream)) {
    //   return Buffer.alloc(0);
    // }
    //
    // // source is stream
    // // get ready to actually consume the body
    // let accum = [];
    // let accumBytes = 0;
    // let abort = false;
    //
    // return new Promise((resolve, reject) => {
    //   let resTimeout;
    //
    //   // allow timeout on slow response body
    //   if (this.nodeTimeout) {
    //     resTimeout = setTimeout(() => {
    //       abort = true;
    //       reject(
    //         new Error(
    //           `Response timeout while trying to fetch ${this.url} (over ${
    //             this.nodeTimeout
    //           }ms)`,
    //           "body-timeout"
    //         )
    //       );
    //     }, this.nodeTimeout);
    //   }
    //
    //   this[INTERNALS].rejectCurrentPromise = reject;
    //
    //   source.on("data", chunk => {
    //     if (abort || chunk === null) {
    //       return;
    //     }
    //
    //     if (
    //       this.nodeMaxChunkSize &&
    //       accumBytes + chunk.length > this.nodeMaxChunkSize
    //     ) {
    //       abort = true;
    //       reject(
    //         new Error(
    //           `content size at ${this.url} over limit: ${
    //             this.nodeMaxChunkSize
    //           }`,
    //           "max-size"
    //         )
    //       );
    //       return;
    //     }
    //
    //     accumBytes += chunk.length;
    //     accum.push(chunk);
    //   });
    //
    //   source.once("end", () => {
    //     if (abort) {
    //       return;
    //     }
    //
    //     clearTimeout(resTimeout);
    //
    //     try {
    //       resolve(Buffer.concat(accum));
    //     } catch (err) {
    //       // handle streams that have accumulated too much data (issue #414)
    //       reject(
    //         new Error(
    //           `Could not create Buffer from response body for ${this.url}: ${
    //             err.message
    //           }`,
    //           "system",
    //           err
    //         )
    //       );
    //     }
    //   });
    // });
  }

  detectBufferEncoding(buffer) {
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

    return charset;
  }

  /**
   * Detect buffer encoding and convert to target encoding
   * ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
   *
   * @param   Buffer  buffer    Incoming buffer
   * @return  String
   */
  convertBody(buffer) {
    const charset = this.detectBufferEncoding(buffer);
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
    try {
      const [out1, out2] = this.body.tee();

      // const that = {};
      // for (const prop in this[INTERNALS]) {
      //   that[INTERNALS][prop] = this[INTERNALS][prop];
      // }

      this[INTERNALS].body = out1;
      // that[INTERNALS].body = out2;

      return out2;
    } catch (e) {
      // FIXME: ???
      throw new Error("cannot clone body after it is used");
    }

    // if (bodyUsed) {
    // }
    // // check that body is a stream and not form-data object
    // // FIXME: we can't clone the form-data object without having it as a dependency
    // if (body instanceof Stream && typeof body.getBoundary !== "function") {
    //   // tee instance body
    //   const p1 = new PassThrough();
    //   const p2 = new PassThrough();
    //   body.pipe(p1);
    //   body.pipe(p2);
    //   // set instance body to teed body and return the other teed body
    //   this[INTERNALS].body = p1;
    //   return p2;
    // }
    // return body;
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
    // FIXME: not copies by clone...
    return this[INTERNALS].totalBytes;
  }
}

exports.implementation = BodyImpl;

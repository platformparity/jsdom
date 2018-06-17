"use strict";

const Blob = require("../../lib/Blob.js");
const FormData = require("../../lib/FormData.js");
const File = require("../../lib/File.js");

const { Buffer } = require("buffer");
const Stream = require("stream");
const { PassThrough } = Stream;
const { URLSearchParams } = require("url");

const {
  ReadableStream,
  readableStreamFromNode,
  writableStreamFromNode
} = require("@platformparity/streams");

const Busboy = require("busboy");

const crypto = require("@trust/webcrypto");

const convert = require("encoding").convert;

// TODO: don't bother with the symbol, since impl class isn't exposed anyway
const INTERNALS = Symbol("Body internals");

// NOTE: `n` MUST NOT be greater than 32768.
// NOTE: `allowedChars` MUST NOT exceed 65535 chars.
function randomString(
  n,
  allowedChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
) {
  const { length } = allowedChars;
  const random = crypto.getRandomValues(new Uint16Array(n));
  const scaled = random.map(x => (x / 65536) * length);
  return Array.prototype.map.call(scaled, x => allowedChars.charAt(x)).join("");
}

class BodyImpl {
  get body() {
    return this[INTERNALS].body;
  }

  get bodyUsed() {
    return this[INTERNALS].body._disturbed;
  }

  arrayBuffer() {
    return this.consumeBody().then(buf =>
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    );
  }

  blob() {
    return this.consumeBody().then(buf =>
      Blob.create([[buf], { type: this.mimeType }])
    );
  }

  // TODO: This is not actually how the spec defines this.
  // The method should consume the body first, then perform the algorithm.
  // However, since we have the handy `busboy` library that works on a stream,
  // we just pipe the body into it for now.
  formData() {
    // TODO: same error as browser impls?
    // FIXME: DRY
    if (this.body.locked) {
      return Promise.reject(new TypeError("body stream locked"));
    } else if (this.body._disturbed) {
      return Promise.reject(new TypeError("body stream already read"));
    }

    return new Promise((res, rej) => {
      const formData = FormData.createImpl([]);

      const busboy = new Busboy({
        headers: { "content-type": this.mimeType }
      });

      busboy.on("file", (fieldname, file, filename, encoding, type) => {
        const chunks = [];

        file.on("data", data => {
          // TODO: convert to utf-8?
          chunks.push(data);
        });

        file.on("end", () => {
          const file = File.createImpl([chunks, filename, { type }]);
          formData.append(fieldname, file);
        });

        // TODO: error? what does the spec say?
      });

      busboy.on("field", (
        fieldname,
        val
        /*fieldnameTruncated, valTruncated, encoding, mimetype*/
      ) => {
        // TODO: deal with truncated!?
        // TODO: convert to utf-8?
        // TODO: what about all these other parameters?
        formData.append(fieldname, val);
      });

      busboy.on("finish", () => {
        res(formData);
      });

      // TODO: what does the spec say?
      busboy.on("error", e => {
        rej(e);
      });

      this.body.pipeTo(writableStreamFromNode(busboy));
    });
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

  initBody(input, headers) {
    const { content, mimeType, totalBytes } = this.extractContent(input);

    // meh...
    this[INTERNALS] = {
      source: null,
      body: null,
      mimeType,
      totalBytes,
      transmittedBytes: 0 // FIXME: not actually being used
    };

    if (mimeType !== null && !headers.has("Content-Type")) {
      headers.append("Content-Type", mimeType); // TODO: why append?
    }

    if (content != null) {
      if (content instanceof ReadableStream) {
        // TODO: If keepalive flag is set and object’s type is a ReadableStream object,
        // then throw a TypeError.
        this[INTERNALS].body = content;
      } else {
        const stream = new PassThrough();
        stream.end(content);
        const body = readableStreamFromNode(stream);
        Object.assign(this[INTERNALS], { body, source: input });
      }
    }

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
    // TODO: same error as browser impls?
    if (this.body.locked) {
      return Promise.reject(new TypeError("body stream locked"));
    } else if (this.body._disturbed) {
      return Promise.reject(new TypeError("body stream already read"));
    }

    const stream = this.body || new ReadableStream();

    let reader;
    try {
      reader = stream.getReader();
    } catch (e) {
      return Promise.reject(e);
    }

    return this.readAllBytes(reader);
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
  async readAllBytes(reader) {
    const bytes = [];
    // TODO: reader doesn't implement async iterable ?
    for await (const chunk of reader) {
      if (chunk instanceof Uint8Array) bytes.push(chunk);
      else throw new TypeError("chunk not type of Uint8Array");
    }
    return Buffer.concat(bytes);
  }
  */

  /*
  readAllBytes(reader) {
    const bytes = [];

    return pump();

    function pump() {
      return reader.read().then(({ value, done }) => {
        if (done === false && value instanceof Uint8Array) {
          bytes.push(value);
          return pump(); // TODO: maximum call stack size?
        } else if (done === true) {
          return Buffer.concat(bytes);
        } else {
          return Promise.reject(
            new TypeError("not done and value not type of Uint8Array")
          );
        }
      });
    }
  }
  */

  extractContent(input) {
    if (input == null) {
      return {
        content: null,
        mimeType: null,
        totalBytes: 0
      };
    }

    if (Blob.isImpl(input)) {
      return {
        content: input._buffer,
        mimeType: input.type,
        totalBytes: input.size
      };
    }

    if (input instanceof ArrayBuffer) {
      return {
        content: Buffer.from(input),
        mimeType: null,
        totalBytes: input.byteLength
      };
    }

    if (ArrayBuffer.isView(input)) {
      return {
        content: Buffer.from(input, input.byteOffset, input.byteLength),
        mimeType: null,
        totalBytes: input.byteLength
      };
    }

    if (FormData.isImpl(input)) {
      const [content, boundary] = this.formDataToBuffer(input);
      return {
        content,
        mimeType: `multipart/form-data; boundary=${boundary}`,
        totalBytes: content.byteLength
      };
    }

    if (input instanceof URLSearchParams) {
      const content = Buffer.from(String(input));
      return {
        content,
        mimeType: "application/x-www-form-urlencoded;charset=UTF-8",
        totalBytes: content.byteLength
      };
    }

    if (input instanceof ReadableStream) {
      return {
        content: input,
        mimeType: null,
        totalBytes: null
      };
    }

    if (typeof input === "string") {
      const content = Buffer.from(input);
      return {
        content,
        mimeType: "text/plain;charset=UTF-8",
        totalBytes: content.byteLength
      };
    }

    throw Error("Unrecognized type", input);

    // NOTE: Sorry, we're not dealing with node streams anymore.
    // // istanbul ignore if: should never happen
    // if (!(input instanceof Stream)) {
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
    //   input.on("data", chunk => {
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
    //   input.once("end", () => {
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

  formDataToBuffer(formData) {
    const PREFIX = "PlatformParity";
    const LINE_BREAK = Buffer.from("\r\n");
    const DEFAULT_CONTENT_TYPE = "application/octet-stream";

    const boundary = `----${PREFIX}FormBoundary${randomString(16)}`;
    const chunks = [];

    for (const { name, value } of formData._entries) {
      chunks.push(Buffer.from(`--${boundary}`), LINE_BREAK);

      if (Blob.isImpl(value)) {
        const file = value;
        const filename = file.name;
        chunks.push(
          Buffer.from(
            `Content-Disposition: form-data; name="${name}"; filename="${filename}"`
          ),
          LINE_BREAK,
          Buffer.from(`Content-Type: ${file.type || DEFAULT_CONTENT_TYPE}`),
          LINE_BREAK,
          LINE_BREAK,
          file._buffer,
          LINE_BREAK
        );
      } else {
        chunks.push(
          Buffer.from(`Content-Disposition: form-data; name="${name}"`),
          LINE_BREAK,
          LINE_BREAK,
          Buffer.from(`${value}`),
          LINE_BREAK
        );
      }
    }

    chunks.push(Buffer.from(`--${boundary}--`), LINE_BREAK);

    return [Buffer.concat(chunks), boundary];
  }

  // TODO: this doesn't belong here
  // http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
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

  // TODO: does this belong here?
  convertBody(buffer) {
    const charset = this.detectBufferEncoding(buffer);
    // turn raw buffers into a single utf-8 buffer
    return convert(buffer, "UTF-8", charset).toString();
  }

  cloneBodyTo(that) {
    that[INTERNALS] = {};

    for (const prop in this[INTERNALS]) {
      that[INTERNALS][prop] = this[INTERNALS][prop];
    }

    if (this.body != null) {
      try {
        const [out1, out2] = this.body.tee();

        this[INTERNALS].body = out1;
        that[INTERNALS].body = out2;
      } catch (e) {
        throw new TypeError("cannot clone body after it is used");
      }
    }
  }

  get mimeType() {
    return this[INTERNALS].mimeType;
  }

  get totalBytes() {
    return this[INTERNALS].totalBytes;
  }

  get transmittedBytes() {
    return this[INTERNALS].transmittedBytes;
  }
}

exports.implementation = BodyImpl;

"use strict";

const os = require("os");

// TODO: create on-demand?

// TODO: better way to detect on which port we are running?
//       whatever, it's just a "cute" feature anyway
const { PROTOCOL, HOSTNAME, PORT } = process.env;
const port = Number(PORT) || 3000;
const protocol = PROTOCOL || (port === 443 && "https:") || "http:";
const hostname = HOSTNAME || os.hostname() || "localhost";

// TODO: deal with node URL vs. polyfill for older node verisons...
const location = new URL(`${protocol}//${hostname}:${port}`);

class WorkerLocationImpl {
  get href() {
    return location.href;
  }
  get origin() {
    return location.origin;
  }
  get protocol() {
    return location.protocol;
  }
  get host() {
    return location.host;
  }
  get hostname() {
    return location.hostname;
  }
  get port() {
    return location.port;
  }
  get pathname() {
    return location.pathname;
  }
  get search() {
    return location.search;
  }
  get hash() {
    return location.hash;
  }
}

exports.implementation = WorkerLocationImpl;

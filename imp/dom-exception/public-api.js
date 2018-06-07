"use strict";

// TODO: meeeeehhh
const DOMException = require("./DOMException").interface;

Object.setPrototypeOf(DOMException.prototype, Error.prototype);

module.exports = { DOMException };

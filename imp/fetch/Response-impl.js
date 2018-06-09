"use strict";
const { mixin } = require("../utils.js");
const BodyImpl = require("./BodyImpl-impl.js").implementation;

class ResponseImpl {
  constructor() {
    BodyImpl.initBody();
  }
}

mixin(ResponseImpl.prototype, BodyImpl.prototype);

exports.implementation = ResponseImpl;

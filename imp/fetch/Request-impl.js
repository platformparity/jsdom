"use strict";
const { mixin } = require("../utils.js");
const BodyImpl = require("./BodyImpl-impl.js").implementation;

class RequestImpl {
  constructor() {
    BodyImpl.initBody();
  }
}

mixin(RequestImpl.prototype, BodyImpl.prototype);

exports.implementation = RequestImpl;

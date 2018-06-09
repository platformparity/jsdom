"use strict";

const { cpus } = require("os");

class NavigatorConcurrentHardwareImpl {
  get hardwareConcurrency() {
    return cpus().length;
  }
}

exports.implementation = NavigatorConcurrentHardwareImpl;

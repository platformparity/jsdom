"use strict";

const { mixin } = require("../utils.js");

const NavigatorIDImpl = require("../navigator/NavigatorID-impl.js")
  .implementation;
const NavigatorLanguageImpl = require("../navigator/NavigatorLanguage-impl.js")
  .implementation;
const NavigatorOnLineImpl = require("../navigator/NavigatorOnLine-impl.js")
  .implementation;
const NavigatorConcurrentHardwareImpl = require("../navigator/NavigatorConcurrentHardware-impl.js")
  .implementation;

class WorkerNavigatorImpl {}

mixin(WorkerNavigatorImpl.prototype, NavigatorIDImpl.prototype);
mixin(WorkerNavigatorImpl.prototype, NavigatorLanguageImpl.prototype);
mixin(WorkerNavigatorImpl.prototype, NavigatorOnLineImpl.prototype);
mixin(WorkerNavigatorImpl.prototype, NavigatorConcurrentHardwareImpl.prototype);

exports.implementation = WorkerNavigatorImpl;

"use strict";

const idlUtils = require("../../lib/utils.js");
const { mixin } = require("../utils.js");

const DOMException = require("domexception");

const WorkerLocation = require("../../lib/WorkerLocation.js");
const WorkerNavigator = require("../../lib/WorkerNavigator.js");

const EventTargetImpl = require("../event-target/EventTarget-impl.js")
  .implementation;
const WindowOrWorkerGlobalScopeImpl = require("./WindowOrWorkerGlobalScope-impl.js")
  .implementation;

const {
  setupForSimpleEventAccessors
} = require("../helpers/create-event-accessor.js");

// Foreshadowing of some shady shit that's going down later...
const nodeRequire = global.require;

const events = [
  "error",
  "languagechange",
  "offline",
  "online",
  "rejectionhandled",
  "unhandledrejection"
];

// TODO: do this in constructor? There isn't really a point in
// having more than one of these around tho, is there?
const location = WorkerLocation.create();
const navigator = WorkerNavigator.create();

class WorkerGlobalScopeImpl extends EventTargetImpl {
  get self() {
    return this;
  }

  get location() {
    return location;
  }

  get navigator() {
    return navigator;
  }

  importScripts(...urls) {
    // TODO: what if `url` contains an actual URL?
    //       fetch the actual script, save to file and feed to node?
    //       Sounds dangerous. Unlike real workers, node has all kinds of priviledges...
    for (const url of urls) {
      try {
        nodeRequire(url);
      } catch (e) {
        const { name } = idlUtils.wrapperForImpl(this).constructor;
        throw new DOMException(
          `Failed to execute 'importScripts' on '${name}': The script at '${url}' failed to load.`,
          "DOMException"
        );
      }
    }
  }
}

mixin(WorkerGlobalScopeImpl.prototype, WindowOrWorkerGlobalScopeImpl.prototype);

setupForSimpleEventAccessors(WorkerGlobalScopeImpl.prototype, events);

exports.implementation = WorkerGlobalScopeImpl;

"use strict";

const idlUtils = require("../../lib/utils.js");
const { mixin } = require("../utils.js");

const DOMException = require("domexception");

const WorkerLocation = require("../../lib/WorkerLocation.js");
const WorkerNavigator = require("../../lib/WorkerNavigator.js");
const ErrorEvent = require("../../lib/ErrorEvent.js");
const PromiseRejectionEvent = require("../../lib/PromiseRejectionEvent.js");

const EventTargetImpl = require("../event-target/EventTarget-impl.js")
  .implementation;
const WindowOrWorkerGlobalScopeImpl = require("./WindowOrWorkerGlobalScope-impl.js")
  .implementation;

const {
  setupForSimpleEventAccessors
} = require("../helpers/create-event-accessor.js");

const RE_STACK = /^.*\[.*\].*\((.*):(\d*)*:(\d*)\)\s*$/;

// Foreshadowing of some shady shit that's going down later...
const nodeRequire = global.require;
const nodeProcess = global.process;

const events = [
  "error",
  "languagechange",
  "offline",
  "online",
  "rejectionhandled",
  "unhandledrejection"
];

function getAllKeys(obj) {
  let props = [];

  do {
    props = props.concat(Reflect.ownKeys(obj));
  } while ((obj = Reflect.getPrototypeOf(obj)) && obj !== Object.prototype);

  return props;
}

class WorkerGlobalScopeImpl extends EventTargetImpl {
  constructor() {
    super();

    this._location = WorkerLocation.create();
    this._navigator = WorkerNavigator.create();
  }

  get self() {
    return this;
  }

  get location() {
    return this._location;
  }

  get navigator() {
    return this._navigator;
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

  // Adding an event listner on the node process changes node's default behavior,
  // so we only do it when the user adds an event listener to the global scope as well:
  addEventListener(type, ...args) {
    switch (type) {
      case "unhandledrejection": {
        if (!this._hasListener("unhandledrejection")) {
          nodeProcess.on("unhandledRejection", (reason, promise) => {
            this._fireEvent(PromiseRejectionEvent, "unhandledrejection", {
              reason,
              promise
            });
          });
        }
        break;
      }
      case "rejectionhandled": {
        if (!this._hasListener("rejectionhandled")) {
          nodeProcess.on("rejectionHandled", promise => {
            this._fireEvent(PromiseRejectionEvent, "rejectionhandled", {
              promise
            });
          });
        }
        break;
      }
      case "error": {
        if (!this._hasListener("error")) {
          nodeProcess.on("uncaughtException", error => {
            const { message, stack } = error;

            // HACK: hacky way to retrieve data from the stack trace...
            const [, filename, lineno, colno] = RE_STACK.exec(
              stack.split("\n")[1]
            );

            this._fireEvent(ErrorEvent, "error", {
              message,
              filename,
              lineno,
              colno,
              error
            });
          });
        }
        break;
      }
      default:
        break;
    }
    super.addEventListener(type, ...args);
  }

  _hasListener(type) {
    return this._eventListeners[type] && this._eventListeners[type].length;
  }

  _fireEvent(Error, type, opts) {
    const event = Error.createImpl(
      [
        type,
        Object.assign(
          {
            bubbles: false,
            cancelable: true
          },
          opts
        )
      ],
      {
        isTrusted: true // FIXME
      }
    );
    this.dispatchEvent(event);
  }
}

mixin(WorkerGlobalScopeImpl.prototype, WindowOrWorkerGlobalScopeImpl.prototype);

setupForSimpleEventAccessors(WorkerGlobalScopeImpl.prototype, events);

exports.implementation = WorkerGlobalScopeImpl;

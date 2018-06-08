"use strict";

// events
const Event = require("./lib/Event.js").interface;
const CustomEvent = require("./lib/CustomEvent.js").interface;
// TODO: expose other event types? which ones?

// event-target
const EventTarget = require("./lib/EventTarget.js").interface;

// file
const Blob = require("./lib/Blob.js").interface;
const File = require("./lib/File.js").interface;
const FileList = require("./lib/FileList.js").interface;
const FileReader = require("./lib/FileReader.js").interface;

// abort-controller
const AbortController = require("./lib/AbortController.js").interface;
const AbortSignal = require("./lib/AbortSignal.js").interface;

// form-data
const FormData = require("./lib/FormData.js").interface;

module.exports = {
  AbortController,
  AbortSignal,
  Blob,
  CustomEvent,
  Event,
  EventTarget,
  File,
  FileList,
  FileReader,
  FormData
};

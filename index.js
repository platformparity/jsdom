"use strict";

// events
const Event = require("./lib/Event.js").interface;
const CustomEvent = require("./lib/CustomEvent.js").interface;
const ErrorEvent = require("./lib/ErrorEvent.js").interface;
const MessageEvent = require("./lib/MessageEvent.js").interface;
const ProgressEvent = require("./lib/ProgressEvent.js").interface;

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
  Event,
  CustomEvent,
  ErrorEvent,
  MessageEvent,
  ProgressEvent,

  EventTarget,

  Blob,
  File,
  FileList,
  FileReader,

  AbortController,
  AbortSignal,

  FormData
};

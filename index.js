"use strict";

// events
const Event = require('./lib/Event.js').interface;
const CustomEvent = require('./lib/CustomEvent.js').interface;
// TODO: expose other event types? which ones?

// event-target
const EventTarget = require('./lib/EventTarget.js').interface;

// file
const Blob = require('./lib/Blob.js').interface;
const File = require('./lib/File.js').interface;
const FileList = require('./lib/FileList.js').interface;

const createFileReader = require('./lib/FileReader.js').createInterface;
const FileReader = createFileReader().interface;

// abort-controller
const createAbortController = require('./lib/AbortController.js').createInterface;
const createAbortSignal = require('./lib/AbortSignal.js').createInterface;

const __AbortSignal = createAbortSignal();
const AbortController = createAbortController({ AbortSignal: __AbortSignal }).interface;
const AbortSignal = __AbortSignal.interface

// form-data
const FormData = require('./lib/FormData.js').interface;

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
  FormData,
};

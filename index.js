"use strict";

const WorkerGlobalScope = require('./lib/WorkerGlobalScope.js');
const globalContext = WorkerGlobalScope.create([]);
require('./lib/bundle-entry.js').bootstrap('Worker', globalContext, {});
module.exports = globalContext;

"use strict";

const osLocale = require("os-locale");

// NOTE: Probably not worth to slow down the startup
//       for a "cute" (unncessary) feature like this...
const language = osLocale.sync().replace("_", "-");

class NavigatorLanguageImpl {
  get language() {
    return language;
  }

  // TODO: no idea if there's a way to get all OS languages..
  get languages() {
    return [language];
  }
}

exports.implementation = NavigatorLanguageImpl;

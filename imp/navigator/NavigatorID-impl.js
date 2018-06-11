"use strict";

const { version } = require("../../package.json");

const platform = platformDict(process.platform);

// NOTE: just making stuff up as I go...
// Could inlcude platform, e.g. `(Macintosh; Intel Mac OS X 10_13_4)`
const name = "platformparity";
const ad = "https://github.com/platformparity";
const nodeVersion = process.version.substr(1); // drop the `v`
const userAgent =
  process.env.USER_AGENT || `${name}/${version} (${ad}) node/${nodeVersion}`;

const appVersion = userAgent.substr(userAgent.indexOf("/") + 1);

class NavigatorConcurrentHardwareImpl {
  get appCodeName() {
    return "Mozilla";
  }

  get appName() {
    return "Netscape";
  }

  get appVersion() {
    return appVersion;
  }

  get platform() {
    return platform;
  }

  get product() {
    return "Gecko";
  }

  get userAgent() {
    return userAgent;
  }
}

function platformDict(p) {
  switch (p) {
    case "aix":
      return "AIX";
    case "darwin":
      // NOTE: no idea if those are equivalent...
      return "MacIntel";
    case "freebsd":
      // NOTE: this should actually look like "FreeBSD i386"
      // https://html.spec.whatwg.org/multipage/system-state.html#dom-navigator-platform
      return "FreeBSD";
    case "linux":
      return "Linux";
    case "openbsd":
      return "OpenBSD";
    case "sunos":
      return "SunOS";
    case "win32":
      return "Win32";
    case "android":
      return "Android";
    default:
      return capitalize(p);
  }
}

function capitalize(str) {
  return str.replace(/(?:^|\s)\S/g, a => a.toUpperCase());
}

exports.implementation = NavigatorConcurrentHardwareImpl;

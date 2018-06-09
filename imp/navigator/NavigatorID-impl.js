"use strict";

const { version } = require("../../package.json");

class NavigatorConcurrentHardwareImpl {
  get appCodeName() {
    return "Mozilla";
  }

  get appName() {
    return "Netscape";
  }

  get appVersion() {
    const ua = this.userAgent;
    return ua.substr(ua.indexOf("/") + 1);
  }

  get platform() {
    // TODO: use `os.type()` instead??
    return platformDict(process.platform);
  }

  get product() {
    return "Gecko";
  }

  get userAgent() {
    // NOTE: just making stuff up as I go...
    // Could inlcude platform, e.g. `(Macintosh; Intel Mac OS X 10_13_4)`
    const name = "platformparity";
    const ad = "https://github.com/platformparity";
    const nodeVersion = process.version.substr(1); // drop the `v`
    return (
      process.env.USER_AGENT || `${name}/${version} (${ad}) node/${nodeVersion}`
    );
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

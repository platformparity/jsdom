"use strict";

class NavigatorOnLineImpl {
  // TODO: we could proabably actually check the network status...
  get onLine() {
    return true;
  }
}

exports.implementation = NavigatorOnLineImpl;

interface mixin NavigatorContentUtils {
  void registerProtocolHandler(DOMString scheme, USVString url, DOMString title);
  void unregisterProtocolHandler(DOMString scheme, USVString url);
};

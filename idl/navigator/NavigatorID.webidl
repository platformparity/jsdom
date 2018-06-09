interface mixin NavigatorID {
  readonly attribute DOMString appCodeName; // constant "Mozilla"
  readonly attribute DOMString appName; // constant "Netscape"
  readonly attribute DOMString appVersion;
  readonly attribute DOMString platform;
  readonly attribute DOMString product; // constant "Gecko"
  /* [Exposed=Window] readonly attribute DOMString productSub; */
  readonly attribute DOMString userAgent;
  /* [Exposed=Window] readonly attribute DOMString vendor; */
  /* [Exposed=Window] readonly attribute DOMString vendorSub; // constant "" */
};

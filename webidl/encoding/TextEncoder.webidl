[Constructor,
 Exposed=(Window,Worker)]
interface TextEncoder {
  readonly attribute DOMString encoding;
  [NewObject] Uint8Array encode(optional USVString input = "");
};

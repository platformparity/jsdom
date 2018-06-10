// FIXME: breaks when union contains unrecognized types...
//        either add them to WebIDL (a bit difficult for ReadableStream),
//        or modifiy webidl2js to recognize them...
typedef (Blob or BufferSource or FormData or URLSearchParams /* or ReadableStream */ or USVString) BodyInit;
interface mixin Body {
  readonly attribute ReadableStream? body;
  readonly attribute boolean bodyUsed;
  [NewObject] Promise<ArrayBuffer> arrayBuffer();
  [NewObject] Promise<Blob> blob();
  [NewObject] Promise<FormData> formData();
  [NewObject] Promise<any> json();
  [NewObject] Promise<USVString> text();
};

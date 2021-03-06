[Constructor(DOMString type, PromiseRejectionEventInit eventInitDict),
 Exposed=(Window,Worker)]
interface PromiseRejectionEvent : Event {
  readonly attribute Promise<any> promise;
  readonly attribute any reason;
};

dictionary PromiseRejectionEventInit : EventInit {
  /* required */ Promise<any> promise; // FIXME
  any reason;
};

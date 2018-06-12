# Platform Parity

## Status

Below is a print-out of everything that's available in a `Worker` in Chrome (67). The goal of the platform parity project is to provide a reasonable implementation to all of these in node. Plenty won't have a reasonable implementation though. These should either be undefined or throw upon invocation (not sure which is better).

### Global

#### WorkerGlobalContext

- [x] `WorkerGlobalScope`
- [x] `WorkerNavigator`
- [x] `WorkerLocation`
- [x] `ErrorEvent`
- [x] `PromiseRejectionEvent`
- [x] `self`
- [x] `location`
- [x] `navigator`
- [x] `onerror`
- [x] `onlanguagechange` (never fired)
- [x] `onoffline` (never fired)
- [x] `ononline` (never fired)
- [x] `onrejectionhandled`
- [x] `onunhandledrejection`
- [x] `importScripts`
- [x] `origin`
- [ ] `isSecureContext`
- [x] `atob`
- [x] `btoa`
- [x] `setTimeout`
- [x] `clearTimeout`
- [x] `setInterval`
- [x] `clearInterval`

#### Streams API

- [x] `ByteLengthQueuingStrategy`
- [x] `CountQueuingStrategy`
- [x] `ReadableStream`
- [x] `WritableStream`
- [x] `TransformStream`

#### Encoding API

Supported through browser polypill, probably slow.

- [x] `TextEncoder`
- [x] `TextDecoder`

#### Web Cryptography API

Supported through @trust/web-crypto.

- [x] `SubtleCrypto`
- [x] `CryptoKey`
- [x] `Crypto` (not generated by `webidl2js` though)
- [x] `crypto`

#### Indexed Database

- [ ] `IDBVersionChangeEvent`
- [ ] `IDBTransaction`
- [ ] `IDBRequest`
- [ ] `IDBOpenDBRequest`
- [ ] `IDBObjectStore`
- [ ] `IDBKeyRange`
- [ ] `IDBIndex`
- [ ] `IDBFactory`
- [ ] `IDBDatabase`
- [ ] `IDBCursorWithValue`
- [ ] `IDBCursor`
- [ ] `indexedDB`

#### Dedicated worker stuff (I think)

- [ ] `DedicatedWorkerGlobalScope`
- [ ] `CloseEvent`
- [ ] `BroadcastChannel`
- [ ] `MessagePort`
- [ ] `MessageEvent`
- [ ] `MessageChannel`
- [ ] `onmessage`
- [ ] `onmessageerror`
- [ ] `postMessage`
- [ ] `close`

#### URL Standard

There's actually work to be done to alternate between polyfills and native impls for node 10+

- [x] `URL`
- [x] `URLSearchParams`

#### Fetch API

- [ ] `Response`
- [ ] `Request`
- [x] `Headers`
- [ ] `fetch` (minus Streams API stuff and `formData()`; no static methods)

#### Form data (part of XHR stuff...)

- [x] `FormData`

#### File API

- [x] `Blob`
- [x] `File`
- [x] `FileList`
- [x] `FileReader`
- [ ] ~~`FileReaderSync`~~
- [x] `ProgressEvent`

#### Events

- [x] `EventTarget`
- [x] `Event`
- [x] `CustomEvent`
- [x] `addEventListener`
- [x] `removeEventListener`
- [x] `dispatchEvent`

#### Aborting

- [x] `AbortSignal`
- [x] `AbortController`

#### Cache

Could implement on top of IndexedDB or just write response bodies to the file system...

- [ ] `Cache`
- [ ] `CacheStorage`
- [ ] `caches`

#### Legacy?

- [ ] `EventSource`
- [ ] `WebSocket`
- [ ] ~~`XMLHttpRequestUpload`~~
- [ ] ~~`XMLHttpRequestEventTarget`~~
- [ ] ~~`XMLHttpRequest`~~

### Uncategorized

- [ ] ~~`ServiceWorkerRegistration`~~
- [ ] ~~`DOMStringList`~~
- [x] `DOMException`
- [x] `BigInt` (part of node since v?)
- [x] `WebAssembly` (part of node since v?)

### File systems and directories API or something

Could instead be implemented with a `node` prefix...

- [ ] `webkitRequestFileSystem`
- [ ] ~~`webkitRequestFileSystemSync`~~
- [ ] `webkitResolveLocalFileSystemURL`
- [ ] ~~`webkitResolveLocalFileSystemSyncURL`~~

#### DOM Geometry API

Not clear if these make sense in node.

- [ ] `DOMRectReadOnly`
- [ ] `DOMRect`
- [ ] `DOMQuad`
- [ ] `DOMPointReadOnly`
- [ ] `DOMPoint`
- [ ] `DOMMatrixReadOnly`
- [ ] `DOMMatrix`

#### Weird image stuff

Actually part of the Worker API, I think. Investigate.

- [ ] `ImageData`
- [ ] `ImageBitmap`
- [ ] `createImageBitmap`

#### Weird shit

- [ ] `TEMPORARY`
- [ ] `PERSISTENT`
- [ ] `PushSubscriptionOptions`
- [ ] `PushSubscription`
- [ ] `PushManager`
- [ ] `PermissionStatus`
- [ ] `Permissions`
- [ ] `Notification`
- [ ] `BudgetService`
- [ ] `PerformanceServerTiming`
- [ ] `SyncManager`
- [ ] `NetworkInformation`
- [ ] `PerformanceResourceTiming`
- [ ] `PerformanceObserverEntryList`
- [ ] `PerformanceObserver`
- [ ] `PerformanceEntry`
- [ ] ~~`NavigationPreloadManager`~~
- [ ] `StorageManager`
- [ ] `performance`

### `Navigator`

These are not on the global object, but `global.navigator`:

- [x] `hardwareConcurrency`
- [x] `appCodeName`
- [x] `appName`
- [x] `appVersion`
- [x] `platform`
- [x] `product`
- [x] `userAgent`
- [x] `onLine`
- [ ] `connection`
- [ ] `budget`
- [ ] `permissions`
- [ ] `deviceMemory`
- [ ] `storage`

Couple of notes:

- Actually, the `ServiceWorker` would match the node environment more closely, but it makes too many assumptions. The goal (for now) is to provide commonly used stuff like `fetch`.
- Having an `IndexedDB` implementation for close-enough persistence needs right inside of node would be awesome, but that would be a considerable undertaking and I'm not sure I'd release that under MIT. There's in-memory IndexedDB implementations though, could try to plug that one in.
- Not clear what to do about the Cache API
- Probably going to drop the `DedicatedWorkerGlobalContext` stuff. Makes no sense here, does it?
  - On second thought, maybe that `postMessage` stuff could be repurposed to use some messaging protocol under the hood. Sounds a bit _too_ clever though...
- I've crossed out a couple of things I don't want to support at this point.
- I haven't look at some of these _at all_. They probably don't make a lot of sense either

# Fetch

This code is based on the `node-fetch` project, but has some important differences:

- [x] All non-spec methods have been removed
- [x] Removed most ad-hoc type checking, as this is now done by the `webidl2js`-generated wrapper classes.
- [x] Pulled in the abort controller pull request (@TimothyGu, node-fetch/#437)
  - [ ] Update once a patched version gets merged into `node-fetch`.
- [x] camelCase
- [x] Using `prettier`
  <!-- - [x] node-specific, non-standard options have been renamed and prefixed with `node` (similar to `moz`, `webkit`, etc)
    - `size` → `nodeMaxChunkSize`
    - `timeout` → `nodeTimeout`
    - [ ] Evaluate if those should be kept at all... -->
- [x] Removed pluggable promise implementations. One `Promise` to rule them all.
- [x] Hard dependencies on the rest of the @platformparity stack, like `Blob`, `AbortController`, etc..
- [x] Removed `Blob` implementation, instead using `@platformparity/file` which is based on `jsdom/jsdom`.
  - [ ] Cross-reference old `Blob` impl with `jsdom` `Blob` impl to see if there's anything missing/extra stuff we don't need...
- [x] Removed ad-hoc, non-standard `FetchError` class (but still throws regular `Error`s in its place)
  - [ ] Read spec/figure out how browsers handle these error conditions and re-evaluate if it makes sense to keep them.
- [x] Removed private function `this` hackery. Helper functions are now just methods on the implementation classes, which aren't exposed by the `webidl2js` wrapper.
- [x] Expose Streams API streams instead of node streams
- [x] Make body a stream always (spec!)
- [x] Implement `formData`
- [ ] Run web platform tests
- [ ] Figure out what to do about properties like `referrer`, `referrerPolicy`, etc that don't have an obvious equivalent in node
- [ ] Other `FIXME` and `TODO`s in the code

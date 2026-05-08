// Jest mock for micromark-extension-gfm.
//
// micromark-extension-gfm ships ESM that next/jest's default
// transformIgnorePatterns won't transpile. The mocked `gfm` export is a
// no-op factory that satisfies import resolution without parsing ESM.

/** No-op micromark GFM syntax extension factory. */
export function gfm() {
  return {};
}

export default gfm;

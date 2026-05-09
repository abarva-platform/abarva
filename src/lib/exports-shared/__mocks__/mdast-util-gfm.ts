// Jest mock for mdast-util-gfm.
//
// mdast-util-gfm ships ESM that next/jest's default transformIgnorePatterns
// won't transpile. The mocked exports are no-ops that satisfy import
// resolution without parsing ESM. Tests asserting GFM parsing behavior
// should use a Jest project config that transforms the package.

/** No-op fromMarkdown extension. */
export function gfmFromMarkdown() {
  return {};
}

/** No-op toMarkdown extension. */
export function gfmToMarkdown() {
  return {};
}

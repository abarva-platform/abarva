// Test mock — see mdast-util-from-markdown.ts for context.
// gfmFromMarkdown returns an "extension" array; the real package
// merges it into the parser. Our mock parser ignores extensions
// entirely (it implements GFM directly), so we return an empty array.
export function gfmFromMarkdown(): unknown[] {
  return [];
}

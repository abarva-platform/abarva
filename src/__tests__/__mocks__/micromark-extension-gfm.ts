// Test mock — see mdast-util-from-markdown.ts for context.
// micromark's gfm extension is consumed by fromMarkdown but our mock
// parser doesn't use it; return an empty extension object.
export function gfm(): unknown {
  return {};
}

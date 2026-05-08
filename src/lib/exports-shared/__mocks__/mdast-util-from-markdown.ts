// Jest mock for mdast-util-from-markdown.
//
// mdast-util-from-markdown ships ESM that next/jest's default
// transformIgnorePatterns won't transpile. Tests that need to assert
// markdown parsing behavior should use the real module via a custom Jest
// transform config; for all other tests, this mock returns an empty root
// node so the import tree resolves without parsing ESM.

import type { MdastNode } from '../markdown-to-html';

/** Return a minimal mdast root with no children. */
export function fromMarkdown(_source: string): MdastNode {
  return { type: 'root', children: [] };
}

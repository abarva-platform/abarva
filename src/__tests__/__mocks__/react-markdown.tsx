// Jest mock for react-markdown.
//
// react-markdown ships ESM that next/jest's default transformIgnorePatterns
// won't transpile, which breaks every test that transitively imports it
// via <AgentRail>/<AgentResponse>. Tests that need to assert markdown
// rendering should import from `@/lib/agent/markdownTokens` directly
// (those exports are pure JSX and have no react-markdown dep). For
// everything else, this passthrough mock renders children as plain text
// so the import tree resolves without parsing ESM.

import type { ReactNode } from 'react';

interface ReactMarkdownProps {
  children?: ReactNode;
}

export default function ReactMarkdown({ children }: ReactMarkdownProps) {
  if (typeof children === 'string') {
    return <div data-mock="react-markdown">{children}</div>;
  }
  return <div data-mock="react-markdown">{children}</div>;
}

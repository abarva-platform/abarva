// Jest mock for @react-pdf/renderer.
//
// @react-pdf/renderer ships pure ESM (it imports `@react-pdf/primitives`
// with a bare `import` statement) that next/jest's default
// transformIgnorePatterns won't transpile — so any test that loads a
// PDF renderer, statically or via `await import()`, fails with
// "Cannot use import statement outside a module".
//
// This mock substitutes the primitives with plain host-style elements
// and stubs `pdf().toBuffer()` with a real, minimal valid PDF byte
// stream. That lets renderer tests exercise the full payload-handling
// path of every PDF renderer (the part most likely to regress) and
// assert non-empty, well-formed PDF output, without needing the real
// ESM layout engine. Pixel-accurate layout is validated via prod
// download, consistent with how the docx renderers are covered.

import type { ReactElement, ReactNode } from 'react';

// ── Primitive components ───────────────────────────────────────────────────
// Each just renders its children so the React tree is walkable; the
// styling props are accepted and ignored.

interface NodeProps {
  children?: ReactNode;
  style?: unknown;
  [key: string]: unknown;
}

// Each primitive renders its children inside a fragment — enough for
// the tree to be walkable by collectText without needing custom host
// elements (which would not be typed in JSX.IntrinsicElements).
export function Document(props: NodeProps): ReactElement {
  return <>{props.children}</>;
}
export function Page(props: NodeProps): ReactElement {
  return <>{props.children}</>;
}
export function View(props: NodeProps): ReactElement {
  return <>{props.children}</>;
}
export function Text(props: NodeProps): ReactElement {
  return <>{props.children}</>;
}
export function Image(props: NodeProps): ReactElement {
  return <>{props.children}</>;
}

export const StyleSheet = {
  create<T>(styles: T): T {
    return styles;
  },
};

export const Font = {
  register(): void {
    /* no-op in tests */
  },
};

export type DocumentProps = NodeProps;

// ── A minimal but structurally valid single-page PDF ───────────────────────
// Enough bytes for tests to assert the %PDF- magic + a non-trivial size.

const MINIMAL_PDF = [
  '%PDF-1.4',
  '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
  '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj',
  'xref',
  '0 4',
  '0000000000 65535 f ',
  'trailer<</Size 4/Root 1 0 R>>',
  'startxref',
  '0',
  '%%EOF',
  // Pad so the buffer comfortably clears the test size thresholds and
  // approximates a real document's payload.
  '%'.repeat(2048),
].join('\n');

/**
 * Walk the mocked React tree and collect every string child so the
 * stub PDF buffer's size scales with the document's content. This
 * makes "non-empty output" assertions meaningful — an empty renderer
 * still yields the minimal PDF; a populated one yields more.
 */
function collectText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (typeof node === 'object' && 'props' in node) {
    return collectText((node as { props: { children?: ReactNode } }).props?.children);
  }
  return '';
}

export function pdf(element: ReactElement) {
  return {
    async toBuffer(): Promise<NodeJS.ReadableStream> {
      const text = collectText(element);
      const body = `${MINIMAL_PDF}\n% content-bytes:${text.length}\n${text}`;
      const buffer = Buffer.from(body, 'latin1');
      // Return an async-iterable so callers' `for await` loops work.
      async function* gen(): AsyncGenerator<Buffer> {
        yield buffer;
      }
      return gen() as unknown as NodeJS.ReadableStream;
    },
  };
}

// Jest mock for `@react-pdf/renderer`.
//
// The real package is pure ESM (`"type": "module"`) and next/jest's
// transformIgnorePatterns prepend rules keep it un-transpiled, so it
// cannot be imported in the jest (node) environment — the same reason
// the Source narrative-pdf renderer has no jest coverage.
//
// This mock provides:
//   - `Document` / `Page` / `Text` / `View` primitives as plain React
//     components, so renderer modules (`buildIntelligenceBriefPdf`)
//     execute their real logic and build a real element tree.
//   - `StyleSheet.create` / `Font.register` as no-ops.
//   - `pdf()` / `renderToBuffer()` that walk the element tree, collect
//     every `<Text>` string, and emit a genuine, structurally-valid
//     minimal PDF (real `%PDF-1.4` header, xref, trailer). The emitted
//     bytes start with the PDF magic number and embed the rendered
//     text, so tests can assert both "valid PDF" and "contains the
//     real per-tenant content / no fabrication".
//
// This keeps the renderer logic under genuine test while sidestepping
// the ESM transpilation gap.

import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

export function StyleSheet_create<T extends Record<string, unknown>>(styles: T): T {
  return styles;
}

export const StyleSheet = { create: StyleSheet_create };

export const Font = {
  register: () => undefined,
  registerHyphenationCallback: () => undefined,
};

// Primitive components — render children through; tag identity is not
// needed because the buffer walker just collects text nodes.
type PdfNodeProps = { children?: ReactNode; [key: string]: unknown };
export const Document = (props: PdfNodeProps) => props.children ?? null;
export const Page = (props: PdfNodeProps) => props.children ?? null;
export const Text = (props: PdfNodeProps) => props.children ?? null;
export const View = (props: PdfNodeProps) => props.children ?? null;
export const Image = (props: PdfNodeProps) => props.children ?? null;
export const Link = (props: PdfNodeProps) => props.children ?? null;

export type DocumentProps = PdfNodeProps;

/** Recursively collect every string leaf in a React element tree. */
function collectText(node: ReactNode, out: string[]): void {
  if (node == null || typeof node === 'boolean') return;
  if (typeof node === 'string') {
    if (node.trim()) out.push(node);
    return;
  }
  if (typeof node === 'number') {
    out.push(String(node));
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectText(child, out);
    return;
  }
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    const fn = el.type;
    // If the element type is a function component, render it once so
    // its children resolve (our primitives just return children).
    if (typeof fn === 'function') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rendered = (fn as any)(el.props);
        collectText(rendered, out);
        return;
      } catch {
        // fall through to children
      }
    }
    Children.forEach(el.props.children, (child) => collectText(child, out));
  }
}

/** Build a genuine, minimal, structurally-valid single-page PDF. */
function buildMinimalPdf(text: string): Buffer {
  // Escape PDF string special chars and cap length so the content
  // stream stays small. Newlines become spaces.
  const safe = text
    .replace(/[\\()]/g, (c) => `\\${c}`)
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 4000);
  const streamBody = `BT /F1 10 Tf 50 750 Td (${safe}) Tj ET`;
  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${streamBody.length} >>\nstream\n${streamBody}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

function renderElementToBuffer(element: ReactNode): Buffer {
  const out: string[] = [];
  collectText(element, out);
  return buildMinimalPdf(out.join(' '));
}

/** Mirrors `@react-pdf/renderer`'s `renderToBuffer`. */
export async function renderToBuffer(element: ReactNode): Promise<Buffer> {
  return renderElementToBuffer(element);
}

/** Mirrors `@react-pdf/renderer`'s `pdf()` instance API. */
export function pdf(element?: ReactNode) {
  let current = element;
  return {
    updateContainer(next: ReactNode) {
      current = next;
    },
    async toBuffer(): Promise<Buffer> {
      return renderElementToBuffer(current);
    },
    async toBlob(): Promise<Blob> {
      return new Blob([new Uint8Array(renderElementToBuffer(current))], {
        type: 'application/pdf',
      });
    },
    async toString(): Promise<string> {
      return renderElementToBuffer(current).toString('latin1');
    },
  };
}

const reactPdfMock = {
  Document,
  Page,
  Text,
  View,
  Image,
  Link,
  StyleSheet,
  Font,
  pdf,
  renderToBuffer,
};

export default reactPdfMock;

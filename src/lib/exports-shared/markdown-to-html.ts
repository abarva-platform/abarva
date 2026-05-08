// exports-shared · Pure mdast → HTML walker.
//
// Converts a mdast (markdown abstract syntax tree) node tree to an HTML
// string. Zero coupling to any product module, zero React, zero DOM.
// Callers parse markdown with mdast-util-from-markdown + mdast-util-gfm
// and pass the root node here.
//
// Supported node types: root, heading, paragraph, text, strong, emphasis,
// inlineCode, code, blockquote, list, listItem, link, image, thematicBreak,
// html, table (GFM), tableRow, tableCell.
//
// Unknown node types are silently skipped with a fallback to processing
// children. This is intentional: the walker is used in document generation
// where unknown extensions should degrade gracefully rather than throwing.
//
// Added in the journey-kit-phase3 wave.

// ── mdast type stubs ─────────────────────────────────────────────────────
// We define the minimal interface subset needed here rather than importing
// the full @types/mdast package, so this module works with any compatible
// tree shape.

export interface MdastNode {
  type: string;
  children?: MdastNode[];
  value?: string;
  depth?: number;       // heading
  ordered?: boolean;    // list
  url?: string;         // link, image
  alt?: string;         // image
  lang?: string | null; // code
  // table alignment (GFM)
  align?: Array<'left' | 'center' | 'right' | null>;
}

// ── Core walker ──────────────────────────────────────────────────────────

/** Escape HTML special characters in text content. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Render all children of a node to HTML, concatenated. */
function renderChildren(node: MdastNode): string {
  if (!node.children) return '';
  return node.children.map(renderNode).join('');
}

/**
 * Render a single mdast node to an HTML string.
 *
 * This function is recursive — block nodes call `renderChildren`, which
 * calls back into `renderNode` for inline nodes.
 */
export function renderNode(node: MdastNode): string {
  switch (node.type) {
    case 'root':
      return renderChildren(node);

    case 'heading': {
      const level = node.depth ?? 2;
      const tag = `h${Math.min(Math.max(level, 1), 6)}`;
      return `<${tag}>${renderChildren(node)}</${tag}>\n`;
    }

    case 'paragraph':
      return `<p>${renderChildren(node)}</p>\n`;

    case 'text':
      return escapeHtml(node.value ?? '');

    case 'strong':
      return `<strong>${renderChildren(node)}</strong>`;

    case 'emphasis':
      return `<em>${renderChildren(node)}</em>`;

    case 'inlineCode':
      return `<code>${escapeHtml(node.value ?? '')}</code>`;

    case 'code': {
      const lang = node.lang ? ` class="language-${escapeHtml(node.lang)}"` : '';
      return `<pre><code${lang}>${escapeHtml(node.value ?? '')}</code></pre>\n`;
    }

    case 'blockquote':
      return `<blockquote>\n${renderChildren(node)}</blockquote>\n`;

    case 'list': {
      const tag = node.ordered ? 'ol' : 'ul';
      return `<${tag}>\n${renderChildren(node)}</${tag}>\n`;
    }

    case 'listItem':
      return `<li>${renderChildren(node)}</li>\n`;

    case 'link': {
      const href = escapeHtml(node.url ?? '');
      return `<a href="${href}">${renderChildren(node)}</a>`;
    }

    case 'image': {
      const src = escapeHtml(node.url ?? '');
      const alt = escapeHtml(node.alt ?? '');
      return `<img src="${src}" alt="${alt}" />`;
    }

    case 'thematicBreak':
      return '<hr />\n';

    case 'html':
      // Raw HTML pass-through — callers are responsible for sanitization.
      return node.value ?? '';

    case 'table': {
      const [headerRow, ...dataRows] = node.children ?? [];
      const align = node.align ?? [];
      const headerHtml = headerRow
        ? `<thead><tr>${(headerRow.children ?? []).map((cell, i) => {
            const a = align[i];
            const styleAttr = a ? ` style="text-align:${a}"` : '';
            return `<th${styleAttr}>${renderChildren(cell)}</th>`;
          }).join('')}</tr></thead>\n`
        : '';
      const bodyHtml = dataRows.length > 0
        ? `<tbody>${dataRows.map((row) =>
            `<tr>${(row.children ?? []).map((cell, i) => {
              const a = align[i];
              const styleAttr = a ? ` style="text-align:${a}"` : '';
              return `<td${styleAttr}>${renderChildren(cell)}</td>`;
            }).join('')}</tr>\n`,
          ).join('')}</tbody>\n`
        : '';
      return `<table>\n${headerHtml}${bodyHtml}</table>\n`;
    }

    case 'tableRow':
      // Handled inline within 'table' above; this branch catches
      // stray tableRow nodes outside a table.
      return `<tr>${renderChildren(node)}</tr>\n`;

    case 'tableCell':
      return `<td>${renderChildren(node)}</td>`;

    default:
      // Unknown node — try to render children; if no children, skip silently.
      return renderChildren(node);
  }
}

/**
 * Convert a mdast root node to an HTML string.
 *
 * @example
 * ```ts
 * import { fromMarkdown } from 'mdast-util-from-markdown';
 * import { gfm } from 'micromark-extension-gfm';
 * import { gfmFromMarkdown } from 'mdast-util-gfm';
 * import { mdastToHtml } from '@/lib/exports-shared/markdown-to-html';
 *
 * const tree = fromMarkdown(source, {
 *   extensions: [gfm()],
 *   mdastExtensions: [gfmFromMarkdown()],
 * });
 * const html = mdastToHtml(tree);
 * ```
 */
export function mdastToHtml(root: MdastNode): string {
  return renderNode(root);
}

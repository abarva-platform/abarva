// Source · markdown → html walker
//
// Sister to markdown-to-docx.ts. Parses an authored markdown body via
// mdast and emits a string of semantic HTML. Used by every Source HTML
// renderer (d05 / d09 / d24 / d27 narrative artifacts).
//
// Coverage mirrors the docx walker:
//   - Headings 1-6 (mapped 1:1 to <h1>..<h6>)
//   - Paragraphs with mixed bold / italic / inline-code / link / strike
//   - Bulleted + ordered lists, nested
//   - Block quotes
//   - Fenced code blocks (preserve language as a CSS class)
//   - GFM tables
//   - Thematic break (<hr>)
//   - Soft breaks within a paragraph
//
// All text content is HTML-escaped. The walker NEVER emits raw HTML
// from `html` mdast nodes (those get escaped too) — defensive against
// markdown bodies that might contain hostile HTML.
//
// Pure: input string → output string. No DOM, no fetch.

import 'server-only';

import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import type {
  Blockquote,
  Code,
  Content,
  Emphasis,
  Heading,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph as MdParagraph,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  Table as MdTable,
  TableCell as MdTableCell,
  TableRow as MdTableRow,
  Text,
} from 'mdast';

/** Top-level entry. Parses md and returns a single HTML string. */
export function markdownToHtml(md: string): string {
  if (!md) return '';
  const tree = fromMarkdown(md, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  }) as Root;
  return tree.children.map(renderRoot).join('\n');
}

function renderRoot(node: RootContent): string {
  switch (node.type) {
    case 'heading':
      return renderHeading(node);
    case 'paragraph':
      return renderParagraph(node);
    case 'list':
      return renderList(node);
    case 'blockquote':
      return renderBlockquote(node);
    case 'code':
      return renderCodeBlock(node);
    case 'table':
      return renderTable(node);
    case 'thematicBreak':
      return '<hr />';
    case 'html':
      // Escape — never emit raw HTML from markdown bodies.
      return `<p>${escapeHtml((node as { value: string }).value)}</p>`;
    case 'definition':
    case 'footnoteDefinition':
    case 'yaml':
      return '';
    default:
      return `<p>${escapeHtml(extractPlain(node as Content))}</p>`;
  }
}

// ── Headings ───────────────────────────────────────────────────────────────

function renderHeading(node: Heading): string {
  const depth = Math.max(1, Math.min(node.depth, 6));
  const inner = node.children.map(renderInline).join('');
  const id = slugify(stripTags(inner));
  return `<h${depth} id="${escapeHtml(id)}">${inner}</h${depth}>`;
}

// ── Paragraphs ─────────────────────────────────────────────────────────────

function renderParagraph(node: MdParagraph): string {
  return `<p>${node.children.map(renderInline).join('')}</p>`;
}

// ── Lists ──────────────────────────────────────────────────────────────────

function renderList(node: List): string {
  const tag = node.ordered ? 'ol' : 'ul';
  const items = (node.children as ListItem[]).map(renderListItem).join('');
  return `<${tag}>${items}</${tag}>`;
}

function renderListItem(item: ListItem): string {
  const parts: string[] = [];
  for (const child of item.children) {
    if (child.type === 'paragraph') {
      // List-item paragraphs render inline (no surrounding <p> for tight lists).
      parts.push(child.children.map(renderInline).join(''));
    } else if (child.type === 'list') {
      parts.push(renderList(child));
    } else {
      parts.push(escapeHtml(extractPlain(child as Content)));
    }
  }
  return `<li>${parts.join('')}</li>`;
}

// ── Block quote ────────────────────────────────────────────────────────────

function renderBlockquote(node: Blockquote): string {
  const inner = node.children.map((c) => renderRoot(c as RootContent)).join('');
  return `<blockquote>${inner}</blockquote>`;
}

// ── Code block ─────────────────────────────────────────────────────────────

function renderCodeBlock(node: Code): string {
  const lang = (node.lang ?? '').replace(/[^a-zA-Z0-9_-]/g, '');
  const cls = lang ? ` class="language-${escapeHtml(lang)}"` : '';
  return `<pre><code${cls}>${escapeHtml(node.value ?? '')}</code></pre>`;
}

// ── Tables ─────────────────────────────────────────────────────────────────

function renderTable(node: MdTable): string {
  const rows = node.children as MdTableRow[];
  if (rows.length === 0) return '';
  const headerRow = rows[0]!;
  const bodyRows = rows.slice(1);
  const head =
    `<thead><tr>` +
    (headerRow.children as MdTableCell[])
      .map((c) => `<th>${(c.children as PhrasingContent[]).map(renderInline).join('')}</th>`)
      .join('') +
    `</tr></thead>`;
  const body =
    bodyRows.length > 0
      ? `<tbody>` +
        bodyRows
          .map(
            (r) =>
              `<tr>` +
              (r.children as MdTableCell[])
                .map(
                  (c) =>
                    `<td>${(c.children as PhrasingContent[])
                      .map(renderInline)
                      .join('')}</td>`,
                )
                .join('') +
              `</tr>`,
          )
          .join('') +
        `</tbody>`
      : '';
  return `<table>${head}${body}</table>`;
}

// ── Inline ─────────────────────────────────────────────────────────────────

function renderInline(node: PhrasingContent): string {
  switch (node.type) {
    case 'text':
      return escapeHtml((node as Text).value);
    case 'strong':
      return `<strong>${(node as Strong).children.map(renderInline).join('')}</strong>`;
    case 'emphasis':
      return `<em>${(node as Emphasis).children.map(renderInline).join('')}</em>`;
    case 'inlineCode':
      return `<code>${escapeHtml((node as InlineCode).value)}</code>`;
    case 'break':
      return '<br />';
    case 'link': {
      const link = node as Link;
      const url = sanitizeUrl(link.url);
      const inner = link.children.map(renderInline).join('');
      return `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${inner}</a>`;
    }
    case 'delete':
      return `<del>${(node as { children: PhrasingContent[] })
        .children.map(renderInline)
        .join('')}</del>`;
    case 'html':
      // Defense-in-depth: escape rather than emit raw HTML.
      return escapeHtml((node as { value: string }).value);
    default:
      return escapeHtml(extractPlain(node as Content));
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function sanitizeUrl(url: string): string {
  // Allow http/https/mailto/anchor links only. Strip everything else
  // (including javascript:, data:, file:, vbscript:).
  const trimmed = (url ?? '').trim();
  if (
    /^(https?:\/\/|mailto:|#)/i.test(trimmed) ||
    /^[a-zA-Z0-9_./?-]+$/.test(trimmed)
  ) {
    return trimmed;
  }
  return '#';
}

function extractPlain(node: Content): string {
  if (typeof (node as { value?: string }).value === 'string') {
    return (node as { value: string }).value;
  }
  if (Array.isArray((node as { children?: Content[] }).children)) {
    return ((node as { children: Content[] }).children).map(extractPlain).join('');
  }
  return '';
}

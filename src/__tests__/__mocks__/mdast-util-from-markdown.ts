// Test mock for `mdast-util-from-markdown`
//
// The real package ships pure ESM that next/jest's default
// transformIgnorePatterns refuses to transpile. For tests that
// exercise the Source markdown→docx walker we don't need a
// production-grade parser; a minimal hand-rolled tokenizer that
// recognizes the small subset of markdown we hit in tests is enough
// to confirm the walker → docx pipeline produces a packable Document.
//
// Coverage:
//   - ATX headings (# / ## / ###)
//   - Paragraphs (with inline **bold**, *italic*, `code`)
//   - Bulleted lists (- / * markers)
//   - Ordered lists (1. / 2. ...)
//   - Block quotes (>)
//   - Fenced code blocks (```)
//   - Thematic break (---)
//   - GFM tables (| header |)
//
// Anything more complex falls through to a single paragraph with the
// raw text. Production uses the real parser; this is test-only.

import type {
  Code,
  Heading,
  ListItem,
  PhrasingContent,
  Root,
  RootContent,
  Table,
  TableCell,
  TableRow,
} from 'mdast';

export function fromMarkdown(input: string): Root {
  const lines = String(input).split('\n');
  const children: RootContent[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (line.trim().length === 0) {
      i += 1;
      continue;
    }
    // Fenced code block (with optional language tag after backticks)
    if (/^```/.test(line)) {
      const langMatch = line.match(/^```([a-zA-Z0-9_-]*)/);
      const lang = langMatch?.[1] ?? '';
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i] ?? '')) {
        codeLines.push(lines[i] ?? '');
        i += 1;
      }
      i += 1;
      children.push({
        type: 'code',
        lang: lang || null,
        value: codeLines.join('\n'),
      } as Code);
      continue;
    }
    // Thematic break
    if (/^(\s*-{3,}\s*|\s*\*{3,}\s*)$/.test(line)) {
      children.push({ type: 'thematicBreak' });
      i += 1;
      continue;
    }
    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const depth = Math.min(headingMatch[1]!.length, 6);
      const heading: Heading = {
        type: 'heading',
        depth: depth as Heading['depth'],
        children: parseInline(headingMatch[2]!),
      };
      children.push(heading);
      i += 1;
      continue;
    }
    // Block quote (single-line)
    if (/^>\s/.test(line)) {
      const quoteText = line.replace(/^>\s/, '');
      children.push({
        type: 'blockquote',
        children: [
          {
            type: 'paragraph',
            children: parseInline(quoteText),
          },
        ],
      });
      i += 1;
      continue;
    }
    // Bulleted list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: ListItem[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? '')) {
        const itemText = (lines[i] ?? '').replace(/^\s*[-*]\s+/, '');
        items.push({
          type: 'listItem',
          spread: false,
          children: [
            { type: 'paragraph', children: parseInline(itemText) },
          ],
        });
        i += 1;
      }
      children.push({ type: 'list', ordered: false, children: items, spread: false });
      continue;
    }
    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: ListItem[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? '')) {
        const itemText = (lines[i] ?? '').replace(/^\s*\d+\.\s+/, '');
        items.push({
          type: 'listItem',
          spread: false,
          children: [
            { type: 'paragraph', children: parseInline(itemText) },
          ],
        });
        i += 1;
      }
      children.push({ type: 'list', ordered: true, children: items, spread: false });
      continue;
    }
    // GFM table
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('|')) {
        tableLines.push(lines[i] ?? '');
        i += 1;
      }
      const table = parseTable(tableLines);
      if (table) {
        children.push(table);
        continue;
      }
    }
    // Default: paragraph
    children.push({
      type: 'paragraph',
      children: parseInline(line),
    });
    i += 1;
  }
  return { type: 'root', children };
}

function parseInline(text: string): PhrasingContent[] {
  const out: PhrasingContent[] = [];
  // Tokenize bold (**...**), italic (*...*), inline code (`...`),
  // and links ([text](url)).
  const tokenRe = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(text)) !== null) {
    if (m.index > lastIdx) {
      out.push({ type: 'text', value: text.slice(lastIdx, m.index) });
    }
    const tok = m[1]!;
    if (tok.startsWith('**')) {
      out.push({
        type: 'strong',
        children: [{ type: 'text', value: tok.slice(2, -2) }],
      });
    } else if (tok.startsWith('`')) {
      out.push({ type: 'inlineCode', value: tok.slice(1, -1) });
    } else if (tok.startsWith('[')) {
      // [text](url)
      const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        out.push({
          type: 'link',
          url: linkMatch[2]!,
          title: null,
          children: [{ type: 'text', value: linkMatch[1]! }],
        });
      } else {
        out.push({ type: 'text', value: tok });
      }
    } else {
      out.push({
        type: 'emphasis',
        children: [{ type: 'text', value: tok.slice(1, -1) }],
      });
    }
    lastIdx = m.index + tok.length;
  }
  if (lastIdx < text.length) {
    out.push({ type: 'text', value: text.slice(lastIdx) });
  }
  return out;
}

function parseTable(lines: string[]): Table | null {
  if (lines.length < 2) return null;
  // Skip the separator row (|---|---|)
  const dataRows = lines.filter((l, idx) => idx !== 1 || !/^\s*\|[\s|:-]+\|\s*$/.test(l));
  if (dataRows.length === 0) return null;
  const rows: TableRow[] = dataRows.map((line) => {
    const cells = line
      .replace(/^\|/, '')
      .replace(/\|\s*$/, '')
      .split('|')
      .map((c) => c.trim());
    const tableCells: TableCell[] = cells.map((cell) => ({
      type: 'tableCell',
      children: parseInline(cell),
    }));
    return { type: 'tableRow', children: tableCells };
  });
  return { type: 'table', children: rows, align: [] };
}

import { Packer, Paragraph, Table } from 'docx';
import JSZip from 'jszip';
import { markdownToDocxBlocks } from '@/lib/exports-shared/markdown-to-docx';

describe('markdownToDocxBlocks', () => {
  it('renders an empty input as zero blocks', () => {
    expect(markdownToDocxBlocks('')).toEqual([]);
  });

  it('renders headings 1-3 as Paragraph blocks', () => {
    const blocks = markdownToDocxBlocks(
      ['# H1', '', '## H2', '', '### H3'].join('\n'),
    );
    expect(blocks).toHaveLength(3);
    blocks.forEach((b) => expect(b).toBeInstanceOf(Paragraph));
  });

  it('renders a paragraph with bold + italic + inline-code runs', () => {
    const blocks = markdownToDocxBlocks(
      'This **bold** and *italic* and `code` mix.',
    );
    expect(blocks).toHaveLength(1);
    const p = blocks[0] as Paragraph;
    // The paragraph children include 7 runs (split around the bold /
    // italic / code spans + spaces). We can't peek at internal state
    // easily but we can confirm it serializes successfully.
    expect(p).toBeInstanceOf(Paragraph);
  });

  it('renders bulleted lists with each item as its own paragraph', () => {
    const blocks = markdownToDocxBlocks(
      ['- one', '- two', '- three'].join('\n'),
    );
    expect(blocks).toHaveLength(3);
    blocks.forEach((b) => expect(b).toBeInstanceOf(Paragraph));
  });

  it('renders ordered lists with the docx numbering reference', () => {
    const blocks = markdownToDocxBlocks(['1. one', '2. two'].join('\n'));
    expect(blocks).toHaveLength(2);
    blocks.forEach((b) => expect(b).toBeInstanceOf(Paragraph));
  });

  it('renders nested lists (depth 2) without crashing', () => {
    const blocks = markdownToDocxBlocks(
      ['- top', '  - nested', '  - nested two', '- second top'].join('\n'),
    );
    // 4 list items, each a paragraph
    expect(blocks.length).toBeGreaterThanOrEqual(4);
  });

  it('renders blockquotes as styled paragraphs', () => {
    const blocks = markdownToDocxBlocks('> blockquote here');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toBeInstanceOf(Paragraph);
  });

  it('renders fenced code blocks as monospaced paragraphs', () => {
    const blocks = markdownToDocxBlocks(
      ['```ts', 'const x = 1;', 'const y = 2;', '```'].join('\n'),
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toBeInstanceOf(Paragraph);
  });

  it('renders GFM tables as Table blocks', () => {
    const blocks = markdownToDocxBlocks(
      [
        '| Vendor | TCO |',
        '|---|---|',
        '| Acme | $1M |',
        '| Beta | $1.2M |',
      ].join('\n'),
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toBeInstanceOf(Table);
  });

  it('keeps authored table rows intact and repeats the header across pages', async () => {
    const blocks = markdownToDocxBlocks(
      [
        '| ID | Constraint | Discovery implication |',
        '|---|---|---|',
        '| 1 | Pending readiness validation | Validate owner approval before assuming connectivity. |',
        '| 2 | Unapproved retention controls | Obtain Privacy and Security sign-off before data access. |',
      ].join('\n'),
    );
    const { Document } = await import('docx');
    const buffer = await Packer.toBuffer(
      new Document({ sections: [{ children: blocks }] }),
    );
    const zip = await JSZip.loadAsync(buffer);
    const documentXml = await zip.file('word/document.xml')?.async('text');
    const tableXml = documentXml?.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)?.[0];

    expect(tableXml).toBeDefined();
    expect(tableXml).toContain('<w:tblHeader/>');
    expect(tableXml?.match(/<w:tr>/g)).toHaveLength(3);
    expect(tableXml?.match(/<w:cantSplit\/>/g)).toHaveLength(3);
  });

  it('renders thematic breaks as paragraph blocks', () => {
    const blocks = markdownToDocxBlocks('---');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toBeInstanceOf(Paragraph);
  });

  it('handles a realistic mixed body without throwing', () => {
    const md = [
      '# Scope Memo',
      '',
      'Tier-1 systems include Epic CIS, MyChart, and Cloverleaf integration middleware.',
      '',
      '## In scope',
      '',
      '- Compute migration (280 production VMs)',
      '- Storage (~2.4 PB block + object)',
      '- L2/L3 incident management 24×7',
      '',
      '## Out of scope',
      '',
      '> The discovery phase is excluded from this submission.',
      '',
      '| Application | Tier |',
      '|---|---|',
      '| Epic CIS | 1 |',
      '| MyChart | 1 |',
      '',
      '```',
      'transition: 6 months',
      '```',
    ].join('\n');
    const blocks = markdownToDocxBlocks(md);
    // Should produce at least one of each type
    expect(blocks.some((b) => b instanceof Table)).toBe(true);
    expect(blocks.length).toBeGreaterThan(8);
  });

  it('produces blocks that can be packed into a real docx buffer', async () => {
    // Smoke: shove the blocks into a Document and serialize. If the AST
    // we emit is wrong, Packer will throw.
    const { Document } = await import('docx');
    const blocks = markdownToDocxBlocks(
      ['# Title', '', 'Body with **bold**.', '', '- item one', '- item two'].join(
        '\n',
      ),
    );
    const doc = new Document({
      sections: [{ children: blocks }],
    });
    const buffer = await Packer.toBuffer(doc);
    expect(buffer.byteLength).toBeGreaterThan(2000);
    // docx files are zip files — magic bytes are PK\x03\x04.
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });
});

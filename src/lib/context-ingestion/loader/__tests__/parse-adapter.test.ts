import {
  classifyFileKind,
  parseUpload,
  type DocumentParser,
} from '@/lib/context-ingestion/loader/parse-adapter';

/** A stub document parser that never touches Azure. */
function stubDocumentParser(text: string): DocumentParser {
  return {
    async parse() {
      return { text };
    },
  };
}

function asBytes(s: string): Buffer {
  return Buffer.from(s, 'utf8');
}

describe('classifyFileKind', () => {
  it('classifies tabular formats by extension', () => {
    expect(classifyFileKind('org.csv')).toEqual({ kind: 'tabular', format: 'csv' });
    expect(classifyFileKind('data.json')).toEqual({ kind: 'tabular', format: 'json' });
    expect(classifyFileKind('rows.jsonl')).toEqual({ kind: 'tabular', format: 'jsonl' });
    expect(classifyFileKind('rows.ndjson')).toEqual({ kind: 'tabular', format: 'jsonl' });
    expect(classifyFileKind('conf.yaml')).toEqual({ kind: 'tabular', format: 'yaml' });
    expect(classifyFileKind('conf.yml')).toEqual({ kind: 'tabular', format: 'yaml' });
    expect(classifyFileKind('book.xlsx')).toEqual({ kind: 'tabular', format: 'xlsx' });
  });

  it('classifies document formats by extension', () => {
    expect(classifyFileKind('brief.pdf')).toEqual({ kind: 'document', format: 'pdf' });
    expect(classifyFileKind('memo.docx')).toEqual({ kind: 'document', format: 'docx' });
    expect(classifyFileKind('deck.pptx')).toEqual({ kind: 'document', format: 'pptx' });
  });

  it('falls back to content-type when extension is inconclusive', () => {
    expect(classifyFileKind('payload', 'text/csv')).toEqual({
      kind: 'tabular',
      format: 'csv',
    });
    expect(classifyFileKind('payload', 'application/pdf')).toEqual({
      kind: 'document',
      format: 'pdf',
    });
  });

  it('treats an unknown extension as an unknown document', () => {
    expect(classifyFileKind('mystery.bin')).toEqual({
      kind: 'document',
      format: 'unknown',
    });
    expect(classifyFileKind('noextension')).toEqual({
      kind: 'document',
      format: 'unknown',
    });
  });
});

describe('parseUpload — CSV', () => {
  it('parses header + rows, handling quoted commas and escaped quotes', async () => {
    const csv = [
      'name,title,note',
      '"Doe, Jane",CFO,"She said ""hi"""',
      'John Smith,CTO,plain',
    ].join('\n');

    const result = await parseUpload({ filename: 'leadership.csv', bytes: asBytes(csv) });

    expect(result.kind).toBe('tabular');
    expect(result.columns).toEqual(['name', 'title', 'note']);
    expect(result.sampleRows).toEqual([
      { name: 'Doe, Jane', title: 'CFO', note: 'She said "hi"' },
      { name: 'John Smith', title: 'CTO', note: 'plain' },
    ]);
  });

  it('caps sample rows at 20', async () => {
    const lines = ['id'];
    for (let i = 1; i <= 25; i += 1) lines.push(String(i));
    const result = await parseUpload({
      filename: 'big.csv',
      bytes: asBytes(lines.join('\n')),
    });
    expect(result.sampleRows).toHaveLength(20);
  });
});

describe('parseUpload — JSON', () => {
  it('parses an array of objects into columns union + sampleRows', async () => {
    const json = JSON.stringify([
      { name: 'A', spend: 100 },
      { name: 'B', renewal: '2026-01-01' },
    ]);
    const result = await parseUpload({ filename: 'vendors.json', bytes: asBytes(json) });
    expect(result.kind).toBe('tabular');
    expect(result.columns).toEqual(['name', 'spend', 'renewal']);
    expect(result.sampleRows).toEqual([
      { name: 'A', spend: 100 },
      { name: 'B', renewal: '2026-01-01' },
    ]);
  });

  it('parses a single object into one row', async () => {
    const json = JSON.stringify({ name: 'Solo', value: 42 });
    const result = await parseUpload({ filename: 'one.json', bytes: asBytes(json) });
    expect(result.columns).toEqual(['name', 'value']);
    expect(result.sampleRows).toEqual([{ name: 'Solo', value: 42 }]);
  });

  it('falls back to document text for top-level scalars', async () => {
    const result = await parseUpload({ filename: 'scalar.json', bytes: asBytes('42') });
    expect(result.kind).toBe('document');
    expect(result.text).toBe('42');
  });
});

describe('parseUpload — JSONL', () => {
  it('parses each non-empty line into a row', async () => {
    const jsonl = ['{"k":"v1"}', '', '{"k":"v2","x":1}', '   '].join('\n');
    const result = await parseUpload({ filename: 'rows.jsonl', bytes: asBytes(jsonl) });
    expect(result.kind).toBe('tabular');
    expect(result.columns).toEqual(['k', 'x']);
    expect(result.sampleRows).toEqual([{ k: 'v1' }, { k: 'v2', x: 1 }]);
  });
});

describe('parseUpload — document path', () => {
  it('routes a PDF through the injected parser, never calling Azure', async () => {
    const parser = stubDocumentParser('extracted body text');
    const result = await parseUpload({
      filename: 'brief.pdf',
      bytes: asBytes('%PDF-1.7 binary...'),
      documentParser: parser,
    });
    expect(result).toEqual({ kind: 'document', text: 'extracted body text' });
  });

  it('routes docx/pptx and unknown formats through the same injected parser', async () => {
    const parser = stubDocumentParser('doc text');
    for (const filename of ['memo.docx', 'deck.pptx', 'mystery.bin']) {
      const result = await parseUpload({
        filename,
        bytes: asBytes('opaque'),
        documentParser: parser,
      });
      expect(result).toEqual({ kind: 'document', text: 'doc text' });
    }
  });

  it('throws when no parser is injected and Azure is not configured', async () => {
    // No DOCUMENT_INTELLIGENCE_* env set in the test runner.
    await expect(
      parseUpload({ filename: 'brief.pdf', bytes: asBytes('x') }),
    ).rejects.toThrow('loader_parse_document_parser_unavailable');
  });
});

describe('parseUpload — YAML fallback', () => {
  it('folds an absent yaml package into a document-text fallback', async () => {
    // `yaml` is not a dependency of this repo, so the optional import fails and
    // the adapter preserves the raw text as a document.
    const yaml = 'name: Apex\nspend: 100';
    const result = await parseUpload({ filename: 'conf.yaml', bytes: asBytes(yaml) });
    expect(result.kind).toBe('document');
    expect(result.text).toBe(yaml);
  });
});

describe('parseUpload — XLSX unavailable', () => {
  it('surfaces a namespaced error when the xlsx package is absent', async () => {
    // `xlsx` is not a dependency of this repo.
    await expect(
      parseUpload({ filename: 'book.xlsx', bytes: asBytes('PK binary') }),
    ).rejects.toThrow('loader_parse_xlsx_unavailable');
  });
});

describe('parseUpload — byte normalization', () => {
  it('accepts an ArrayBuffer as well as a Buffer', async () => {
    const buf = asBytes('a,b\n1,2');
    const arrayBuffer = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer;
    const result = await parseUpload({ filename: 'x.csv', bytes: arrayBuffer });
    expect(result.columns).toEqual(['a', 'b']);
    expect(result.sampleRows).toEqual([{ a: '1', b: '2' }]);
  });
});

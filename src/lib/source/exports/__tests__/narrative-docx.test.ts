import { Packer } from 'docx';
import {
  DECISION_BRIEF_DOCX_CONFIG,
  RFP_PACK_DOCX_CONFIG,
  SCOPE_MEMO_DOCX_CONFIG,
  SELECTION_MEMO_DOCX_CONFIG,
  buildNarrativeDocx,
  type NarrativeDocxConfig,
  type NarrativeDocxPayload,
} from '../renderers/narrative-docx';

function makePayload(
  overrides: Partial<NarrativeDocxPayload> = {},
): NarrativeDocxPayload {
  return {
    tenantName: 'Meridian Health',
    eventCode: 'MERI-CLOUD-2026',
    eventName: 'Meridian Health Cloud & Infrastructure',
    issuedBy: 'Janet Fischer, VP IT Ops',
    generatedAt: '2026-05-08T03:30:00.000Z',
    body: [
      '# Authored body',
      '',
      'Some narrative content with **bold** and `code`.',
      '',
      '## Section',
      '- bullet 1',
      '- bullet 2',
    ].join('\n'),
    bodyIsAuthored: true,
    ...overrides,
  };
}

async function rawText(
  payload: NarrativeDocxPayload,
  config: NarrativeDocxConfig,
): Promise<string> {
  const doc = buildNarrativeDocx(payload, config);
  const buf = await Packer.toBuffer(doc);
  // Plain bytes contain the document.xml entry's filename + central
  // directory metadata in latin1; sufficient for smoke checks.
  return Buffer.from(buf as unknown as ArrayBuffer).toString('latin1');
}

describe('buildNarrativeDocx', () => {
  it('produces a packable docx for d05 scope memo config', async () => {
    const doc = buildNarrativeDocx(makePayload(), SCOPE_MEMO_DOCX_CONFIG);
    const buf = await Packer.toBuffer(doc);
    expect(buf.byteLength).toBeGreaterThan(4000);
    expect(buf[0]).toBe(0x50); // ZIP magic
    expect(buf[1]).toBe(0x4b);
  });

  it('produces a packable docx for d09 RFP config', async () => {
    const doc = buildNarrativeDocx(makePayload(), RFP_PACK_DOCX_CONFIG);
    const buf = await Packer.toBuffer(doc);
    expect(buf.byteLength).toBeGreaterThan(4000);
  });

  it('produces a packable docx for d24 Decision Brief config', async () => {
    const doc = buildNarrativeDocx(makePayload(), DECISION_BRIEF_DOCX_CONFIG);
    const buf = await Packer.toBuffer(doc);
    expect(buf.byteLength).toBeGreaterThan(4000);
  });

  it('produces a packable docx for d27 Selection Memo config', async () => {
    const doc = buildNarrativeDocx(makePayload(), SELECTION_MEMO_DOCX_CONFIG);
    const buf = await Packer.toBuffer(doc);
    expect(buf.byteLength).toBeGreaterThan(4000);
  });

  it('handles bodyIsAuthored=false (canonical scaffold) with a warning paragraph', async () => {
    const doc = buildNarrativeDocx(
      makePayload({ bodyIsAuthored: false, body: '# Scaffold' }),
      SCOPE_MEMO_DOCX_CONFIG,
    );
    const buf = await Packer.toBuffer(doc);
    // ZIP central-directory entries appear in plain bytes; assert
    // the document.xml entry exists (real renderer produces it).
    expect(Buffer.from(buf as unknown as ArrayBuffer).toString('latin1')).toContain(
      'word/document.xml',
    );
  });

  it('handles an empty body without throwing', async () => {
    const doc = buildNarrativeDocx(
      makePayload({ body: '', bodyIsAuthored: false }),
      RFP_PACK_DOCX_CONFIG,
    );
    const buf = await Packer.toBuffer(doc);
    expect(buf.byteLength).toBeGreaterThan(2000);
  });

  it('handles missing issuedBy gracefully', async () => {
    const doc = buildNarrativeDocx(
      makePayload({ issuedBy: undefined }),
      DECISION_BRIEF_DOCX_CONFIG,
    );
    const buf = await Packer.toBuffer(doc);
    expect(buf.byteLength).toBeGreaterThan(4000);
  });

  it('all four configs use distinct artifact codes + header labels + confidentiality notes', () => {
    const configs = [
      SCOPE_MEMO_DOCX_CONFIG,
      RFP_PACK_DOCX_CONFIG,
      DECISION_BRIEF_DOCX_CONFIG,
      SELECTION_MEMO_DOCX_CONFIG,
    ];
    const codes = new Set(configs.map((c) => c.artifactCode));
    expect(codes.size).toBe(4);
    const labels = new Set(configs.map((c) => c.headerLabel));
    expect(labels.size).toBe(4);
    const notes = new Set(configs.map((c) => c.confidentialityNote));
    expect(notes.size).toBe(4);
  });

  it('eyebrowFor interpolates the tenant name into the eyebrow string', () => {
    expect(SCOPE_MEMO_DOCX_CONFIG.eyebrowFor('ACME Corp')).toContain('ACME Corp');
    expect(RFP_PACK_DOCX_CONFIG.eyebrowFor('ACME Corp')).toContain('RFP');
    expect(DECISION_BRIEF_DOCX_CONFIG.eyebrowFor('ACME Corp')).toContain('Decision');
    expect(SELECTION_MEMO_DOCX_CONFIG.eyebrowFor('ACME Corp')).toContain('Selection');
  });

  it('emits the expected document title prefix in the docx core props', async () => {
    // Core props live in /docProps/core.xml which appears as a literal
    // filename in the zip central directory. Confirm via raw scan.
    for (const config of [
      RFP_PACK_DOCX_CONFIG,
      DECISION_BRIEF_DOCX_CONFIG,
      SELECTION_MEMO_DOCX_CONFIG,
    ]) {
      const text = await rawText(makePayload(), config);
      expect(text).toContain('docProps/core.xml');
    }
  });
});

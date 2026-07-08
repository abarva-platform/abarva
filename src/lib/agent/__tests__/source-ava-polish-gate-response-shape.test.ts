// Source aVa polish gate — Gap 2 regression.
//
// Live-found on the Source event canvas (surface `source-detail`):
//
//   1. A value-lever answer with real, correctly-grounded classified-value
//      data rendered as a run-on, unstructured line instead of a table:
//        "Lever | Type | Range Enhancement / change-order leakage |
//         Protected (risk hedge) | $12M–$18M Volume-band price flex-down |."
//      Root cause (verified): AgentMarkdown renders through react-markdown +
//      remark-gfm, which only recognizes a GFM table when there is a header
//      row, a "| --- | --- |" separator row, and one data row per line. The
//      garbled text had none of that — no separator row, rows collapsed onto
//      one line — so remark-gfm never built a table node and the literal `|`
//      characters rendered as plain-paragraph text. Neither
//      `stripChatMarkdownFormatting` nor `repairMalformedComparisonTables`
//      (which only targets the specific 4-column "Option | Strength |
//      Weakness | Fit" shape) touched this case.
//
//   2. A BAFO-ask answer where "Here is how I would frame the BAFO ask: 1."
//      appeared alone on its own line, with the actual ask text as a
//      disconnected orphaned paragraph below it — the model emitting a bare
//      numbered marker with no content on the same line, which markdown
//      treats as the start of a new, unrelated paragraph rather than a
//      continuation of item 1.
//
// This suite proves both the render-side safety-net repairs
// (repairRunOnPipeTableText / repairOrphanedNumberedMarkers, wired into
// shapeAgentResponseForSurface / shapeStreamingAgentTextForSurface) and pins
// that they run for the Source surface (which — unlike the compaction
// pipeline — is NOT bypassed for these specific repairs; only
// compactConsultantChatText is skipped for Source per VOICE.STRAT-2026-05-10f).

import {
  shapeAgentResponseForSurface,
  shapeStreamingAgentTextForSurface,
} from '../response-shape';

describe('Source aVa polish gate — Gap 2: value-lever table garbling', () => {
  it('reflows the exact live-found run-on pipe "table" into a clean bulleted list with no literal | characters', () => {
    const raw =
      'Lever | Type | Range Enhancement / change-order leakage | Protected (risk hedge) | $12M–$18M Volume-band price flex-down |.';

    const shaped = shapeAgentResponseForSurface('source-detail', raw);

    expect(shaped).not.toContain('|');
    // Each collapsed cell becomes its own clean bullet line — never a
    // run-on sentence and never a literal pipe character.
    expect(shaped).toContain('- Lever');
    expect(shaped).toContain('Enhancement / change-order leakage');
    expect(shaped).toContain('Protected (risk hedge)');
    expect(shaped).toContain('$12M–$18M Volume-band price flex-down');
    expect(shaped.split('\n').filter((l) => l.trim().length > 0)).toHaveLength(5);
  });

  it('also repairs the run-on during streaming (shapeStreamingAgentTextForSurface), not just at final flush', () => {
    const raw =
      'Lever | Type | Range Enhancement / change-order leakage | Protected (risk hedge) | $12M–$18M Volume-band price flex-down |.';

    const shaped = shapeStreamingAgentTextForSurface('source-detail', raw);

    expect(shaped).not.toContain('|');
    expect(shaped).toContain('- Lever');
  });

  it('does NOT touch a well-formed GFM table (header + separator row + data rows) — real tables render as-is', () => {
    const raw = [
      'Here is the lever breakdown:',
      '',
      '| Lever | Type | Range |',
      '| --- | --- | --- |',
      '| Enhancement / change-order leakage | Protected (risk hedge) | $12M–$18M |',
      '| Volume-band price flex-down | Incremental negotiated | $4M–$7M |',
    ].join('\n');

    const shaped = shapeAgentResponseForSurface('source-detail', raw);

    // The real table's rows must survive untouched (still pipe-delimited,
    // one row per line) — remark-gfm will render these correctly, so the
    // safety-net repair must not "fix" what isn't broken.
    expect(shaped).toContain('| Lever | Type | Range |');
    expect(shaped).toContain('| --- | --- | --- |');
    expect(shaped).toContain(
      '| Enhancement / change-order leakage | Protected (risk hedge) | $12M–$18M |',
    );
  });

  it('does not misfire on ordinary prose that happens to contain a stray "|" character', () => {
    const raw =
      'The vendor uses a build | deploy pipeline internally, but that is not relevant to the lever plan.';

    const shaped = shapeAgentResponseForSurface('source-detail', raw);

    expect(shaped).toContain('build | deploy pipeline');
  });

  it('reflows the run-on for the plain /source surface too (not just source-detail)', () => {
    const raw =
      'Lever | Type | Range Enhancement / change-order leakage | Protected (risk hedge) | $12M–$18M Volume-band price flex-down |.';

    const shaped = shapeAgentResponseForSurface('/source', raw);

    expect(shaped).not.toContain('|');
    expect(shaped).toContain('- Lever');
  });
});

describe('Source aVa polish gate — Gap 2: orphaned BAFO numbered-marker fragment', () => {
  it('joins a lone "1." marker onto the next paragraph instead of leaving it disconnected', () => {
    const raw = [
      'Here is how I would frame the BAFO ask:',
      '',
      '1.',
      '',
      'Ask Vendor B to hold the year-one unit rate flat and add a 5% volume-band step-down above the committed baseline, citing the should-cost gap.',
    ].join('\n');

    const shaped = shapeAgentResponseForSurface('source-detail', raw);

    expect(shaped).not.toMatch(/^\s*1\.\s*$/m);
    expect(shaped).toMatch(
      /1\.\s+Ask Vendor B to hold the year-one unit rate flat/,
    );
  });

  it('leaves a normal, well-formed numbered list alone', () => {
    const raw = [
      'Here is the plan:',
      '',
      '1. Hold the unit rate flat.',
      '2. Add a volume-band step-down.',
      '3. Cite the should-cost gap.',
    ].join('\n');

    const shaped = shapeAgentResponseForSurface('source-detail', raw);

    expect(shaped).toContain('1. Hold the unit rate flat.');
    expect(shaped).toContain('2. Add a volume-band step-down.');
    expect(shaped).toContain('3. Cite the should-cost gap.');
  });

  it('does not run the marker-join repair mid-stream (only at final flush)', () => {
    // Mid-stream, "the next paragraph" may not have arrived yet — joining
    // prematurely could attach the wrong content once more text streams in.
    // shapeStreamingAgentTextForSurface must leave a trailing lone marker
    // alone; only the final shapeAgentResponseForSurface pass joins it.
    const raw = ['Here is how I would frame the BAFO ask:', '', '1.'].join('\n');

    const shaped = shapeStreamingAgentTextForSurface('source-detail', raw);

    expect(shaped).toMatch(/1\.\s*$/);
  });
});

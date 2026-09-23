// ATLAS-HI-3-2026-05-30 — regression test for the response-shaper damage
// caught in the 2026-05-30 Atlas IaC E2E audit (14+ damaged turns across
// all three tenants). Pins the three damage patterns the audit captured:
//
//   1. Duplicated bullets:  "- Predictive next-edit. - Predictive next-edit."
//   2. Broken tables from prose with em dashes:
//        "There is a second pressure behind | returns fraud model
//         accuracy has slipped. | — | — |"
//   3. Mid-thought truncation of well-structured input
//
// Anchor doc: reports/2026-05-30-atlas-iac-e2e/ISSUES_CURATED.md  (HI-3)
// Companion : docs/releases/records/2026-05-30-atlas-response-shaper-fix.md

import { shapeAgentResponseForSurface } from '../response-shape';

describe('Atlas /tower response-shaper · HI-3 damage regressions', () => {
  describe('Damage class 1 · duplicated phrases from compactStepText fallback', () => {
    it('does not duplicate a step phrase when the sentence has no title/detail separator', () => {
      // Reproduces the "- Predictive next-edit. - Predictive next-edit."
      // audit pattern. Pre-fix, compactStepText's `?? clean` fallback made
      // title === detail for any short step sentence with no `:` or ` — `
      // separator. Post-fix, when detail collapses to the title, only the
      // title is rendered.
      const raw = [
        'The path forward is sequential and short.',
        'First, predictive next-edit.',
        'Then, ambient documentation.',
        'Finally, agentic refactor.',
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/tower', raw);

      // No phrase appears twice as ". X. X." inside a single bullet.
      expect(shaped).not.toMatch(/Predictive next-edit\.\s+Predictive next-edit\./i);
      expect(shaped).not.toMatch(/Ambient documentation\.\s+Ambient documentation\./i);
      expect(shaped).not.toMatch(/Agentic refactor\.\s+Agentic refactor\./i);
      // And no word should be immediately repeated as ". W W." across the
      // whole shaped output (catches the same class of bug generically).
      expect(shaped).not.toMatch(/\b(\w+(?:[-' ]\w+)?)\.\s+\1\./);
    });
  });

  describe('Damage class 2 · already-structured input is preserved', () => {
    it('passes through a pre-formed markdown table without packing prose into cells', () => {
      // Reproduces the "There is a second pressure behind | returns fraud
      // model accuracy has slipped. | — | — |" audit pattern. Pre-fix, the
      // extractComparisonItems regex greedily captured any "Word — Word"
      // sentence and packed surrounding prose into table cells. Post-fix,
      // looksAlreadyStructured detects existing tables and bypasses the
      // compactor entirely.
      const raw = [
        'Here is the pressure stack ranked by impact.',
        '',
        '| Pressure | Impact | Owner |',
        '|---|---|---|',
        '| Returns fraud | $2.4M monthly | Loss prevention |',
        '| Forecast drift | $1.8M weekly | Merchandising |',
        '| Stockouts | $900K weekly | Supply chain |',
        '',
        'There is a second pressure behind — returns fraud model accuracy has slipped from 91% to 84%.',
      ].join('\n');

      const shaped = shapeAgentResponseForSurface('/tower', raw);

      // The original table is preserved verbatim — no cell rebuild.
      expect(shaped).toContain('| Pressure | Impact | Owner |');
      expect(shaped).toContain('| Returns fraud | $2.4M monthly | Loss prevention |');
      expect(shaped).toContain('| Forecast drift | $1.8M weekly | Merchandising |');
      expect(shaped).toContain('| Stockouts | $900K weekly | Supply chain |');
      // No new comparison-table header has been synthesized from prose.
      expect(shaped).not.toContain('| Option | Strength | Weakness | Fit |');
      // The em-dash sentence is preserved as prose, NOT packed into a row.
      expect(shaped).toContain('returns fraud model accuracy has slipped');
      expect(shaped).not.toMatch(/\|\s*returns fraud model accuracy has slipped/i);
    });

    it('preserves the Atlas composition 4-section template without compaction', () => {
      // The composition layer (src/lib/atlas/composition/compose.ts) emits
      // a canonical 4-section response. Pre-fix, this got mangled by the
      // compactor when the LLM echoed it back. Post-fix, the section
      // markers trigger the structure bypass.
      const raw = [
        'Your data',
        'From your Tower ledger as of 2026-05-29: APX-04 is on-track, owned by the merchandising lead.',
        '',
        'Industry context',
        'Demand forecasting trend: rising; driver: retailer margin pressure (Gartner, 2026-Q1).',
        '',
        'The gap',
        'APX-04 is in line with the tenant middle on value attainment (52nd percentile).',
        '',
        'Next move',
        'Use the next governance gate to require owner sign-off on KPI movement.',
      ].join('\n');

      const shaped = shapeAgentResponseForSurface('/tower', raw);

      // All four section markers survive on their own lines.
      expect(shaped).toMatch(/^Your data$/m);
      expect(shaped).toMatch(/^Industry context$/m);
      expect(shaped).toMatch(/^The gap$/m);
      expect(shaped).toMatch(/^Next move$/m);
      // The body text is preserved — no auto-generated "- Evidence:" /
      // "- Missing:" template injection.
      expect(shaped).not.toMatch(/^- Evidence:/m);
      expect(shaped).not.toMatch(/^- Missing:/m);
      expect(shaped).toContain('APX-04 is on-track');
      expect(shaped).toContain('52nd percentile');
    });

    it('preserves a well-formed bullet list (3+ items) without rebuilding it', () => {
      // Pre-fix, the compactor would collapse a clean LLM bullet list into
      // its own template, dropping items and splitting sentences. Post-fix
      // the structure detector catches it.
      const raw = [
        'Three pressures are stacked on APX-04 this week.',
        '- Returns fraud — model accuracy dropped from 91% to 84% over the last 30 days.',
        '- Forecast drift — MAPE widened from 18% to 24% week-over-week.',
        '- Stockouts — 12 SKUs went out of stock against a 4-SKU baseline.',
      ].join('\n');

      const shaped = shapeAgentResponseForSurface('/tower', raw);

      // All three original bullets survive intact.
      expect(shaped).toMatch(/^- Returns fraud/m);
      expect(shaped).toMatch(/^- Forecast drift/m);
      expect(shaped).toMatch(/^- Stockouts/m);
      // No "Option | Strength | Weakness | Fit |" table has been
      // synthesized from the em-dash separators.
      expect(shaped).not.toContain('| Option | Strength | Weakness | Fit |');
    });
  });

  describe('Damage class 3 · sentence integrity preserved (no mid-thought truncation of structured input)', () => {
    it('does not split a complete sentence across broken table cells', () => {
      // Reproduces the audit pattern where a sentence containing an em
      // dash and commas was disassembled into table-cell fragments. The
      // shaper must NOT produce a row where the cells, concatenated,
      // would have to be re-stitched to recover the original meaning.
      const raw = [
        'There is a second pressure behind APX-04: returns fraud model accuracy has slipped from 91% to 84%, the markdown rate has climbed from 11% to 14.2%, and inventory turns are flat at 3.6x against a 4.0x target.',
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/tower', raw);

      // The original sentence — or its meaningful spans — is preserved
      // as prose, not packed into a fake comparison table.
      expect(shaped).not.toMatch(/\|.*returns fraud model accuracy has slipped.*\|/);
      expect(shaped).not.toMatch(/\|.*the markdown rate has climbed.*\|/);
      expect(shaped).not.toMatch(/\|.*inventory turns are flat.*\|/);
    });

    it('does not end compacted Tower lines on dangling conjunctions or connective fragments', () => {
      // L6 Wave 0 retest caught two executive-answer endings that were
      // syntactically damaged after the Tower compactor trimmed a sentence:
      //   - "or to proceed with."
      //   - "and."
      // The shaper may compact loose prose, but the final line still has to
      // read as a complete executive sentence.
      const raw = [
        'The highest-priority decision is whether the current value evidence is strong enough to let SkyHarbor treat the portfolio as governed rather than only inventoried.',
        'Evidence: $606M is flagged as exposed value across the Tower view, 16 of 16 pressure cards mention value-lag risk, and the cited operating picture depends on initiative-level measured-value rows.',
        'Missing: verified realized value, finance-attested baseline, tracked attainment, and owner-signed measurement method are not loaded yet.',
        'Next: require the governance forum to decide whether the portfolio is allowed to keep using the $606M figure, whether to pause dependent executive claims, or to proceed with a narrowed evidence-only read until Finance signs the baseline.',
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/tower', raw);

      expect(shaped).not.toMatch(/\bor to proceed with\.$/m);
      expect(shaped).not.toMatch(/\band\.$/m);
      expect(shaped).not.toMatch(/\b(with|and|or|but|to|of|for|against)\.$/m);
    });

    it('does not synthesize a broken comparison table for the SkyHarbor P1 decision answer', () => {
      // L6 Wave 0 retest against the deployed preview saw this answer
      // compacted into "| Option | Strength | Weakness | Fit |" rows,
      // ending on "re-baseline now vs." The prompt is a decision read,
      // not a vendor/path comparison, so the synthetic comparison table
      // should not run.
      const raw = [
        'The read: Tower is signaling one decision, not many.',
        'Every active pressure — 16 of 16 — is a value-lag flag, and the portfolio ROI is un-instrumented.',
        'Authorize a portfolio-wide value re-baseline — start with the three HIGH-confidence pressures: SHA-012 Data Product Catalog, SHA-023 Baggage, and SHA-034 Maintenance.',
        'The actual choice — re-baseline now vs. letting executive claims continue before Finance signs the baseline.',
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/tower', raw);

      expect(shaped).not.toContain('| Option | Strength | Weakness | Fit |');
      expect(shaped).not.toMatch(/\bvs\.$/m);
      expect(shaped).not.toMatch(/\bre-baseline now vs\.\s*(?:\n|$)/i);
      expect(shaped).toContain('re-baseline now vs. letting executive claims continue');
    });

    it('does not truncate the SkyHarbor P3 assumption warning into has/no fragments', () => {
      // L6 Wave 0 retest saw a malformed table row that repeated and
      // truncated "not because SkyHarbor has no..." The answer is a set
      // of assumptions to avoid, not a comparison matrix.
      const raw = [
        'Good question to ask before a governance review.',
        'Treat it as a hypothesis — over-promised business cases or under-instrumented adoption telemetry, not a finding.',
        '90d shows 0 and vendor count looks empty — but that is because no vendor records are loaded, not because SkyHarbor has no vendor estate.',
        'Do not assume adoption is weak at 39% until the telemetry source and tracked attainment field are reconciled.',
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/tower', raw);

      expect(shaped).not.toContain('| Option | Strength | Weakness | Fit |');
      expect(shaped).not.toMatch(/\bSkyHarbor has\.$/m);
      expect(shaped).not.toMatch(/\bSkyHarbor has no\.$/m);
      expect(shaped).not.toMatch(/\b(has|no|and|or|but)\.$/m);
    });

    it('repairs malformed option tables emitted by live SkyHarbor P1 output', () => {
      // Production retest after the first hotfix showed the LLM/table
      // preservation path could still keep a malformed comparison table:
      // "Which room are you walking" was rendered as an Option. The
      // response shaper should degrade that table to prose instead.
      const raw = [
        "The read: Your highest-priority decision isn't picking one program to fix — it's deciding whether to re-baseline the portfolio's value math before",
        '',
        '| Option | Strength | Weakness | Fit |',
        '|---|---|---|---|',
        "| SHA-012 Data Product Catalog Adoption | it's the only HIGH-confidence value-lag card, and adoption is a foundational dependency. | — | — |",
        '| Which room are you walking | finance or delivery? | — | — |',
        '',
        'But projected, tracked attainment, and verified realized value are all missing from the aggregate — so the gap is partly a measurement artifact, not just performance.',
      ].join('\n');

      const shaped = shapeAgentResponseForSurface('/tower', raw);

      expect(shaped).not.toContain('| Option | Strength | Weakness | Fit |');
      expect(shaped).not.toMatch(/\bbefore\s*(?:\n|$)/i);
      expect(shaped).toContain('SHA-012 Data Product Catalog Adoption');
      expect(shaped).toContain('Question: finance or delivery?');
    });

    it('does not duplicate an existing Next label in Tower output', () => {
      const raw = [
        'Every flagged initiative shows measured value above committed.',
        'Evidence: Until projected vs. committed vs. realized are reconciled, treat the 16 value-lag flags as a measurement question, not a delivery verdict.',
        'Next: open the cited initiative, signal, or evidence item in Tower and assign the owner for the first missing decision input.',
      ].join(' ');

      const shaped = shapeAgentResponseForSurface('/tower', raw);

      expect(shaped).toContain('Next: open the cited initiative');
      expect(shaped).not.toContain('- Next: - Next:');
      expect(shaped).not.toContain('Next: Next:');
    });
  });

  // C-502 / C-501 / C-500 — the SECOND compactor.
  //
  // `shouldCompactSurface` was narrowed so that advisor surfaces (Source,
  // Tower, Strategic Moves, Intelligence) never run the
  // compactConsultantChatText template. That narrowing is real and the
  // guard in response-shape.test.ts holds it. But it only ever governed
  // ONE of the two compactors this module reaches.
  //
  // `shapeAgentResponseForSurface` also calls `shapeSharedAdvisorResponse`,
  // which runs `compactForChat(text, targetChars=900, maxParagraphs=5)`
  // whenever `preserveStructure` is false. `preserveStructure` was computed
  // from `looksAlreadyStructured()` alone — a detector that only recognises
  // pipe tables, Atlas section headers, 3+ bullets or 3+ numbered lines.
  //
  // A Brief C advisor answer is none of those by design: it is prose
  // paragraphs. So a multi-paragraph advisor answer longer than 900 chars
  // took the shared compactor by construction, on a surface whose whole
  // contract is that it must not be compacted. Measured on the verbatim
  // Brief C vendor shortlist: 1,361 chars in, 229 chars out — the second
  // vendor, the third vendor and the closing recommendation absent from
  // the output entirely.
  //
  // These cases are written against the two surfaces, not against the one
  // fixture, so the guard cannot drift back per-surface: the same defect
  // is latent on /tower for any prose answer over the target, and the
  // existing /tower cases above never reached it because every one of
  // their fixtures is under 900 chars or already structured.
  describe('Damage class 4 · shared-shaper compaction of advisor prose (C-502)', () => {
    // Three options, each a paragraph, no list markup — the shape Brief C
    // asks for. 1,000+ chars, so it is over the shared shaper's 900-char
    // target and under no circumstance may be summarised away.
    const MULTI_OPTION_ADVISOR_PROSE = [
      'Three credible vendors for your specific situation, with my read on each:',
      '',
      "Northwind Analytics is the strongest fit at the capability level. They have the most mature multi-banner specialty retail playbook, the customer evidence is deep, and they have been at this long enough to have real implementation patterns rather than learning on your budget. The trade-off is that they are a bigger ship and less likely to customise deeply for your specific banner structure.",
      '',
      'Harborline Systems is a credible second. Strong work in adjacent retail, and their assortment work specifically is more recent, with fewer documented case studies at multi-banner specialty. Their financial health appears stable and customer references are strong. Worth shortlisting if you want a partner that will customise more aggressively.',
      '',
      'Kestrel Forecasting is the credible third. Forecasting and assortment combined, which matches the integrated work you described. The caveat is a smaller team and a narrower customer base, so I would shortlist them for a competitive bid but be careful about depending on them as the sole vendor.',
      '',
      'I would drop the bigger horizontal players. Capability is broader but assortment is not their lead, and you would be paying for things you do not need.',
    ].join('\n');

    it('preserves every option of a multi-option shortlist on the source surface', () => {
      expect(MULTI_OPTION_ADVISOR_PROSE.length).toBeGreaterThan(900);

      const shaped = shapeAgentResponseForSurface('source', MULTI_OPTION_ADVISOR_PROSE);

      // Every option the model recommended reaches the reader. Pre-fix the
      // output stopped after the first option's opening sentence.
      expect(shaped).toContain('Northwind Analytics is the strongest fit');
      expect(shaped).toContain('Harborline Systems is a credible second');
      expect(shaped).toContain('Kestrel Forecasting is the credible third');
      expect(shaped).toContain('I would drop the bigger horizontal players');
      // Not restructured into the shared shaper's lead-plus-bullets shape.
      expect(shaped).not.toMatch(/^- (?:Evidence|Missing|Next|Question):/m);
    });

    it('preserves the same prose on /tower, where the defect is latent rather than reported', () => {
      // The /tower cases above pass today only because their fixtures are
      // short or already structured. Nothing in the shaper treats /tower
      // differently from source, so the same input must survive here.
      const shaped = shapeAgentResponseForSurface('/tower', MULTI_OPTION_ADVISOR_PROSE);

      expect(shaped).toContain('Harborline Systems is a credible second');
      expect(shaped).toContain('Kestrel Forecasting is the credible third');
      expect(shaped).toContain('I would drop the bigger horizontal players');
    });

    it('does not lose content merely because the answer crosses the 900-char target', () => {
      // States the rule the fix must satisfy independently of any one
      // phrase: for a non-compacting surface, no span of the input is
      // dropped. Compared span by span rather than by length, so a fix
      // that merely raised the target would still have to preserve each.
      //
      // Compared with whitespace collapsed, and that distinction is
      // deliberate rather than a loosened assertion. The shaper DOES
      // re-wrap: a downstream paragraph pass moves the closing sentence of
      // the second option onto its own line, so the output is one
      // character longer than the input (1,262 vs 1,261) and no paragraph
      // matches verbatim. That is re-wrapping, which this case is not
      // about; a verbatim comparison would report it as content loss and
      // hide the thing the case exists to measure. Every character of
      // every span still has to be present, in order, so a genuine drop
      // still fails here.
      const collapse = (value: string) => value.replace(/\s+/g, ' ').trim();
      const shaped = collapse(shapeAgentResponseForSurface('source', MULTI_OPTION_ADVISOR_PROSE));
      const spans = MULTI_OPTION_ADVISOR_PROSE.split('\n')
        .map(collapse)
        .filter(Boolean);
      const dropped = spans.filter((span) => !shaped.includes(span));

      expect(dropped).toEqual([]);
    });

    it('STILL compacts a declared form surface — the fix must not widen past advisor surfaces', () => {
      // Negative control. `setup` is one of the four surfaces
      // `shouldCompactSurface` deliberately KEEPS ("dashboard / form, not
      // advisor chat"). Its truth is that declared list, not this fix. If a
      // repair disables compaction globally instead of per-surface, this
      // fails.
      const shaped = shapeAgentResponseForSurface('setup', MULTI_OPTION_ADVISOR_PROSE);

      expect(shaped.length).toBeLessThan(MULTI_OPTION_ADVISOR_PROSE.length);
      expect(shaped).not.toContain('Kestrel Forecasting is the credible third');
    });
  });
});

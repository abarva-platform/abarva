// Moves Expert Kernel exports — DOCX renderer.
//
// Renders the narrative kernel deliverables as a Word document: the Discover
// brief, the Charter business-case skeleton, the Design & Plan costed
// business-case pack, and the Mobilize & go-decision packet. CFO-readable
// prose — recommendation, baseline with sources, assumptions, sensitivity,
// kill criteria, critic findings, evidence and seed gaps.
//
// HARD RULE (spec §10.2): no fabrication. Every figure comes from a kernel
// object. A null / seed-gap value renders the explicit SEED_GAP_MARKER line.
// A `kill` verdict or a null payback is stated plainly — the document is
// honest, not flattering.
//
// Pure module: deterministic, no I/O. The route serializes via Packer.

import 'server-only';

import {
  Document,
  Paragraph,
  Table,
  type ISectionOptions,
} from 'docx';

import {
  SOURCE_DOCX,
  bodyParagraph,
  bodyRun,
  boldRun,
  coverSubtitleParagraph,
  coverTitleParagraph,
  eyebrowParagraph,
  heading1,
  heading2,
  italicRun,
} from '@/lib/exports-shared/docx-base';
import {
  buildMultiColumnTable,
  buildKeyValueTable,
} from '@/lib/exports-shared/structured-docx-base';

import type { BusinessCaseSkeleton } from '../business-case-compiler';
import type { ExpertReviewCaseEntry } from '../expert-review-cases';
import type { KernelArtifactEntry } from './artifact-catalog';
import {
  HONESTY_FOOTER,
  SEED_GAP_MARKER,
  numberOrGap,
  paybackText,
  pct,
  recommendationLabel,
  usd,
  usdRange,
  valueWithUnit,
} from './format-helpers';

/** A document child — a paragraph or a table. The section helpers and the
 *  body assemblers both produce arrays of these; docx accepts the mix. */
type DocChild = Paragraph | Table;

/** Input to the DOCX renderer — the case entry and the resolved artifact. */
export interface KernelDocxInput {
  caseEntry: ExpertReviewCaseEntry;
  artifact: KernelArtifactEntry;
  /** ISO date the document was generated. */
  generatedOn: string;
}

// ── Small paragraph helpers ────────────────────────────────────────────────

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 30, after: 30 },
    children: [bodyRun(text)],
  });
}

function labelledBullet(label: string, body: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 30, after: 30 },
    children: [boldRun(`${label}: `), bodyRun(body)],
  });
}

function calloutParagraph(text: string): Paragraph {
  return new Paragraph({
    shading: { fill: 'FFF4D6', type: 'clear', color: 'auto' },
    spacing: { before: 80, after: 80, line: 300 },
    indent: { left: 120, right: 120 },
    children: [bodyRun(text, { color: '7A5800' })],
  });
}

// ── Cover block ────────────────────────────────────────────────────────────

function coverBlock(input: KernelDocxInput): Paragraph[] {
  const { caseEntry, artifact, generatedOn } = input;
  return [
    eyebrowParagraph('AbarVa · Moves · Expert Kernel'),
    coverTitleParagraph(artifact.label),
    coverSubtitleParagraph(`${caseEntry.moveLabel} — ${caseEntry.tenantLabel}`),
    coverSubtitleParagraph(
      `Tenant key ${caseEntry.tenantKey} · Move ref ${caseEntry.moveRef}`,
    ),
    coverSubtitleParagraph(`Generated ${generatedOn}`),
    new Paragraph({
      spacing: { before: 120, after: 80 },
      children: [italicRun(artifact.description, { color: SOURCE_DOCX.MUTED_COLOR })],
    }),
  ];
}

// ── Reusable kernel-object sections ────────────────────────────────────────

/** The baseline metrics table — recorded metrics and seed gaps, honest. */
function baselineSection(skeleton: BusinessCaseSkeleton): DocChild[] {
  const out: Paragraph[] = [heading2('Current-state baseline')];
  out.push(
    bodyParagraph([
      bodyRun(
        `Coverage: ${pct(skeleton.baseline.coverage)} of metrics are ` +
          `recorded; ${skeleton.baseline.seedGaps.length} declared seed ` +
          `gap(s). Every recorded figure carries its source.`,
      ),
    ]),
  );
  const table = buildMultiColumnTable({
    columns: [
      { header: 'Metric', widthPercent: 24, extract: (m) => m.label },
      {
        header: 'Value',
        widthPercent: 18,
        extract: (m) =>
          m.recorded ? valueWithUnit(m.value, m.unit) : SEED_GAP_MARKER,
      },
      { header: 'Source', widthPercent: 30, extract: (m) => m.source },
      {
        header: 'Quality / confidence',
        widthPercent: 14,
        extract: (m) => `${m.sourceQuality} / ${m.confidence}`,
      },
      { header: 'As of', widthPercent: 14, extract: (m) => m.asOf },
    ],
    rows: skeleton.baseline.metrics,
    rowStyle: (m) => (m.recorded ? undefined : 'warning'),
  });
  return [
    ...out,
    new Paragraph({ children: [], spacing: { before: 60 } }),
    new Paragraph({ children: [], spacing: { after: 60 } }),
    ...wrapTable(table),
  ];
}

/** docx tables cannot live directly in a children array of paragraphs in our
 *  helper flow — we collect them via a tagged wrapper the section assembler
 *  flattens. To keep the renderer simple every section returns Paragraphs and
 *  Tables interleaved; `wrapTable` just yields the table as a single-element
 *  array so callers can spread it. */
function wrapTable(table: ReturnType<typeof buildMultiColumnTable>): [typeof table] {
  return [table];
}

/** Seed-gap detail — every absent metric with its declared reason. */
function seedGapSection(skeleton: BusinessCaseSkeleton): DocChild[] {
  const gaps = skeleton.baseline.seedGaps;
  if (gaps.length === 0) {
    return [
      heading2('Seed gaps'),
      bodyParagraph([bodyRun('No seed gaps — the baseline is fully recorded.')]),
    ];
  }
  const out: Paragraph[] = [
    heading2('Seed gaps — declared, not fabricated'),
    bodyParagraph([
      bodyRun(
        'These inputs are not recorded in the tenant substrate. The kernel ' +
          'declares each one and does not invent a value for it.',
      ),
    ]),
  ];
  for (const g of gaps) {
    out.push(
      labelledBullet(g.label, g.seedGapReason ?? 'Not recorded.'),
    );
  }
  return out;
}

/** Assumptions section — ledger with the top movers flagged. */
function assumptionsSection(skeleton: BusinessCaseSkeleton): DocChild[] {
  const out: Paragraph[] = [heading2('Named assumptions')];
  const moverKeys = new Set(skeleton.assumptions.topMovers.map((a) => a.key));
  out.push(
    bodyParagraph([
      bodyRun(
        'Every estimate rests on assumptions; the kernel makes them first-' +
          'class. The three flagged TOP MOVERS move roughly 80% of the case.',
      ),
    ]),
  );
  for (const a of skeleton.assumptions.byImpact) {
    const tags: string[] = [];
    if (moverKeys.has(a.key)) tags.push('TOP MOVER');
    if (a.isSeedGapProxy) tags.push('SEED-GAP PROXY');
    out.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 40, after: 20 },
        children: [
          boldRun(`${a.key}`),
          tags.length > 0
            ? bodyRun(`  [${tags.join(' · ')}]`, { color: '8B1F0F' })
            : bodyRun(''),
        ],
      }),
    );
    out.push(
      new Paragraph({
        indent: { left: 360 },
        spacing: { before: 0, after: 10 },
        children: [bodyRun(a.statement)],
      }),
    );
    out.push(
      new Paragraph({
        indent: { left: 360 },
        spacing: { before: 0, after: 40 },
        children: [
          bodyRun(
            `Owner: ${a.owner} · confidence: ${a.confidence} · ` +
              `sensitivity impact: ${a.sensitivityImpact} · source: ${a.source}`,
            { color: SOURCE_DOCX.MUTED_COLOR, size: 19 },
          ),
        ],
      }),
    );
  }
  return out;
}

/** Sensitivity section — base/conservative/upside plus what-breaks. */
function sensitivitySection(skeleton: BusinessCaseSkeleton): DocChild[] {
  const s = skeleton.sensitivity;
  return [
    heading2('Sensitivity — base, conservative, upside'),
    ...wrapTable(
      buildKeyValueTable({
        rows: [
          { label: 'Base net return', value: usd(s.base.point) },
          { label: 'Conservative net return', value: usd(s.conservative.point) },
          { label: 'Upside net return', value: usd(s.upside.point) },
        ],
        labelWidth: 40,
      }),
    ),
    new Paragraph({ children: [], spacing: { after: 80 } }),
    bodyParagraph([boldRun('What breaks the case: '), bodyRun(s.whatBreaksTheCase)]),
  ];
}

/** Kill criteria section. */
function killCriteriaSection(skeleton: BusinessCaseSkeleton): DocChild[] {
  const out: Paragraph[] = [heading2('Stop / kill criteria')];
  if (skeleton.killCriteria.length === 0) {
    out.push(bodyParagraph([bodyRun('No kill criteria recorded.')]));
    return out;
  }
  for (const k of skeleton.killCriteria) {
    out.push(labelledBullet(k.code, k.condition));
  }
  return out;
}

/** Critic findings — surfaced verbatim, never hidden. */
function criticSection(skeleton: BusinessCaseSkeleton): DocChild[] {
  const out: Paragraph[] = [heading2('Critic findings — surfaced, not hidden')];
  if (skeleton.critic.findings.length === 0) {
    out.push(bodyParagraph([bodyRun('The critic raised no findings.')]));
    return out;
  }
  for (const f of skeleton.critic.findings) {
    out.push(
      labelledBullet(`[${f.severity} / ${f.lens}] ${f.code}`, f.message),
    );
  }
  return out;
}

/** Recommendation block — stated plainly, including kill / not-monetisable. */
function recommendationSection(skeleton: BusinessCaseSkeleton): DocChild[] {
  return [
    heading2('Recommendation'),
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [
        boldRun('Verdict: ', { size: 26 }),
        boldRun(recommendationLabel(skeleton.recommendation), {
          size: 26,
          color: skeleton.recommendation === 'fund' ? '1B5E20' : '8B1F0F',
        }),
      ],
    }),
    bodyParagraph([bodyRun(skeleton.recommendationRationale)]),
    ...wrapTable(
      buildKeyValueTable({
        rows: [
          {
            label: 'Investment (effort)',
            value: usdRange(skeleton.economics.investment),
          },
          {
            label: 'Net return',
            value: usdRange(skeleton.economics.netReturn),
          },
          {
            label: 'Net value (post-haircut, 3yr)',
            value: usdRange(skeleton.valueRange),
          },
          { label: 'Payback', value: paybackText(skeleton) },
          {
            label: 'Monetisable',
            value: skeleton.economics.monetisable ? 'Yes' : 'No',
          },
        ],
        labelWidth: 36,
      }),
    ),
  ];
}

/** Tower measurement-handoff section from the skeleton. */
function towerHandoffSection(skeleton: BusinessCaseSkeleton): DocChild[] {
  const out: Paragraph[] = [heading2('What Tower will measure')];
  for (const m of skeleton.towerHandoff) {
    out.push(
      labelledBullet(
        m.metricLabel,
        `baseline ${numberOrGap(m.baselineValue)} → target ` +
          `${numberOrGap(m.targetValue)} ${m.unit}. ${m.readinessNote}`,
      ),
    );
  }
  return out;
}

function honestyFooter(): DocChild[] {
  return [
    new Paragraph({ children: [], spacing: { before: 200 } }),
    new Paragraph({
      border: {
        top: { style: 'single', size: 4, color: 'D8D5CC', space: 8 },
      },
      spacing: { before: 120, after: 40 },
      children: [italicRun(HONESTY_FOOTER, { color: SOURCE_DOCX.MUTED_COLOR, size: 18 })],
    }),
  ];
}

// ── Per-artifact body assemblers ───────────────────────────────────────────

/** Discover brief — problem, baseline, opportunity, go/no-go. */
function discoverBody(caseEntry: ExpertReviewCaseEntry): DocChild[] {
  const { skeleton } = caseEntry.buildCase();
  return [
    heading1('Discover — problem, baseline, opportunity, go/no-go'),
    bodyParagraph([
      boldRun('Move: '),
      bodyRun(`${skeleton.moveName} (${skeleton.tenantKey})`),
    ]),
    calloutParagraph(
      'Discover establishes the current state honestly before any solution ' +
        'is shaped. The opportunity can only be stated as far as the ' +
        'recorded baseline allows; declared seed gaps bound it.',
    ),
    ...baselineSection(skeleton),
    ...seedGapSection(skeleton),
    heading2('Opportunity & go/no-go read'),
    bodyParagraph([bodyRun(skeleton.sensitivity.whatBreaksTheCase)]),
    ...recommendationSection(skeleton),
    ...honestyFooter(),
  ];
}

/** Charter — value hypothesis, case skeleton, kill criteria. */
function charterBody(caseEntry: ExpertReviewCaseEntry): DocChild[] {
  const { skeleton } = caseEntry.buildCase();
  return [
    heading1('Charter — quantified value hypothesis & business-case skeleton'),
    bodyParagraph([
      boldRun('Move: '),
      bodyRun(`${skeleton.moveName} (${skeleton.tenantKey})`),
    ]),
    ...recommendationSection(skeleton),
    ...baselineSection(skeleton),
    ...assumptionsSection(skeleton),
    ...sensitivitySection(skeleton),
    ...killCriteriaSection(skeleton),
    ...criticSection(skeleton),
    ...towerHandoffSection(skeleton),
    ...honestyFooter(),
  ];
}

/** Design & Plan — the full costed business-case pack. */
function businessCasePackBody(caseEntry: ExpertReviewCaseEntry): DocChild[] {
  const { fullCase } = caseEntry.buildFullCase();
  const { skeleton } = fullCase;
  const out: DocChild[] = [
    heading1('Design & Plan — costed business-case pack'),
    bodyParagraph([
      boldRun('Move: '),
      bodyRun(`${fullCase.moveName} (${fullCase.tenantKey})`),
    ]),
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [
        boldRun('Verdict: ', { size: 26 }),
        boldRun(recommendationLabel(fullCase.recommendation), {
          size: 26,
          color: fullCase.recommendation === 'fund' ? '1B5E20' : '8B1F0F',
        }),
      ],
    }),
    bodyParagraph([bodyRun(fullCase.recommendationRationale)]),
    heading2('Investment & return'),
    ...wrapTable(
      buildKeyValueTable({
        rows: [
          { label: 'Investment (costed roadmap)', value: usdRange(fullCase.investment) },
          { label: 'Net return', value: usdRange(fullCase.netReturn) },
          {
            label: 'Payback',
            value:
              fullCase.paybackMonths === null
                ? paybackText(skeleton)
                : `${fullCase.paybackMonths} months (base case)`,
          },
        ],
        labelWidth: 38,
      }),
    ),
    heading2('AI-build vs. business-change effort'),
    ...wrapTable(
      buildKeyValueTable({
        rows: [
          { label: 'AI-build effort', value: usd(fullCase.buildVsChange.aiBuildCost) },
          {
            label: 'Business-change effort',
            value: usd(fullCase.buildVsChange.businessChangeCost),
          },
          {
            label: 'Business-change share',
            value: pct(fullCase.buildVsChange.businessChangeFraction),
          },
        ],
        labelWidth: 38,
      }),
    ),
    new Paragraph({ spacing: { before: 40, after: 40 }, children: [] }),
    bodyParagraph([bodyRun(fullCase.buildVsChange.note)]),
    heading2('Costed roadmap — per-phase investment & value'),
    ...wrapTable(
      buildMultiColumnTable({
        columns: [
          { header: 'Phase', widthPercent: 30, extract: (p) => p.phaseLabel },
          {
            header: 'Investment',
            widthPercent: 16,
            extract: (p) => usd(p.investment),
          },
          {
            header: 'Cumulative',
            widthPercent: 16,
            extract: (p) => usd(p.cumulativeInvestment),
          },
          {
            header: 'Annual value unlocked',
            widthPercent: 18,
            extract: (p) => usd(p.annualValueUnlocked),
          },
          {
            header: 'Foundational',
            widthPercent: 20,
            extract: (p) => (p.isFoundational ? 'Yes — enablement only' : 'No'),
          },
        ],
        rows: fullCase.phaseProfile,
      }),
    ),
    heading2('Three-scenario sensitivity'),
    ...wrapTable(
      buildMultiColumnTable({
        columns: [
          { header: 'Scenario', widthPercent: 22, extract: (s) => s.label },
          {
            header: 'Investment',
            widthPercent: 20,
            extract: (s) => usd(s.scenario.investment),
          },
          {
            header: 'Net value',
            widthPercent: 19,
            extract: (s) => usd(s.scenario.netValue),
          },
          {
            header: 'Net return',
            widthPercent: 19,
            extract: (s) => usd(s.scenario.netReturn),
          },
          {
            header: 'ROI',
            widthPercent: 20,
            extract: (s) =>
              s.scenario.roi === null ? SEED_GAP_MARKER : `${s.scenario.roi}×`,
          },
        ],
        rows: [
          { label: 'Base', scenario: fullCase.sensitivity.base },
          { label: 'Conservative', scenario: fullCase.sensitivity.conservative },
          { label: 'Upside', scenario: fullCase.sensitivity.upside },
        ],
      }),
    ),
    new Paragraph({ spacing: { before: 60, after: 40 }, children: [] }),
    bodyParagraph([
      boldRun('What breaks the case: '),
      bodyRun(fullCase.sensitivity.whatBreaksTheCase),
    ]),
    bodyParagraph([
      boldRun('Downside read: '),
      bodyRun(fullCase.sensitivity.downsideRead),
    ]),
    heading2('Human + agent RACI — decision rights'),
    bodyParagraph([
      bodyRun(
        fullCase.raci.valid
          ? 'The RACI matrix passes every honesty rule — it is governable as ' +
            'drawn.'
          : `The RACI matrix has ${fullCase.raci.violations.length} ` +
            'unresolved honesty violation(s) — see flags below.',
      ),
    ]),
    ...wrapTable(
      buildMultiColumnTable({
        columns: [
          { header: 'Decision', widthPercent: 40, extract: (d) => d.decision },
          { header: 'Kind', widthPercent: 16, extract: (d) => d.kind },
          {
            header: 'Accountable',
            widthPercent: 24,
            extract: (d) =>
              fullCase.raci.parties.find((p) => p.id === d.accountablePartyId)
                ?.name ?? d.accountablePartyId,
          },
          {
            header: 'Responsible',
            widthPercent: 20,
            extract: (d) =>
              d.responsiblePartyIds
                .map(
                  (id) =>
                    fullCase.raci.parties.find((p) => p.id === id)?.name ?? id,
                )
                .join('; '),
          },
        ],
        rows: fullCase.raci.decisions,
      }),
    ),
  ];
  out.push(heading2('Surfaced flags — roadmap, RACI, critic'));
  if (fullCase.flags.length === 0) {
    out.push(bodyParagraph([bodyRun('No structural flags raised.')]));
  } else {
    for (const f of fullCase.flags) out.push(bullet(f));
  }
  out.push(...assumptionsSection(skeleton));
  out.push(...killCriteriaSection(skeleton));
  out.push(...towerHandoffSection(skeleton));
  out.push(...honestyFooter());
  return out;
}

/** Mobilize — mobilization plan, adoption, measurement model, go-decision. */
function mobilizePackBody(caseEntry: ExpertReviewCaseEntry): DocChild[] {
  const { adoption, measurement, goPack } = caseEntry.buildMobilize();
  const { skeleton } = caseEntry.buildCase();
  const out: DocChild[] = [
    heading1('Mobilize & Handoff — adoption, measurement, go-decision'),
    bodyParagraph([
      boldRun('Move: '),
      bodyRun(`${goPack.moveName} (${goPack.tenantKey})`),
    ]),
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [
        boldRun('Go-decision: ', { size: 26 }),
        boldRun(goPack.decision.toUpperCase().replace('_', ' '), {
          size: 26,
          color: goPack.decision === 'go' ? '1B5E20' : '8B1F0F',
        }),
      ],
    }),
    bodyParagraph([bodyRun(goPack.rationale)]),
    heading2('Mobilize readiness'),
    ...wrapTable(
      buildKeyValueTable({
        rows: [
          {
            label: 'Owned (named operating-model owner)',
            value: goPack.readiness.owned ? 'Yes' : 'NO',
          },
          {
            label: 'Adoptable (change approach supports the curve)',
            value: goPack.readiness.adoptable ? 'Yes' : 'NO',
          },
          {
            label: 'Measurable (value loop closes to Tower)',
            value: goPack.readiness.measurable ? 'Yes' : 'NO',
          },
          {
            label: 'Operating-model owner',
            value: adoption.operatingModelOwner ?? 'NOT NAMED',
          },
          { label: 'Overall change load', value: adoption.overallChangeLoad },
          {
            label: 'Adoption confidence',
            value: String(adoption.adoptionConfidence),
          },
          {
            label: 'Hypercare window',
            value: `${adoption.hypercareWeeks} week(s)`,
          },
        ],
        labelWidth: 46,
      }),
    ),
  ];
  if (goPack.firedKillTriggers.length > 0) {
    out.push(heading2('Fired kill triggers — verbatim'));
    for (const f of goPack.firedKillTriggers) {
      out.push(labelledBullet(f.trigger.code, f.observation));
      out.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { before: 0, after: 40 },
          children: [
            bodyRun(`Fix-condition: ${f.trigger.fixCondition}`, {
              color: SOURCE_DOCX.MUTED_COLOR,
              size: 19,
            }),
          ],
        }),
      );
    }
  }
  if (goPack.conditions.length > 0) {
    out.push(heading2('Conditions to clear'));
    for (const c of goPack.conditions) {
      out.push(labelledBullet(c.code, c.condition));
    }
  }
  out.push(heading2('Adoption & change approach — seven dimensions'));
  out.push(
    ...wrapTable(
      buildMultiColumnTable({
        columns: [
          { header: 'Dimension', widthPercent: 20, extract: (d) => d.dimension },
          { header: 'Magnitude', widthPercent: 12, extract: (d) => d.magnitude },
          {
            header: 'Recommendation',
            widthPercent: 48,
            extract: (d) => d.recommendation,
          },
          { header: 'Owner', widthPercent: 20, extract: (d) => d.ownerRole },
        ],
        rows: adoption.dimensions,
      }),
    ),
  );
  out.push(heading2('Impacted roles'));
  out.push(
    ...wrapTable(
      buildMultiColumnTable({
        columns: [
          { header: 'Role', widthPercent: 24, extract: (r) => r.role },
          {
            header: 'Headcount',
            widthPercent: 16,
            extract: (r) =>
              r.headcount === null
                ? SEED_GAP_MARKER
                : String(r.headcount),
          },
          { header: 'Change', widthPercent: 14, extract: (r) => r.changeMagnitude },
          { header: 'What changes', widthPercent: 46, extract: (r) => r.whatChanges },
        ],
        rows: adoption.impactedRoles,
        rowStyle: (r) => (r.headcount === null ? 'warning' : undefined),
      }),
    ),
  );
  if (adoption.risks.length > 0) {
    out.push(heading2('Adoption risks — surfaced'));
    for (const r of adoption.risks) {
      out.push(labelledBullet(`[${r.severity}] ${r.code}`, r.message));
    }
  }
  out.push(heading2('Value-measurement model — handed to Tower'));
  out.push(
    bodyParagraph([
      bodyRun(
        `${measurement.wiredMetrics.length} of ${measurement.metrics.length} ` +
          `metric(s) wired to a recorded baseline (coverage ` +
          `${pct(measurement.wiringCoverage)}). Value loop closes: ` +
          `${measurement.loopCloses ? 'yes' : 'NO'}.`,
      ),
    ]),
  );
  out.push(
    ...wrapTable(
      buildMultiColumnTable({
        columns: [
          { header: 'Metric', widthPercent: 26, extract: (m) => m.label },
          {
            header: 'Baseline',
            widthPercent: 16,
            extract: (m) =>
              m.wired ? numberOrGap(m.baselineValue) : SEED_GAP_MARKER,
          },
          {
            header: 'Target',
            widthPercent: 14,
            extract: (m) => numberOrGap(m.targetValue),
          },
          { header: 'Cadence', widthPercent: 14, extract: (m) => m.cadence },
          {
            header: 'Owner',
            widthPercent: 30,
            extract: (m) => m.measurementOwnerRole,
          },
        ],
        rows: measurement.metrics,
        rowStyle: (m) => (m.wired ? undefined : 'warning'),
      }),
    ),
  );
  out.push(...criticSection(skeleton));
  out.push(...honestyFooter());
  return out;
}

// ── Entry point ────────────────────────────────────────────────────────────

/**
 * Render a kernel artifact as a Word document. Deterministic. Throws when the
 * artifact id has no DOCX body assembler.
 */
export function buildKernelArtifactDocx(input: KernelDocxInput): Document {
  const { caseEntry, artifact } = input;
  let body: DocChild[];
  switch (artifact.id) {
    case 'discover_brief':
      body = discoverBody(caseEntry);
      break;
    case 'charter_case':
      body = charterBody(caseEntry);
      break;
    case 'business_case_pack':
      body = businessCasePackBody(caseEntry);
      break;
    case 'mobilize_pack':
      body = mobilizePackBody(caseEntry);
      break;
    default:
      throw new Error(
        `No DOCX renderer for kernel artifact '${artifact.id}'.`,
      );
  }

  const section: ISectionOptions = {
    properties: {},
    children: [...coverBlock(input), ...body] as ISectionOptions['children'],
  };

  return new Document({
    creator: 'AbarVa · Moves',
    title: `${artifact.label} · ${caseEntry.moveLabel}`,
    description: artifact.description,
    styles: {
      default: {
        document: {
          run: { font: SOURCE_DOCX.BODY_FONT, size: 22 },
        },
      },
    },
    sections: [section],
  });
}

/** Re-export the content type for the route. */
export { DOCX_CONTENT_TYPE } from '@/lib/exports-shared/docx-base';

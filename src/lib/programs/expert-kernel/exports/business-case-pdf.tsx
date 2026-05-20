// Moves Expert Kernel exports — PDF renderer.
//
// Renders kernel deliverables as PDF documents via @react-pdf/renderer. The
// flagship is the CFO business-case pack (`cfo_pack`): the spec §9 "product
// behavior standard" seven-part answer in one document —
//   1 here is the answer
//   2 here is the business case
//   3 here are the assumptions
//   4 here is what would make me wrong
//   5 here is what I would not fund until fixed
//   6 here is what Tower will measure
//   7 here is the evidence and what is missing
//
// The same renderer also produces PDF companions for the Discover brief, the
// Charter skeleton, the Design & Plan pack and the Mobilize packet.
//
// HARD RULE (spec §10.2): no fabrication. Every figure is a kernel object; a
// null / seed gap renders the explicit SEED_GAP_MARKER, a `kill` verdict and a
// null payback are stated plainly.
//
// Pure module: deterministic, no I/O. The route serializes via pdf().toBuffer.

import 'server-only';

import {
  Document,
  Page,
  Text,
  View,
  type DocumentProps,
} from '@react-pdf/renderer';
import type { ReactElement, ReactNode } from 'react';

import { PDF_COLORS, PDF_STYLES } from '@/lib/exports-shared/pdf-base';

import type { BusinessCaseSkeleton } from '../business-case-compiler';
import type { ExpertReviewCaseEntry } from '../expert-review-cases';
import { buildArtifactVisualExhibits } from '../artifact-visual-exhibits';
import type { KernelArtifactEntry, KernelArtifactId } from './artifact-catalog';
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

/** Input to the PDF renderer. */
export interface KernelPdfInput {
  caseEntry: ExpertReviewCaseEntry;
  artifact: KernelArtifactEntry;
  /** ISO date the document was generated. */
  generatedOn: string;
}

// ── Small presentational components ────────────────────────────────────────

function H1({ children }: { children: ReactNode }) {
  return <Text style={PDF_STYLES.h1}>{children}</Text>;
}
function H2({ children }: { children: ReactNode }) {
  return <Text style={PDF_STYLES.h2}>{children}</Text>;
}
function Body({ children }: { children: ReactNode }) {
  return <Text style={PDF_STYLES.body}>{children}</Text>;
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <View style={PDF_STYLES.listItem}>
      <Text style={PDF_STYLES.listMarker}>•</Text>
      <View style={PDF_STYLES.listItemBody}>
        <Text style={PDF_STYLES.listItemText}>{children}</Text>
      </View>
    </View>
  );
}

function KeyVal({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 3 }}>
      <Text
        style={{
          width: 160,
          fontSize: 9,
          color: PDF_COLORS.MUTED,
        }}
      >
        {label}
      </Text>
      <Text style={{ flex: 1, fontSize: 9, color: PDF_COLORS.HEADER }}>
        {value}
      </Text>
    </View>
  );
}

/** A simple table from a column spec — used for baseline / roadmap grids. */
function Table<T>({
  columns,
  rows,
}: {
  columns: Array<{ header: string; flex: number; extract: (r: T) => string }>;
  rows: T[];
}) {
  return (
    <View style={PDF_STYLES.table}>
      <View style={PDF_STYLES.tableHeaderRow}>
        {columns.map((c) => (
          <View
            key={c.header}
            style={{ ...PDF_STYLES.tableHeaderCell, flex: c.flex }}
          >
            <Text style={PDF_STYLES.tableHeaderText}>{c.header}</Text>
          </View>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={PDF_STYLES.tableRow}>
          {columns.map((c) => (
            <View
              key={c.header}
              style={{ ...PDF_STYLES.tableCell, flex: c.flex }}
            >
              <Text style={PDF_STYLES.tableCellText}>{c.extract(r)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: '#FBEFC4',
        borderColor: PDF_COLORS.WARNING,
        borderWidth: 1,
        borderRadius: 4,
        padding: 8,
        marginVertical: 8,
      }}
    >
      <Text style={{ fontSize: 9, color: '#5B3F00' }}>{children}</Text>
    </View>
  );
}

function VerdictBadge({ text, good }: { text: string; good: boolean }) {
  return (
    <View
      style={{
        backgroundColor: good ? '#E8F5E8' : '#FFE6E1',
        borderRadius: 3,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginBottom: 8,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: 11,
          color: good ? '#1B5E20' : '#8B1F0F',
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function ExhibitTable({
  caseEntry,
  artifactId,
}: {
  caseEntry: ExpertReviewCaseEntry;
  artifactId: KernelArtifactId;
}) {
  const exhibits = buildArtifactVisualExhibits(
    caseEntry.id as Parameters<typeof buildArtifactVisualExhibits>[0],
  ).filter((exhibit) => exhibit.artifactIds.includes(artifactId));

  return (
    <View>
      <H2>Board-grade visual exhibits</H2>
      <Body>
        These exhibit contracts mirror the master dossier so the exported pack
        keeps the C-suite visual spine: waterfall, sensitivity, payback,
        roadmap, architecture and evidence gaps.
      </Body>
      <Table
        columns={[
          { header: 'Exhibit', flex: 1.6, extract: (e) => e.title },
          { header: 'Status', flex: 0.7, extract: (e) => e.status },
          {
            header: 'Figure / data',
            flex: 2.4,
            extract: (e) =>
              e.data
                .slice(0, 3)
                .map((d) => `${d.label}: ${d.value}${d.unit ? ` ${d.unit}` : ''}`)
                .join('; '),
          },
          { header: 'C-suite use', flex: 2.2, extract: (e) => e.cSuiteUse },
        ]}
        rows={exhibits}
      />
    </View>
  );
}

// ── Cover page ─────────────────────────────────────────────────────────────

function CoverPage({ input }: { input: KernelPdfInput }) {
  const { caseEntry, artifact, generatedOn } = input;
  return (
    <Page size="LETTER" style={PDF_STYLES.page}>
      <Text style={PDF_STYLES.eyebrow}>AbarVa · Moves · Expert Kernel</Text>
      <Text style={PDF_STYLES.title}>{artifact.label}</Text>
      <Text style={PDF_STYLES.meta}>{caseEntry.moveLabel}</Text>
      <Text style={PDF_STYLES.meta}>Tenant: {caseEntry.tenantLabel}</Text>
      <Text style={PDF_STYLES.meta}>Tenant key: {caseEntry.tenantKey}</Text>
      <Text style={PDF_STYLES.meta}>Move ref: {caseEntry.moveRef}</Text>
      <Text style={PDF_STYLES.meta}>Generated: {generatedOn}</Text>
      <View style={PDF_STYLES.divider} />
      <Text style={{ fontSize: 10, color: PDF_COLORS.HEADER, lineHeight: 1.5 }}>
        {artifact.description}
      </Text>
      <View style={PDF_STYLES.divider} />
      <Text
        style={{
          fontSize: 9,
          color: PDF_COLORS.MUTED,
          fontStyle: 'italic',
          marginTop: 8,
        }}
      >
        {HONESTY_FOOTER}
      </Text>
    </Page>
  );
}

// ── Shared section renderers ───────────────────────────────────────────────

function BaselineTable({ skeleton }: { skeleton: BusinessCaseSkeleton }) {
  return (
    <Table
      columns={[
        { header: 'Metric', flex: 2.2, extract: (m) => m.label },
        {
          header: 'Value',
          flex: 1.4,
          extract: (m) =>
            m.recorded ? valueWithUnit(m.value, m.unit) : SEED_GAP_MARKER,
        },
        { header: 'Source', flex: 3, extract: (m) => m.source },
        {
          header: 'Quality',
          flex: 1.1,
          extract: (m) => `${m.sourceQuality}/${m.confidence}`,
        },
      ]}
      rows={skeleton.baseline.metrics}
    />
  );
}

function EconomicsBlock({ skeleton }: { skeleton: BusinessCaseSkeleton }) {
  return (
    <View>
      <KeyVal label="Investment (effort)" value={usdRange(skeleton.economics.investment)} />
      <KeyVal label="Net value (post-haircut)" value={usdRange(skeleton.valueRange)} />
      <KeyVal label="Net return" value={usdRange(skeleton.economics.netReturn)} />
      <KeyVal label="Payback" value={paybackText(skeleton)} />
      <KeyVal
        label="Monetisable"
        value={skeleton.economics.monetisable ? 'Yes' : 'No'}
      />
    </View>
  );
}

// ── The CFO pack — the seven-part answer ───────────────────────────────────

function CfoPackPages({ input }: { input: KernelPdfInput }) {
  const { caseEntry } = input;
  const { skeleton } = caseEntry.buildCase();
  const { fullCase } = caseEntry.buildFullCase();
  const { measurement } = caseEntry.buildMobilize();
  const fundable = fullCase.recommendation === 'fund';

  return (
    <>
      <Page size="LETTER" style={PDF_STYLES.page}>
        <H1>CFO business-case pack — the seven-part answer</H1>
        <Body>
          {skeleton.moveName} · {skeleton.tenantKey}. This pack answers the CFO
          question to the spec §9 standard: not just an answer, but the case,
          the assumptions, the failure modes, the funding hold, the measurement
          handoff and the evidence.
        </Body>

        <H2>1 · Here is the answer</H2>
        <VerdictBadge
          text={`Verdict: ${recommendationLabel(fullCase.recommendation)}`}
          good={fundable}
        />
        <Body>{fullCase.recommendationRationale}</Body>

        <H2>2 · Here is the business case</H2>
        <EconomicsBlock skeleton={skeleton} />
        <View style={{ marginTop: 6 }} />
        <KeyVal
          label="AI-build effort"
          value={usd(fullCase.buildVsChange.aiBuildCost)}
        />
        <KeyVal
          label="Business-change effort"
          value={`${usd(fullCase.buildVsChange.businessChangeCost)} (${pct(
            fullCase.buildVsChange.businessChangeFraction,
          )} of effort)`}
        />
        <View style={{ marginTop: 6 }} />
        <Table
          columns={[
            { header: 'Scenario', flex: 1.4, extract: (s) => s.label },
            { header: 'Investment', flex: 1.4, extract: (s) => usd(s.s.investment) },
            { header: 'Net return', flex: 1.4, extract: (s) => usd(s.s.netReturn) },
            {
              header: 'ROI',
              flex: 1,
              extract: (s) => (s.s.roi === null ? SEED_GAP_MARKER : `${s.s.roi}x`),
            },
          ]}
          rows={[
            { label: 'Base', s: fullCase.sensitivity.base },
            { label: 'Conservative', s: fullCase.sensitivity.conservative },
            { label: 'Upside', s: fullCase.sensitivity.upside },
          ]}
        />
        <View style={{ marginTop: 6 }} />
        <Body>Downside read: {fullCase.sensitivity.downsideRead}</Body>
        <ExhibitTable caseEntry={caseEntry} artifactId="cfo_pack" />
      </Page>

      <Page size="LETTER" style={PDF_STYLES.page}>
        <H2>3 · Here are the assumptions driving it</H2>
        <Body>
          The three flagged TOP MOVERS move roughly 80% of the outcome.
        </Body>
        {skeleton.assumptions.byImpact.map((a) => {
          const isMover = skeleton.assumptions.topMovers.some(
            (m) => m.key === a.key,
          );
          return (
            <Bullet key={a.key}>
              {isMover ? '[TOP MOVER] ' : ''}
              {a.isSeedGapProxy ? '[SEED-GAP PROXY] ' : ''}
              {a.key} — {a.statement} (owner {a.owner}; confidence{' '}
              {a.confidence}; impact {a.sensitivityImpact})
            </Bullet>
          );
        })}

        <H2>4 · Here is what would make me wrong</H2>
        <Callout>{fullCase.sensitivity.whatBreaksTheCase}</Callout>
        {skeleton.critic.findings.length === 0 ? (
          <Body>The critic raised no findings.</Body>
        ) : (
          skeleton.critic.findings.map((f) => (
            <Bullet key={f.code}>
              [{f.severity}/{f.lens}] {f.code}: {f.message}
            </Bullet>
          ))
        )}

        <H2>5 · Here is what I would not fund until fixed</H2>
        {skeleton.killCriteria.length === 0 ? (
          <Body>No kill criteria recorded.</Body>
        ) : (
          skeleton.killCriteria.map((k) => (
            <Bullet key={k.code}>
              {k.code}: {k.condition}
            </Bullet>
          ))
        )}
        {fullCase.flags.length > 0 && (
          <>
            <Body>Surfaced structural flags:</Body>
            {fullCase.flags.map((flag, i) => (
              <Bullet key={i}>{flag}</Bullet>
            ))}
          </>
        )}
      </Page>

      <Page size="LETTER" style={PDF_STYLES.page}>
        <H2>6 · Here is what Tower will measure later</H2>
        <Body>
          {measurement.wiredMetrics.length} of {measurement.metrics.length}{' '}
          metric(s) are wired to a recorded baseline (coverage{' '}
          {pct(measurement.wiringCoverage)}). Value loop closes:{' '}
          {measurement.loopCloses ? 'yes' : 'NO'}.
        </Body>
        <Table
          columns={[
            { header: 'Metric', flex: 2, extract: (m) => m.label },
            {
              header: 'Baseline',
              flex: 1.2,
              extract: (m) =>
                m.wired ? numberOrGap(m.baselineValue) : SEED_GAP_MARKER,
            },
            {
              header: 'Target',
              flex: 1,
              extract: (m) => numberOrGap(m.targetValue),
            },
            { header: 'Cadence', flex: 1, extract: (m) => m.cadence },
          ]}
          rows={measurement.metrics}
        />

        <H2>7 · Here is the evidence I used — and what is missing</H2>
        <Body>
          Baseline coverage {pct(skeleton.baseline.coverage)}.{' '}
          {skeleton.baseline.recordedMetrics.length} recorded metric(s), each
          with a cited source:
        </Body>
        <BaselineTable skeleton={skeleton} />
        <View style={{ marginTop: 8 }} />
        <Body>Declared seed gaps — missing, never invented:</Body>
        {skeleton.baseline.seedGaps.length === 0 ? (
          <Body>None — the baseline is fully recorded.</Body>
        ) : (
          skeleton.baseline.seedGaps.map((g) => (
            <Bullet key={g.key}>
              {g.label}: {g.seedGapReason}
            </Bullet>
          ))
        )}
        <View style={PDF_STYLES.hr} />
        <Text
          style={{ fontSize: 8, color: PDF_COLORS.MUTED, fontStyle: 'italic' }}
        >
          {HONESTY_FOOTER}
        </Text>
      </Page>
    </>
  );
}

// ── Discover / Charter / Design & Plan / Mobilize PDF bodies ───────────────

function DiscoverPages({ input }: { input: KernelPdfInput }) {
  const { skeleton } = input.caseEntry.buildCase();
  return (
    <Page size="LETTER" style={PDF_STYLES.page}>
      <H1>Discover — problem, baseline, opportunity, go/no-go</H1>
      <Body>
        {skeleton.moveName} · {skeleton.tenantKey}
      </Body>
      <Callout>
        Discover establishes the current state honestly before any solution is
        shaped. The opportunity is bounded by what the recorded baseline
        supports; declared seed gaps cap it.
      </Callout>
      <H2>Current-state baseline</H2>
      <BaselineTable skeleton={skeleton} />
      <H2>Seed gaps — declared, not fabricated</H2>
      {skeleton.baseline.seedGaps.length === 0 ? (
        <Body>No seed gaps — the baseline is fully recorded.</Body>
      ) : (
        skeleton.baseline.seedGaps.map((g) => (
          <Bullet key={g.key}>
            {g.label}: {g.seedGapReason}
          </Bullet>
        ))
      )}
      <H2>Opportunity & go/no-go read</H2>
      <VerdictBadge
        text={`Verdict: ${recommendationLabel(skeleton.recommendation)}`}
        good={skeleton.recommendation === 'fund'}
      />
      <Body>{skeleton.recommendationRationale}</Body>
      <Body>{skeleton.sensitivity.whatBreaksTheCase}</Body>
      <View style={PDF_STYLES.hr} />
      <Text style={{ fontSize: 8, color: PDF_COLORS.MUTED, fontStyle: 'italic' }}>
        {HONESTY_FOOTER}
      </Text>
    </Page>
  );
}

function CharterPages({ input }: { input: KernelPdfInput }) {
  const { skeleton } = input.caseEntry.buildCase();
  return (
    <>
      <Page size="LETTER" style={PDF_STYLES.page}>
        <H1>Charter — value hypothesis & business-case skeleton</H1>
        <Body>
          {skeleton.moveName} · {skeleton.tenantKey}
        </Body>
        <VerdictBadge
          text={`Verdict: ${recommendationLabel(skeleton.recommendation)}`}
          good={skeleton.recommendation === 'fund'}
        />
        <Body>{skeleton.recommendationRationale}</Body>
        <H2>Economics</H2>
        <EconomicsBlock skeleton={skeleton} />
        <H2>Sensitivity</H2>
        <KeyVal label="Base net return" value={usd(skeleton.sensitivity.base.point)} />
        <KeyVal
          label="Conservative net return"
          value={usd(skeleton.sensitivity.conservative.point)}
        />
        <KeyVal label="Upside net return" value={usd(skeleton.sensitivity.upside.point)} />
        <Callout>{skeleton.sensitivity.whatBreaksTheCase}</Callout>
      </Page>
      <Page size="LETTER" style={PDF_STYLES.page}>
        <H2>Named assumptions</H2>
        {skeleton.assumptions.byImpact.map((a) => (
          <Bullet key={a.key}>
            {a.key} — {a.statement} (owner {a.owner}; confidence {a.confidence})
          </Bullet>
        ))}
        <H2>Stop / kill criteria</H2>
        {skeleton.killCriteria.map((k) => (
          <Bullet key={k.code}>
            {k.code}: {k.condition}
          </Bullet>
        ))}
        <H2>Critic findings — surfaced, not hidden</H2>
        {skeleton.critic.findings.length === 0 ? (
          <Body>The critic raised no findings.</Body>
        ) : (
          skeleton.critic.findings.map((f) => (
            <Bullet key={f.code}>
              [{f.severity}/{f.lens}] {f.code}: {f.message}
            </Bullet>
          ))
        )}
        <View style={PDF_STYLES.hr} />
        <Text
          style={{ fontSize: 8, color: PDF_COLORS.MUTED, fontStyle: 'italic' }}
        >
          {HONESTY_FOOTER}
        </Text>
      </Page>
    </>
  );
}

function BusinessCasePackPages({ input }: { input: KernelPdfInput }) {
  const { fullCase } = input.caseEntry.buildFullCase();
  const { skeleton } = fullCase;
  return (
    <>
      <Page size="LETTER" style={PDF_STYLES.page}>
        <H1>Design & Plan — costed business-case pack</H1>
        <Body>
          {fullCase.moveName} · {fullCase.tenantKey}
        </Body>
        <VerdictBadge
          text={`Verdict: ${recommendationLabel(fullCase.recommendation)}`}
          good={fullCase.recommendation === 'fund'}
        />
        <Body>{fullCase.recommendationRationale}</Body>
        <ExhibitTable caseEntry={input.caseEntry} artifactId="business_case_pack" />
        <H2>Investment & return</H2>
        <KeyVal label="Investment (costed roadmap)" value={usdRange(fullCase.investment)} />
        <KeyVal label="Net return" value={usdRange(fullCase.netReturn)} />
        <KeyVal
          label="Payback"
          value={
            fullCase.paybackMonths === null
              ? paybackText(skeleton)
              : `${fullCase.paybackMonths} months (base case)`
          }
        />
        <H2>Costed roadmap — per-phase</H2>
        <Table
          columns={[
            { header: 'Phase', flex: 2.4, extract: (p) => p.phaseLabel },
            { header: 'Investment', flex: 1.3, extract: (p) => usd(p.investment) },
            {
              header: 'Annual value',
              flex: 1.3,
              extract: (p) => usd(p.annualValueUnlocked),
            },
            {
              header: 'Foundational',
              flex: 1,
              extract: (p) => (p.isFoundational ? 'yes' : 'no'),
            },
          ]}
          rows={fullCase.phaseProfile}
        />
      </Page>
      <Page size="LETTER" style={PDF_STYLES.page}>
        <H2>Three-scenario sensitivity</H2>
        <Table
          columns={[
            { header: 'Scenario', flex: 1.4, extract: (s) => s.label },
            { header: 'Investment', flex: 1.4, extract: (s) => usd(s.s.investment) },
            { header: 'Net return', flex: 1.4, extract: (s) => usd(s.s.netReturn) },
            {
              header: 'ROI',
              flex: 1,
              extract: (s) => (s.s.roi === null ? SEED_GAP_MARKER : `${s.s.roi}x`),
            },
          ]}
          rows={[
            { label: 'Base', s: fullCase.sensitivity.base },
            { label: 'Conservative', s: fullCase.sensitivity.conservative },
            { label: 'Upside', s: fullCase.sensitivity.upside },
          ]}
        />
        <Callout>{fullCase.sensitivity.whatBreaksTheCase}</Callout>
        <Body>Downside read: {fullCase.sensitivity.downsideRead}</Body>
        <H2>Human + agent RACI</H2>
        <Table
          columns={[
            { header: 'Decision', flex: 2.6, extract: (d) => d.decision },
            { header: 'Kind', flex: 1, extract: (d) => d.kind },
            {
              header: 'Accountable',
              flex: 1.6,
              extract: (d) =>
                fullCase.raci.parties.find(
                  (p) => p.id === d.accountablePartyId,
                )?.name ?? d.accountablePartyId,
            },
          ]}
          rows={fullCase.raci.decisions}
        />
        <H2>Surfaced flags</H2>
        {fullCase.flags.length === 0 ? (
          <Body>No structural flags raised.</Body>
        ) : (
          fullCase.flags.map((f, i) => <Bullet key={i}>{f}</Bullet>)
        )}
        <View style={PDF_STYLES.hr} />
        <Text
          style={{ fontSize: 8, color: PDF_COLORS.MUTED, fontStyle: 'italic' }}
        >
          {HONESTY_FOOTER}
        </Text>
      </Page>
    </>
  );
}

function MobilizePackPages({ input }: { input: KernelPdfInput }) {
  const { adoption, measurement, goPack } = input.caseEntry.buildMobilize();
  return (
    <>
      <Page size="LETTER" style={PDF_STYLES.page}>
        <H1>Mobilize & Handoff — adoption, measurement, go-decision</H1>
        <Body>
          {goPack.moveName} · {goPack.tenantKey}
        </Body>
        <VerdictBadge
          text={`Go-decision: ${goPack.decision.toUpperCase().replace('_', ' ')}`}
          good={goPack.decision === 'go'}
        />
        <Body>{goPack.rationale}</Body>
        <H2>Mobilize readiness</H2>
        <KeyVal label="Owned" value={goPack.readiness.owned ? 'Yes' : 'NO'} />
        <KeyVal label="Adoptable" value={goPack.readiness.adoptable ? 'Yes' : 'NO'} />
        <KeyVal label="Measurable" value={goPack.readiness.measurable ? 'Yes' : 'NO'} />
        <KeyVal
          label="Operating-model owner"
          value={adoption.operatingModelOwner ?? 'NOT NAMED'}
        />
        <KeyVal label="Overall change load" value={adoption.overallChangeLoad} />
        {goPack.firedKillTriggers.length > 0 && (
          <>
            <H2>Fired kill triggers</H2>
            {goPack.firedKillTriggers.map((f) => (
              <Bullet key={f.trigger.code}>
                {f.trigger.code}: {f.observation} — fix: {f.trigger.fixCondition}
              </Bullet>
            ))}
          </>
        )}
        {goPack.conditions.length > 0 && (
          <>
            <H2>Conditions to clear</H2>
            {goPack.conditions.map((c) => (
              <Bullet key={c.code}>
                {c.code}: {c.condition}
              </Bullet>
            ))}
          </>
        )}
      </Page>
      <Page size="LETTER" style={PDF_STYLES.page}>
        <H2>Adoption & change approach — seven dimensions</H2>
        <Table
          columns={[
            { header: 'Dimension', flex: 1.4, extract: (d) => d.dimension },
            { header: 'Magnitude', flex: 1, extract: (d) => d.magnitude },
            {
              header: 'Recommendation',
              flex: 3.2,
              extract: (d) => d.recommendation,
            },
          ]}
          rows={adoption.dimensions}
        />
        <H2>Impacted roles</H2>
        <Table
          columns={[
            { header: 'Role', flex: 1.6, extract: (r) => r.role },
            {
              header: 'Headcount',
              flex: 1,
              extract: (r) =>
                r.headcount === null ? SEED_GAP_MARKER : String(r.headcount),
            },
            { header: 'What changes', flex: 3, extract: (r) => r.whatChanges },
          ]}
          rows={adoption.impactedRoles}
        />
        <H2>Value-measurement model — handed to Tower</H2>
        <Table
          columns={[
            { header: 'Metric', flex: 2, extract: (m) => m.label },
            {
              header: 'Baseline',
              flex: 1.2,
              extract: (m) =>
                m.wired ? numberOrGap(m.baselineValue) : SEED_GAP_MARKER,
            },
            { header: 'Target', flex: 1, extract: (m) => numberOrGap(m.targetValue) },
            { header: 'Owner', flex: 1.6, extract: (m) => m.measurementOwnerRole },
          ]}
          rows={measurement.metrics}
        />
        <View style={PDF_STYLES.hr} />
        <Text
          style={{ fontSize: 8, color: PDF_COLORS.MUTED, fontStyle: 'italic' }}
        >
          {HONESTY_FOOTER}
        </Text>
      </Page>
    </>
  );
}

// ── Entry point ────────────────────────────────────────────────────────────

/**
 * Render a kernel artifact as a PDF document element. Deterministic. Throws
 * when the artifact id has no PDF body.
 */
export function buildKernelArtifactPdf(
  input: KernelPdfInput,
): ReactElement<DocumentProps> {
  const { caseEntry, artifact } = input;
  let body: ReactNode;
  switch (artifact.id) {
    case 'cfo_pack':
      body = <CfoPackPages input={input} />;
      break;
    case 'discover_brief':
      body = <DiscoverPages input={input} />;
      break;
    case 'charter_case':
      body = <CharterPages input={input} />;
      break;
    case 'business_case_pack':
      body = <BusinessCasePackPages input={input} />;
      break;
    case 'mobilize_pack':
      body = <MobilizePackPages input={input} />;
      break;
    default:
      throw new Error(`No PDF renderer for kernel artifact '${artifact.id}'.`);
  }
  return (
    <Document
      title={`${artifact.label} · ${caseEntry.moveLabel}`}
      author="AbarVa · Moves"
      subject={artifact.description}
      creator="AbarVa · Moves"
      producer="AbarVa · Moves"
    >
      <CoverPage input={input} />
      {body}
    </Document>
  );
}

/** Re-export the content type for the route. */
export { PDF_CONTENT_TYPE } from '@/lib/exports-shared/pdf-base';

// /source/events/[eventId]/report — Printable source event report page.
//
// Standalone server component. Does NOT wrap in AppShell or WorkingPane so
// the printed output is clean: header, gate table, contradictions, evidence
// inventory, cascade impacts, service category context, footer.
//
// A client `PrintAutoTrigger` opens the browser print dialog on mount so
// opening the page in a new tab raises the dialog automatically.
// A "Print / Save as PDF" button is shown above the report and hidden in
// @media print.

import { notFound } from 'next/navigation';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/lib/design/design-tokens';
import { getSourcingEvent } from '@/lib/source/queries';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { buildEvidenceMapWithIngestions } from '@/lib/source/source-event-instance';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { computeCascadeImpacts } from '@/lib/reasoning/cross-instance-reasoner';
import { deriveMissionsFromInstance } from '@/lib/reasoning/mission-derivation';
import { isResolved as isContradictionResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';
import { PAT_SRC_AMS_001, SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PrintAutoTrigger } from '@/components/reasoning/PrintAutoTrigger';
import { PrintButton } from '@/components/programs/PrintButton';
import type { GateStatus } from '@/lib/reasoning/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return {
    title: `Source Event Report · ${eventId.toUpperCase()} · AbarVa`,
  };
}

// ─── Print styles ─────────────────────────────────────────────────────────────

const PRINT_PAGE_STYLE = `
  @page { size: letter portrait; margin: 0.6in 0.5in; }
  @media print {
    html, body { background: #FFFFFF !important; }
    .abarva-noprint { display: none !important; }
    tr { page-break-inside: avoid; }
    h2 { page-break-after: avoid; }
  }
`;

// ─── Shared cell styles ────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 11,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1.5px solid ${COLORS.ink}`,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

const TD: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  verticalAlign: 'top',
};

const SECTION_HEADING: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 17,
  fontWeight: 600,
  color: COLORS.ink,
  margin: 0,
  marginBottom: SPACING.sm,
  letterSpacing: '-0.01em',
};

const EMPTY_NOTE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  color: COLORS.ink,
  opacity: 0.55,
  fontStyle: 'italic',
};

// ─── Gate status helpers ───────────────────────────────────────────────────────

function gateStatusLabel(status: GateStatus): string {
  switch (status) {
    case 'met':
      return 'Met';
    case 'unmet':
      return 'Unmet';
    case 'partial':
      return 'Partial';
    case 'waived':
      return 'Waived';
  }
}

function gateStatusColor(status: GateStatus): string {
  switch (status) {
    case 'met':
    case 'waived':
      return COLORS.mintInk;
    case 'partial':
      return COLORS.amberInk;
    case 'unmet':
      return COLORS.coralInk;
  }
}

function gateStatusBg(status: GateStatus): string {
  switch (status) {
    case 'met':
    case 'waived':
      return COLORS.mintSoft;
    case 'partial':
      return COLORS.amberSoft;
    case 'unmet':
      return COLORS.coralSoft;
  }
}

// ─── Severity helpers ──────────────────────────────────────────────────────────

function severityColor(sev: 'low' | 'medium' | 'high'): string {
  switch (sev) {
    case 'high':
      return COLORS.coralInk;
    case 'medium':
      return COLORS.amberInk;
    case 'low':
      return COLORS.mintInk;
  }
}

function severityBg(sev: 'low' | 'medium' | 'high'): string {
  switch (sev) {
    case 'high':
      return COLORS.coralSoft;
    case 'medium':
      return COLORS.amberSoft;
    case 'low':
      return COLORS.mintSoft;
  }
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: RADIUS.pill,
        background: bg,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: SPACING.xl }}>
      <h2 style={SECTION_HEADING}>{title}</h2>
      {children}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SourceEventReportPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const event = await getSourcingEvent(eventId);
  if (!event) notFound();

  // Resolve typed instance — mirrors the logic in the detail page.
  const matchedInstance =
    SOURCE_EVENT_INSTANCES.find((i) => i.id === eventId) ??
    SOURCE_EVENT_INSTANCES.find(() =>
      event.name.toLowerCase().includes('ams'),
    ) ??
    SOURCE_EVENT_INSTANCES[0];

  // Resolve pattern — fall back to AMS if instance's patternId is not in
  // the pattern corpus (e.g. CAT patterns not exported individually).
  const pattern =
    SOURCE_LIFECYCLE_PATTERNS.find(
      (p) => p.patternId === matchedInstance?.patternId,
    ) ?? PAT_SRC_AMS_001;

  // Build synthesis context (null-safe)
  const ctx = matchedInstance
    ? buildSourceSynthesisContext(matchedInstance, pattern)
    : null;

  // Build gate evaluations — all stages for the full-report gate table.
  // GateEvaluation doesn't carry the description string; look it up from the
  // pattern's gateCriteria array by criterionId.
  const criterionDescMap = new Map<string, string>(
    pattern.gateCriteria.map((c) => [c.id, c.description]),
  );
  const gateRows: Array<{
    stageId: string;
    criterionId: string;
    description: string;
    gateType: 'hard' | 'soft';
    status: GateStatus;
  }> = (() => {
    if (!matchedInstance) return [];
    const evidenceMap = buildEvidenceMapWithIngestions(matchedInstance);
    const evaluator = createGateEvaluator(pattern);
    const allStageEvals = evaluator.evaluateAllStages(
      matchedInstance.currentStage,
      evidenceMap,
    );
    return allStageEvals.flatMap((stageEval) =>
      stageEval.gateEvaluations.map((c) => ({
        stageId: stageEval.stageLabel,
        criterionId: c.criterionId,
        description: criterionDescMap.get(c.criterionId) ?? c.criterionId,
        gateType: c.gateType,
        status: c.status,
      })),
    );
  })();

  // Active contradictions (filtered against local resolution ring)
  const activeContradictions = ctx
    ? ctx.activeContradictions.filter(
        (c) =>
          !isContradictionResolved(
            `${matchedInstance!.id}::${c.templateId}`,
          ),
      )
    : [];

  // Evidence inventory from instance evidence items
  const evidenceItems = matchedInstance?.evidence ?? [];

  // Cascade impacts (downstream)
  const cascadeImpacts = matchedInstance
    ? computeCascadeImpacts(matchedInstance)
    : [];

  // Mission queue — verb-first, high → low priority
  const missions = matchedInstance
    ? deriveMissionsFromInstance(matchedInstance, pattern)
    : [];

  // Health summary
  const healthScore = ctx?.gatesSummary
    ? `${ctx.gatesSummary.met} / ${ctx.gatesSummary.total} gates met`
    : 'N/A';

  // Service category context — pattern body trimmed for print
  const patternBody = pattern.body ?? '';
  // Trim body to the first 600 chars (first 2–3 paragraphs) for print density.
  const patternBodyExcerpt =
    patternBody.length > 600
      ? patternBody.slice(0, 600).trimEnd() + '…'
      : patternBody;

  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_PAGE_STYLE }} />
      <PrintAutoTrigger />
      <main
        style={{
          background: COLORS.white,
          color: COLORS.ink,
          maxWidth: '7.5in',
          margin: '0 auto',
          padding: `${SPACING.xl} ${SPACING.lg}`,
          fontFamily: TYPOGRAPHY.sans,
        }}
      >
        {/* ── Screen-only nav bar ─────────────────────────────────────────── */}
        <div
          className="abarva-noprint"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: SPACING.md,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: COLORS.ink,
            opacity: 0.75,
          }}
        >
          <a
            href={`/source/events/${eventId}`}
            style={{
              color: COLORS.navy,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← Back to event
          </a>
          <PrintButton />
        </div>

        {/* ── Report header ──────────────────────────────────────────────── */}
        <header
          style={{
            borderBottom: `2px solid ${COLORS.ink}`,
            paddingBottom: SPACING.md,
            marginBottom: SPACING.lg,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.navy,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            AbarVa · Source Event Report
          </div>
          <h1
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 28,
              color: COLORS.ink,
              margin: 0,
              marginBottom: 6,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              fontWeight: 600,
            }}
          >
            {event.name}
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: COLORS.ink,
              opacity: 0.75,
              marginBottom: 8,
            }}
          >
            <span>{event.code}</span>
            <span>·</span>
            <span>{event.currentStageLabel}</span>
            <span>·</span>
            <span>{event.accountName}</span>
          </div>
          {/* Health badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: COLORS.ink,
              border: `1px solid ${COLORS.ink}33`,
              borderRadius: RADIUS.md,
              padding: '5px 12px',
            }}
          >
            <span style={{ fontWeight: 700, opacity: 0.6 }}>Health:</span>
            <span>{healthScore}</span>
          </div>
        </header>

        {/* ── Stage gate summary ─────────────────────────────────────────── */}
        <Section title="Stage Gate Summary">
          {gateRows.length === 0 ? (
            <p style={EMPTY_NOTE}>
              No gate criteria found for this event — pattern not matched.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>Stage</th>
                  <th style={TH}>Criterion</th>
                  <th style={TH}>Type</th>
                  <th style={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {gateRows.map((row) => (
                  <tr key={`${row.stageId}:${row.criterionId}`}>
                    <td
                      style={{
                        ...TD,
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                      }}
                    >
                      {row.stageId}
                    </td>
                    <td style={TD}>{row.description}</td>
                    <td
                      style={{
                        ...TD,
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                      }}
                    >
                      {row.gateType}
                    </td>
                    <td style={TD}>
                      <StatusPill
                        label={gateStatusLabel(row.status)}
                        bg={gateStatusBg(row.status)}
                        color={gateStatusColor(row.status)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* ── Active contradictions ──────────────────────────────────────── */}
        <Section title="Active Contradictions">
          {activeContradictions.length === 0 ? (
            <p style={EMPTY_NOTE}>No active contradictions detected.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {activeContradictions.map((c) => (
                <li
                  key={c.templateId}
                  style={{
                    borderBottom: `1px solid ${COLORS.ink}18`,
                    padding: `${SPACING.sm} 0`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <StatusPill
                    label={c.severity}
                    bg={severityBg(c.severity)}
                    color={severityColor(c.severity)}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {c.label}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        color: COLORS.ink,
                        opacity: 0.7,
                        marginTop: 2,
                      }}
                    >
                      {c.partyA} ↔ {c.partyB}
                    </div>
                    {c.resolutionPath && (
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 11,
                          color: COLORS.ink,
                          opacity: 0.6,
                          marginTop: 3,
                          fontStyle: 'italic',
                        }}
                      >
                        Resolution: {c.resolutionPath}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ── Evidence inventory ──────────────────────────────────────────── */}
        <Section title="Evidence Inventory">
          {evidenceItems.length === 0 ? (
            <p style={EMPTY_NOTE}>No evidence items recorded for this event.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>ID</th>
                  <th style={TH}>Kind</th>
                  <th style={TH}>Field</th>
                  <th style={TH}>Source</th>
                  <th style={TH}>Recorded</th>
                </tr>
              </thead>
              <tbody>
                {evidenceItems.map((ev) => (
                  <tr key={ev.id}>
                    <td
                      style={{
                        ...TD,
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ev.id}
                    </td>
                    <td
                      style={{
                        ...TD,
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                      }}
                    >
                      <StatusPill
                        label={ev.kind}
                        bg={
                          ev.kind === 'attestation'
                            ? COLORS.mintSoft
                            : ev.kind === 'flag'
                            ? COLORS.coralSoft
                            : COLORS.amberSoft
                        }
                        color={
                          ev.kind === 'attestation'
                            ? COLORS.mintInk
                            : ev.kind === 'flag'
                            ? COLORS.coralInk
                            : COLORS.amberInk
                        }
                      />
                    </td>
                    <td
                      style={{
                        ...TD,
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        maxWidth: '1.5in',
                      }}
                    >
                      {ev.field}
                    </td>
                    <td style={{ ...TD, maxWidth: '2.5in' }}>{ev.source}</td>
                    <td
                      style={{
                        ...TD,
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ev.recordedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* ── Cascade impacts ────────────────────────────────────────────── */}
        <Section title="Cascade Impacts">
          {cascadeImpacts.length === 0 ? (
            <p style={EMPTY_NOTE}>No downstream cascade impacts identified.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {cascadeImpacts.map((ci, idx) => (
                <li
                  key={`${ci.targetInstanceId}-${idx}`}
                  style={{
                    borderBottom: `1px solid ${COLORS.ink}18`,
                    padding: `${SPACING.sm} 0`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <StatusPill
                    label={ci.severity}
                    bg={
                      ci.severity === 'blocking'
                        ? COLORS.coralSoft
                        : ci.severity === 'accelerating'
                        ? COLORS.mintSoft
                        : COLORS.amberSoft
                    }
                    color={
                      ci.severity === 'blocking'
                        ? COLORS.coralInk
                        : ci.severity === 'accelerating'
                        ? COLORS.mintInk
                        : COLORS.amberInk
                    }
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {ci.targetInstanceName ?? ci.targetInstanceId}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: COLORS.ink,
                        opacity: 0.6,
                        marginTop: 2,
                      }}
                    >
                      {ci.linkType}
                    </div>
                    {ci.impact && (
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 11,
                          color: COLORS.ink,
                          opacity: 0.7,
                          marginTop: 3,
                        }}
                      >
                        {ci.impact}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ── Mission queue ──────────────────────────────────────────────── */}
        <Section title="Mission Queue">
          {missions.length === 0 ? (
            <p style={EMPTY_NOTE}>No pending missions for this event.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {missions.map((m) => (
                <li
                  key={m.id}
                  style={{
                    borderBottom: `1px solid ${COLORS.ink}18`,
                    padding: `${SPACING.sm} 0`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <StatusPill
                    label={m.priority}
                    bg={
                      m.priority === 'high'
                        ? COLORS.coralSoft
                        : m.priority === 'medium'
                        ? COLORS.amberSoft
                        : COLORS.mintSoft
                    }
                    color={
                      m.priority === 'high'
                        ? COLORS.coralInk
                        : m.priority === 'medium'
                        ? COLORS.amberInk
                        : COLORS.mintInk
                    }
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {m.label}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: COLORS.ink,
                        opacity: 0.6,
                        marginTop: 2,
                      }}
                    >
                      {m.stageId} · {m.gateType}
                    </div>
                    {m.evaluationHint && (
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 10,
                          color: COLORS.ink,
                          opacity: 0.55,
                          marginTop: 3,
                        }}
                      >
                        {m.evaluationHint}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ── Service category context ───────────────────────────────────── */}
        {patternBodyExcerpt && (
          <Section title="Service Category Context">
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: COLORS.ink,
                opacity: 0.8,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {patternBodyExcerpt}
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                color: COLORS.ink,
                opacity: 0.5,
                marginTop: SPACING.sm,
              }}
            >
              Pattern: {pattern.patternId} v{pattern.version} · {pattern.title}
            </div>
          </Section>
        )}

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer
          style={{
            borderTop: `1px solid ${COLORS.ink}`,
            paddingTop: SPACING.sm,
            marginTop: SPACING.lg,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: SPACING.md,
            flexWrap: 'wrap',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            color: COLORS.ink,
            opacity: 0.65,
          }}
        >
          <div>Generated by AbarVa reasoning layer · {generatedDate}</div>
          <div style={{ fontFamily: TYPOGRAPHY.mono }}>
            {event.code} · {event.accountName}
          </div>
        </footer>
      </main>
    </>
  );
}

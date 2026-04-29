// /programs/[id]/report — Printable program report page.
//
// Standalone server component. Does NOT wrap in AppShell or WorkingPane so
// the printed output is clean: header, gate table, contradictions, risks,
// evidence inventory, cascade impacts, footer.
//
// A client `PrintAutoTrigger` opens the browser print dialog on mount so
// opening the page in a new tab raises the dialog automatically.
// A "Print / Save as PDF" button is shown above the report and hidden in
// @media print.

import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/lib/design/design-tokens';
import { buildProgramDetailView } from '@/lib/programs/programs-detail-view';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { buildRiskRegisterForInstance } from '@/lib/reasoning/risk-register';
import { computeCascadeImpacts } from '@/lib/reasoning/cross-instance-reasoner';
import { getMissionsForProgram } from '@/lib/agent/agent-mission-derived';
import { isResolved as isContradictionResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { PrintAutoTrigger } from '@/components/reasoning/PrintAutoTrigger';
import { PrintButton } from '@/components/programs/PrintButton';
import type { GateStatus } from '@/lib/reasoning/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `Program Report · ${id.toUpperCase()} · AbarVa`,
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

export default async function ProgramReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Build the basic program detail view (fixture + no phase override)
  const view = buildProgramDetailView(id);

  // Resolve the canonical program instance (may be null for non-fixture programs)
  const instance = APEX_RETAIL_PROGRAM_INSTANCES.find(
    (i) =>
      i.displayId === view.displayId ||
      i.id.toLowerCase() === id.toLowerCase(),
  ) ?? null;

  // Build synthesis context (null-safe: fall back to empty collections)
  const ctx = instance ? buildProgramSynthesisContext(instance) : null;

  // Gate evaluations — all criteria across all stages, sourced from context
  const allGateEvals = ctx?.gatesSummary.blocked ?? [];
  // All gate criterion results from the synthesis context gatesSummary
  const gateRows: Array<{
    stageId: string;
    criterionId: string;
    description: string;
    gateType: 'hard' | 'soft';
    status: GateStatus;
  }> = allGateEvals.map((g) => ({
    stageId: g.stageId,
    criterionId: g.criterionId,
    description: g.description,
    gateType: g.gateType,
    status: g.status,
  }));

  // Active contradictions (filtered against local resolution ring)
  const activeContradictions = ctx
    ? ctx.activeContradictions.filter(
        (c) => !isContradictionResolved(`${instance!.id}::${c.templateId}`),
      )
    : [];

  // Risk register
  const risks = ctx && instance
    ? buildRiskRegisterForInstance(ctx, instance.displayId)
    : [];

  // Evidence inventory from phasePanel
  const evidenceItems = view.phasePanel.evidenceItems ?? [];

  // Cascade impacts (downstream)
  const cascadeImpacts = instance ? computeCascadeImpacts(instance) : [];

  // Missions
  const missions = getMissionsForProgram(id);

  // Health score summary
  const healthScore = ctx?.gatesSummary
    ? `${ctx.gatesSummary.met} / ${ctx.gatesSummary.total} gates met`
    : 'N/A';

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
            href={`/programs/${id}`}
            style={{ color: COLORS.navy, textDecoration: 'none', fontWeight: 600 }}
          >
            ← Back to program
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
            AbarVa · Program Report
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
            {view.name}
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
            <span>{view.displayId}</span>
            <span>·</span>
            <span>
              Phase {view.currentPhase}
            </span>
            <span>·</span>
            <span>{view.tenant}</span>
          </div>
          {/* Health score badge */}
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

        {/* ── Gate summary ───────────────────────────────────────────────── */}
        <Section title="Gate Summary">
          {gateRows.length === 0 ? (
            <p style={EMPTY_NOTE}>No blocked gate criteria — all gates met or no pattern found.</p>
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
                    <td style={{ ...TD, fontFamily: TYPOGRAPHY.mono, fontSize: 10 }}>
                      {row.stageId}
                    </td>
                    <td style={TD}>{row.description}</td>
                    <td style={{ ...TD, fontFamily: TYPOGRAPHY.mono, fontSize: 10 }}>
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

        {/* ── Risk register ──────────────────────────────────────────────── */}
        <Section title="Risk Register">
          {risks.length === 0 ? (
            <p style={EMPTY_NOTE}>No risks in register.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>Risk</th>
                  <th style={TH}>Kind</th>
                  <th style={TH}>Severity</th>
                  <th style={TH}>Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((r) => (
                  <tr key={r.id}>
                    <td style={{ ...TD, fontWeight: 600 }}>{r.label}</td>
                    <td style={{ ...TD, fontFamily: TYPOGRAPHY.mono, fontSize: 10 }}>
                      {r.kind}
                    </td>
                    <td style={TD}>
                      <StatusPill
                        label={r.severity}
                        bg={severityBg(r.severity)}
                        color={severityColor(r.severity)}
                      />
                    </td>
                    <td style={{ ...TD, maxWidth: '3in' }}>{r.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* ── Evidence inventory ──────────────────────────────────────────── */}
        <Section title="Evidence Inventory">
          {evidenceItems.length === 0 ? (
            <p style={EMPTY_NOTE}>No evidence items for the current viewing phase.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {evidenceItems.map((ev) => (
                <li
                  key={ev.id}
                  style={{
                    borderBottom: `1px solid ${COLORS.ink}18`,
                    padding: `${SPACING.sm} 0`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <StatusPill
                    label={ev.confidence}
                    bg={
                      ev.confidence === 'high'
                        ? COLORS.mintSoft
                        : ev.confidence === 'medium'
                        ? COLORS.amberSoft
                        : COLORS.coralSoft
                    }
                    color={
                      ev.confidence === 'high'
                        ? COLORS.mintInk
                        : ev.confidence === 'medium'
                        ? COLORS.amberInk
                        : COLORS.coralInk
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
                      {ev.citation}
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
                      {ev.source}
                    </div>
                    {ev.excerpt && (
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 10,
                          color: COLORS.ink,
                          opacity: 0.55,
                          marginTop: 3,
                          fontStyle: 'italic',
                        }}
                      >
                        {ev.excerpt.slice(0, 180)}
                        {ev.excerpt.length > 180 ? '…' : ''}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ── Missions queue ─────────────────────────────────────────────── */}
        <Section title="Mission Queue">
          {missions.length === 0 ? (
            <p style={EMPTY_NOTE}>No pending missions for this program.</p>
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
          <div>
            Generated by AbarVa reasoning layer · {generatedDate}
          </div>
          <div
            style={{ fontFamily: TYPOGRAPHY.mono }}
          >
            {view.displayId} · {view.tenant}
          </div>
        </footer>
      </main>
    </>
  );
}

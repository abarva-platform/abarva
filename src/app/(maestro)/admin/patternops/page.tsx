import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { ContextBar } from '@/components/admin/ContextBar';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  PATTERNOPS_PROMOTION_STATES,
  PATTERNOPS_RETRIEVAL_ORDER,
} from '@/lib/patternops/canonical-pattern-contract';
import { getPatternOpsCoverageReport } from '@/lib/patternops/coverage-report';

export const metadata = {
  title: 'PatternOps | AbarVa Admin',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function numberLabel(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function percentage(part: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

function Stat({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}12`,
        borderRadius: RADIUS.sm,
        padding: SPACING.lg,
        minHeight: 112,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}70`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 38,
          lineHeight: 1,
          color: SHELL.INK,
          marginTop: 12,
        }}
      >
        {value}
      </div>
      <p
        style={{
          margin: '10px 0 0',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          lineHeight: 1.45,
          color: SHELL.INK_SOFT,
        }}
      >
        {caption}
      </p>
    </div>
  );
}

function Section({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      <div>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            lineHeight: 1.1,
            margin: 0,
            color: SHELL.INK,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            lineHeight: 1.55,
            color: SHELL.INK_SOFT,
            maxWidth: 840,
          }}
        >
          {lede}
        </p>
      </div>
      {children}
    </section>
  );
}

function CoverageBar({ value, total }: { value: number; total: number }) {
  const pct = total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  return (
    <div
      aria-label={`${pct}%`}
      style={{
        height: 8,
        background: `${COLORS.ink}10`,
        borderRadius: 999,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: pct >= 50 ? COLORS.mintInk : pct >= 25 ? COLORS.amberInk : COLORS.coralInk,
        }}
      />
    </div>
  );
}

export default async function PatternOpsPage() {
  await connection();
  const tenant = await resolveAdminTenant();
  const report = await getPatternOpsCoverageReport();
  const topGenomeRows = report.genomeCoverage
    .slice()
    .sort((a, b) => b.patternCount - a.patternCount)
    .slice(0, 12);
  const topContextRows = report.tenantContext.slice(0, 8);

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <EditorialCanvas
        eyebrow="Admin / PatternOps"
        title="PatternOps"
        subtitle="A quiet control plane for what AbarVa knows, what agents used, what is trusted, and where the corpus still needs review."
      >
        <ContextBar
          tenant={tenant.tenantName}
          mode="Read-only"
          agent="Steward"
          data={`${numberLabel(report.totals.genomePatterns)} genome patterns`}
          liveStatus="Azure read"
          liveStatusKind="live"
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: SPACING.md,
          }}
        >
          <Stat
            label="Genome patterns"
            value={numberLabel(report.totals.genomePatterns)}
            caption="Failure, use-case, AI, and operating-model patterns authored by vertical."
          />
          <Stat
            label="AI relevance"
            value={percentage(report.totals.aiPatterns, report.totals.genomePatterns)}
            caption={`${numberLabel(report.totals.aiPatterns)} patterns explicitly carry AI capability metadata.`}
          />
          <Stat
            label="Demo relevance"
            value={percentage(report.totals.demoRelevantPatterns, report.totals.genomePatterns)}
            caption={`${numberLabel(report.totals.demoRelevantPatterns)} patterns are marked useful for live CXO conversations.`}
          />
          <Stat
            label="Context chunks"
            value={numberLabel(report.totals.tenantContextChunks)}
            caption={`${percentage(report.totals.embeddedTenantContextChunks, report.totals.tenantContextChunks)} embedded across tenant context chunks.`}
          />
        </div>

        <Section
          title="Coverage map"
          lede="AbarVa should be honest about where the corpus is strong, moderate, or thin. These rows come from persisted genome patterns grouped by vertical and enterprise area."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: SPACING.md }}>
            {topGenomeRows.map((row) => (
              <div
                key={`${row.vertical}:${row.enterpriseArea}`}
                style={{
                  background: COLORS.white,
                  border: `1px solid ${COLORS.ink}12`,
                  borderRadius: RADIUS.sm,
                  padding: SPACING.md,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: SPACING.sm }}>
                  <div>
                    <div style={{ fontFamily: TYPOGRAPHY.sans, fontWeight: 700, color: SHELL.INK }}>
                      {row.vertical}
                    </div>
                    <div style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 10, color: `${COLORS.ink}72`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {row.enterpriseArea.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 28, color: SHELL.INK }}>
                    {numberLabel(row.patternCount)}
                  </div>
                </div>
                <CoverageBar value={row.aiPatternCount} total={row.patternCount} />
                <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: SHELL.INK_SOFT }}>
                  AI {percentage(row.aiPatternCount, row.patternCount)} · Demo {percentage(row.demoRelevantCount, row.patternCount)} · Reviewed {percentage(row.reviewedCount, row.patternCount)}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Agent grounding discipline"
          lede="Nexus, Sentinel, Source, Atlas, and Steward should retrieve in this order before advice. This is the product form of the doctrine: context first, patterns second, artifacts and gaps always visible."
        >
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: SPACING.sm,
            }}
          >
            {PATTERNOPS_RETRIEVAL_ORDER.map((lane, index) => (
              <li
                key={lane}
                style={{
                  background: COLORS.white,
                  border: `1px solid ${COLORS.ink}12`,
                  borderRadius: RADIUS.sm,
                  padding: SPACING.md,
                  fontFamily: TYPOGRAPHY.sans,
                  color: SHELL.INK,
                }}
              >
                <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: COLORS.navy }}>
                  {String(index + 1).padStart(2, '0')}
                </span>{' '}
                {lane.replace(/_/g, ' ')}
              </li>
            ))}
          </ol>
        </Section>

        <Section
          title="Promotion workflow"
          lede="The product learns through review, not automatic training. Completed Moves and accepted artifacts can become patterns only after steward approval."
        >
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PATTERNOPS_PROMOTION_STATES.length}, minmax(0, 1fr))`, gap: SPACING.sm }}>
            {PATTERNOPS_PROMOTION_STATES.map((state, index) => (
              <div
                key={state}
                style={{
                  background: index < 3 ? COLORS.white : `${COLORS.ink}06`,
                  border: `1px solid ${COLORS.ink}12`,
                  borderRadius: RADIUS.sm,
                  padding: SPACING.md,
                  minHeight: 96,
                }}
              >
                <div style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 10, color: COLORS.navy }}>
                  STATE {index + 1}
                </div>
                <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 15, fontWeight: 700, marginTop: 8, color: SHELL.INK }}>
                  {state.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Tenant context coverage"
          lede="Pattern intelligence only matters when it is joined to client facts. This view keeps context depth and embedding completeness visible by tenant."
        >
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.ink}12`, borderRadius: RADIUS.sm, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: TYPOGRAPHY.sans }}>
              <thead>
                <tr style={{ background: `${COLORS.ink}06` }}>
                  {['Client', 'Chunks', 'Embedded', 'Sources', 'Embedding coverage'].map((heading) => (
                    <th key={heading} style={{ textAlign: 'left', padding: SPACING.md, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: `${COLORS.ink}70` }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topContextRows.map((row) => (
                  <tr key={row.clientId} style={{ borderTop: `1px solid ${COLORS.ink}10` }}>
                    <td style={{ padding: SPACING.md, fontWeight: 700, color: SHELL.INK }}>{row.clientId}</td>
                    <td style={{ padding: SPACING.md }}>{numberLabel(row.chunkCount)}</td>
                    <td style={{ padding: SPACING.md }}>{numberLabel(row.embeddedCount)}</td>
                    <td style={{ padding: SPACING.md }}>{numberLabel(row.sourceFileCount)}</td>
                    <td style={{ padding: SPACING.md, minWidth: 180 }}>
                      <CoverageBar value={row.embeddedCount} total={row.chunkCount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

// /admin/reasoning/risk-register — Portfolio-wide risk register.
//
// Server component. Calls buildPortfolioRiskRegister() to get every risk
// (contradictions + failure modes) across all fixture instances, sorted
// globally by severity → confidence. Renders a full portfolio panel plus
// per-instance breakdowns for any instance with >0 risks.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildPortfolioRiskRegister } from '@/lib/reasoning/risk-register';
import { RiskRegisterPanel } from '@/components/_shared/RiskRegisterPanel';
import type { RiskItem } from '@/lib/reasoning/risk-register';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Portfolio risk register | AbarVa Admin',
};

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ risks }: { risks: RiskItem[] }) {
  const high = risks.filter((r) => r.severity === 'high').length;
  const medium = risks.filter((r) => r.severity === 'medium').length;
  const low = risks.filter((r) => r.severity === 'low').length;
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: SPACING.lg,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        Summary
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          color: COLORS.ink,
        }}
      >
        {risks.length} total risk{risks.length === 1 ? '' : 's'}
      </span>
      {high > 0 && (
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: COLORS.coralInk,
            background: COLORS.coralSoft,
            borderRadius: RADIUS.pill,
            padding: '3px 10px',
          }}
        >
          {high} high
        </span>
      )}
      {medium > 0 && (
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: COLORS.navy,
            background: COLORS.skyPale,
            borderRadius: RADIUS.pill,
            padding: '3px 10px',
          }}
        >
          {medium} medium
        </span>
      )}
      {low > 0 && (
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            background: `${COLORS.ink}0a`,
            borderRadius: RADIUS.pill,
            padding: '3px 10px',
          }}
        >
          {low} low
        </span>
      )}
    </div>
  );
}

// ─── Per-instance section heading ─────────────────────────────────────────────

function InstanceSectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: SPACING.sm,
        marginTop: 24,
        marginBottom: 4,
      }}
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 18,
          color: COLORS.ink,
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </h2>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}88`,
        }}
      >
        {count} risk{count === 1 ? '' : 's'}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioRiskRegisterPage() {
  const allRisks = buildPortfolioRiskRegister();

  // Group by instanceId to drive the per-instance breakdown panels.
  const byInstance = new Map<string, RiskItem[]>();
  for (const risk of allRisks) {
    const list = byInstance.get(risk.instanceId) ?? [];
    list.push(risk);
    byInstance.set(risk.instanceId, list);
  }

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning admin"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Portfolio risk register"
        subtitle="All risks (contradictions + failure modes) across every instance, ranked by severity and confidence."
      >
        <SummaryStrip risks={allRisks} />

        {/* Portfolio-wide panel — full list */}
        <RiskRegisterPanel
          risks={allRisks}
          title="Portfolio"
          instanceId="portfolio"
          showEmptyState
        />

        {/* Per-instance breakdowns */}
        {allRisks.length > 0 && (
          <section>
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: `${COLORS.ink}99`,
                fontWeight: 600,
                marginTop: 32,
                marginBottom: 8,
              }}
            >
              By instance
            </div>
            {[...byInstance.entries()].map(([instanceId, risks]) => (
              <div key={instanceId}>
                <InstanceSectionHeading label={risks[0]?.instanceLabel ?? instanceId} count={risks.length} />
                <RiskRegisterPanel
                  risks={risks}
                  title={risks[0]?.instanceLabel ?? instanceId}
                  instanceId={instanceId}
                  maxRows={5}
                  showEmptyState={false}
                />
              </div>
            ))}
          </section>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

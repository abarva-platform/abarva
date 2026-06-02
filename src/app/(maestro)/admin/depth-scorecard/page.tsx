import { connection } from 'next/server';

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { loadDepthExemplars } from '@/lib/depth/exemplars';
import { scoreArtifact } from '@/lib/depth/lint-service';
import { DEPTH_RUBRICS } from '@/lib/depth/rubrics';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

export const metadata = {
  title: 'Depth Scorecard | AbarVa Admin',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DepthScorecardPage() {
  await connection();
  const tenant = await resolveAdminTenant();
  const exemplars = await loadDepthExemplars();
  const scores = await Promise.all(
    exemplars.map((exemplar) =>
      scoreArtifact(exemplar.rubric_type, exemplar.content, { artifactId: exemplar.artifact_id }),
    ),
  );
  const average = scores.length
    ? scores.reduce((sum, score) => sum + score.total_score, 0) / scores.length
    : 0;
  const passing = scores.filter((score) => score.pass).length;
  const totalEstimatedCost = scores.reduce((sum, score) => sum + (score.estimated_cost_usd ?? 0), 0);

  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open depth standard"
          primaryActionHref="/docs/standards/DEPTH_STANDARD.md"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Depth enforcement"
        title="Depth Scorecard"
        subtitle="Live rubric checks for the six shipping artifact classes. P0 owns the standard, the linter, the cache, and the CI gate."
      >
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: SPACING.md,
          }}
        >
          <Metric label="Exemplars passing" value={`${passing}/${scores.length}`} />
          <Metric label="Average score" value={average.toFixed(1)} />
          <Metric label="Estimated lint cost" value={`$${totalEstimatedCost.toFixed(4)}`} />
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: SPACING.md,
          }}
        >
          {scores.map((score) => {
            const rubric = DEPTH_RUBRICS[score.rubric_type];
            return (
              <article
                key={score.artifact_id}
                style={{
                  background: COLORS.white,
                  border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                  borderRadius: RADIUS.md,
                  padding: SPACING.lg,
                  fontFamily: TYPOGRAPHY.sans,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: SPACING.md }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: COLORS.navy }}>
                      Rubric {rubric.code}
                    </p>
                    <h2
                      style={{
                        margin: '4px 0 0',
                        fontFamily: TYPOGRAPHY.serif,
                        fontSize: 22,
                        color: COLORS.ink,
                      }}
                    >
                      {rubric.title}
                    </h2>
                  </div>
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      borderRadius: RADIUS.pill,
                      padding: '4px 10px',
                      background: score.pass ? COLORS.mintSoft : COLORS.coralSoft,
                      color: score.pass ? COLORS.mintInk : COLORS.coralInk,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {score.pass ? 'PASS' : 'BLOCK'}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: SPACING.md,
                    fontSize: 44,
                    fontFamily: TYPOGRAPHY.serif,
                    color: COLORS.ink,
                    lineHeight: 1,
                  }}
                >
                  {score.total_score.toFixed(0)}/10
                </div>
                <p style={{ margin: `${SPACING.sm} 0 0`, color: `${COLORS.ink}B0`, lineHeight: 1.5, fontSize: 13 }}>
                  {score.reasoning}
                </p>
                <div style={{ marginTop: SPACING.md, display: 'grid', gap: 6 }}>
                  {score.criterion_scores.map((criterion) => (
                    <div
                      key={criterion.criterion_id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '42px 1fr 28px',
                        gap: SPACING.sm,
                        alignItems: 'center',
                        fontSize: 12,
                      }}
                    >
                      <span style={{ fontFamily: TYPOGRAPHY.mono, color: COLORS.navy }}>{criterion.criterion_id}</span>
                      <span style={{ color: COLORS.ink }}>{criterion.label}</span>
                      <span style={{ textAlign: 'right', fontWeight: 700 }}>{criterion.score}</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navy, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ marginTop: 6, fontFamily: TYPOGRAPHY.serif, fontSize: 34, color: COLORS.ink }}>{value}</div>
    </div>
  );
}

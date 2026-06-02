/**
 * /admin/compliance — Wave 3 PR-4
 *
 * Kills the panel-07 dead link (`href: '#'`) from
 * `home-overview-v2.ts:176` per
 * `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §3 + §7 Wave 3 PR-4.
 *
 * Renders the 2×2 compliance-posture digest: SOC 2 · GDPR data
 * residency · DPA template · Breach-notification SLA. Sourced from
 * the static `compliance-config.ts` via the
 * `compliance-posture-broker`. Honest about pilot-stage posture —
 * SOC 2 is "in progress", not "certified".
 */

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { CompliancePostureGrid } from '@/components/admin/CompliancePostureGrid';
import { PageHead } from '@/components/admin/overview/PageHead';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { getCompliancePosture } from '@/lib/admin/broker/compliance-posture-broker';
import { SETUP } from '@/lib/admin/setup-tokens';

export const metadata = { title: 'Admin · Compliance · AbarVa' };

export const dynamic = 'force-dynamic';

export default async function AdminCompliancePage() {
  const [tenant, posture] = await Promise.all([
    resolveAdminTenant(),
    getCompliancePosture(),
  ]);

  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Review compliance"
          primaryActionHref="/admin/compliance"
        />
      }
    >
      <div
        data-admin-page="compliance"
        style={{
          padding: '32px 40px 64px 40px',
          maxWidth: 1100,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          background: SETUP.paper,
        }}
      >
        <PageHead
          eyebrow="Admin · Governance"
          title="Compliance posture"
          lede={
            'Plain-English digest of where AbarVa stands on SOC 2, GDPR ' +
            'data residency, the DPA template, and the breach-notification ' +
            'SLA. Most lines are pilot-stage; nothing here is marketing.'
          }
        />
        <CompliancePostureGrid
          posture={posture}
          asOfLabel={`Reviewed ${posture.lastReviewedAt}`}
        />
      </div>
    </AdminCanonShellV2>
  );
}

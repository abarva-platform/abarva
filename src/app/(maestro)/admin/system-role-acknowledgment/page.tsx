import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { SystemRoleAcknowledgmentForm } from '@/components/ai-liability/SystemRoleAcknowledgmentForm';
import {
  currentUserCanSignSystemRoleAcknowledgment,
  getSystemRoleAcknowledgmentStatus,
  getSystemRoleAcknowledgmentSubjectForRequest,
} from '@/lib/ai-liability/system-role-acknowledgment';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';

export const metadata = {
  title: 'System Role Acknowledgment | AbarVa',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSystemRoleAcknowledgmentPage() {
  const tenant = await resolveAdminTenant();
  const [subject, canSign] = await Promise.all([
    getSystemRoleAcknowledgmentSubjectForRequest().catch(() => null),
    currentUserCanSignSystemRoleAcknowledgment(),
  ]);
  const status = subject
    ? await getSystemRoleAcknowledgmentStatus(subject)
    : {
        required: false,
        textVersion: '',
        acknowledgmentText: '',
        storageAvailable: false,
        signedAt: null,
        reason: 'no_client' as const,
      };

  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to policies"
          primaryActionHref="/admin/policies"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Responsible AI · tenant admin"
        title="System role acknowledgment"
        subtitle={`Confirm the admin responsibilities for ${tenant.tenantName}: tenant scope, access, connectors, data-load permissions, and human approval of AI-assisted work.`}
      >
        {canSign ? (
          <SystemRoleAcknowledgmentForm
            clientName={tenant.tenantName}
            signedAt={status.signedAt}
            storageAvailable={status.storageAvailable}
          />
        ) : (
          <div
            role="alert"
            style={{
              border: '1px solid rgba(159, 62, 59, 0.22)',
              borderRadius: 8,
              background: '#F9E6E4',
              color: '#9F3E3B',
              padding: 16,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            This acknowledgment can only be signed by a platform admin or tenant
            admin for the active client.
          </div>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

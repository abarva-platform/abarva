'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface ProgramProvisionOption {
  id: string;
  name: string;
  phaseLabel: string;
}

export interface ProgramUserProvisionFormProps {
  tenantName: string;
  programs: ReadonlyArray<ProgramProvisionOption>;
}

type AccessLevel = 'client_admin' | 'program_member' | 'program_viewer';

const FIELD_STYLE = {
  width: '100%',
  boxSizing: 'border-box' as const,
  border: `1px solid ${COLORS.ink}20`,
  borderRadius: RADIUS.sm,
  background: COLORS.white,
  color: COLORS.ink,
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  padding: '9px 10px',
};

function Label({ children }: { children: ReactNode }) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        fontWeight: 700,
        color: COLORS.ink,
      }}
    >
      {children}
    </label>
  );
}

function Checkbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: `${COLORS.ink}dd`,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      {label}
    </label>
  );
}

export function ProgramUserProvisionForm({ tenantName, programs }: ProgramUserProvisionFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('program_member');
  const [programIds, setProgramIds] = useState<string[]>([]);
  const [canCreatePrograms, setCanCreatePrograms] = useState(true);
  const [canApproveGates, setCanApproveGates] = useState(false);
  const [canUploadArtifacts, setCanUploadArtifacts] = useState(true);
  const [canGenerateDeliverables, setCanGenerateDeliverables] = useState(true);
  const [canPublishDeliverables, setCanPublishDeliverables] = useState(false);
  const [financialVisibility, setFinancialVisibility] = useState(false);
  const [sendInvite, setSendInvite] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedSummary = useMemo(() => {
    if (programIds.length === 0) return 'No existing programs assigned';
    return `${programIds.length} existing program${programIds.length === 1 ? '' : 's'} assigned`;
  }, [programIds.length]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/users/provision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          accessLevel,
          programIds,
          financialVisibility,
          canCreatePrograms,
          canApproveGates,
          canUploadArtifacts,
          canGenerateDeliverables,
          canPublishDeliverables,
          sendInvite,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.ok === false) {
        throw new Error(body?.detail ?? body?.error ?? `Provision failed (${res.status})`);
      }

      const failedAssignments = Array.isArray(body.assignments)
        ? body.assignments.filter((item: { status?: string }) => item.status === 'failed')
        : [];
      const invite = body?.invitation;
      const inviteSuffix = invite?.status === 'sent'
        ? ' Clerk invite sent.'
        : invite?.status === 'failed'
          ? ` Clerk invite failed: ${invite.detail ?? 'unknown error'}.`
          : '';
      setResult(
        failedAssignments.length > 0
          ? `User provisioned, but ${failedAssignments.length} program assignment failed. Check tenant scope.${inviteSuffix}`
          : `Provisioned ${body.email ?? email} for ${tenantName}.${inviteSuffix}`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Provision failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      data-program-user-provision-form="true"
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.navy}30`,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
      }}
    >
      <header style={{ marginBottom: SPACING.md }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
            marginBottom: SPACING.xs,
          }}
        >
          Live Programs provisioning
        </div>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.ink,
            margin: 0,
          }}
        >
          Add a Programs user for {tenantName}
        </h2>
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}bb`,
            lineHeight: 1.5,
            margin: `${SPACING.sm} 0 0`,
          }}
        >
          Creates or updates the client-pinned user record, module capabilities, financial visibility, and program assignments. It does not grant cross-client access.
        </p>
      </header>

      <form onSubmit={submit} style={{ display: 'grid', gap: SPACING.md }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: SPACING.md }}>
          <Label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="sarah.chen@example.com"
              style={FIELD_STYLE}
            />
          </Label>
          <Label>
            Display name
            <input
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              placeholder="Sarah Chen"
              style={FIELD_STYLE}
            />
          </Label>
          <Label>
            Access level
            <select
              value={accessLevel}
              onChange={(event) => setAccessLevel(event.currentTarget.value as AccessLevel)}
              style={FIELD_STYLE}
            >
              <option value="program_member">Programs user</option>
              <option value="program_viewer">Programs viewer</option>
              <option value="client_admin">Client admin</option>
            </select>
          </Label>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: SPACING.lg,
            alignItems: 'start',
          }}
        >
          <Label>
            Existing program assignments
            <select
              multiple
              value={programIds}
              onChange={(event) => {
                setProgramIds(Array.from(event.currentTarget.selectedOptions).map((option) => option.value));
              }}
              style={{ ...FIELD_STYLE, minHeight: 132 }}
            >
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.phaseLabel})
                </option>
              ))}
            </select>
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}99` }}>
              {programs.length === 0 ? 'No active programs available for this client.' : selectedSummary}
            </span>
          </Label>

          <div
            style={{
              display: 'grid',
              gap: SPACING.sm,
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              background: COLORS.cream,
              border: `1px solid ${COLORS.ink}10`,
            }}
          >
            <Checkbox checked={canCreatePrograms} onChange={setCanCreatePrograms} label="Can create new Programs" />
            <Checkbox checked={canUploadArtifacts} onChange={setCanUploadArtifacts} label="Can upload artifacts" />
            <Checkbox checked={canGenerateDeliverables} onChange={setCanGenerateDeliverables} label="Can generate deliverables" />
            <Checkbox checked={canApproveGates} onChange={setCanApproveGates} label="Can approve phase gates" />
            <Checkbox checked={canPublishDeliverables} onChange={setCanPublishDeliverables} label="Can publish deliverables" />
            <Checkbox checked={financialVisibility} onChange={setFinancialVisibility} label="Can see exact financial values" />
            <Checkbox checked={sendInvite} onChange={setSendInvite} label="Send Clerk invite email" />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md, flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              border: `1px solid ${COLORS.navy}`,
              borderRadius: RADIUS.sm,
              background: submitting ? COLORS.skyPale : COLORS.navy,
              color: submitting ? COLORS.navy : COLORS.white,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              fontWeight: 700,
              padding: '9px 14px',
              cursor: submitting ? 'wait' : 'pointer',
            }}
          >
            {submitting ? 'Provisioning...' : 'Provision Programs user'}
          </button>
          {result && (
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: COLORS.mintInk }}>
              {result}
            </span>
          )}
          {error && (
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: COLORS.coralInk }}>
              {error}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

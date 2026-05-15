// /admin/quarantine · B5c quarantine + audit dashboard
//
// Lists sensitive-data quarantine events for the active tenant. Each
// row has reason codes (which guard rule fired), uploader, ingestion
// tier (UI / Azure landing zone / direct integration), and action
// buttons to release or hard-delete after manual review.
//
// Today the data source is `stubQuarantineAuditDataSource` (returns
// empty); the dashboard renders a banner explaining that. When B5b
// implementation lands, the data source becomes a Supabase query
// against `sensitive_upload_audit` (schema in
// src/lib/security/quarantine-audit-types.ts).
//
// Admin-only via Clerk publicMetadata.role.
//
// Backlog: B5c (docs/BACKLOG-2026-05-14.md).

import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getActiveClientRow } from '@/lib/active-client';
import {
  stubQuarantineAuditDataSource,
  type SensitiveUploadAuditRow,
  type IngestionTier,
} from '@/lib/security/quarantine-audit-types';

export const dynamic = 'force-dynamic';

const TIER_LABELS: Record<IngestionTier, string> = {
  tier1_ui: 'Tier 1 · UI upload',
  tier2_blob: 'Tier 2 · Azure landing zone',
  tier3_direct: 'Tier 3 · Direct integration',
  tier4_in_vpc: 'Tier 4 · In-VPC',
};

async function requireAdmin(): Promise<{ userId: string }> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect=/admin/quarantine');
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user.publicMetadata?.role as string | undefined) ?? null;
  if (role !== 'admin' && role !== 'maestro') {
    redirect('/home');
  }
  return { userId };
}

export default async function QuarantineDashboardPage(): Promise<React.ReactElement> {
  await requireAdmin();
  const client = await getActiveClientRow();
  const tenantClientKey = client?.key ?? 'unknown';

  const rows = await stubQuarantineAuditDataSource.list({
    tenantClientKey,
    decision: 'quarantine',
    limit: 200,
  });

  const dataSourceWired = rows.length > 0;

  return (
    <main
      style={{
        background: '#F8F7F4',
        minHeight: '100vh',
        padding: '40px clamp(20px, 4vw, 56px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#0F1115',
      }}
    >
      <header style={{ maxWidth: 1200, margin: '0 auto 28px' }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#5F6470',
            marginBottom: 8,
          }}
        >
          Security · B5c
        </div>
        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            fontSize: 34,
            margin: 0,
            letterSpacing: '-0.005em',
          }}
        >
          Sensitive-data quarantine
        </h1>
        <p
          style={{
            color: '#2C2F36',
            maxWidth: 820,
            lineHeight: 1.55,
            marginTop: 10,
            fontSize: 15,
          }}
        >
          Uploads that the sensitive-data guard rejected before storage,
          across all four ingestion tiers (UI / Azure landing zone /
          direct integration / in-VPC). Each row shows the rule that
          fired, the uploader, and review actions.
        </p>
      </header>

      {!dataSourceWired && (
        <div
          role="status"
          style={{
            maxWidth: 1200,
            margin: '0 auto 24px',
            background: '#FFFFFF',
            borderLeft: '3px solid #B45309',
            border: '1px solid #C9C5BD',
            padding: '14px 18px',
            fontSize: 13.5,
            lineHeight: 1.5,
            color: '#2C2F36',
          }}
        >
          <strong style={{ color: '#0F1115' }}>Data source not yet wired.</strong>{' '}
          The dashboard renders against{' '}
          <code>stubQuarantineAuditDataSource</code>; the real Supabase
          query against <code>sensitive_upload_audit</code> lands with
          the B5b implementation PR (Microsoft Purview integration +
          dual-write rollout). Once that ships, this banner disappears
          and rows populate automatically. Schema is locked in{' '}
          <code>src/lib/security/quarantine-audit-types.ts</code>.
        </div>
      )}

      <section style={{ maxWidth: 1200, margin: '0 auto' }}>
        {rows.length === 0 ? (
          <EmptyState tenantClientKey={tenantClientKey} />
        ) : (
          <AuditTable rows={rows} />
        )}
      </section>

      <ReviewerNotes />
    </main>
  );
}

function EmptyState({ tenantClientKey }: { tenantClientKey: string }): React.ReactElement {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #C9C5BD',
        padding: '40px 32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#5F6470',
          marginBottom: 12,
        }}
      >
        No quarantined uploads
      </div>
      <p style={{ color: '#2C2F36', margin: '0 auto', maxWidth: 520, lineHeight: 1.55 }}>
        Tenant <code>{tenantClientKey}</code> has zero quarantine events
        in the audit log. This is the expected default when the
        sensitive-data guard isn&apos;t flagging anything (or when the data
        source hasn&apos;t been wired — see banner above).
      </p>
    </div>
  );
}

function AuditTable({ rows }: { rows: ReadonlyArray<SensitiveUploadAuditRow> }): React.ReactElement {
  return (
    <table
      style={{
        width: '100%',
        background: '#FFFFFF',
        border: '1px solid #C9C5BD',
        borderCollapse: 'collapse',
      }}
    >
      <thead>
        <tr style={{ background: '#FAF8F3' }}>
          {['When', 'Tier', 'Uploader', 'Filename', 'Reason', 'Decision', 'Actions'].map((h) => (
            <th
              key={h}
              style={{
                textAlign: 'left',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#5F6470',
                padding: '12px 14px',
                borderBottom: '1px solid #C9C5BD',
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} style={{ borderBottom: '1px solid #E2DFD8' }}>
            <td style={{ padding: '14px', fontSize: 12.5, color: '#2C2F36', fontFamily: 'JetBrains Mono, monospace' }}>
              {row.evaluatedAt}
            </td>
            <td style={{ padding: '14px', fontSize: 12.5, color: '#2C2F36' }}>
              {TIER_LABELS[row.ingestionTier]}
            </td>
            <td style={{ padding: '14px', fontSize: 12.5, color: '#2C2F36' }}>
              {row.uploaderUserId ?? <em style={{ color: '#5F6470' }}>system</em>}
            </td>
            <td style={{ padding: '14px', fontSize: 12.5, color: '#2C2F36' }}>
              {row.filename}{' '}
              <span style={{ color: '#5F6470' }}>
                ({row.sizeBytes != null ? Math.round(row.sizeBytes / 1024) + ' KB' : '?'})
              </span>
            </td>
            <td style={{ padding: '14px', fontSize: 12, color: '#B91C1C' }}>
              {row.reasonCodes.join(', ') || '—'}
            </td>
            <td style={{ padding: '14px', fontSize: 12, color: '#0F1115', fontWeight: 600 }}>
              {row.finalDecision}
            </td>
            <td style={{ padding: '14px' }}>
              <ActionButtons rowId={row.id} disabled />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ActionButtons({ rowId, disabled }: { rowId: string; disabled: boolean }): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        type="button"
        disabled={disabled}
        title={disabled ? 'Release wires up with B5b implementation' : 'Release after manual review'}
        style={buttonStyle(disabled, 'ghost')}
        data-row-id={rowId}
      >
        Release
      </button>
      <button
        type="button"
        disabled={disabled}
        title={disabled ? 'Hard-delete wires up with B5b implementation' : 'Permanently delete the quarantined blob'}
        style={buttonStyle(disabled, 'destructive')}
        data-row-id={rowId}
      >
        Hard-delete
      </button>
    </div>
  );
}

function buttonStyle(disabled: boolean, variant: 'ghost' | 'destructive'): React.CSSProperties {
  return {
    background: disabled ? '#E2DFD8' : variant === 'destructive' ? '#B91C1C' : '#FFFFFF',
    color: disabled ? '#5F6470' : variant === 'destructive' ? '#FFFFFF' : '#0F1115',
    border: `1px solid ${disabled ? '#C9C5BD' : variant === 'destructive' ? '#B91C1C' : '#0F1115'}`,
    padding: '6px 12px',
    fontSize: 12,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 3,
  };
}

function ReviewerNotes(): React.ReactElement {
  return (
    <aside
      style={{
        maxWidth: 1200,
        margin: '32px auto 0',
        background: '#FFFFFF',
        border: '1px solid #C9C5BD',
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#5F6470',
          marginBottom: 10,
        }}
      >
        Reviewer notes
      </div>
      <ul style={{ margin: 0, paddingLeft: 20, color: '#2C2F36', lineHeight: 1.65, fontSize: 13 }}>
        <li>
          <strong>Release</strong> means the file is re-classified as
          <code>confidential_business</code> and admitted to the ingestion
          pipeline. Use only after confirming the flagged content is a
          false positive (e.g., a vendor name that coincidentally
          pattern-matches an SSN).
        </li>
        <li>
          <strong>Hard-delete</strong> permanently removes the
          quarantined blob from storage and writes an audit row marking
          the deletion. Irreversible. Default action for confirmed
          PHI/PII.
        </li>
        <li>
          Every action writes an immutable audit row. The audit table
          itself never gets edited or deleted.
        </li>
        <li>
          When Microsoft Purview integration (B5b) is live, this
          dashboard also surfaces the Purview classification labels in
          the Reason column so you see both pattern-match and
          Purview-labeled signals.
        </li>
      </ul>
    </aside>
  );
}

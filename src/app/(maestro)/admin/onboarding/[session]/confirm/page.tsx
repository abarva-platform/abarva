import { requireTenancy } from '@/lib/auth/tenancy';
import { asOnboardingSupabaseClient, getOnboardingSession } from '@/lib/onboarding/apex-p18-pack-ingestion';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

import { ConfirmCommitButton } from './ConfirmCommitButton';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ session: string }>;
};

function Stat({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'good' | 'warn' }) {
  const color = tone === 'good' ? '#047857' : tone === 'warn' ? '#B45309' : '#111827';
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 14, background: '#FFFFFF' }}>
      <div style={{ color: '#6B7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color, fontSize: 24, fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default async function ConfirmOnboardingSessionPage({ params }: PageProps) {
  await requireTenancy();
  const { session: sessionId } = await params;
  const session = await getOnboardingSession(asOnboardingSupabaseClient(getAzureWriteFluentClient()), sessionId);

  if (!session) {
    return (
      <main style={{ padding: 32 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Onboarding session not found</h1>
      </main>
    );
  }

  const rowCounts = session.rowCounts as {
    sourceFiles?: number;
    chunks?: number;
    contractPdfs?: number;
    charterPdfs?: number;
  };
  const validation = session.validationSummary as {
    valid?: boolean;
    warnings?: string[];
    errors?: string[];
    requiredFilesPresent?: string[];
  };
  const commitSummary = session.commitSummary as {
    sourceFiles?: number;
    chunks?: number;
    runKey?: string;
    embeddingStatus?: string;
  };
  const canCommit = session.status === 'validated' && validation.valid === true;

  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', color: '#111827' }}>
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px 56px', display: 'grid', gap: 24 }}>
        <div>
          <div style={{ color: '#4B5563', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>
            Admin onboarding
          </div>
          <h1 style={{ fontSize: 32, lineHeight: 1.15, margin: '8px 0 8px' }}>Confirm Apex Packet 18 ingestion</h1>
          <p style={{ color: '#4B5563', margin: 0, maxWidth: 760 }}>
            Review the parsed data-pack counts and validation findings before committing rows to the enterprise context tables.
            The session record and validation payload are persisted in Postgres.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Stat label="Status" value={session.status} tone={session.status === 'committed' ? 'good' : canCommit ? 'default' : 'warn'} />
          <Stat label="Source files" value={rowCounts.sourceFiles ?? 0} />
          <Stat label="Corpus chunks" value={rowCounts.chunks ?? 0} />
          <Stat label="Contract PDFs" value={rowCounts.contractPdfs ?? 0} />
          <Stat label="Charter PDFs" value={rowCounts.charterPdfs ?? 0} />
        </div>

        <section style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Validation</h2>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                <tr>
                  <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #E5E7EB', width: 220 }}>Session ID</th>
                  <td style={{ padding: 12, borderBottom: '1px solid #E5E7EB', fontFamily: 'monospace' }}>{session.id}</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #E5E7EB' }}>Tenant</th>
                  <td style={{ padding: 12, borderBottom: '1px solid #E5E7EB' }}>{session.tenantKey}</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #E5E7EB' }}>Original file</th>
                  <td style={{ padding: 12, borderBottom: '1px solid #E5E7EB' }}>{session.originalFilename}</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #E5E7EB' }}>Warnings</th>
                  <td style={{ padding: 12, borderBottom: '1px solid #E5E7EB' }}>
                    {(validation.warnings ?? []).length ? validation.warnings?.join('; ') : 'None'}
                  </td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left', padding: 12 }}>Errors</th>
                  <td style={{ padding: 12 }}>{(validation.errors ?? []).length ? validation.errors?.join('; ') : 'None'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Commit</h2>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16 }}>
            {session.status === 'committed' ? (
              <p style={{ marginTop: 0, color: '#047857', fontWeight: 700 }}>
                Committed {commitSummary.sourceFiles ?? 0} source files and {commitSummary.chunks ?? 0} chunks. Run key: {commitSummary.runKey ?? 'not recorded'}.
              </p>
            ) : (
              <p style={{ marginTop: 0, color: '#4B5563' }}>
                Commit upserts source files, corpus chunks, and the template-run audit row. Embedding remains a separate post-commit operation.
              </p>
            )}
            <ConfirmCommitButton sessionId={session.id} disabled={!canCommit} />
          </div>
        </section>
      </section>
    </main>
  );
}

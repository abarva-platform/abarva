import fs from 'node:fs/promises';
import path from 'node:path';
import { connection } from 'next/server';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { ContextBar } from '@/components/admin/ContextBar';
import { AgentRail } from '@/components/admin/AgentRail';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import type { CrawlComparison, CrawlRun } from '@/lib/crawl/baseline-compare';

export const metadata = {
  title: 'Deploy Crawl | AbarVa Admin',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LatestPayload {
  run: CrawlRun;
  comparison: CrawlComparison;
}

export default async function DeployCrawlPage() {
  await connection();
  const [tenant, latest] = await Promise.all([resolveAdminTenant(), readLatest()]);

  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={<AgentRail primaryAgentLabel="Steward" primaryActionLabel="Run crawl" primaryActionHref="/admin/deploy-crawl" />}
    >
      <EditorialCanvas
        eyebrow="Admin · Post-deploy verification"
        title="Deploy Crawl"
        subtitle="Authenticated tenant/persona crawl results for trust regressions: tenant identity, evidence chips, screenshots, console/network errors, and hard-question citation depth."
      >
        <ContextBar
          tenant={tenant.tenantName}
          mode="Post-deploy crawl"
          agent="Steward"
          data="audit-artifacts/post-deploy-crawl/latest.json"
          liveStatus={latest ? 'Latest crawl loaded' : 'No crawl artifact yet'}
          liveStatusKind={latest ? (latest.comparison.p0 > 0 ? 'deferred' : 'live') : 'partial'}
        />

        {!latest ? (
          <section style={emptyStyle}>No crawl artifact found. Run `npm run crawl:post-deploy` after the next production deploy.</section>
        ) : (
          <>
            <section style={summaryGridStyle}>
              <Stat label="Run" value={latest.run.runId} />
              <Stat label="P0" value={String(latest.comparison.p0)} />
              <Stat label="P1" value={String(latest.comparison.p1)} />
              <Stat label="P2" value={String(latest.comparison.p2)} />
            </section>

            <section style={tableStyle}>
              <div style={tableHeadStyle}>
                <span>Severity</span>
                <span>Tenant / persona</span>
                <span>Surface</span>
                <span>Finding</span>
              </div>
              {latest.comparison.findings.length === 0 ? (
                <div style={emptyStyle}>No findings in the latest crawl.</div>
              ) : (
                latest.comparison.findings.slice(0, 200).map((finding, index) => (
                  <div key={`${finding.surfaceId}-${index}`} style={rowStyle}>
                    <strong style={severityStyle(finding.severity)}>{finding.severity}</strong>
                    <span>{finding.tenantKey} · {finding.personaKey}</span>
                    <span>{finding.surfaceId}</span>
                    <span>{finding.message}</span>
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

async function readLatest(): Promise<LatestPayload | null> {
  try {
    const file = path.join(process.cwd(), 'audit-artifacts/post-deploy-crawl/latest.json');
    return JSON.parse(await fs.readFile(file, 'utf8')) as LatestPayload;
  } catch {
    return null;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={statStyle}>
      <div style={statValueStyle}>{value}</div>
      <div style={labelStyle}>{label}</div>
    </div>
  );
}

function severityStyle(severity: string) {
  const color = severity === 'P0' ? '#b42318' : severity === 'P1' ? '#b54708' : '#175cd3';
  const bg = severity === 'P0' ? '#fef3f2' : severity === 'P1' ? '#fffaeb' : '#eff8ff';
  return { color, background: bg, borderRadius: 999, padding: '4px 8px', width: 'fit-content' } as const;
}

const summaryGridStyle = { display: 'grid', gridTemplateColumns: '2fr repeat(3, 1fr)', gap: 12, marginTop: 18 } as const;
const statStyle = { background: '#fff', border: '1px solid #e4e7ec', borderRadius: 8, padding: 16, minWidth: 0 } as const;
const statValueStyle = { fontSize: 22, fontWeight: 900, overflowWrap: 'anywhere' } as const;
const labelStyle = { color: '#667085', fontSize: 12, marginTop: 6 } as const;
const tableStyle = { background: '#fff', border: '1px solid #e4e7ec', borderRadius: 8, marginTop: 18, overflow: 'hidden' } as const;
const tableHeadStyle = { display: 'grid', gridTemplateColumns: '100px 220px 180px 1fr', gap: 12, padding: 14, background: '#f2f4f7', color: '#475467', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' } as const;
const rowStyle = { display: 'grid', gridTemplateColumns: '100px 220px 180px 1fr', gap: 12, padding: 14, borderTop: '1px solid #e4e7ec', color: '#344054' } as const;
const emptyStyle = { background: '#fff', border: '1px solid #e4e7ec', borderRadius: 8, padding: 18, marginTop: 18, color: '#667085' } as const;

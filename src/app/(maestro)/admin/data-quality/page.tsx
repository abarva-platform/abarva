import { connection } from "next/server";

import { AppShell } from "@/components/shell/AppShell";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import {
  buildAdminDataQualityControlModel,
  mapAdminDataQualityStatus,
  type AdminDataQualityStatus,
  type AdminDataQualityTenantDetail,
} from "@/lib/admin/admin-data-quality-control";
import type { TenantQualityMatrixRow } from "@/lib/enterprise-data/data-quality/all-tenant-data-quality-audit";
import { SHELL } from "@/lib/shell/shell-tokens";

export const metadata = {
  title: "Data Quality | AbarVa Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const sansStack =
  'Inter, "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default async function AdminDataQualityPage() {
  await connection();
  const tenant = await resolveAdminTenant();
  const model = await buildAdminDataQualityControlModel(process.cwd());

  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: tenant.tenantName,
        context: "Data Quality",
      }}
      showProductNav
    >
      <main data-admin-data-quality style={pageStyle}>
        <style>{pageCss}</style>
        <section className="dq-hero">
          <div>
            <p className="dq-eyebrow">Admin · Data Quality</p>
            <h1>{model.title}</h1>
            <p>{model.subtitle}</p>
          </div>
          <div className="dq-hero-grid">
            <HeroMetric label="Tenants" value={String(model.rollup.tenantsScanned)} />
            <HeroMetric
              label="Thin candidates"
              value={String(model.rollup.sourceRichCandidateThinTenants)}
            />
            <HeroMetric
              label="Promotion unsafe"
              value={String(model.rollup.promotionUnsafeTenants)}
            />
          </div>
        </section>

        <section data-quality-guardrails className="dq-guardrails">
          <div>
            <p className="dq-eyebrow">Truth split</p>
            <h2>Read-only control center. No runtime lane changes.</h2>
            <p>
              This page surfaces quality and coverage issues before data is made
              active. It does not promote candidates, write production tenant
              data, update active pointers, or change module behavior.
            </p>
          </div>
          <TruthPill label="Production writes" value="false" />
          <TruthPill label="Candidate promoted" value="false" />
          <TruthPill label="Active pointer update" value="false" />
          <TruthPill label="Runtime change" value="false" />
        </section>

        <section className="dq-rollup">
          <RollupCard
            label="False-green risk"
            value={model.rollup.falseGreenRiskTenants}
            note="Candidate looks eligible while coverage is thin."
          />
          <RollupCard
            label="Relationship gaps"
            value={model.rollup.relationshipGapTenants}
            note="Dependency evidence exists but graph operations are thin."
          />
          <RollupCard
            label="Generated-data watch"
            value={model.rollup.generatedDataWatchTenants}
            note="Planning-grade caveats must stay visible."
          />
          <RollupCard
            label="Tenant isolation issues"
            value={model.rollup.tenantIsolationFailures}
            note="Cross-tenant token checks from latest audit."
          />
        </section>

        <section data-quality-matrix className="dq-card dq-matrix">
          <div className="dq-section-head">
            <div>
              <p className="dq-eyebrow">All-tenant quality matrix</p>
              <h2>Where source depth does not yet equal active-ready truth.</h2>
            </div>
            <span>{model.generatedAt}</span>
          </div>
          <div className="dq-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Source Estate</th>
                  <th>Candidate Coverage</th>
                  <th>Evidence Quality</th>
                  <th>Relationship Quality</th>
                  <th>Generated Data Risk</th>
                  <th>Module Readiness</th>
                  <th>Promotion Status</th>
                  <th>Top Blocker</th>
                  <th>Recommended Next Action</th>
                </tr>
              </thead>
              <tbody>
                {model.tenantDetails.map((tenantDetail) => (
                  <MatrixRow
                    key={tenantDetail.tenantKey}
                    row={tenantDetail.matrix}
                    detail={tenantDetail}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dq-details">
          <div className="dq-section-head">
            <div>
              <p className="dq-eyebrow">Tenant detail panel</p>
              <h2>Evidence, relationship, module, and promotion impacts.</h2>
            </div>
          </div>
          {model.tenantDetails.map((tenantDetail) => (
            <TenantDetailPanel
              key={tenantDetail.tenantKey}
              detail={tenantDetail}
            />
          ))}
        </section>
      </main>
    </AppShell>
  );
}

function MatrixRow({
  row,
  detail,
}: {
  row: TenantQualityMatrixRow;
  detail: AdminDataQualityTenantDetail;
}) {
  return (
    <tr>
      <td>
        <a href={`#tenant-${row.tenantKey}`}>{row.tenantDisplayName}</a>
      </td>
      <td>
        <StatusChip status={mapAdminDataQualityStatus(detail.sourceEstate?.sourceRichnessStatus ?? "not_available")} />
        <small>{row.sourceRichnessScore}/100 · {formatNumber(row.sourceStructuredRows)} rows</small>
      </td>
      <td>
        <StatusChip status={mapAdminDataQualityStatus(detail.candidateCoverage?.coverageStatus ?? "not_available")} />
        <small>{formatPercent(row.candidateCoverageRatio)} · {formatNumber(row.candidateRecordsGenerated)} records</small>
      </td>
      <td>
        <StatusChip status={mapAdminDataQualityStatus(detail.evidenceQuality?.status ?? "not_available")} />
        <small>{formatNumber(row.evidenceOperationCount)} operations</small>
      </td>
      <td>
        <StatusChip status={mapAdminDataQualityStatus(detail.relationshipQuality?.status ?? "not_available")} />
        <small>{formatNumber(row.relationshipOperationCount)} operations</small>
      </td>
      <td>
        <StatusChip status={mapAdminDataQualityStatus(row.generatedDataRisk)} />
        <small>{detail.generatedDataRisk?.narrativeCaveatRequired ? "Caveat required" : "No caveat surfaced"}</small>
      </td>
      <td>
        <StatusChip status={mapAdminDataQualityStatus(row.moduleReadinessStatus)} />
        <small>{detail.moduleReadiness?.runtimeReadyModules ?? 0} runtime-ready</small>
      </td>
      <td>
        <StatusChip status={mapAdminDataQualityStatus(row.promotionReadinessStatus)} />
        <small>{row.promotionUnsafe ? "Unsafe" : "Review required"}</small>
      </td>
      <td>{detail.topBlocker}</td>
      <td>{detail.recommendedNextAction}</td>
    </tr>
  );
}

function TenantDetailPanel({ detail }: { detail: AdminDataQualityTenantDetail }) {
  return (
    <article
      id={`tenant-${detail.tenantKey}`}
      data-tenant-detail
      className="dq-card dq-tenant"
    >
      <div className="dq-tenant-head">
        <div>
          <p className="dq-eyebrow">Tenant quality snapshot</p>
          <h3>{detail.tenantDisplayName}</h3>
        </div>
        <StatusChip status={mapAdminDataQualityStatus(detail.matrix.overallStatus)} />
      </div>

      <div data-source-vs-candidate className="dq-alert">
        <strong>{detail.sourceVsCandidateCoverage.sourceRichCandidateThin ? "Source-rich / candidate-thin" : "Coverage view"}</strong>
        <span>{detail.sourceVsCandidateCoverage.summary}</span>
      </div>

      <div className="dq-detail-grid">
        <DetailCard
          title="Source Estate"
          rows={[
            ["Source packs", formatNumber(detail.sourceEstate?.sourcePackCount ?? 0)],
            ["Files", formatNumber(detail.sourceEstate?.fileCount ?? 0)],
            ["Structured rows", formatNumber(detail.sourceEstate?.structuredRowCount ?? 0)],
            ["Domains", formatNumber(detail.sourceEstate?.domainCount ?? 0)],
          ]}
        />
        <DetailCard
          title="Candidate Packet"
          rows={[
            ["Candidate records", formatNumber(detail.candidateCoverage?.candidateRecordsGenerated ?? 0)],
            ["Coverage", formatPercent(detail.candidateCoverage?.candidateCoverageRatio ?? 0)],
            ["Unmapped fields", formatNumber(detail.candidateCoverage?.unmappedFields ?? 0)],
            ["Stranded records", formatNumber(detail.candidateCoverage?.strandedIntelligenceRecords ?? 0)],
          ]}
        />
        <DetailCard
          dataAttr="data-evidence-quality"
          title="Evidence Quality"
          rows={[
            ["Operations", formatNumber(detail.evidenceQuality?.evidenceOperationCount ?? 0)],
            ["Source docs", formatNumber(detail.evidenceQuality?.sourceDocumentCount ?? 0)],
            ["Evidence ratio", formatPercent(detail.evidenceQuality?.evidenceRatio ?? 0)],
            ["Status", detail.evidenceQuality?.status ?? "not_available"],
          ]}
        />
        <DetailCard
          dataAttr="data-relationship-quality"
          title="Relationship Quality"
          rows={[
            ["Operations", formatNumber(detail.relationshipQuality?.relationshipOperationCount ?? 0)],
            ["Relationship files", formatNumber(detail.relationshipQuality?.relationshipSourceFiles ?? 0)],
            ["Integration files", formatNumber(detail.relationshipQuality?.integrationSourceFiles ?? 0)],
            ["Module graph plan", detail.relationshipQuality?.graphPlanAvailableForAllModules ? "available" : "not complete"],
          ]}
        />
      </div>

      <div className="dq-detail-grid dq-detail-grid-three">
        <NarrativeCard
          dataAttr="data-generated-risk"
          title="Generated / Synthetic Risk"
          items={detail.generatedDataRisk?.findings ?? ["No generated-data risk surfaced by the latest audit."]}
        />
        <NarrativeCard
          dataAttr="data-module-readiness-impact"
          title="Module Readiness Impact"
          items={detail.moduleReadiness?.findings ?? ["No module-readiness finding surfaced by the latest audit."]}
        />
        <NarrativeCard
          dataAttr="data-promotion-blockers"
          title="Promotion Blockers"
          items={[
            ...(detail.promotionReadiness?.blockers ?? []),
            ...(detail.promotionReadiness?.requiredBeforeActiveTruth ?? []),
          ]}
        />
      </div>

      <div className="dq-detail-grid dq-detail-grid-two">
        <NarrativeCard
          title="Warnings"
          items={detail.warnings.length > 0 ? detail.warnings : ["No warnings surfaced by the latest read-only audit."]}
        />
        <NarrativeCard
          dataAttr="data-admin-home-caveats"
          title="Admin / Home Caveats"
          items={[
            detail.adminHomeCaveat?.homeSummaryCaveat,
            detail.adminHomeCaveat?.gapsCaveat,
            detail.adminHomeCaveat?.sourcesCaveat,
            detail.adminHomeCaveat?.relationshipsCaveat,
          ].filter(Boolean) as string[]}
        />
      </div>
    </article>
  );
}

function DetailCard({
  title,
  rows,
  dataAttr,
}: {
  title: string;
  rows: Array<[string, string]>;
  dataAttr?: string;
}) {
  const attrs = dataAttr ? { [dataAttr]: true } : {};
  return (
    <div className="dq-detail-card" {...attrs}>
      <h4>{title}</h4>
      {rows.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function NarrativeCard({
  title,
  items,
  dataAttr,
}: {
  title: string;
  items: string[];
  dataAttr?: string;
}) {
  const attrs = dataAttr ? { [dataAttr]: true } : {};
  return (
    <div className="dq-detail-card" {...attrs}>
      <h4>{title}</h4>
      <ul>
        {(items.length > 0 ? items : ["No item surfaced by the latest audit."]).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function StatusChip({ status }: { status: AdminDataQualityStatus }) {
  return <span className={`dq-status dq-status-${status}`}>{status.replace("_", " ")}</span>;
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="dq-hero-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TruthPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="dq-truth-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RollupCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="dq-card dq-rollup-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

const pageStyle = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  background: "#F7F5F0",
  color: "#111827",
  fontFamily: sansStack,
} as const;

const pageCss = `
  [data-admin-data-quality] {
    --dq-ink: #111827;
    --dq-muted: #64748B;
    --dq-line: rgba(15, 23, 42, 0.12);
    --dq-navy: #07152D;
    --dq-green: #047857;
    --dq-amber: #B45309;
    --dq-red: #B91C1C;
    --dq-blue: #0284C7;
    padding: 26px 32px 64px;
  }
  [data-admin-data-quality] .dq-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 28px;
    align-items: start;
    border-radius: 8px;
    padding: 30px;
    background: linear-gradient(135deg, #07152D 0%, #0B1F3E 58%, #0B3B3A 100%);
    color: white;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.22);
  }
  [data-admin-data-quality] .dq-eyebrow {
    margin: 0;
    font-family: ${SHELL.MONO};
    font-size: 11px;
    letter-spacing: 0;
    text-transform: uppercase;
    color: #047857;
    font-weight: 850;
  }
  [data-admin-data-quality] .dq-hero .dq-eyebrow { color: #67E8F9; }
  [data-admin-data-quality] h1 {
    margin: 10px 0 0;
    font-size: 44px;
    line-height: 1.04;
    letter-spacing: 0;
    font-weight: 850;
  }
  [data-admin-data-quality] h2,
  [data-admin-data-quality] h3,
  [data-admin-data-quality] h4 {
    letter-spacing: 0;
  }
  [data-admin-data-quality] .dq-hero p:not(.dq-eyebrow) {
    margin: 14px 0 0;
    max-width: 1050px;
    color: #D9E2EA;
    font-size: 17px;
    line-height: 1.55;
  }
  [data-admin-data-quality] .dq-hero-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(128px, 1fr));
    gap: 10px;
    min-width: 500px;
  }
  [data-admin-data-quality] .dq-hero-metric {
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 8px;
    padding: 14px;
    background: rgba(255,255,255,0.08);
  }
  [data-admin-data-quality] .dq-hero-metric span,
  [data-admin-data-quality] .dq-truth-pill span,
  [data-admin-data-quality] .dq-rollup-card span {
    display: block;
    color: #94A3B8;
    font-size: 11px;
    font-family: ${SHELL.MONO};
    text-transform: uppercase;
    letter-spacing: 0;
    font-weight: 800;
  }
  [data-admin-data-quality] .dq-hero-metric strong {
    display: block;
    margin-top: 8px;
    color: #fff;
    font-size: 26px;
  }
  [data-admin-data-quality] .dq-card,
  [data-admin-data-quality] .dq-guardrails {
    border: 1px solid var(--dq-line);
    border-radius: 8px;
    background: #FFFFFF;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  }
  [data-admin-data-quality] .dq-guardrails {
    display: grid;
    grid-template-columns: minmax(0, 1fr) repeat(4, minmax(138px, 180px));
    gap: 12px;
    align-items: center;
    margin-top: 16px;
    padding: 18px;
  }
  [data-admin-data-quality] .dq-guardrails h2 {
    margin: 6px 0;
    font-size: 20px;
  }
  [data-admin-data-quality] .dq-guardrails p {
    margin: 0;
    color: #475569;
    font-size: 14px;
    line-height: 1.5;
  }
  [data-admin-data-quality] .dq-truth-pill {
    border-radius: 8px;
    padding: 12px;
    background: #F8FAFC;
    border: 1px solid rgba(15, 23, 42, 0.08);
  }
  [data-admin-data-quality] .dq-truth-pill strong {
    display: block;
    margin-top: 8px;
    color: var(--dq-green);
    font-size: 19px;
  }
  [data-admin-data-quality] .dq-rollup {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0;
  }
  [data-admin-data-quality] .dq-rollup-card {
    padding: 18px;
  }
  [data-admin-data-quality] .dq-rollup-card strong {
    display: block;
    margin-top: 8px;
    font-size: 34px;
    line-height: 1;
    color: var(--dq-ink);
  }
  [data-admin-data-quality] .dq-rollup-card p {
    margin: 10px 0 0;
    color: #475569;
    line-height: 1.45;
  }
  [data-admin-data-quality] .dq-matrix,
  [data-admin-data-quality] .dq-tenant {
    padding: 20px;
  }
  [data-admin-data-quality] .dq-section-head,
  [data-admin-data-quality] .dq-tenant-head {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 16px;
    margin-bottom: 16px;
  }
  [data-admin-data-quality] .dq-section-head h2,
  [data-admin-data-quality] .dq-tenant-head h3 {
    margin: 6px 0 0;
    font-size: 23px;
  }
  [data-admin-data-quality] .dq-section-head span {
    color: #64748B;
    font-size: 12px;
  }
  [data-admin-data-quality] .dq-table-wrap {
    overflow-x: auto;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 8px;
  }
  [data-admin-data-quality] table {
    border-collapse: collapse;
    min-width: 1420px;
    width: 100%;
    background: white;
  }
  [data-admin-data-quality] th {
    text-align: left;
    padding: 12px;
    background: #F8FAFC;
    color: #64748B;
    font-family: ${SHELL.MONO};
    font-size: 10px;
    letter-spacing: 0;
    text-transform: uppercase;
  }
  [data-admin-data-quality] td {
    vertical-align: top;
    padding: 12px;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    color: #172033;
    font-size: 13px;
    line-height: 1.45;
  }
  [data-admin-data-quality] td a {
    color: #07152D;
    font-weight: 800;
    text-decoration: none;
  }
  [data-admin-data-quality] td small {
    display: block;
    margin-top: 6px;
    color: #64748B;
    font-size: 12px;
  }
  [data-admin-data-quality] .dq-status {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 4px 8px;
    font-size: 10px;
    font-family: ${SHELL.MONO};
    text-transform: uppercase;
    letter-spacing: 0;
    font-weight: 850;
    border: 1px solid transparent;
  }
  [data-admin-data-quality] .dq-status-strong {
    color: #047857;
    background: #ECFDF5;
    border-color: #A7F3D0;
  }
  [data-admin-data-quality] .dq-status-partial {
    color: #0369A1;
    background: #F0F9FF;
    border-color: #BAE6FD;
  }
  [data-admin-data-quality] .dq-status-thin {
    color: #B45309;
    background: #FFFBEB;
    border-color: #FDE68A;
  }
  [data-admin-data-quality] .dq-status-blocked {
    color: #B91C1C;
    background: #FEF2F2;
    border-color: #FECACA;
  }
  [data-admin-data-quality] .dq-status-not_available {
    color: #475569;
    background: #F8FAFC;
    border-color: #CBD5E1;
  }
  [data-admin-data-quality] .dq-details {
    margin-top: 18px;
  }
  [data-admin-data-quality] .dq-tenant {
    margin-bottom: 16px;
    scroll-margin-top: 24px;
  }
  [data-admin-data-quality] .dq-alert {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 14px;
    border: 1px solid rgba(180, 83, 9, 0.30);
    border-radius: 8px;
    background: #FFFBEB;
    padding: 14px;
    color: #3F2D12;
    margin-bottom: 14px;
  }
  [data-admin-data-quality] .dq-alert strong {
    color: #92400E;
  }
  [data-admin-data-quality] .dq-detail-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-top: 12px;
  }
  [data-admin-data-quality] .dq-detail-grid-three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  [data-admin-data-quality] .dq-detail-grid-two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  [data-admin-data-quality] .dq-detail-card {
    border: 1px solid rgba(15, 23, 42, 0.10);
    border-radius: 8px;
    padding: 14px;
    background: #FCFCFB;
  }
  [data-admin-data-quality] .dq-detail-card h4 {
    margin: 0 0 10px;
    color: #07152D;
    font-size: 15px;
  }
  [data-admin-data-quality] .dq-detail-card div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 0;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
  }
  [data-admin-data-quality] .dq-detail-card div:first-of-type {
    border-top: 0;
  }
  [data-admin-data-quality] .dq-detail-card span {
    color: #64748B;
    font-size: 13px;
  }
  [data-admin-data-quality] .dq-detail-card strong {
    color: #111827;
    text-align: right;
    font-size: 13px;
  }
  [data-admin-data-quality] .dq-detail-card ul {
    margin: 0;
    padding-left: 18px;
    color: #334155;
    line-height: 1.5;
    font-size: 13px;
  }
  [data-admin-data-quality] .dq-detail-card li + li {
    margin-top: 7px;
  }
  @media (max-width: 1200px) {
    [data-admin-data-quality] .dq-hero,
    [data-admin-data-quality] .dq-guardrails,
    [data-admin-data-quality] .dq-rollup,
    [data-admin-data-quality] .dq-detail-grid,
    [data-admin-data-quality] .dq-detail-grid-three,
    [data-admin-data-quality] .dq-detail-grid-two {
      grid-template-columns: 1fr;
    }
    [data-admin-data-quality] .dq-hero-grid {
      min-width: 0;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
`;

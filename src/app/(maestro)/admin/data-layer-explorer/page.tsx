import { connection } from "next/server";

import { AppShell } from "@/components/shell/AppShell";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import {
  buildAdminDataLayerExplorerModel,
  type DataJourneyGuardrail,
  type DataJourneyInputCategory,
  type DataJourneyPageMapping,
  type DataJourneyQualityCheck,
  type DataJourneySection,
  type DataLayerExplorerReferenceAudit,
} from "@/lib/admin/data-layer-explorer";
import type { TenantManifestProjectionAudit } from "@/lib/admin/tenant-manifest-projection-audit";
import {
  readLatestTenantQualityMatrix,
  type TenantQualityMatrixArtifact,
  type TenantQualityMatrixRow,
} from "@/lib/enterprise-data/data-quality/all-tenant-data-quality-audit";
import {
  readLatestSkyHarborApplicationsRegeneration,
  type SkyHarborApplicationsRegenerationResult,
} from "@/lib/enterprise-data/remediation/skyharbor-applications-candidate-regeneration";
import {
  loadCandidateVersionBuildForAdmin,
  type CandidateVersionBuildReport,
  type TenantCandidateVersion,
} from "@/lib/enterprise-data/candidate-version-build/candidate-version-build";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { SHELL } from "@/lib/shell/shell-tokens";

export const metadata = {
  title: "Data Layer Explorer | AbarVa Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cardStyle = {
  border: "1px solid rgba(15, 23, 42, 0.10)",
  borderRadius: 8,
  background: "#FFFFFF",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
} as const;

const labelStyle = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  letterSpacing: 0,
  textTransform: "uppercase",
  color: "#64748B",
  fontWeight: 800,
} as const;

const sansStack =
  'Inter, "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default async function AdminDataLayerExplorerPage() {
  await connection();
  const tenant = await resolveAdminTenant();
  const model = buildAdminDataLayerExplorerModel(tenant.tenantName);
  const tenantQualityMatrix = await readLatestTenantQualityMatrix(
    process.cwd(),
  );
  const candidateVersionBuildState = await loadCandidateVersionBuildForAdmin({
    repoRoot: process.cwd(),
  });
  const candidateVersionBuild = candidateVersionBuildState.report;
  const skyHarborApplicationsRemediation =
    readLatestSkyHarborApplicationsRegeneration(process.cwd());

  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: tenant.tenantName,
        context: "Data Journey",
      }}
    >
      <main
        data-admin-data-layer-explorer
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          background: "#F5F7F8",
          color: "#0F172A",
          fontFamily: sansStack,
        }}
      >
        <style>
          {`
            html {
              scroll-behavior: smooth;
            }
            [data-admin-data-layer-explorer] {
              --journey-ink: #0F172A;
              --journey-muted: #64748B;
              --journey-line: rgba(15, 23, 42, 0.10);
            }
            [data-data-journey-left-nav] a {
              color: #334155;
              text-decoration: none;
            }
            [data-data-journey-left-nav] a:hover {
              color: #0F766E;
            }
            @media (max-width: 1100px) {
              [data-data-journey-left-nav] {
                position: static !important;
                max-height: none !important;
              }
            }
          `}
        </style>
        <div
          style={{
            maxWidth: 1680,
            margin: "0 auto",
            padding: "28px 32px 56px",
          }}
        >
          <section
            style={{
              borderRadius: 8,
              padding: 28,
              background:
                "linear-gradient(135deg, #08111F 0%, #0F172A 52%, #123B3A 100%)",
              color: "#FFFFFF",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.22)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 24,
                alignItems: "start",
              }}
            >
              <div>
                <p
                  style={{
                    ...labelStyle,
                    margin: 0,
                    color: "#67E8F9",
                  }}
                >
                  Data Journey · Read-only architecture map
                </p>
                <h1
                  style={{
                    margin: "10px 0 0",
                    fontSize: 46,
                    lineHeight: 1.05,
                    fontWeight: 850,
                    letterSpacing: 0,
                    color: "#FFFFFF",
                    fontFamily: sansStack,
                  }}
                >
                  Data Layer Explorer
                </h1>
                <p
                  style={{
                    margin: "14px 0 0",
                    maxWidth: 980,
                    color: "#D8E2EA",
                    fontSize: 18,
                    lineHeight: 1.55,
                    fontWeight: 500,
                  }}
                >
                  {model.subtitle}
                </p>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(130px, 1fr))",
                  gap: 10,
                  minWidth: 480,
                }}
              >
                <HeroMetric label="Client" value={tenant.tenantName} />
                <HeroMetric
                  label="Evidence source"
                  value={`${model.sections.length} sections`}
                />
                <HeroMetric
                  label="Input coverage"
                  value={`${model.inputCategories.length} categories`}
                />
              </div>
            </div>
          </section>

          <section
            style={{
              ...cardStyle,
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) repeat(4, minmax(150px, 190px))",
              gap: 14,
              padding: 16,
              marginTop: 16,
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ ...labelStyle, margin: 0 }}>Truth split</p>
              <h2 style={{ margin: "6px 0", fontSize: 20, color: "#0F172A" }}>
                Read-only architecture map, not an execution console.
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "#475569",
                  fontSize: 14,
                  lineHeight: 1.5,
                  maxWidth: 920,
                }}
              >
                This page explains where client files go, what becomes evidence,
                what is only candidate data, what can be promoted later, and
                which modules are allowed to use each layer.
              </p>
            </div>
            <TruthTile label="Production writes" value="false" />
            <TruthTile label="Candidate creation" value="false" />
            <TruthTile label="Candidate promotion" value="false" />
            <TruthTile label="Runtime change" value="false" />
          </section>

          <CandidateVersionBuildPanel
            report={candidateVersionBuild}
            loadSource={candidateVersionBuildState.source}
          />

          <AllTenantQualityPanel matrix={tenantQualityMatrix} />

          <ReferenceDataAuditPanel audit={model.referenceDataAudit} />

          <ManifestProjectionPanel audit={model.manifestProjectionAudit} />

          <SkyHarborApplicationsRemediationPanel
            remediation={skyHarborApplicationsRemediation}
          />

          <nav
            data-data-journey-left-nav
            aria-label="Data journey sections"
            style={{
              ...cardStyle,
              position: "sticky",
              top: 0,
              zIndex: 4,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              padding: 10,
              marginBottom: 16,
            }}
          >
            {model.sections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                style={{
                  display: "inline-flex",
                  gap: 7,
                  alignItems: "center",
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(15, 23, 42, 0.10)",
                  background: index === 0 ? "#0F172A" : "#FFFFFF",
                  color: index === 0 ? "#FFFFFF" : "#334155",
                  fontSize: 12,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    color: index === 0 ? "#67E8F9" : "#0F766E",
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{section.navLabel}</span>
              </a>
            ))}
          </nav>

          <section data-data-journey-grid>
            <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
              <FlowPanel
                steps={model.pipelineSteps.map((step) => step.label)}
              />
              {model.sections.map((section) => (
                <JourneySection
                  key={section.id}
                  section={section}
                  inputCategories={
                    section.id === "input-files" ? model.inputCategories : []
                  }
                  pageMappings={
                    section.id === "page-mapping" ? model.pageMappings : []
                  }
                  qualityChecks={
                    section.id === "quality-checks" ? model.qualityChecks : []
                  }
                  guardrails={
                    section.id === "guardrails" ? model.guardrails : []
                  }
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function CandidateVersionBuildPanel({
  report,
  loadSource,
}: {
  report: CandidateVersionBuildReport | null;
  loadSource: "report_artifact" | "runtime_deterministic_fallback" | "missing";
}) {
  if (!report) {
    return (
      <section
        data-candidate-version-build
        style={{
          ...cardStyle,
          padding: 18,
          marginBottom: 16,
          borderColor: "#FDBA74",
          background: "#FFF7ED",
        }}
      >
        <p style={{ ...labelStyle, margin: 0, color: "#C2410C" }}>
          Candidate versions
        </p>
        <h2 style={{ margin: "6px 0", color: SHELL.INK, fontSize: 22 }}>
          Candidate-version build artifact not generated yet.
        </h2>
        <p style={{ margin: 0, color: "#7C2D12", fontSize: 14 }}>
          Run <code>npm run build:candidate-version</code> to materialize
          reviewed canonical build output as inactive candidate preview
          metadata.
        </p>
      </section>
    );
  }

  const skyharbor = report.skyharborPreview;
  const meridian = report.meridianPreview;

  return (
    <section
      data-candidate-version-build
      style={{
        ...cardStyle,
        padding: 18,
        marginBottom: 16,
        borderColor: "#A7F3D0",
        background: "#F4FFFB",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) repeat(4, minmax(120px, 170px))",
          gap: 14,
          alignItems: "start",
        }}
      >
        <div>
          <p style={{ ...labelStyle, margin: 0, color: "#0F766E" }}>
            Candidate versions · inactive preview only
          </p>
          <h2 style={{ margin: "6px 0", color: SHELL.INK, fontSize: 22 }}>
            Reviewed canonical build output is available as inactive candidate
            read models.
          </h2>
          <p
            style={{
              margin: 0,
              color: "#14534A",
              fontSize: 14,
              lineHeight: 1.5,
              maxWidth: 900,
            }}
          >
            Source build <code>{report.sourceBuildId}</code> produced{" "}
            {report.summary.candidateVersionsCreated} candidate versions. Active
            tenant access, promotion, default Home reads, and module runtime
            reads remain unchanged. Load source: <code>{loadSource}</code>.
          </p>
        </div>
        <TruthTile
          label="Candidates"
          value={String(report.summary.candidateVersionsCreated)}
        />
        <TruthTile
          label="Records"
          value={report.summary.canonicalRecordsRepresented.toLocaleString()}
        />
        <TruthTile
          label="Promotion"
          value={String(report.guardrails.candidatePromoted)}
        />
        <TruthTile
          label="Default reads"
          value={String(report.guardrails.defaultHomeReadsCandidateData)}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        {skyharbor ? (
          <CandidateTenantProofCard
            candidate={skyharbor}
            focus="Airline Demo richness correction"
          />
        ) : null}
        {meridian ? (
          <CandidateTenantProofCard
            candidate={meridian}
            focus="Meridian healthcare context"
          />
        ) : null}
      </div>
    </section>
  );
}

function CandidateTenantProofCard({
  candidate,
  focus,
}: {
  candidate: TenantCandidateVersion;
  focus: string;
}) {
  const domains = Object.fromEntries(
    candidate.domainCounts.map((entry) => [
      entry.domain,
      entry.acceptedRecords,
    ]),
  );
  return (
    <article style={{ ...cardStyle, padding: 16, background: "#FFFFFF" }}>
      <p style={{ ...labelStyle, margin: 0, color: "#0F766E" }}>{focus}</p>
      <h3 style={{ margin: "6px 0", color: SHELL.INK, fontSize: 18 }}>
        {candidate.tenantDisplayName}
      </h3>
      <p
        style={{
          margin: 0,
          color: "#475569",
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        <code>{candidate.candidateVersionId}</code>
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
          marginTop: 12,
        }}
      >
        <MiniStat
          label="Apps/systems"
          value={(domains.applications_systems ?? 0).toLocaleString()}
        />
        <MiniStat
          label="Data assets"
          value={(domains.data_assets_integrations ?? 0).toLocaleString()}
        />
        <MiniStat
          label="Infra"
          value={(domains.infrastructure_platforms ?? 0).toLocaleString()}
        />
      </div>
      <p style={{ margin: "12px 0 0", color: "#475569", fontSize: 13 }}>
        Status: {candidate.creationStatus} · profile{" "}
        {candidate.enterpriseProfileStatus} ·{" "}
        {candidate.promotionBlockers.length} promotion blockers.
      </p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #DDE7E3",
        borderRadius: 8,
        padding: "9px 10px",
        background: "#F8FCFA",
      }}
    >
      <p style={{ ...labelStyle, margin: 0, fontSize: 10 }}>{label}</p>
      <p
        style={{
          margin: "4px 0 0",
          color: SHELL.INK,
          fontSize: 17,
          fontWeight: 900,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function AllTenantQualityPanel({
  matrix,
}: {
  matrix: TenantQualityMatrixArtifact | null;
}) {
  if (!matrix) {
    return (
      <section
        data-all-tenant-data-quality
        style={{
          ...cardStyle,
          padding: 18,
          marginBottom: 16,
          borderColor: "#FDBA74",
          background: "#FFF7ED",
        }}
      >
        <p style={{ ...labelStyle, margin: 0, color: "#C2410C" }}>
          All-tenant data quality
        </p>
        <h2 style={{ margin: "6px 0", color: SHELL.INK, fontSize: 22 }}>
          Audit bundle not generated yet.
        </h2>
        <p style={{ margin: 0, color: "#7C2D12", fontSize: 14 }}>
          Run <code>npm run audit:data-quality:all-tenants</code> to create the
          read-only quality matrix consumed by this page.
        </p>
      </section>
    );
  }

  const activeTenantKeys = new Set<string>(CANONICAL_TENANT_KEYS);
  const activeTenants = matrix.tenants.filter((tenant) =>
    activeTenantKeys.has(tenant.tenantKey),
  );
  const activeRollup = {
    tenantsScanned: activeTenants.length,
    sourceRichCandidateThinTenants: activeTenants.filter(
      (tenant) => tenant.sourceRichCandidateThin,
    ).length,
    falseGreenRiskTenants: activeTenants.filter(
      (tenant) => tenant.falseGreenRisk,
    ).length,
    relationshipGapTenants: activeTenants.filter(
      (tenant) => tenant.relationshipOperationCount === 0,
    ).length,
    generatedDataWatchTenants: activeTenants.filter(
      (tenant) => tenant.generatedDataRisk !== "pass",
    ).length,
    tenantIsolationFailures: activeTenants.filter(
      (tenant) => tenant.tenantIsolationStatus !== "pass",
    ).length,
    promotionUnsafeTenants: activeTenants.filter(
      (tenant) => tenant.promotionUnsafe,
    ).length,
  };
  const topRisks = activeTenants
    .filter(
      (tenant) => tenant.sourceRichCandidateThin || tenant.promotionUnsafe,
    )
    .slice(0, 6);

  return (
    <section
      data-all-tenant-data-quality
      style={{
        ...cardStyle,
        padding: 18,
        marginBottom: 16,
        borderColor: "#FCA5A5",
        background: "#FFF7F7",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 18,
          alignItems: "start",
          marginBottom: 14,
        }}
      >
        <div>
          <p style={{ ...labelStyle, margin: 0, color: "#BE123C" }}>
            Active-tenant data quality · latest audit
          </p>
          <h2 style={{ margin: "6px 0", color: SHELL.INK, fontSize: 22 }}>
            Source richness, candidate coverage, graph gaps, and promotion
            safety are now scored together.
          </h2>
          <p
            style={{
              margin: 0,
              color: "#7F1D1D",
              fontSize: 14,
              lineHeight: 1.55,
              maxWidth: 1050,
            }}
          >
            This panel is read-only. It does not create candidates, promote
            data, write production tables, update Active Tenant Access, or
            change module runtime reads. It renders only the active canonical
            tenants even when the stored audit artifact still contains retired
            tenant history.
          </p>
        </div>
        <StatusPill>{`${activeRollup.promotionUnsafeTenants} promotion unsafe`}</StatusPill>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <QualityMetric
          label="Tenants"
          value={String(activeRollup.tenantsScanned)}
        />
        <QualityMetric
          label="Source-rich thin"
          value={String(activeRollup.sourceRichCandidateThinTenants)}
        />
        <QualityMetric
          label="False green"
          value={String(activeRollup.falseGreenRiskTenants)}
        />
        <QualityMetric
          label="Graph gaps"
          value={String(activeRollup.relationshipGapTenants)}
        />
        <QualityMetric
          label="Generated watch"
          value={String(activeRollup.generatedDataWatchTenants)}
        />
        <QualityMetric
          label="Isolation fail"
          value={String(activeRollup.tenantIsolationFailures)}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 10,
        }}
      >
        {topRisks.map((tenant) => (
          <TenantQualityCard key={tenant.tenantKey} tenant={tenant} />
        ))}
      </div>
    </section>
  );
}

function QualityMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(190, 18, 60, 0.16)",
        borderRadius: 8,
        padding: 12,
        background: "#FFFFFF",
      }}
    >
      <p style={{ ...labelStyle, margin: 0, color: "#9F1239" }}>{label}</p>
      <p
        style={{
          margin: "6px 0 0",
          color: SHELL.INK,
          fontSize: 24,
          lineHeight: 1,
          fontWeight: 900,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function TenantQualityCard({ tenant }: { tenant: TenantQualityMatrixRow }) {
  return (
    <article
      style={{
        border: "1px solid rgba(190, 18, 60, 0.14)",
        borderRadius: 8,
        background: "#FFFFFF",
        padding: 14,
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "start",
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: SHELL.INK, fontSize: 16 }}>
            {tenant.tenantDisplayName}
          </h3>
          <p
            style={{
              margin: "5px 0 0",
              color: SHELL.INK_SOFT,
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {tenant.sourceStructuredRows.toLocaleString()} source rows ·{" "}
            {(tenant.candidateCoverageRatio * 100).toFixed(1)}% candidate
            coverage
          </p>
        </div>
        <StatusPill>{tenant.overallStatus}</StatusPill>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        <CompactStat
          label="Candidate"
          value={String(tenant.candidateRecordsGenerated)}
        />
        <CompactStat
          label="Graph ops"
          value={String(tenant.relationshipOperationCount)}
        />
        <CompactStat
          label="Thin"
          value={tenant.sourceRichCandidateThin ? "yes" : "no"}
        />
      </div>
      <p
        style={{
          margin: 0,
          color: "#7F1D1D",
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        {tenant.recommendedNextAction}
      </p>
    </article>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        background: "#FAFAF9",
        padding: 8,
      }}
    >
      <p style={{ ...labelStyle, margin: 0, fontSize: 10 }}>{label}</p>
      <p
        style={{
          margin: "4px 0 0",
          color: SHELL.INK,
          fontSize: 14,
          fontWeight: 900,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function ReferenceDataAuditPanel({
  audit,
}: {
  audit: DataLayerExplorerReferenceAudit;
}) {
  return (
    <section
      data-reference-data-audit
      style={{
        ...cardStyle,
        padding: 18,
        marginBottom: 16,
        borderColor: "#F7C948",
        background: "#FFFDF4",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 16,
          alignItems: "start",
          marginBottom: 14,
        }}
      >
        <div>
          <p style={{ ...labelStyle, margin: 0, color: "#92400E" }}>
            Reference tenant audit · {audit.tenantDisplayName}
          </p>
          <h2 style={{ margin: "6px 0", color: SHELL.INK, fontSize: 22 }}>
            Rich source exists, but candidate coverage needs review.
          </h2>
          <p
            style={{
              margin: 0,
              color: "#6B5B21",
              fontSize: 14,
              lineHeight: 1.55,
              maxWidth: 980,
            }}
          >
            The Airline Demo source pack contains mainframe, Teradata, SAP, BI,
            integration, and platform volumetric evidence. The current candidate
            proof only covers a minimal slice, so this page marks it as
            review-required before any active promotion.
          </p>
        </div>
        <StatusPill>{audit.status.replace(/_/g, " ")}</StatusPill>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <AuditList
          title="Source richness found"
          items={audit.sourceRichness.map(
            (item) => `${item.label}: ${item.value} · ${item.evidence}`,
          )}
        />
        <AuditList
          title="Candidate coverage"
          items={audit.candidateCoverage.map(
            (item) =>
              `${item.label}: ${item.value} · ${item.status} · ${item.evidence}`,
          )}
        />
        <AuditList
          title="Data quality signals"
          items={audit.qualitySignals.map(
            (signal) =>
              `${signal.severity}: ${signal.finding} Action: ${signal.recommendedAction}`,
          )}
        />
      </div>
    </section>
  );
}

function ManifestProjectionPanel({
  audit,
}: {
  audit: TenantManifestProjectionAudit;
}) {
  const skyHarborFindings = audit.skyHarborRequiredFindings;
  const tenantRows = audit.tenants;
  const adapterGapItems = formatDomainGapItems(
    audit,
    (domain) => domain.sourceFilesDiscovered > 0 && !domain.adapterExists,
    (tenant, domain) =>
      `${tenant.displayName} · ${domain.label}: adapter missing for ${domain.sourceFilesDiscovered} discovered source files.`,
  );
  const mappingGapItems = formatDomainGapItems(
    audit,
    (domain) =>
      domain.sourceFilesDiscovered > 0 && !domain.mappingProfileExists,
    (tenant, domain) =>
      `${tenant.displayName} · ${domain.label}: mapping missing; manifest included ${domain.candidateManifestIncluded}; Home rows ${domain.activeHomeRows.toLocaleString()}.`,
  );
  const homeAvaWarningItems = formatDomainGapItems(
    audit,
    (domain) =>
      domain.sourceFilesDiscovered > 0 &&
      (!domain.homeVisible ||
        !domain.avaReadable ||
        domain.richestSourceRows > domain.activeHomeRows ||
        domain.reasonIfExcluded !== null),
    (tenant, domain) =>
      `${tenant.displayName} · ${domain.label}: Home visible ${domain.homeVisible}; aVa readable ${domain.avaReadable}; Home rows ${domain.activeHomeRows.toLocaleString()} vs richest source rows ${domain.richestSourceRows.toLocaleString()}${domain.reasonIfExcluded ? `; ${domain.reasonIfExcluded}` : ""}.`,
  );
  const promotionBlockerItems = audit.promotionBlockers
    .slice(0, 12)
    .map((blocker) => `${blocker.tenantName}: ${blocker.blocker}`);

  return (
    <section
      data-manifest-projection-audit
      style={{
        ...cardStyle,
        padding: 18,
        marginBottom: 16,
        borderColor: "#FCA5A5",
        background: "#FFF7F7",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 16,
          alignItems: "start",
          marginBottom: 14,
        }}
      >
        <div>
          <p style={{ ...labelStyle, margin: 0, color: "#BE123C" }}>
            Tenant manifest completeness · source projection
          </p>
          <h2 style={{ margin: "6px 0", color: SHELL.INK, fontSize: 22 }}>
            Rich source must be visible before candidate, Home, or aVa can claim
            readiness.
          </h2>
          <p
            style={{
              margin: 0,
              color: "#7F1D1D",
              fontSize: 14,
              lineHeight: 1.55,
              maxWidth: 1080,
            }}
          >
            This read-only audit compares discovered source files against
            candidate manifests, adapter and mapping coverage, active Home
            representation, aVa readability, and promotion blockers. It does not
            regenerate candidates, promote data, write tenant tables, or change
            module runtime reads.
          </p>
        </div>
        <StatusPill>{`${audit.promotionBlockers.length} blockers`}</StatusPill>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <QualityMetric label="Tenants" value={String(audit.tenants.length)} />
        <QualityMetric
          label="Source files"
          value={String(audit.sourceFiles.length)}
        />
        <QualityMetric
          label="Excluded"
          value={String(audit.excludedTenants.length)}
        />
        <QualityMetric
          label="Alignment"
          value={audit.uploadPathAlignment.adminUploadAlignment}
        />
      </div>

      <div
        style={{
          border: "1px solid rgba(190, 18, 60, 0.14)",
          borderRadius: 8,
          background: "#FFFFFF",
          padding: 12,
          marginBottom: 14,
        }}
      >
        <p style={{ ...labelStyle, margin: "0 0 8px", color: "#9F1239" }}>
          Upload path alignment
        </p>
        <p
          style={{
            margin: 0,
            color: "#7F1D1D",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Canonical landing should be{" "}
          <code>{`${audit.uploadPathAlignment.canonicalLandingContainer}/${audit.uploadPathAlignment.canonicalLandingPrefix}`}</code>
          . Current loader scan is{" "}
          <code>{`${audit.uploadPathAlignment.currentLoaderLandingContainer}/${audit.uploadPathAlignment.currentLoaderLandingPrefix}`}</code>
          . Legacy staging remains{" "}
          <code>{audit.uploadPathAlignment.legacyStagingContainer}</code>.
          Required correction: {audit.uploadPathAlignment.requiredCorrection}
        </p>
      </div>

      <div style={{ overflowX: "auto", marginBottom: 14 }}>
        <table
          style={{
            width: "100%",
            minWidth: 980,
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              {[
                "Tenant",
                "Status",
                "Source files",
                "Structured rows",
                "Included files",
                "Candidate rows",
                "Home rows",
                "Blockers",
              ].map((heading) => (
                <th
                  key={heading}
                  style={{
                    ...labelStyle,
                    textAlign: "left",
                    borderBottom: "1px solid rgba(190, 18, 60, 0.16)",
                    padding: "9px 8px",
                    color: "#9F1239",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenantRows.map((tenant) => (
              <tr key={tenant.tenantKey}>
                <td style={manifestCellStyle}>{tenant.displayName}</td>
                <td style={manifestCellStyle}>
                  <StatusPill>{tenant.status}</StatusPill>
                </td>
                <td style={manifestCellStyle}>
                  {tenant.sourceFilesDiscovered}
                </td>
                <td style={manifestCellStyle}>
                  {tenant.sourceStructuredRows.toLocaleString()}
                </td>
                <td style={manifestCellStyle}>
                  {tenant.candidateManifestIncludedFiles}
                </td>
                <td style={manifestCellStyle}>
                  {tenant.candidateRecordsGenerated.toLocaleString()}
                </td>
                <td style={manifestCellStyle}>
                  {tenant.activeHomeContextRows.toLocaleString()}
                </td>
                <td style={manifestCellStyle}>{tenant.blockers.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <AuditList
          title="Adapter gaps"
          items={
            adapterGapItems.length
              ? adapterGapItems
              : ["No adapter gaps detected for discovered source domains."]
          }
        />
        <AuditList
          title="Mapping gaps"
          items={
            mappingGapItems.length
              ? mappingGapItems
              : ["No mapping gaps detected for discovered source domains."]
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <AuditList
          title="Home/aVa representation warnings"
          items={
            homeAvaWarningItems.length
              ? homeAvaWarningItems
              : ["No Home/aVa representation warnings detected."]
          }
        />
        <AuditList
          title="Promotion blockers"
          items={
            promotionBlockerItems.length
              ? promotionBlockerItems
              : ["No promotion blockers detected by this audit."]
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <AuditList
          title="Airline Demo required findings"
          items={skyHarborFindings.map(
            (item) =>
              `${item.label}: accessible ${item.accessible}; manifest included ${item.includedInCandidateManifest}; rows ${item.rowCount ?? "n/a"}; ${item.path}`,
          )}
        />
        <AuditList
          title="Retired / excluded tenants"
          items={[
            `${audit.excludedTenants.length} retired registry record${audit.excludedTenants.length === 1 ? "" : "s"} hidden from live admin rendering.`,
          ]}
        />
      </div>
    </section>
  );
}

function SkyHarborApplicationsRemediationPanel({
  remediation,
}: {
  remediation: SkyHarborApplicationsRegenerationResult;
}) {
  const selectedSource = remediation.selectedSource;
  return (
    <section
      data-skyharbor-applications-remediation
      style={{
        ...cardStyle,
        padding: 18,
        marginBottom: 16,
        borderColor: "#99F6E4",
        background: "#F0FDFA",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 16,
          alignItems: "start",
          marginBottom: 14,
        }}
      >
        <div>
          <p style={{ ...labelStyle, margin: 0, color: "#0F766E" }}>
            DATA-PR32 · Airline Demo applications/systems remediation
          </p>
          <h2 style={{ margin: "6px 0", color: SHELL.INK, fontSize: 22 }}>
            Rich application estate regenerated as inactive candidate preview.
          </h2>
          <p
            style={{
              margin: 0,
              color: "#134E4A",
              fontSize: 14,
              lineHeight: 1.55,
              maxWidth: 1080,
            }}
          >
            This dry-run selects the authoritative Airline Demo
            application/system estate, maps it into canonical candidate records,
            attaches row-level evidence, plans relationship candidates, and
            keeps default Home and runtime module reads unchanged.
          </p>
        </div>
        <StatusPill>
          {remediation.candidatePreviewSummary.materialExpansionAchieved
            ? "candidate preview expanded"
            : "review required"}
        </StatusPill>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <QualityMetric
          label="Selected source rows"
          value={remediation.counts.authoritativeSourceRows.toLocaleString()}
        />
        <QualityMetric
          label="Candidate records"
          value={remediation.counts.acceptedCandidateRecords.toLocaleString()}
        />
        <QualityMetric
          label="Quarantined"
          value={remediation.counts.quarantinedRows.toLocaleString()}
        />
        <QualityMetric
          label="Relationships planned"
          value={remediation.counts.relationshipCandidatesPlanned.toLocaleString()}
        />
      </div>

      <div
        style={{
          border: "1px solid rgba(15, 118, 110, 0.18)",
          borderRadius: 8,
          background: "#FFFFFF",
          padding: 12,
          marginBottom: 14,
        }}
      >
        <p style={{ ...labelStyle, margin: "0 0 8px", color: "#0F766E" }}>
          Selected source
        </p>
        <p
          style={{
            margin: 0,
            color: "#134E4A",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <strong>{selectedSource.label}</strong> · {selectedSource.rowCount}{" "}
          rows · <code>{selectedSource.path}</code>.{" "}
          {selectedSource.selectionReason}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <AuditList
          title="Source selection"
          items={remediation.sourceSelection.map(
            (source) =>
              `${source.label}: ${source.role}; rows ${source.rowCount}; ${source.selectionReason}`,
          )}
        />
        <AuditList
          title="Evidence and quality"
          items={[
            `Evidence references attached: ${remediation.counts.evidenceReferencesAttached.toLocaleString()}.`,
            `Warnings: ${remediation.counts.warningCandidateRecords.toLocaleString()}.`,
            `Source conflicts reported, not merged: ${remediation.counts.sourceConflictsReported.toLocaleString()}.`,
            `Generated/thin-data risk rows: ${remediation.qualityChecks.generatedInconsistentRowRisk.toLocaleString()}.`,
          ]}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <AuditList
          title="Relationship candidates"
          items={Object.entries(remediation.relationshipSummary).map(
            ([relationshipType, count]) =>
              `${relationshipType.replace(/_/g, " ")}: ${count.toLocaleString()}`,
          )}
        />
        <AuditList
          title="Promotion blockers"
          items={remediation.promotionBlockers}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <AuditList
          title="Home/aVa impact"
          items={[
            `Default Home active context changed: ${remediation.homeAdminPreviewImpact.defaultHomeActiveContextChanged}.`,
            `Candidate preview explicit only: ${remediation.homeAdminPreviewImpact.candidatePreviewExplicitOnly}.`,
            `Candidate data leaks into default Home: ${remediation.homeAdminPreviewImpact.candidateDataLeaksIntoDefaultHome}.`,
            `aVa reads candidate by default: ${remediation.homeAdminPreviewImpact.avaReadsCandidateByDefault}.`,
          ]}
        />
        <AuditList
          title="Upload path alignment"
          items={[
            `Selected source path mode: ${remediation.uploadPathAlignment.selectedSourcePathMode}.`,
            `Canonical landing: ${remediation.uploadPathAlignment.canonicalLandingPath}.`,
            `Current loader scan: ${remediation.uploadPathAlignment.currentLoaderScanPath}.`,
            `Follow-up: ${remediation.uploadPathAlignment.followUp}.`,
          ]}
        />
      </div>
    </section>
  );
}

function formatDomainGapItems(
  audit: TenantManifestProjectionAudit,
  predicate: (
    domain: TenantManifestProjectionAudit["tenants"][number]["domains"][number],
    tenant: TenantManifestProjectionAudit["tenants"][number],
  ) => boolean,
  format: (
    tenant: TenantManifestProjectionAudit["tenants"][number],
    domain: TenantManifestProjectionAudit["tenants"][number]["domains"][number],
  ) => string,
) {
  return audit.tenants
    .flatMap((tenant) =>
      tenant.domains
        .filter((domain) => predicate(domain, tenant))
        .map((domain) => format(tenant, domain)),
    )
    .slice(0, 12);
}

const manifestCellStyle = {
  padding: "10px 8px",
  borderBottom: "1px solid rgba(190, 18, 60, 0.10)",
  color: SHELL.INK_SOFT,
  verticalAlign: "top" as const,
};

function AuditList({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        border: "1px solid rgba(146, 64, 14, 0.18)",
        borderRadius: 8,
        padding: 14,
        background: "#FFFFFF",
        minWidth: 0,
      }}
    >
      <p style={{ ...labelStyle, margin: "0 0 10px", color: "#92400E" }}>
        {title}
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
        {items.map((item) => (
          <li
            key={item}
            style={{
              color: SHELL.INK_SOFT,
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: 8,
        padding: 12,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
      }}
    >
      <p style={{ ...labelStyle, margin: 0, color: "#A7F3D0" }}>{label}</p>
      <p
        style={{
          margin: "7px 0 0",
          color: "#FFFFFF",
          fontSize: 16,
          lineHeight: 1.25,
          fontWeight: 850,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function TruthTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #BFE7DE",
        borderRadius: 8,
        padding: "10px 12px",
        background: "#F0FBF8",
      }}
    >
      <p style={{ ...labelStyle, margin: 0, color: "#0F766E" }}>{label}</p>
      <p
        style={{
          margin: "5px 0 0",
          fontFamily: SHELL.MONO,
          fontSize: 18,
          fontWeight: 900,
          color: "#0F766E",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function FlowPanel({ steps }: { steps: string[] }) {
  return (
    <section
      style={{ ...cardStyle, padding: 18 }}
      aria-label="Input to active access flow"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "baseline",
          marginBottom: 14,
        }}
      >
        <div>
          <p style={{ ...labelStyle, margin: 0 }}>Governed flow</p>
          <h2 style={{ margin: "6px 0 0", fontSize: 22, color: SHELL.INK }}>
            From input files to module context
          </h2>
        </div>
        <p
          style={{
            margin: 0,
            color: SHELL.INK_MUTED,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {steps.length} controlled steps
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 8,
        }}
      >
        {steps.map((step, index) => (
          <div
            key={step}
            style={{
              border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              borderRadius: 8,
              padding: 10,
              background: index < 13 ? "#FFFFFF" : "#FFF8ED",
              minHeight: 74,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#0F766E",
                fontFamily: SHELL.MONO,
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </p>
            <p
              style={{
                margin: "6px 0 0",
                color: SHELL.INK,
                fontSize: 13,
                fontWeight: 800,
                lineHeight: 1.35,
              }}
            >
              {step}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function JourneySection({
  section,
  inputCategories,
  pageMappings,
  qualityChecks,
  guardrails,
}: {
  section: DataJourneySection;
  inputCategories: DataJourneyInputCategory[];
  pageMappings: DataJourneyPageMapping[];
  qualityChecks: DataJourneyQualityCheck[];
  guardrails: DataJourneyGuardrail[];
}) {
  return (
    <section
      id={section.id}
      data-data-journey-section={section.id}
      style={{ ...cardStyle, padding: 22, scrollMarginTop: 18 }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 14,
          alignItems: "start",
          marginBottom: 18,
        }}
      >
        <div>
          <p style={{ ...labelStyle, margin: 0 }}>
            {section.internalName
              ? `${section.navLabel} · ${section.internalName}`
              : section.navLabel}
          </p>
          <h2 style={{ margin: "8px 0", fontSize: 26, color: SHELL.INK }}>
            {section.title}
          </h2>
          <p
            style={{
              margin: 0,
              color: SHELL.INK_SOFT,
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: 940,
            }}
          >
            {section.plainEnglish}
          </p>
        </div>
        <StatusPill>{section.currentStatus}</StatusPill>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <ListPanel title="What goes in" items={section.goesIn} />
        <ListPanel title="What comes out" items={section.comesOut} />
        <ListPanel title="Used by" items={section.usedBy} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        <ListPanel title="Example records" items={section.exampleRecords} />
        <ListPanel title="What can go wrong" items={section.whatCanGoWrong} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        <ListPanel title="Quality checks" items={section.qualityChecks} />
        <ListPanel title="Guardrails" items={section.guardrails} />
      </div>

      {inputCategories.length ? (
        <InputCategoryGrid categories={inputCategories} />
      ) : null}
      {pageMappings.length ? <PageMappingGrid mappings={pageMappings} /> : null}
      {qualityChecks.length ? (
        <QualityCheckGrid checks={qualityChecks} />
      ) : null}
      {guardrails.length ? <GuardrailGrid guardrails={guardrails} /> : null}
    </section>
  );
}

function StatusPill({ children }: { children: string }) {
  return (
    <span
      style={{
        maxWidth: 300,
        border: "1px solid #C7E8DF",
        borderRadius: 999,
        padding: "8px 10px",
        background: "#F0FBF8",
        color: "#0F766E",
        fontSize: 12,
        fontWeight: 900,
        lineHeight: 1.35,
      }}
    >
      {children}
    </span>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: 8,
        padding: 14,
        background: "#FCFBF8",
        minWidth: 0,
      }}
    >
      <p style={{ ...labelStyle, margin: "0 0 10px" }}>{title}</p>
      <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 7 }}>
        {items.map((item) => (
          <li
            key={item}
            style={{
              color: SHELL.INK_SOFT,
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InputCategoryGrid({
  categories,
}: {
  categories: DataJourneyInputCategory[];
}) {
  return (
    <div data-input-category-grid style={{ marginTop: 18 }}>
      <p style={{ ...labelStyle, margin: "0 0 10px" }}>
        Input category catalogue
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
          gap: 12,
        }}
      >
        {categories.map((category) => (
          <article
            key={category.id}
            data-input-category={category.id}
            style={{
              border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              borderRadius: 8,
              padding: 14,
              background: "#FFFFFF",
              display: "grid",
              gap: 10,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 17, color: SHELL.INK }}>
                {category.label}
              </h3>
              <p
                style={{
                  margin: "6px 0 0",
                  color: SHELL.INK_SOFT,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {category.purpose}
              </p>
            </div>
            <CompactMeta label="Owner" value={category.owner} />
            <CompactMeta
              label="Accepted"
              value={category.acceptedFileTypes.join(", ")}
            />
            <CompactMeta
              label="Required"
              value={category.requiredFields.join(", ")}
            />
            <CompactMeta
              label="Optional"
              value={category.optionalFields.join(", ")}
            />
            <CompactMeta label="Mapped layer" value={category.mappedLayer} />
            <CompactMeta
              label="Module impact"
              value={category.moduleImpact.join(", ")}
            />
            <CompactMeta
              label="Readiness impact"
              value={category.readinessImpact}
            />
            <div
              style={{
                borderRadius: 8,
                background: "#F8FAFC",
                padding: 10,
                border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              }}
            >
              <p style={{ ...labelStyle, margin: "0 0 6px" }}>Example row</p>
              <code
                style={{
                  display: "block",
                  whiteSpace: "normal",
                  color: SHELL.INK,
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {Object.entries(category.sampleRow)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(" · ")}
              </code>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function PageMappingGrid({ mappings }: { mappings: DataJourneyPageMapping[] }) {
  return (
    <div data-page-layer-map style={{ marginTop: 18 }}>
      <p style={{ ...labelStyle, margin: "0 0 10px" }}>Page-to-layer map</p>
      <div style={{ display: "grid", gap: 12 }}>
        {mappings.map((mapping) => (
          <article
            key={mapping.page}
            style={{
              border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              borderRadius: 8,
              padding: 14,
              background: "#FFFFFF",
            }}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: 18, color: SHELL.INK }}>
              {mapping.page}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              <ListPanel title="Reads from" items={mapping.readsFrom} />
              <ListPanel title="Writes to" items={mapping.writesTo} />
              <ListPanel
                title="Does not write to"
                items={mapping.doesNotWriteTo}
              />
              <ListPanel title="Depends on" items={mapping.dependsOn} />
              <ListPanel title="Guardrails" items={mapping.guardrails} />
              <ListPanel title="Caveats" items={mapping.caveats} />
            </div>
            <p
              style={{
                margin: "12px 0 0",
                color: "#0F766E",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              Current wiring: {mapping.currentWiringStatus}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function QualityCheckGrid({ checks }: { checks: DataJourneyQualityCheck[] }) {
  return (
    <div data-quality-checks style={{ marginTop: 18 }}>
      <p style={{ ...labelStyle, margin: "0 0 10px" }}>
        Quality check catalogue
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {checks.map((check) => (
          <article
            key={check.id}
            style={{
              border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              borderRadius: 8,
              padding: 14,
              background: "#FFFFFF",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, color: SHELL.INK }}>
              {check.label}
            </h3>
            <p
              style={{
                margin: "8px 0",
                color: SHELL.INK_SOFT,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {check.purpose}
            </p>
            <CompactMeta
              label="Applies to"
              value={check.appliesTo.join(", ")}
            />
            <CompactMeta label="Status" value={check.currentStatus} />
            <CompactMeta label="Failure mode" value={check.failureMode} />
          </article>
        ))}
      </div>
    </div>
  );
}

function GuardrailGrid({ guardrails }: { guardrails: DataJourneyGuardrail[] }) {
  return (
    <div data-guardrails style={{ marginTop: 18 }}>
      <p style={{ ...labelStyle, margin: "0 0 10px" }}>Guardrail catalogue</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {guardrails.map((guardrail) => (
          <article
            key={guardrail.id}
            style={{
              border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              borderRadius: 8,
              padding: 14,
              background: "#FFFFFF",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, color: SHELL.INK }}>
              {guardrail.statement}
            </h3>
            <p
              style={{
                margin: "8px 0",
                color: SHELL.INK_SOFT,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {guardrail.reason}
            </p>
            <CompactMeta
              label="Enforced by"
              value={guardrail.enforcedBy.join(", ")}
            />
            <CompactMeta label="Status" value={guardrail.status} />
          </article>
        ))}
      </div>
    </div>
  );
}

function CompactMeta({ label, value }: { label: string; value: string }) {
  return (
    <p
      style={{
        margin: 0,
        display: "grid",
        gridTemplateColumns: "112px minmax(0, 1fr)",
        gap: 10,
        fontSize: 12,
        lineHeight: 1.45,
        color: SHELL.INK_SOFT,
      }}
    >
      <span
        style={{
          color: SHELL.INK_MUTED,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: 0,
          fontSize: 10,
        }}
      >
        {label}
      </span>
      <span>{value}</span>
    </p>
  );
}

import { connection } from "next/server";

import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { AgentRail } from "@/components/admin/AgentRail";
import { ContextBar } from "@/components/admin/ContextBar";
import { EditorialCanvas } from "@/components/admin/EditorialCanvas";
import {
  CANDIDATE_PREVIEW_BANNER,
  evaluateCandidatePreviewEnablement,
  normalizeRequest,
  validateExplicitRequest,
} from "@/lib/enterprise-data/candidate-preview-enablement/candidate-preview-enablement";
import {
  SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE,
  type CandidatePreviewModule,
} from "@/lib/enterprise-data/candidate-preview-enablement/skyharbor-preview-package";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";

export const metadata = {
  title: "Candidate Preview | AbarVa Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageSearchParams {
  preview?: string;
  tenantKey?: string;
  candidateVersionId?: string;
  module?: string;
  previewReason?: string;
  operatorId?: string;
  ack?: string;
}

export default async function CandidatePreviewPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  await connection();
  const tenant = await resolveAdminTenant();
  const params = searchParams ? await searchParams : {};
  const request = normalizeRequest({
    operatorId: params.operatorId,
    tenantKey: params.tenantKey,
    candidateVersionId: params.candidateVersionId,
    module: parseModule(params.module),
    previewReason: params.previewReason,
    previewModeFlag: params.preview === "enabled" ? "enabled" : "",
    acknowledgedNotActiveRuntimeTruth: params.ack === "not-active-truth",
    requestSource: "admin_page",
  });
  const validationErrors = validateExplicitRequest(request);
  const report =
    validationErrors.length === 0
      ? evaluateCandidatePreviewEnablement({
          generatedAt: new Date().toISOString(),
          request,
        })
      : null;
  const selectedModule =
    report?.selectedModulePacket ??
    SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.modulePackets[0]!;

  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open release ledger"
          primaryActionHref="/admin/releases"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Admin · Candidate Data"
        title="Candidate Preview Mode"
        subtitle="Inspect an inactive SkyHarbor candidate only when the operator request carries the explicit preview flag and acknowledgement."
      >
        <ContextBar
          tenant="SkyHarbor synthetic/reference"
          mode="Explicit candidate preview"
          agent="Steward"
          data="Inactive candidate package"
          liveStatus={
            report?.qualityGateStatus === "pass"
              ? "Preview request accepted"
              : "Preview disabled by default"
          }
          liveStatusKind={
            report?.qualityGateStatus === "pass" ? "live" : "partial"
          }
        />

        <section style={styles.banner}>
          <div style={styles.bannerLabel}>Required preview banner</div>
          <strong>{CANDIDATE_PREVIEW_BANNER}</strong>
        </section>

        {report ? (
          <section style={styles.panel}>
            <div style={styles.kicker}>Explicit request accepted</div>
            <h2 style={styles.heading}>
              {selectedModule.module} preview packet
            </h2>
            <p style={styles.copy}>
              This is a read-only candidate inspection. Active tenant truth,
              module default reads, production tenant data, and promotion state
              remain unchanged.
            </p>
            <div style={styles.metrics}>
              <Metric label="Facts" value={selectedModule.facts} />
              <Metric
                label="Relationships"
                value={selectedModule.relationships}
              />
              <Metric
                label="Evidence keys"
                value={selectedModule.evidenceKeys}
              />
              <Metric label="Runtime eligible" value="false" />
            </div>
            <GuardrailIndicators report={report} />
          </section>
        ) : (
          <section style={styles.panel}>
            <div style={styles.kicker}>Preview disabled</div>
            <h2 style={styles.heading}>Explicit request required</h2>
            <p style={styles.copy}>
              The page refused candidate preview because the request is missing
              one or more controls. Add the preview flag, tenant, candidate,
              module, operator, reason, and acknowledgement to inspect an
              inactive packet.
            </p>
            <ul style={styles.list}>
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </section>
        )}

        <section style={styles.grid}>
          {SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.modulePackets.map((packet) => (
            <article key={packet.module} style={styles.moduleCard}>
              <div style={styles.kicker}>{packet.module}</div>
              <h3 style={styles.cardTitle}>
                {packet.facts} facts · {packet.evidenceKeys} evidence keys
              </h3>
              <p style={styles.cardCopy}>
                Default source remains {packet.defaultRuntimeSource}. Preview
                source is {packet.previewSource}. Runtime eligible: false.
              </p>
            </article>
          ))}
        </section>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function GuardrailIndicators({
  report,
}: {
  report: NonNullable<ReturnType<typeof evaluateCandidatePreviewEnablement>>;
}) {
  const rows = [
    {
      label: "candidatePromoted",
      value: report.guardrails.candidatePromoted,
    },
    {
      label: "activeTenantAccessLayerUpdated",
      value: report.guardrails.activeTenantAccessLayerUpdated,
    },
    {
      label: "productionTenantDataWritten",
      value: report.guardrails.productionTenantDataWritten,
    },
    {
      label: "moduleRuntimeConsumptionChanged",
      value: report.guardrails.moduleRuntimeConsumptionChanged,
    },
    {
      label: "moduleReadsCandidateByDefault",
      value: report.guardrails.moduleReadsCandidateByDefault,
    },
    {
      label: "previewModeRequiresExplicitFlag",
      value: report.guardrails.previewModeRequiresExplicitFlag,
    },
  ];

  return (
    <div
      aria-label="Candidate preview guardrail indicators"
      data-candidate-preview-guardrails="true"
      style={styles.guardrails}
    >
      <div style={styles.kicker}>Guardrail indicators</div>
      <div style={styles.guardrailGrid}>
        {rows.map((row) => (
          <div
            key={row.label}
            data-candidate-preview-guardrail={row.label}
            style={styles.guardrailRow}
          >
            <span>{row.label}</span>
            <strong>{String(row.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function parseModule(
  value: string | undefined,
): CandidatePreviewModule | undefined {
  if (
    value === "home" ||
    value === "intelligence" ||
    value === "moves" ||
    value === "source" ||
    value === "tower"
  ) {
    return value;
  }
  return undefined;
}

const styles = {
  banner: {
    border: "1px solid #b45309",
    background: "#fff7ed",
    color: "#7c2d12",
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
  },
  bannerLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 700,
    marginBottom: 6,
  },
  panel: {
    border: "1px solid #dedbd2",
    borderRadius: 8,
    background: "#fff",
    padding: 22,
    marginBottom: 18,
  },
  kicker: {
    color: "#0f766e",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  heading: {
    margin: "8px 0 8px",
    fontSize: 28,
    lineHeight: 1.1,
  },
  copy: {
    margin: 0,
    color: "#5c5a53",
    fontSize: 15,
    lineHeight: 1.5,
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginTop: 18,
  },
  metric: {
    border: "1px solid #e7e3da",
    borderRadius: 8,
    padding: 14,
    display: "grid",
    gap: 4,
  },
  guardrails: {
    borderTop: "1px solid #ece7dd",
    marginTop: 20,
    paddingTop: 18,
  },
  guardrailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginTop: 12,
  },
  guardrailRow: {
    alignItems: "center",
    background: "#f8fafc",
    border: "1px solid #dbe3ef",
    borderRadius: 8,
    color: "#152033",
    display: "flex",
    fontSize: 13,
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
  },
  list: {
    margin: "14px 0 0",
    paddingLeft: 18,
    color: "#7c2d12",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 12,
  },
  moduleCard: {
    border: "1px solid #dedbd2",
    borderRadius: 8,
    background: "#fff",
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 1.25,
    margin: "8px 0",
  },
  cardCopy: {
    color: "#68645d",
    fontSize: 13,
    lineHeight: 1.45,
    margin: 0,
  },
} as const;

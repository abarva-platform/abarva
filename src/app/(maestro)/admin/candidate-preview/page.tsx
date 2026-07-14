import { connection } from "next/server";

import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { AgentRail } from "@/components/admin/AgentRail";
import { ContextBar } from "@/components/admin/ContextBar";
import { EditorialCanvas } from "@/components/admin/EditorialCanvas";
import {
  CANDIDATE_PREVIEW_BANNER,
  readLatestCandidateVersionBuild,
  type TenantCandidateVersion,
} from "@/lib/enterprise-data/candidate-version-build/candidate-version-build";
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

type CandidatePreviewModule = "home" | "intelligence" | "moves" | "source" | "tower";

export default async function CandidatePreviewPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  await connection();
  const tenant = await resolveAdminTenant();
  const params = searchParams ? await searchParams : {};
  const candidateBuild = await readLatestCandidateVersionBuild(process.cwd());
  const requestedTenantKey = params.tenantKey?.trim() || "skyharbor-air";
  const selectedCandidate =
    candidateBuild?.candidateVersions.find(
      (candidate) => candidate.tenantKey === requestedTenantKey,
    ) ?? null;
  const requestedCandidateVersionId =
    params.candidateVersionId?.trim() || selectedCandidate?.candidateVersionId || "";
  const selectedModule = parseModule(params.module) ?? "home";
  const validationErrors = validateCandidatePreviewRequest({
    previewEnabled: params.preview === "enabled",
    acknowledged: params.ack === "not-active-truth",
    operatorId: params.operatorId,
    previewReason: params.previewReason,
    selectedCandidate,
    requestedCandidateVersionId,
    candidateBuildPresent: Boolean(candidateBuild),
  });
  const previewAccepted = validationErrors.length === 0;

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
        subtitle="Inspect inactive candidate data only when the operator request carries the explicit preview flag, candidate id, tenant, module, reason, and acknowledgement."
      >
        <ContextBar
          tenant={selectedCandidate?.tenantDisplayName ?? requestedTenantKey}
          mode="Explicit candidate preview"
          agent="Steward"
          data={candidateBuild ? "Inactive candidate read model" : "No candidate artifact"}
          liveStatus={
            previewAccepted
              ? "Preview request accepted"
              : "Preview disabled by default"
          }
          liveStatusKind={
            previewAccepted ? "live" : "partial"
          }
        />

        <section style={styles.banner}>
          <div style={styles.bannerLabel}>Required preview banner</div>
          <strong>{CANDIDATE_PREVIEW_BANNER}</strong>
        </section>

        {previewAccepted && selectedCandidate ? (
          <section style={styles.panel}>
            <div style={styles.kicker}>Explicit request accepted</div>
            <h2 style={styles.heading}>
              {selectedCandidate.tenantDisplayName} · {selectedModule} preview packet
            </h2>
            <p style={styles.copy}>
              This is a read-only candidate inspection. Active tenant truth,
              module default reads, production tenant data, and promotion state
              remain unchanged.
            </p>
            <div style={styles.metrics}>
              <Metric label="Canonical records" value={selectedCandidate.canonicalRecordCount} />
              <Metric
                label="Relationships"
                value={selectedCandidate.relationshipCandidateCount}
              />
              <Metric
                label="Evidence keys"
                value={selectedCandidate.evidenceAttachmentCount}
              />
              <Metric label="Runtime eligible" value="false" />
            </div>
            <GuardrailIndicators candidate={selectedCandidate} />
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
          {(candidateBuild?.candidateVersions ?? []).map((candidate) => (
            <article key={candidate.candidateVersionId} style={styles.moduleCard}>
              <div style={styles.kicker}>{candidate.tenantKey}</div>
              <h3 style={styles.cardTitle}>
                {candidate.canonicalRecordCount.toLocaleString()} records ·{" "}
                {candidate.evidenceAttachmentCount.toLocaleString()} evidence keys
              </h3>
              <p style={styles.cardCopy}>
                Candidate id: {candidate.candidateVersionId}. Default Home
                remains active Home context. Runtime eligible: false.
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
  candidate,
}: {
  candidate: TenantCandidateVersion;
}) {
  const rows = [
    {
      label: "candidatePromoted",
      value: candidate.guardrails.candidatePromoted,
    },
    {
      label: "activeTenantAccessLayerUpdated",
      value: candidate.guardrails.activeTenantAccessLayerUpdated,
    },
    {
      label: "productionTenantDataWritten",
      value: candidate.guardrails.productionTenantDataWritten,
    },
    {
      label: "moduleRuntimeConsumptionChanged",
      value: candidate.guardrails.moduleRuntimeConsumptionChanged,
    },
    {
      label: "moduleReadsCandidateByDefault",
      value: candidate.guardrails.moduleReadsCandidateByDefault,
    },
    {
      label: "previewModeRequiresExplicitFlag",
      value: candidate.guardrails.candidatePreviewRequiresExplicitMode,
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

function validateCandidatePreviewRequest(input: {
  previewEnabled: boolean;
  acknowledged: boolean;
  operatorId?: string;
  previewReason?: string;
  selectedCandidate: TenantCandidateVersion | null;
  requestedCandidateVersionId: string;
  candidateBuildPresent: boolean;
}): string[] {
  const errors: string[] = [];
  if (!input.candidateBuildPresent) {
    errors.push("Candidate version build artifact is missing.");
  }
  if (!input.previewEnabled) {
    errors.push("Explicit preview flag is not enabled.");
  }
  if (!input.acknowledged) {
    errors.push("Operator acknowledgement is required.");
  }
  if (!input.operatorId?.trim()) {
    errors.push("Operator id is required.");
  }
  if (!input.previewReason?.trim()) {
    errors.push("Preview reason is required.");
  }
  if (!input.selectedCandidate) {
    errors.push("Requested tenant candidate was not found.");
  } else if (input.selectedCandidate.candidateVersionId !== input.requestedCandidateVersionId) {
    errors.push("Requested candidate version id does not match the generated candidate.");
  }
  return errors;
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

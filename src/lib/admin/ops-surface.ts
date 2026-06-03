export type AdminOpsStatus = "ready" | "gated" | "blocked" | "external";
export type AdminOpsRisk = "low" | "medium" | "high";

export interface AdminOpsOperation {
  id: string;
  title: string;
  category: "Indexing" | "Database" | "Ingestion" | "Security" | "Audit";
  status: AdminOpsStatus;
  risk: AdminOpsRisk;
  purpose: string;
  executionPath: string;
  approvalPath: string;
  dryRunRequired: boolean;
  auditEvidence: ReadonlyArray<string>;
  validation: ReadonlyArray<string>;
  rollback: string;
}

export interface AdminOpsSurfaceModel {
  generatedAt: string;
  statusCounts: Record<AdminOpsStatus, number>;
  operations: ReadonlyArray<AdminOpsOperation>;
  requiredControls: ReadonlyArray<string>;
  blockedUntil: ReadonlyArray<string>;
}

const OPERATIONS: ReadonlyArray<AdminOpsOperation> = [
  {
    id: "reindex-search-corpus",
    title: "Re-index search corpus",
    category: "Indexing",
    status: "gated",
    risk: "medium",
    purpose:
      "Refresh retrieval indexes after approved client data, templates, or corpus packs are committed.",
    executionPath: "runbook-driven job from scripts/corpus/* with tenant key pinned",
    approvalPath: "Tenant admin approval plus release owner approval for production runs",
    dryRunRequired: true,
    auditEvidence: [
      "release record",
      "tenant key",
      "input manifest checksum",
      "index build id",
      "post-run retrieval sample",
    ],
    validation: [
      "corpus:release-manifest:check",
      "sample retrieval QA",
      "tenant isolation smoke for affected client",
    ],
    rollback:
      "Restore previous index alias or disable the new index build in the retrieval adapter.",
  },
  {
    id: "migration-dry-run",
    title: "Run migration dry-run",
    category: "Database",
    status: "ready",
    risk: "high",
    purpose:
      "Preview pending schema changes against the selected client data plane before any apply step.",
    executionPath: "npm run db:migrate:dry with production target explicitly named",
    approvalPath: "Engineering owner signs off dry-run output before apply can be scheduled",
    dryRunRequired: true,
    auditEvidence: [
      "migration list",
      "dry-run output",
      "target database alias",
      "approval timestamp",
    ],
    validation: [
      "fresh Postgres migration replay",
      "release:check",
      "focused integration tests for affected tables",
    ],
    rollback:
      "Do not apply if dry-run differs from expected plan; if already applied, use the migration rollback plan in the release record.",
  },
  {
    id: "source-event-backfill",
    title: "Backfill Source events",
    category: "Database",
    status: "gated",
    risk: "medium",
    purpose:
      "Repair or enrich Source event read models from approved artifacts without changing unrelated clients.",
    executionPath: "src/scripts/source/backfill-canvas-substrate.ts",
    approvalPath: "Source owner confirms event scope and affected client before apply",
    dryRunRequired: true,
    auditEvidence: [
      "event ids",
      "client id",
      "dry-run diff",
      "apply transcript",
      "post-run Source smoke",
    ],
    validation: [
      "db:backfill:source-canvas:dry",
      "Source artifact route smoke",
      "tenant allowlist verification",
    ],
    rollback:
      "Replay the previous read-model snapshot or revert the backfill commit through the data-plane restore procedure.",
  },
  {
    id: "defender-quarantine-replay",
    title: "Replay Defender quarantine decisions",
    category: "Ingestion",
    status: "blocked",
    risk: "high",
    purpose:
      "Reprocess only files with clean Defender scan tags after a quarantine review has been approved.",
    executionPath: "landing-zone consumer with Defender scan gate enabled",
    approvalPath:
      "Data steward approval plus security review for every file leaving quarantine",
    dryRunRequired: true,
    auditEvidence: [
      "blob scan tag",
      "quarantine reason",
      "reviewer",
      "approval attestation",
      "processing ledger id",
    ],
    validation: [
      "Defender clean-file proof",
      "malicious sample remains quarantined",
      "pilot ingestion ledger proof",
    ],
    rollback:
      "Move the object back to quarantine and invalidate any derived records for the processing ledger id.",
  },
  {
    id: "immutable-audit-export",
    title: "Export immutable audit evidence",
    category: "Audit",
    status: "gated",
    risk: "low",
    purpose:
      "Package append-only audit evidence for a release, client review, or procurement diligence request.",
    executionPath: "audit export runbook with immutable storage account scope",
    approvalPath: "Internal release owner approval before external sharing",
    dryRunRequired: false,
    auditEvidence: [
      "storage account",
      "container",
      "time range",
      "export checksum",
      "recipient list",
    ],
    validation: [
      "immutable audit log verifier",
      "checksum match",
      "access review for export recipients",
    ],
    rollback:
      "Revoke the export share link; immutable source records are not deleted or rewritten.",
  },
  {
    id: "rotate-data-plane-secret",
    title: "Rotate data-plane secret",
    category: "Security",
    status: "external",
    risk: "high",
    purpose:
      "Rotate client-scoped secrets without exposing client data through the shared control plane.",
    executionPath: "Azure Key Vault or Vercel environment secret rotation runbook",
    approvalPath: "Security owner approval plus maintenance window for production clients",
    dryRunRequired: false,
    auditEvidence: [
      "secret name",
      "rotation window",
      "owner",
      "post-rotation smoke",
      "rollback secret reference",
    ],
    validation: [
      "tenant connection resolver verification",
      "Azure connectivity smoke",
      "application health smoke",
    ],
    rollback:
      "Restore the prior secret version if the post-rotation smoke fails and capture incident evidence.",
  },
];

export function buildAdminOpsSurfaceModel(now = new Date()): AdminOpsSurfaceModel {
  const statusCounts: Record<AdminOpsStatus, number> = {
    ready: 0,
    gated: 0,
    blocked: 0,
    external: 0,
  };

  for (const operation of OPERATIONS) {
    statusCounts[operation.status] += 1;
  }

  return {
    generatedAt: now.toISOString(),
    statusCounts,
    operations: OPERATIONS,
    requiredControls: [
      "Every operation must name one client or one shared control-plane scope.",
      "Dry-run output is required before any data-changing operation.",
      "High-risk operations require human approval and release-record evidence.",
      "Audit evidence must include actor, timestamp, target, validation, and rollback path.",
    ],
    blockedUntil: [
      "Live Azure proof is attached for immutable audit log and Defender scan gates.",
      "A production-grade job runner owns execution with retries, locks, and idempotency.",
      "External sharing of audit exports has named owner approval.",
    ],
  };
}

export function getReadyAdminOps(model: AdminOpsSurfaceModel): ReadonlyArray<AdminOpsOperation> {
  return model.operations.filter((operation) => operation.status === "ready");
}

#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";

import type {
  ModuleContextModuleKey,
  ModuleContextPurpose,
  ModuleContextReadRequest,
  ModuleContextRequestedDomain,
  ServedModuleContextPacket,
} from "../../src/lib/enterprise-data/contracts/module-context-apis";
import { getModuleContext } from "../../src/lib/enterprise-data/module-context-serving/module-context-serving";

const TENANT_KEY = "meridian-health";
const OUTPUT_DIR = "reports/meridian-runtime-module-access";
const REQUIRED_MODULES: Array<{
  moduleKey: Extract<ModuleContextModuleKey, "home" | "intelligence" | "tower">;
  purpose: ModuleContextPurpose;
}> = [
  { moduleKey: "home", purpose: "context_summary" },
  { moduleKey: "intelligence", purpose: "answer_context" },
  { moduleKey: "tower", purpose: "answer_context" },
];

const REQUESTED_DOMAINS: ModuleContextRequestedDomain[] = [
  "enterprise_profile",
  "functions",
  "applications_systems",
  "vendors_contracts",
  "data_assets_integrations",
  "programs_priorities",
  "risks_controls",
  "metrics_outcomes",
  "relationships",
  "evidence_sources",
];

interface ModuleAccessRow {
  moduleKey: string;
  sourceMode: string;
  activeTenantAccessVersionId: string | null;
  recordCount: number;
  evidenceRefCount: number;
  candidateDataConsumed: boolean;
  moduleRuntimeConsumptionChanged: boolean;
  readinessStatus: string;
  completenessOverall: string;
  coveredDomains: number;
}

interface RuntimeAccessReport {
  reportVersion: "meridian-runtime-module-access/v1";
  generatedAt: string;
  tenantKey: typeof TENANT_KEY;
  activeVersionId: string | null;
  status: "Pass" | "Fail";
  failures: string[];
  moduleAccess: ModuleAccessRow[];
  truthSplit: {
    provesModuleContextAccess: true;
    productionTenantDataWritten: false;
    physicalPostgresTablesWritten: false;
    candidateDataConsumedByDefault: false;
    moduleRuntimeBehaviorChanged: false;
    towerLegacyRuntimeMutationClaimed: false;
    intelligenceDefaultAskMigrationClaimed: false;
  };
}

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const generatedAt = new Date().toISOString();
  const packets = await Promise.all(
    REQUIRED_MODULES.map((entry) =>
      getModuleContext(buildRequest(entry), { repoRoot, generatedAt }),
    ),
  );

  const failures = validatePackets(packets);
  const activeVersionIds = new Set(
    packets.map((packet) => packet.activeTenantAccessVersionId).filter(Boolean),
  );
  if (activeVersionIds.size !== 1) {
    failures.push(
      `Expected one shared activeTenantAccessVersionId, found ${Array.from(activeVersionIds).join(", ") || "none"}.`,
    );
  }

  const report: RuntimeAccessReport = {
    reportVersion: "meridian-runtime-module-access/v1",
    generatedAt,
    tenantKey: TENANT_KEY,
    activeVersionId: packets[0]?.activeTenantAccessVersionId ?? null,
    status: failures.length === 0 ? "Pass" : "Fail",
    failures,
    moduleAccess: packets.map(toAccessRow),
    truthSplit: {
      provesModuleContextAccess: true,
      productionTenantDataWritten: false,
      physicalPostgresTablesWritten: false,
      candidateDataConsumedByDefault: false,
      moduleRuntimeBehaviorChanged: false,
      towerLegacyRuntimeMutationClaimed: false,
      intelligenceDefaultAskMigrationClaimed: false,
    },
  };

  await writeReport(repoRoot, report);
  if (failures.length > 0) {
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(report, null, 2));
}

function buildRequest(entry: {
  moduleKey: Extract<ModuleContextModuleKey, "home" | "intelligence" | "tower">;
  purpose: ModuleContextPurpose;
}): ModuleContextReadRequest {
  return {
    tenantKey: TENANT_KEY,
    moduleKey: entry.moduleKey,
    purpose: entry.purpose,
    requestedDomains: REQUESTED_DOMAINS,
    relationshipPolicy: "validated_only",
    evidencePolicy: "lineage_required",
    actorKey: "meridian-runtime-module-access-audit",
  };
}

function validatePackets(packets: ServedModuleContextPacket[]): string[] {
  const failures: string[] = [];
  for (const packet of packets) {
    const prefix = `${packet.moduleKey}:`;
    if (packet.sourceMode !== "active_tenant_access") {
      failures.push(`${prefix} expected active_tenant_access, got ${packet.sourceMode}.`);
    }
    if (!packet.activeTenantAccessVersionId) {
      failures.push(`${prefix} missing activeTenantAccessVersionId.`);
    }
    if (packet.records.length === 0) {
      failures.push(`${prefix} returned no records.`);
    }
    if (packet.evidenceRefs.length === 0) {
      failures.push(`${prefix} returned no evidence refs.`);
    }
    if (packet.guardrails.candidateDataConsumed) {
      failures.push(`${prefix} consumed candidate data by default.`);
    }
    if (packet.guardrails.moduleRuntimeConsumptionChanged) {
      failures.push(`${prefix} changed module runtime consumption.`);
    }
    if (packet.readiness.status !== "agent_ready") {
      failures.push(`${prefix} readiness is ${packet.readiness.status}, expected agent_ready.`);
    }
  }
  return failures;
}

function toAccessRow(packet: ServedModuleContextPacket): ModuleAccessRow {
  return {
    moduleKey: packet.moduleKey,
    sourceMode: packet.sourceMode,
    activeTenantAccessVersionId: packet.activeTenantAccessVersionId,
    recordCount: packet.records.length,
    evidenceRefCount: packet.evidenceRefs.length,
    candidateDataConsumed: packet.guardrails.candidateDataConsumed,
    moduleRuntimeConsumptionChanged: packet.guardrails.moduleRuntimeConsumptionChanged,
    readinessStatus: packet.readiness.status,
    completenessOverall: packet.contextCompleteness.overall,
    coveredDomains: packet.domains.filter((domain) => domain.acceptedRecords > 0).length,
  };
}

async function writeReport(
  repoRoot: string,
  report: RuntimeAccessReport,
): Promise<void> {
  const outDir = path.join(repoRoot, OUTPUT_DIR);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(
    path.join(outDir, "summary.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(path.join(outDir, "summary.md"), markdownReport(report));
}

function markdownReport(report: RuntimeAccessReport): string {
  return `# Meridian Runtime Module Access Proof

Generated: \`${report.generatedAt}\`

Status: **${report.status}**

Active Tenant Access version: \`${report.activeVersionId ?? "missing"}\`

This proves Home, Intelligence, and Tower can request Meridian context through
the governed module-context serving contract. It does not write physical
Postgres tables, consume candidate data by default, alter module runtime
behavior, or claim the legacy Tower dashboard read model has been migrated.

| Module | Source mode | Records | Evidence refs | Readiness | Completeness | Candidate consumed |
| --- | --- | ---: | ---: | --- | --- | --- |
${report.moduleAccess
  .map(
    (row) =>
      `| ${row.moduleKey} | ${row.sourceMode} | ${row.recordCount} | ${row.evidenceRefCount} | ${row.readinessStatus} | ${row.completenessOverall} | ${row.candidateDataConsumed} |`,
  )
  .join("\n")}

## Truth Split

- Production tenant data written: ${report.truthSplit.productionTenantDataWritten}
- Physical Postgres tables written: ${report.truthSplit.physicalPostgresTablesWritten}
- Candidate data consumed by default: ${report.truthSplit.candidateDataConsumedByDefault}
- Module runtime behavior changed: ${report.truthSplit.moduleRuntimeBehaviorChanged}
- Tower legacy runtime mutation claimed: ${report.truthSplit.towerLegacyRuntimeMutationClaimed}
- Intelligence default ask migration claimed: ${report.truthSplit.intelligenceDefaultAskMigrationClaimed}

${report.failures.length > 0 ? `## Failures\n\n${report.failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
`;
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

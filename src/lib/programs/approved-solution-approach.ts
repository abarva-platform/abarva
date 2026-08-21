import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";
import { computeValueHash } from "@/lib/context-ingestion/fact-identity";
import type {
  PhaseDigest,
  SolutionDecision,
  SolutionOption,
} from "@/lib/programs/solution-context";

export const ARCHITECTURE_MODEL_VERSION = "moves-architecture-model-v2";

export const P3_ARCHITECTURE_DELIVERABLE_KEYS = new Set([
  "target_state_architecture",
  "solution_design",
  "operating_model_design",
  "sourcing_strategy",
]);

export interface ArchitectureGenerationLineage {
  decisionHash: string;
  decisionVersion: string;
  approvedOptionId: string;
  approvedOptionVersion: string;
  contextSnapshotHash: string;
  architectureModelVersion: string;
}

export interface RejectedSolutionOption {
  optionId: string;
  optionVersion: string;
  name: string;
  reason: string;
}

export interface ApprovedSolutionApproach {
  decisionId: string;
  decisionVersion: string;
  decisionHash: string;
  selectedOptionId: string;
  selectedOptionVersion: string;
  approach?: string;
  options: SolutionOption[];
  chosenOption: string;
  rejectedOptions: RejectedSolutionOption[];
  tradeoffsAccepted: string[];
  scope: string[];
  exclusions: string[];
  assumptions: string[];
  constraints: string[];
  unresolvedDecisions: string[];
  decision: SolutionDecision;
}

interface ApprovedApproachRow {
  structured_data: unknown;
  version: number;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map(String)
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
}

export function parseArchitectureGenerationLineage(
  value: unknown,
): ArchitectureGenerationLineage | null {
  const row = record(value);
  if (!row) return null;
  const required = [
    "decisionHash",
    "decisionVersion",
    "approvedOptionId",
    "approvedOptionVersion",
    "contextSnapshotHash",
    "architectureModelVersion",
  ] as const;
  if (
    required.some(
      (key) => typeof row[key] !== "string" || !String(row[key]).trim(),
    )
  ) {
    return null;
  }
  return Object.fromEntries(
    required.map((key) => [key, String(row[key])]),
  ) as unknown as ArchitectureGenerationLineage;
}

export function validateArchitectureGenerationLineage(args: {
  lineage: unknown;
  approved: ApprovedSolutionApproach;
  currentContextSnapshotHash: string;
}):
  | { ok: true; lineage: ArchitectureGenerationLineage }
  | { ok: false; detail: string } {
  const lineage = parseArchitectureGenerationLineage(args.lineage);
  if (!lineage) {
    return {
      ok: false,
      detail: "Architecture generation lineage is missing or incomplete.",
    };
  }
  if (
    lineage.decisionHash !== args.approved.decisionHash ||
    lineage.approvedOptionId !== args.approved.selectedOptionId ||
    lineage.approvedOptionVersion !== args.approved.selectedOptionVersion
  ) {
    return {
      ok: false,
      detail:
        "The approved solution option changed after this architecture was generated. Regenerate the P3b chain from the current approved option.",
    };
  }
  if (lineage.contextSnapshotHash !== args.currentContextSnapshotHash) {
    return {
      ok: false,
      detail:
        "The Move evidence/context snapshot changed after this architecture was generated. Refresh the context extract and regenerate the P3b chain.",
    };
  }
  if (lineage.architectureModelVersion !== ARCHITECTURE_MODEL_VERSION) {
    return {
      ok: false,
      detail:
        "This architecture was generated with an obsolete architecture model. Regenerate it before approval.",
    };
  }
  return { ok: true, lineage };
}

function digestFromStructuredData(value: unknown): PhaseDigest | null {
  const data = record(value);
  if (!data) return null;
  return (record(data.solutionContextDigest) ?? data) as PhaseDigest;
}

export function decisionHashFor(
  input: Omit<ApprovedSolutionApproach, "decisionHash">,
): string {
  return computeValueHash(input);
}

export function parseApprovedSolutionApproach(
  structuredData: unknown,
  persistedVersion = 1,
): ApprovedSolutionApproach | null {
  const data = record(structuredData);
  const digest = digestFromStructuredData(structuredData);
  const lineage = record(data?.decisionLineage);
  const chosenOption = digest?.chosenOption?.trim();
  if (!chosenOption) return null;
  const decision = digest?.decisions?.find(
    (item) => item.phase === 3 && item.decision.includes(chosenOption),
  );
  if (!decision?.approvedAt) return null;
  const decisionRecord = decision as SolutionDecision & {
    approvedByRole?: unknown;
  };
  const approvedBy =
    decision.approvedBy ||
    (typeof decisionRecord.approvedByRole === "string"
      ? decisionRecord.approvedByRole
      : null);
  if (!approvedBy?.trim()) return null;
  const normalizedDecision: SolutionDecision = {
    ...decision,
    approvedBy: approvedBy.trim(),
  };
  const options = digest?.options ?? [];
  const selected = options.find(
    (option) =>
      option.id === lineage?.selectedOptionId || option.name === chosenOption,
  );
  if (!selected?.id) return null;
  const decisionVersion = String(lineage?.decisionVersion ?? persistedVersion);
  const selectedOptionVersion = String(lineage?.selectedOptionVersion ?? "1");
  const rejectedRaw = Array.isArray(lineage?.rejectedOptions)
    ? lineage.rejectedOptions
    : [];
  const rejectedOptions: RejectedSolutionOption[] = rejectedRaw.length
    ? rejectedRaw.map((item) => {
        const row = record(item) ?? {};
        return {
          optionId: String(row.optionId ?? "unknown"),
          optionVersion: String(row.optionVersion ?? "1"),
          name: String(row.name ?? "Rejected option"),
          reason: String(
            row.reason ?? "Not selected under the approved decision rationale",
          ),
        };
      })
    : options
        .filter((option) => option.id !== selected.id)
        .map((option) => ({
          optionId: option.id,
          optionVersion: "1",
          name: option.name,
          reason: "Not selected under the approved decision rationale",
        }));
  const withoutHash: Omit<ApprovedSolutionApproach, "decisionHash"> = {
    decisionId: String(
      lineage?.decisionId ?? `${selected.id}:${decision.approvedAt}`,
    ),
    decisionVersion,
    selectedOptionId: selected.id,
    selectedOptionVersion,
    ...(digest?.approach?.trim() ? { approach: digest.approach.trim() } : {}),
    options,
    chosenOption,
    rejectedOptions,
    tradeoffsAccepted: digest?.tradeoffsAccepted ?? [],
    scope: strings(lineage?.scope),
    exclusions: strings(lineage?.exclusions),
    assumptions: strings(lineage?.assumptions),
    constraints: strings(lineage?.constraints),
    unresolvedDecisions: strings(lineage?.unresolvedDecisions),
    decision: normalizedDecision,
  };
  const decisionHash = decisionHashFor(withoutHash);
  const storedHash =
    typeof lineage?.decisionHash === "string" ? lineage.decisionHash : null;
  if (storedHash && storedHash !== decisionHash) return null;
  return { ...withoutHash, decisionHash };
}

export async function loadApprovedSolutionApproach(args: {
  moveId: string;
  clientId: string;
}): Promise<ApprovedSolutionApproach | null> {
  const rows = await azureRead.query<ApprovedApproachRow>(
    "SELECT dv.structured_data, dv.version " +
      "FROM deliverables_v2 d " +
      "JOIN engagements e ON e.id = d.engagement_id " +
      "JOIN deliverable_versions dv " +
      "ON dv.deliverable_id = d.id AND dv.version = d.signed_off_version " +
      "WHERE d.engagement_id = $1 AND e.client_id = $2 " +
      "AND d.deliverable_type_key = 'solution_approach_options' " +
      "AND d.status = 'signed_off' AND d.signed_off_version IS NOT NULL " +
      "ORDER BY d.signed_off_at DESC NULLS LAST, d.updated_at DESC LIMIT 1",
    [args.moveId, args.clientId],
    { missingTable: "empty" },
  );
  return parseApprovedSolutionApproach(
    rows[0]?.structured_data,
    rows[0]?.version,
  );
}

export function formatApprovedSolutionApproach(
  approved: ApprovedSolutionApproach,
): string {
  const list = (label: string, values: string[], empty: string) =>
    `${label}: ${values.length ? values.join("; ") : empty}`;
  return [
    "APPROVED SOLUTION APPROACH - AUTHORITATIVE INPUT",
    `Decision ID/version: ${approved.decisionId} / ${approved.decisionVersion}`,
    `Decision hash: ${approved.decisionHash}`,
    `Chosen option: ${approved.chosenOption} (${approved.selectedOptionId} v${approved.selectedOptionVersion})`,
    approved.approach ? `Approved approach: ${approved.approach}` : null,
    `Approval rationale: ${approved.decision.rationale}`,
    list("Tradeoffs accepted", approved.tradeoffsAccepted, "none recorded"),
    list("Scope", approved.scope, "use the approved Move scope"),
    list("Exclusions", approved.exclusions, "none recorded"),
    list("Assumptions", approved.assumptions, "none recorded"),
    list("Constraints", approved.constraints, "none recorded"),
    list("Unresolved decisions", approved.unresolvedDecisions, "none recorded"),
    `Rejected alternatives: ${approved.rejectedOptions.map((item) => `${item.name} — ${item.reason}`).join("; ") || "none"}`,
    `Approved by/at: ${approved.decision.approvedBy} / ${approved.decision.approvedAt}`,
    "Build only to this approved option. Do not reopen, blend, or silently replace it. Expose conflicting evidence as an unresolved decision and stop if it changes the approved basis.",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

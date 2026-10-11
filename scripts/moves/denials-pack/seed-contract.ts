import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { canonicalTenantKey } from "../../../src/lib/tenant-keys";

export const PROPOSAL_PATH = "datasets/tenant-inputs/meridian-health/moves/denials-pack-v1/register-rebind-proposal.json";
export const PROPOSAL_SHA256 = "e79abdd497bc9f5914d0fa891d249e5d289c1399e5fbed426c598bc9d4e4f33a";
export const SEED_DATASET_ID = "moves_denials_register_seed_v1";
export const REGISTER_KEYS = [
  "unit_source", "unit_table", "unit_entity", "unit_view", "unit_design",
  "unit_validation", "friction", "productive_share", "weekly_hours",
  "writeoff_baseline", "prevented_share", "zero", "margin", "attribution",
  "probability", "rework_hours", "rework_target", "denial_volume", "days_ar",
  "days_ar_target", "discount", "budget_ceiling",
] as const;

const SOURCE_PATHS = [
  "01-use-case-brief.docx", "02-denials-baseline.xlsx",
  "03-denial-reason-taxonomy.xlsx", "04-source-system-inventory.xlsx",
  "05-interview-notes.md", "06-finance-baseline.xlsx",
  "07-current-workflow.pdf", "08-payer-policy-excerpts.pdf",
  "reconciliation-proof.json", "register-rebind-proposal.json",
].map((name) => `datasets/tenant-inputs/meridian-health/moves/denials-pack-v1/${name}`);
const COST_PATHS = [
  "pricing_roles.csv", "pricing_rate_bands.csv", "pricing_delivery_locations.csv",
  "pricing_provider_classes.csv", "pricing_pod_templates.csv",
  "pricing_pod_template_roles.csv",
].map((name) => `datasets/reference/pricing-engine-v1/${name}`);
export const SOURCE_SET_PATHS = [...SOURCE_PATHS, ...COST_PATHS] as const;

export interface ProposedRegisterRow {
  key: string;
  category: "delivery" | "value";
  value: number;
  unit: string;
  sourceFile: string;
  sourceBasis: string;
  ownerRole: string;
  status: "proposed";
  confidence: 1 | 3 | 5;
  registerId: null;
  approvedBy: null;
}

export interface DenialsSeedBinding {
  moveId: string;
  clientId: string;
  appClientKey: "meridian";
  canonicalTenantKey: "meridian-health";
  operatorClerkId: string;
  operatorPersonId: string;
  approvalRef: string;
  observedAtUtc: string;
  currentPhase: number;
  occupiedRegisterIds: readonly string[];
  registerIds: Record<string, string>;
  sourceSetSha256: string;
}

const sha = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readExactProposal(): { rows: ProposedRegisterRow[]; sha256: string } {
  const bytes = readFileSync(PROPOSAL_PATH);
  const proposalSha = sha(bytes);
  if (proposalSha !== PROPOSAL_SHA256) throw new Error("denials_proposal_bytes_changed");
  const proposal = JSON.parse(bytes.toString("utf8"));
  if (proposal.datasetId !== "meridian-denials-pack-v1" ||
    proposal.status !== "preparation_only" || proposal.moveId !== null ||
    proposal.authenticatedClientKey !== null || proposal.registerIds !== null ||
    proposal.sourceSetHash !== null || proposal.loadApproval !== null ||
    proposal.ratePolicy?.podId !== null || proposal.ratePolicy?.rates?.length !== 0 ||
    proposal.cost?.snapshotId !== "UNBOUND_OWNER_APPROVED_CURRENT_P3_ROM" ||
    !Array.isArray(proposal.registerRows) || proposal.registerRows.length !== REGISTER_KEYS.length)
    throw new Error("denials_proposal_contract_changed");
  for (const [index, row] of proposal.registerRows.entries() as IterableIterator<[number, ProposedRegisterRow]>) {
    if (row.key !== REGISTER_KEYS[index] ||
      row.category !== (index < 9 ? "delivery" : "value") ||
      !Number.isFinite(row.value) || !row.unit || !row.sourceFile ||
      !row.sourceBasis || !row.ownerRole || row.status !== "proposed" ||
      ![1, 3, 5].includes(row.confidence) || row.registerId !== null ||
      row.approvedBy !== null) throw new Error(`denials_row_contract_changed:${index}`);
  }
  return { rows: proposal.registerRows, sha256: proposalSha };
}

/** Hash exact binary source bytes with path and length framing. */
export function sourceSetSha256(): string {
  readExactProposal();
  const h = createHash("sha256");
  for (const path of SOURCE_SET_PATHS) {
    const bytes = readFileSync(path);
    h.update(`${path}\0${bytes.length}\0`);
    h.update(bytes);
    h.update("\0");
  }
  return h.digest("hex");
}

export function validateDenialsSeedBinding(binding: DenialsSeedBinding): void {
  if (!UUID.test(binding.moveId) || !UUID.test(binding.clientId) ||
    !UUID.test(binding.operatorPersonId) || !binding.operatorClerkId.startsWith("user_") ||
    !binding.approvalRef.trim() || binding.appClientKey !== "meridian" ||
    binding.canonicalTenantKey !== canonicalTenantKey(binding.appClientKey) ||
    !Number.isInteger(binding.currentPhase) || binding.currentPhase < 0 ||
    !Number.isFinite(Date.parse(binding.observedAtUtc)) ||
    binding.sourceSetSha256 !== sourceSetSha256())
    throw new Error("denials_seed_binding_invalid");
  if (Object.keys(binding.registerIds).sort().join("|") !== [...REGISTER_KEYS].sort().join("|"))
    throw new Error("denials_register_key_set_invalid");
  const occupied = new Set(binding.occupiedRegisterIds);
  const assigned = new Set<string>();
  for (const [index, key] of REGISTER_KEYS.entries()) {
    const id = binding.registerIds[key];
    if (!/^(DL|V)[1-9][0-9]*$/.test(id) ||
      !id.startsWith(index < 9 ? "DL" : "V") || occupied.has(id) || assigned.has(id))
      throw new Error(`denials_register_id_invalid:${key}`);
    assigned.add(id);
  }
  for (const area of ["DL", "V"] as const) {
    const current = Math.max(0, ...[...occupied].filter((id) => id.startsWith(area))
      .map((id) => Number(id.slice(area.length))).filter(Number.isSafeInteger));
    const keys = REGISTER_KEYS.filter((_, index) => area === "DL" ? index < 9 : index >= 9);
    keys.forEach((key, index) => {
      if (binding.registerIds[key] !== `${area}${current + index + 1}`)
        throw new Error(`denials_register_allocation_drift:${key}`);
    });
  }
}

export function denialsSeedIdempotencyKey(binding: DenialsSeedBinding): string {
  validateDenialsSeedBinding(binding);
  return `moves-denials-register-seed-v1:${sha([
    binding.moveId, binding.clientId, binding.operatorClerkId,
    binding.operatorPersonId, binding.approvalRef, binding.sourceSetSha256,
    ...REGISTER_KEYS.map((key) => `${key}:${binding.registerIds[key]}`),
  ].join("|"))}`;
}

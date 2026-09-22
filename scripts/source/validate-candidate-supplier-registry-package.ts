import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import Papa from "papaparse";

import {
  CATEGORY_TO_ARCHETYPE_ID,
} from "../../src/lib/source/archetypes/event-archetype-resolver";
import { listSourceArchetypes } from "../../src/lib/source/archetypes/registry";
import type { SourceCategoryId } from "../../src/lib/source/taxonomy/category-taxonomy";
import { SOURCE_CATEGORY_IDS } from "../../src/lib/source/taxonomy/category-taxonomy";

const DEFAULT_INPUT =
  "datasets/source/candidate-supplier-registry-synthetic-v1/candidate_supplier_registry.csv";

const REQUIRED_HEADERS = [
  "record_id",
  "row_kind",
  "supplier_legal_name",
  "supplier_public_profile",
  "category_id",
  "business_function",
  "eligible_archetype_id",
  "eligibility_basis",
  "source_system",
  "source_file",
  "source_row",
  "source_record_id",
  "lineage_state",
  "authority_state",
  "contact_policy",
  "contact_authority_state",
  "existing_contract_status",
  "existing_contract_reference",
  "expected_decision",
  "expected_reason",
] as const;

const REQUIRED_NEGATIVE_REASONS = [
  "missing_lineage",
  "draft_authority",
  "duplicate_identity",
  "mismatched_eligibility",
  "missing_contact_authority",
] as const;

function categoryRoutedArchetypeIds(): Set<string> {
  return new Set(
    Object.values(CATEGORY_TO_ARCHETYPE_ID).filter(
      (id): id is string => Boolean(id),
    ),
  );
}

const APPROVED_AUTHORITY_STATES = new Set([
  "candidate_authority_reviewed",
  "candidate_authority_restricted",
]);

const CONTACT_POLICIES = new Set([
  "public_research_only",
  "buyer_introduction_required",
  "nda_required_before_contact",
  "inbound_contact_allowed",
  "do_not_contact",
]);

const CONTACT_AUTHORITY_STATES = new Set([
  "no_contact_required",
  "buyer_intro_authorized",
  "nda_required_before_contact",
  "inbound_contact_authorized",
  "contact_prohibited",
]);

const EXISTING_CONTRACT_STATUSES = new Set([
  "no_existing_contract",
  "incumbent_reference_only",
  "registered_contract_counterparty",
  "not_applicable_negative_control",
]);

const PUBLIC_UNSAFE_PATTERN =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|Meridian|Apex|Lakeshore|First Capital|SkyHarbor|Deloitte|Accenture|Cognizant|Kyndryl|Salesforce|Amazon|Microsoft|Google|Oracle|SAP|ServiceNow/i;

export type CandidateSupplierRegistryRow = Record<
  (typeof REQUIRED_HEADERS)[number],
  string
>;

export interface CandidateSupplierRegistryCoverageItem {
  archetypeId: string;
  archetypeName: string;
  categoryIds: string[];
  eligibleRows: Array<{
    recordId: string;
    supplierLegalName: string;
    categoryId: string;
    businessFunction: string;
    contactPolicy: string;
    existingContractStatus: string;
  }>;
}

export interface CandidateSupplierRegistryValidation {
  event: "candidate_supplier_registry_validation";
  status: "pass" | "fail";
  inputPath: string;
  inputSha256: string;
  summary: {
    totalRows: number;
    eligibleCandidateRows: number;
    negativeControlRows: number;
    expectedArchetypeCount: number;
    coveredArchetypeCount: number;
    contactPolicies: string[];
    existingContractStatuses: string[];
  };
  coverageMatrix: CandidateSupplierRegistryCoverageItem[];
  failClosedControls: Array<{
    recordId: string;
    expectedReason: string;
    actualReasons: string[];
  }>;
  errors: string[];
  authority: {
    dryRunOnly: true;
    azureLoadAuthorized: false;
    tenantWriteAuthorized: false;
    supplierContactAuthorized: false;
    eventMutationAuthorized: false;
  };
}

function normalizeIdentity(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function isCategoryId(value: string): value is SourceCategoryId {
  return (SOURCE_CATEGORY_IDS as readonly string[]).includes(value);
}

function requiredLineagePresent(row: CandidateSupplierRegistryRow): boolean {
  return Boolean(
    row.source_system &&
      row.source_file &&
      /^[1-9][0-9]*$/u.test(row.source_row) &&
      row.source_record_id &&
      row.lineage_state === "declared",
  );
}

function rowText(row: CandidateSupplierRegistryRow): string {
  return REQUIRED_HEADERS.map((header) => row[header] ?? "").join(" ");
}

function reasonsForRow(
  row: CandidateSupplierRegistryRow,
  duplicateIdentity: boolean,
): string[] {
  const reasons: string[] = [];

  if (PUBLIC_UNSAFE_PATTERN.test(rowText(row))) {
    reasons.push("public_safety_violation");
  }
  if (!row.supplier_legal_name.startsWith("Fictional ")) {
    reasons.push("synthetic_identity_not_declared");
  }
  if (!isCategoryId(row.category_id)) {
    reasons.push("unknown_category");
  } else if (CATEGORY_TO_ARCHETYPE_ID[row.category_id] !== row.eligible_archetype_id) {
    reasons.push("mismatched_eligibility");
  }
  if (!requiredLineagePresent(row)) {
    reasons.push("missing_lineage");
  }
  if (!APPROVED_AUTHORITY_STATES.has(row.authority_state)) {
    reasons.push("draft_authority");
  }
  if (!CONTACT_POLICIES.has(row.contact_policy)) {
    reasons.push("unknown_contact_policy");
  }
  if (!CONTACT_AUTHORITY_STATES.has(row.contact_authority_state)) {
    reasons.push("missing_contact_authority");
  }
  if (!EXISTING_CONTRACT_STATUSES.has(row.existing_contract_status)) {
    reasons.push("unknown_existing_contract_status");
  }
  if (
    row.existing_contract_status === "no_existing_contract" &&
    row.existing_contract_reference
  ) {
    reasons.push("contract_reference_on_no_existing_contract");
  }
  if (
    (row.existing_contract_status === "incumbent_reference_only" ||
      row.existing_contract_status === "registered_contract_counterparty") &&
    !row.existing_contract_reference
  ) {
    reasons.push("missing_existing_contract_reference");
  }
  if (!row.business_function || !row.eligibility_basis) {
    reasons.push("missing_explicit_eligibility_basis");
  }
  if (duplicateIdentity) {
    reasons.push("duplicate_identity");
  }

  return reasons;
}

function parseRows(csvText: string): CandidateSupplierRegistryRow[] {
  const parsed = Papa.parse<CandidateSupplierRegistryRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim(),
  });
  if (parsed.errors.length > 0) {
    throw new Error(
      `Candidate supplier CSV parse failed: ${parsed.errors
        .map((error) => `row ${error.row ?? "?"}: ${error.message}`)
        .join("; ")}`,
    );
  }

  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(`Candidate supplier CSV is missing headers: ${missing.join(", ")}`);
  }
  const unknown = headers.filter(
    (header) => !(REQUIRED_HEADERS as readonly string[]).includes(header),
  );
  if (unknown.length > 0) {
    throw new Error(`Candidate supplier CSV has unknown headers: ${unknown.join(", ")}`);
  }

  return parsed.data;
}

export function buildCandidateSupplierRegistryValidation(input: {
  csvText: string;
  inputPath?: string;
}): CandidateSupplierRegistryValidation {
  const rows = parseRows(input.csvText);
  const routedArchetypeIds = categoryRoutedArchetypeIds();
  const registeredArchetypes = listSourceArchetypes()
    .filter((archetype) => routedArchetypeIds.has(archetype.id))
    .map((archetype) => ({ id: archetype.id, name: archetype.name }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const categoriesByArchetype = new Map<string, string[]>();
  for (const categoryId of SOURCE_CATEGORY_IDS) {
    const archetypeId = CATEGORY_TO_ARCHETYPE_ID[categoryId];
    if (!archetypeId) continue;
    categoriesByArchetype.set(archetypeId, [
      ...(categoriesByArchetype.get(archetypeId) ?? []),
      categoryId,
    ]);
  }

  const errors: string[] = [];
  const seenRecordIds = new Set<string>();
  const seenIdentities = new Set<string>();
  const rowReasons = new Map<string, string[]>();
  const eligibleRows: CandidateSupplierRegistryRow[] = [];
  const failClosedControls: CandidateSupplierRegistryValidation["failClosedControls"] = [];

  for (const row of rows) {
    if (!row.record_id) {
      errors.push("A row is missing record_id.");
      continue;
    }
    if (seenRecordIds.has(row.record_id)) {
      errors.push(`Duplicate record_id ${row.record_id}.`);
    }
    seenRecordIds.add(row.record_id);

    const identity = normalizeIdentity(row.supplier_legal_name);
    const duplicateIdentity = Boolean(identity && seenIdentities.has(identity));
    if (identity) seenIdentities.add(identity);

    const reasons = reasonsForRow(row, duplicateIdentity);
    rowReasons.set(row.record_id, reasons);

    if (row.expected_decision === "eligible") {
      if (row.row_kind !== "candidate") {
        errors.push(`Eligible row ${row.record_id} must use row_kind=candidate.`);
      }
      if (reasons.length > 0) {
        errors.push(
          `Eligible row ${row.record_id} failed validation: ${reasons.join(", ")}.`,
        );
      } else {
        eligibleRows.push(row);
      }
    } else if (row.expected_decision === "fail_closed") {
      if (row.row_kind !== "negative_control") {
        errors.push(
          `Negative control ${row.record_id} was not present with expected_decision=fail_closed.`,
        );
      }
      if (!row.expected_reason) {
        errors.push(`Negative control ${row.record_id} is missing expected_reason.`);
      } else if (!reasons.includes(row.expected_reason)) {
        errors.push(
          `Negative control ${row.record_id} expected ${row.expected_reason} but actual reasons were ${reasons.join(", ") || "none"}.`,
        );
      } else {
        failClosedControls.push({
          recordId: row.record_id,
          expectedReason: row.expected_reason,
          actualReasons: reasons,
        });
      }
    } else {
      errors.push(
        `Row ${row.record_id} has unsupported expected_decision=${row.expected_decision}.`,
      );
    }
  }

  for (const reason of REQUIRED_NEGATIVE_REASONS) {
    if (!failClosedControls.some((control) => control.expectedReason === reason)) {
      errors.push(`Missing fail-closed control for ${reason}.`);
    }
  }

  const coverageMatrix = registeredArchetypes.map((archetype) => {
    const matched = eligibleRows
      .filter((row) => row.eligible_archetype_id === archetype.id)
      .map((row) => ({
        recordId: row.record_id,
        supplierLegalName: row.supplier_legal_name,
        categoryId: row.category_id,
        businessFunction: row.business_function,
        contactPolicy: row.contact_policy,
        existingContractStatus: row.existing_contract_status,
      }));

    if (matched.length < 2) {
      errors.push(
        `Archetype ${archetype.id} has ${matched.length} eligible candidate row(s); expected at least 2.`,
      );
    }

    return {
      archetypeId: archetype.id,
      archetypeName: archetype.name,
      categoryIds: (categoriesByArchetype.get(archetype.id) ?? []).sort(),
      eligibleRows: matched,
    };
  });

  const contactPolicies = [
    ...new Set(eligibleRows.map((row) => row.contact_policy)),
  ].sort();
  const existingContractStatuses = [
    ...new Set(eligibleRows.map((row) => row.existing_contract_status)),
  ].sort();

  if (contactPolicies.length < 4) {
    errors.push(
      `Eligible candidate rows use ${contactPolicies.length} contact polic(ies); expected at least 4.`,
    );
  }
  for (const status of [
    "no_existing_contract",
    "incumbent_reference_only",
    "registered_contract_counterparty",
  ]) {
    if (!existingContractStatuses.includes(status)) {
      errors.push(`Eligible candidate rows do not exercise ${status}.`);
    }
  }

  const coveredArchetypeCount = coverageMatrix.filter(
    (item) => item.eligibleRows.length >= 2,
  ).length;

  return {
    event: "candidate_supplier_registry_validation",
    status: errors.length === 0 ? "pass" : "fail",
    inputPath: input.inputPath ?? DEFAULT_INPUT,
    inputSha256: sha256(input.csvText),
    summary: {
      totalRows: rows.length,
      eligibleCandidateRows: eligibleRows.length,
      negativeControlRows: rows.filter((row) => row.row_kind === "negative_control").length,
      expectedArchetypeCount: registeredArchetypes.length,
      coveredArchetypeCount,
      contactPolicies,
      existingContractStatuses,
    },
    coverageMatrix,
    failClosedControls: failClosedControls.sort((left, right) =>
      left.expectedReason.localeCompare(right.expectedReason),
    ),
    errors,
    authority: {
      dryRunOnly: true,
      azureLoadAuthorized: false,
      tenantWriteAuthorized: false,
      supplierContactAuthorized: false,
      eventMutationAuthorized: false,
    },
  };
}

function argValue(argv: readonly string[], name: string): string | null {
  const index = argv.indexOf(name);
  if (index >= 0) return argv[index + 1] ?? null;
  return argv.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;
}

async function main(): Promise<void> {
  const inputPath = path.resolve(argValue(process.argv.slice(2), "--input") ?? DEFAULT_INPUT);
  const outPath = argValue(process.argv.slice(2), "--out");
  const csvText = fs.readFileSync(inputPath, "utf8");
  const validation = buildCandidateSupplierRegistryValidation({ csvText, inputPath });
  const output = `${JSON.stringify(validation, null, 2)}\n`;
  if (outPath) {
    const resolvedOut = path.resolve(outPath);
    fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
    fs.writeFileSync(resolvedOut, output);
  }
  process.stdout.write(output);
  if (validation.status !== "pass") {
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main();
}

import fs from "node:fs";
import path from "node:path";

import Papa from "papaparse";

import { CATEGORY_TO_ARCHETYPE_ID } from "@/lib/source/archetypes/event-archetype-resolver";
import { listSourceArchetypes } from "@/lib/source/archetypes/registry";
import type { CandidateSupplierAuthorityRow } from "@/lib/source/candidate-suppliers/candidate-supplier-authority";
import { buildSourceRequestSupplierSuggestions } from "@/lib/source/intake/source-request-supplier-suggestions";
import {
  adaptServiceNowSourcingRequest,
  type ServiceNowSourcingRequestRow,
} from "@/lib/source/intake/servicenow-sourcing-request-adapter";
import {
  buildCandidateSupplierRegistryValidation,
  type CandidateSupplierRegistryRow,
} from "../../../scripts/source/validate-candidate-supplier-registry-package";

const requestCsvPath = path.join(
  process.cwd(),
  "datasets/source-servicenow-sourcing-requests-synthetic-v1/servicenow_sourcing_requests.csv",
);
const supplierCsvPath = path.join(
  process.cwd(),
  "datasets/source/candidate-supplier-registry-synthetic-v1/candidate_supplier_registry.csv",
);
const reportPath = path.join(
  process.cwd(),
  "reports/source/servicenow-request-acceptance-matrix.json",
);

type AcceptanceMatrix = {
  event: "source_servicenow_request_acceptance_harness";
  status: "pass" | "fail";
  inputs: {
    requests: { path: string; rows: number };
    candidateSuppliers: { path: string; rows: number };
  };
  summary: {
    expectedArchetypes: number;
    coveredArchetypes: number;
    requestRows: number;
    eligibleSupplierRows: number;
    negativeControlRows: number;
  };
  authority: {
    readOnlyHarness: true;
    usesMergedFixtureFiles: true;
    tenantWriteAuthorized: false;
    supplierContactAuthorized: false;
    invitationAuthorized: false;
    awardAuthorized: false;
    governedSavingsPromoted: false;
  };
  rows: Array<{
    requestNumber: string;
    sourceIdentity: string;
    businessDomain: string;
    businessFunction: string;
    categoryId: string;
    archetypeId: string;
    requiredIntakeDepth: "complete" | "gapped";
    requesterValueBasis: string | null;
    requesterValueValidated: boolean | null;
    requesterValuePromotedToGovernedSavings: false;
    eligibleSupplierIds: string[];
    eligibleSupplierNames: string[];
    existingContractVendorIds: string[];
    rejectedNegativeControlReasons: string[];
    contactActionAvailable: false;
    invitationClaimed: false;
    awardClaimed: false;
  }>;
  errors: string[];
};

function parseCsv<Row extends Record<string, string>>(
  csvText: string,
  label: string,
): Row[] {
  const parsed = Papa.parse<Row>(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim(),
  });
  if (parsed.errors.length > 0) {
    throw new Error(
      `${label} CSV parse failed: ${parsed.errors
        .map((error) => `row ${error.row ?? "?"}: ${error.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

function supplierRowsForProjection(
  rows: readonly CandidateSupplierRegistryRow[],
): CandidateSupplierAuthorityRow[] {
  return rows
    .filter((row) => row.expected_decision === "eligible")
    .map((row) => ({
      tenantKey: "synthetic-fixture-tenant",
      supplierId: row.record_id,
      legalEntityId: row.record_id,
      legalName: row.supplier_legal_name,
      authorityState: "accepted",
      eligibility: {
        categoryKeys: [row.category_id],
        functionKeys: [row.business_function],
        archetypeKeys: [row.eligible_archetype_id],
      },
      contactPolicy:
        row.contact_policy === "do_not_contact" ? "do_not_contact" : "review_required",
      contacts: [],
      source: {
        system: row.source_system,
        reference: `${row.source_file}#${row.source_row}:${row.source_record_id}`,
        recordedAt: "2026-09-22T00:00:00.000Z",
        recordedBy: row.source_record_id,
      },
    }));
}

function buildAcceptanceMatrix(input: {
  requestCsvText: string;
  supplierCsvText: string;
}): AcceptanceMatrix {
  const errors: string[] = [];
  const requestRows = parseCsv<ServiceNowSourcingRequestRow>(
    input.requestCsvText,
    "ServiceNow request",
  );
  const supplierRows = parseCsv<CandidateSupplierRegistryRow>(
    input.supplierCsvText,
    "candidate supplier",
  );
  const supplierValidation = buildCandidateSupplierRegistryValidation({
    csvText: input.supplierCsvText,
    inputPath: supplierCsvPath,
  });
  errors.push(...supplierValidation.errors.map((error) => `supplier_fixture: ${error}`));

  const registeredArchetypes = listSourceArchetypes().map((archetype) => archetype.id);
  const requests = requestRows.map((row, index) =>
    adaptServiceNowSourcingRequest({
      tenantKey: "synthetic-fixture-tenant",
      sourceRow: index + 2,
      row,
      loadedSegments: [],
    }),
  );
  const requestArchetypeCounts = new Map<string, number>();
  for (const request of requests) {
    const archetypeId = request.mappingProposal.archetypeId ?? "";
    requestArchetypeCounts.set(
      archetypeId,
      (requestArchetypeCounts.get(archetypeId) ?? 0) + 1,
    );
  }
  for (const archetypeId of registeredArchetypes) {
    const count = requestArchetypeCounts.get(archetypeId) ?? 0;
    if (count !== 1) {
      errors.push(
        `ServiceNow request fixture maps ${count} request row(s) to ${archetypeId}; expected exactly 1.`,
      );
    }
  }

  const projectedSupplierRows = supplierRowsForProjection(supplierRows);
  const eligibleByName = new Map(
    supplierRows
      .filter((row) => row.expected_decision === "eligible")
      .map((row) => [row.supplier_legal_name, row]),
  );
  const negativeControlIds = new Set(
    supplierRows
      .filter((row) => row.expected_decision === "fail_closed")
      .map((row) => row.record_id),
  );
  const failClosedReasons = supplierValidation.failClosedControls.map(
    (control) => control.expectedReason,
  );

  const matrixRows = requests.map((request) => {
    const categoryId = request.mappingProposal.categoryId;
    const archetypeId = request.mappingProposal.archetypeId;
    if (!archetypeId) {
      errors.push(`${request.source.requestNumber} did not resolve to a Source archetype.`);
    } else if (CATEGORY_TO_ARCHETYPE_ID[categoryId] !== archetypeId) {
      errors.push(
        `${request.source.requestNumber} resolved category ${categoryId} to ${archetypeId}, but registry expects ${CATEGORY_TO_ARCHETYPE_ID[categoryId]}.`,
      );
    }
    if (request.requiredFactGaps.length > 0) {
      errors.push(
        `${request.source.requestNumber} has intake fact gaps: ${request.requiredFactGaps.join(", ")}.`,
      );
    }
    if (request.value && request.value.validated !== false) {
      errors.push(`${request.source.requestNumber} promoted requester value as validated.`);
    }

    const projection = buildSourceRequestSupplierSuggestions({
      tenantKey: "synthetic-fixture-tenant",
      eventId: request.requestId,
      acceptedMapping: archetypeId ? { categoryId, archetypeId } : null,
      registryAvailable: true,
      registryRows: projectedSupplierRows,
      contractVendorLegalEntityIds: [],
      contractEvidenceAvailable: true,
    });
    if (projection.status !== "available") {
      errors.push(`${request.source.requestNumber} supplier projection is ${projection.status}.`);
    }
    if (projection.rows.length < 2) {
      errors.push(
        `${request.source.requestNumber} has ${projection.rows.length} eligible fictional supplier candidate(s); expected at least 2.`,
      );
    }
    for (const suggestion of projection.rows) {
      const fixtureRow = eligibleByName.get(suggestion.legalName);
      if (!fixtureRow) {
        errors.push(
          `${request.source.requestNumber} suggested ${suggestion.legalName} without an eligible fixture row.`,
        );
        continue;
      }
      if (
        fixtureRow.category_id !== categoryId ||
        fixtureRow.business_function !== request.organization.businessFunction ||
        fixtureRow.eligible_archetype_id !== archetypeId
      ) {
        errors.push(
          `${request.source.requestNumber} suggested ${fixtureRow.record_id} with an eligibility identity mismatch.`,
        );
      }
      if (negativeControlIds.has(suggestion.supplierId)) {
        errors.push(
          `${request.source.requestNumber} suggested negative-control supplier ${suggestion.supplierId}.`,
        );
      }
      if (suggestion.contactActionAvailable !== false) {
        errors.push(
          `${request.source.requestNumber} exposed a supplier contact action for ${suggestion.supplierId}.`,
        );
      }
      if (suggestion.label !== "Suggested for review") {
        errors.push(
          `${request.source.requestNumber} used non-review supplier label ${suggestion.label}.`,
        );
      }
    }

    const requiredIntakeDepth: "complete" | "gapped" =
      request.requiredFactGaps.length === 0 ? "complete" : "gapped";

    return {
      requestNumber: request.source.requestNumber,
      sourceIdentity: `${request.source.table}:${request.source.recordId}:${request.source.version}`,
      businessDomain: request.organization.businessDomain,
      businessFunction: request.organization.businessFunction ?? "",
      categoryId,
      archetypeId: archetypeId ?? "",
      requiredIntakeDepth,
      requesterValueBasis: request.value?.basis ?? null,
      requesterValueValidated: request.value?.validated ?? null,
      requesterValuePromotedToGovernedSavings: false as const,
      eligibleSupplierIds: projection.rows.map((row) => row.supplierId),
      eligibleSupplierNames: projection.rows.map((row) => row.legalName),
      existingContractVendorIds: projection.rows
        .filter((row) => row.existingContractVendor)
        .map((row) => row.supplierId),
      rejectedNegativeControlReasons: failClosedReasons,
      contactActionAvailable: false as const,
      invitationClaimed: false as const,
      awardClaimed: false as const,
    };
  });

  const sourceIdentities = matrixRows.map((row) => row.sourceIdentity);
  if (new Set(sourceIdentities).size !== sourceIdentities.length) {
    errors.push("ServiceNow request fixture contains duplicate source identities.");
  }
  if (supplierValidation.failClosedControls.length !== 5) {
    errors.push(
      `Supplier fixture has ${supplierValidation.failClosedControls.length} fail-closed control(s); expected 5.`,
    );
  }

  return {
    event: "source_servicenow_request_acceptance_harness",
    status: errors.length === 0 ? "pass" : "fail",
    inputs: {
      requests: {
        path: "datasets/source-servicenow-sourcing-requests-synthetic-v1/servicenow_sourcing_requests.csv",
        rows: requestRows.length,
      },
      candidateSuppliers: {
        path: "datasets/source/candidate-supplier-registry-synthetic-v1/candidate_supplier_registry.csv",
        rows: supplierRows.length,
      },
    },
    summary: {
      expectedArchetypes: registeredArchetypes.length,
      coveredArchetypes: new Set(matrixRows.map((row) => row.archetypeId)).size,
      requestRows: matrixRows.length,
      eligibleSupplierRows: supplierValidation.summary.eligibleCandidateRows,
      negativeControlRows: supplierValidation.summary.negativeControlRows,
    },
    authority: {
      readOnlyHarness: true,
      usesMergedFixtureFiles: true,
      tenantWriteAuthorized: false,
      supplierContactAuthorized: false,
      invitationAuthorized: false,
      awardAuthorized: false,
      governedSavingsPromoted: false,
    },
    rows: matrixRows,
    errors,
  };
}

describe("Source ServiceNow request acceptance harness", () => {
  it("emits a deterministic acceptance matrix across all ten sourcing archetypes", () => {
    const matrix = buildAcceptanceMatrix({
      requestCsvText: fs.readFileSync(requestCsvPath, "utf8"),
      supplierCsvText: fs.readFileSync(supplierCsvPath, "utf8"),
    });

    expect(matrix.status).toBe("pass");
    expect(matrix.errors).toEqual([]);
    expect(matrix.summary).toEqual({
      expectedArchetypes: 10,
      coveredArchetypes: 10,
      requestRows: 10,
      eligibleSupplierRows: 20,
      negativeControlRows: 5,
    });
    for (const row of matrix.rows) {
      expect(row.requiredIntakeDepth).toBe("complete");
      expect(row.eligibleSupplierIds.length).toBeGreaterThanOrEqual(2);
      expect(row.existingContractVendorIds).toEqual([]);
      expect(row.rejectedNegativeControlReasons.sort()).toEqual([
        "draft_authority",
        "duplicate_identity",
        "mismatched_eligibility",
        "missing_contact_authority",
        "missing_lineage",
      ]);
      expect(row.contactActionAvailable).toBe(false);
      expect(row.invitationClaimed).toBe(false);
      expect(row.awardClaimed).toBe(false);
      expect(row.requesterValuePromotedToGovernedSavings).toBe(false);
      expect(row.requesterValueBasis).toBe("requester_stated_unvalidated");
      expect(row.requesterValueValidated).toBe(false);
    }

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(matrix, null, 2)}\n`);
  });

  it("fails when a ServiceNow row is removed from the archetype denominator", () => {
    const lines = fs.readFileSync(requestCsvPath, "utf8").trimEnd().split(/\r?\n/u);
    const mutatedRequestCsv = `${[lines[0], ...lines.slice(2)].join("\n")}\n`;
    const matrix = buildAcceptanceMatrix({
      requestCsvText: mutatedRequestCsv,
      supplierCsvText: fs.readFileSync(supplierCsvPath, "utf8"),
    });

    expect(matrix.status).toBe("fail");
    expect(matrix.errors).toContain(
      "ServiceNow request fixture maps 0 request row(s) to AMS_MANAGED_SERVICES; expected exactly 1.",
    );
  });

  it("fails when an archetype loses its second eligible supplier candidate", () => {
    const supplierCsv = fs
      .readFileSync(supplierCsvPath, "utf8")
      .split(/\r?\n/u)
      .filter((line) => !line.startsWith("SYN-SUP-AMS-002,"))
      .join("\n");
    const matrix = buildAcceptanceMatrix({
      requestCsvText: fs.readFileSync(requestCsvPath, "utf8"),
      supplierCsvText: supplierCsv,
    });

    expect(matrix.status).toBe("fail");
    expect(matrix.errors).toContain(
      "supplier_fixture: Archetype AMS_MANAGED_SERVICES has 1 eligible candidate row(s); expected at least 2.",
    );
    expect(matrix.errors).toContain(
      "REQ0010001 has 1 eligible fictional supplier candidate(s); expected at least 2.",
    );
  });
});

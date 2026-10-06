import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { CATEGORY_TO_ARCHETYPE_ID } from "../../archetypes/event-archetype-resolver";
import {
  adaptServiceNowSourcingRequest,
  type ServiceNowSourcingRequestRow,
} from "../servicenow-sourcing-request-adapter";

type DecisionGradeServiceNowRow = ServiceNowSourcingRequestRow & {
  estimated_value_low: string;
  estimated_value_high: string;
  value_time_basis: string;
  incumbent_context: string;
  service_volume_summary: string;
  source_system_references: string;
  evidence_references: string;
};

const EXPECTED_ROUTES = [
  {
    number: "REQ0010001",
    domain: "it",
    organization: "Technology Services",
    businessFunction: "application_operations",
    categoryId: "ams",
    archetypeId: "AMS_MANAGED_SERVICES",
    buyingMotion: "competitive_rfp",
  },
  {
    number: "REQ0010002",
    domain: "enterprise",
    organization: "Enterprise Transformation Office",
    businessFunction: "finance_transformation",
    categoryId: "erp_si_implementation",
    archetypeId: "ERP_SI_IMPLEMENTATION",
    buyingMotion: "competitive_rfp",
  },
  {
    number: "REQ0010003",
    domain: "plan",
    organization: "Health Plan Strategy",
    businessFunction: "data_and_analytics",
    categoryId: "data_ai_platform",
    archetypeId: "AI_DATA_PLATFORM",
    buyingMotion: "competitive_rfp",
  },
  {
    number: "REQ0010004",
    domain: "delivery",
    organization: "Digital Delivery",
    businessFunction: "digital_product_engineering",
    categoryId: "ai_engineering_partner",
    archetypeId: "AI_ENGINEERING_PARTNER",
    buyingMotion: "partner_selection",
  },
  {
    number: "REQ0010005",
    domain: "enterprise",
    organization: "Enterprise Technology",
    businessFunction: "enterprise_applications",
    categoryId: "saas_renewal",
    archetypeId: "CONTRACT_RENEWAL",
    buyingMotion: "renewal_renegotiation",
  },
  {
    number: "REQ0010006",
    domain: "it",
    organization: "Cloud Platform Engineering",
    businessFunction: "cloud_finops",
    categoryId: "cloud_finops",
    archetypeId: "CLOUD_FINOPS",
    buyingMotion: "framework_commitment",
  },
  {
    number: "REQ0010007",
    domain: "plan",
    organization: "Health Plan Operations",
    businessFunction: "member_services",
    categoryId: "bpo_contact_centre",
    archetypeId: "CONTACT_CENTER_CX",
    buyingMotion: "competitive_rfp",
  },
  {
    number: "REQ0010008",
    domain: "enterprise",
    organization: "Enterprise Shared Services",
    businessFunction: "finance_shared_services",
    categoryId: "bpo_shared_services",
    archetypeId: "BPO_SHARED_SERVICES",
    buyingMotion: "competitive_rfp",
  },
  {
    number: "REQ0010009",
    domain: "it",
    organization: "Information Security",
    businessFunction: "cyber_security",
    categoryId: "cyber_grc",
    archetypeId: "MSSP_CYBER",
    buyingMotion: "competitive_rfp",
  },
  {
    number: "REQ0010010",
    domain: "delivery",
    organization: "Technology Delivery",
    businessFunction: "delivery_capacity",
    categoryId: "staff_aug_vs_managed_service",
    archetypeId: "STAFF_AUGMENTATION",
    buyingMotion: "demand_triage",
  },
] as const;

const datasetPath = path.join(
  process.cwd(),
  "datasets/source-servicenow-sourcing-requests-synthetic-v1/servicenow_sourcing_requests.csv",
);

function categoryRoutedArchetypeIds(): Set<string> {
  return new Set(
    Object.values(CATEGORY_TO_ARCHETYPE_ID).filter(
      (id): id is string => Boolean(id),
    ),
  );
}

describe("synthetic ServiceNow sourcing-request pack", () => {
  const csv = fs.readFileSync(datasetPath, "utf8");
  const parsed = Papa.parse<DecisionGradeServiceNowRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  it("is structurally valid and uses unique source identities", () => {
    expect(parsed.errors).toEqual([]);
    expect(parsed.data).toHaveLength(10);
    const identities = parsed.data.map(
      (row) => `${row.source_table}:${row.sys_id}:${row.extract_version}`,
    );
    expect(new Set(identities).size).toBe(identities.length);
    expect(csv).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  });

  it("covers all four originating domains", () => {
    expect(new Set(parsed.data.map((row) => row.business_domain))).toEqual(
      new Set(["plan", "delivery", "enterprise", "it"]),
    );
  });

  it("maps detailed request input across every category-routed Source archetype", () => {
    const requests = parsed.data.map((row, index) =>
      adaptServiceNowSourcingRequest({
        tenantKey: "internal-golden",
        sourceRow: index + 2,
        row,
        loadedSegments: [],
      }),
    );
    const resolved = new Set(
      requests.map((request) => request.mappingProposal.archetypeId),
    );
    const registered = categoryRoutedArchetypeIds();

    expect(resolved).toEqual(registered);
    for (const request of requests) {
      expect(request.mappingProposal.confidence).not.toBe("low");
      expect(request.mappingProposal.reasons.length).toBeGreaterThan(0);
      expect(request.mappingDecision).toBeNull();
      expect(request.eventLink).toBeNull();
    }
  });

  it("maps every request to its expected domain, function, category, motion, and archetype", () => {
    const actual = parsed.data.map((row, index) => {
      const request = adaptServiceNowSourcingRequest({
        tenantKey: "internal-golden",
        sourceRow: index + 2,
        row,
        loadedSegments: [],
      });
      return {
        number: request.source.requestNumber,
        domain: request.organization.businessDomain,
        organization: request.organization.requestedFor,
        businessFunction: request.organization.businessFunction,
        categoryId: request.mappingProposal.categoryId,
        archetypeId: request.mappingProposal.archetypeId,
        buyingMotion: request.mappingProposal.buyingMotion,
      };
    });

    expect(actual).toEqual(EXPECTED_ROUTES);
  });

  it("carries decision-grade depth and auditable source evidence for all ten archetypes", () => {
    for (const [index, row] of parsed.data.entries()) {
      const label = row.number || `row ${index + 2}`;
      const nonBlank = [
        row.short_description,
        row.description,
        row.business_justification,
        row.sourcing_trigger,
        row.requested_outcome,
        row.requested_by_user_id,
        row.requested_by_display_name,
        row.requested_for_org,
        row.business_domain,
        row.business_function,
        row.needed_by,
        row.target_decision_date,
        row.estimated_annual_value,
        row.estimated_value_low,
        row.estimated_value_high,
        row.value_time_basis,
        row.incumbent_context,
        row.scope_in,
        row.scope_out,
        row.geography,
        row.service_criticality,
        row.regulated_data_flags,
        row.data_system_owner,
        row.budget_status,
        row.decision_owner,
        row.baseline_owner,
        row.service_volume_summary,
        row.source_system_references,
        row.evidence_references,
        row.source_table,
        row.extract_timestamp,
        row.extract_version,
      ];
      expect(nonBlank.every((value) => value.trim().length > 0)).toBe(true);

      const point = Number(row.estimated_annual_value);
      const low = Number(row.estimated_value_low);
      const high = Number(row.estimated_value_high);
      expect(
        Number.isFinite(point) &&
          Number.isFinite(low) &&
          Number.isFinite(high) &&
          low > 0 &&
          low <= point &&
          point <= high,
      ).toBe(true);

      const serviceVolumes = row.service_volume_summary.split(";");
      expect(serviceVolumes.length).toBeGreaterThanOrEqual(3);
      expect(serviceVolumes.every((item) => /\d/u.test(item))).toBe(true);

      const sourceSystems = row.source_system_references.split("|");
      expect(sourceSystems.length).toBeGreaterThanOrEqual(2);
      expect(sourceSystems.every((item) => item.trim().length > 0)).toBe(true);

      const attachmentIds = new Set(row.attachment_references.split("|"));
      const evidenceReferences = row.evidence_references.split("|");
      expect(evidenceReferences.length).toBeGreaterThanOrEqual(2);
      for (const reference of evidenceReferences) {
        const [attachmentId, evidenceType, sourceBasis] = reference.split(":");
        expect(attachmentIds.has(attachmentId)).toBe(true);
        expect(evidenceType).toMatch(/^[a-z0-9_]+$/u);
        expect(sourceBasis).toMatch(
          /^(source_extract|source_report|planning_document)$/u,
        );
      }

      if (!row.incumbent_supplier_name) {
        expect(row.incumbent_context).toMatch(/net-new|no incumbent/i);
      } else {
        expect(row.existing_contract_reference).not.toBe("");
      }

      const openedAt = Date.parse(row.opened_at);
      const updatedAt = Date.parse(row.updated_at);
      const extractedAt = Date.parse(row.extract_timestamp);
      const decisionDate = Date.parse(`${row.target_decision_date}T00:00:00Z`);
      const neededBy = Date.parse(`${row.needed_by}T00:00:00Z`);
      expect(
        openedAt <= updatedAt &&
          updatedAt <= extractedAt &&
          decisionDate <= neededBy,
      ).toBe(true);

      expect(label).toMatch(/^REQ\d+$/u);
    }
  });
});

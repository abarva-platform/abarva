import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { listSourceArchetypes } from "../../archetypes/registry";
import {
  adaptServiceNowSourcingRequest,
  type ServiceNowSourcingRequestRow,
} from "../servicenow-sourcing-request-adapter";
import { buildServiceNowRequestEventHandoff } from "../servicenow-request-event-handoff";
import type { SourceIntakeRequestSummary } from "../servicenow-sourcing-request-repository";

const datasetPath = path.join(
  process.cwd(),
  "datasets/source-servicenow-sourcing-requests-synthetic-v1/servicenow_sourcing_requests.csv",
);

const request: SourceIntakeRequestSummary = {
  requestId: "servicenow:sn_sourcing_request:request-1",
  requestNumber: "REQ0010007",
  sourceSystem: "ServiceNow",
  sourceStatus: "New",
  sourceVersion: "v1",
  extractedAt: "2026-09-22T12:00:00Z",
  updatedAt: "2026-09-22T11:55:00Z",
  title: "Member services contact center replacement",
  description: "Replace the member contact center platform and operations model.",
  trigger: "Current agreement expires in nine months.",
  requestedOutcome: "Select a platform and managed operations partner.",
  requestedFor: "Health Plan",
  businessDomain: "plan",
  businessFunction: "Member Services",
  decisionOwner: "VP Member Services",
  baselineOwner: "Contact center operations",
  scopeIncluded: "Member calls, chat, quality monitoring, and workforce management.",
  scopeExcluded: "Clinical triage.",
  securityReviewNeeded: true,
  legalReviewNeeded: true,
  value: { amount: 12500000, currency: "USD", validated: false },
  requiredFactGaps: [],
  mappingProposal: {
    categoryId: "bpo_contact_centre",
    archetypeId: "CONTACT_CENTER_CX",
    confidence: "high",
    reasons: ["Matched contact-center scope"],
  },
  mappingDecision: null,
  eventLink: null,
};

describe("ServiceNow request event handoff", () => {
  it("accepts every detailed synthetic archetype without losing the proposed route", () => {
    const parsed = Papa.parse<ServiceNowSourcingRequestRow>(
      fs.readFileSync(datasetPath, "utf8"),
      { header: true, skipEmptyLines: true },
    );
    expect(parsed.errors).toEqual([]);

    const handoffs = parsed.data.map((row, index) => {
      const canonical = adaptServiceNowSourcingRequest({
        tenantKey: "internal-golden",
        sourceRow: index + 2,
        row,
        loadedSegments: [],
      });
      const summary: SourceIntakeRequestSummary = {
        requestId: canonical.requestId,
        requestNumber: canonical.source.requestNumber,
        sourceSystem: "ServiceNow",
        sourceStatus: canonical.sourceStatus,
        sourceVersion: canonical.source.version,
        extractedAt: canonical.source.extractedAt,
        updatedAt: canonical.updatedAt,
        title: canonical.title,
        description: canonical.description,
        trigger: canonical.trigger,
        requestedOutcome: canonical.requestedOutcome,
        requestedFor: canonical.organization.requestedFor,
        businessDomain: canonical.organization.businessDomain,
        businessFunction: canonical.organization.businessFunction,
        decisionOwner: canonical.governance.decisionOwner,
        baselineOwner: canonical.governance.baselineOwner,
        scopeIncluded: canonical.scope.included,
        scopeExcluded: canonical.scope.excluded,
        securityReviewNeeded: canonical.governance.securityReviewNeeded,
        legalReviewNeeded: canonical.governance.legalReviewNeeded,
        value: canonical.value
          ? {
              amount: canonical.value.amount,
              currency: canonical.value.currency,
              validated: false,
            }
          : null,
        requiredFactGaps: [...canonical.requiredFactGaps],
        mappingProposal: {
          categoryId: canonical.mappingProposal.categoryId,
          archetypeId: canonical.mappingProposal.archetypeId,
          confidence: canonical.mappingProposal.confidence,
          reasons: [...canonical.mappingProposal.reasons],
        },
        mappingDecision: null,
        eventLink: null,
      };

      return buildServiceNowRequestEventHandoff({
        request: summary,
        decision: {
          state: "accepted",
          rationale: "The recorded scope and baseline support this proposed route.",
        },
        reviewer: { userId: "person-1", name: "Procurement Lead" },
        decidedAt: "2026-09-22T13:00:00Z",
      });
    });

    expect(handoffs).toHaveLength(10);
    expect(new Set(handoffs.map((item) => item.mappingDecision.archetypeId))).toEqual(
      new Set(listSourceArchetypes().map((item) => item.id)),
    );
    for (const handoff of handoffs) {
      expect(handoff.eventInput.categoryId).toBe(
        handoff.mappingDecision.categoryId,
      );
      expect(handoff.eventInput.creationRequestId).toBeTruthy();
      expect(handoff.eventInput.triggerDescription).toBeTruthy();
      expect(handoff.eventInput.decisionOwner).toBeTruthy();
      expect(handoff.eventInput.scopeDescription).toBeTruthy();
    }
  });

  it("turns an explicitly accepted proposal into a governed event command", () => {
    expect(
      buildServiceNowRequestEventHandoff({
        request,
        decision: { state: "accepted", rationale: "Scope and buying motion confirmed." },
        reviewer: { userId: "person-1", name: "Procurement Lead" },
        decidedAt: "2026-09-22T13:00:00Z",
      }),
    ).toEqual(
      expect.objectContaining({
        mappingDecision: expect.objectContaining({
          state: "accepted",
          categoryId: "bpo_contact_centre",
          archetypeId: "CONTACT_CENTER_CX",
          decidedByName: "Procurement Lead",
        }),
        eventInput: expect.objectContaining({
          eventName: "Member services contact center replacement",
          eventType: "managed_service",
          triggerDescription: "Current agreement expires in nine months.",
          decisionOwner: "VP Member Services",
          categoryId: "bpo_contact_centre",
          creationRequestId: request.requestId,
          estimatedValueUsd: 12500000,
        }),
      }),
    );
  });

  it("resolves an override from the selected category rather than trusting an archetype string", () => {
    const result = buildServiceNowRequestEventHandoff({
      request,
      decision: {
        state: "overridden",
        categoryId: "bpo_shared_services",
        rationale: "The work is back-office shared services, not member contact operations.",
      },
      reviewer: { userId: "person-1", name: "Procurement Lead" },
      decidedAt: "2026-09-22T13:00:00Z",
    });

    expect(result.mappingDecision.categoryId).toBe("bpo_shared_services");
    expect(result.mappingDecision.archetypeId).toBe("BPO_SHARED_SERVICES");
    expect(result.eventInput.categoryId).toBe("bpo_shared_services");
  });

  it("blocks event creation while governed intake facts are missing", () => {
    expect(() =>
      buildServiceNowRequestEventHandoff({
        request: { ...request, requiredFactGaps: ["baseline_owner"] },
        decision: { state: "accepted", rationale: "Scope reviewed." },
        reviewer: { userId: "person-1", name: "Procurement Lead" },
        decidedAt: "2026-09-22T13:00:00Z",
      }),
    ).toThrow(/missing governed facts: baseline_owner/);
  });

  it("fails closed for generic reviewer identity and already-linked requests", () => {
    expect(() =>
      buildServiceNowRequestEventHandoff({
        request,
        decision: { state: "accepted", rationale: "Scope reviewed." },
        reviewer: { userId: "person-1", name: "User" },
        decidedAt: "2026-09-22T13:00:00Z",
      }),
    ).toThrow(/named reviewer identity/);

    expect(() =>
      buildServiceNowRequestEventHandoff({
        request: {
          ...request,
          eventLink: { eventId: "event-1", linkedAt: "2026-09-22T12:30:00Z" },
        },
        decision: { state: "accepted", rationale: "Scope reviewed." },
        reviewer: { userId: "person-1", name: "Procurement Lead" },
        decidedAt: "2026-09-22T13:00:00Z",
      }),
    ).toThrow(/already linked/);
  });
});

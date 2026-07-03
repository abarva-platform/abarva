import { createSourceNexusApiStubResponse } from "../nexus-api";
import { sourceEventRowToDetail, type SourceEventRow } from "../queries";
import type { SourceLiveTenantContextSnapshot } from "../agent-context";

const liveEventRow: SourceEventRow = {
  id: "apx-src-cdp-2026",
  client_key: "apexretail",
  event_code: "APX-SRC-CDP-2026",
  event_name: "CDP Vendor Selection",
  event_type: "platform_selection",
  current_stage_key: "evaluation",
  lifecycle_state: "active",
  linked_program_id: "APX-CDP-2026",
  estimated_value_usd: 2_400_000,
  trigger_description:
    "Unify customer data activation before loyalty and media budget planning.",
  scope_description:
    "CDP vendor selection, implementation partner fit, integration scope, and value case.",
  decision_owner: "Chief Digital Officer",
  created_by_user_id: "user-apex-source",
  created_at: "2026-05-01T00:00:00.000Z",
  updated_at: "2026-05-09T00:00:00.000Z",
};

const liveTenantContext: SourceLiveTenantContextSnapshot = {
  clientKey: "apexretail",
  brokerTenantKey: "apex-retail",
  inventoryRecordCount: 403,
  contextChunkCount: 935,
  embeddedContextChunkCount: 935,
  sourceEventFound: true,
  segments: [
    {
      segmentId: "org_structure",
      inventoryRecords: 36,
      contextChunks: 36,
      embeddedChunks: 36,
    },
    {
      segmentId: "it_financials",
      inventoryRecords: 71,
      contextChunks: 71,
      embeddedChunks: 71,
    },
    {
      segmentId: "it_landscape",
      inventoryRecords: 96,
      contextChunks: 96,
      embeddedChunks: 96,
    },
    {
      segmentId: "vendor_contracts",
      inventoryRecords: 38,
      contextChunks: 38,
      embeddedChunks: 38,
    },
  ],
  currentStateAreas: [
    "Org Structure",
    "IT Financials",
    "IT Landscape",
    "Vendor Contracts",
  ],
  evidenceBasis: [
    "It Landscape: 96 records, 96 chunks, 96 embedded",
    "It Financials: 71 records, 71 chunks, 71 embedded",
    "Vendor Contracts: 38 records, 38 chunks, 38 embedded",
    "Org Structure: 36 records, 36 chunks, 36 embedded",
  ],
  retrievedEvidence: [
    {
      id: "chunk:it_landscape:cdp",
      segmentId: "it_landscape",
      recordId: "it_landscape:cdp",
      title: "CDP integration baseline",
      sourceType: "contextChunk",
      sourceDoc: "CDP-Round-1-Selection-Memo-2026-04-15.pdf",
      excerpt:
        "claim: Deloitte Digital was selected as CDP implementation partner; Treasure Data and Segment advanced to BAFO.",
      confidence: "high",
      score: 12,
    },
    {
      id: "chunk:evidence_ledger:identity",
      segmentId: "evidence_ledger",
      recordId: "evidence_ledger:identity",
      title: "Identity match baseline",
      sourceType: "contextChunk",
      sourceDoc: "data-quality-baseline-2026-q1.xlsx",
      excerpt:
        "claim: Identity match rate across customer source systems is currently 71%.",
      confidence: "high",
      score: 11,
    },
  ],
  warnings: [],
};

describe("Source Nexus API live context", () => {
  it("answers persisted Apex source events with live current-state intelligence instead of seed-only event lookup", () => {
    const response = createSourceNexusApiStubResponse({
      eventId: "APX-SRC-CDP-2026",
      prompt:
        "What is the current state and how should the CXO shape this sourcing event?",
      tenant: {
        tenantId: "apex-retail",
        tenantKey: "apexretail",
        tenantName: "Apex Retail Group",
        activeClientId: "apexretail",
        activeClientName: "Apex Retail Group",
      },
      user: { id: "user-apex-source" },
      userRole: "cio",
      liveEventDetail: sourceEventRowToDetail(
        liveEventRow,
        "Apex Retail Group",
      ),
      liveTenantContext,
    });

    expect(response.ok).toBe(true);
    expect(response.httpStatus).toBe(200);
    expect(response.error).toBeUndefined();
    expect(response.context.eventName).toBe("CDP Vendor Selection");
    expect(response.sourceIntelligence).toEqual({
      liveContextAvailable: true,
      sourceEventFound: true,
      inventoryRecordCount: 403,
      contextChunkCount: 935,
      embeddedContextChunkCount: 935,
      currentStateAreas: [
        "Org Structure",
        "IT Financials",
        "IT Landscape",
        "Vendor Contracts",
      ],
      evidenceBasis: liveTenantContext.evidenceBasis,
      warnings: [],
    });
    expect(response.sourceAnswer).toMatchObject({
      engineVersion: "source-answer-engine/v1",
      mode: "cxo_guidance",
      confidence: "medium",
      recommendedNextAction:
        "Lock CDP scoring around identity, activation, integration ownership, governance, and full TCO before BAFO.",
    });
    expect(response.sourceAnswer?.answerText).toContain("CXO guidance");
    expect(response.answer).toBe(response.summary);
    expect(response.answer).not.toMatch(/source_events|Current state:/i);
    expect(response.answerQuality).toMatchObject({
      renderable: true,
      evidenceLedgerCheck: { passed: true },
      readiness: { readinessVerdict: "sufficient" },
    });
    expect(
      response.answerQuality?.evidenceLedger.dataUsed.length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      response.sourceAnswer?.evidenceCitations.map(
        (citation) => citation.sourceDoc,
      ),
    ).toEqual(
      expect.arrayContaining([
        "CDP-Round-1-Selection-Memo-2026-04-15.pdf",
        "data-quality-baseline-2026-q1.xlsx",
      ]),
    );
    expect(
      response.agentResponseParts.some((part) => part.type === "table"),
    ).toBe(true);
    expect(
      response.agentResponseParts.some((part) => part.type === "barChart"),
    ).toBe(true);
    expect(response.summary).toBe(response.sourceAnswer?.answerText);
    expect(
      response.sentinelBriefing?.primaryVoice.contextUsed[0]
        ?.deterministicFieldsUsed,
    ).toEqual(
      expect.arrayContaining([
        "sourcingEvent",
        "workflowStage",
        "liveTenantContext",
      ]),
    );
    expect(response.sentinelBriefing?.primaryVoice.evidenceNotes).toEqual(
      expect.arrayContaining([
        "Live Apex Retail Group context: 403 inventory records, 935 context chunks, 935 embedded chunks.",
      ]),
    );
  });

  it("uses the live tenant label in Source briefing evidence notes", () => {
    const response = createSourceNexusApiStubResponse({
      eventId: "SKYH-AMS-CONTRACT-OPT-2026",
      prompt: "What is the financial exposure?",
      tenant: {
        tenantId: "client-skyharbor",
        tenantKey: "skyharbor",
        tenantName: "SkyHarbor Air",
        activeClientId: "client-skyharbor",
        activeClientName: "SkyHarbor Air",
      },
      user: { id: "user-skyharbor" },
      userRole: "cio",
      liveEventDetail: sourceEventRowToDetail(
        {
          ...liveEventRow,
          id: "skyh-ams-contract-opt-2026",
          client_key: "skyharbor",
          event_code: "SKYH-AMS-CONTRACT-OPT-2026",
          event_name:
            "SkyHarbor AMS Contract Optimization and Renewal Decision",
          event_type: "managed-service",
        },
        "SkyHarbor Air",
      ),
      liveTenantContext: {
        ...liveTenantContext,
        clientKey: "skyharbor",
      },
    });

    const evidenceNotes =
      response.sentinelBriefing?.primaryVoice.evidenceNotes ?? [];
    expect(evidenceNotes).toEqual(
      expect.arrayContaining([
        "Live SkyHarbor Air context: 403 inventory records, 935 context chunks, 935 embedded chunks.",
      ]),
    );
    expect(evidenceNotes.join("\n")).not.toContain("Live Apex context");
  });

  it("answers RFI or BAFO pressure from persisted event intake without a generic unavailable-context response", () => {
    const response = createSourceNexusApiStubResponse({
      eventId: "APX-INTEGRATION-FABRIC-2026",
      prompt:
        "Should I issue an RFI or invite Adobe, Salesforce, and Accenture to BAFO now given renewal pressure?",
      tenant: {
        tenantId: "apex-retail",
        tenantKey: "apexretail",
        tenantName: "Apex Retail Group",
        activeClientId: "apexretail",
        activeClientName: "Apex Retail Group",
      },
      user: { id: "user-apex-cio" },
      userRole: "cio",
      liveEventDetail: sourceEventRowToDetail(
        {
          ...liveEventRow,
          id: "apx-integration-fabric-2026",
          event_code: "APX-INTEGRATION-FABRIC-2026",
          event_name: "Apex Retail Integration Fabric Commercial Control Event",
          event_type: "other",
          estimated_value_usd: null,
          trigger_description:
            "Renewal pressure across Adobe, Salesforce, Accenture and integration platforms risks locking Apex into the wrong topology.",
          scope_description:
            "Scope boundary: customer-data integration contracts and hub-decision architecture. Value basis: no base-case savings until commercial baseline is confirmed. Baseline owner: Nathan Kohl.",
          decision_owner:
            "Carlos Rivera; Linda Mwangi owns buyer architecture boundary; Nathan Kohl owns commercial baseline.",
        },
        "Apex Retail Group",
      ),
      liveTenantContext: {
        ...liveTenantContext,
        retrievedEvidence: [
          {
            id: "source-event:trigger",
            segmentId: "sourcing_artifacts",
            recordId: "trigger",
            title: "Source intake trigger",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "Trigger: Renewal pressure across Adobe, Salesforce, Accenture and integration platforms risks locking Apex into the wrong topology.",
            confidence: "high",
            score: 20,
          },
          {
            id: "source-event:scope",
            segmentId: "sourcing_artifacts",
            recordId: "scope",
            title: "Source intake scope",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "Scope boundary: customer-data integration contracts and hub-decision architecture. Value basis: no base-case savings until commercial baseline is confirmed. Baseline owner: Nathan Kohl.",
            confidence: "high",
            score: 19,
          },
        ],
        evidenceBasis: [
          "Persisted Source intake: trigger, scope, value basis, decision owner and gate criteria from source_events.",
        ],
        warnings: [],
      },
    });

    expect(response.ok).toBe(true);
    expect(response.sourceAnswer?.answerText).toMatch(/do not issue an RFI/i);
    expect(response.sourceAnswer?.answerText).toMatch(
      /buyer architecture and commercial baseline first/i,
    );
    expect(response.sourceAnswer?.answerText).toMatch(
      /Nathan Kohl|commercial baseline|hub-decision architecture/i,
    );
    expect(response.sourceAnswer?.answerText).not.toMatch(
      /current-state inventory records are unavailable/i,
    );
    expect(response.sourceAnswer?.answerText).not.toMatch(
      /^Workflow gates contain blockers/m,
    );
    expect(response.answerQuality?.renderable).toBe(true);
  });

  it("does not let seed fixture blockers override live Source artifact evidence", () => {
    const response = createSourceNexusApiStubResponse({
      eventId: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      prompt: "What is still blocking the SkyHarbor AMS RFP release?",
      tenant: {
        tenantId: "skyharbor",
        tenantKey: "skyharbor",
        tenantName: "SkyHarbor Air",
        activeClientId: "skyharbor",
        activeClientName: "SkyHarbor Air",
      },
      user: { id: "agent-skyharbor-cto" },
      userRole: "cio",
      stageKey: "rfp",
      liveEventDetail: sourceEventRowToDetail(
        {
          ...liveEventRow,
          id: "e64177a2-e75b-4604-8584-fa60386225ae",
          client_key: "skyharbor",
          event_code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
          event_name: "SkyHarbor AMS Outsourcing RFP",
          event_type: "managed_services",
          current_stage_key: "rfp",
          estimated_value_usd: 300_000_000,
          trigger_description:
            "SkyHarbor is evaluating application managed services outsourcing because vendor contracts are fragmented, service performance varies by tower, change orders are creating leakage, and leadership needs a governed RFP.",
          scope_description:
            "Application managed services sourcing event with tower scope, ticket and SLA baseline, staffing model, current agreement constraints, transition dependencies, and RFP risk register.",
          decision_owner: "CIO and VP Procurement",
        },
        "SkyHarbor Air",
      ),
      liveTenantContext: {
        clientKey: "skyharbor",
        brokerTenantKey: "skyharbor",
        inventoryRecordCount: 0,
        contextChunkCount: 87,
        embeddedContextChunkCount: 0,
        sourceEventFound: true,
        segments: [
          {
            segmentId: "sourcing_artifacts",
            inventoryRecords: 0,
            contextChunks: 8,
            embeddedChunks: 0,
          },
          {
            segmentId: "it_landscape",
            inventoryRecords: 0,
            contextChunks: 4,
            embeddedChunks: 0,
          },
          {
            segmentId: "operating_telemetry",
            inventoryRecords: 0,
            contextChunks: 5,
            embeddedChunks: 0,
          },
          {
            segmentId: "vendor_contracts",
            inventoryRecords: 0,
            contextChunks: 3,
            embeddedChunks: 0,
          },
          {
            segmentId: "it_financials",
            inventoryRecords: 0,
            contextChunks: 2,
            embeddedChunks: 0,
          },
          {
            segmentId: "compliance",
            inventoryRecords: 0,
            contextChunks: 2,
            embeddedChunks: 0,
          },
          {
            segmentId: "program_inventory",
            inventoryRecords: 0,
            contextChunks: 3,
            embeddedChunks: 0,
          },
        ],
        currentStateAreas: [
          "Sourcing Artifacts",
          "Source Evidence and Generated Deliverables",
        ],
        evidenceBasis: [
          "26 uploaded Source evidence artifact(s), 19 generated artifact(s), 50 parsed excerpt(s), and 26 structured fact(s) are bound from the Source artifact registry for this event.",
        ],
        retrievedEvidence: [
          {
            id: "source-artifact:app-scope",
            segmentId: "it_landscape",
            recordId: "app-scope",
            title: "02_application_scope_extract.csv",
            sourceType: "contextChunk",
            sourceDoc: "source_artifacts",
            excerpt:
              "Application scope extract: 500 in-scope applications with criticality, owner, tower, and transition complexity.",
            confidence: "high",
            score: 18,
          },
          {
            id: "source-artifact:ticket-history",
            segmentId: "operating_telemetry",
            recordId: "ticket-history",
            title: "03_servicenow_12_month_ticket_history.csv",
            sourceType: "contextChunk",
            sourceDoc: "source_artifacts",
            excerpt:
              "ServiceNow 12 month ticket history: incident, request, change, severity, reopen, and SLA breach baseline for AMS scope.",
            confidence: "high",
            score: 17,
          },
          {
            id: "source-artifact:agreement",
            segmentId: "vendor_contracts",
            recordId: "agreement",
            title: "01_current_ams_agreement_package_SYNTHETIC.md",
            sourceType: "contextChunk",
            sourceDoc: "source_artifacts",
            excerpt:
              "Current AMS agreement package: scope terms, SLA terms, pricing terms, change-control terms, transition and exit terms.",
            confidence: "high",
            score: 16,
          },
          {
            id: "source-artifact:d09",
            segmentId: "sourcing_artifacts",
            recordId: "d09",
            title: "RFP_Package-69d8180c_source.md",
            sourceType: "contextChunk",
            sourceDoc: "source_artifacts",
            excerpt:
              "Generated RFP package for the RFP stage; quality gate passed with all dimensions at or above 8.",
            confidence: "high",
            score: 15,
          },
        ],
        warnings: [
          "Using persisted Source event facts plus Source artifact registry/chunk/fact evidence for this event; raw blob contents are not exposed unless parsed into governed Source evidence.",
        ],
      },
    });

    expect(response.answerStatus).not.toBe("blocked");
    expect(response.contextValidationSummary).toBeNull();
    expect(response.workflowValidationSummary).toBeNull();
    expect(response.defers.join("\n")).not.toMatch(
      /RFP generation must remain blocked/i,
    );
    expect(response.summary).toMatch(
      /application scope|ServiceNow|RFP package/i,
    );
    expect(response.summary).not.toMatch(
      /Application inventory with criticality, owner, ticket volume, and run cost/i,
    );
    expect(response.sourceAnswer?.deliveryModelGate?.gateStatus).not.toBe(
      "blocked_insufficient_evidence",
    );
  });

  it("answers client-final RFP authority questions from File Cabinet lineage", () => {
    const response = createSourceNexusApiStubResponse({
      eventId: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      prompt: "Which RFP version is final?",
      tenant: {
        tenantId: "skyharbor",
        tenantKey: "skyharbor",
        tenantName: "SkyHarbor Air",
        activeClientId: "skyharbor",
        activeClientName: "SkyHarbor Air",
      },
      user: { id: "agent-skyharbor-cto" },
      userRole: "cio",
      stageKey: "rfp",
      liveEventDetail: sourceEventRowToDetail(
        {
          ...liveEventRow,
          id: "e64177a2-e75b-4604-8584-fa60386225ae",
          client_key: "skyharbor",
          event_code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
          event_name: "SkyHarbor AMS Outsourcing RFP",
          event_type: "managed_services",
          current_stage_key: "rfp",
          estimated_value_usd: 300_000_000,
          trigger_description:
            "SkyHarbor is evaluating application managed services outsourcing and needs a governed RFP.",
          scope_description:
            "Application managed services sourcing event with tower scope, ticket and SLA baseline, staffing model, current agreement constraints, transition dependencies, and RFP risk register.",
          decision_owner: "CIO and VP Procurement",
        },
        "SkyHarbor Air",
      ),
      liveTenantContext: {
        clientKey: "skyharbor",
        brokerTenantKey: "skyharbor",
        inventoryRecordCount: 0,
        contextChunkCount: 2,
        embeddedContextChunkCount: 0,
        sourceEventFound: true,
        segments: [
          {
            segmentId: "sourcing_artifacts",
            inventoryRecords: 0,
            contextChunks: 2,
            embeddedChunks: 0,
          },
        ],
        currentStateAreas: ["Sourcing Artifacts"],
        evidenceBasis: [
          "Client-final RFP artifact and generated draft lineage are bound from the Source artifact registry.",
        ],
        retrievedEvidence: [
          {
            id: "source-artifact:client-final",
            segmentId: "sourcing_artifacts",
            recordId: "client-final",
            title: "RFP Package — Client Final",
            sourceType: "contextChunk",
            sourceDoc: "source_artifacts",
            excerpt:
              'Artifact authority record: "Client Final — SkyHarbor Air AMS RFP Pack.docx" is a client-final upload. Artifact type: d09_rfp_pack; stage: rfp; status: client_final; lifecycle: current; version: 4. Authority: clientFinal=true; currentAuthoritative=true; blobBacked=true. Lineage: links to the prior generated draft; supersedes a prior artifact version. Client-final note: Client legal/procurement edits accepted after review; this version is final for vendor issuance. Client-final stakeholder group: Sourcing steering committee.',
            confidence: "high",
            score: 80,
          },
          {
            id: "source-artifact:generated-draft",
            segmentId: "sourcing_artifacts",
            recordId: "generated-draft",
            title: "RFP Package",
            sourceType: "contextChunk",
            sourceDoc: "source_artifacts",
            excerpt:
              'Artifact authority record: "RFP_Package-69d8180c.docx" is an AbarVa-generated draft. Artifact type: d09_rfp_pack; stage: rfp; status: superseded; lifecycle: superseded; version: 1. Authority: clientFinal=false; currentAuthoritative=false; blobBacked=true. Lineage: has been superseded by a later artifact version.',
            confidence: "high",
            score: 50,
          },
        ],
        warnings: [
          "Using persisted Source event facts plus Source artifact registry evidence for this event.",
        ],
      },
    });

    expect(response.ok).toBe(true);
    expect(response.sourceAnswer?.title).toBe("Artifact authority answer");
    expect(response.summary).toMatch(
      /Client Final .* is the final RFP version of record/i,
    );
    expect(response.summary).toMatch(
      /AbarVa generated .*RFP_Package-69d8180c\.docx/i,
    );
    expect(response.summary).toMatch(/client uploaded .*Client Final/i);
    expect(response.summary).toMatch(/current authoritative=yes/i);
    expect(response.summary).not.toMatch(/Vendor A|BAFO|risk-adjusted lead/i);
    expect(response.summary).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i,
    );
  });
});

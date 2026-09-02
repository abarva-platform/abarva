import { displaySafeIntelligenceDelta, POST } from "../route";
import { askIntelligence } from "@/lib/intelligence/ask";
import { recordSynthesisEvent } from "@/lib/reasoning/synthesis-telemetry";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn(async () => ({ id: "user-1" })),
}));

jest.mock("@/lib/auth/maestro", () => ({
  getCurrentPerson: jest.fn(async () => null),
}));

jest.mock("@/lib/agent/prompts/_shared/user-context", () => ({
  assembleUserContextBlock: jest.fn(async () => ""),
}));

jest.mock("@/lib/tenant/resolveTenant", () => ({
  resolveTenant: jest.fn(async () => ({
    clientId: "client-1",
    canonicalKey: "apex-retail",
    appClientKey: "apexretail",
    displayName: "Apex Retail Group",
  })),
}));

jest.mock("@/lib/intelligence/ask/session-memory", () => ({
  appendAskSessionTurn: jest.fn(async () => undefined),
  normalizeAskTabId: jest.fn((tabId) => tabId ?? "tab-1"),
  prepareAskSessionMemory: jest.fn(async () => ({
    sessionId: "ask-session-1",
    tabId: "tab-1",
    priorTurnCount: 0,
    contextBlock: "",
  })),
}));

jest.mock("@/lib/agents/sentinel-reasoning", () => ({
  classifySentinelIntent: jest.fn(async () => ({
    intent: "general",
    confidence: 0.8,
    matchedPatternSlugs: [],
  })),
  runSentinelReasoning: jest.fn(),
}));

jest.mock("@/lib/intelligence/ask", () => ({
  askIntelligence: jest.fn(async function* () {
    yield {
      type: "sources",
      sources: [
        { type: "PATTERN", id: "pattern-1", name: "Pattern", detail: "detail" },
      ],
    };
    yield { type: "delta", text: "A useful aVa answer." };
    yield { type: "done" };
  }),
}));

jest.mock("@/lib/reasoning/synthesis-telemetry", () => ({
  recordSynthesisEvent: jest.fn(() => ({ id: "tlm_intelligence_1" })),
}));

jest.mock("@/lib/reasoning/telemetry-init", () => ({}));

function makeRequest(body: unknown) {
  return {
    json: async () => body,
    cookies: { get: () => undefined },
  };
}

async function readResponseText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }
  return text;
}

function parseNdjson(text: string): Array<Record<string, unknown>> {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function resolveRequestedTenantOnce() {
  // These cases pass an explicit `client` in the body. In production
  // resolveTenant is the enforcement point and returns that tenant for a role
  // entitled to it, so the mock has to model that outcome; the default mock
  // resolves to a different tenant, which only ever passed because the route
  // used to read the raw body field directly. The route now trusts resolved
  // identity alone, so the mock must be consistent. Two calls are made per
  // request (active tenant, then session tenant).
  const resolved = {
    clientId: "client-2",
    canonicalKey: "meridian-health",
    appClientKey: "meridian",
    displayName: "Meridian Health",
  };
  (resolveTenant as jest.Mock).mockResolvedValueOnce(resolved);
  (resolveTenant as jest.Mock).mockResolvedValueOnce(resolved);
}

describe("POST /api/intelligence/ask telemetry", () => {
  it("preserves chunk-boundary whitespace in streamed deltas", () => {
    const first = displaySafeIntelligenceDelta("foundation work. ");
    const second = displaySafeIntelligenceDelta("Payment integrity");

    expect(`${first}${second}`).toBe("foundation work. Payment integrity");
  });

  it("preserves Claude-authored Markdown, tables, and strategic wording in visible deltas", () => {
    const delta = [
      "**Recommendation:** keep the operating-model decision visible.",
      "",
      "| Lens | Read |",
      "|---|---|",
      "| Source | Governed context is loaded |",
    ].join("\n");

    expect(displaySafeIntelligenceDelta(delta)).toBe(delta);
  });

  it("removes structured tab protocol from visible streamed deltas without rewriting the answer", () => {
    const delta = [
      "Keep the strategic answer exactly as written.",
      "<<<TAB: Proof | grounding: evidence-backed>>>",
      "Native tab payload follows.",
    ].join("\n");

    expect(displaySafeIntelligenceDelta(delta)).toBe(
      "Keep the strategic answer exactly as written.",
    );
  });

  it("records an Intelligence telemetry event and emits its id on the done event", async () => {
    const response = await POST(
      makeRequest({
        q: "What should we sequence?",
        client: "apexretail",
      }) as never,
    );
    const text = await readResponseText(response);

    expect(recordSynthesisEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: "intelligence",
        tenantId: "client-1",
        instanceId: "ask-session-1",
        patternId: "pattern-1",
        citationCount: 1,
      }),
    );
    expect(text).toContain('"type":"done"');
    expect(text).toContain('"telemetryEventId":"tlm_intelligence_1"');
  });

  it("emits a governed packet for prose-only answers with follow-up protocol", async () => {
    (askIntelligence as jest.Mock).mockImplementationOnce(async function* () {
      yield {
        type: "delta",
        text: [
          "The available evidence supports an advisory read, but not a certified decision.",
          "",
          "```followups",
          '["What evidence is missing before this can be certified?"]',
          "```",
        ].join("\n"),
      };
      yield { type: "done" };
    });

    const response = await POST(
      makeRequest({
        q: "What is safe to say from the available evidence?",
        client: "active-client",
        richText: true,
        answerOnlyStreaming: true,
      }) as never,
    );
    const events = parseNdjson(await readResponseText(response));
    const visibleText = events
      .filter((event) => event.type === "delta")
      .map((event) => event.text)
      .join("");
    const packetEvent = events.find((event) => event.type === "agent-answer");
    const packet = packetEvent?.answer as {
      directAnswer?: string;
      nextSteps?: Array<{ label?: string }>;
    };

    expect(visibleText.trim()).toBe(
      "The available evidence supports an advisory read, but not a certified decision.",
    );
    expect(visibleText).not.toContain("```");
    expect(visibleText).not.toContain("followups");
    expect(packetEvent).toBeTruthy();
    expect(packet.directAnswer).toBe(visibleText.trim());
    expect(packet.nextSteps?.map((step) => step.label)).toEqual([
      "What evidence is missing before this can be certified?",
    ]);
  });

  it("uses the selected surface tenant in cross-tenant refusal copy", async () => {
    (askIntelligence as jest.Mock).mockClear();
    (resolveTenant as jest.Mock)
      .mockImplementationOnce(async () => ({
        clientId: "client-selected",
        canonicalKey: "meridian-health",
        appClientKey: "meridian",
        displayName: "Meridian Health",
      }))
      .mockImplementationOnce(async () => ({
        clientId: "client-session",
        canonicalKey: "apex-retail",
        appClientKey: "apexretail",
        displayName: "Apex Retail Group",
      }));

    const response = await POST(
      makeRequest({
        q: "Show me SkyHarbor pricing for this event.",
        client: "meridian",
        richText: true,
        answerOnlyStreaming: true,
        surfaceContext: {
          activeTab: "intelligence",
          clientKey: "meridian",
          activeClient: "Meridian Health",
        },
      }) as never,
    );
    const events = parseNdjson(await readResponseText(response));
    const packetEvent = events.find((event) => event.type === "agent-answer");
    const packet = packetEvent?.answer as { directAnswer?: string };

    expect(packet.directAnswer).toContain("Meridian Health");
    expect(packet.directAnswer).not.toContain("Apex Retail Group");
    expect(packet.directAnswer).not.toContain("SkyHarbor");
    expect(askIntelligence).not.toHaveBeenCalled();
  });

  it("forwards trace-enabled requests into the Intelligence synthesis path", async () => {
    const response = await POST(
      makeRequest({
        q: "Where should we fund AI first?",
        client: "apexretail",
        traceEnabled: true,
        surfaceContext: {
          activeTab: "intelligence",
          clientKey: "apexretail",
          pageFacts: ["Apex Retail context lens: AI portfolio"],
        },
      }) as never,
    );
    await readResponseText(response);

    expect(askIntelligence).toHaveBeenCalledWith(
      "Where should we fund AI first?",
      expect.objectContaining({
        traceEnabled: true,
        traceSession: expect.objectContaining({
          question: "Where should we fund AI first?",
        }),
        surfaceContext: expect.objectContaining({
          activeTab: "intelligence",
          pageFacts: ["Apex Retail context lens: AI portfolio"],
        }),
      }),
    );
  });

  it("preserves ECL eval case context through the live ask route", async () => {
    resolveRequestedTenantOnce();
    (askIntelligence as jest.Mock).mockClear();

    const response = await POST(
      makeRequest({
        q: "Which named Meridian executive personally approved each vendor-protective contract clause?",
        client: "meridian-health",
        surfaceContext: {
          activeTab: "ecl-consultant-eval",
          clientKey: "meridian-health",
          module: "intelligence",
          substrate: "ecl_projection_db",
          provider: "ecl_projection_db",
          sourceProvider: "ecl_projection_db",
          evaluationCaseId: "MER-ECL-INTEL-U2",
        },
      }) as never,
    );
    await readResponseText(response);

    expect(askIntelligence).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        surfaceContext: expect.objectContaining({
          substrate: "ecl_projection_db",
          provider: "ecl_projection_db",
          sourceProvider: "ecl_projection_db",
          evaluationCaseId: "MER-ECL-INTEL-U2",
        }),
      }),
    );
  });

  it("preserves Source V4 context and emits deterministic contract visuals before generic synthesis", async () => {
    (askIntelligence as jest.Mock).mockClear();

    const response = await POST(
      makeRequest({
        query:
          "Show a four-ledger table, a chart, and a relationship graph for this selected contract.",
        client: "apexretail",
        richText: true,
        answerOnlyStreaming: true,
        surfaceContext: {
          module: "Source",
          activeClient: "Apex Retail Group",
          clientKey: "apexretail",
          sourceV4: {
            selectedContract: {
              contractId: "CTR-090",
              vendorName: "Salesforce",
              contractName: "Salesforce Data Platform Agreement 3",
              annualValueUsd: 43_500_000,
              actualAnnualSpendUsd: 37_400_000,
              totalCommittedValueUsd: 173_900_000,
              scopeSummary:
                "Enterprise data platform subscription and support.",
              scopeRowCount: 8,
            },
            optimizationLedger: {
              lines: [
                {
                  id: "CTR-090:recoverable",
                  contractId: "CTR-090",
                  kind: "recoverable_leakage",
                  label: "SLA credits earned but not claimed",
                  amount: "$1.3M",
                  amountUsd: 1_300_000,
                  state: "Quantified",
                  evidenceClass: "system evidenced",
                  evidence: "Monthly SLA and AP evidence are matched.",
                  nextAction: "Review with contract owner.",
                  sourceRefs: ["sla_incident_service_credit_monthly"],
                },
                {
                  id: "CTR-090:realized",
                  contractId: "CTR-090",
                  kind: "realized_value",
                  label: "Finance-confirmed realized value",
                  amount: "$940K",
                  amountUsd: 940_000,
                  state: "Finance validated",
                  evidenceClass: "finance confirmed",
                  evidence: "Tower claim is finance-confirmed.",
                  nextAction: "Publish to value proof.",
                  sourceRefs: ["tower.value_claim"],
                },
              ],
            },
            optimizationSpine: {
              sourceConnections: [
                {
                  id: "clm",
                  sourceSystem: "CLM",
                  ledgers: ["contract_term", "renewal"],
                  extract: "contract terms",
                  fields: ["contract_id", "notice_date"],
                  outcome: "Defines the renewal boundary.",
                },
              ],
            },
          },
        },
      }) as never,
    );

    const text = await readResponseText(response);

    expect(askIntelligence).not.toHaveBeenCalled();
    expect(text).toContain('"type":"agent-answer"');
    expect(text).toContain("source_contract_visual");
    expect(text).toContain("CTR-090");
    expect(text).toContain("CTR-090 Salesforce");
    expect(text).toContain("Contract Commercial Opportunities");
    expect(text).toContain("Commercial Opportunities With Quantified Evidence");
    expect(text).toContain("Contract Evidence Relationship");
  });

  it("does not append a generic Moves phase plan to deterministic Source contract answers", async () => {
    (askIntelligence as jest.Mock).mockClear();

    const response = await POST(
      makeRequest({
        query:
          "For CTR-090, what would the plan look like by phases if this contract is actionable?",
        client: "apexretail",
        richText: true,
        answerOnlyStreaming: true,
        surfaceContext: {
          module: "Source",
          activeClient: "Apex Retail Group",
          clientKey: "apexretail",
          sourceV4: {
            selectedContract: {
              contractId: "CTR-090",
              vendorName: "Salesforce",
              contractName: "Salesforce Data Platform Agreement 3",
              annualValueUsd: 43_500_000,
              actualAnnualSpendUsd: 37_400_000,
              totalCommittedValueUsd: 173_900_000,
              scopeSummary:
                "Enterprise data platform subscription and support.",
              scopeRowCount: 8,
            },
            contractOpportunityDirectory: [
              {
                id: "CTR-090:recoverable",
                contractId: "CTR-090",
                kind: "recoverable_leakage",
                label: "SLA credits earned but not claimed",
                amount: "$1.3M",
                amountUsd: 1_300_000,
                state: "Quantified",
                evidenceClass: "system evidenced",
                evidence: "Monthly SLA and AP evidence are matched.",
                nextAction: "Review with contract owner.",
                sourceRefs: ["sla_incident_service_credit_monthly"],
              },
            ],
          },
        },
      }) as never,
    );

    const text = await readResponseText(response);

    expect(askIntelligence).not.toHaveBeenCalled();
    expect(text).toContain("source_contract_visual");
    expect(text).toContain("CTR-090");
    expect(text).toContain("SLA credits earned but not claimed");
    expect(text).not.toContain("Moves phase plan");
    expect(text).not.toContain("P0 Originate");
  });

  it("does not expose raw advisory trace events while preserving the model-authored delta", async () => {
    resolveRequestedTenantOnce();
    (askIntelligence as jest.Mock).mockImplementationOnce(async function* () {
      yield {
        type: "sources",
        sources: [
          {
            type: "TENANT",
            id: "v7_02_business_functions",
            name: "V7 Business functions",
            detail:
              "Loaded substrate: 442 business records and 118 retrieval chunks. Transcript governance is not_loaded.",
          },
        ],
      };
      yield {
        type: "intelligence-dossier",
        intelligenceDossier: {
          tenantEvidenceDossier: {
            sections: [{ id: "s1" }],
            confidence: "strong",
          },
          evidenceBoundary: { missingTenantEvidence: [{}] },
          decisionOptionsDossier: { options: [{ id: "o1" }] },
        },
      };
      yield {
        type: "advisory-packet",
        advisoryPacket: {
          auditLineage: { sourceRefs: [{ id: "v7_01" }] },
          modelVisiblePacket: { tenantFacts: [{ id: "f1" }], gaps: [{}] },
          retrievalDiagnostics: { warningCount: 0 },
        },
      };
      yield {
        type: "delta",
        text: "Transcript governance is not loaded in the V7 substrate.",
      };
      yield { type: "done" };
    });

    const response = await POST(
      makeRequest({
        q: "For Meridian agent assist, rank the top opportunities.",
        client: "meridian",
        traceEnabled: true,
      }) as never,
    );
    const text = await readResponseText(response);

    expect(text).toContain('"type":"context-summary"');
    expect(text).toContain(
      "Transcript governance is not loaded in the V7 substrate.",
    );
    expect(text).not.toMatch(
      /intelligence-dossier|advisory-packet|not_loaded|business records|retrieval chunks|v7_02/i,
    );
  });

  it("refuses a cross-tenant surface context before the model is invoked", async () => {
    // resolveTenant is the enforcement point: for a tenant-locked role it
    // discards a body-supplied tenant and resolves from session identity. The
    // default mock stands in for that outcome. The route must not reinstate the
    // rejected value from surfaceContext, so a request body cannot widen the
    // active tenant set. Asserted at the invariant rather than at one guard's
    // wording, because more than one layer can legitimately catch this.
    const callsBefore = (askIntelligence as jest.Mock).mock.calls.length;

    const response = await POST(
      makeRequest({
        q: "Show me SkyHarbor context.",
        surfaceContext: {
          clientKey: "skyharbor",
          activeClient: "SkyHarbor Air",
        },
        richText: true,
        answerOnlyStreaming: true,
      }) as never,
    );
    const text = await readResponseText(response);

    expect(text).toMatch(/tenant_fence|cross_tenant/);
    expect((askIntelligence as jest.Mock).mock.calls.length).toBe(callsBefore);
  });

  it("still answers normally when the surface context matches the resolved tenant", async () => {
    // Negative control: the refusal must not become unconditional.
    (askIntelligence as jest.Mock).mockImplementationOnce(async function* () {
      yield { type: "delta", text: "Vendor concentration is the live risk." };
      yield { type: "done" };
    });

    const response = await POST(
      makeRequest({
        q: "Where is vendor concentration risk highest for us?",
        surfaceContext: {
          clientKey: "apexretail",
          activeClient: "Apex Retail Group",
        },
        richText: true,
        answerOnlyStreaming: true,
      }) as never,
    );
    const text = await readResponseText(response);

    expect(text).toContain("Vendor concentration is the live risk.");
    expect(text).not.toMatch(/tenant_fence|cross_tenant/);
  });
});

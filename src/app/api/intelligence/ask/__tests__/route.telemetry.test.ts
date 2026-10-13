import { displaySafeIntelligenceDelta, POST } from "../route";
import { askIntelligence } from "@/lib/intelligence/ask";
import { recordSynthesisEvent } from "@/lib/reasoning/synthesis-telemetry";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { resolveIntelligenceHomeHandoff } from "@/lib/intelligence/home-context-handoff";
import { prepareAskSessionMemory } from "@/lib/intelligence/ask/session-memory";

jest.mock("@/lib/intelligence/home-context-handoff", () => ({
  resolveIntelligenceHomeHandoff: jest.fn(),
}));

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

jest.mock("@/lib/agent/sentinel-reasoning", () => ({
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

  it("does not render contract visuals from an unverified browser packet", async () => {
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
    expect(text).toContain("source_contract_unavailable");
    expect(text).not.toContain("Contract Commercial Opportunities");
    expect(text).not.toContain("Sized Commercial Opportunities");
    expect(text).not.toContain("Contract Evidence Relationship");
  });

  it("does not export optimization values from an unverified browser packet", async () => {
    (askIntelligence as jest.Mock).mockClear();

    const response = await POST(
      makeRequest({
        query:
          "For MER-TECH-DBX-001, act like a CXO pricing negotiator. Answer crisply as something I can export as a client sample PDF. Show the levers to optimize this contract in a table.",
        client: "apexretail",
        richText: true,
        answerOnlyStreaming: true,
        surfaceContext: {
          module: "Source",
          activeClient: "Apex Retail Group",
          clientKey: "apexretail",
          sourceContract360Mode: true,
          contractId: "MER-TECH-DBX-001",
          contractName:
            "Databricks Enterprise Agreement - Platform, Support and Committed Purchase",
          vendorName: "Databricks, Inc.",
          annualValue: 1_900_000,
          actualAnnualSpend: 66_000,
          endDate: "14 Oct 2030",
          sourceV4: {
            selectedContract: {
              contractId: "MER-TECH-DBX-001",
              vendorName: "Databricks, Inc.",
              contractName:
                "Databricks Enterprise Agreement - Platform, Support and Committed Purchase",
              annualValueUsd: 1_900_000,
              actualAnnualSpendUsd: 66_000,
              endDate: "14 Oct 2030",
              scopeSummary:
                "Databricks-on-AWS consumption commitment for governed analytics workloads.",
              scopeRowCount: 4,
            },
            optimizationOpportunities: {
              opportunities: [
                {
                  id: "dbx-retime",
                  contractId: "MER-TECH-DBX-001",
                  valueType: "negotiated_improvement",
                  label: "Re-time annual commitment to program delivery pace",
                  amount: "$620K",
                  amountUsd: 620_000,
                  stageRaw: "candidate",
                  stage: "candidate",
                  confidence: 0.82,
                  grade: "DOCUMENT EVIDENCED",
                  blockingGap:
                    "Finance confirmation and owner approval are still required.",
                  nextAction:
                    "Propose milestone-based ramp before the Year 2 commitment lock-in.",
                  owner: "VP Technology and Data",
                  buyerAsk:
                    "Reset the commitment curve around production gates.",
                  negotiationLanguage:
                    "Ask for a ramp that follows governed workload adoption.",
                  vendorConcession:
                    "Databricks preserves total contract value while shifting timing.",
                  timingDependency:
                    "Complete before the Year 2 commitment lock-in.",
                  priority: "P0",
                  riskIfIgnored:
                    "The current commitment pace locks before production usage catches up.",
                  sourceRefs: ["spend_monthly", "contract_clause"],
                },
                {
                  id: "dbx-discount-signal",
                  contractId: "MER-TECH-DBX-001",
                  valueType: "negotiated_improvement",
                  label: "Signal-stage discount band re-price review",
                  amount: "Not sized",
                  amountUsd: null,
                  stageRaw: "signal",
                  stage: "signal",
                  confidence: 0.3,
                  grade: "SIGNAL",
                  blockingGap:
                    "Benchmark comparable required before value can be treated as supported.",
                  nextAction:
                    "Load one accepted benchmark comparable before making this a primary ask.",
                  owner: "Strategic Sourcing",
                  buyerAsk:
                    "Keep discount repricing as a held-back signal until benchmark evidence is loaded.",
                  vendorConcession:
                    "Databricks can review the band after the buyer proves a comparable market term.",
                  timingDependency:
                    "Use only after benchmark evidence is loaded.",
                  priority: "P3",
                  riskIfIgnored:
                    "Opening rate too early can invite the vendor to reopen term length.",
                  sourceRefs: ["benchmark_gap_register"],
                },
              ],
            },
          },
        },
      }) as never,
    );

    const text = await readResponseText(response);
    const events = parseNdjson(text);
    const packetEvent = events.find((event) => event.type === "agent-answer");
    const packet = packetEvent?.answer as {
      directAnswer?: string;
      artifacts?: Array<{ id?: string; rows?: unknown[] }>;
    };

    expect(askIntelligence).not.toHaveBeenCalled();
    expect(packet?.directAnswer).toContain("cannot verify");
    expect(packet?.directAnswer).not.toContain("$620K");
    expect(packet?.directAnswer).not.toContain("VISUALS");
    expect(packet?.directAnswer).not.toContain("RELATIONSHIP MAP");
    expect(packet?.directAnswer).not.toContain("DECISION TABLE");
    expect(packet?.artifacts ?? []).toHaveLength(0);
    expect(events.some((event) => event.type === "done")).toBe(true);
  });

  it("does not cite an unavailable direct Contract 360 packet", async () => {
    (askIntelligence as jest.Mock).mockClear();

    const response = await POST(
      makeRequest({
        query:
          "What is the candidate opportunity value on this contract, and what evidence supports it?",
        client: "active-client",
        richText: true,
        answerOnlyStreaming: true,
        surfaceContext: {
          module: "Source",
          activeClient: "Active Client",
          clientKey: "apexretail",
          sourceContract360Mode: true,
          contractId: "MER-TECH-REQUESTED-001",
          contractName: null,
          vendorName: null,
          annualValue: null,
          actualAnnualSpend: null,
          endDate: "Not established",
          evidencePosture:
            "Requested contract was not returned by the active Source provider.",
          nextAction:
            "Select a contract present in the governed Source rows before making a contract-specific value or evidence claim.",
          contractDatasetSummary: "2 contracts / 8 scope rows.",
          contractCubeSummary: "3 action candidates / 6 aVa grounding bundles.",
          contractTopVendorSummary:
            "Primary Vendor is the largest loaded contract-directory vendor.",
        },
      }) as never,
    );
    const text = await readResponseText(response);

    expect(askIntelligence).not.toHaveBeenCalled();
    expect(text).toContain('"type":"agent-answer"');
    expect(text).toContain("source_contract_unavailable");
    expect(text).not.toContain(
      "Requested contract was not returned by the active Source provider",
    );
    expect(text).not.toContain("No specific contract is selected");
  });

  it("does not fall through to generic synthesis for an unverified contract packet", async () => {
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
    expect(text).toContain("source_contract_unavailable");
    expect(text).not.toContain("SLA credits earned but not claimed");
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

describe("model-authored executive response", () => {
  it("preserves authored prose and exhibits without automatic source exhibits", async () => {
    const raw =
      '**Validate first.**  [S1]\n\nKeep the next paragraph.\n\n```table\n{"id":"decision","title":"Decision","columns":[{"key":"option","label":"Option"},{"key":"action","label":"Action"}],"rows":[{"option":"Assist","action":"Validate"}],"citationIds":["S1"]}\n```';
    (askIntelligence as jest.Mock).mockImplementationOnce(async function* () {
      yield {
        type: "sources",
        sources: [
          {
            type: "TENANT",
            id: "fact-1",
            name: "Evidence",
            detail: "Relevant evidence.",
          },
        ],
      };
      yield { type: "delta", text: raw.slice(0, 50) };
      yield { type: "delta", text: raw.slice(50) };
      yield { type: "done" };
    });
    const response = await POST(
      makeRequest({
        query: "What should we do?",
        richText: true,
        answerOnlyStreaming: true,
        modelAuthoredOutput: true,
        surfaceContext: { activeTab: "intelligence" },
      }) as never,
    );
    const events = (await response.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(events.filter((e) => e.type === "delta")).toHaveLength(0);
    expect(events.filter((e) => e.type === "answer-progress").at(-1).text).toBe(
      "**Validate first.**  [S1]\n\nKeep the next paragraph.\n\n",
    );
    const packet = events.find((e) => e.type === "agent-answer")?.answer;
    expect(packet.modelAuthored.rawText).toBe(raw);
    expect(packet.prose).toBe(
      "**Validate first.**  [S1]\n\nKeep the next paragraph.\n\n",
    );
    expect(packet.artifacts).toHaveLength(1);
    expect(packet.citations.map((c: { id: string }) => c.id)).toEqual(["S1"]);
    expect(events.some((e) => e.type === "done")).toBe(true);
    expect(
      (askIntelligence as jest.Mock).mock.calls.at(-1)[1].modelAuthoredOutput,
    ).toBe(true);
  });

  it("delivers executive prose while generation is open and emits the intact packet at completion", async () => {
    let finishModel!: () => void;
    const waitForFinish = new Promise<void>((resolve) => {
      finishModel = resolve;
    });
    const opening = "**Validate discovery.**\n\n";
    const protocol =
      '```sources\n["S1"]\n```\n\n```followups\n["Which scope?","Which baseline?","Which decision?"]\n```';
    (askIntelligence as jest.Mock).mockImplementationOnce(async function* () {
      yield { type: "delta", text: opening };
      await waitForFinish;
      for (const text of protocol) yield { type: "delta", text };
      yield { type: "done" };
    });
    const response = await POST(
      makeRequest({
        query: "Which discovery should we charter?",
        richText: true,
        answerOnlyStreaming: true,
        modelAuthoredOutput: true,
        surfaceContext: { activeTab: "intelligence" },
      }) as never,
    );
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let received = "";
    try {
      while (!received.includes('"type":"answer-progress"')) {
        const part = await reader.read();
        expect(part.done).toBe(false);
        received += decoder.decode(part.value);
      }
      expect(
        parseNdjson(received).find((e) => e.type === "answer-progress")?.text,
      ).toBe(opening);
      expect(received).not.toContain('"type":"agent-answer"');
    } finally {
      finishModel();
    }
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      received += decoder.decode(part.value);
    }
    const events = parseNdjson(received);
    for (const event of events.filter((e) => e.type === "answer-progress"))
      expect(event.text).toBe(opening);
    const packet = events.find((e) => e.type === "agent-answer")?.answer as {
      modelAuthored: { rawText: string };
    };
    expect(packet.modelAuthored.rawText).toBe(opening + protocol);
    expect(events.some((e) => e.type === "done")).toBe(true);
  });
});

describe("version-bound Home continuation", () => {
  const homeContextRequest = {
    tenantKey: "apex-retail",
    recordToken: "a".repeat(64),
    chapterId: "technology_data",
  };
  const body = {
    q: "What should the CFO address first?",
    client: "apexretail",
    richText: true,
    answerOnlyStreaming: true,
    modelAuthoredOutput: true,
    surfaceContext: { activeTab: "intelligence", clientKey: "apexretail" },
    homeContextRequest,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects a malformed binding before retrieval or session work", async () => {
    const response = await POST(
      makeRequest({
        ...body,
        homeContextRequest: { ...homeContextRequest, recordToken: "invalid" },
      }) as never,
    );
    expect(response.status).toBe(400);
    expect(resolveIntelligenceHomeHandoff).not.toHaveBeenCalled();
    expect(prepareAskSessionMemory).not.toHaveBeenCalled();
    expect(askIntelligence).not.toHaveBeenCalled();
  });

  it.each([
    ["changed", 409],
    ["not_authorized", 403],
    ["unavailable", 403],
  ])("refuses %s before starting an answer", async (status, code) => {
    (resolveIntelligenceHomeHandoff as jest.Mock).mockResolvedValueOnce({
      state: { request: homeContextRequest, status },
    });
    const response = await POST(makeRequest(body) as never);
    expect(response.status).toBe(code);
    expect(resolveIntelligenceHomeHandoff).toHaveBeenCalledWith(
      homeContextRequest,
      "apex-retail",
    );
    expect(prepareAskSessionMemory).not.toHaveBeenCalled();
    expect(askIntelligence).not.toHaveBeenCalled();
  });

  it("passes only server-resolved evidence and excludes previous-version memory", async () => {
    const context = {
      tenantKey: homeContextRequest.tenantKey,
      recordToken: homeContextRequest.recordToken,
      sources: [
        { type: "TENANT", id: "selected-record", name: "Selected record" },
      ],
    };
    (resolveIntelligenceHomeHandoff as jest.Mock).mockResolvedValueOnce({
      state: { request: homeContextRequest, status: "ready" },
      context,
    });
    (prepareAskSessionMemory as jest.Mock).mockResolvedValueOnce({
      sessionId: "ask-session-1",
      tabId: "tab-1",
      priorTurnCount: 1,
      contextBlock: "Previous-version facts must not reach the model",
    });
    const response = await POST(
      makeRequest({
        ...body,
        surfaceContext: {
          ...body.surfaceContext,
          pageFacts: ["Untrusted browser assertion"],
        },
      }) as never,
    );
    expect(response.status).toBe(200);
    await readResponseText(response);
    expect(askIntelligence).toHaveBeenCalledWith(
      body.q,
      expect.objectContaining({
        homeRecordContext: context,
        conversationContextBlock: "",
        surfaceContext: {
          activeTab: "intelligence",
          clientKey: "apexretail",
          activeClient: "Apex Retail Group",
        },
      }),
    );
  });
});

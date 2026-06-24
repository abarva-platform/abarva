import { POST } from "../route";
import {
  classifySentinelIntent,
  runSentinelReasoning,
} from "@/lib/agents/sentinel-reasoning";
import { askIntelligence } from "@/lib/intelligence/ask";
import { recordSynthesisEvent } from "@/lib/reasoning/synthesis-telemetry";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import {
  brokerTenantKey,
  tenantAliasesFor,
  tenantIndustryCode,
} from "@/lib/tenant/aliases";

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

const tenantAskCases = [
  {
    client: "apexretail",
    canonicalKey: "apex-retail",
    displayName: "Apex Retail Group",
    query: "Which AI investments should Apex scale before holiday readiness?",
    expectedPrefix: "xp.retail.",
    disallowedPrefixes: [
      "xp.airline.",
      "xp.financial-services-banking.",
      "xp.healthcare-provider.",
    ],
  },
  {
    client: "skyharbor",
    canonicalKey: "skyharbor-air",
    displayName: "SkyHarbor Air",
    query:
      "What should SkyHarbor benchmark against for AI-assisted mainframe modernization?",
    expectedPrefix: "xp.airline.",
    disallowedPrefixes: [
      "xp.financial-services-banking.",
      "xp.healthcare-provider.",
      "xp.retail.",
    ],
  },
  {
    client: "meridian",
    canonicalKey: "meridian-health",
    displayName: "Meridian Health System",
    query:
      "What should Meridian do about Epic revenue cycle denials and workflow leakage?",
    expectedPrefix: "xp.healthcare-provider.",
    disallowedPrefixes: [
      "xp.airline.",
      "xp.financial-services-banking.",
      "xp.retail.",
    ],
  },
  {
    client: "arcturus",
    canonicalKey: "first-capital",
    displayName: "First Capital",
    query:
      "Which AI controls should First Capital prioritize for fraud and financial crime modernization?",
    expectedPrefix: "xp.financial-services-banking.",
    disallowedPrefixes: [
      "xp.airline.",
      "xp.healthcare-provider.",
      "xp.retail.",
    ],
  },
  {
    client: "lakeshore",
    canonicalKey: "lakeshore-holdings",
    displayName: "Lakeshore Holdings",
    query:
      "What supply chain resilience questions should Lakeshore prioritize across its portfolio?",
    expectedPrefix: "xp.x.",
    disallowedPrefixes: [
      "xp.airline.",
      "xp.financial-services-banking.",
      "xp.healthcare-provider.",
      "xp.retail.",
    ],
  },
] as const;

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

describe("POST /api/intelligence/ask telemetry", () => {
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

  it("emits AgentAnswer attribution without inferring exhibits for the aVa reasoning path", async () => {
    jest.mocked(classifySentinelIntent).mockResolvedValueOnce({
      intent: "it_productivity",
      confidence: 0.91,
      entities: ["Apex Retail Group"],
      matchedPatternSlugs: ["ai-productivity-value-gate"],
      citations: [],
      reason: "IT productivity question",
    });
    jest
      .mocked(runSentinelReasoning)
      .mockImplementationOnce(async function* () {
        yield {
          id: "clarify",
          name: "Clarify",
          sequence: 1,
          content:
            "Apex should stage a $590K productivity-AI portfolio and hold $120K until telemetry proves adoption.",
          citations: [
            {
              id: "PAT-AI-001",
              label: "AI productivity value gate",
              sourceType: "corpus_pattern",
              version: 1,
              detail:
                "Require telemetry before scaling AI productivity claims.",
            },
          ],
          confidence: 0.82,
          dataClass: "internal",
          clientId: "client-1",
          corpusVersionPinned: 1,
          templateVersionPinned: 1,
          traceId: "trace-1",
        };
      });

    const response = await POST(
      makeRequest({
        q: "Show Apex AI productivity spend as a table",
        client: "apexretail",
      }) as never,
    );
    const text = await readResponseText(response);
    const events = text
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const agentAnswer = events.find(
      (event) => event.type === "agent-answer",
    )?.answer;
    const tables = agentAnswer?.artifacts.filter(
      (artifact: { artifact?: string }) => artifact.artifact === "table",
    );

    expect(agentAnswer).toBeTruthy();
    expect(tables).toEqual([
      expect.objectContaining({
        id: "answer-evidence-required",
        title: "Evidence Required",
      }),
    ]);
    expect(tables?.[0].note).toContain(
      "not have enough connected data to populate tenant-specific rows without fabrication",
    );
    expect(tables?.[0].rows).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "$590K" }),
        expect.objectContaining({ value: "$120K" }),
      ]),
    );
    expect(
      agentAnswer.artifacts.filter(
        (artifact: { artifact?: string }) => artifact.artifact === "chart",
      ),
    ).toEqual([]);
    expect(agentAnswer.citations[0]).toEqual(
      expect.objectContaining({
        recordId: "PAT-AI-001",
        sourceClass: "corpus-pattern",
      }),
    );
    expect(text).toContain('"type":"done"');
  });

  it("uses tenant industry when routing AgentAnswer experts for Apex exhibits", async () => {
    jest.mocked(askIntelligence).mockImplementationOnce(async function* () {
      yield {
        type: "sources",
        sources: [
          {
            type: "TENANT",
            id: "APX-INIT-001",
            name: "Apex Retail AI investment substrate",
            detail:
              "Retail lakehouse and inventory graph has $95M committed and $12M realized for Apex Retail.",
          },
        ],
      };
      yield {
        type: "delta",
        text: "Apex should scale inventory truth first: the retail lakehouse and customer inventory graph has $95M committed and $12M realized.",
      };
      yield { type: "done" };
    });

    const response = await POST(
      makeRequest({
        q: "Which AI investments should Apex scale before holiday readiness?",
        client: "apexretail",
      }) as never,
    );
    const text = await readResponseText(response);
    const events = text
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const agentAnswer = events.find(
      (event) => event.type === "agent-answer",
    )?.answer;
    const expertIds = agentAnswer.expertsUsed.map(
      (expert: { id: string }) => expert.id,
    );

    expect(expertIds).toEqual(
      expect.arrayContaining([
        "xp.retail.merchandising-pricing",
        "xp.retail.store-operations",
      ]),
    );
    expect(expertIds).not.toContain(
      "xp.healthcare-provider.clinical-process-transformation",
    );
  });

  it("emits typed tables and charts instead of leaving inline table prose in the stream", async () => {
    jest.mocked(askIntelligence).mockImplementationOnce(async function* () {
      yield {
        type: "sources",
        sources: [
          {
            type: "TENANT",
            id: "APX-OMNI-001",
            name: "Apex omnichannel dependency ledger",
            detail:
              "Sterling, Toshiba, and Salesforce dependency rows with annual cost and integration counts.",
          },
        ],
      };
      yield {
        type: "delta",
        text: "Here is the visual cut. Omnichannel dependency risk — ranked | System | Annual cost | Integrations | Posture | Risk driver | |---|---|---|---|---| | IBM Sterling OMS | $22M/yr | 10 | Contain | Routing ship-from-store | | Toshiba POS | $23M/yr | 11 | Replace | Store-edge transition | | Salesforce Commerce | $12M/yr | 8 | Invest | Healthy posture | Next move: validate the risk owner.",
      };
      yield { type: "done" };
    });

    const response = await POST(
      makeRequest({
        q: "Show Apex omnichannel dependency risk as charts and tables",
        client: "apexretail",
      }) as never,
    );
    const text = await readResponseText(response);
    const events = text
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const agentAnswer = events.find(
      (event) => event.type === "agent-answer",
    )?.answer;

    expect(agentAnswer).toBeTruthy();
    expect(agentAnswer.directAnswer).not.toContain("| System |");
    const tables = agentAnswer.artifacts.filter(
      (artifact: { artifact?: string }) => artifact.artifact === "table",
    );
    expect(tables).toEqual([
      expect.objectContaining({
        id: "answer-inline-table-1",
        rows: [
          expect.objectContaining({
            system: "IBM Sterling OMS",
            annual_cost: "$22M/yr",
          }),
          expect.objectContaining({
            system: "Toshiba POS",
            annual_cost: "$23M/yr",
          }),
          expect.objectContaining({
            system: "Salesforce Commerce",
            annual_cost: "$12M/yr",
          }),
        ],
      }),
    ]);
    const charts = agentAnswer.artifacts.filter(
      (artifact: { artifact?: string }) => artifact.artifact === "chart",
    );
    expect(charts).toEqual([
      expect.objectContaining({
        kind: "cost-stack",
        title: "Annual cost by System",
      }),
    ]);
  });

  it("emits typed relationship graphs instead of dropping graph-shaped answers", async () => {
    jest.mocked(askIntelligence).mockImplementationOnce(async function* () {
      yield {
        type: "sources",
        sources: [
          {
            type: "TENANT",
            id: "APX-GRAPH-001",
            name: "Apex dependency ledger",
            detail:
              "Retail Lakehouse, POS, and forecasting platform dependency rows.",
          },
        ],
      };
      yield {
        type: "delta",
        text: "Dependency graph | From | Relationship | To | Evidence | |---|---|---|---| | Retail Lakehouse | feeds | Demand Forecasting | Inventory history | | Toshiba POS | sends transactions to | Retail Lakehouse | Store sales feed | Next move: validate the integration owner.",
      };
      yield { type: "done" };
    });

    const response = await POST(
      makeRequest({
        q: "Map the upstream and downstream dependencies as a graph",
        client: "apexretail",
      }) as never,
    );
    const text = await readResponseText(response);
    const events = text
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const agentAnswer = events.find(
      (event) => event.type === "agent-answer",
    )?.answer;
    const graphs = agentAnswer?.artifacts.filter(
      (artifact: { artifact?: string }) => artifact.artifact === "graph",
    );

    expect(agentAnswer).toBeTruthy();
    expect(graphs).toEqual([
      expect.objectContaining({
        id: "answer-relationship-graph-1",
        nodes: expect.arrayContaining([
          expect.objectContaining({ label: "Retail Lakehouse" }),
          expect.objectContaining({ label: "Demand Forecasting" }),
        ]),
        edges: expect.arrayContaining([
          expect.objectContaining({ label: "feeds" }),
        ]),
      }),
    ]);
  });

  it.each(tenantAskCases)(
    "routes streamed AgentAnswer expert chips for $displayName without vertical leakage",
    async ({
      client,
      canonicalKey,
      displayName,
      query,
      expectedPrefix,
      disallowedPrefixes,
    }) => {
      jest.mocked(resolveTenant).mockResolvedValueOnce({
        clientId: `client-${client}`,
        canonicalKey,
        appClientKey: client,
        brokerKey: brokerTenantKey(client) ?? canonicalKey,
        displayName,
        industryCode: tenantIndustryCode(client),
        aliases: tenantAliasesFor(client),
        source: "body",
      });
      jest.mocked(askIntelligence).mockImplementationOnce(async function* () {
        yield {
          type: "sources",
          sources: [
            {
              type: "TENANT",
              id: `${client}-context-1`,
              name: `${displayName} tenant context`,
              detail: "Loaded tenant context used for grounding.",
            },
          ],
        };
        yield {
          type: "delta",
          text: `${displayName} should sequence this decision from loaded context and industry guidance.`,
        };
        yield { type: "done" };
      });

      const response = await POST(makeRequest({ q: query, client }) as never);
      const text = await readResponseText(response);
      const events = text
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      const agentAnswer = events.find(
        (event) => event.type === "agent-answer",
      )?.answer;
      const expertIds = agentAnswer.expertsUsed.map(
        (expert: { id: string }) => expert.id,
      );

      expect(
        expertIds.some((id: string) => id.startsWith(expectedPrefix)),
      ).toBe(true);
      for (const prefix of disallowedPrefixes) {
        expect(expertIds.some((id: string) => id.startsWith(prefix))).toBe(
          false,
        );
      }
      expect(
        agentAnswer.artifacts.filter(
          (artifact: { artifact?: string }) => artifact.artifact === "chart",
        ),
      ).toEqual([]);
    },
  );

  it("lets the advisor route override visible expert chips for airline IROPS questions", async () => {
    jest.mocked(resolveTenant).mockResolvedValueOnce({
      clientId: "client-apexretail",
      canonicalKey: "apex-retail",
      appClientKey: "apexretail",
      brokerKey: brokerTenantKey("apexretail") ?? "apex-retail",
      displayName: "Apex Retail Group",
      industryCode: tenantIndustryCode("apexretail"),
      aliases: tenantAliasesFor("apexretail"),
      source: "body",
    });
    jest.mocked(askIntelligence).mockImplementationOnce(async function* () {
      yield {
        type: "sources",
        sources: [
          {
            type: "PATTERN",
            id: "airline-irops-pattern",
            name: "Airline IROPS recovery orchestration pattern",
            detail:
              "Airline AI value concentrates in disruption recovery, passenger reaccommodation, crew recovery, and operations-control workflows.",
          },
        ],
      };
      yield {
        type: "delta",
        text: "Airlines are moving IROPS AI from alerting toward recovery orchestration. Airline IROPS examples | Airline | Use case | Source type | Confidence | |---|---|---|---| | Delta | Reaccommodation | Corpus pattern | Medium |",
      };
      yield { type: "done" };
    });

    const response = await POST(
      makeRequest({
        q: "What are airlines doing with IROPS? Give me trends and ROI if such AI investments. Charts or tables will be nice.",
        client: "apexretail",
      }) as never,
    );
    const text = await readResponseText(response);
    const events = text
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const agentAnswer = events.find(
      (event) => event.type === "agent-answer",
    )?.answer;
    const expertIds = agentAnswer.expertsUsed.map(
      (expert: { id: string }) => expert.id,
    );

    expect(expertIds).toEqual([
      "xp.airline.operations-revenue-management",
      "xp.airline.ground-airport-operations",
      "xp.airline.network-schedule-planning",
    ]);
    expect(expertIds.some((id: string) => id.startsWith("xp.retail."))).toBe(
      false,
    );
    expect(agentAnswer.corpusUsed).toEqual([
      expect.objectContaining({ id: "corpus-support" }),
    ]);
    expect(agentAnswer.citations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recordId: "airline-irops-recovery-orchestration-pattern",
          sourceClass: "corpus-pattern",
        }),
        expect.objectContaining({
          recordId: "airline-irops-ai-roi-planning-ranges",
          sourceClass: "worldview",
        }),
      ]),
    );
  });

  it.each([
    {
      name: "finance",
      prompt: "Show IT budget by portfolio as a table",
      source: "IT budget and run cost ledger",
      columns: "Portfolio | Annual spend | Owner | Caveat",
      row1: "Operations | $22M | CIO office | run/change split missing",
      row2: "Data platforms | $18M | CDAO | realized value missing",
    },
    {
      name: "vendors",
      prompt: "Compare our top vendors by spend and risk",
      source: "Vendor and contract landscape",
      columns: "Vendor | Annual spend | Supported system | Risk",
      row1: "IBM | $23M | Core operations | integration concentration",
      row2: "Salesforce | $12M | Customer engagement | adoption dependency",
    },
    {
      name: "applications",
      prompt: "List core applications with owning capability",
      source: "Applications and core systems inventory",
      columns: "Application | Capability | Owner | Status",
      row1: "Crew Ops | Flight operations | Operations technology | contain",
      row2: "Customer 360 | Customer experience | Data office | invest",
    },
    {
      name: "integrations",
      prompt: "Map integration dependencies as a graph",
      source: "Integration and interface dependency ledger",
      columns: "From | Relationship | To | Evidence",
      row1: "PSS | feeds | Customer 360 | passenger event stream",
      row2: "Crew Ops | constrains | IROPS recovery | crew legality",
    },
    {
      name: "data",
      prompt: "Show our data products by domain and maturity",
      source: "Data product registry",
      columns: "Data product | Domain | Maturity | Gap",
      row1: "Customer 360 | Customer | Silver | identity resolution",
      row2: "Ops events | Operations | Bronze | freshness controls",
    },
    {
      name: "workforce",
      prompt: "Table workforce AI opportunities by function",
      source: "Workforce and personas substrate",
      columns: "Function | AI opportunity | Expected range | Caveat",
      row1: "Contact center | assist and deflect | 5% | quality baseline",
      row2: "Field service | schedule optimization | 7% | adoption proof",
    },
    {
      name: "risk",
      prompt: "Show AI governance risks and controls",
      source: "Risk and control register",
      columns: "Risk | Control | Owner | Severity",
      row1: "Model drift | monitoring policy | AI governance | high",
      row2: "Data lineage | source certification | Data office | medium",
    },
    {
      name: "initiatives",
      prompt: "Compare top initiatives by impact and owner",
      source: "Initiatives roadmap",
      columns: "Initiative | Impact | Owner | Next gate",
      row1: "Lakehouse modernization | $95M | CDAO | data quality",
      row2: "IROPS recovery | $30M | COO | integration readiness",
    },
    {
      name: "benefits",
      prompt: "Show benefits realization by value lever",
      source: "Benefits realization ledger",
      columns: "Value lever | Annual value | Evidence | Caveat",
      row1: "Inventory accuracy | $12M | realized run-rate | seasonality",
      row2: "Contact deflection | $8M | benchmark support | tenant proof missing",
    },
    {
      name: "operations",
      prompt: "Show operational bottlenecks by process",
      source: "Operations and service evidence",
      columns: "Process | Bottleneck | Impact | Required evidence",
      row1: "IROPS recovery | write-back latency | disruption recovery | event stream",
      row2: "Store fulfillment | inventory accuracy | lost sales | item-location truth",
    },
    {
      name: "architecture",
      prompt: "Table architecture constraints and business impact",
      source: "Enterprise architecture substrate",
      columns: "Constraint | Business impact | Dependency | Status",
      row1: "Mainframe APIs | slows recovery orchestration | IBM Z | contain",
      row2: "Identity graph | limits personalization | CDP | build",
    },
    {
      name: "customer",
      prompt: "Show customer experience AI opportunities",
      source: "Customer and channel substrate",
      columns: "Journey | AI use case | Value range | Caveat",
      row1: "Disruption support | proactive reaccommodation | 6% | service baseline",
      row2: "Digital self-service | next-best action | 4% | adoption measurement",
    },
  ])(
    "renders clean structured artifacts across the $name function path",
    async ({ prompt, source, columns, row1, row2 }) => {
      jest.mocked(askIntelligence).mockImplementationOnce(async function* () {
        yield {
          type: "sources",
          sources: [
            {
              type: "TENANT",
              id: `${source.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-1`,
              name: source,
              detail: "Loaded tenant evidence for the requested function.",
            },
          ],
        };
        yield {
          type: "delta",
          text: `Here is the evidence view. Function answer table | ${columns} | |---|---|---|---| | ${row1} | | ${row2} | Next move: validate the cited owner and gap before action.`,
        };
        yield { type: "done" };
      });

      const response = await POST(
        makeRequest({ q: prompt, client: "skyharbor" }) as never,
      );
      const text = await readResponseText(response);
      const events = text
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      const agentAnswer = events.find(
        (event) => event.type === "agent-answer",
      )?.answer;

      expect(agentAnswer).toBeTruthy();
      expect(agentAnswer.directAnswer).not.toContain("|---|");
      expect(agentAnswer.directAnswer).not.toMatch(/(?:[A-Z]\.\s*){2,}/);
      expect(agentAnswer.citations.length).toBeGreaterThan(0);
      expect(
        agentAnswer.artifacts.some(
          (artifact: { artifact?: string }) => artifact.artifact === "table",
        ),
      ).toBe(true);
    },
  );
});

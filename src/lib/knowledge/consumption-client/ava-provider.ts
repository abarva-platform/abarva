/**
 * aVa reasoning providers. Three implementations of AvaReasoningProvider:
 *
 *  - NullAvaReasoningProvider: isAvailable()===false. Used when models are
 *    disabled. The deterministic page must render fully without aVa.
 *
 *  - DeterministicAvaReasoningProvider: a fixture-only, NON-model stand-in that
 *    composes a structured answer strictly from the packet's evidence refs and
 *    refuses when required evidence is absent. It never manufactures a number,
 *    never alters displayed facts, and its output is ephemeral (promoted:false).
 *    This lets us exercise the aVa contract in fixtures without any real LLM.
 *
 *  - AnthropicAvaReasoningProvider: the real Claude-backed path for the
 *    FIXTURE runtime (createFixtureRuntime's opt-in `aiProvider: "real"`
 *    mode). It lets Claude actually reason over the in-scope evidence content
 *    -- not just compose a templated shell -- while enforcing the exact same
 *    grounding discipline as the deterministic provider: refuse when the
 *    packet carries no evidence, and never trust a citation that isn't in the
 *    packet's own evidenceRefs.
 *
 *    IMPORTANT: this class is a THIN client -- it does not import
 *    @anthropic-ai/sdk or call the model itself. It POSTs to
 *    /api/knowledge/fixture-ava and shapes the JSON response. The real
 *    grounding + model call lives server-side in
 *    src/lib/knowledge/consumption-server/fixture-ava.ts (`import
 *    "server-only"`), reached only through that route.
 *
 *    WHY: src/lib/knowledge/consumption-client/context.tsx is a "use client"
 *    module (the fixture preview mounts ConsumptionRuntimeProvider directly
 *    in the browser, no server hop). Because of that, this WHOLE file
 *    (ava-provider.ts) is part of the Next.js CLIENT bundle graph, whether or
 *    not any given code path actually executes in the browser. An earlier
 *    version of this class called @anthropic-ai/sdk directly behind a lazy
 *    `import()`, which type-checked, passed every jsdom Jest test, and even
 *    worked from a plain Node script -- but broke `next build` outright:
 *    Turbopack still statically discovers `import()` calls while building the
 *    client chunk graph, and @anthropic-ai/sdk's agent-toolset code imports
 *    `node:fs/promises` (a Node-only built-in), which a browser chunk cannot
 *    contain ("the chunking context (unknown) does not support external
 *    modules"). None of tsc/eslint/jsdom-Jest can catch that class of bug --
 *    only an actual `next build` can. Routing the real call through a Route
 *    Handler is the same pattern this codebase already uses for the
 *    real-tenant path (consumption-server/ava-egress-provider.ts, reached via
 *    /api/knowledge/ava) for exactly this reason.
 */

import type {
  AvaAnswer,
  AvaKnowledgePacket,
  AvaReasoningProvider,
  AvaRequest,
} from "../consumption-contracts";
import type { AvaArtifact } from "@/lib/ava-answer/contract";
import type { FixtureScenario } from "../fixtures";

/**
 * A minimal, in-scope view of governed objects the deterministic provider may
 * reason over to build evidence-bound exhibits. It is the fixture analog of the
 * governed baseline: the provider only ever uses entities whose refs appear in the
 * packet's accepted-fact scope, so it never reaches beyond the permission boundary.
 */
export interface AvaReasoningEntity {
  entityRef: string;
  displayName: string;
  entityType: string;
  domainKey: string;
  availabilityState: string;
  evidenceRefs: string[];
}
export interface AvaReasoningCorpus {
  entities: AvaReasoningEntity[];
}

export class NullAvaReasoningProvider implements AvaReasoningProvider {
  isAvailable(): boolean {
    return false;
  }
  async ask(): Promise<AvaAnswer> {
    return {
      outcome: "refused",
      sections: [],
      evidenceRefs: [],
      limitations: ["aVa reasoning is disabled in this environment."],
      whatWouldChangeIt: ["Enable a model provider to use aVa."],
      refusalReason: "Model provider disabled.",
      promoted: false,
    };
  }
}

export class DeterministicAvaReasoningProvider implements AvaReasoningProvider {
  private readonly corpus: AvaReasoningCorpus | null;

  constructor(corpus: AvaReasoningCorpus | null = null) {
    this.corpus = corpus;
  }

  isAvailable(): boolean {
    return true;
  }

  async ask(request: AvaRequest): Promise<AvaAnswer> {
    const { packet, intent, question } = request;

    // Refuse rather than estimate when the scope carries no usable evidence.
    if (
      packet.evidenceRefs.length === 0 &&
      packet.acceptedFactRefs.length === 0
    ) {
      return {
        outcome: "refused",
        sections: [],
        evidenceRefs: [],
        limitations: [
          "No accepted evidence is in scope for the current lens, filters and permission boundary.",
        ],
        whatWouldChangeIt: [
          "Load or accept evidence for this scope, or widen the selection to entities that carry evidence.",
        ],
        refusalReason:
          "Required evidence is unavailable for the current scope; aVa does not estimate.",
        promoted: false,
      };
    }

    const usedEvidence = packet.evidenceRefs.slice(0, 4);
    const gapNote =
      packet.knownGapRefs.length > 0
        ? `${packet.knownGapRefs.length} known gap(s) constrain this answer.`
        : "No known gaps constrain this answer.";

    // Stable answer structure (per prototype): what we can say, on what basis, limits.
    const sections = [
      {
        heading: intentHeading(intent),
        body:
          `Within the current ${packet.mode} view (lens: ${packet.lens}, depth: ${packet.depth})` +
          ` for the active baseline ${packet.knowledgeBaselineRef}, here is what the accepted` +
          ` Knowledge supports in response to: "${question}".`,
        evidenceRefs: usedEvidence,
      },
      {
        heading: "Basis",
        body:
          `This is grounded in ${usedEvidence.length} evidence reference(s) and` +
          ` ${packet.acceptedFactRefs.length} accepted fact(s). aVa cannot alter these facts` +
          ` or supply values the sources do not contain.`,
        evidenceRefs: usedEvidence,
      },
    ];

    return {
      outcome: packet.knownGapRefs.length > 0 ? "partial" : "answered",
      sections,
      evidenceRefs: usedEvidence,
      artifacts: this.corpus
        ? buildEvidenceBoundArtifacts(
            this.corpus.entities,
            packet.acceptedFactRefs,
          )
        : [],
      limitations: [
        gapNote,
        "aVa's answer is ephemeral and is not accepted Knowledge unless separately promoted.",
      ],
      whatWouldChangeIt: [
        "Closing the known gaps in scope.",
        "Loading additional accepted evidence for the selected entities.",
      ],
      refusalReason: null,
      promoted: false,
    };
  }
}

function intentHeading(intent: AvaRequest["intent"]): string {
  switch (intent) {
    case "explain":
      return "Explanation";
    case "investigate":
      return "Investigation";
    case "compare":
      return "Comparison";
    case "act":
      return "Suggested action (preview only)";
  }
}

/**
 * Build evidence-bound exhibits from the governed objects that are BOTH in the
 * corpus AND in the packet's accepted-fact scope. Purely structural -- it never
 * invents a value, only tabulates and counts what is already accepted. Returns
 * an empty list when there is not enough in-scope structure to exhibit.
 *
 * Extracted to a standalone function so both DeterministicAvaReasoningProvider
 * and AnthropicAvaReasoningProvider produce identical, non-model exhibits --
 * the model never touches table/chart construction, only prose. Pure/no I/O,
 * safe to call from client-bundled code.
 */
export function buildEvidenceBoundArtifacts(
  entities: AvaReasoningEntity[],
  acceptedFactRefs: string[],
): AvaArtifact[] {
  const scope = new Set(acceptedFactRefs);
  const inScope = entities.filter((e) => scope.has(e.entityRef));
  if (inScope.length < 3) return [];

  const artifacts: AvaArtifact[] = [];

  artifacts.push({
    artifact: "table",
    id: "kv-ava-objects-in-view",
    title: "Governed objects in view",
    columns: [
      { key: "name", label: "Object" },
      { key: "type", label: "Type" },
      { key: "domain", label: "Domain" },
      { key: "status", label: "Status" },
    ],
    rows: inScope.slice(0, 12).map((e) => ({
      name: e.displayName,
      type: e.entityType,
      domain: e.domainKey,
      status: e.availabilityState.replace(/_/g, " "),
    })),
    note: `${inScope.length} object(s) in the current scope; showing up to 12.`,
  });

  const byDomain = new Map<string, number>();
  for (const e of inScope)
    byDomain.set(e.domainKey, (byDomain.get(e.domainKey) ?? 0) + 1);
  const data = Array.from(byDomain, ([domain, count]) => ({
    domain,
    count,
  })).sort((a, b) => b.count - a.count);
  if (data.length >= 2) {
    artifacts.push({
      artifact: "chart",
      id: "kv-ava-objects-by-domain",
      kind: "horizontal-bar",
      title: "Objects in view by domain",
      data,
      xKey: "domain",
      yKey: "count",
      unit: "count",
      sourceNote: "Count of governed objects represented in the current scope.",
    });
  }
  return artifacts;
}

// ---------------------------------------------------------------------------
// AnthropicAvaReasoningProvider -- thin client for /api/knowledge/fixture-ava.
// See the module header for why the real Claude call is NOT in this file.
// ---------------------------------------------------------------------------

function refusalAnswer(reason: string, limitations: string[]): AvaAnswer {
  return {
    outcome: "refused",
    sections: [],
    evidenceRefs: [],
    limitations,
    whatWouldChangeIt: [
      "Load or accept evidence for this scope, or widen the selection to entities that carry evidence.",
    ],
    refusalReason: reason,
    promoted: false,
  };
}

const FIXTURE_AVA_ENDPOINT = "/api/knowledge/fixture-ava";

export interface AnthropicAvaReasoningProviderOptions {
  /** Also used to build the same deterministic exhibits DeterministicAvaReasoningProvider produces. */
  entitiesForArtifacts?: AvaReasoningEntity[];
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

export type FixtureAvaInterpretationDraft =
  | {
      drafted: true;
      headline: string;
      body: string;
      evidenceRefs: string[];
      pinnedBaselineRef: string;
    }
  | { drafted: false; refusalReason: string };

export class AnthropicAvaReasoningProvider implements AvaReasoningProvider {
  private readonly tenantKey: string;
  private readonly scenario: FixtureScenario;
  private readonly entitiesForArtifacts: AvaReasoningEntity[];
  private readonly fetchImpl: typeof fetch;

  constructor(
    tenantKey: string,
    scenario: FixtureScenario,
    opts: AnthropicAvaReasoningProviderOptions = {},
  ) {
    this.tenantKey = tenantKey;
    this.scenario = scenario;
    this.entitiesForArtifacts = opts.entitiesForArtifacts ?? [];
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  /**
   * Optimistic: true whenever this mode was selected. Real availability
   * (ANTHROPIC_API_KEY presence) is only knowable server-side and is
   * resolved per-request by /api/knowledge/fixture-ava; an unavailable
   * server surfaces as a clean refusal from ask(), not a hidden dock.
   */
  isAvailable(): boolean {
    return true;
  }

  async ask(request: AvaRequest): Promise<AvaAnswer> {
    const { packet } = request;
    // Cheap client-side pre-check -- avoids a wasted round trip for the most
    // common refusal case, mirrors DeterministicAvaReasoningProvider exactly.
    if (
      packet.evidenceRefs.length === 0 &&
      packet.acceptedFactRefs.length === 0
    ) {
      return refusalAnswer(
        "Required evidence is unavailable for the current scope; aVa does not estimate.",
        [
          "No accepted evidence is in scope for the current lens, filters and permission boundary.",
        ],
      );
    }

    try {
      const res = await this.fetchImpl(FIXTURE_AVA_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ask",
          tenantKey: this.tenantKey,
          intent: request.intent,
          question: request.question,
          packet,
        }),
      });
      if (!res.ok) {
        return refusalAnswer(`aVa request failed (HTTP ${res.status}).`, [
          "The fixture-ava endpoint returned an error status.",
        ]);
      }
      const answer = (await res.json()) as AvaAnswer;
      if (answer.outcome === "refused") return answer;
      return {
        ...answer,
        artifacts:
          answer.artifacts ??
          buildEvidenceBoundArtifacts(
            this.entitiesForArtifacts,
            packet.acceptedFactRefs,
          ),
      };
    } catch (error) {
      return refusalAnswer(
        `aVa reasoning failed before a valid response was available: ${safeErrorText(error)}`,
        ["The request to the fixture-ava endpoint failed or timed out."],
      );
    }
  }

  /**
   * Draft an AbarVaInterpretationV1-shaped narrative (headline + body) from
   * the evidence in scope. NOT part of the AvaReasoningProvider interface --
   * an additional, explicitly opt-in capability for exercising real
   * generation of the Brief-mode "abarva_interpretation" content type.
   * Deliberately NOT wired into KnowledgeUiViewModelAssembler's
   * getStrategicContext/getAbarVaView -- see
   * consumption-server/fixture-ava.ts's runFixtureAvaDraftInterpretation for
   * the full reasoning (the deterministic page must keep rendering the
   * already-governed interpretation with every model provider disabled).
   */
  async draftInterpretation(request: {
    packet: AvaKnowledgePacket;
  }): Promise<FixtureAvaInterpretationDraft> {
    try {
      const res = await this.fetchImpl(FIXTURE_AVA_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "draftInterpretation",
          tenantKey: this.tenantKey,
          packet: request.packet,
        }),
      });
      if (!res.ok) {
        return {
          drafted: false,
          refusalReason: `aVa request failed (HTTP ${res.status}).`,
        };
      }
      return (await res.json()) as FixtureAvaInterpretationDraft;
    } catch (error) {
      return {
        drafted: false,
        refusalReason: `Model call failed: ${safeErrorText(error)}`,
      };
    }
  }

  /**
   * Attempt to draft an industry_benchmark / industry_pattern statement. In
   * practice this refuses every time against the fixture corpus -- see
   * consumption-server/fixture-ava.ts's runFixtureAvaDraftIndustryContext for
   * why (no real external peer dataset behind the fixture's one governed
   * benchmark data point).
   */
  async draftIndustryContext(request: {
    packet: AvaKnowledgePacket;
    question: string;
  }): Promise<{ drafted: false; refusalReason: string }> {
    try {
      const res = await this.fetchImpl(FIXTURE_AVA_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "draftIndustryContext",
          tenantKey: this.tenantKey,
          packet: request.packet,
        }),
      });
      if (!res.ok) {
        return {
          drafted: false,
          refusalReason: `aVa request failed (HTTP ${res.status}).`,
        };
      }
      return (await res.json()) as { drafted: false; refusalReason: string };
    } catch (error) {
      return {
        drafted: false,
        refusalReason: `Request failed: ${safeErrorText(error)}`,
      };
    }
  }
}

function safeErrorText(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "unknown_error";
  return message.slice(0, 400);
}

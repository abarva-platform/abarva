// The Moves aVa grounding block never said what KIND of Move it was grounding.
// Every registry archetype declares `agentGuidance.systemFraming` + the
// `keyQuestions` it exists to answer, and nothing in the product read that
// field, so a Move with a DECLARED archetype still reached Claude with no
// subject framing.
//
// Two properties are load-bearing here and are asserted in both directions:
//
//  1. Identity is declared, never inferred. An undeclared Move gets NO framing.
//     There is no default, because the default archetype is the AI
//     product-development lifecycle, whose framing points the model at
//     engineering delivery and SDLC evidence — a wrong answer, not a neutral
//     one, for a Move that is something else.
//  2. The framing is TEXT ONLY. It must never reach a gate tally, an
//     allowed/disallowed action, missingInputs, caveats, or any deterministic
//     answer.

import { readFileSync } from "node:fs";
import path from "node:path";

import { resolveMovesAvaArchetypeFraming } from "@/lib/programs/ava-chat/archetype-framing";
import { buildMovesAvaChatPacket } from "@/lib/programs/ava-chat/packet";
import { formatMovesAvaChatPacketForPrompt } from "@/lib/programs/ava-chat/system-prompt";
import { buildDeterministicMovesAvaStatusAnswer } from "@/lib/programs/ava-chat/deterministic-answer";
import { getArchetype } from "@/lib/programs/archetypes/registry";

const BASE_INPUT = {
  tenant: "demo-tenant",
  moveId: "6c0f1b9f-5f4d-4a2a-9f1e-2b7c3d4e5f60",
  moveTitle: "Certify the governed data foundation",
  currentPhase: 2,
  currentPhaseClientLabel: "P2 Discover & Diagnose",
};

/** The declaration the archetype-declaration job writes. */
const declaredCharter = (archetype: string) => ({
  classification: { archetype },
});

describe("resolveMovesAvaArchetypeFraming — a declared archetype frames the chat", () => {
  it("resolves the charter-declared archetype to its own registry framing", () => {
    const framing = resolveMovesAvaArchetypeFraming({
      charter: declaredCharter("governed_data_foundation"),
    });
    expect(framing?.archetypeId).toBe("GOVERNED_DATA_FOUNDATION");
    expect(framing?.archetypeName).toBe("Governed Data Foundation");
    // Written out rather than read off the registry: an expectation derived
    // from the subject under test cannot see the subject being reworded.
    expect(framing?.systemFraming).toMatch(
      /Do not require DORA, CI\/CD, or engineering SDLC evidence for P2 strategy discovery/,
    );
    expect(framing?.systemFraming).toMatch(/certifies a data foundation/);
    expect(framing?.keyQuestions.length).toBeGreaterThan(0);
  });

  it("resolves the same framing through the functionPackKey channel", () => {
    const framing = resolveMovesAvaArchetypeFraming({
      functionPackKey: "governed_data_foundation",
    });
    expect(framing?.archetypeId).toBe("GOVERNED_DATA_FOUNDATION");
  });

  it("resolves an exact registry id without needing a blueprint alias", () => {
    const framing = resolveMovesAvaArchetypeFraming({
      charter: declaredCharter("IT_SOURCING_EVENT"),
    });
    expect(framing?.archetypeId).toBe("IT_SOURCING_EVENT");
  });

  it("returns a copy of keyQuestions, so a caller cannot mutate the registry", () => {
    const framing = resolveMovesAvaArchetypeFraming({
      charter: declaredCharter("governed_data_foundation"),
    });
    const before = getArchetype("GOVERNED_DATA_FOUNDATION")!.agentGuidance
      .keyQuestions.length;
    framing!.keyQuestions.push("injected");
    expect(
      getArchetype("GOVERNED_DATA_FOUNDATION")!.agentGuidance.keyQuestions
        .length,
    ).toBe(before);
  });
});

describe("resolveMovesAvaArchetypeFraming — an undeclared Move is framed by nothing", () => {
  it.each([
    ["a null program", null],
    ["an undefined program", undefined],
    ["a program with no declaration channel set", {}],
    ["an unknown declared id", { charter: declaredCharter("not_an_archetype") }],
    ["a blank declared id", { functionPackKey: "   " }],
  ])("returns null for %s", (_label, program) => {
    expect(
      resolveMovesAvaArchetypeFraming(
        program as Parameters<typeof resolveMovesAvaArchetypeFraming>[0],
      ),
    ).toBeNull();
  });

  // `engagements.program_archetype` is an ArchetypeKey — one of five coarse
  // values, none of which is a registry archetype id. It cannot carry a
  // declaration today, and must not be allowed to resolve the DEFAULT one.
  it.each([
    "strategic_transformation",
    "workflow_automation",
    "platform_modernization",
    "ai_product_enablement",
    "operational_optimization",
  ])("returns null for the coarse program_archetype value %s", (archetype) => {
    expect(resolveMovesAvaArchetypeFraming({ archetype })).toBeNull();
  });

  it("never substitutes the default archetype's engineering-delivery framing", () => {
    const fallbackProne = resolveMovesAvaArchetypeFraming({
      archetype: "workflow_automation",
      charter: { classification: "something the catalog does not know" },
    });
    expect(fallbackProne).toBeNull();
    // The framing that must not leak in: the default archetype's.
    expect(
      getArchetype("AI_PRODUCT_DEVELOPMENT_LIFECYCLE")!.agentGuidance
        .systemFraming,
    ).toMatch(/engineering delivery/);
  });
});

describe("formatMovesAvaChatPacketForPrompt — the framing reaches the prompt", () => {
  const framed = () =>
    buildMovesAvaChatPacket(
      {
        ...BASE_INPUT,
        archetypeFraming: resolveMovesAvaArchetypeFraming({
          charter: declaredCharter("governed_data_foundation"),
        }),
      },
      "What evidence is still missing?",
    );
  const unframed = () =>
    buildMovesAvaChatPacket(BASE_INPUT, "What evidence is still missing?");

  it("names the declared archetype, its framing, and its key questions", () => {
    const block = formatMovesAvaChatPacketForPrompt(framed(), "evidence_gap");
    expect(block).toMatch(
      /Declared archetype: Governed Data Foundation \(GOVERNED_DATA_FOUNDATION\)/,
    );
    expect(block).toMatch(/Archetype framing: /);
    expect(block).toMatch(
      /Do not require DORA, CI\/CD, or engineering SDLC evidence/,
    );
    expect(block).toMatch(/Archetype key questions: /);
  });

  it("emits no archetype line at all for an undeclared Move", () => {
    const block = formatMovesAvaChatPacketForPrompt(unframed(), "evidence_gap");
    expect(block).not.toMatch(/Declared archetype/);
    expect(block).not.toMatch(/Archetype framing/);
    expect(block).not.toMatch(/Archetype key questions/);
    expect(block).not.toMatch(/engineering delivery/);
  });

  it("adds only the archetype lines — every other prompt line is unchanged", () => {
    const framedLines = formatMovesAvaChatPacketForPrompt(
      framed(),
      "evidence_gap",
    ).split("\n");
    const unframedLines = formatMovesAvaChatPacketForPrompt(
      unframed(),
      "evidence_gap",
    ).split("\n");
    const added = framedLines.filter((line) => !unframedLines.includes(line));
    const removed = unframedLines.filter((line) => !framedLines.includes(line));
    expect(removed).toEqual([]);
    expect(added).toHaveLength(3);
    expect(added.every((line) => /^(Declared archetype|Archetype )/.test(line))).toBe(
      true,
    );
  });
});

describe("the framing is text only — it moves no deterministic value", () => {
  const withChecklist = (archetypeFraming: ReturnType<
    typeof resolveMovesAvaArchetypeFraming
  >) =>
    buildMovesAvaChatPacket(
      {
        ...BASE_INPUT,
        archetypeFraming,
        checklistStatus: {
          evidenceDone: false,
          evidenceLabel: "3 evidence items visible",
          gateDone: false,
          gateLabel: "2 hard gates open",
          canAdvance: false,
          nextPhaseLabel: "P3 Design",
        },
        gateCriteria: [
          { label: "Current-state baseline approved", met: true, severity: "hard" as const },
          { label: "Data ownership confirmed", met: false, severity: "hard" as const },
        ],
      },
      "Can I advance?",
    );

  const declared = resolveMovesAvaArchetypeFraming({
    charter: declaredCharter("governed_data_foundation"),
  });

  it("changes no packet field other than archetypeFraming", () => {
    const framedPacket = withChecklist(declared);
    const plainPacket = withChecklist(null);
    expect(framedPacket.archetypeFraming).not.toBeNull();
    expect(plainPacket.archetypeFraming).toBeNull();
    expect({ ...framedPacket, archetypeFraming: null }).toEqual(plainPacket);
  });

  it("does not add a missing input or a caveat for an undeclared Move", () => {
    const plainPacket = withChecklist(null);
    expect(plainPacket.missingInputs.join(" ")).not.toMatch(/archetype/i);
    expect(plainPacket.caveats.join(" ")).not.toMatch(/archetype/i);
  });

  it("returns an identical deterministic answer with and without framing", () => {
    expect(
      buildDeterministicMovesAvaStatusAnswer(
        withChecklist(declared),
        "gate_blocker",
      ),
    ).toEqual(
      buildDeterministicMovesAvaStatusAnswer(
        withChecklist(null),
        "gate_blocker",
      ),
    );
  });
});

// A pure-function suite never pins the host. The Moves chat route is the only
// product caller that resolves the framing and hands it to the packet; deleting
// either line would leave every test above green while the prompt silently
// loses the archetype again.
describe("the Moves chat route wires the framing in", () => {
  const routeSource = readFileSync(
    path.join(process.cwd(), "src/app/api/chat/agent/route.ts"),
    "utf8",
  );

  it("imports and calls the declared-archetype framing resolver", () => {
    expect(routeSource).toContain(
      'from "@/lib/programs/ava-chat/archetype-framing"',
    );
    expect(routeSource).toMatch(/resolveMovesAvaArchetypeFraming\(\{/);
  });

  it("resolves it from the Move's declaration channels, not from its wording", () => {
    const call =
      /resolveMovesAvaArchetypeFraming\(\{([\s\S]*?)\}\);/.exec(routeSource)?.[1] ??
      "";
    expect(call).toMatch(/functionPackKey:/);
    expect(call).toMatch(/charter:/);
    expect(call).not.toMatch(/\bname\b/);
  });

  it("passes the resolved framing into the grounding packet", () => {
    const build =
      /buildMovesAvaChatPacket\(\s*\{([\s\S]*?)\n {14}\},/.exec(routeSource)?.[1] ??
      "";
    expect(build).toMatch(/archetypeFraming,/);
  });
});

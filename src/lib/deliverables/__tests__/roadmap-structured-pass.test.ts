import JSZip from "jszip";

import {
  parseRoadmapStructuredJson,
  runRoadmapStructuredPass,
  buildRoadmapStructuredPassPrompt,
} from "../roadmap-structured-pass";
import {
  buildGovernedRoadmapOutcome,
  buildGovernedOutcomeRecord,
} from "../roadmap-governed-outcome";
import { ROADMAP_STRUCTURED_OUTPUT_VERSION } from "../roadmap-structured-output";
import type { SolutionContext } from "@/lib/programs/solution-context";

function validOutput(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: ROADMAP_STRUCTURED_OUTPUT_VERSION,
    executiveConclusion:
      "A four-stage transition establishes trusted data first, proves value in one function, then scales only after controls are established.",
    sponsorDecision:
      "Authorize foundation funding and confirm decision rights.",
    lifecycleStateRef: "review_draft",
    horizonOutcomes: {
      Mobilize: "Sponsorship and funding established.",
      "Establish Foundation": "Trusted data operational.",
      "Deliver Priority Outcomes": "Priority outcome proven.",
      "Scale and Optimize": "Operating model extended.",
    },
    cells: [
      {
        workstream: "Governance & Controls",
        horizon: "Mobilize",
        outcome: "rights",
        decisionOrGate: "Control approval",
        evidenceStatus: "recommended",
      },
      {
        workstream: "Data",
        horizon: "Establish Foundation",
        outcome: "model",
        evidenceStatus: "recommended",
      },
      {
        workstream: "AI / Automation",
        horizon: "Deliver Priority Outcomes",
        outcome: "auto",
        evidenceStatus: "illustrative",
      },
      {
        workstream: "Business & Process",
        horizon: "Scale and Optimize",
        outcome: "ext",
        evidenceStatus: "illustrative",
      },
    ],
    decisionGates: [
      { name: "Control approval", criteria: "controls established" },
    ],
    valueMilestones: [
      { name: "First result", horizon: "Deliver Priority Outcomes" },
    ],
    criticalDependencies: [
      { item: "data access", evidenceStatus: "evidence_required" },
    ],
    risks: ["Data quality"],
    caveats: ["Illustrative timing."],
    appendix: ["Detail."],
    sourceLineageRefs: ["accepted P3 architecture"],
    ...overrides,
  };
}

const CTX = {
  moveId: "m",
  tenantKey: "meridian",
  decisions: [
    { phase: 3, decision: "Chose governed lakehouse", rationale: "reuse" },
  ],
  chosenOption: "Governed lakehouse",
  architecture: "Lakehouse + governed metric layer",
  useCase: "Claims analytics",
  kpis: [{ name: "Cost of care", domain: "cost" }],
} as unknown as SolutionContext;

const NARR =
  "This roadmap is a four-stage transition across four horizons, a sequencing argument (review draft).";

describe("parseRoadmapStructuredJson", () => {
  it("valid JSON → ok", () => {
    const r = parseRoadmapStructuredJson(JSON.stringify(validOutput()));
    expect(r.ok).toBe(true);
  });
  it("tolerates a ```json fence", () => {
    const r = parseRoadmapStructuredJson(
      "```json\n" + JSON.stringify(validOutput()) + "\n```",
    );
    expect(r.ok).toBe(true);
  });
  it("empty → structured_output_missing", () => {
    const r = parseRoadmapStructuredJson("   ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("structured_output_missing");
  });
  it("prose/HTML leaked → structured_output_malformed", () => {
    const code = (t: string) => {
      const r = parseRoadmapStructuredJson(t);
      return r.ok ? "ok" : r.code;
    };
    expect(code("<html>hi</html>")).toBe("structured_output_malformed");
    expect(code("Here is the JSON: {")).toBe("structured_output_malformed");
  });
  it("unknown field → structured_output_schema_invalid", () => {
    const r = parseRoadmapStructuredJson(
      JSON.stringify(validOutput({ sneaky: 1 })),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("structured_output_schema_invalid");
  });
  it("missing horizon outcome → schema_invalid", () => {
    const r = parseRoadmapStructuredJson(
      JSON.stringify(validOutput({ horizonOutcomes: { Mobilize: "x" } })),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("structured_output_schema_invalid");
  });
});

describe("buildRoadmapStructuredPassPrompt", () => {
  it("asks for JSON only, seeds authoritative context, never requests HTML", () => {
    const { system, user } = buildRoadmapStructuredPassPrompt(CTX, 4);
    expect(system).toMatch(/ONLY a single JSON object/i);
    expect(system).toMatch(/no HTML/i); // forbids HTML output, never requests it
    expect(user).toContain("Governed lakehouse");
    expect(user).toMatch(/Output ONLY the JSON object/);
  });
});

describe("runRoadmapStructuredPass — retries + records, never swallows", () => {
  it("success on first attempt", async () => {
    const r = await runRoadmapStructuredPass({
      ctx: CTX,
      phase: 4,
      callModel: async () => JSON.stringify(validOutput()),
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.attempts).toHaveLength(1);
      expect(r.attempts[0].outcome).toBe("success");
    }
  });
  it("retries once on malformed, then succeeds — BOTH attempts recorded", async () => {
    let n = 0;
    const r = await runRoadmapStructuredPass({
      ctx: CTX,
      phase: 4,
      callModel: async () =>
        n++ === 0 ? "not json" : JSON.stringify(validOutput()),
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.attempts).toHaveLength(2);
      expect(r.attempts[0].outcome).toBe("structured_output_malformed");
      expect(r.attempts[1].outcome).toBe("success");
    }
  });
  it("fails after retries with the last failure code + both hashes recorded", async () => {
    const r = await runRoadmapStructuredPass({
      ctx: CTX,
      phase: 4,
      callModel: async () => "still not json",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("structured_output_malformed");
      expect(r.attempts).toHaveLength(2);
    }
  });
  it("a thrown model error is recorded (not swallowed)", async () => {
    const r = await runRoadmapStructuredPass({
      ctx: CTX,
      phase: 4,
      callModel: async () => {
        throw new Error("egress down");
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.attempts.every((a) => a.outcome !== "success")).toBe(true);
  });
});

describe("buildGovernedRoadmapOutcome — explicit codes", () => {
  const base = {
    sourceLineageRefs: ["accepted P3 architecture"],
    narrativeText: NARR,
    lineage: { moveId: "m", tenantKey: "meridian" },
    lifecycleState: "review_draft" as const,
    phase: 4,
  };
  const inputFrom = (o = validOutput()) =>
    parseRoadmapStructuredJson(JSON.stringify(o));

  it("valid input → success with renders + contract hash", async () => {
    const p = inputFrom();
    if (!p.ok) throw new Error("parse");
    const o = await buildGovernedRoadmapOutcome({
      ...base,
      input: p.input,
      claimedLifecycleRef: "review_draft",
    });
    expect(o.status).toBe("success");
    if (o.status === "success") {
      expect(o.contract.contentHash).toHaveLength(32);
      const z = await JSZip.loadAsync(o.renders.pptx);
      expect(Object.keys(z.files).some((n) => /slide1\.xml/.test(n))).toBe(
        true,
      );
    }
  });
  it("approved claim without evidence → unsupported_approval_claim", async () => {
    const p = inputFrom(
      validOutput({
        cells: validOutput().cells.map(
          (c: Record<string, unknown>, i: number) =>
            i === 0 ? { ...c, evidenceStatus: "approved" } : c,
        ),
      }),
    );
    if (!p.ok) throw new Error("parse");
    const o = await buildGovernedRoadmapOutcome({
      ...base,
      input: p.input,
      claimedLifecycleRef: "review_draft",
    });
    expect(o.status).toBe("unsupported_approval_claim");
  });
  it("lifecycle mismatch → lifecycle_mismatch", async () => {
    const p = inputFrom();
    if (!p.ok) throw new Error("parse");
    const o = await buildGovernedRoadmapOutcome({
      ...base,
      input: p.input,
      claimedLifecycleRef: "exit_approved_final",
    });
    expect(o.status).toBe("lifecycle_mismatch");
  });
  it("prose/structure horizon contradiction → prose_structure_contradiction", async () => {
    const p = inputFrom();
    if (!p.ok) throw new Error("parse");
    const o = await buildGovernedRoadmapOutcome({
      ...base,
      narrativeText: "A five-stage journey across five horizons.",
      input: p.input,
      claimedLifecycleRef: "review_draft",
    });
    expect(o.status).toBe("prose_structure_contradiction");
  });
});

describe("buildGovernedOutcomeRecord — success + failure are auditable", () => {
  it("success record carries contentHash + version 1", async () => {
    const p = parseRoadmapStructuredJson(JSON.stringify(validOutput()));
    if (!p.ok) throw new Error("parse");
    const outcome = await buildGovernedRoadmapOutcome({
      sourceLineageRefs: [],
      narrativeText: NARR,
      lineage: { moveId: "m", tenantKey: "meridian" },
      lifecycleState: "review_draft",
      phase: 4,
      input: p.input,
      claimedLifecycleRef: "review_draft",
    });
    const rec = buildGovernedOutcomeRecord({
      outcome,
      artifactId: "a",
      moveId: "m",
      tenantKey: "meridian",
      generationRunId: "run",
      pipeline: "golden_bar",
      attemptedAt: "2026-07-26T00:00:00Z",
      schemaVersion: ROADMAP_STRUCTURED_OUTPUT_VERSION,
      lifecycleStateVersion: "lc1",
      modelResponseHash: "hh",
    });
    expect(rec.status).toBe("success");
    expect(rec.failureCode).toBeNull();
    expect(rec.contentHash).toHaveLength(32);
    expect(rec.version).toBe(1);
    expect(rec.rendererResults).toEqual({ html: true, docx: true, pptx: true });
  });
  it("failure record carries failureCode + null hash and increments version over prior", async () => {
    const outcome = {
      status: "structured_output_missing" as const,
      detail: "empty",
    };
    const rec = buildGovernedOutcomeRecord({
      outcome,
      artifactId: "a",
      moveId: "m",
      tenantKey: "meridian",
      generationRunId: "run",
      pipeline: "golden_bar",
      attemptedAt: "2026-07-26T00:00:00Z",
      schemaVersion: ROADMAP_STRUCTURED_OUTPUT_VERSION,
      lifecycleStateVersion: "lc1",
      modelResponseHash: "hh",
      prior: { version: 2, contentHash: "prevhash" },
    });
    expect(rec.status).toBe("structured_output_missing");
    expect(rec.failureCode).toBe("structured_output_missing");
    expect(rec.contentHash).toBeNull();
    expect(rec.version).toBe(3);
    expect(rec.supersedesContentHash).toBe("prevhash");
  });
});

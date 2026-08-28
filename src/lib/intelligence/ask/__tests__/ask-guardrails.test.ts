jest.mock("server-only", () => ({}));

import { atlasStakeholderConflictHandoff } from "../index";
import { retrieveSurfaceContextSources } from "../retrievers/surface-context";
import {
  CONCISE_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  chunkAskText,
  chooseSynthesisTokenBudget,
  reconcileStreamRemainder,
  sanitizeAskSynthesis,
} from "../synthesizer";
import { buildDeterministicConciseFollowups } from "../followups";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Ask Intelligence guardrails", () => {
  it("routes advice requests about executive contradictions to the decision workspace", () => {
    const handoff = atlasStakeholderConflictHandoff(
      "What should I do about the CMO-vs-CFO contradiction?",
    );

    expect(handoff).toContain("Intelligence decision workspace");
    expect(handoff).toContain("aVa should not prescribe");
    expect(handoff).not.toContain("concrete playbook");
  });

  it("does not route ordinary synthesis questions to the decision handoff", () => {
    expect(
      atlasStakeholderConflictHandoff("Why is Apex CDP at risk right now?"),
    ).toBeNull();
  });

  it("does not append duplicated repaired text when live-stream reconciliation diverges", () => {
    expect(reconcileStreamRemainder("", "final answer")).toEqual({
      remainder: "final answer",
      diverged: false,
    });
    expect(reconcileStreamRemainder("final", "final answer")).toEqual({
      remainder: " answer",
      diverged: false,
    });
    expect(
      reconcileStreamRemainder(
        "The answer has review_required evidence and a table.",
        "The answer has evidence and a repaired table.",
      ),
    ).toEqual({ remainder: "", diverged: true });
  });

  it("strips hollow openers from synthesized answers", () => {
    expect(
      sanitizeAskSynthesis(
        "Good question, Anand. Let me give you an honest read here. Apex has a sourcing risk.",
      ),
    ).toBe("Apex has a sourcing risk.");
  });

  it("caps Ask Intelligence answers to the surface word limit", () => {
    const long = Array.from({ length: 150 }, (_, i) => `word${i}`).join(" ");
    const capped = sanitizeAskSynthesis(long, 120);

    expect(capped.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(120);
  });

  it("uses a tighter model budget only for explicit concise Ask requests", () => {
    expect(
      chooseSynthesisTokenBudget(
        "Summarize the IBM dependency in one short executive paragraph.",
      ),
    ).toBe(1300);
    expect(
      chooseSynthesisTokenBudget(
        "Summarize this in one short executive paragraph.",
      ),
    ).toBe(1300);
    expect(
      chooseSynthesisTokenBudget(
        "What evidence would change your view? Keep it concise.",
      ),
    ).toBe(1300);
    expect(
      chooseSynthesisTokenBudget(
        "Build the full modernization case for the CTO, CFO, and COO.",
      ),
    ).toBe(1300);
  });

  it("uses aVa identity and current demo-industry coverage in Claude prompts", () => {
    expect(SYSTEM_PROMPT).toContain(
      "You are aVa, AbarVa's Intelligence advisor.",
    );
    expect(SYSTEM_PROMPT).toContain("industrial holding companies");
    expect(SYSTEM_PROMPT).toContain("shared services");
    expect(SYSTEM_PROMPT).toContain("airlines");
    expect(CONCISE_SYSTEM_PROMPT).toContain("industrial/shared services");
    expect(CONCISE_SYSTEM_PROMPT).toContain("airline operations");
    expect(SYSTEM_PROMPT).not.toContain(
      "You are Sentinel, AbarVa's Intelligence agent.",
    );
    expect(CONCISE_SYSTEM_PROMPT).not.toContain(
      "You are Sentinel, AbarVa's Intelligence agent.",
    );
  });

  it("does not instruct aVa to print mechanical Answer/Proof/Move section labels anywhere in the prompt chain", () => {
    // Regression guard for the 2026-07-19/20 finding: SYSTEM_PROMPT told aVa to
    // write a narrative, not a labeled template, but three OTHER always-on
    // prompt fragments in this file (buildUniversalAnswerVisualContract,
    // richTextAddendum, answerOnlyDirective) still said "Default to the AbarVa
    // Pyramid Brief: Answer, Proof, Move" and cancelled the no-visible-labels
    // rule — so live answers on richText/answerOnly surfaces printed literal
    // "Answer." "Proof." "Move." headers. Scan the raw source, not just the
    // exported constants, since the offending text lived in helper functions
    // (buildUniversalAnswerVisualContract, answerOnlyDirective) that aren't
    // otherwise exported for direct assertion.
    const synthesizerSource = readFileSync(
      join(__dirname, "..", "synthesizer.ts"),
      "utf8",
    );
    expect(synthesizerSource).not.toContain("Pyramid Brief");
    expect(synthesizerSource).not.toMatch(
      /Default to the AbarVa .*Answer,\s*Proof,\s*Move/i,
    );
  });

  it("uses deterministic followups only for explicit concise Ask requests", () => {
    expect(
      buildDeterministicConciseFollowups({
        query:
          "Name one modernization risk SkyHarbor should watch. Keep it concise.",
        entities: ["IBM dependency"],
      }),
    ).toEqual([
      "Show the evidence behind IBM dependency",
      "What would change this recommendation?",
      "What should we do next?",
    ]);

    expect(
      buildDeterministicConciseFollowups({
        query: "Build the full modernization case for the CTO, CFO, and COO.",
        entities: ["modernization"],
      }),
    ).toBeNull();
  });

  it("preserves whitespace across streamed synthesis chunks", () => {
    const text =
      "Apex data and analytics current state includes Snowflake, Adobe Experience Platform, and Salesforce Marketing Cloud.";

    expect(chunkAskText(text).join("")).toBe(text);
  });

  // INT-VOICE.STRAT-2026-05-10b — Streaming whitespace regression.
  //
  // The 2026-05-10 Apex / Carlos re-test captured "ApexRetail" /
  // "demandsensing" / "upstreamconditions" word-fusion across every test on
  // every aVa surface. Carlos labeled it a frontend bug; root cause was
  // server-side: askIntelligence used to call sanitizeAskSynthesis(delta,
  // 500) on each streamed chunk, and that function's trim() stripped the
  // trailing whitespace from chunks produced by chunkAskText (which depend
  // on that whitespace as the inter-chunk separator). The client then
  // concatenated stripped chunks and produced fused words.
  //
  // Lock in: a long aVa-shaped sentence must round-trip through the
  // chunk → (no trim) → join pipeline byte-for-byte.
  it("does not fuse words across streamed chunk boundaries (INT-VOICE.STRAT-2026-05-10b)", () => {
    // Build a sentence longer than the 80-char chunk regex cap so chunkAskText
    // is forced to produce multiple chunks split on inter-word whitespace.
    const sentence =
      "At multi-banner specialty retailers in your size class, four AI bets show up over and over: " +
      "demand sensing and assortment optimization on the merchandising side, AI workforce scheduling " +
      "and store-labor planning on ops, loyalty next-best-offer on customer, and supplier-collaboration " +
      "AI on the supply side.";

    const chunks = chunkAskText(sentence);
    expect(chunks.length).toBeGreaterThan(1);

    // Pre-fix behaviour we are guarding against: trimming each chunk fuses
    // the last word of one chunk with the first word of the next, because
    // the regex `/.{1,80}(?:\s|$)/g` consumes the inter-chunk whitespace as
    // part of the previous chunk's trailing edge.
    const fusedFromTrimmedChunks = chunks.map((chunk) => chunk.trim()).join("");
    expect(fusedFromTrimmedChunks).toMatch(
      /show upover|merchandisingside|loyaltynext-best-offer/,
    );

    // Post-fix behaviour: passing chunks through unchanged reconstructs the
    // original sentence exactly, byte-for-byte. This is what
    // askIntelligence now does.
    expect(chunks.join("")).toBe(sentence);
  });

  // INT-VOICE.STRAT-2026-05-10 — Lock in the no-canned-refusal contract for
  // the Ask flow. The previous version short-circuited with retrieval-mechanics
  // framings ("We don't have indexed data...", "That topic isn't yet
  // synthesized...", "Limited indexed data — confidence is moderate.") whenever
  // sources were empty or low-confidence, bypassing the synthesizer's senior-
  // advisor prompt. This test guards against any reintroduction.
  describe("No canned-refusal short-circuit (INT-VOICE.STRAT-2026-05-10)", () => {
    const rawIndexSource = readFileSync(
      join(__dirname, "..", "index.ts"),
      "utf8",
    );

    // Strip `//` line comments and `/* */` block comments before substring-
    // matching so the doctrine comment that explains why these phrases were
    // removed is not itself flagged.
    const indexCode = rawIndexSource
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

    it("does not contain the legacy emptyStateMessage helper", () => {
      expect(indexCode).not.toMatch(/function\s+emptyStateMessage\s*\(/);
    });

    it("does not emit any of the legacy retrieval-mechanics canned refusals", () => {
      const bannedSubstrings = [
        "We don't have indexed data that answers that directly",
        "We don't have indexed vendor data that matches that comparison",
        "That topic isn't yet synthesized in the knowledge layer",
        "Limited indexed data — confidence is moderate.",
        "No matching Genome pattern is indexed yet",
        "No insight matches that query yet",
      ];
      for (const phrase of bannedSubstrings) {
        expect(indexCode).not.toContain(phrase);
      }
    });

    it("routes empty-source queries through the synthesizer", () => {
      expect(indexCode).toMatch(
        /for\s+await\s*\(\s*const\s+delta\s+of\s+synthesizeStream\s*\(/,
      );
      expect(indexCode).not.toMatch(
        /if\s*\(\s*sources\.length\s*===\s*0\s*\)\s*\{\s*const\s+msg\s*=\s*emptyStateMessage/,
      );
    });

    // INT-VOICE.STRAT-2026-05-10b — streaming whitespace regression guard.
    // sanitizeAskSynthesis(delta, …) inside the synthesizer-stream loop
    // strips trailing whitespace from chunks via trim(), which the
    // SentinelChat client then concatenates into fused words like
    // "ApexRetail" / "demandsensing". The fix: pass deltas through
    // unchanged. Guard against re-introduction of the per-chunk sanitize.
    it("does not re-sanitize each streamed delta (preserves chunk-boundary whitespace)", () => {
      expect(indexCode).not.toMatch(
        /for\s+await\s*\(\s*const\s+delta\s+of\s+synthesizeStream[\s\S]*?sanitizeAskSynthesis\s*\(\s*delta/,
      );
      expect(indexCode).toMatch(
        /for\s+await\s*\(\s*const\s+delta\s+of\s+synthesizeStream[\s\S]*?yield\s*\{\s*type:\s*['"]delta['"]\s*,\s*text:\s*delta\s*\}/,
      );
    });
  });

  describe("Active synthesis decision-canvas contract", () => {
    const synthesizerCode = readFileSync(
      join(__dirname, "..", "synthesizer.ts"),
      "utf8",
    );

    it("sends the tabbed canvas contract through the active ask synthesis model path", () => {
      expect(synthesizerCode).toContain("INTELLIGENCE_TABBED_OUTPUT_CONTRACT");
      expect(synthesizerCode).toContain("ACTIVE INTELLIGENCE CANVAS RULES");
      expect(synthesizerCode).toContain("Evidence is mandatory");
      expect(synthesizerCode).toContain("Chart is mandatory");
      expect(synthesizerCode).toContain("Table is mandatory");
      expect(synthesizerCode).toContain(
        "Target 120-180 words before the first tab marker",
      );
      expect(synthesizerCode).toContain("cleanIntelligenceModelInputText");
      expect(synthesizerCode).toMatch(
        /args\.onModelInput\?\.\(\{\s*system:\s*systemWithContinuity,\s*user:\s*prompt,/,
      );
    });

    it("preserves tabbed Claude output for the display-only route renderer", () => {
      expect(synthesizerCode).toMatch(
        /const\s+tabbedResponse\s*=\s*parseIntelligenceTabbedResponse\(text\);/,
      );
      // Live main-answer streaming: the tabbed happy path now emits the
      // reconciled remainder (liveStreamedText + remainder === final text)
      // instead of `yield text`. The full tabbed output is still preserved.
      expect(synthesizerCode).toMatch(
        /if\s*\(\s*tabbedResponse\.tabs\.length\s*>\s*0[\s\S]*?reconcileStreamRemainder\([\s\S]*?yield\s+remainder;/,
      );
    });

    it("repairs explicit tab requests before rendering when Claude omits a required tab", () => {
      expect(synthesizerCode).toContain("requiredCanvasTabsForQuery");
      expect(synthesizerCode).toContain("missingRequiredCanvasTabs");
      expect(synthesizerCode).toContain("blockingRepairEnabled");
      expect(synthesizerCode).toContain("blocking_repairs.skipped");
      expect(synthesizerCode).toContain(
        "MANDATORY INTELLIGENCE CANVAS TAB REPAIR",
      );
      expect(synthesizerCode).toContain(
        "Include every required tab listed above",
      );
      expect(synthesizerCode).toContain("MISSING-TAB ONLY REPAIR");
      expect(synthesizerCode).toContain("Return only the missing tab blocks");
    });

    it("repairs strategic answers that omit the governed native canvas payload", () => {
      expect(synthesizerCode).toContain("isBlockingIntelligenceRepairEnabled");
      expect(synthesizerCode).toContain("requiresNativeExecutiveCanvas");
      expect(synthesizerCode).toContain("hasExecutiveCanvasPayload");
      expect(synthesizerCode).toContain("NATIVE EXECUTIVE CANVAS REPAIR");
      expect(synthesizerCode).toContain(
        "add exactly one governed `abarva-canvas` fenced JSON block",
      );
    });

    it("keeps rich Intelligence output prompt-led while preserving guarded repair code", () => {
      expect(synthesizerCode).toContain(
        "ensureMandatoryCompanionCanvasFallback",
      );
      expect(synthesizerCode).toContain(
        "if (args.richText && blockingRepairEnabled)",
      );
      expect(synthesizerCode).toMatch(
        /const\s+decisionGrade\s*=\s*args\.richText\s*\?\s*text\s*:/,
      );
      expect(synthesizerCode).toContain("cleanUntabbedCanvasMainAnswer");
      expect(synthesizerCode).toContain("buildFallbackNativeCanvasBlock");
    });

    it("keeps blocking repair out of the default live route path", () => {
      const indexCode = readFileSync(join(__dirname, "..", "index.ts"), "utf8");

      expect(indexCode).toContain("isBlockingIntelligenceRepairEnabled");
      expect(indexCode).toContain("consultant.synthesis.skipped");
      expect(synthesizerCode).toContain("live_no_repair_mode");
      expect(synthesizerCode).toMatch(
        /if\s*\(\s*blockingRepairEnabled\s*&&\s*missingTabs\.length\s*>\s*0\s*\)/,
      );
      expect(synthesizerCode).toMatch(
        /blockingRepairEnabled\s*&&[\s\S]*?isExplicitVisualAsk\(args\.query\)/,
      );
      expect(synthesizerCode).toMatch(
        /blockingRepairEnabled\s*&&[\s\S]*?requiresNativeExecutiveCanvas\(args\.query\)/,
      );
    });

    it("repairs session-history wording before any active Ask synthesis output is rendered", () => {
      expect(synthesizerCode).toContain("SESSION_CONTEXT_LANGUAGE_RE");
      expect(synthesizerCode).toContain("STANDALONE ANSWER REPAIR");
      expect(synthesizerCode).toContain(
        "Remove any wording that depends on prior chat history",
      );
      expect(synthesizerCode).toContain("This is not board-ready yet.");
      expect(synthesizerCode).toContain(
        "Close four evidence gaps before treating the recommendation as board guidance",
      );
      expect(synthesizerCode).toContain("- Current-state baseline");
      expect(synthesizerCode).not.toContain("hidden conversation history");
      expect(synthesizerCode).not.toContain(
        "not going to surface it as an executive answer",
      );
      expect(synthesizerCode).not.toContain(
        "I detected mixed-tenant language in the draft answer",
      );
      expect(synthesizerCode).not.toContain("I am not going to surface it");
      expect(synthesizerCode).toMatch(
        /if\s*\(\s*SESSION_CONTEXT_LANGUAGE_RE\.test\(text\)\s*\)[\s\S]*?const\s+tabbedResponse\s*=\s*parseIntelligenceTabbedResponse\(text\);/,
      );
    });

    it("keeps repaired visuals inside Claude-owned canvas tabs", () => {
      expect(synthesizerCode).toContain("inside a Table or Chart tab");
      expect(synthesizerCode).not.toContain(
        "add exactly one compact GitHub-flavored Markdown decision table with a header row, separator row, and 2-6 evidence-backed rows. Use the columns the user requested where possible.",
      );
    });
  });

  it("keeps Ask tenant resolution strict so no-tenant sessions cannot fall back to a default client", () => {
    const routeCode = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "app",
        "api",
        "intelligence",
        "ask",
        "route.ts",
      ),
      "utf8",
    );

    expect(routeCode).toMatch(
      /resolveTenant\s*\(\s*\{[\s\S]*?allowFallback:\s*false/,
    );
  });

  it("promotes live surface facts as high-confidence Intelligence evidence", () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: "vendors",
        activeClient: "Apex Retail Group",
        clientKey: "apexretail",
        stageFacts: ["Vendors tab: $107.4M spend across 21 active vendors."],
        pageFacts: [
          "This is the live Apex Retail Intelligence substrate, not a healthcare fixture.",
        ],
      },
      "current state of data analytics landscape",
    );

    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      type: "SURFACE",
      name: "Apex Retail Group live Intelligence surface",
      id: "vendors",
      confidence: 0.99,
    });
    expect(sources[0].detail).toContain("Vendors tab: $107.4M spend");
    expect(sources[0].detail).toContain("not a healthcare fixture");
  });

  it("promotes tenant and graph context for Apex current-state questions", () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: "vendors",
        activeClient: "Apex Retail Group",
        clientKey: "apexretail",
        stageFacts: ["Vendors tab: $107.4M spend across 21 active vendors."],
        tenantFacts: [
          "Tenant 360: Apex Retail is the active retail demo tenant. Do not use Meridian Healthcare, Epic EHR, IDN, CMIO, HIPAA, or clinical AI facts.",
        ],
        vendorFacts: [
          "Data and analytics landscape: Adobe Experience Platform $8.8M - CDP; Snowflake $3.8M - analytics foundation.",
        ],
        graphFacts: [
          "Graph edge: Adobe Experience Platform, Salesforce Commerce + Marketing Cloud, and Accenture Retail all claim integration-hub adjacency to the same customer data layer.",
        ],
      },
      "Can you give me a perspective of current state of data analytics landscape?",
    );

    expect(sources.map((source) => source.type)).toEqual([
      "SURFACE",
      "TENANT",
      "GRAPH",
    ]);
    expect(sources[1]).toMatchObject({
      type: "TENANT",
      name: "Apex Retail Group 360 Intelligence substrate",
      id: "apexretail",
      confidence: 0.96,
    });
    expect(sources[1].detail).toContain("Adobe Experience Platform $8.8M");
    expect(sources[1].detail).toContain("Do not use Meridian Healthcare");
    expect(sources[2]).toMatchObject({
      type: "GRAPH",
      name: "Apex Retail Group Intelligence graph",
      id: "apexretail",
    });
    expect(sources[2].detail).toContain("integration-hub adjacency");
  });
});

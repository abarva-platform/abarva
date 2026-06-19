# Volume 1 — Review & Provenance

> 2026-06-19. Two-pass authoring: initial draft (12 agents) -> adversarial review -> targeted remediation (6 agents) -> final verify.

## Final verdict: **board-ready**

Verified all six ground-truth items directly against the repo on branch codex/corpus-wave-24; every one is now correctly reflected and internally consistent across Ch1, Ch2 (incl. §2.8), Ch3, Ch4, and the Glossary.\n\nRepo confirmations: (1) src/lib/source/disclosure-flag/ ships disclosure-flag.ts (6368B) + types.ts + serde.ts + __tests__ — a legal-privilege classifier, not a refusal mechanism; draft tags it SHIPPED and separately marks evidence-refusal ABSENT everywhere. (2) Archetype lives as types.ts:245 (archetype:string), types.ts:3 (SourceRigorLevel), classifySourcingEvent() at category-classifier.ts:280, imported source-answer-engine.ts:9 / called :316; source-shape-resolver.ts is confirmed the UI WorkingPaneShapeResolver (Shell Layout Spec v2 §7) and the draft explicitly disclaims it for archetypes. (3) gate-criteria.ts has exactly 38 distinct GATE- ids; draft uses '38' throughout with no residual '83'/'57'. (4) should-cost-model imported at source-answer-engine.ts:22, invoked 191/232, field 89; draft consistently frames it as wired into the dormant engine, not the live generate pipeline. (5) stage-packs are S0_intake..S7_activate with S2=stage 2 (shortlist) and S5=stage 5 (bafo); source-shape-resolver uses divergent S3/S6/S7 labels; draft flags this in Glossary and §2.1. (6) all four hard numbers (1–3 pts, 5–15 pt swing, 8–20% BAFO, $4M/40%) carry '(illustrative range)'.\n\nAlso spot-verified collateral claims: prompt-registry REGISTRY object has exactly three keys (d01_strategy_memo, d05_scope_memo, d09_rfp_pack) — the '3 of 33' / 'd01/d05/d09 only' claim is accurate; artifact-specs.ts enumerates 33 d-codes.\n\nThe only residual item is the single grounding nuance above — a phrasing tightening, not a factual correction. It does not change any maturity tag (disclosure-flag SHIPPED, archetype framework DORMANT, refusal ABSENT all stand). Board-ready; optionally address the nexus/ask stub-path nuance in a copy pass.

## Residual (optional) refinement
- Minor precision gap (not a correctness error): source-answer-engine.ts IS reachable from a live route. /api/v1/source/[eventId]/nexus/ask/route.ts (line 87) calls createSourceNexusApiStubResponse, which (nexus-api.ts:243) invokes buildSourceAnswerEngine, which calls classifySourcingEvent and estimateEventShouldCost. The draft's repeated qualifier 'no live GENERATE-ROUTE call-site' is accurate (the /artifacts/generate pipeline genuinely does not touch the engine). But absolute phrasings like 'runs only inside the dormant engine and tests, never in the live generate pipeline' (Glossary, Ch2 §2.8, Ch4 §4.3) understate that path: it runs in a stub-backed live route. Suggest narrowing to 'never in the live deliverable-generation pipeline; its only live entry point is the read-only nexus/ask stub responder' so DORMANT is not over-claimed.

## Corrections applied in remediation pass

### frontmatter
- Glossary 'Disclosure Flag' row rewritten: now described as a SHIPPED legal-privilege classification value object with Intelligence→Move→Source→Tower inheritance, explicitly NOT an evidence-insufficiency refusal mechanism (was wrongly tagged 'Governed refusal on insufficient evidence; present, DORMANT')
- Added new Glossary row 'Governed Insufficiency / Refusal' tagged ABSENT (unbuilt), noting the live grounded-answer path is source-answer-engine.ts and a refusal module would be net-new
- Glossary 'Archetype' row corrected: archetype now attributed to types.ts:245 field + SourceRigorLevel + classifySourcingEvent() in category-classifier.ts; clarified the classifier runs only inside the DORMANT source-answer-engine and tests, never in the live generate pipeline; removed misattribution to source-shape-resolver.ts and noted that file is the UI WorkingPaneShapeResolver
- Glossary 'Stage S0–S7' row: pinned canonical stage-pack scheme (S0_intake..S7_activate, S2=shortlist, S5=BAFO) and flagged the source-shape-resolver.ts UI labeling inconsistency (S3=Shortlist, S6=Initial Bid, S7=BAFO)

### ch1
- Gate-criteria catalog row + Gap 5 + Phase-1 row: replaced '83 declarative criterion/stage lines' with '38 gate criteria'
- Maturity table: split the 'Disclosure-flag / refusal (1)' row into 'Disclosure-flag (privilege classifier) — SHIPPED (5)' describing the legal-privilege classification value object and cross-product inheritance, plus a separate 'Evidence-or-refuse / insufficiency posture (0) — does not exist, net-new, would wire into source-answer-engine.ts'
- Gap 5: removed 'the disclosure-flag refusal mechanism is unwired'; replaced with 'no evidence-or-refuse mechanism declines that advance' and a clarifying note that disclosure-flag is a privilege classifier, not an insufficiency refusal
- Business-case 'Governance & auditability' row: reframed unlock from 'disclosure-flag refusal' to a net-new evidence-or-refuse posture wired into source-answer-engine.ts, with privilege classification noted as separately handled by the shipped disclosure-flag module
- Target Architecture governance paragraph: rewrote the disclosure-flag-as-refusal claim into a net-new evidence-or-refuse posture on source-answer-engine.ts, plus a clarification that disclosure-flag is a shipped privilege classifier; corrected archetype framework citation — removed 'two-axis resolver in source-shape-resolver.ts', described the framework's 4 archetypes/two-axis/10-method/promotion-only ladder, and pointed archetype reality at the archetype field on types.ts, SourceRigorLevel, and classifySourcingEvent() in classifier/category-classifier.ts invoked only inside the dormant source-answer-engine + tests/fixtures
- Phase-1 anchor seam: replaced 'source-shape-resolver.ts' with 'classifier/category-classifier.ts, source-answer-engine.ts'
- Labeled '1–3 points of contract value' as '(illustrative range)' inline in the negotiation-leverage business-case row

### ch2
- §2.1: reframed disclosure-flag from "DORMANT, not ABSENT" to a SHIPPED legal-privilege classifier (not the evidence-refusal mechanism an earlier audit assumed)
- Line 30: added stage-code caveat — stage-pack S0-S7 (S2=shortlist, S5=bafo) is canonical; flagged UI source-shape-resolver.ts divergent labels (S3=Shortlist, S6=Initial Bid, S7=BAFO) as a known source-side inconsistency
- §2.3: corrected gate-criteria count from "on the order of 57" to "38 (38 distinct GATE- ids)"
- Scorecard row 1 (Origination/Intake): removed misattributed source-shape-resolver.ts; cited classifier/category-classifier.ts; softened archetype-inference claim to "on the live path"
- Scorecard row 3 (Value-Target): reframed should-cost from "deterministic on defaults" to "wired into the dormant source-answer-engine, not the live generate-route pipeline"
- Cross-cutting table: rewrote Archetype Framework row to cite types.ts (archetype, SourceRigorLevel) + classifySourcingEvent, and to say the classifier runs only inside the dormant engine/tests, never "never called"
- Cross-cutting table: split the old "Disclosure-flag / refusal" row into (a) Disclosure-flag legal-privilege classifier = SHIPPED (maturity 3) and (b) a new Evidence-refusal/governed-insufficiency posture = ABSENT (maturity 1)
- Cross-cutting table: source answer engine re-tagged from PARTIAL/DORMANT (3) to DORMANT (2) with "no live generate-route call-site"
- §2.8: retitled and fully reworked into three separated assets — Archetype Framework (DORMANT, with do-not-attribute-to-source-shape-resolver note + full 4-archetype/two-axis/10-method/promotion-only framing), Disclosure-flag (SHIPPED privilege classifier with First Capital inheritance), and Evidence-refusal posture (ABSENT, net-new, would wire into source-answer-engine); reconciled to Ch4 §4.2
- §2.9.3 I1: added should-cost wired-into-dormant-engine framing and added should-cost-model.ts to evidence files
- §2.9.4 item 5: separated unenforced gates from the net-new (ABSENT) evidence-refusal posture, distinguished from the shipped privilege classifier
- §2.10 verdict: replaced "governance assets are real but unwired" with precise split — governance-enforcement real-but-untriggered, privilege classifier shipped, evidence-refusal posture not yet built
- Confirmed no unsourced dollar/percentage board claims (8-20%/5-15 point/1-3 points) appear in this chapter, so no (illustrative range) tags were needed

### ch3
- §7 intro: reframed the dormant commercial layer (bafo/should-cost/award) from 'sits dormant or fixture-bound, never wired into the live path' to 'wired only into the dormant source-answer-engine.ts or fixture-bound — never reached by the live generate-route pipeline' (Ground Truth #4).
- §15 should-cost: deleted the false 'Standalone — NOT wired into source-answer-engine.ts' quote; replaced with the accurate statement that source-answer-engine.ts imports the model (line 22), invokes estimateEventShouldCost, carries shouldCostEstimate — but is itself dormant with no live generate-route call-site (Ground Truth #4).
- §17 should-cost value-target: corrected the 'bind into the reasoning engine' line to 'bind into the live reasoning engine (today it reaches only the dormant source-answer-engine.ts)'; marked the '5–15 point swing' as '(illustrative range)' (Ground Truth #4, #6).
- §67 BAFO: marked the '8–20% beyond the first-round best offer' as '(illustrative range)' (Ground Truth #6).
- §94 Fact-base-before-opinion: corrected 'evidence-or-refuse posture of the dormant disclosure-flag layer' to 'an evidence-or-refuse posture — a governed-insufficiency mechanism that is entirely absent and net-new (not the disclosure-flag layer, which classifies legal privilege)' (Ground Truth #1).
- §102 Governed refusal: rewrote the disclosure-flag misattribution — refusal/insufficiency posture is ABSENT and net-new, live grounded-answer path is source-answer-engine.ts, and disclosure-flag/ is a separate SHIPPED legal-privilege classifier with downstream inheritance, not a refusal mechanism (Ground Truth #1).
- §110 table: should-cost seam changed from '(built, unwired)' to '(wired into dormant source-answer-engine.ts, not the live pipeline)' (Ground Truth #4).
- §122 table: 'Governed refusal on thin evidence' row engine changed to 'Evidence-insufficiency module + grounded-answer', seam to '(refusal mechanism absent — net-new), source-answer-engine.ts (live path, dormant)', maturity 1→5 changed to 0→5 (refusal capability absent, not dormant) (Ground Truth #1).
- §123 table: added a new dedicated row for the SHIPPED disclosure-flag value object — 'Legal-privilege classification & inheritance | disclosure-flag/disclosure-flag.ts (shipped) | 4 → 5' — to settle the taxonomy (privilege-classifier shipped vs refusal absent) (Ground Truth #1).

### ch4
- Gate criteria count: changed '57 gate criteria' to '38 gate criteria' in the §4 intro (line 3).
- Archetype resolver misattribution (§4.3 Analysis paragraph): removed the source-shape-resolver.ts citation for archetype classification; now cites only category-classifier.ts classifySourcingEvent(), and states it is imported/invoked by source-answer-engine.ts but runs only inside that dormant engine and its fixtures, never in the live generate pipeline.
- Should-cost framing (§4.3): reframed should-cost/delivery-model/normalization as 'already wired into the dormant source-answer-engine.ts as a flat bundle rather than a live pipeline stage' (consistent with wired-but-dormant ground truth).
- Future-state diagram caption (§4.3): changed the refuse-gate label from '(disclosure)' to '(NET-NEW module)' so the refusal gate is no longer attributed to disclosure-flag.
- Refusal mechanism (§4.7): rewrote the bullet so the insufficiency-refusal capability is stated as net-new/absent (not 'activates the dormant archetype framework's refusal posture'); disclosure-flag described as a shipped legal-privilege classification module on an orthogonal axis.
- Unsourced number (§4.6 Quantify): appended '(illustrative range)' to the '$4M of run-rate exposure, 40% likely...' example.


---

## Volumes 2-4 — final status (2026-06-19)

Authored (12 chapters), per-volume adversarial review, then a verified-ground-truth remediation pass (15 agents). Final verdicts:
- **Volume 2 (Source Intelligence Engine):** needs-minor-fixes
- **Volume 3 (Enterprise Architecture):** board-ready
- **Volume 4 (Implementation Roadmap):** needs-minor-fixes

Grounding errors caught + fixed in remediation: render-pdf falsely called a 501 stub (it returns 200; @react-pdf; wired for d05/d09/d24/d27); text-parser.ts falsely credited with binary docx/pdf/xlsx parsing (it is text/first-mile only — binary parsing is NET-NEW or reuses the Moves-side pipeline under src/lib/programs/); wrong voice-doctrine path (src/lib/agent/voice-doctrine/, not under source/); feature-flag key (retrieval_azure_search, not tenant-context-v1); should-cost stale-comment nuance; deal-pack precise framing (assembles a doc @200; gap = multi-artifact zip); d19a/b/c labelled net-new (not canon); specialists framed as deterministic-prose runtime builders (not "no runtime impl"); dollar figures labelled (illustrative range).

Verified counts (authoritative): gate-criteria = **38 distinct gate IDs / 39 criterion entries** (spec uses 38 = gate IDs, consistent across volumes); evidence-requirements = **21** distinct entries.

Residual minor items (non-blocking, noted for a future copy pass): a few fragile exact line-number / LOC citations; one cross-chapter input-list reconciliation (Ch9 vs Ch12 contract-agent inputs); one cosmetic typo (Ch14 "wrestructures").

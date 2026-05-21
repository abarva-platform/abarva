# Investor Diligence Memo — AbarVa

**Date:** 2026-05-20
**Prepared by:** Diligence partner (Series A/B; enterprise SaaS + applied AI; prior CXO/operator seats)
**Subject:** AbarVa — tenant-grounded decision OS for enterprise AI bets
**Method:** Read of `docs/strategy/`, the Moves Expert Kernel (`src/lib/programs/expert-kernel/`), the Source kernel (`src/lib/source/`), Intelligence and Tower surfaces (`src/components/`, `src/app/`), the eight committed artifact samples at repo root, and the multi-tenant seed substrate (`src/scripts/setup-data/`). The live product (`nexus-vert-kappa.vercel.app`) was **not** driven from this environment — live-experience judgments below are inferred from route code and the committed HTML samples, and are flagged as inferred where they are.

---

## 1. Investment verdict

**Fund with conditions — small check, milestone-gated.** AbarVa is the rare seed/Series-A applied-AI company where the hardest thing to fake is the thing that is real: the Moves Expert Kernel is a genuinely deterministic, self-critiquing reasoning layer that produces a costed business case and then *refuses to claim a payback it cannot ground* — I verified this in `business-case-compiler.ts` and the Apex artifact, which lands on "SHAPE / payback blocked — seed gap" rather than a flattering number. That is a real product and a real moat-seed. But the money line is this: **one of four surfaces (Moves) is a product; the other three (Intelligence, Source, Tower) are still substantially methodology-plus-fixtures, and there is zero realized-outcome data because there are zero real customers.** The "decision OS / context layer" thesis is venture-scale *if* the kernel pattern is replicated across surfaces and validated by at least one paying enterprise with a real rate card and real Tower actuals. Today it is one excellent kernel surrounded by a convincing narrative. I would lead a *seed extension or a conditional A* — not a clean A — with the round gated on first paid pilot and a real (non-demo) rate card.

---

## 2. Thesis assessment

**The claim:** AbarVa becomes "the only context layer of significance" for how an enterprise decides and executes AI investment — four surfaces (Intelligence → Moves → Source → Tower) over a tenant-grounded substrate.

**Is it venture-scale?** The *job* is real and big. Every enterprise over ~$1B revenue now runs a portfolio of AI bets with no disciplined, costed, auditable way to decide which to fund, how to shape them, how to source them, and whether they paid back. That is a CFO/CIO pain worth six-to-seven-figure ARR if solved credibly. TAM is defensible at the "AI program governance + decision tooling" framing — adjacent to the strategy-consulting spend it partially displaces, which is large.

**The wedge.** The honest wedge is **Moves**, specifically the costed business case. It is the only surface where the product does something a customer cannot trivially do in PowerPoint and Excel: orchestrate a deterministic baseline → effort → haircut → critic → recommendation pipeline that is auditable and that says "no." `docs/strategy/MOVES-DELIVERABLE-AND-BUSINESS-CASE-SPEC.md` §11 is explicit and correct that the kernel — not the UI — is the wedge. The four-surface story is the *vision*; the fundable beach-head is "the tool that turns an AI idea into a business case a CFO will actually read." The founder's own docs already understand this; the pitch should lead with it.

**Why now.** Credible: enterprises are mid-cycle on AI portfolios, boards are demanding ROI discipline, and foundation-model capability now makes the orchestration layer buildable. Fine.

**The competitive question — moat or head start?** This is where I press hardest.

- *Big-4 / BCG-X:* They sell the judgment as a service; they have no incentive to productize a deterministic kernel that commoditizes their analysts. AbarVa's threat from them is not the kernel — it is that consulting *relationships* own the CFO. AbarVa's counter has to be "always-on, auditable, cheaper, and it updates as the tenant data changes." That is a real counter but it is a *go-to-market* moat, not a technical one.
- *Foundation-model vendor:* A real threat to the *generation* layer, not the *discipline* layer. The defensible part of AbarVa is not "it writes a deck" — any model does that — it is the deterministic, testable, self-critiquing kernel (`critic.ts`, `qa-rubric.ts`, the haircut model in `value-forecast.ts`) plus the tenant substrate. A model vendor will not build a `value-haircut` model with six weighted discount factors and a CFO/delivery/data critic loop; that is opinionated domain product.
- *In-house team:* Could build a worse version in a quarter. Could not easily build the multi-tenant substrate + the calibration flywheel + the artifact rigor. The moat compounds *only if* the post-outcome calibration loop (`outcome-calibration.ts`) actually runs on real Tower actuals across many tenants. It does not yet — there are no actuals.

**Verdict on thesis:** Venture-scale and defensible *in potential*. Today it is closer to a head start than a moat, because the compounding asset — calibrated priors from realized outcomes across tenants — has zero data in it. The kernel architecture is the moat-seed; the moat itself is unbuilt because it requires customers. This is fundable but it is exactly the risk the round must price.

---

## 3. Capability → outcome map

Every link graded **proven** (verified it does the thing end-to-end), **plausible** (architecture supports it, not yet validated against a real customer/outcome), or **theater** (looks like an outcome, is structured output).

| Surface | Capability claimed | Customer outcome claimed | Grade | Evidence |
|---|---|---|---|---|
| **Moves** | Expert Kernel: baseline → effort → value-haircut → critic → business case | A CFO funds (or declines) an AI bet from a costed, risk-adjusted, assumption-explicit case | **Proven (mechanism) / Plagued by no-customer-validation** | `business-case-compiler.ts` runs `critic.ts` and lets a blocker downgrade `fund`→`shape`; `value-forecast.ts` applies a six-factor haircut; the Apex artifact (`apex-costed-business-case-pack.sample.html`) correctly resolves to "SHAPE — payback blocked" because cost-per-contact is a declared seed gap. The mechanism is real and honest. **But:** no CFO has ever funded anything off it. |
| **Moves** | Board-grade artifact decks (8 deliverable types) | An executive reads a board-circulation-ready pack | **Proven for HTML / Plausible for board-grade bar** | All 8 samples exist, are ~500-680 lines of structured HTML, follow `MOVES-BOARD-GRADE-ARTIFACT-BLUEPRINT.md` page-by-page, lead with the decision, and surface seed gaps. Genuinely good. The blueprint's own §12 sets "board-grade = 9+/10"; these read as a strong **7-8** (credible exec review draft) — the takeaway titles have a point of view, but charts are CSS/HTML, not true exhibit-grade, and density is below a real MBB deck. |
| **Moves** | Three tenant case anchors (Apex / Meridian / First Capital) | Proves the kernel generalizes beyond one demo | **Plausible** | `apex-contact-center-case.ts`, `meridian-ambient-clinical-case.ts`, `firstcapital-fraud-detection-case.ts` each ground inputs to a named substrate and declare seed gaps. Genuinely three cases, not one re-skinned. But all three are *authored anchors* — hand-built inputs, not pulled live from a tenant's DB at request time. |
| **Source** | Expert-judgment kernel: blockers, gates, evidence gaps for a sourcing event | Changes a real sourcing/award decision | **Plausible, leaning theater at the data layer** | `source-judgment-kernel.ts` has real rules (P0 AI/data-rights blocker, selection-memo-holds-award, incomplete-pricing). The *logic* is credible. But the Source landing experience and event data lean heavily on fixtures — `shell-source-fixture.ts`, `mock-seed.ts` — and `src/app/(maestro)/source/events/[eventId]/.../page.tsx` imports `shell-source-fixture`. The judgment kernel is real; the substrate it judges is largely demoware. |
| **Source** | Decision Queue as a VP operating console | A VP of sourcing runs their day in it | **Plausible** | `PRACTITIONER-FIT-DESIGN.md` is an unusually good practitioner spec, and `/source` redirects to `/source/queue` (correct call). `loadSourceDecisionQueueWithEvidence` exists. But the queue's detector sources depend on real `vendor_contracts`/`it_financials` rows; with fixture tenants this is a demo of a console, not a console. |
| **Intelligence** | Pattern → signal → solution → Move funnel ("which bet") | A CXO picks the right AI bet to make | **Plausible / under-verified** | Large surface (`src/components/intelligence/` has 30+ components; `MEMORY` notes a 2026-05-07 reframe). I could not verify a deterministic kernel under it equivalent to Moves' — Intelligence appears content/corpus-driven, not kernel-driven. This is the surface where "structured output that looks like an outcome" risk is highest. |
| **Tower** | Track realized outcomes; calibration flywheel back into the kernel | Proves value was delivered; tunes future priors | **Theater today — by necessity** | `outcome-calibration.ts` exists and is well-shaped. But `src/app/(maestro)/tower/page.tsx` imports `apex-contact-center-portfolio-fixture` directly into the route, and `src/lib/tower/` carries ~11 `shell-*-fixture.ts` files. There is a `DemoDataBanner` component — to its credit, the product *labels* demo rows. Tower cannot be real until a funded Move runs in production and produces actuals. It is honestly a placeholder for the most important compounding asset. |

**Net read of the map:** One surface (Moves) has a proven mechanism. The other three have credible architecture and good specs but are validated only against fixtures. The thesis depends on all four; the evidence supports one.

---

## 4. Realness read

**The good — and it is genuinely good.** The "no fabrication" claim is not marketing; it is enforced in code. I traced it:

- `src/lib/programs/expert-kernel/baseline-model.ts` records absent metrics as `not_recorded` with a `seedGapReason`.
- `value-forecast.ts` sets `monetisationBlocked` when gross value rests on a proxy (`grossValueIsProxy: true` in the Apex case).
- `critic.ts` raises a **blocker** (`cfo_monetisation_blocked`) when monetisation is blocked.
- `business-case-compiler.ts` lets that blocker downgrade the recommendation from `fund` to `shape`, and `buildWhatBreaks()` says so plainly.
- The Apex artifact then prints: *"Payback is not computable — and that is the honest answer."*

`APEX-REALNESS-AUDIT-CONTACT-CENTER.md` is an honest, per-data-point audit that explicitly says cost-per-contact, contact volume, channel mix, and QA error rate are **absent seed gaps**, names the tenant action item and owner, and refuses to fabricate. The Meridian case file explicitly *rejects* its own KPI dictionary as untrustworthy and uses an evidence base instead. This is the discipline of a team that takes the problem seriously. It is the single strongest signal in the diligence.

**The gap — and it is the round-defining one.** "Grounded in real tenant substrate" is true at *anchor depth*, not at *product depth*:

- The three Moves cases are **authored anchors**. `apex-contact-center-case.ts` has the metrics, assumptions, workstreams, and rate card *typed into the file by hand*, referencing seed data — it is not a function that queries Apex's live DB for an arbitrary Move and grounds a case. The kernel is real; the *grounding pipeline from live tenant data to a case* is demonstrated on three curated examples, not generalized.
- The rate cards are `demoKernelRateCard(...)` — explicitly "a demo pack, not a production client rate card" (the code comments say so). Every costed number in every artifact rests on a benchmark demo rate card. A CFO funds against *their* rate card. That override path is specced (`MOVES-BOARD-GRADE-ARTIFACT-BLUEPRINT.md` §8 hard-fails it if missing) but not exercised with a real one.
- Source and Tower lean on fixtures (`shell-source-fixture.ts`, `mock-seed.ts`, `apex-contact-center-portfolio-fixture.ts`, ~11 Tower `shell-*` files) imported directly into route code.
- Intelligence is corpus/content-driven; realness there is "is the seeded content good," not "is it grounded in live tenant telemetry."

**Honest summary:** AbarVa is *honest about missing data within a case* (excellent) but the *narrative is ahead of the product about how much of the four-surface experience is live vs. fixture* (the risk). The product does not paper over missing metrics; the pitch may paper over how much is demoware. A diligence-grade founder conversation must separate "the kernel is real" (true) from "the decision OS is live across four surfaces" (not yet).

---

## 5. Scorecard

| Dimension | Score | Justification |
|---|---:|---|
| **Vision** | 8/10 | "Decision OS / context layer for enterprise AI bets" is a real, large, board-relevant job; the four-surface decomposition is coherent. Capped below 9 because the vision currently outruns the built product by ~3 surfaces. |
| **Capability → outcome fit** | 6/10 | Moves' kernel genuinely produces a costed, self-critiqued case (proven mechanism). The other three surfaces are plausible-not-proven, and *no* surface has moved a real customer outcome. Strong on one of four. |
| **Realness** | 6/10 | Best-in-class honesty *inside* a case (seed gaps, blocked monetisation, the critic). But authored anchors, demo rate cards, and fixture-backed Source/Tower mean the "live tenant-grounded OS" claim is partly aspirational. Two scores fighting each other; 6 is the blend. |
| **Differentiation / moat** | 6/10 | The deterministic self-critiquing kernel + artifact rigor is real differentiation a model vendor won't casually replicate. But the compounding moat (calibrated priors from realized outcomes) has zero data. Head start, not yet moat. |
| **Value defensibility** | 5/10 | The product is *honest* that it cannot yet prove dollar value — the Apex case refuses to state payback. Intellectually correct, commercially unproven: there is no realized-outcome evidence, no paying customer, no real rate card. The value story is tight in *method* and empty in *proof*. |
| **Team / execution signal** | 8/10 | Inferred from codebase quality: pure deterministic modules, ~35 kernel/Source test files, an explicit "kernel first, UI later" build discipline, a critic loop that genuinely changes the answer, honest audit docs that name their own gaps. This is a disciplined, senior team. The strongest score and the main reason to fund. |

**Composite read:** a high-vision, high-execution team that has built one genuinely excellent thing and a credible architecture for three more, with no customer validation yet. Classic "fund the team and the wedge, gate on proof."

---

## 6. Ranked improvement backlog

### Axis A — Capabilities (what the product cannot yet do, or does shallowly)

1. **No live tenant-data-to-case grounding pipeline.** The three Moves cases are hand-authored anchor files (`apex-contact-center-case.ts` et al.). There is no generalized path: "point the kernel at tenant X's Move Y, pull the baseline from their live substrate, ground a case." *Why it costs the round:* a VC asks "what happens with my data?" and the honest answer today is "we hand-author an anchor." *Fix:* build the substrate adapter that turns an arbitrary tenant Move into kernel inputs, with the same seed-gap honesty; prove it on a fourth tenant nobody curated.

2. **The calibration flywheel has no fuel.** `outcome-calibration.ts` is well-shaped but compares forecast to actuals that do not exist — Tower has zero realized outcomes. *Why it costs the round:* the entire moat thesis is "priors compound across tenants"; an empty flywheel is a promise, not an asset. *Fix:* get one funded Move into production and run one real forecast-to-actual cycle, even partial. Until then, label the flywheel as unproven in every investor doc.

3. **Intelligence and Source lack a kernel of Moves' caliber.** Moves has a deterministic, tested, self-critiquing kernel. Intelligence appears content-driven; Source's judgment kernel is good but its data layer is fixtures. *Why it costs the round:* a four-surface "decision OS" priced on one good surface is a feature wearing a platform's clothes. *Fix:* either (a) extend the kernel pattern — deterministic, tested, self-critiquing — to Source and Intelligence, or (b) re-pitch honestly as "Moves is the product; the others are roadmap."

### Axis B — Experience (where it fails to feel like a tool a VP/CXO lives in daily)

1. **Artifacts are 7-8/10, not the 9+ the blueprint demands for "board-grade."** The samples are good and honest, but charts are CSS/HTML constructs, density is below a real MBB exhibit, and the blueprint's own §12 sets board-grade at 9+. *Why it costs the customer:* a CFO circulates a deck that *looks* auto-generated and the credibility leaks. *Fix:* invest in genuine exhibit-grade rendering (real charting, tighter typographic hierarchy, MBB-density layouts); the blueprint already specifies the bar — meet it.

2. **No evidence the live four-surface experience is navigable as a daily console.** `PRACTITIONER-FIT-DESIGN.md` is an excellent spec and `/source` correctly redirects to the queue, but with fixture tenants the queue demonstrates a console rather than runs one; Tower ships a `DemoDataBanner` because most rows are demo. *Why it costs the customer:* "a tool I live in daily" requires real triggers from real contract/renewal dates — fixtures cannot generate genuine urgency. *Fix:* onboard one real tenant's `vendor_contracts` and `it_financials` so the queue fires on real notice windows; that is the experience proof point.

3. **Agent risk: generic-feeling assistant across surfaces.** `MEMORY` flags multiple agent-chat design concerns (Ask-Anything toolbar, bubble truncation, scaffold collapse) and the Source index uses a static `agentQuote` string in a fixture. *Why it costs the customer:* if the agent feels like a generic chatbot bolted onto each surface, the "decision OS" feeling collapses into "another copilot." *Fix:* make the agent visibly *the interface over the kernel* — it should cite kernel modules, surface the critic's findings, and behave per-surface, not free-form.

### Axis C — Value (where the economic-value case is weak, untested, unprovable)

1. **Zero realized-outcome proof; no paying customer.** The product is intellectually honest that it cannot yet state Apex's payback — but commercially that means there is *no* defensible economic-value claim anywhere. *Why it costs the round:* "we create six/seven-figure value" with zero evidence is a pre-revenue assertion, and the round will be priced as pre-revenue. *Fix:* one paid pilot with a signed value hypothesis and a Tower measurement plan; even a forecast a customer *agreed to* is worth more than three perfect anchors.

2. **Every costed number rests on a demo rate card.** `demoKernelRateCard()` is explicitly "not a production client rate card." A business case is its rate card; a CFO funds against theirs. *Why it costs the customer:* the moment a real CFO swaps in real rates, every number in every artifact moves — and the product has never been pressure-tested through that. *Fix:* run one full case end-to-end on a real client rate card via the specced override path; make that the canonical sample, retire the demo-rate anchors as the headline.

3. **The "consultant-displacement" value framing is unpriced and unbenchmarked.** The implicit value story is "cheaper and always-on vs. a Big-4 engagement," but there is no ROI model, no benchmark of what the displaced spend is, no pricing tied to it. *Why it costs the round:* a VC needs to see ARR logic — what does a tenant pay, against what alternative, with what gross margin. *Fix:* build a defensible pricing model anchored to displaced advisory/decision-cost spend, and validate it in the first paid-pilot conversation.

---

## 7. Two scenarios

**What would make me pass.** Six months out, AbarVa still has no paying customer; the three Moves cases are still hand-authored anchors with no live-data grounding pipeline; Source and Tower are still fixture-backed; the calibration flywheel still has zero actuals; and the pitch still sells "four-surface decision OS" without separating built from roadmap. At that point this is an excellent kernel and an excellent set of strategy docs in search of a company — a feature (the costed-business-case generator) over-narrated as a platform. I pass, because the moat is entirely unbuilt and the team has had the runway to build the wedge proof and chose breadth over depth.

**What would make me lead the round.** AbarVa lands one real enterprise pilot, pulls that tenant's live substrate through a generalized grounding adapter (not a hand-authored anchor), produces a costed business case on the customer's *own* rate card, the customer's CFO accepts it as decision-grade, the Move gets funded, and within two quarters Tower captures even a partial forecast-to-actual cycle that feeds `outcome-calibration.ts`. At that point the wedge is proven, the flywheel has its first fuel, and the four-surface vision has one real spoke and a credible path to the rest. That is a company, and the kernel's honesty discipline becomes a durable trust moat. I lead.

---

## Appendix — what I verified vs. inferred

**Verified (read the code/docs/artifacts):** the Expert Kernel module decomposition and determinism; `critic.ts` genuinely raising a blocker that downgrades the recommendation; `value-forecast.ts` six-factor haircut and `monetisationBlocked` logic; the three tenant case anchors being distinct and substrate-referenced; all 8 artifact samples' structure and the honest "SHAPE / payback blocked" verdict; the seed-gap honesty in `baseline-model.ts` and `APEX-REALNESS-AUDIT-CONTACT-CENTER.md`; Source/Tower fixture imports in route code; `~35` kernel/Source test files; the kernel-first build discipline in the specs.

**Inferred (could not drive the live app from this environment):** the live four-surface navigation feel; whether the artifacts render board-grade in a browser; the Intelligence funnel's runtime behavior; whether the Source Decision Queue fires meaningfully against the seeded tenants; agent-chat interaction quality. These are inferred from route code, components, specs, and the committed HTML samples, and should be confirmed by a live walkthrough across all three tenants before final IC.

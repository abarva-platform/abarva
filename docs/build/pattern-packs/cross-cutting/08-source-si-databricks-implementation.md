# Pattern Pack 08 — Source / SI Selection & Databricks Implementation Procurement (`SISRC`)

**Pack code:** `SISRC`
**Layer:** Cross-cutting (horizontal · the Source/procurement spine that turns a Move into a sourced, contracted build)
**Created:** 2026-06-06

---

## What this pack covers

This is the **selection and procurement spine for sourcing a Databricks lakehouse implementation** — the discipline that turns a Move's architecture and business case into an RFP, a scored field of system integrators (SIs), and a signed contract that **transfers the asset and the IP to the client.** Where the ARCH / INGEST / MODEL / MLOPS / GOV packs say *what to build*, and FINOPS says *what it costs*, this pack says *who builds it, on what terms, and how the client ends up owning it.*

It is the operating layer of AbarVa's **Source** surface (fronted by Sentinel), and it is where the OWN-IT-vs-RENT first principle is made contractual rather than aspirational. An architecture can be perfectly own-it on paper and still hand the client a vendor-locked outcome if the contract assigns the accelerator IP to the SI, lets the SI hold the credentials, or has no exit terms. **This pack exists so the contract enforces what the architecture intends.**

### The first principle, made contractual

The README's test — *after this is built, who owns the data products, the models, and the IP?* — is answered in a **contract**, not a diagram. This pack's spine pattern (`SISRC-06`, IP-transfer) is the procurement-side enforcement of INGEST's own-it framing: the accelerators, frameworks, pipeline code, notebooks, and configuration the SI builds or brings **assign to the client**, deployed into the **client's own Databricks workspace and Unity Catalog**, so the intelligence never lives on the vendor's side. Every other pattern (lanes, scoring, contracting model, BAFO, exit terms, SOW, BAA, knowledge transfer) either protects that transfer or makes the selection that leads to it credible.

The disqualifying outcome to design against: an SI engagement that leaves the pipelines, the models, and the operational knowledge in the SI's heads and the SI's repos, so the client cannot run, change, or exit the platform without re-hiring the same SI. That is the **RENT trap on the services side** — and it is just as fatal to an own-it mandate as renting a closed SaaS analytics platform.

### How to read the Own-it field in this pack

For a procurement pack, "own-it" is a **contractual posture**:

- **OWN** — the contract assigns the asset/IP to the client and it is delivered into the client's estate; the client can run, modify, and exit without the vendor (e.g. IP assignment of custom code; deployment into the client workspace).
- **MANAGED-OWN-DESTINATION** — a vendor operates or supplies something, but the data, the deployed asset, and the right to exit land with the client (e.g. a managed-service run-phase with a contractual exit + knowledge-transfer that returns operations to the client).
- **RENT / DISQUALIFIED** — the contract leaves the asset, the IP, the credentials, or the operational knowledge on the vendor's side with no exit; disqualified for an own-it mandate, flag explicitly with surfaced rationale.

### Benchmark-source note

Quantitative ranges (blended rates, weighting splits, contingency bands) are anchored to public references where possible (Databricks partner-program structure, Gartner/Forrester SI-evaluation practice, public services-procurement norms) and to AbarVa's loaded rate cards. **Every rate, percentage, and benchmark must be re-confirmed against the client's loaded rate cards, the SI's submitted rates, and the live market at the time the RFP is run** — services rates and partner tiers move. Unsourced numbers are flagged inline as *estimate — confirm.*

---

## Pattern index

| ID | Name | Maturity |
|---|---|---|
| SISRC-01 | RFP scope decomposition — platform / SI-build / managed-service lanes | Production-ready |
| SISRC-02 | SI capability scorecard — Databricks + HLS + security evidence | Production-ready |
| SISRC-03 | Evaluation rubric + weighting | Production-ready |
| SISRC-04 | Rate-card guardrails + blended-rate benchmarks | Production-ready |
| SISRC-05 | Contracting model — fixed vs T&M vs outcome-based | Production-ready |
| SISRC-06 | IP-transfer clause — the asset assigns to the client (the spine) | Production-ready |
| SISRC-07 | Build-vs-buy-vs-partner disposition | Production-ready |
| SISRC-08 | SOW + acceptance criteria | Production-ready |
| SISRC-09 | Data-processing / BAA / security terms | Production-ready |
| SISRC-10 | Vendor concentration + exit terms | Production-ready |
| SISRC-11 | BAFO levers — negotiating the best and final offer | Production-ready |
| SISRC-12 | Reference-check protocol | Production-ready |
| SISRC-13 | Transition / knowledge-transfer + capability build | Production-ready |
| SISRC-14 | Move → Source spawn hand-off (pre-filled facts) | Emerging |
| SISRC-15 | Subcontractor / offshore disclosure + data-handling chain | Emerging |
| SISRC-16 | Pricing-comparison normalization across bidders | Production-ready |

---

### PATTERN SISRC-01 · RFP scope decomposition — platform / SI-build / managed-service lanes

**Intent** — Decompose the engagement into clearly-separated procurement lanes — the **platform** (Databricks + cloud), the **SI build** (implementation services), and the optional **managed-service run** — so each is sourced, priced, and contracted on its own terms instead of buried in one opaque bundle that hides cost and locks the client in.

**Applies to** — Every Databricks-implementation sourcing. The structural first move of the RFP. Lifecycle: Source (RFP design). Composes with SISRC-05, SISRC-07, SISRC-10.

**Solution shape** — Split the RFP into three explicit lanes:
1. **Platform lane** — the Databricks platform commitment (DBU consumption / commit) and the cloud (AWS/Azure) accounts and services. Procured **directly with Databricks and the cloud provider** so the platform contract and the consumption commit sit with the client, not resold through the SI (avoiding margin-on-platform and a dependency where the client's platform relationship runs through the SI).
2. **SI-build lane** — the implementation services: landing zone, ingestion, modeling, MLOps, governance, enablement. This is the lane SISRC-02/03 scores and SISRC-05 contracts.
3. **Managed-service / run lane (optional)** — post-go-live operation. Procured separately and **with an exit** (SISRC-10/13) so a run-phase decision does not become permanent lock-in.

Keeping the platform contract with the client (not resold by the SI) is itself an own-it move: the client owns the Databricks and cloud relationship, the commit, and the workspace. The SI builds *into* the client's platform; it does not *hold* it.

**Own-it vs rent** — **OWN.** Separated lanes keep the platform and the data in the client's accounts and let the client exit the build or run lane without losing the platform. **RENT trap:** one bundled "we'll host and run everything" contract where the SI resells the platform, holds the accounts, and the client has no separable exit.

**Where it sits** — Source/procurement; sets up the whole RFP. Lifecycle: Source.

**Evidence anchors** — Databricks and cloud-provider direct-commit / partner-resale models (confirm the client's preferred contracting path with Databricks); standard practice of separating platform, build, and run procurement to avoid bundled lock-in. Lane definitions map to the FINOPS-03 build-vs-buy-vs-partner TCO model.

**Anti-patterns** — *The opaque bundle:* one lump contract covering platform + build + run with no line-item separability — hides margin, prevents lane-level exit, and routes the platform relationship through the SI. *SI-resold platform:* the client's Databricks/cloud commit bought through the SI, so the client doesn't own the platform relationship. *No run-lane exit:* a managed-service lane with no defined exit, quietly becoming permanent.

**Feeds artifacts** — Source RFP structure; the lane-by-lane SOW (SISRC-08); the TCO comparison (FINOPS-03); vendor-concentration analysis (SISRC-10).

**Maturity** — Production-ready.

---

### PATTERN SISRC-02 · SI capability scorecard — Databricks + HLS + security evidence

**Intent** — Score candidate SIs on **evidenced** capability — verified Databricks competency, demonstrated healthcare/HLS delivery depth, and concrete security/compliance evidence — not on logos and a polished deck, so the selection rests on proof the SI can actually deliver this build for this client.

**Applies to** — Every SI selection. The capability dimension of the evaluation rubric (SISRC-03). Lifecycle: Source (evaluation). Composes with SISRC-03, SISRC-12.

**Solution shape** — Score each bidder on evidenced dimensions, each requiring a citation not a claim:
- **Databricks competency (verified)** — the SI's **Databricks partner tier** (e.g. Registered / Select / Elite consulting partner — confirm current program names), the count of **certified** practitioners (Databricks Certified Data Engineer / ML / Platform Architect), and named, recent Databricks lakehouse deliveries (Unity Catalog, Lakeflow/DLT, Mosaic AI — the actual stack in the architecture). A logo on a partner page is not evidence; a certification count and a reference engagement (SISRC-12) is.
- **Healthcare / HLS depth** — demonstrated delivery for covered entities / payers: PHI handling, EHR source integration (Epic Clarity/Caboodle, claims), clinical/payer data models (OMOP, FHIR, HEDIS), and familiarity with the domain patterns this build uses. Healthcare delivery is materially different from generic data engineering; score it explicitly.
- **Security / compliance evidence** — the SI's own posture: **HITRUST CSF certification**, SOC 2 Type II, ISO 27001, willingness and ability to sign a **BAA** (SISRC-09), and evidence of secure-delivery practices (how their engineers handle client PHI during the build). For a healthcare lakehouse, an SI that cannot sign a BAA or evidence HITRUST/SOC 2 is disqualified from PHI-touching work.
- **Delivery model & continuity** — onshore/nearshore/offshore mix (SISRC-04/15), named key personnel with continuity commitments, and attrition/bench depth.

Score on a defined scale with the **evidence reference** captured per cell, so the scorecard is auditable.

**Own-it vs rent** — **OWN (the selection IP).** The scorecard, evidence, and rationale are the client's procurement record. The pattern protects own-it by selecting an SI **capable of delivering into the client's estate and transferring the asset** (SISRC-06) — a low-capability SI is more likely to leave a brittle, undocumented, vendor-dependent build.

**Where it sits** — Source/procurement (evaluation). Lifecycle: Source.

**Evidence anchors** — Databricks partner program tiers + certification scheme (confirm current names/levels with Databricks); HITRUST CSF / SOC 2 Type II / ISO 27001 as the recognized SI-security evidence; Gartner/Forrester SI-evaluation practice (capability evidenced, not asserted). Certification counts and tier are *confirm from the SI's submission + Databricks verification.*

**Anti-patterns** — *Logo-driven selection:* picking the SI with the best slideware and the biggest brand, not the best evidence for *this* stack and *this* domain. *Generic-data-engineering SI on a PHI build:* an SI with no healthcare/PHI delivery and no BAA capability scoring well on raw data-engineering chops. *Unverified competency:* taking "we're a Databricks partner" at face value with no tier, certification count, or reference. *Bait-and-switch personnel:* scoring the named senior team that then never staffs the engagement (mitigated by SISRC-08 key-personnel + SISRC-12 references).

**Feeds artifacts** — Source SI scorecard; the capability inputs to the rubric (SISRC-03); reference-check targeting (SISRC-12); the SOW key-personnel clause (SISRC-08).

**Maturity** — Production-ready.

---

### PATTERN SISRC-03 · Evaluation rubric + weighting

**Intent** — Define, **before bids arrive**, the scoring rubric and the weights across capability, approach, price, security, and own-it/IP terms — so selection is a defensible, weighted decision against pre-committed criteria, not a post-hoc rationalization for a favored bidder.

**Applies to** — Every competitive SI selection. The decision framework the scorecard (SISRC-02) and pricing (SISRC-16) feed. Lifecycle: Source (evaluation design → scoring).

**Solution shape** — Publish a weighted rubric with the weights fixed before bids open. A reference weighting (illustrative — *confirm with client procurement policy*):

| Dimension | Weight | Sourced from |
|---|---|---|
| **Capability & evidence** (Databricks, HLS, security) | ~25–30% | SISRC-02 |
| **Solution approach & methodology** (how they'll build it, the architecture fit) | ~20% | Bid + architecture review |
| **Price / total cost** (normalized) | ~20–25% | SISRC-16, SISRC-04 |
| **Own-it / IP-transfer & exit terms** | ~10–15% | SISRC-06, SISRC-10 |
| **Security / compliance & BAA** | ~10% | SISRC-02, SISRC-09 |
| **Team, continuity & references** | ~10% | SISRC-02, SISRC-12 |

The explicit own-it/IP weighting is what makes the first principle a *scored* criterion rather than a hope: a bidder whose terms leave the IP and credentials on their side loses points on a published dimension. Price is weighted but **not dominant** — a cheap bid that locks the client in is correctly scored down on the IP/exit dimension. Score independently per evaluator, then reconcile, with the rubric and scores recorded as the procurement audit trail.

**Own-it vs rent** — **OWN.** The rubric and the weighted scores are the client's procurement decision record. The pattern *operationalizes* own-it by giving it weight in the score.

**Where it sits** — Source/procurement (evaluation framework). Lifecycle: Source.

**Evidence anchors** — Standard weighted-rubric procurement practice (best-value source selection — capability and price weighted, not low-bid-wins); Gartner/Forrester evaluation methodology. Weights are *illustrative — confirm with client procurement policy and any public-procurement rules that apply.*

**Anti-patterns** — *Weights set after bids open:* tuning the rubric to favor the bidder you already picked — indefensible and, in regulated procurement, non-compliant. *Lowest-price-wins:* ignoring capability, IP, and exit because price is the only scored axis — the classic way to buy a cheap lock-in. *Own-it unscored:* a rubric with no IP/exit dimension, so the first principle has no teeth in the actual decision. *Single-evaluator scoring:* one person's preference dressed as a rubric.

**Feeds artifacts** — Source evaluation rubric + scoring record; the selection decision memo; the negotiation priorities for BAFO (SISRC-11).

**Maturity** — Production-ready.

---

### PATTERN SISRC-04 · Rate-card guardrails + blended-rate benchmarks

**Intent** — Anchor SI labor pricing to a governed rate card and market blended-rate benchmarks, so submitted rates are sanity-checked against reality and the delivery mix (onshore/nearshore/offshore) is priced honestly — the procurement-side complement to FINOPS-01.

**Applies to** — Every SI bid with a labor component (all of them). Lifecycle: Source (pricing evaluation) → negotiation. Composes with FINOPS-01, SISRC-16, SISRC-11.

**Solution shape** — Evaluate SI rates against guardrails:
- **Role × location-tier rate matrix** — require bidders to submit rates per role (Engagement Lead, Solution Architect, Data Engineer, ML Engineer, Platform/DevOps, Governance Lead, BA/PM, QA) per location tier (onshore / nearshore / offshore), not a single blended number — so the blend is transparent and the mix is negotiable (SISRC-11).
- **Blended-rate benchmark** — compare each bidder's blend to market. Illustrative US-market benchmark shape (*estimate — confirm with current market + client rate cards*): onshore senior data/ML engineer ~$180–260/hr; nearshore ~$90–140/hr; offshore ~$45–80/hr; a typical blended delivery rate for a healthcare data-engineering build often lands ~$120–180/hr depending on mix and seniority. Rates significantly above benchmark need justification; significantly below may signal a junior-heavy team or a hidden change-order strategy.
- **Mix realism** — a bid claiming a heavy-offshore (cheap) blend but staffing the actual work onshore is a change-order risk; tie the submitted blend to the SOW (SISRC-08) and acceptance.
- **Rate-card governance** — cross-check against AbarVa's / the client's loaded rate cards (FINOPS-01) as the internal reference.

**Own-it vs rent** — **OWN (method).** The rate matrix, benchmarks, and the governed rate card are the client's evaluation IP; no vendor lock on the math.

**Where it sits** — Source/procurement (pricing). Lifecycle: Source + negotiation.

**Evidence anchors** — Client's / AbarVa's loaded rate cards (FINOPS-01) as primary; public IT-services blended-rate benchmarks for sanity-check. **All rate figures above are illustrative — confirm against the client's rate cards and the bidders' submitted rates at RFP time.**

**Anti-patterns** — *Single blended number:* a bid quoting one rate with no role/location decomposition — un-auditable and un-negotiable. *Lowball-then-change-order:* a suspiciously low blend that becomes expensive through scope changes once the SI is entrenched (mitigated by SISRC-05 fixed-scope + SISRC-08 acceptance). *Mix bait-and-switch:* a cheap offshore blend on paper, onshore staffing in practice. *Rate drift:* evaluating against a stale internal benchmark.

**Feeds artifacts** — Source pricing evaluation; the normalized price comparison (SISRC-16); BAFO rate/mix levers (SISRC-11); the labor line of the business case (FINOPS-01).

**Maturity** — Production-ready.

---

### PATTERN SISRC-05 · Contracting model — fixed vs T&M vs outcome-based

**Intent** — Choose the contract structure deliberately by where the risk and the uncertainty sit — fixed-price, time-and-materials, or outcome/milestone-based — so risk is allocated to the party best able to control it, rather than defaulting to whatever the SI prefers.

**Applies to** — Every SI build engagement. Lifecycle: Source (contracting) → Mobilization (execution). Composes with SISRC-08, SISRC-11, FINOPS-03.

**Solution shape** — Match the model to the workstream's uncertainty:

| Model | Best for | Risk sits with | Watch-outs |
|---|---|---|---|
| **Fixed-price (milestone)** | Well-specified workstreams with a clear SOW + acceptance (landing zone, a defined ingestion set) | SI (delivery risk) | Change-order leakage if scope is vague; pad in the price; rigidity on genuine discovery |
| **Time & materials (T&M, capped)** | Genuinely uncertain/discovery work (exploratory modeling, a novel source) | Client (overrun risk) | Burn with no incentive to be efficient; mitigate with a **not-to-exceed cap** + sprint reviews + SISRC-08 acceptance |
| **Outcome / milestone-based** | Work with a measurable deliverable or business outcome | Shared | Hard to define a fair, gameable-proof outcome metric; over-engineering the metric |

The common best structure is a **hybrid**: fixed-price for the well-specified foundation (landing zone, governance baseline, a defined ingestion scope) with **milestone payments tied to acceptance criteria (SISRC-08)**, and **capped T&M** for the genuinely discovery-heavy parts, with sprint reviews. Avoid pure open-ended T&M (no client risk control) and avoid fixed-price on truly unknown scope (priced with a huge risk premium or bled dry by change orders). **Tie payment to accepted deliverables**, never to elapsed time or effort alone.

**Own-it vs rent** — **OWN (the contract terms).** The structure is the client's risk-allocation decision. Milestone-on-acceptance with IP transfer (SISRC-06) at each milestone keeps the asset flowing to the client as it's built, not held hostage to a final payment.

**Where it sits** — Source/procurement (contracting). Lifecycle: Source + Mobilization.

**Evidence anchors** — Standard services-contracting risk-allocation practice (fixed = SI risk, T&M = client risk, outcome = shared); FINOPS-03 (the TCO model that the contract structure prices); milestone-on-acceptance norms. Contingency/risk-premium bands are *estimate — confirm.*

**Anti-patterns** — *Open-ended T&M:* uncapped, no acceptance, no efficiency incentive — the client carries all overrun risk and the SI has none. *Fixed-price on unknown scope:* either a giant risk premium or a change-order machine. *Payment on time, not deliverable:* paying for months elapsed rather than accepted work. *Outcome metric the SI controls:* an "outcome-based" deal whose metric the SI can game.

**Feeds artifacts** — Source contract structure; the payment-milestone schedule tied to SISRC-08; BAFO negotiation (SISRC-11); the cashflow timing in the business case (FINOPS).

**Maturity** — Production-ready.

---

### PATTERN SISRC-06 · IP-transfer clause — the asset assigns to the client (the spine)

**Intent** — Make the contract **assign ownership of the delivered asset and IP to the client** — the accelerators, frameworks, pipeline code, notebooks, configuration, and documentation built for or deployed into this engagement — so the intelligence the client paid for lives in the client's estate and the client can run, modify, and exit without the SI. **This is the procurement enforcement of the OWN-IT first principle.**

**Applies to** — Every SI build engagement under an own-it mandate. **The spine pattern of this pack.** Lifecycle: Source (contracting) → Mobilization (delivery). Composes with INGEST own-it framing, SISRC-08, SISRC-10, SISRC-13.

**Solution shape** — The contract's IP and deliverables clauses must establish, unambiguously:
1. **Work-product assignment** — all custom code, pipelines (Lakeflow/DLT, notebooks, jobs), data models, configuration, and documentation **created for this engagement** are **works made for hire / assigned to the client** on creation or payment — the client owns them outright.
2. **Deployed into the client's estate** — the asset is delivered into the **client's own Databricks workspace and Unity Catalog and cloud account** (composes SISRC-01 platform-lane), not held in the SI's tenant or repos. The client holds the credentials and the repos.
3. **Accelerator / framework IP** — where the SI brings a **pre-existing accelerator or framework** (its own background IP), the contract grants the client a **perpetual, irrevocable, royalty-free license** to use, modify, and maintain the *deployed instance* — and, for an own-it mandate, **prefer accelerators that are open-source or whose deployed output is fully client-owned** (e.g. an SI that deploys an Apache-licensed metadata-driven framework like `dlt-meta` into the client's workspace, vs. one whose proprietary accelerator the client may only use while paying the SI). Background IP the SI retains must never be a runtime dependency the client can't operate without.
4. **Source + documentation delivery** — the client receives the **source** (not just compiled/locked artifacts), the runbooks, and the architecture/decision documentation, sufficient to operate and modify the platform independently (ties to SISRC-13).
5. **No call-home / no vendor-side dependency** — the delivered platform must not depend on the SI's hosted service, license server, or credentials to run.

The disqualifying contract is one where the SI's accelerator IP **does not** assign or license perpetually, where the asset lives in the SI's repos/tenant, or where the client cannot get the source — because then the client has paid to build intelligence that lives on the vendor's side. That is the services-RENT trap, and SISRC-06 is the clause that prevents it.

**Own-it vs rent** — **OWN — this is the pattern that makes own-it real.** The contract assigns the asset and IP to the client and delivers it into the client's estate. **RENT / DISQUALIFIED:** any clause that retains the engagement IP with the SI, holds the asset in the SI's tenant, withholds source, or makes the platform depend on the SI to run — flag explicitly; an own-it mandate cannot accept it without surfaced rationale.

**Where it sits** — Source/procurement (the IP clause); enforced through Mobilization delivery. Lifecycle: Source + Mobilization.

**Evidence anchors** — Work-made-for-hire / IP-assignment contracting practice; the README's worked own-vs-rent example (`dlt-meta` Apache-licensed, deployed into the client's UC — verified 2026-06-06) as the model for accelerator-IP posture; INGEST pack own-it framing. The license posture of any specific SI accelerator must be *confirmed in the contract.*

**Anti-patterns** — *Accelerator lock-in:* the SI's proprietary framework the client may use only while the SI is engaged — the intelligence stays on the vendor's side. *Asset in the SI's tenant:* pipelines and repos that live in the SI's environment, not the client's. *No source delivery:* the client gets dashboards and compiled artifacts but not the code, so it can't modify or exit. *Call-home dependency:* the platform stops working if the SI's license server or hosted service is withdrawn. *IP assignment gated on final payment with no milestone transfer:* the asset held hostage.

**Feeds artifacts** — Source IP-transfer clause (the contract centerpiece); the architecture own-it assertion; the exit-terms package (SISRC-10); the knowledge-transfer deliverables (SISRC-13); Business case (IP retention as the durable value).

**Maturity** — Production-ready.

---

### PATTERN SISRC-07 · Build-vs-buy-vs-partner disposition

**Intent** — For each capability in scope, make an explicit build (in-house) / buy (product) / partner (SI-delivered) disposition, defended against the own-it test and the TCO, so the sourcing decision is deliberate per component rather than "hire an SI to do all of it."

**Applies to** — The scope-shaping step before the RFP lanes (SISRC-01). Lifecycle: Source (disposition) → drives the RFP. Composes with FINOPS-03, SISRC-01, SISRC-06.

**Solution shape** — For each capability (landing zone, ingestion framework, data models, MLOps, governance, a domain analytic), decide:
- **Build (in-house)** — when the capability is core/differentiating and the client has or wants the skill; maximizes own-it and capability build (SISRC-13).
- **Buy (product)** — when a commodity capability has a mature product **whose output the client owns** (an own-it product) — but apply the README test: a "buy" that ingests the client's data onto the vendor's platform and returns dashboards (Innovaccer / Health Catalyst / Arcadia-style) is **RENT**, disqualified for an own-it mandate. A "buy" that runs in the client's estate and whose data/config the client owns can qualify.
- **Partner (SI-delivered)** — when the client needs delivery velocity/expertise it doesn't have, **with IP transfer (SISRC-06)** so the partner builds an asset the client ends up owning — the velocity of partner with the ownership of build.

The default disposition for an own-it mandate: **partner-to-build** — an SI delivers it fast, but under SISRC-06 the asset and capability transfer to the client, so the client ends up owning what was partner-delivered. Pure "buy a closed platform" is the disposition the first principle pushes against.

**Own-it vs rent** — **OWN / RENT, decided per capability.** The disposition record states, for each component, who owns the data/model/IP after — the README test applied component-by-component.

**Where it sits** — Source/procurement (scope disposition); feeds the RFP lanes. Lifecycle: Source.

**Evidence anchors** — FINOPS-03 (build-vs-buy-vs-partner TCO model — the financial proof); README own-vs-rent first principle + the Innovaccer/Health-Catalyst/Arcadia RENT example (verified 2026-06-06). Disposition is qualitative + TCO-driven.

**Anti-patterns** — *Default-to-SI-everything:* partnering the whole scope including core/differentiating capability the client should own and build. *RENT-as-buy:* classifying a closed data-onto-vendor-platform SaaS as a clean "buy" without applying the own-it test. *Build-the-commodity:* hand-building a mature commodity capability for no differentiation. *No disposition record:* the build/buy/partner split never explicitly decided or defended.

**Feeds artifacts** — Source disposition matrix; the RFP lane structure (SISRC-01); the TCO comparison (FINOPS-03); the architecture make/use decisions.

**Maturity** — Production-ready.

---

### PATTERN SISRC-08 · SOW + acceptance criteria

**Intent** — Define a statement of work with **deliverable-level, testable acceptance criteria** and key-personnel commitments, so "done" is objective and verifiable, payment ties to accepted deliverables, and the SI cannot declare victory on incomplete or low-quality work.

**Applies to** — Every SI build engagement. The execution contract behind the contracting model (SISRC-05). Lifecycle: Source (drafting) → Mobilization (acceptance). Composes with SISRC-05, SISRC-06, SISRC-09.

**Solution shape** — The SOW specifies, per deliverable/workstream:
- **Scope & deliverables** — concrete artifacts (the landing zone, the ingestion pipelines for named sources, the data models, the MLOps setup, the governance baseline, the documentation/runbooks for SISRC-13), each delivered **into the client's estate** (SISRC-06).
- **Testable acceptance criteria** — objective, verifiable conditions per deliverable: pipelines pass defined data-quality checks; the compliance readiness gate (GOV-16) passes; documented runbooks exist; performance/SLA targets met; source code delivered. "The client agrees it's done" is not a criterion — measurable conditions are.
- **Milestone → payment linkage** — payment releases on **acceptance** (SISRC-05), with IP transfer at each milestone (SISRC-06), so quality and ownership flow together.
- **Key personnel + continuity** — the named senior team is committed to the engagement with continuity/replacement-approval terms — preventing the bait-and-switch where the proposal team vanishes (ties to SISRC-02).
- **Change control** — a defined change-order process so scope changes are explicit and priced, not absorbed silently or used to inflate cost.

**Own-it vs rent** — **OWN.** The SOW, acceptance criteria, and the accepted deliverables are the client's. Acceptance-gated, into-the-estate delivery is how the asset actually lands with the client rather than notionally.

**Where it sits** — Source/procurement (SOW) → Mobilization (acceptance). Lifecycle: Source + Mobilization.

**Evidence anchors** — Standard SOW + acceptance-testing practice; the compliance readiness gate (GOV-16) as a natural acceptance criterion for a PHI build; deliverable-on-acceptance payment norms. Acceptance thresholds are engagement-specific.

**Anti-patterns** — *Vague deliverables:* "implement a data platform" with no testable conditions — impossible to accept or reject objectively. *Subjective acceptance:* "to the client's satisfaction" with no measurable bar — disputes and disputes. *Payment decoupled from acceptance:* paying milestones on schedule regardless of quality. *Bait-and-switch staffing:* no key-personnel commitment, so the senior proposal team is replaced by juniors. *No change control:* scope creep absorbed silently or weaponized into change orders.

**Feeds artifacts** — Source SOW + acceptance criteria; the Mobilization acceptance/sign-off record; the payment-milestone schedule (SISRC-05); the knowledge-transfer deliverables (SISRC-13).

**Maturity** — Production-ready.

---

### PATTERN SISRC-09 · Data-processing / BAA / security terms

**Intent** — Bind the SI to the data-protection, BAA, and security obligations required to let its engineers touch the client's PHI/PII during the build — so the SI is a properly-contracted business associate operating under the client's security controls, not an uncontrolled access path.

**Applies to** — Every SI engagement touching PHI/PII (every healthcare build). Lifecycle: Source (contracting) → Mobilization (access). Composes with GOV-03, GOV-08, GOV-17, SISRC-15.

**Solution shape** — The contract includes:
- **Business Associate Agreement (BAA)** — the SI signs a BAA making it a business associate for any PHI its personnel access during delivery (in addition to the Databricks and AWS BAAs of GOV-03). An SI that cannot sign a BAA cannot touch PHI — full stop.
- **Data-processing terms** — purpose limitation (data used only for the engagement), no copying PHI off-platform, no use of client data to train the SI's models/products, breach-notification obligations, and subprocessor disclosure (SISRC-15).
- **Secure delivery** — SI engineers access the client estate through the client's identity governance (SSO/MFA/SCIM, GOV-08), as scoped least-privilege users or service principals (GOV-17), via the client's network controls (GOV-09); no PHI on SI laptops; prefer de-identified/synthetic data in lower environments (GOV-12). SI access is **time-boxed to the engagement and deprovisioned at exit**.
- **Security attestations** — the SI's own HITRUST/SOC 2 evidence (SISRC-02) and audit-cooperation terms.

**Own-it vs rent** — **OWN.** PHI stays in the client's estate under the client's controls; the SI accesses it as a contracted, audited, deprovisionable business associate — never as a custodian holding a copy. **RENT trap:** an SI that copies PHI into its own environment to "work on it" — a new custodian and a new breach blast-radius.

**Where it sits** — Source/procurement (contract) × GOV tier (access controls). Lifecycle: Source + Mobilization.

**Evidence anchors** — HIPAA BAA requirement for business associates (45 CFR §164.502(e), §164.308(b)); GOV-03 (the dual platform BAA this adds the SI to); GOV-08/09/17 (the access controls SI personnel operate under); GOV-12 (de-id/synthetic for lower environments). Sourced.

**Anti-patterns** — *No SI BAA:* SI engineers touching PHI with no business-associate agreement — a HIPAA violation. *PHI off-platform:* the SI copying client PHI to its own environment or laptops. *Training on client data:* the SI using the client's data to improve its own products/models (an own-it and privacy violation). *Standing SI access:* SI accounts not deprovisioned at engagement exit (ties to GOV-08/SISRC-13). *No subprocessor disclosure:* offshore/subcontractor PHI access the client never approved (SISRC-15).

**Feeds artifacts** — Source data-processing/BAA/security terms; the GOV-02 third-party-assurance row; Mobilization SI-onboarding access runbook; the exit deprovisioning checklist (SISRC-10/13).

**Maturity** — Production-ready.

---

### PATTERN SISRC-10 · Vendor concentration + exit terms

**Intent** — Limit the client's dependence on any single SI and contract **explicit exit terms** up front — so the client can change or remove the SI without losing the platform, the asset, or the ability to operate — making the own-it mandate durable rather than a one-time delivery.

**Applies to** — Every SI engagement, especially any with a run/managed-service lane (SISRC-01). Lifecycle: Source (contracting) → through the engagement → exit. Composes with SISRC-06, SISRC-13, SISRC-01.

**Solution shape** — Two disciplines — concentration and exit:
1. **Concentration management** — avoid a single SI holding the platform, the build, *and* the run (SISRC-01 lane separation is the structural defense); keep the platform contract with the client; avoid sole-source dependence where the engagement is large or long. Track vendor concentration as a risk in the business case.
2. **Exit terms, contracted at the start** — define, before signing: the **transition assistance** the SI must provide on exit (knowledge transfer, SISRC-13, at a pre-agreed rate, for a defined period); **return/handover of all assets, source, credentials, and documentation** (enforced by SISRC-06); **deprovisioning** of SI access (SISRC-09); a wind-down period; and no exit penalty that effectively locks the client in. The exit terms are negotiated when the client has leverage (before signing), not when it's trying to leave.

The own-it test for exit: *can the client operate and modify the platform the day after the SI leaves, using assets and knowledge it already holds?* If yes (because SISRC-06 transferred the asset and SISRC-13 transferred the capability), exit is a handover. If no, the client is locked in regardless of what the IP clause nominally said.

**Own-it vs rent** — **OWN.** Contracted exit + asset/credential return + capability transfer make the client genuinely able to leave. **RENT trap:** no exit terms, the asset/knowledge on the SI's side, and an exit that means re-procuring everything — the services lock-in.

**Where it sits** — Source/procurement (exit clause); realized at exit. Lifecycle: Source → exit.

**Evidence anchors** — Standard vendor-exit / transition-services contracting practice; SISRC-06 (asset return) + SISRC-13 (capability transfer) as the substance behind a real exit; concentration-risk management. Transition period/rate are *confirm in contract.*

**Anti-patterns** — *No exit terms:* leaving exit unaddressed until the relationship sours, then negotiating from weakness. *Single SI holds everything:* platform + build + run in one SI with no separability (SISRC-01 violated). *Exit penalty lock-in:* termination terms so punitive the client can't afford to leave. *Asset/knowledge on the SI's side at exit:* nominal IP ownership but no actual ability to operate without the SI.

**Feeds artifacts** — Source exit-terms + concentration analysis; the transition plan (SISRC-13); the vendor-risk line in the business case; the RFP lane structure (SISRC-01).

**Maturity** — Production-ready.

---

### PATTERN SISRC-11 · BAFO levers — negotiating the best and final offer

**Intent** — Run a structured best-and-final-offer round that improves price, terms, and the own-it/IP posture using the leverage of competition — so the final contract is materially better than the initial bids on the dimensions that matter, not just a rubber-stamp of the lowest number.

**Applies to** — Competitive SI selections at the shortlist stage. Lifecycle: Source (negotiation). Composes with SISRC-03, SISRC-04, SISRC-05, SISRC-06, SISRC-10.

**Solution shape** — With a shortlist (2–3 bidders) still in play, run a BAFO round pulling defined levers:
- **Price / rate / mix** — negotiate blended-rate and delivery-mix improvements against the benchmark (SISRC-04); ask for the role/location optimization that lowers cost without gutting seniority.
- **Contract structure** — shift discovery-heavy scope to capped T&M and well-specified scope to fixed-milestone (SISRC-05) to de-risk; tighten acceptance (SISRC-08).
- **Own-it / IP terms** — this is the lever most teams under-use: use competitive pressure to strengthen the IP-transfer clause (SISRC-06), get accelerator IP licensed perpetually or replaced with open-source, secure source delivery, and harden exit terms (SISRC-10). A bidder wanting the deal will improve IP terms under competition that it would never offer sole-source.
- **Key personnel & continuity** — lock the named senior team and continuity commitments (SISRC-08).

Keep at least two bidders genuinely in contention through BAFO — the moment it's a sole source, the leverage on price *and terms* evaporates. Document the BAFO asks and improvements as part of the procurement record.

**Own-it vs rent** — **OWN (the negotiation outcome).** BAFO is where competitive leverage is spent to strengthen the own-it/IP posture, not just shave price.

**Where it sits** — Source/procurement (negotiation). Lifecycle: Source.

**Evidence anchors** — Best-and-final-offer competitive-procurement practice; the principle that leverage exists only while competition is live. The specific concessions achievable are engagement-specific.

**Anti-patterns** — *Price-only BAFO:* negotiating the number down while leaving weak IP/exit terms untouched — winning the battle, losing the war. *Sole-source-too-early:* declaring a winner before BAFO, destroying leverage on both price and terms. *Undocumented negotiation:* concessions agreed verbally and never papered into the contract. *Negotiating against yourself:* improving the SI's terms with no reciprocal demand.

**Feeds artifacts** — Source BAFO record; the final negotiated contract (SISRC-05/06/08/10); the procurement decision memo; the updated business-case numbers.

**Maturity** — Production-ready.

---

### PATTERN SISRC-12 · Reference-check protocol

**Intent** — Verify the SI's claimed capability and delivery quality with **structured reference checks against comparable, recent engagements** — so the selection rests on what the SI actually delivered for clients like this one, not on what it claims.

**Applies to** — Every SI shortlist. The verification side of the capability scorecard (SISRC-02). Lifecycle: Source (evaluation). Composes with SISRC-02, SISRC-03.

**Solution shape** — Run references with discipline:
- **Comparable references** — require references for **recent** (last ~18–24 months), **comparable** engagements: Databricks lakehouse, healthcare/HLS, similar scale and stack (Unity Catalog, the actual architecture). A reference from a different domain or a five-year-old project is weak evidence.
- **Structured questions** — capability delivered vs. promised; whether the **named senior team actually staffed and stayed** (SISRC-02/08); data-quality and timeline performance; how change orders and overruns were handled; security/PHI handling; and — directly — **whether the asset and knowledge actually transferred to the client** or the client remained dependent on the SI (the own-it litmus, tied to SISRC-06/13). Ask: *"Could you operate the platform without them?"*
- **Beyond the curated list** — the SI's offered references are best-case; where possible, seek a back-channel reference (a known peer who used the SI) for an uncurated view.
- **Record** the findings against the scorecard (SISRC-02) as evidence.

**Own-it vs rent** — **OWN (the evidence).** References specifically test whether prior clients ended up *owning* the asset and capability — surfacing services-lock-in patterns before signing.

**Where it sits** — Source/procurement (evaluation). Lifecycle: Source.

**Evidence anchors** — Standard reference-check procurement practice; the specific own-it reference question ("could you run it without them?") as the services-lock-in detector. Reference recency window is *guidance — confirm.*

**Anti-patterns** — *Curated-only references:* relying solely on the SI's hand-picked best-case references. *Generic references:* a reference from an unrelated domain or stack treated as proof for this build. *No staffing/continuity question:* never asking whether the senior team stayed (the bait-and-switch goes undetected). *Skipping the own-it question:* never asking whether the prior client was left able to operate independently.

**Feeds artifacts** — Source reference-check record; the verified capability scores (SISRC-02/03); the selection decision memo.

**Maturity** — Production-ready.

---

### PATTERN SISRC-13 · Transition / knowledge-transfer + capability build

**Intent** — Contract and execute the transfer of operational capability — not just code — to the client's team, so the client can run, troubleshoot, and evolve the platform independently; capability transfer is what makes IP transfer (SISRC-06) actually usable.

**Applies to** — Every SI build under an own-it mandate; mandatory where the client intends to operate the platform itself. Lifecycle: Mobilization (throughout) → exit. Composes with SISRC-06, SISRC-08, SISRC-10.

**Solution shape** — Treat knowledge transfer as a contracted deliverable, run throughout (not bolted on at the end):
- **Embedded delivery / shadowing** — client engineers work alongside the SI through the build, not handed a finished platform — so capability accrues as the work happens.
- **Documentation deliverables** (acceptance-gated, SISRC-08) — architecture docs, runbooks, operational procedures, pipeline/ data-model documentation, and the decision log — sufficient to operate and modify the platform.
- **Training & enablement** — structured handover sessions on the platform, the pipelines, the governance model, and the MLOps lifecycle; recorded.
- **A defined operate-handover milestone** — the point at which the client's team owns run, with the SI in a defined (and time-boxed) support role, not indefinite operation.
- **The exit linkage** — the transition assistance contracted in SISRC-10 draws on this; capability transfer is what makes exit a handover rather than a re-procurement.

The own-it test: IP transfer (SISRC-06) gives the client the *asset*; knowledge transfer gives the client the *ability to use it*. Both are required — code the client can't operate is lock-in by another name.

**Own-it vs rent** — **OWN.** The capability, documentation, and the client team's ability to operate are the durable own-it outcome. **RENT trap:** a "finished platform" handed over with no documentation, no enablement, and the operational knowledge in the SI's heads — nominal ownership, real dependence.

**Where it sits** — Mobilization (throughout) → exit. Lifecycle: Mobilization + exit.

**Evidence anchors** — Standard knowledge-transfer / capability-build delivery practice; the principle that operability (not just ownership) determines real independence; SISRC-06 (the asset) + SISRC-08 (acceptance-gated docs) + SISRC-10 (exit linkage). Handover timing is engagement-specific.

**Anti-patterns** — *Big-bang handover:* a finished platform dropped on the client at the end with no embedded learning along the way. *Code without docs:* delivered source with no runbooks or architecture documentation — un-operable. *Knowledge in the SI's heads:* operational knowledge never documented or transferred, so the client must re-hire the SI to change anything. *Indefinite operate role:* no defined point where the client owns run — permanent dependence.

**Feeds artifacts** — Source/Mobilization transition + knowledge-transfer plan; the documentation deliverables (SISRC-08); the exit terms (SISRC-10); the capability-build line of the engagement.

**Maturity** — Production-ready.

---

### PATTERN SISRC-14 · Move → Source spawn hand-off (pre-filled facts)

**Intent** — When a Move spawns a Source/procurement workstream, carry the Move's already-established facts (architecture, scope, business case, own-it requirements) into the RFP so the sourcing starts pre-filled and consistent — not re-gathered, and not drifting from the Move's intent.

**Applies to** — Any Move that produces a build requiring SI sourcing; the AbarVa Move→Source spawn boundary. Lifecycle: Move (Architecture/Business Case) → Source (RFP). Composes with the whole pack; specific to the AbarVa platform.

**Solution shape** — On spawning a Source workstream from a Move, pre-fill the RFP/procurement artifacts from the Move's outputs:
- **Scope & architecture** → the RFP lane decomposition (SISRC-01) and the build-vs-buy-vs-partner disposition (SISRC-07) inherit the Move's architecture (the composed ARCH/INGEST/MODEL/MLOPS/GOV patterns) and scope.
- **Business case** → the budget envelope, the contracting-model preference (SISRC-05), and the rate/cost expectations (SISRC-04) inherit the FINOPS work.
- **Own-it requirement** → the IP-transfer (SISRC-06) and exit (SISRC-10) requirements inherit directly from the Move's own-it mandate, so the procurement enforces the architecture's intent.
- **Compliance frame** → the BAA/security terms (SISRC-09) inherit the GOV-pack posture (HIPAA, HITRUST scope).
- **Provenance preserved** — the spawned Source artifacts cite the originating Move and its pattern compositions, so the procurement is traceable back to the architecture and business case that justify it (AbarVa provenance discipline).

The hand-off is **pre-filled facts, not re-decisions**: Source refines and executes the procurement, but it starts from the Move's established architecture, budget, and own-it intent rather than re-deriving them — preventing the drift where a procurement quietly contradicts the architecture it's meant to source.

**Own-it vs rent** — **OWN (the workflow + provenance).** The hand-off carries the own-it requirement from the Move into the contract, so the first principle survives the Move→Source boundary.

**Where it sits** — The Move→Source platform boundary; Source/procurement intake. Lifecycle: Move → Source.

**Evidence anchors** — AbarVa Move→Source spawn model (Sentinel-fronted Source surface); the provenance/citation discipline (README — every artifact cites its source). Mechanism is AbarVa-platform-specific.

**Anti-patterns** — *Cold-start procurement:* re-gathering scope, budget, and requirements the Move already established — slow and drift-prone. *Lost own-it intent:* the Move mandates own-it but the spawned RFP omits the IP-transfer/exit requirements, so the contract silently allows lock-in. *Broken provenance:* a procurement decision that can't be traced back to the architecture/business case that justify it. *Procurement contradicting architecture:* the RFP sources something the Move's architecture didn't call for.

**Feeds artifacts** — The pre-filled RFP (SISRC-01/07); the inherited own-it requirements (SISRC-06/10); the inherited compliance frame (SISRC-09); the Source-workstream provenance record.

**Maturity** — Emerging (depends on the Move→Source spawn maturity in the platform).

---

### PATTERN SISRC-15 · Subcontractor / offshore disclosure + data-handling chain

**Intent** — Require the SI to disclose every subcontractor and offshore entity in the delivery chain and bind each to the same data-handling and BAA obligations — so PHI/PII access is never extended to an undisclosed, uncontracted, or out-of-jurisdiction party the client never approved.

**Applies to** — Every SI engagement touching PHI/PII, especially those with offshore/nearshore delivery (most). Lifecycle: Source (disclosure) → Mobilization (access). Composes with SISRC-09, GOV-08, GOV-11, GOV-17.

**Solution shape** — The contract requires:
- **Full subprocessor disclosure** — every subcontractor, offshore subsidiary, and individual delivery location that will access client data or systems, disclosed and **client-approved** before access.
- **Flow-down obligations** — each disclosed party bound, by flow-down clauses, to the same BAA, data-handling, no-off-platform-copy, and security terms as the prime SI (SISRC-09).
- **Jurisdiction & residency** — offshore access must respect the client's data-residency requirements (GOV-11): if PHI must stay in approved regions, offshore engineers access it only in-region through the client's controls (no PHI egress to an offshore environment), or work only on de-identified/synthetic data (GOV-12).
- **Identity & audit** — offshore/subcontractor personnel access through the client's identity governance (GOV-08) as scoped, audited, deprovisionable identities (GOV-17) — never shared or undisclosed accounts.

**Own-it vs rent** — **OWN.** The disclosed, contracted, audited data-handling chain keeps PHI under the client's control regardless of where delivery happens. **RENT/risk trap:** undisclosed offshore PHI access outside the client's controls and residency requirements — an uncontracted custodian and a residency violation.

**Where it sits** — Source/procurement (disclosure) × GOV tier (access/residency). Lifecycle: Source + Mobilization.

**Evidence anchors** — HIPAA business-associate subcontractor flow-down (45 CFR §164.308(b), §164.502(e)(2)); GOV-11 (residency/region pinning); GOV-08/17 (identity for non-local personnel); GOV-12 (de-id/synthetic for offshore work). Sourced.

**Anti-patterns** — *Undisclosed subcontractors:* offshore/subcontractor PHI access the client never approved. *No flow-down:* subprocessors not bound to the prime's data-handling terms. *Offshore PHI egress:* PHI copied to an offshore environment outside approved regions. *Shared/undisclosed accounts:* offshore personnel on shared credentials with no individual audit trail.

**Feeds artifacts** — Source subprocessor-disclosure + flow-down terms; the GOV-02 third-party-assurance evidence; the residency control (GOV-11); the SI-access runbook (SISRC-09).

**Maturity** — Emerging.

---

### PATTERN SISRC-16 · Pricing-comparison normalization across bidders

**Intent** — Normalize bidders' prices to a common basis — same scope, same assumptions, same TCO horizon, including platform and run costs — so the comparison reflects true total cost and the cheapest-looking bid isn't winning on a narrower scope or a hidden run-cost tail.

**Applies to** — Every competitive SI selection at scoring time. The price dimension of the rubric (SISRC-03). Lifecycle: Source (evaluation). Composes with SISRC-03, SISRC-04, SISRC-05, FINOPS-03.

**Solution shape** — Normalize before comparing:
- **Common scope basis** — restate each bid against the same deliverable set (the SOW, SISRC-08), so a bid that excluded a workstream is adjusted, not rewarded for the gap.
- **Common assumptions** — same volume/timeline/environment assumptions; surface and normalize where bidders assumed differently.
- **Total cost, not build-only** — include the **run/managed-service tail** (SISRC-01) and **platform consumption** (DBU/cloud) so a low build price with an expensive run lane is seen whole; align to the FINOPS-03 multi-year TCO horizon (the README's "rent looks cheaper in year 1" warning applies to SI bids too).
- **Risk-adjusted** — factor change-order risk (a lowball with vague scope, SISRC-04/05) and the cost of weak own-it terms (a cheap bid that locks the client in carries a future re-procurement cost) into the comparison, even if qualitatively.
- **Show the normalization** — the adjustments are documented so the comparison is auditable.

**Own-it vs rent** — **OWN (method).** The normalized comparison is the client's evaluation IP and surfaces the true cost of lock-in (weak own-it terms = a future cost), tying price evaluation back to the first principle.

**Where it sits** — Source/procurement (price evaluation). Lifecycle: Source.

**Evidence anchors** — FINOPS-03 (multi-year build-vs-buy-vs-partner TCO — the horizon to normalize to); standard apples-to-apples bid-normalization practice; the README first-principle warning that rent/lock-in is cheaper short-term and dearer long-term. Risk-adjustment quantification is *estimate — confirm.*

**Anti-patterns** — *Headline-price comparison:* comparing top-line bid numbers across different scopes and assumptions — the narrower-scope bid wins falsely. *Build-only comparison:* ignoring the run-cost and platform-consumption tail, so a cheap build with an expensive run wins. *No risk adjustment:* treating a vague-scope lowball as equivalent to a firm-scope bid. *Single-year view:* ignoring the multi-year TCO where lock-in costs surface.

**Feeds artifacts** — Source normalized price comparison; the price scores (SISRC-03); the TCO comparison (FINOPS-03); the selection decision memo.

**Maturity** — Production-ready.

---

## Composition notes — how this pack feeds a Move → Source workstream

A complete Databricks-implementation sourcing composes the pack around the IP-transfer spine:

```
HAND-OFF:           SISRC-14 (Move → Source spawn — pre-filled facts, own-it intent carried)
   ×
SHAPE THE RFP:      SISRC-07 (build-vs-buy-vs-partner disposition)
                    SISRC-01 (platform / build / run lanes)
   ×
EVALUATE:           SISRC-02 (capability scorecard) × SISRC-12 (reference checks)
                    SISRC-03 (weighted rubric — own-it is a scored dimension)
                    SISRC-04 (rate guardrails) × SISRC-16 (normalized price comparison)
   ×
CONTRACT (the spine):  SISRC-06 (IP transfer — the asset assigns to the client)
                    SISRC-05 (fixed/T&M/outcome) × SISRC-08 (SOW + acceptance)
                    SISRC-09 (BAA/security) × SISRC-15 (subprocessor/offshore chain)
                    SISRC-10 (vendor concentration + exit terms)
   ×
NEGOTIATE:          SISRC-11 (BAFO — spend leverage on price AND own-it terms)
   ×
DELIVER OWN-IT:     SISRC-13 (knowledge transfer + capability build — makes IP usable)
   ×
   composes FINOPS-03 (the build-vs-buy-vs-partner TCO that justifies the disposition)
   × the GOV pack (the BAA/security posture the SI is bound to)
   × the ARCH/INGEST/MODEL/MLOPS architecture the SI is building
```

**The pattern to never skip under an own-it mandate:** `SISRC-06` (IP transfer), backed by `SISRC-10` (exit terms) and `SISRC-13` (capability transfer). A sourcing artifact that does not assign the asset and IP to the client, contract a real exit, and transfer the capability to operate it has sourced a vendor-locked outcome — the services-side RENT trap — no matter how own-it the architecture looked on paper. **The first principle is enforced in the contract or it is not enforced at all.** Every quantitative claim above that is not sourced is flagged "estimate — confirm with client rate cards / market / data."

# Intelligence Surface — Audit & Augmentation Roadmap

| | |
|---|---|
| **Doc ID** | `INTELLIGENCE_AUDIT_2026-05-07` |
| **Audience** | Anand (founder) — for review and sign-off · then handed to Claude Code as roadmap input |
| **Scope** | The deployed Intelligence page at `app.abarva.ai/intelligence` |
| **Authoritative references** | `INTELLIGENCE_DESIGN_INTENT_2026-05-07.md` · `CXO_TALK_TRACK_2026-05-07.md` · `SUBSTRATE_TO_SURFACE_MAPPING_2026-05-07.md` |
| **Status** | Read-only audit · produces findings + roadmap, no implementation |
| **Companion** | `AUDIT_VERIFICATION_PROMPT.md` — for Claude Code to verify the unverified reads in this audit |

---

## §0 · Audit posture

This audit treats the existing Intelligence page as **prior art** and the Intelligence Design Intent doc as the **target state**. Where they agree, we protect what works. Where they disagree, we examine whether:

- The page should change to match the doc (substrate-binding gaps, missing affordances)
- The doc should change to match the page (design choices the page made that the doc didn't anticipate)
- Both should evolve toward something neither currently captures (rare; flagged when it happens)

The doc is dated 2026-05-07. The page existed before the doc landed. Treating the doc as a sledgehammer would be unfair to a page that's already meaningfully better than the Setup Overview was. Treating the page as canonical would waste the work of writing the doc. Honest comparison, evolution-oriented.

### What this audit deliberately does NOT do

- Does not implement any changes
- Does not produce wireframes or designs
- Does not modify substrate
- Does not test or verify deployed behavior (that's the companion verification prompt)
- Does not declare any single section "right" or "wrong" without examining tradeoffs

### Verification status

Several reads in this audit are **inferred from a single screenshot and the rendered HTML content**. They are not verified against the live deployed page. Each unverified claim is flagged with `[UNVERIFIED]`. The companion document `AUDIT_VERIFICATION_PROMPT.md` instructs Claude Code to verify these claims and either confirm or correct them before any implementation work begins.

---

## §1 · What works (preserve list)

These are the page's strengths. Naming them protects them from drift in later refactoring. Any future PR that touches Intelligence should preserve these unless explicitly authorized to change them.

### 1.1 The "Explore layer for AI bets" identity

The page hero — "Explore layer for AI bets" with the supporting line "Use Intelligence to understand what we know about this client, what patterns exist, and what art of the possible looks like in their industry, then originate stronger Strategic Moves or validate the bets already in flight" — lands the page's identity in three seconds.

This identity is sharper than the design intent doc's framing ("pattern-to-Move funnel"). The page-built version is more accessible to a CXO. The "explore layer" framing is concrete; "pattern-to-Move funnel" is internal vocabulary.

**Preservation note:** Any future redesign keeps "explore layer for AI bets" or an equivalent first-person framing. Don't replace with platform-internal terminology.

**Doc-update implication:** Section 4 should propose updating the design intent to adopt "explore layer" language.

### 1.2 The originate-vs-validate twin CTA

Below the hero, two cards: "Originate new bets" and "Validate existing bets." This is the talk-track chain made operationally specific. Originate covers the "shape new Moves" use case; validate covers the "test existing Moves before commitments harden" use case. Both are real Intelligence work; the page surfaces both clearly.

**Preservation note:** The twin-CTA structure is the page's central interaction. Don't dilute it.

**Doc-update implication:** Design intent §8 specifies a single "Shape into a Move" affordance. The page's twin-CTA model is richer — both directions of Intelligence's pull (originate AND validate) are first-class. Doc should reflect this.

### 1.3 The three-substrates framing (tenant / corpus / industry)

This is the most architecturally substantive thing on the page. Three explicit substrate sources — what we know about you, what patterns exist, what is possible for you — each with "what is in it" and "how a program leverages it" copy. This is the substrate-consumption model made user-facing.

**Preservation note:** The three-substrates framing is the page's intellectual foundation. Future content additions should map cleanly to one of the three substrates.

**Doc-update implication:** Substrate-to-Surface Mapping doc currently models substrate as 23 segments → primary surface assignments. The page collapses this into three user-facing categories (tenant / corpus / industry). The doc should adopt this collapsed model as the user-facing layer above the segment layer.

### 1.4 The scope lock

"Intelligence supports strategy thinking. It does not generate enterprise AI strategy from scratch." Followed by explicit naming of what stays human work (partner-grade strategy development, executive offsite facilitation).

This is restraint discipline made visible. It pre-disclaims what Intelligence is NOT, which is a major design intent §2 requirement. The page does it more elegantly than the doc proposed — single paragraph, in-flow, not a bulleted boundary section.

**Preservation note:** Scope-lock copy stays. Any future addition that risks blurring the line ("AI strategy generation," "executive coaching," etc.) gets reviewed against this scope lock.

### 1.5 The 10 failure modes library

A canonical list of named failure patterns ("The Phantom Sponsor," "The Pilot-to-Production Gap," "The Sprawl Trap"). Each card cites industry data ("60% of AI projects through 2026 will be abandoned over data foundation gaps that were known at P0"). This is sponsor-grade vocabulary at its best — short, evocative, evidence-backed.

**Preservation note:** The 10 failure modes are intellectual property. Don't water them down with caveats or extend the list past 10. The constraint is the strength.

**Doc-update implication:** The design intent doc anticipated "patterns surfacing" as the central content type. The page's specific instantiation — 10 named failure modes with pattern records and research anchors — is a more concrete IA than the doc proposed. Doc should describe this pattern explicitly.

### 1.6 The stage-progression nav (Today → By function → Patterns → Vendors → Peer activity → My strategy → Sessions)

The seven-stage tab navigation suggests an exploration journey, not a dashboard. Stage 1 is curated entry-state; later stages are deeper exploration. This is the right IA — exploration has phases, and the nav makes the phases visible.

**Preservation note:** Don't expand past 7 stages without strong justification. Don't reorder without thinking through the user journey.

**Doc-update implication:** Design intent §5 (information architecture) sketched a different IA — page header, attention strip, top synthesis card, pattern queue, "what we can't yet see." The page's IA is not the same. Both have merit. Section 4 examines whether the doc's IA should be updated to match the page or whether the page's IA has gaps the doc's IA would fill.

### 1.7 Sentinel as ambient guide (no chat input)

The left rail shows "Sentinel · Ambient · available" with a brief context-setting paragraph and a "Show Sessions canvas" affordance. There is **no chat input** on the page. This matches design intent §2.2 hard rule.

**Preservation note:** This is the design intent's most contentious claim — no chat input on Intelligence. The page honors it. Future temptation to add a chat input must be resisted.

### 1.8 The doctrine stamp (v1.0.0)

The "v1.0.0" doctrine stamp in the substrate count panel (10 failure modes · 17 pattern records · 30 research anchors · v1.0.0 doctrine stamp) is a small but important signal. It tells the user the page's content is a versioned doctrine, not an opinion or a chat output.

**Preservation note:** Versioned doctrine framing is good restraint discipline. Keep the stamp visible.

---

## §2 · Substrate-binding gaps

Where the page has structure that should consume new substrate but currently doesn't (or consumes it thinly). The substrate enrichment work (segments 15-23) created data that has natural homes on this page; many homes are currently unfilled.

### 2.1 Stakeholder Notes (segment 16) → Today pressure cards [HIGH PRIORITY]

The Today curated entry-state shows three pressure cards (foundation readiness · metric-to-bet translation · vendor claim discipline). Each is algorithmically derived from data state. None cite a human voice.

Stakeholder Notes (segment 16: synthetic CIO/COO/CFO discovery interview verbatims) would let pressure cards include attributed quotes:

> **WATCH** · Sponsor signal · Karen Nakamura (CMIO) named on three concurrent programs · told the assessment team she's concerned about capacity relief · documented in stakeholder discovery, 2026-04-22

This grounds the page's claims in specific, dated, attributed human voice. Currently the page reads as platform-derived; stakeholder notes make it feel like the platform has been inside the company.

**Effort:** Medium — requires query across segment 16 + composition logic into pressure card format.

**Substrate state:** Loaded for all 3 demo tenants per Tier 1-B enrichment (per prior conversation transcript).

### 2.2 KPI History (segment 15) → failure mode card augmentations [HIGH PRIORITY]

The 10 failure mode cards each cite a generic industry stat. Each card could additionally show **how this tenant compares to that pattern**, based on KPI History trends.

Card #3 "The Untestable Foundation" today:
> ~60% of AI projects through 2026 will be abandoned over data foundation gaps that were known at P0.
> 2 patterns · 3 anchors

Augmented:
> ~60% of AI projects through 2026 will be abandoned over data foundation gaps that were known at P0.
> **For Meridian:** Foundation readiness for Epic / RCM / prior-auth is at 3 of 5 segments complete. Two known gaps at P0. Trend: improving (gained 1 segment in last 2 quarters).
> 2 patterns · 3 anchors

This binds the failure mode pattern to the tenant's actual exposure. Not a generic warning anymore — a specific status check.

**Effort:** Medium — requires per-segment-per-failure-mode mapping + KPI trend computation.

**Substrate state:** 13 quarters loaded for top KPIs across all 3 tenants per Tier 1-A enrichment.

### 2.3 Decision Traces (segment 19) → "By function" stage [HIGH PRIORITY]

The "By function" stage tab exists in the nav but `[UNVERIFIED]` what it currently shows. Decision Traces (8-10 pivotal decisions per tenant: who decided, what options, who dissented, when) is the most natural fit for a function-level view.

For Meridian "By function: Clinical Operations":
- 4 decisions made in last 6 quarters
- 1 decision deferred (DENIALS-2024 pause)
- 1 decision pending (Innovaccer renewal)
- 2 dissenting voices documented

This adds the dimension the page currently lacks: **time and dissent**. The 10 failure modes are static patterns; decision traces are the lived history of how decisions land.

**Effort:** Medium-large — requires the stage UI to render decision history with dissent tracking.

**Substrate state:** Loaded for all 3 demo tenants per Tier 2-C enrichment.

### 2.4 Peer Benchmarks (segment 17) → "Peer activity" stage [MEDIUM-HIGH PRIORITY]

The "Peer activity" stage tab exists at Stage 3. `[UNVERIFIED]` whether currently populated with general industry data or named peers. Peer Benchmarks (8-10 peer companies × 15-20 metrics) sharpens this from "industry trend" to "named peer comparison."

For Meridian "Peer activity": Novant, Atrium, WakeMed compared on 15-20 metrics with Meridian's quartile position on each.

**Effort:** Medium — requires structured rendering of peer comparison (table or visualization).

**Substrate state:** Loaded for all 3 demo tenants per Tier 2-A enrichment.

### 2.5 Vendor Intelligence (segment 21) → "Vendors" stage [MEDIUM-HIGH PRIORITY]

The "Vendors" stage tab exists at Stage 3. `[UNVERIFIED]` whether currently populated with general vendor patterns or tenant-specific vendor profiles. Vendor Intelligence (top 8-10 vendors per tenant with financial health, references, implementation risks, alternatives) makes this tenant-specific.

For Meridian "Vendors":
- Innovaccer (renewal in 8 months) — financial health, current client count, renewal patterns, implementation risks at peer health systems
- Epic (current) — known integration patterns, common failures
- Olive AI (cautionary) — case study of vendor non-viability

**Effort:** Medium — requires structured rendering of vendor profiles with multiple data dimensions.

**Substrate state:** Loaded for all 3 demo tenants per Tier 3-C enrichment.

### 2.6 AI Transformation Intelligence (segment 23) → NEW Today synthesis card [HIGH PRIORITY]

Segment 23 (AI trajectory + metric impact across front/middle/back office + process change + domain standards) is the most distinctive substrate loaded. It currently has no home on the page.

**Recommendation:** A new synthesis card above the Today curated entry-state, framing the trajectory:

> **WHERE AI IS TAKING HEALTHCARE IDNs**
> The trajectory points to capital-allocation shifts toward middle-office automation; clinical and back-office are downstream. Domain standards (FDA SaMD, NIST AI RMF, HIPAA AI guidance) are tightening. For Meridian: current programs are 80% front-office. Suggest reweighting toward middle office in next portfolio review.
> Loaded: AI Transformation Intelligence (v1) · 4 substantive files (trajectory · metric impact matrix · process change playbook · domain standards)

This card frames everything below it — failure modes, pressure cards, stage exploration — within the trajectory.

**Effort:** Medium — new component, requires careful copy generation from segment 23 content.

**Substrate state:** In flight at last conversation transcript. Verify status before scoping.

### 2.7 Financial Model (segment 18) → failure mode #9 augmentation [MEDIUM PRIORITY]

Failure mode #9 ("The Phantom KPI") cites: "Only ~15% of AI initiatives demonstrate EBITDA gain — measurement was never designed in."

Augment with tenant-specific financial measurement readiness from Financial Model substrate:
> For Meridian: program-level financial actuals tracked for 3 of 7 active programs. EBITDA attribution path defined for 1.

**Effort:** Small — single card augmentation.

**Substrate state:** Loaded for all 3 demo tenants per Tier 2-B.

### 2.8 Scenario Library (segment 20) → "My strategy" stage [DEFERRED]

The "My strategy" stage tab exists at Stage 2. Scenario Library (3-4 modeled scenarios per tenant with stress test outputs) could power scenario-aware strategy review. But this is dense and requires careful UI design. Defer to a later PR.

**Recommendation:** Note as future work, not in initial roadmap.

### 2.9 Graph Relationships (segment 22) → invisible enabler [N/A — DON'T SURFACE DIRECTLY]

Typed graph edges are connective tissue. Don't surface as user content. They power smarter reasoning behind the scenes (e.g., enable "this decision blocks that program because of this dependency" reasoning that surfaces in other cards).

**Recommendation:** No direct binding. Note that other PRs may benefit from graph-aware reasoning where it makes the existing cards smarter.

---

## §3 · Design-intent gaps

Where the page does something the design intent doesn't predict, or doesn't do something the design intent specifies.

### 3.1 "Shape into a Move" affordance [UNVERIFIED — LIKELY MISSING]

Design intent §8 specifies the central interaction: every pattern surfaced has a "Shape into a Move" affordance that pre-populates the Strategic Moves originate flow with pattern context.

**`[UNVERIFIED]`** Whether this affordance exists on the current Intelligence page. From the screenshot, I see the twin-CTA at the top ("Originate new bets" / "Validate existing bets") but I don't see per-card affordances on the Today pressure cards or the failure mode cards.

If missing, this is a **major gap**. The talk track demands directional pull; without per-card "Shape into a Move," patterns can be admired but not converted. The twin-CTA at the top is good but generic — it doesn't carry context from the specific pattern the user was reading.

**Verification needed:** Does clicking a Today pressure card or a failure mode card open anything? Does any UI element pre-populate a Strategic Moves originate flow?

**If missing — remediation:** Add per-card "Shape into a Move →" affordance on Today pressure cards (3 cards minimum) and on each of the 10 failure mode cards. Each pre-populates Strategic Moves originate flow with the card's context attached.

**Priority:** HIGH if confirmed missing.

### 3.2 "What we can't yet see" honest-restraint section [LIKELY MISSING]

Design intent §5.3 specifies a "What we can't yet see" section naming substrate gaps that prevent specific syntheses, with links back to Setup for upload.

I don't see this on the page. The scope-lock paragraph addresses it partially (what Intelligence doesn't do) but not specifically (what gaps prevent specific syntheses).

**Recommendation:** Add a small section, possibly in the Today stage near the bottom of the curated entry-state. Lists 2-3 highest-impact substrate gaps with links to Setup.

**Priority:** MEDIUM. The page has restraint discipline elsewhere; this section reinforces it but isn't structurally critical.

### 3.3 Per-pattern affordances beyond "Shape into a Move" [PARTIAL]

Design intent §5.2 specifies affordances per pattern: "Shape into a Move | Document reasoning | Surface to Tower | Dismiss with reason."

Current failure mode cards have "2 patterns · 3 anchors" as metadata footer. `[UNVERIFIED]` whether clicking these does anything (likely opens detail). No "Document reasoning" or "Dismiss with reason" affordances visible.

The design intent itself notes (§11.Q2): "Default position: ship 'Shape into a Move' only in v1. Add others when use justifies them." So this is a v2 concern, not a v1 gap.

**Priority:** LOW for now. Revisit when v1 ships and use patterns emerge.

### 3.4 Confidence display [UNCLEAR]

Design intent §4.1 specifies every claim has a name + citations + confidence stated. The page's failure mode cards have evidence stats ("60% of AI projects...") but no explicit confidence indicator.

`[UNVERIFIED]` whether confidence is shown elsewhere (e.g., on hover, in detail expansion).

**Recommendation:** Verify, then decide. May not need addition — the page's evidence-citing pattern serves a similar role.

**Priority:** LOW pending verification.

### 3.5 Empty / Partial / Mature state behavior [UNCLEAR]

Design intent §7 specifies three states. The current page appears to be in "mature" state (10 failure modes, 17 patterns, 30 anchors). `[UNVERIFIED]` what an empty-substrate tenant sees on this page.

**Recommendation:** Verify by switching to a tenant with thin substrate. If empty state isn't designed, scope a fix.

**Priority:** MEDIUM — empty state is a real risk for new tenants.

### 3.6 Audience confirmation (design intent §11.Q1) [PAGE ANSWERED]

Design intent left open who Intelligence's primary user is — executive sponsor / strategy lead / CIO / CFO / board observer, OR the same as Strategic Moves user (transformation lead).

The page's voice and content suggest **executive sponsor / strategy lead**. The "originate new bets / validate existing bets" framing, the 10 failure modes, the trajectory framing — all aimed at someone making strategic decisions, not someone driving execution.

**Recommendation:** Lock the audience as exec sponsor / strategy lead in the design intent doc. The page has implicitly answered the question.

---

## §4 · Doc-update needs

Where the design intent doc should evolve to reflect the page's lived implementation, or where new design choices the page made deserve documentation.

### 4.1 Adopt "explore layer for AI bets" framing

Current design intent: "pattern-to-Move funnel." Page: "explore layer for AI bets."

**Update:** Section §1 of the design intent should describe Intelligence as "the explore layer for AI bets — where patterns become Moves and existing Moves get pressure-tested." Pattern-to-Move funnel is the internal mental model; explore layer is the user-facing identity.

### 4.2 Adopt three-substrates framing as user-facing layer

Current design intent: substrate is 23 segments, mapped per the substrate-to-surface mapping doc. Page: three user-facing substrates (tenant / corpus / industry) that aggregate the segments.

**Update:** Add a section to the design intent describing the three-substrates user-facing layer, with the page's "What is in it" / "How a program leverages it" pattern as the canonical model.

### 4.3 Document the 7-stage navigation pattern

Current design intent: §5 sketched IA as page header / attention strip / synthesis card / pattern queue / what we can't yet see. Page: 7 stage tabs (Today → By function → Patterns → Vendors → Peer activity → My strategy → Sessions).

**Update:** The design intent's IA section should document the 7-stage nav as the canonical IA, with the design intent's original structure either subsumed within "Today" or revised.

### 4.4 Document the originate-vs-validate twin-CTA pattern

Current design intent: §8 specifies single "Shape into a Move" affordance. Page: twin CTAs (originate new bets / validate existing bets) at the top.

**Update:** Update §8 to describe the twin-CTA model. Both directions of Intelligence's pull are first-class. "Shape into a Move" affordance per pattern remains but rolls up into the "originate" CTA at the page level.

### 4.5 Document the failure modes library as canonical IA pattern

Current design intent: didn't anticipate a fixed library of named patterns. Page: 10 canonical failure modes with pattern records and research anchors.

**Update:** Add a section describing the failure modes library pattern. Note the constraint at 10 (the constraint is the strength), the structure (named pattern + tagline + evidence + pattern count + anchor count), and the relationship to substrate (each failure mode references segments and graph relationships that ground it).

### 4.6 Lock audience: executive sponsor / strategy lead

Per §3.6 above. Update §1.2 of design intent to lock the audience.

### 4.7 Add doctrine versioning concept

Current design intent: doesn't mention versioning. Page: "v1.0.0 doctrine stamp."

**Update:** Add a small section noting that Intelligence content is versioned doctrine. Significant content additions bump the version. This is restraint discipline — Intelligence isn't a chat output; it's a published doctrine that evolves through versions.

---

## §5 · Augmentation roadmap

Multi-PR sequence to close the gaps in priority order. Each PR follows the same operational pattern as the Setup Redesign Package (autonomous through deploy, browser-Chrome QA before merge, three registers).

### Pre-condition

Before any PR in this roadmap starts, run the verification phase per `AUDIT_VERIFICATION_PROMPT.md` to confirm or correct the `[UNVERIFIED]` claims in this audit. The roadmap below assumes the verification confirms my reads; if it corrects them, the roadmap adjusts.

### Roadmap PRs (8 total, sequenced by leverage)

| # | Title | Type | Substrate | Effort | Priority |
|---|---|---|---|---|---|
| I-1 | Per-card "Shape into a Move" affordance | Affordance addition | Existing | Small | HIGH (if §3.1 confirmed missing) |
| I-2 | AI Transformation synthesis card on Today | New card | Segment 23 | Medium | HIGH |
| I-3 | Stakeholder Notes binding into Today pressure cards | Substrate binding | Segment 16 | Medium | HIGH |
| I-4 | KPI History binding into failure mode cards | Substrate binding | Segment 15 | Medium | HIGH |
| I-5 | Decision Traces binding into "By function" stage | Substrate binding | Segment 19 | Medium-Large | HIGH |
| I-6 | Peer Benchmarks binding into "Peer activity" stage | Substrate binding | Segment 17 | Medium | MEDIUM-HIGH |
| I-7 | Vendor Intelligence binding into "Vendors" stage | Substrate binding | Segment 21 | Medium | MEDIUM-HIGH |
| I-8 | "What we can't yet see" honest-restraint section | Section addition | Derived | Small | MEDIUM |

### Sequencing logic

**PR I-1 first** because the "Shape into a Move" affordance is the talk-track-critical interaction. Without it, every subsequent PR adds content that has no path to action. Adding it first means every later PR's content automatically gets the affordance.

**PR I-2 second** because AI Transformation Intelligence is the most distinctive substrate and currently has no home. Surfacing it gives Intelligence its strongest claim to "we know things about your AI trajectory other tools don't."

**PRs I-3 through I-7** can run in any order or in parallel — they're independent substrate bindings to existing UI scaffolding.

**PR I-8 last** because it depends on knowing which gaps to surface, which becomes clearer once the other PRs land.

### Estimated calendar

PR I-1: 1-2 days
PR I-2: 2-3 days  
PRs I-3 through I-7: 2-3 days each, sequential = 10-15 days; with some parallelism = 6-10 days
PR I-8: 1-2 days

Total sequential: ~18-25 days
Total with parallelism: ~12-18 days

### Out of scope for this roadmap

These are intentional exclusions:

- **Scenario Library binding (segment 20)** — deferred per §2.8
- **Graph Relationships direct surfacing (segment 22)** — invisible enabler per §2.9
- **Confidence display redesign** — pending verification per §3.4
- **Per-pattern v2 affordances** (Document reasoning, Dismiss with reason) — v2 work per §3.3
- **Tower integration** — Tower not yet designed; design intent §10 defers
- **Empty / partial state design** — pending verification per §3.5; if needed, scope a separate PR

### Doc-update package (parallel to roadmap)

The doc updates in §4 are not implementation PRs but design-intent-doc revisions. Recommend producing them as a single revision to `INTELLIGENCE_DESIGN_INTENT_2026-05-07.md` after PR I-1 ships and before PR I-2 starts. The revised design intent then guides PRs I-2 through I-8.

---

## §6 · What this audit recommends you do next

1. **Read this audit** end to end. Disagree where you disagree.
2. **Hand `AUDIT_VERIFICATION_PROMPT.md` to Claude Code** (separate session, browser-Chrome MCP tools required). Output: confirmed / corrected list of the `[UNVERIFIED]` claims. Calendar: half a day.
3. **Review the verification output**. Adjust the roadmap based on what was confirmed vs. corrected. Most likely adjustment: §3.1 either confirms (PR I-1 is critical) or surprises (PR I-1 unnecessary, scoping shifts).
4. **Update the design intent doc** per §4. Either I produce the updated doc, or hand the §4 list to Claude Design as a doc-revision task.
5. **Produce the I-1 through I-8 implementation package** (similar shape to Setup Redesign Package). This becomes the Intelligence Augmentation Package — master prompt, PR specs, data binding catalog, browser-Chrome QA discipline.
6. **Hand the package to Claude Code** for autonomous execution.

This sequence — audit → verify → update doc → produce implementation package → ship — mirrors the discipline used for Setup. It worked there; it should work here.

---

## §7 · Sign-off

For Anand sign-off:

- [ ] §1 preserve list — anything you'd add or remove?
- [ ] §2 substrate-binding gaps — priorities right? Anything missing or wrongly ranked?
- [ ] §3 design-intent gaps — confirm verification approach for the `[UNVERIFIED]` items?
- [ ] §4 doc-update needs — proceed with revising the design intent?
- [ ] §5 augmentation roadmap — 8 PRs in this sequence, or different shape?
- [ ] §6 next steps — proceed with verification phase first?

End of audit.

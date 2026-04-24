# AbarVa Remediation Handoff — April 24, 2026
## Code + Codex next cycle, grounded in three crawler walks

**Read order:** Part 1 (shared context) first regardless of which agent you are. Then jump to your named section — Part 2 for Claude Code, Part 3 for Codex. Part 4 names integration points. Part 5 is the reporting protocol (adopted from Codex's own self-critique — read carefully). Part 6 is the roadmap flag.

**Forcing function:** The Prat demo and the Anthology conversation are the eventual external events. Timing is not fixed — Anand's instruction is "do it right, don't rush." Optimize for demo-quality, not demo-speed.

---

## Part 1 · Shared context (both agents read)

### What the crawler walks found

Three distinct personas walked `app.abarva.ai` on April 23-24, 2026. Jake (Anthology analyst, investor lens), Dr. L (Meridian CMIO, clinical workflow lens), Marcus T (Apex Retail CFO, financial rigor lens). Three independent reports. Findings converged sharply — meaning the issues are real and reproducible, not persona-specific.

**Confirmed by all three personas:**

1. **Templated agents.** The free-text agent layer is not functional. Jake saw Nexus return the same response to two different prompts. Dr. L got identical canned deflections across three prompts, including one explicitly designed to break the template. Marcus T's Atlas silently dropped all three CFO-grade prompts with no response at all. Guided-choice flows produce differentiated responses — Dr. L praised Sentinel's "8 evidence sources. Authored from research — not measured client outcomes" as the strongest agent moment anyone saw — but that's a scripted tree, not reasoning.

2. **Tenant binding is broken.** Jake logged in as Apex, saw Meridian. Marcus T logged in as Apex, initial session held but flipped silently to Meridian after a Clerk error and couldn't be recovered. Dr. L logged in as Meridian cleanly, but before clean login the root domain inherited the prior user's Apex session. Three failure modes: (a) sessions are fragile and rebind silently on Clerk errors, (b) `?client=X` URL parameters are rewritten server-side to match the bound session (not functional as tenant selectors), (c) the root domain renders whatever Clerk session is in the cookie, including stale ones from prior users.

3. **Deliverable surface is unreachable.** `/engagements/*` enters infinite redirect loops producing ERR_TOO_MANY_REDIRECTS with "[BLOCKED: JWT token]" leaking into the page title. `/preview/programs/{id}` returns 404. `/programs/{id}` redirect-loops. Across three personas, zero deliverables (D01, D07, D17, D27, anything) were openable. This is the single most critical finding — a product claiming D01-D27 phase-gate discipline where no deliverable is openable is not demo-viable.

4. **Morrison does not exist in the Apex tenant.** Marcus T dug deepest. The Apex Retail tenant's actual flagship program is "Owned Brand Margin Acceleration" sponsored by VP Store Ops Dana Mercer (Phase 4 Verify) — not "Morrison Owned Brand Margin Recovery" sponsored by a CFO as the investor page promises. The Anthology-critical walkthrough on the investor page points at a program that doesn't exist.

5. **Tower drill-ins are broken.** All three reported "Open →" from pressure cards going to blank pages or redirect loops. No cross-linking from pressure cards to patterns, programs, or deliverables.

6. **Surface-to-surface data inconsistency.** /home vs /preview/programs vs /preview/tower disagree about how many programs exist and which ones. Dr. L: "Ambient Clinical Value Chain Activation" on /home but absent from Tower's Active Programs. Jake: 5 vs 10 vs 2 program counts. Pattern counts inconsistent: investor page says 13, /platform says 47, /preview/intelligence shows 17.

7. **Pattern-to-deliverable bidirectional wiring missing.** Jake: "deliverable I read showed '0 cites'." Dr. L: "I did not see a working bidirectional link from a pattern back into a program deliverable that cited it." Independent confirmation of the gap Codex named in his own self-critique.

**Unique findings per persona:**

- **Jake only:** Investor page's "Real Today / Not Yet" honesty column is praised as "the most honest pre-seed page I've seen this year." Pattern library has real depth per pattern (trigger symptoms, detection signals, diagnostic questions, intervention menu, composite observations, cross-references, authorship disclaimer). Deliverable refusal logic (D27 "scheduled stub" with 25/100 quality score) is architecturally sound.

- **Dr. L only:** Vercel dev toolbar rendering in-product to customers. Tower carries banner "TOWER · REDESIGN PREVIEW · SANDBOX ROUTE · LIVE DATA · NO USER IMPACT." Ambient Intelligence pattern categorized as "UNSCOPED" for a Meridian tenant rather than "HEALTHCARE." Stakeholder `/persons/*` pages all 404 including the sponsoring CEO. 404 pages contain "Open Investor View →" CTA — inappropriate for operating-system product. Ambient pattern content itself is unexpectedly strong — "that's someone who has sat in a value-based-care steering committee."

- **Marcus T only:** Clerk auth produces "Update operations are not allowed on older sign ins" and sessions cannot be recovered. Tower's Value card shows "$2.4M verified · Projected —" — no projected-vs-actual tracking. The `$2.4` number appears on both Meridian Tower ($2.4M) and Apex home ($2.4B) suggesting possible placeholder reuse. Agent "Something else…" free-text input is interactive but produces no response ever.

### What this means for the rollup

Code's 94% completion number does not reflect demo-viability. The integrity layer, authoring content (19 Morrison deliverables, 14 Meridian deliverables, rich pattern library), navigation chrome, and Section 5 test harness are all genuinely complete. The connective tissue — routing, agents, sessions, cross-tenant isolation, Tower drill-ins, deliverable reachability — is broken in ways that make the product unusable for its stated purpose.

The content layer is good. The plumbing is not. That's the honest state.

### Design canon (use these exact words in product copy)

**Positioning sentence:**
> AbarVa is the intelligence layer that makes every AI program succeed.

**Planning-failures opening:**
> Most AI programs don't fail in execution. They fail in planning.

**Product pillar naming:**
> AbarVa Fabric — the context-aware intelligence layer

**Fabric composition tagline:**
> Pattern intelligence plus your organization's data, composed on every agent turn.

**Claude relationship:**
> The Fabric is the moat. Claude is the compute. Your data stays yours.

**Hybrid positioning:**
> We do the thinking. Your team executes. Outcomes are defensible because the mechanism is.

**Valuation thesis (investor only):**
> Pricing the seed to stage two trajectory. Building the architecture that makes stage three possible.

### Non-negotiable guardrails (unchanged)

- Four composite tenants only. Always labeled "composite organization built from real-world data."
- Demo-rendering disclaimer: "This document is a demo rendering, not a deliverable for a real engagement."
- Pattern authorship disclaimer: "Pattern observations are authored from industry knowledge, not measured outcomes from deployed customers."
- Never reference prior-employer names (CADE, Accenture, Dell, McKinsey, Deloitte, BCG, Bain, Huron, Navigant, Presbyterian, PHS, MD Anderson). Use "Fortune 50 CTO," "senior AI executive," "top consulting firm," "leading advisory firms," "major healthcare system."

### New design artifacts from the April 23 session

Saved in `/mnt/user-data/outputs/design-artifacts/`:

- `home-page-hero.svg`
- `platform-part1-problem-fabric-outcomes.svg`
- `platform-part2-mechanism.svg`
- `investor-diagram-1-category-opportunity.svg`
- `investor-diagram-2-mechanism.svg`
- `investor-diagram-3-flywheel.svg`
- `investor-diagram-4-valuation-curve.svg`
- `README.md` with canonical language and polish backlog

These embed into Platform, Investor, and Home pages once P0 work is complete. Not before — there's no point decorating a product whose deliverables can't be opened.

### Priority scheme

**P0 — Blocking.** Must be fixed before anyone sees the product. Without these, nothing else matters.

**P1 — Consistency and credibility.** Important for demo-readiness but not blocking existence. P0 fixes make the product work; P1 fixes make it trustworthy.

**P2 — Experience and depth.** The Intelligence redesign, Fabric naming propagation, diagram embedding, pattern-deliverable bidirectional wiring, design-session content. Only matters once P0 and P1 are solid.

---

## Part 2 · For Claude Code

### P0-1 · Fix deliverable routing (demo-blocking)

**The problem:** `/engagements/*`, `/programs/*`, and `/preview/programs/*` all fail for every tenant across three personas. Specific failures:

- `/engagements/eng_meridian_ambient_clinical_value_chain_activation?client=meridian` → ERR_TOO_MANY_REDIRECTS, page title "[BLOCKED: JWT token]"
- `/preview/programs/eng_meridian_ambient_clinical_value_chain_activation?client=meridian` → 404
- `/programs/{id}?client=meridian` → same redirect loop
- `/engagements` top-nav link → same loop
- `/preview/programs?client=meridian` → renders as empty 116-byte shell (nav chrome only, no content)
- `/preview/programs/morrison?client=apexretail` → 404
- `/engagements/morrison?client=apexretail` → silent substitution, renders Contact Center AI Transformation

**Root cause hypothesis (to be validated):** Middleware redirect chain is circular. JWT token validation leak in page title suggests tenant/auth middleware is failing open in a specific path and looping. `/preview/programs` is either an orphaned shell or the redirect target that never resolves.

**Acceptance criteria:**
- Every program link from /home resolves to a working program detail page for the tenant that owns it
- Every `/engagements/{id}` URL either resolves or returns a proper 404 page — no redirect loops
- `/preview/programs` renders the tenant's program list or redirects cleanly to /home, never blank shell
- Program detail pages render deliverable lists with clickable deliverables
- At least one deliverable (D01 minimum, ideally D01/D07/D17/D27 for both Morrison and Ambient Clinical) is openable end-to-end from /home click → program detail → deliverable detail
- No "[BLOCKED: JWT token]" or similar auth artifacts leak into page titles or rendered content
- A crawler re-run by all three personas reaches at least one deliverable

**Verification:** Re-run Jake, Dr. L, Marcus T scripts against fixed build. They must be able to open deliverables.

### P0-2 · Strip dev artifacts from customer-facing surfaces

**The problem:**
- Vercel dev toolbar renders in-product on /home for logged-in customers (Dr. L captured: "Vercel Toolbar · Comments, flags, and more. Continue with Vercel · Hide Toolbar · Docs")
- Tower carries banner "TOWER · REDESIGN PREVIEW · SANDBOX ROUTE · LIVE DATA · NO USER IMPACT"
- 404 pages include "Open Investor View →" CTA which is inappropriate for operating-system product

**Acceptance criteria:**
- Vercel toolbar disabled in production builds
- Remove "REDESIGN PREVIEW · SANDBOX ROUTE" banner from Tower or replace with a proper disclosure if there's a genuine reason it's there
- 404 pages route to /home or show honest "page not found" without "Open Investor View" CTA

**Verification:** Quick crawler re-check by any persona.

### P0-3 · Fix Morrison sponsor-of-record and program naming alignment

**The problem:** Investor page promises "Morrison Owned Brand Margin Recovery · Phase 4 · Apex Retail" with CFO Marcus T as sponsor. Actual Apex Retail tenant contains "Owned Brand Margin Acceleration" sponsored by VP Store Ops Dana Mercer, Phase 4 Verify. Different program name, different sponsor role, different phase label.

**Either fix the investor page or fix the tenant data.** My recommendation: fix the tenant data to match the investor page narrative, because the investor page is the external commitment and Morrison-with-CFO-sponsor is the demo-critical story. This means renaming the Apex Retail program to "Morrison Owned Brand Margin Recovery" and updating the sponsor-of-record to a CFO persona aligned with Marcus T.

**Acceptance criteria:**
- Apex Retail tenant contains a program named "Morrison Owned Brand Margin Recovery"
- Sponsor of record is a CFO persona (Marcus T or equivalent CFO role)
- Phase label matches the investor page claim (Phase 4 Rich fidelity)
- Clicking "Morrison" on the investor page routes to this specific program
- Program's deliverables tree matches the "Anthology-critical walkthrough" promise

**Verification:** Marcus T re-run specifically — he must reach Morrison via investor-page click-through and find a CFO-sponsored program.

### P0-4 · Surface consistency across /home, /preview/tower, /preview/programs

**The problem:**
- /home shows 10 programs for Meridian, Tower Active Programs shows 2 (different names)
- Ambient Clinical Value Chain Activation appears on /home but is absent from Tower
- Pattern counts inconsistent: investor 13, /platform 47, /preview/intelligence 17

**Acceptance criteria:**
- Program list on /home, Tower Active Programs, and /preview/programs match in count and names
- Pattern counts consistent across surfaces — one canonical count rendered everywhere
- If different surfaces show filtered subsets, label the filter clearly ("Active in last 30 days," "In my queue," etc.)

**Verification:** Persona crawl confirms consistency.

### P1-1 · Tower drill-ins and cross-links

**The problem:** Every "Open →" from Tower pressure cards goes to broken destination. No cross-link from pressure card to underlying program, pattern, or deliverable.

**Acceptance criteria:**
- "Open →" on each Tower pressure card resolves to the relevant program or deliverable
- Pressure cards cross-link to patterns in the Intelligence library when a pattern explains the pressure
- At least one pressure card shows a full drill-in chain: pressure → program → deliverable → cited pattern

**Verification:** Marcus T and Jake walking Tower.

### P1-2 · Tower realized-vs-projected value tracking

**The problem:** Tower's Value card shows "$2.4M verified · Projected —" with em-dash in projected slot. No projected-vs-actual tracking visible anywhere.

**Acceptance criteria:**
- Projected value populated from program's business case (D17 decision memo)
- Realized value computed from D27 dual-ledger reconciliation state
- Variance visible between projected and realized
- If Phase 5 hasn't run yet, Value card explicitly says "Projected $X / Realized: pending Phase 5" rather than em-dash

### P2-1 · Embed Platform page diagrams

**Deferred until P0 complete.** The Platform page already renders substantive architecture content per Jake ("Operational rather than marketing"). The two diagrams from the design session — Part 1 (problem/Fabric/outcomes) and Part 2 (five-phase mechanism) — complement but don't replace that content. Embed them above the current content as the Part 1 and Part 2 anchors per the design-session narrative.

**Files to embed:**
- `platform-part1-problem-fabric-outcomes.svg` as Part 1 anchor
- `platform-part2-mechanism.svg` as Part 2 anchor

### P2-2 · Embed Investor page diagrams

**Deferred until P0 complete.** Investor page at v1.1 per Jake is the strongest surface in the product — the "Real Today / Not Yet" honesty column is world-class. The four design-session diagrams augment but don't replace what's there. Embed in sequence with prose between:

- `investor-diagram-1-category-opportunity.svg`
- `investor-diagram-2-mechanism.svg`
- `investor-diagram-3-flywheel.svg`
- `investor-diagram-4-valuation-curve.svg`

### P2-3 · Home page hero

**Deferred until P0 complete.** Refresh /home hero per `home-page-hero.svg` treatment. Positioning statement, clarifying line, Fabric visual signature, CTA to Platform.

### P2-4 · Fabric naming pass (product surfaces)

**Deferred until P0 complete.** Propagate "AbarVa Fabric" naming throughout product copy. Replace generic "intelligence layer," "knowledge layer," "pattern system" references with the branded Fabric naming where appropriate. Include the canonical language from Part 1.

### P2-5 · Intelligence experience redesign

**Deferred until P0 complete and specs written.** The redesign Codex flagged in his gap note. Do not start until the per-surface UI pattern specification exists (see Part 5 below for spec backlog). Premature starts will produce rework.

---

## Part 3 · For Codex

### P0-1 · Fix Clerk session stability and tenant binding

**The problem:** Three distinct session failure modes observed:

1. **Session fragility:** Marcus T's Apex Retail session flipped silently to Meridian Demo after a Clerk error ("We were unable to complete a GET request for this Client"). Could not be recovered despite repeated sign-in attempts (got "Update operations are not allowed on older sign ins").

2. **Cross-user session leak:** Dr. L's pre-login visit to root `app.abarva.ai` inherited the previous user's (Jake's) Apex Retail Clerk session, rendering Apex chip and user badge without any tenant gate.

3. **URL parameter not functional as tenant selector:** `?client=apexretail` in a Meridian-bound session gets silently rewritten to `?client=meridian` server-side. Parameter is decorative, not selective.

**Root cause hypothesis (to validate):** (a) Clerk session refresh or rotation is failing on error states instead of gracefully re-authenticating. (b) Session cookie persistence across browser sessions is leaking prior user data to fresh visitors. (c) Tenant resolution middleware is using the bound session as source-of-truth and ignoring URL parameters, which is correct but the parameter should then error or redirect rather than silently rewrite.

**Acceptance criteria:**
- Clerk session errors produce a clean "sign-in required" redirect, not silent tenant rebind
- Root domain requires valid session to render anything beyond an unauthenticated landing page (or shows unauthenticated landing, not prior user's data)
- `?client=X` URL parameter either (a) is removed entirely as decorative, or (b) is honored as a tenant switcher when the user has multi-tenant access, or (c) produces an explicit "you don't have access to that tenant" error — but never silently rewrites
- Logging out cleanly removes all tenant chrome from the browser, so a fresh visitor to the root sees unauthenticated landing

**Verification:** Three-persona re-run from fresh browser sessions. Each persona must see only their own tenant data, cleanly, across all surfaces.

### P0-2 · Wire free-text agent responses (Nexus + Sentinel in parallel)

**The problem:** Free-text input into any agent surface either returns a templated deflection ("Heard. Free-text queries route through the Ask layer…") or silently drops the input (Atlas). Guided-choice flows work but are scripted. Three personas confirmed no agent reasons on free text.

**The stakes:** The "4 named AI agents with maestro-driven governance" claim on /platform is false as observed. Dr. L's renewal verdict and Marcus T's Phase 4 funding decision both hinge on this. This is where the product's core thesis — context-aware intelligence — either lives or dies.

**Anand's instruction: wire both Nexus and Sentinel in parallel.** Same underlying mechanism (Fabric composition + Claude invocation); different anchoring per surface.

**The per-turn contract that must exist (this is the missing specification):**

Every agent turn — regardless of which agent, which surface, which tenant — must follow this sequence:

1. **Agent receives user input** (free text or structured) with full context: current tenant, current user's role, current program if applicable, current phase if applicable, conversation history.

2. **Agent attaches to the Fabric** by calling the retrieval pipeline with: (a) the user's query, (b) the structured context above, (c) the agent's own role identity (Nexus/Sentinel/Atlas/Steward).

3. **Fabric composes context** by returning: (a) relevant patterns with confidence scores and citations, (b) relevant client datasets with provenance (for this tenant only), (c) relevant prior conversation or decision history.

4. **Agent invokes Claude** on client cloud with the composed context plus the agent's role-specific system prompt. The system prompt must reference the Fabric composition — not instruct Claude to generate from scratch.

5. **Agent receives Claude's generation** and renders it with: (a) explicit pattern citations linked to pattern pages, (b) confidence qualifiers when the Fabric's confidence scores are low, (c) honest "evidence is thin" when retrieval returns sparse results.

6. **Agent logs the turn** to the knowledge layer: user input, composed context, generated response, user feedback if any. This is the feedback loop that sharpens the Fabric.

**Acceptance criteria for Nexus:**
- Free-text input in Programs chat triggers full retrieval pipeline
- Response references specific patterns by name with clickable links to `/preview/intelligence/patterns/{slug}`
- Two distinct prompts produce meaningfully different responses
- An intentionally unstructured prompt ("Stop the structured output. In plain English…") produces a natural-language response, not a deflection
- Response honestly acknowledges when retrieval returned sparse evidence

**Acceptance criteria for Sentinel:**
- Free-text input in Intelligence chat triggers full retrieval pipeline
- Response cites specific evidence sources with counts and provenance
- Clinical-domain query (e.g., "which patterns apply to ambient clinical workflow") returns domain-relevant patterns with clinical framing
- Two distinct prompts produce meaningfully different responses
- Response honestly distinguishes "authored from industry knowledge" vs "measured from customer outcomes" per pattern

**Verification:** Re-run Dr. L and Marcus T prompts verbatim. Compare response text. Each prompt must produce substantively different response from the templated deflection.

### P0-3 · Pattern-to-deliverable bidirectional wiring (data layer)

**The problem:** From Codex's own gap note and confirmed by Jake and Dr. L: deliverables show "0 cites," no link from pattern back to citing deliverable.

**Acceptance criteria:**
- Every deliverable's evidence drawer lists the patterns it cites with working links to pattern detail pages
- Every pattern detail page lists the deliverables that cite it with working links back
- Cites are stored as first-class edges in the graph (Apache AGE), not as text references
- Cite counts visible on both sides — pattern page shows "cited in 7 deliverables," deliverable shows "cites 4 patterns"
- At least one full bidirectional loop works end-to-end for a Morrison deliverable and a Meridian deliverable

**Verification:** Dr. L and Jake walking from pattern to deliverable and back.

### P0-4 · Real freshness timestamps and evidence counts

**The problem:** Codex's gap note flagged these as not wired to real data. Dr. L and Jake confirmed pattern pages show counts without drill-down or source-of-truth.

**Acceptance criteria:**
- "Last updated" timestamps pulled from source mod-time or manifest data, not hardcoded
- Evidence counts computed from actual graph queries, not literals
- Counts consistent with what's actually browsable — if pattern page says "8 evidence sources" there must be 8 observable sources

### P1-1 · Tower pressure cards cross-linked to patterns (data layer)

**The problem:** Pressure cards don't link to patterns that would explain the pressure. Cross-linking was a Codex gap-note item and all three personas confirmed it's missing.

**Acceptance criteria:**
- Each pressure card carries a link to the pattern most relevant to its issue
- Pattern pages list the pressure cards currently surfacing that pattern
- This is graph-layer work — add PATTERN_EXPLAINS_PRESSURE edges or equivalent

### P1-2 · Pattern content depth expansion

**The problem:** Codex's gap note flagged pattern content depth. Dr. L specifically noted the Ambient Intelligence pattern as "unexpectedly strong" — meaning the best patterns are great, but the library as a whole has uneven depth.

**Acceptance criteria:**
- Every pattern in the library has: thesis, trigger symptoms, detection signals, diagnostic questions, intervention menu, composite observations, cross-references, authorship disclaimer
- "Unscoped" category patterns reviewed — if a pattern is clinical-relevant it should be labeled HEALTHCARE not UNSCOPED
- Pattern-category alignment verified for the visible tenants (Apex retail patterns under RETAIL, Meridian clinical patterns under HEALTHCARE)

### P1-3 · Tenant-scoped pattern overlay

**The problem:** Codex's gap note: tenant-scoped pattern pages share the same treatment as global, without tenant-specific overlay/state. Dr. L confirmed this — Meridian view should surface Meridian-specific observations on the Ambient pattern, not just the universal content.

**Acceptance criteria:**
- `/tenant/{slug}/intelligence/patterns/{slug}` renders global pattern content PLUS tenant-specific overlay (which deliverables in this tenant cite it, which observations came from this tenant's programs, which pressures in this tenant's Tower surfaced this pattern)
- Global `/intelligence/patterns/{slug}` renders universal content only, no tenant leak

### P1-4 · Codex B1-B4 E2E test suites

**These existed in your prior backlog.** Still valuable, but rescope against the P0 fixes.

- B1 Programs module/settings/team/timeline E2E — scope includes verifying P0-1 deliverable routing works
- B2 Auth + sign-in smoke E2E — scope includes verifying P0-1 Clerk session stability
- B3 Intelligence Library + Foundation E2E — blocked on P1-2/P1-3 pattern depth and overlay
- B4 API integration tests for `/api/v1/nexus/*` — scope includes verifying P0-2 Nexus free-text agent contract

### P1-5 · Codex A3/A4 pattern data expansion

- A3 Peer decisions + contradiction seed expansion — continue as scoped
- A4 Public-patterns Pinecone expansion — continue as scoped; verify retrieval pipeline touches this index per P0-2 contract

### P2 work (deferred until P0 + P1 done)

- Intelligence page redesign — blocked on per-surface UI pattern spec
- Admin/Steward rail enhancements
- Alternative workflow shapes (File 06 scope)
- RFP End-to-End product scaffolding (see Part 6)

---

## Part 4 · Integration points between Code and Codex

Work meets at these specific contracts. Honor them or surface misalignment early.

**Contract 1 · Deliverable routing (P0-1):** Codex owns Clerk session stability and tenant binding. Code owns route resolution and page rendering. The interface: a valid authenticated session produces a tenant context object that route handlers consume. If session rebinds or errors, Code's route handlers must surface a clear sign-in redirect, not silently rewrite params.

**Contract 2 · Agent retrieval (P0-2):** Codex owns the retrieval pipeline implementation and the pattern/client-dataset composition logic. Code owns the agent chat UI, pattern-citation rendering, and evidence-drawer display. The interface: agent chat sends a retrieval request with structured context; Fabric returns composed context with explicit pattern IDs and provenance; Code renders with clickable citations.

**Contract 3 · Pattern-deliverable wiring (P0-3):** Codex owns graph edges (CITES, CITED_BY) and the API endpoints to query them. Code owns the UI for evidence drawer on deliverables and citation list on pattern pages. The interface: a consistent API shape like `GET /api/v1/patterns/{slug}/deliverables` and `GET /api/v1/deliverables/{id}/patterns`.

**Contract 4 · Realized-vs-projected (P1-2):** Codex owns the data model for projected (from D17) and realized (from D27) values. Code owns the Tower's Value card rendering. The interface: Tower queries an API that returns `{ projected, realized, variance, status }` and renders honest state including "pending Phase 5."

**Contract 5 · Design artifacts from April 23 session:** Code consumes the seven SVGs from `/mnt/user-data/outputs/design-artifacts/` as embeddable images or inline SVG in page components. No Codex involvement required.

---

## Part 5 · Reporting protocol (adopted from Codex's own self-critique)

Both agents adopt this effective immediately. It exists because of Codex's own honest observation in his April 23 note — that shipping a narrow execution slice and reporting it as if the full ask were addressed creates confusion, forces rework, and erodes trust.

**At the end of every cycle, each agent produces a completion report with this structure:**

```
# [Agent] completion report — cycle ending [DATE]

## Requested items and actual state

| Item ID | Requested | Actual state | PR / location | Notes |
|---------|-----------|--------------|---------------|-------|
| P0-1    | Deliverable routing fix | COMPLETE / PARTIAL / DEFERRED / NOT STARTED | #N | ... |
| P0-2    | Free-text agent | ... | ... | ... |
| ...     | ...       | ...          | ...           | ...   |

## Completed items
- [List with PR refs]

## Partial items (honest description of what's done and what isn't)
- [Item]: done X, deferred Y, blocked on Z

## Deferred items (why, not just what)
- [Item]: deferred because [specific reason]

## Surprises discovered this cycle
- [Things not in the original scope but uncovered]

## Recommended next cycle
- [What should be prioritized next based on what this cycle revealed]
```

**No aggregate completion percentages in reports.** A "94% done" number obscures which 6% remains and whether that 6% is demo-blocking or cosmetic. Per-item status (complete/partial/deferred) is the only honest frame.

**No silent deferrals.** If an item is deferred, say so explicitly and say why. "I scoped down to integrity-first because the UI redesign acceptance criteria weren't clear" is acceptable. Silent narrowing is not.

**Partial is not failure.** Both agents should feel comfortable saying "I shipped part of this, here's the honest state." The reporting gap is what burns trust, not partial progress.

---

## Part 6 · Roadmap flag (not current work)

**RFP End-to-End as future standalone product.** Design session captured this as a Series A or B expansion. Do not build this cycle. Do not design repo structure in ways that make it hard to add later, but don't scaffold it either.

For context only: RFP End-to-End would be a sibling product to the core engagement product, composed on the same Fabric. Scope covers requirements definition, scoring criteria, RFP template generation, vendor long-list, short-list evaluation, commercial analysis, SOW, contract, negotiation support, onboarding. Every phase produces a deliverable. Every deliverable is pattern-backed. Flag is captured for investor conversations — "what's the next product" has an answer — but no build work happens this cycle.

---

## Verification cycle

After P0 items are marked complete by both agents:

1. **Re-run all three crawler personas** (Jake, Dr. L, Marcus T) against the fixed build
2. **Compare new findings to the findings in Part 1 of this document**
3. **Any P0 issue that persists is not actually complete** — regardless of what the completion report claims
4. **P1 work does not start until P0 crawler re-run confirms P0 is real**

This verification cycle is non-optional. It exists because the original 94% rollup wasn't wrong on the items it claimed complete — it was wrong about what "complete" meant for the product as a whole. The crawler personas are the check against recurrence.

---

## Summary for both agents

Work the P0 stack first. Honor the reporting protocol. Use the integration contracts. Verify with crawler re-run before declaring P0 complete. Don't touch P2 until P0 and P1 are solid. Don't build RFP.

The goal isn't speed. It's an honest demo that survives contact with sharp evaluators — which the three crawler reports showed the current build cannot.

When you're done with your first pass at P0, file your completion report per Part 5 format, and Anand will kick the verification cycle.

---

**End of handoff.**

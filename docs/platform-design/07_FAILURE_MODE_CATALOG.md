# 07 · Failure Mode Catalog

**Document:** The specific failure modes AbarVa exists to prevent, with the product capability that prevents each
**Status:** GPT-REFINED-DRAFT · pending founder/Claude review
**Companions:** Documents 00-06 (read first)
**Framework reference:** Section 11 of Agent-Centric Product Design Framework

This document inverts the usual product-strategy framing. Instead of listing features, it lists failures — the specific ways enterprise AI platforms fail their users, their buyers, and their domain. Each failure is paired with the AbarVa capability that specifically prevents it.

The framing is deliberate. Product strategy rendered as anti-outcomes is more disciplined than product strategy rendered as feature lists. Feature lists drift toward generic SaaS capabilities. Failure-mode catalogs stay anchored in the specific problems AbarVa exists to solve.

## Why this framing matters

A CIO evaluating AbarVa against alternatives asks: what does this prevent that the alternatives don't? A failure-mode catalog answers that question directly. A feature list forces the CIO to infer the answer.

A designer building a new surface asks: how do I know this surface is earning its place? A failure-mode catalog gives the designer a test: does this surface prevent at least one failure mode, or is it decorative?

An engineer implementing a feature asks: why does this need to work this specific way? A failure-mode catalog explains the specific failure the implementation prevents.

A crawler persona evaluating a surface asks: what's the test this surface needs to pass? A failure-mode catalog provides the specific failure modes to probe for.

The catalog is product strategy, design spec, engineering rationale, and validation framework compressed into one document.

## How failure modes map to capabilities

Every capability AbarVa builds must trace to at least one failure mode it prevents. Every failure mode in this catalog must be prevented by at least one capability.

The relationship is many-to-many: one capability can prevent multiple failure modes (the Context Bundle prevents several); one failure mode can be prevented by multiple capabilities working together (generic AI responses are prevented by Context Bundle *plus* pattern grounding *plus* vanilla-response scoring *plus* crawler validation).

This document organizes by failure mode (because that's the anchor). The capabilities reference the prior six documents in this canon.

## Category 1 · Generic AI failure modes

The failure modes that make enterprise AI products feel like ChatGPT with enterprise branding.

### F1.1 · Generic AI response with no client context

**Failure:** User asks a question; agent responds with generic advice indistinguishable from what vanilla GPT or Claude would produce. No references to the user's tenant, program, stage, evidence, or work object.

**Example of the failure:**
> User on Meridian's Ambient Clinical program: "What's the biggest risk right now?"
>
> Agent: "Common risks in AI implementations include change management, data quality, and stakeholder alignment. Consider establishing governance early."

**Why it's fatal:** A CIO evaluating AbarVa against Copilot, ChatGPT Enterprise, or internal LLM deployments asks "what's specific to AbarVa?" Generic responses answer "nothing" and kill the buy.

**AbarVa capabilities that prevent this:**

- **Context Bundle assembly** (document 02) — Every response grounded in specific Identity, Work Object, Workflow State, Business Context, Artifacts, Patterns, Evidence, Conversation
- **Vanilla-response risk scoring** (document 02) — Responses below threshold get rejected at composition time
- **Pattern grounding requirement** (document 03) — Agents cite specific pattern sections or explicitly declare no pattern match
- **Evidence coverage requirement** (document 03) — Substantive claims carry provenance
- **Crawler persona validation** (document 06) — Golden prompts test for vanilla responses; surfaces failing tests do not ship

### F1.2 · Blank-prompt dead-end

**Failure:** User lands on a surface and encounters a blank chat box with no guidance. User must become a prompt engineer to derive value.

**Example of the failure:** Any chat interface that opens with "How can I help you?" and no contextual suggestions.

**Why it's fatal:** Enterprise users don't have time to learn prompting. They have time to click suggested actions. A blank prompt box filters the product to users willing to experiment — which excludes most enterprise buyers.

**AbarVa capabilities that prevent this:**

- **Three-choices-plus-custom pattern** (document 05) — Every surface leads with context-generated suggestions
- **Agent editorial leads every surface** (document 01) — Agent-authored synthesis appears before any user input request
- **Context-aware placeholder** (document 05) — Even the custom input has surface-specific placeholder, not "Type a message"

### F1.3 · Agent-as-chatbot-attachment

**Failure:** Surface renders as dashboard-plus-chat-rail composition. The product feels like a SaaS dashboard with ChatGPT bolted on the right.

**Example of the failure:** Main surface shows metrics grid; right rail shows chat. No agent editorial leading the surface.

**Why it's fatal:** Users perceive the agent as optional decoration, not as the intelligence layer. The buy case collapses — why pay for AbarVa when the dashboard is commodity and the chat is a Copilot add-on?

**AbarVa capabilities that prevent this:**

- **Agent editorial leads every surface** (documents 01, 04) — First substantive content is agent-authored synthesis
- **Compositional test rule 1** (document 04) — Design review checks "does agent editorial lead the surface?"
- **Pattern detail exception** (document 04) — Only surface where content leads and agent annotates, explicitly exempted

### F1.4 · Static template response

**Failure:** Agent returns responses with identical structure regardless of user query or work-object state. The same scaffolding gets reused; only specific details vary.

**Example of the failure:** Three different pressure-card prompts return responses with identical three-paragraph structure and identical closing phrases — what Marcus T and Dr. L flagged on April 24 as the "Atlas templated echo."

**Why it's fatal:** Users detect templating quickly. Once detected, trust collapses — users stop believing the agent is reasoning and start treating it as a parameterized template.

**AbarVa capabilities that prevent this:**

- **Per-turn Context Bundle refresh** (document 02) — Bundle refreshes per turn; responses grounded in current state not cached state
- **Response uniqueness scoring** (document 02, dimension 6) — Detects template echo patterns
- **Crawler persona detection** (document 06) — Specific detection for "I heard X..." response patterns

## Category 2 · Evidence and truth failure modes

The failure modes that destroy enterprise trust by mishandling claims and evidence.

### F2.1 · Fabricated financial figures

**Failure:** Agent produces specific dollar amounts, ranges, or projections without underlying data or evidence citations.

**Example of the failure:** D16 Business Case cites "$180-240M projected value" citing "E51-E55 financial models" that don't exist in the evidence registry — exactly what Marcus T caught on April 24.

**Why it's fatal:** A CFO who catches a fabricated number once stops trusting every number. The product cannot operate at the decision-grade tier it promises.

**AbarVa capabilities that prevent this:**

- **Evidence coverage requirement** (document 03) — Nexus refuses to state specific figures without evidence
- **Financial fabrication detection** (document 06) — Response-layer detection for specific dollar figures without citations
- **Composite-tenant transparency** (document 00) — Explicit framing that tenants are composite organizations
- **Dual-ledger design** (pattern M6) — Projected vs realized vs attributed value with explicit counterfactual registration

### F2.2 · Fabricated evidence citations

**Failure:** Agent cites evidence sources (E-id references, file names, pattern sections) that do not exist or do not contain the claimed content.

**Example of the failure:** Response claims "per baseline study E-34" when E-34 is a different study or doesn't exist.

**Why it's fatal:** Evidence citations are the mechanism AbarVa uses to build trust. Fabrication inverts the mechanism — citations become evidence of untrustworthiness rather than of rigor.

**AbarVa capabilities that prevent this:**

- **Evidence retrieval from registry** (document 02) — Agents retrieve citations from actual evidence registry, not generate citation strings
- **Sentinel validation** (document 03) — Citations validated against evidence registry before response ships
- **Crawler citation resolution** (document 06) — Personas follow citations to verify they resolve to real evidence

### F2.3 · Flattened contradictions

**Failure:** Agent encounters contradicting patterns, evidence, or expert views and presents a single unified answer, suppressing the contradiction.

**Example of the failure:** Ambient Clinical patterns from academic medical centers suggest ROI timeline of 18 months; community health systems show 36 months. Agent responds with "typical ROI is 24 months" — the average of the two, which is accurate for neither context.

**Why it's fatal:** Contradictions are signal. Flattening contradictions loses the signal and produces guidance that is maximally wrong in edge cases.

**AbarVa capabilities that prevent this:**

- **Sentinel contradiction surfacing** (document 03) — Sentinel explicitly refuses to flatten contradictions
- **Pattern contradiction fields** (document 02) — Context Bundle includes `pattern_contradictions` when relevant
- **Crawler contradiction probing** (document 06) — Personas test cross-context queries specifically to probe for flattening

### F2.4 · Silent thin evidence

**Failure:** Agent responds confidently when Context Bundle evidence coverage is thin, without disclosing the thinness.

**Example of the failure:** User asks about a specific vendor's reference customers; only one reference exists in evidence; agent presents response as if multiple references support the claim.

**Why it's fatal:** Users anchor on confident statements. Later discovery that evidence was thin causes decision regret and destroys trust.

**AbarVa capabilities that prevent this:**

- **Honest-disclosure requirement** (document 03) — Responses with low evidence coverage must open with explicit disclosure
- **Confidence chips** (document 04) — HIGH / MEDIUM / LOW chips on substantive claims
- **Context-used UI contract** (document 05) — Users see what the agent used and what was available but not used

## Category 3 · Workflow integrity failure modes

The failure modes that break the workflow fabric AbarVa runs on.

### F3.1 · Workflow moves forward without inputs ready

**Failure:** Users advance a program or sourcing event through a phase or stage gate despite required inputs being incomplete. Downstream work proceeds on incomplete foundation.

**Example of the failure:** Sourcing event moves from Scope to Sourcing Strategy without locked scope document or approved sponsor sign-off. Later Strategy work references assumed scope that was never actually locked.

**Why it's fatal:** Workflow integrity is the difference between AbarVa and a project tracker. If gates don't actually enforce, the product becomes a status display rather than an operational discipline.

**AbarVa capabilities that prevent this:**

- **Steward gate enforcement** (document 03) — Gate evaluation against workflow state before advancement
- **Readiness scoring** (document 02) — Explicit readiness score per stage
- **Missing inputs visibility** (document 02) — `artifact_missing_inputs` fields surface gaps
- **Build governance gate pattern** (document 08) — Implementation itself follows gate-enforced discipline as product DNA

### F3.2 · Silent workflow state changes

**Failure:** Workflow state changes without user awareness, audit trail, or approval. Users return to find work in a state they don't remember authorizing.

**Example of the failure:** Scorecard weights changed silently by a co-user during the evaluation period without audit trail or notification.

**Why it's fatal:** Multi-user enterprise products live or die by audit integrity. Silent changes destroy the product's defensibility in procurement committee, compliance review, and dispute resolution.

**AbarVa capabilities that prevent this:**

- **Governance-native principle** (document 01) — Audit, approval, rationale as first-class primitives
- **Lock states on scorecards and artifacts** (document 03) — Material changes to locked items require explicit unlock with rationale
- **Audit trail per decision** (document 03) — Every change recorded with actor, timestamp, rationale

### F3.3 · Misaligned phase/stage across views

**Failure:** The same program or event shows different phase/stage on different surfaces. Home card says Phase 3; program detail says Phase 4.

**Example of the failure:** Exactly what Marcus T flagged on April 24 — Morrison Owned-Brand Margin showed Phase 3 on home dashboard and Phase 4 on program detail.

**Why it's fatal:** Enterprise users read multiple surfaces in sequence. Inconsistency destroys confidence that the platform has integrity. If I can't trust what phase a program is in, why would I trust the financial projections?

**AbarVa capabilities that prevent this:**

- **Single source of truth for Workflow State** (document 02) — Phase/stage derived from canonical state machine, not surface-specific calculations
- **Cross-surface consistency testing** (document 06) — Crawler Section E tests count and state consistency across views
- **Build governance verification** (document 08) — Implementation reviews cross-check rendering against state source

### F3.4 · Lost work on session resume

**Failure:** User returns after time away to find work has reset, context is lost, or prior decisions are no longer visible.

**Example of the failure:** Conversation with Nexus on a program resets between sessions; user must re-establish context from scratch.

**Why it's fatal:** Enterprise work spans days and weeks, not sessions. Products that require context re-establishment lose to products that remember.

**AbarVa capabilities that prevent this:**

- **Conversation continuity** (document 05) — Per-surface chat history persists across sessions
- **Work-object persistence** (document 02) — Work objects and their state survive sessions
- **Memory across cycles** (documents 02 and 03) — Context Bundle assembles from persistent state, not session state

## Category 4 · Deliverable quality failure modes

The failure modes that make AbarVa deliverables feel like boilerplate or templates rather than decision-grade artifacts.

### F4.1 · Empty deliverable with scaffolding

**Failure:** Deliverables render with structured sections and headers but the section content is identical boilerplate across tenants, programs, and archetypes.

**Example of the failure:** Exactly what Marcus T and Dr. L found on April 24 — D01 Program Charter, D10 Executive Summary, D16 Business Case, D17 Decision Memo, D12 RACI all sharing the same boilerplate "Rich seed artifact: enough structure for a demo walkthrough" content across both Meridian and Apex tenants.

**Why it's fatal:** A CFO evaluating a Business Case expects reasoning. Boilerplate reveals that the product hasn't actually synthesized; it has templated.

**AbarVa capabilities that prevent this:**

- **Artifact tier discipline** (document 03) — Rich tier requires substance (authored content plus client synthesis); Outline tier acceptable when inputs thin; Stub tier for early-phase placeholders
- **Missing-input handling** (document 02) — Artifacts can declare missing inputs rather than fabricate
- **Sentinel validation** (document 03) — Artifacts validated for substance before shipping
- **Crawler deliverable assessment** (document 06) — Section D of crawler scripts evaluates hero deliverables in depth

### F4.2 · Deliverable tier mismatch with promised quality

**Failure:** Product promises Rich tier content but delivers Outline or Stub tier without disclosure.

**Example of the failure:** UI indicates "Rich" deliverable status; actual content is three bullets of generic advice.

**Why it's fatal:** Tier labels are a trust mechanism. Mismatching label and content destroys the mechanism and makes users cynical about every other label.

**AbarVa capabilities that prevent this:**

- **Artifact tier as Context Bundle field** (document 02) — Tier is specific field, not UI decoration
- **Tier-appropriate rendering** (document 04) — UI treatment differs by tier; users see what tier they're getting
- **Honest-disclosure requirement** (document 03) — Agent explicitly labels tier when generating

### F4.3 · Broken evidence links in deliverables

**Failure:** Deliverables cite evidence (E-ids, files, sources) that don't resolve when clicked.

**Example of the failure:** D16 Business Case cites "E51-E55 financial models" as citations; clicking those citations either returns 404 or surfaces different evidence than claimed.

**Why it's fatal:** Citations are trust mechanisms. Broken citations invert them into evidence of untrustworthiness.

**AbarVa capabilities that prevent this:**

- **Evidence registry integrity** (document 02) — Citations must resolve to real evidence entries
- **Citation validation at artifact generation** (document 03) — Sentinel validates citations before ship
- **Crawler citation resolution testing** (document 06) — Personas follow citations to verify resolution

### F4.4 · Demo-first content that fails in production

**Failure:** Content tuned to look good in a demo walkthrough but fails when a real user tries to use it for real work.

**Example of the failure:** D17 Decision Memo works as a visual narrative in a 10-minute demo but lacks the three-option framing, counterfactual, and dollar substance a CFO needs to actually approve Phase 4 funding.

**Why it's fatal:** Demo-first content survives demo but doesn't survive procurement. First real use after close reveals the gap; retention collapses.

**AbarVa capabilities that prevent this:**

- **Pattern-powered artifact generation** (document 03) — Artifacts generated from authored pattern content, not demo-specific scripts
- **Real-use crawler testing** (document 06) — Personas evaluate artifacts with procurement-committee rigor, not demo rigor
- **Honest-disclosure requirement** (document 03) — Artifacts that lack substance declare so rather than perform substance

## Category 5 · Trust and provenance failure modes

The failure modes that destroy enterprise trust by obscuring the product's reasoning.

### F5.1 · Untraceable recommendations

**Failure:** Agent makes a recommendation; user asks "why?" and no traceable answer is available.

**Example of the failure:** Atlas recommends focusing on the ambient overlap; user asks "why this one?"; Atlas responds with restatement of the recommendation without deriving it from evidence.

**Why it's fatal:** Enterprise decisions require defensibility. Recommendations users can't trace back become recommendations users can't defend to their boards and audit committees.

**AbarVa capabilities that prevent this:**

- **Context used panels** (document 05) — UI shows what specifically informed each response
- **Why-this-recommendation query handling** (document 03) — All agents must handle this golden prompt with substantive derivation
- **Citation-first editorial** (documents 03, 04) — Every substantive claim carries citation inline

### F5.2 · Confidence labels without basis

**Issue:** HIGH / MEDIUM / LOW confidence chips appear on responses but don't trace back to any specific basis. Chips become decoration.

**Example of the failure:** Agent labels a claim HIGH confidence with thin evidence and no pattern match.

**Why it's fatal:** Confidence labels are a trust mechanism. Labels without basis are worse than no labels — they convey false precision.

**AbarVa capabilities that prevent this:**

- **Confidence derived from Context Bundle scores** (document 02) — Confidence chips are renderings of quality scores, not independent labels
- **Chip explanation affordance** (document 04) — Clicking a confidence chip shows its derivation
- **Crawler probing** (document 06) — Personas test confidence claims for grounding

### F5.3 · Invisible agent handoffs

**Failure:** Nexus silently consults Sentinel's retrieval; Atlas silently pulls Nexus's program data. User sees unified response but doesn't know which agent produced what.

**Example of the failure:** Tower pressure card editorial blends Atlas synthesis with Sentinel pattern retrieval; user reads it as unified Atlas voice without knowing Sentinel contributed.

**Why it's fatal:** Users can't form correct mental models of what to trust. Agent specialization is a core IP claim; if users can't see it, they can't evaluate it.

**AbarVa capabilities that prevent this:**

- **Explicit handoffs rule** (document 03) — When one agent hands to another, handoff is visible in UI
- **Agent identifier on every editorial** (document 04) — UI always shows which agent is speaking
- **Cross-agent access discipline** (document 03) — Agents don't silently access each other's retrieval scopes

## Category 6 · Governance and compliance failure modes

The failure modes that break enterprise governance requirements.

### F6.1 · Cross-tenant data leak

**Failure:** A user authenticated to one tenant can read data from another tenant.

**Example of the failure:** Exactly what Marcus T surfaced on April 24 — Meridian-authenticated user navigating to `/tenant/apex-retail/programs/...` rendered full Apex content with active APPROVE DECISION button. Cycle 1 P0-1 fix addressed session cache; underlying backend authorization defect remained.

**Why it's fatal:** Multi-tenant SaaS products die on tenant isolation breaches. One breach disclosed publicly ends the product. For AbarVa, where tenants are composite of client-sensitive healthcare and financial data, breach is existential.

**AbarVa capabilities that prevent this:**

- **Tenant isolation at backend** (Cycle 2 C2-01, verified PASS by Dr. L)
- **Tenant scope on every route** — 403 enforcement on cross-tenant navigation
- **Tenant scope on every data query** — Repository layer enforces tenant filter
- **Tenant scope on every file** (document 05) — Files scoped to tenant, cross-tenant read prevented
- **Crawler boundary testing** (document 06) — Personas explicitly test cross-tenant URL navigation

### F6.2 · Ungoverned action affordances

**Failure:** Action buttons (APPROVE DECISION, LOCK SCORECARD, RELEASE RFP) active without appropriate permission checks.

**Example of the failure:** Active APPROVE DECISION button in cross-tenant view (as caught April 24). Active ADMIN toggle visible to non-admin users.

**Why it's fatal:** Actions are the highest-consequence product capability. Ungoverned actions can commit financial decisions, lock contracts, release vendor communications without appropriate authority.

**AbarVa capabilities that prevent this:**

- **Permission enforcement per action** — Every action checks actor's permissions
- **UI reveals permissions honestly** — Actions not available to user are not rendered (not just disabled)
- **Crawler permission probing** (document 06) — Personas test permission boundaries

### F6.3 · Missing audit for material changes

**Failure:** Material changes (scorecard weight modification, artifact approval, gate advancement) occur without audit entry.

**Example of the failure:** Scorecard weight changes during evaluation without actor, timestamp, rationale recorded.

**Why it's fatal:** Enterprise audit requirements demand traceability. Missing audit surfaces in compliance review kill renewal and create litigation exposure.

**AbarVa capabilities that prevent this:**

- **Governance-native principle** (document 01) — Audit as first-class primitive
- **Rationale on material changes** (document 03) — Scorecard weight changes require rationale
- **Audit trail per decision** (document 03) — Every change records actor, timestamp, rationale
- **Steward audit surfacing** (document 03) — Admin surface exposes audit gaps and stale records

### F6.4 · Exposed development artifacts in production

**Failure:** Development toolbar, design notes, internal copy, debug outputs visible in production environments.

**Example of the failure:** Vercel dev toolbar visible on production (April 24 finding). Internal design-note copy leaking to user-facing surfaces ("Cycle 2 interim update — dashboard currently shows full portfolio...").

**Why it's fatal:** Enterprise buyers evaluate product polish as a proxy for product maturity. Development artifacts signal "beta" and depress buying confidence.

**AbarVa capabilities that prevent this:**

- **Production build discipline** — Dev toolbar, console logs, debug outputs removed in production builds
- **Internal copy review** — All user-facing copy reviewed before ship
- **Crawler production scrutiny** (document 06) — Personas specifically note development artifacts in Section F of their reports

## Category 7 · Executive synthesis failure modes

The failure modes specific to Tower and executive surfaces.

### F7.1 · Dashboard graveyard

**Failure:** Executive surfaces render dense metrics grids without synthesis. Users see data but not decisions.

**Example of the failure:** Tower with twelve KPI tiles, four charts, three tables — and no Atlas editorial composing meaning on top.

**Why it's fatal:** Executive time is the most expensive resource in the enterprise. Dashboards that require executives to synthesize fail the core value proposition.

**AbarVa capabilities that prevent this:**

- **Atlas editorial leads Tower** (documents 01, 03, 04) — First substantive content is Atlas synthesis
- **Decision-oriented voice contract** (document 03) — Atlas composes decisions, not status
- **Five-question test** (documents 01, 04) — Tower must answer "what matters right now" within three seconds

### F7.2 · Operational detail overwhelming executive**

**Failure:** Executive surface exposes operational detail meant for program managers or sourcing leads. Executive drowns in noise.

**Example of the failure:** Tower showing per-deliverable status, per-artifact tier, per-stage readiness across all programs — when executive needs three pressures with dollar amounts and decision prompts.

**Why it's fatal:** Executives close the product. "This is for my team, not me" ends the executive sponsorship that enterprise deals require.

**AbarVa capabilities that prevent this:**

- **Executive-concise voice contract** (document 03) — Atlas 150-word cap enforced
- **Atlas refuses operational detail** (document 03) — Hands off to Nexus or Sentinel for detail
- **Tower-specific content rules** (document 04) — Tower composition emphasizes pressures and synthesis, not operational detail

### F7.3 · Pressure without specific dollar amount

**Failure:** Tower surfaces pressures without quantification. "AI governance gap" as a card without $X/mo implication.

**Example of the failure:** "Ambient Documentation Overlap" card with red accent and urgency framing but no specific cost attribution.

**Why it's fatal:** Executives operate on dollar amounts. Pressures without numbers are anxieties, not decisions.

**AbarVa capabilities that prevent this:**

- **Atlas refuses pressure without dollar** (document 03) — Every pressure card has quantification
- **Evidence coverage requirement** (document 03) — Dollar amounts carry provenance
- **Crawler pressure probing** (document 06) — Personas drill into each pressure and verify numbers resolve

## Category 8 · Pattern and intelligence failure modes

The failure modes specific to Intelligence and pattern library.

### F8.1 · Search-results treatment of Intelligence

**Failure:** Intelligence surface renders as ranked search results instead of pattern-library reasoning.

**Example of the failure:** User asks about ambient clinical; surface shows "12 results matching 'ambient clinical'" with snippets and relevance scores.

**Why it's fatal:** Intelligence is supposed to feel like a research librarian. Search-results treatment makes it feel like Confluence or SharePoint. Users evaluate Intelligence against Notion AI and win on feature set but lose on depth.

**AbarVa capabilities that prevent this:**

- **Sentinel library narration** (document 03) — Sentinel opens Intelligence with state narration, not search results
- **Pattern-content-leads exception** (document 04) — Pattern detail pages show pattern content, not ranked snippets
- **Contradiction surfacing** (document 03) — Sentinel surfaces contradictions, doesn't flatten into search ranking

### F8.2 · Unsupported pattern claims

**Failure:** Patterns make claims without evidence backing. Pattern reads as opinion rather than synthesis of observations.

**Example of the failure:** T1 Craft pattern claims "governance operating models reduce AI risk by 40%" without evidence citation or observation count.

**Why it's fatal:** Patterns are AbarVa's authored IP. Unsupported patterns become an intellectual liability, not an asset.

**AbarVa capabilities that prevent this:**

- **Pattern authoring template Section G** (pattern library canon) — Evidence base mandatory per pattern
- **Pattern status discipline** — AUTHORED-DRAFT vs AUTHORED-REVIEWED vs AUTHORED-EXPERT vs BATTLE-TESTED distinguishes confidence
- **Sentinel validation of pattern claims** (document 03) — Pattern claims retrieved with evidence, not without

### F8.3 · Patterns without applicability guidance

**Failure:** Pattern applies broadly with no "when this doesn't apply" section. User applies pattern inappropriately to their context.

**Example of the failure:** Ambient Clinical pattern applied to a community health system when it was authored for academic medical centers with different workflows.

**Why it's fatal:** Patterns applied out of context do more harm than no pattern at all. User trusts the pattern more than their judgment and makes worse decisions.

**AbarVa capabilities that prevent this:**

- **Pattern Section C (Applicability)** — Mandatory per canonical pattern template
- **Pattern Section H (Failure Modes)** — What goes wrong when applied wrong
- **Sentinel cross-context reasoning** (document 03) — Surfaces applicability mismatches when pattern retrieved for inappropriate context

## Category 9 · Build and delivery failure modes

Failure modes in how AbarVa itself gets built, which threaten the product as it evolves.

### F9.1 · Self-attested progress without independent verification

**Failure:** Agents (Code, Codex) report items closed after merge; no independent verification confirms actual quality.

**Example of the failure:** Cycle 1 items reported closed after code merge; crawler personas on April 24 revealed the underlying defects (cross-tenant leak not fixed, Atlas templates intact).

**Why it's fatal:** Founder and team trust the agent's reports; ship based on those reports; discover defects after release (or during demo). Self-attested progress without verification creates a credibility debt that compounds.

**AbarVa capabilities that prevent this:**

- **Definition of Done per File 08 Section 18.6** — Merge is not closure; persona verification required
- **Crawler persona cadence** (document 06) — After every cycle, full crawler walk with at least two personas
- **Honest status reporting per File 08 Section 18.3** — Agents report "code merged but verification pending" when that's the truth, not "closed"

### F9.2 · Cycle scope drift

**Failure:** Cycles start with specific scope items; during execution, scope expands silently; cycle "completes" with items that were never in the original scope.

**Example of the failure:** Cycle planned with 14 items; Code completes 21 items including 7 that weren't in the plan; report says "cycle complete" but actual progress relative to planned scope is unclear.

**Why it's fatal:** Founder loses ability to forecast delivery and plan subsequent work. Scope drift compounds into pattern of endless cycles without discernible progress.

**AbarVa capabilities that prevent this:**

- **CYCLE_STATE.md discipline** — Cycle scope locked at cycle start
- **Scope change via explicit amendment** — Adding items to in-flight cycle requires founder approval
- **Report structure per File 08 Section 18.3** — Explicit reporting of "completed against plan" vs "extra items added"

### F9.3 · Implementation without spec

**Failure:** Engineer implements a feature without a design spec, Context Bundle definition, agent behavior contract, or acceptance criteria.

**Example of the failure:** A new surface added to Programs without pattern-library grounding or agent voice contract; surface renders but feels disconnected from rest of platform.

**Why it's fatal:** Specless implementation drifts toward generic SaaS. Each specless addition degrades the platform's agent-centric coherence.

**AbarVa capabilities that prevent this:**

- **Approval boundary** (document 00) — Implementation requires all ten prerequisites
- **Build gates** (document 08, upcoming) — Dashboard, event canvas, chat UI, file upload, agent API, artifact generation gates
- **Review discipline** — Component spec + wireframe + Context Bundle + agent contract + acceptance criteria before code

### F9.4 · "Fixed" items that regress

**Failure:** Items reported as fixed in Cycle N surface again as defects in Cycle N+1 or N+2.

**Example of the failure:** Cross-tenant leak "fixed" in Cycle 1 P0-1 (session cache); surfaced again in April 24 crawler (backend authorization defect).

**Why it's fatal:** Regressions destroy credibility faster than new defects. "Fixed → regressed" implies the fix was incomplete or the underlying understanding was wrong.

**AbarVa capabilities that prevent this:**

- **Crawler regression probing** (document 06) — Personas specifically re-test previously fixed items
- **Definition of Done** — "Fixed" requires persona verification, not just code merge
- **Root-cause discipline** — Fixes address root cause, not symptom

## How this catalog gets used

The catalog is not a one-time read. It's an operational reference.

### For product strategy decisions

When proposing a new feature or surface: which failure mode does this prevent? If answer is "none specifically," the feature doesn't earn its place.

### For design reviews

When reviewing a wireframe or surface: which failure modes does this prevent? The review surfaces the mapping explicitly.

### For engineering implementation

When implementing a feature: which failure modes is this feature preventing? The implementation ensures the prevention is real, not theoretical.

### For crawler persona testing

The catalog is the test surface. Personas probe for each failure mode. Successful prevention = implementation works; failure detected = regression or incomplete fix.

### For investor and design-partner conversations

The catalog articulates what AbarVa prevents that alternatives don't. Turn around the "what features?" question into "what failures do your alternatives still have?"

## Catalog maintenance

Failure modes get added as discovered. Prevention capabilities get added as built.

### Adding failure modes

When crawler personas or real-use sessions surface new failure modes:

1. Document the failure mode in this catalog
2. Identify which existing capabilities could prevent it (if any)
3. If no capability prevents it, identify required new capability
4. Add to next cycle scope

### Retiring failure modes

Rarely, a failure mode becomes structurally impossible due to architecture changes. Retire with note in change log. Most failure modes are perpetual — preventing them is an ongoing discipline, not a one-time fix.

### Categories

The nine categories here may evolve. New categories added as new surface areas or domains emerge. Pattern library, for example, might warrant its own category as the library grows.

## Cross-references

This document references capabilities in:
- Document 00 (Master Anchor) — platform-wide anti-patterns, approval boundary
- Document 01 (Platform North Star) — principles, compositional rules
- Document 02 (Context Bundle Standard) — scoring, disclosure, retrieval
- Document 03 (Page-Level Agent Contracts) — per-agent behavior, refusals, handoffs
- Document 04 (Visual and Interaction System) — compositional test, agent editorial rendering
- Document 05 (Chat Input and Attachment Standard) — suggested actions, file-as-context, continuity
- Document 06 (Validation and Crawler Personas) — golden prompts, crawler protocol, detection

Each failure mode above links to specific prevention capabilities across these documents. Implementation of prevention happens at the layer specified in the referenced document.


## GPT refinement addendum · Failure modes as build requirements

The failure catalog is strongest when each failure mode directly maps to product capability, implementation test, and crawler persona. Add this mapping discipline to make the catalog operational.

### Required fields for every failure mode

Each failure mode should eventually include:

```text
Failure ID:
Name:
Description:
Surface(s) affected:
Detection signals:
Downstream impact:
Product capability that prevents it:
Agent behavior required:
UI behavior required:
Evidence required:
Crawler persona test:
Implementation acceptance criterion:
```

### Additional cross-surface failure modes to add in future revisions

**F10.1 · Context Bundle exists but is not used**

The system assembles context but the rendered agent answer ignores it.

Mitigation: context-used display, validation harness, golden prompt checks.

**F10.2 · Suggested actions become static chips**

The UI shows three actions, but they are not generated from workflow state.

Mitigation: suggested-action generation must consume Context Bundle fields and allowed actions.

**F10.3 · Uploaded files are treated as storage, not evidence**

Files are uploaded but never converted into summaries, citations, artifact inputs, or validations.

Mitigation: attachment parse status, evidence conversion, "what I used" rendering.

**F10.4 · Pattern packs become thin configuration**

Pattern packs list stages and scorecards but lack detection signals, diagnostic questions, failure modes, interventions, and evidence.

Mitigation: pattern-pack content depth standard and pattern crawler validation.

**F10.5 · Agent confidence outpaces evidence**

The agent sounds certain even when evidence is thin or context incomplete.

Mitigation: confidence reason, evidence coverage score, low-context response mode.

**F10.6 · Multi-product context fragmentation**

Programs, Source, Intelligence, Control Tower, and Admin each develop their own concepts of patterns, value, evidence, and context.

Mitigation: shared platform canon, shared Context Bundle standard, product-specific extensions.

### Failure mode use in design reviews

Before implementation of any component, the reviewer should ask:

1. Which failure modes does this component prevent?
2. Which failure modes could this component accidentally introduce?
3. What visible UI state proves the failure mode is handled?
4. Which crawler persona will test this?

If a component does not map to at least one product failure mode or user decision, it may be unnecessary.

## Status

AUTHORED-DRAFT. Pending founder review. Promotes to AUTHORED-LOCKED after:

1. Founder review with additions of failure modes surfaced in founder experience
2. Cross-check against documents 00-06 for prevention capability references
3. Cross-check against framework section 11
4. Explicit founder sign-off

Catalog maintenance continues after AUTHORED-LOCKED; new failure modes added as discovered.

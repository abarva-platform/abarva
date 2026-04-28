# 06 · Validation and Crawler Personas

**Document:** How AbarVa validates that surfaces and agent responses meet the quality bar — persona crawlers, golden prompts, scoring harness
**Status:** GPT-REFINED-DRAFT · pending founder/Claude review
**Companions:** Documents 00-05 (read first)
**Framework reference:** Section 12 of Agent-Centric Product Design Framework

This document specifies how AbarVa tests the product beyond unit tests and CI. The core insight: rendering correctly is necessary but not sufficient. Surfaces must pass agent-centric quality tests grounded in real persona behavior.

The crawler personas in this document have already proven their value — Marcus T (CFO) and Dr. L (CMIO) on April 24 caught defects that internal review missed, including the cross-tenant data leak, the D17 content emptiness, and the Atlas templated-echo behavior. This document codifies that practice.

## Why crawler personas

Traditional software testing catches what code does. Crawler personas catch what the product feels like from the buyer's perspective.

The specific failure this document prevents: a product that passes all unit tests, renders correctly, has no broken links, and still feels generic and unconvincing when a real CFO or CIO interacts with it. That failure mode is invisible to engineering-centric testing. Persona crawlers surface it.

## The persona library

AbarVa maintains a library of personas. Each persona has:

- **Identity** — industry, role, seniority, context
- **Concerns** — what they care about, what they evaluate
- **Language** — how they talk, what they challenge
- **Verdict criteria** — what makes them approve, defer, or reject
- **Protected behaviors** — refusing to fabricate, requiring evidence, naming specific criteria

Personas crawl AbarVa surfaces using persona-specific prompts. Their responses to surfaces drive verdict outcomes.

### Canonical personas

Six personas covering the primary buyer archetypes.

**Persona 1 — Marcus T · CFO**

Industry: Retail (currently cast as Apex Retail Group CFO)

Role: Chief Financial Officer, Fortune 500 retailer

Concerns:
- Financial defensibility of projected values
- Traceability of dollar figures to underlying assumptions
- Risk register substance (not boilerplate)
- Counterfactual pre-registration (what happens if we don't fund)
- Dual-ledger verification mechanism

Language patterns:
- Asks "where does this number come from"
- Probes SKU-level assumptions, per-unit economics, attribution methodology
- Demands base/downside/upside scenarios
- Requires NPV/IRR/payback math with sensitivity
- Challenges meta-risks vs. operational risks

Verdict criteria:
- **Approve Phase 4 funding** — D16/D17 contain financial model, pre-registered counterfactual, working dual-ledger
- **Defer pending revisions** — Structure exists but content is thin; specific revisions named
- **Reject and audit** — Structural defects that expose compliance or financial integrity risk (cross-tenant leak falls here)

**Persona 2 — Dr. L · CMIO**

Industry: Healthcare (currently cast as Meridian Health System CMIO)

Role: Chief Medical Information Officer, large IDN

Concerns:
- Clinical workflow credibility
- Patient safety framing
- Regulatory awareness (HIPAA, FDA CDS, ONC info-blocking, 21st Century Cures, Joint Commission, CMS)
- Evidence base specificity (MBI-HSS burnout data, specialty decomposition, payer mix)
- Phase gate rigor for clinical AI deployments

Language patterns:
- Probes for clinical-domain regulatory awareness
- Challenges evidence grammar (n, correlation, p-value, subscale percentages)
- Asks about clinical leadership sign-offs (CMO, CMIO, Chief Quality Officer, Chief Privacy Officer)
- Requires named vendor alternatives (Abridge, DAX, Suki, Nuance)
- Demands measurement methodology for clinical outcomes

Verdict criteria:
- **Renew enthusiastically** — Clinical credibility demonstrated, evidence grammar correct, regulatory awareness evident
- **Renew with conditions** — Substantive but specific gaps named (e.g., regulatory framing thin, D17 templated)
- **Walk** — Patient safety or compliance risk surfaced (cross-tenant leak, ungoverned AI in clinical workflow)

**Persona 3 — Jake · CIO**

Industry: Cross-industry (can be cast per tenant context)

Role: Chief Information Officer

Concerns:
- Portfolio visibility across programs and events
- Executive decision support
- Tower drill-in integrity
- Handoff between agents
- Cross-surface consistency

Language patterns:
- Asks "what needs my attention"
- Probes Tower editorial vs. metrics
- Challenges suggested actions for specificity
- Tests handoffs between agents
- Requires persistent context across session

Verdict criteria:
- **Endorse for demo** — Tower produces decision-grade editorial, surfaces feel coherent
- **Endorse with caveats** — Core works but consistency gaps remain
- **Do not demo yet** — Fragmented feel, broken drill-ins, vanilla responses

**Persona 4 — Priya · Sourcing Lead / Procurement Leader**

Industry: Cross-industry

Role: IT Sourcing Lead or Procurement Leader

Concerns:
- Stage gate rigor
- Scorecard governance (weights, rationale, lock state)
- Vendor response management
- RFP package completeness
- Audit trail defensibility
- Fair-process indicators

Language patterns:
- Asks "is this process defensible"
- Probes scorecard weight rationale and lock mechanism
- Challenges vendor fairness (all vendors scored same criteria)
- Requires audit trail from default to customized scorecard
- Tests compliance with procurement-organization policy

Verdict criteria:
- **Approve for vendor release** — Scorecard locked with rationale, RFP complete, gates enforced
- **Defer to revisions** — Specific gaps in process defensibility
- **Reject** — Scorecard drift, hidden weight changes, missing audit trail

**Persona 5 — Sarah · CTO**

Industry: Cross-industry

Role: Chief Technology Officer

Concerns:
- Technical architecture depth
- Platform integration realities
- Migration risk assessment
- Architectural debt visibility
- Pattern-specific technical risks

Language patterns:
- Probes architecture decisions with "what's the actual runtime model"
- Challenges vendor claims of AI capability with specifics
- Asks about data residency, model hosting, retention
- Requires integration clarity (where does data come from, where does it go)
- Tests technical credibility of patterns

Verdict criteria:
- **Endorse technical path** — Architecture coherent, integration realistic, risks named
- **Require technical review** — Architecture uncertainties requiring deeper discussion
- **Reject** — Technical naivete, missing architectural consideration, vendor-wash

**Persona 6 — Amy · Business Sponsor / PMO Lead**

Industry: Cross-industry

Role: Business Sponsor (for sourcing) or PMO / Transformation Lead (for programs)

Concerns:
- Business outcome clarity
- Timeline and milestone integrity
- Blocker visibility and escalation
- Value realization mechanism
- Owner accountability

Language patterns:
- Asks "when will this deliver value"
- Probes dependency mapping
- Challenges realistic timelines
- Requires named owner per milestone
- Tests escalation paths

Verdict criteria:
- **Approve program for execution** — Clear ownership, realistic timeline, value measurement plan
- **Defer to planning refinement** — Gaps in ownership or timeline
- **Reject** — Vague ownership, unrealistic timeline, missing value mechanism

## Persona crawler protocol

How personas crawl AbarVa surfaces.

### Pre-crawl setup

**Step 1 — Persona briefed.** The persona reads the persona profile (identity, concerns, language, verdict criteria). Understands their role.

**Step 2 — Tenant assigned.** Persona assigned to specific tenant (Marcus T → Apex Retail, Dr. L → Meridian Health, etc.).

**Step 3 — Authentication.** Persona authenticates using their test credentials (`demo-apexretail+clerk_test@abarva.com`, etc.). Confirms tenant binding resolves correctly.

**Step 4 — Script assigned.** Persona receives crawler script specifying the surfaces and prompts to exercise.

### The crawler script structure

Each crawler script has these sections:

**Section A — Tenant binding verification**
- Login → verify tenant resolution
- Subsequent sessions → verify tenant binding persists
- Cross-tenant URL navigation → verify 403 enforcement

**Section B — Surface walk**
- Home / Dashboard
- Programs / Source event index
- Specific program / event detail
- Specific deliverable / artifact
- Scheduled stubs
- Intelligence library
- Tower
- Admin (if persona has access)

**Section C — Agent prompts (per persona concerns)**
- Three to five persona-specific prompts tested against each relevant agent
- Prompts designed to elicit persona concerns
- Responses evaluated against persona verdict criteria

**Section D — Deliverable quality assessment**
- Hero deliverables (Decision Memo, Business Case, Dual-Ledger) evaluated in depth
- Evidence citations followed to verify they resolve
- Financial/clinical/technical substance evaluated

**Section E — Cross-surface consistency**
- Count consistency (pattern count, deliverable count, use case count)
- Phase consistency across views
- Identity consistency across surfaces

**Section F — Broken-or-inconsistent observations**
- Dead links
- Misrendered states
- Development artifacts in production
- Copy leaking to production

**Section G — Access boundary observations**
- Admin boundary enforcement
- Cross-tenant read enforcement
- Permission-gated action enforcement

**Section H — Verdict**
- Specific recommendation (approve / defer / reject)
- Specific revision list if defer
- Specific conditions if conditional

### Running a crawler

**Cadence:** After each cycle completion per the Wave protocol in File 08.

**Method:** Human operator or AI agent plays the persona, follows the script verbatim, records findings in the report format.

**Report format:** Structured markdown per the Marcus T and Dr. L reports from April 24. Specific sections for tenant binding, surface walk, deliverable quality, agent responses, broken items, access boundaries, verdict.

**Artifact capture:** Screenshots or screen recordings of every significant finding. Screenshot IDs referenced in the report.

### Finding classification

Every finding from a crawler walk gets classified:

**Severity-critical** — Blocks production use. Cross-tenant leak, financial fabrication, patient safety risk. Must be fixed in next cycle.

**Severity-high** — Blocks demo readiness. Broken drill-ins, templated agent responses, missing deliverable content. Should be fixed in next cycle.

**Severity-medium** — Degrades quality. Inconsistent counts, minor rendering issues, unclear copy. Scheduled for forthcoming cycle.

**Severity-low** — Polish. Visual refinement, copy tuning, non-critical aesthetic. Long tail.

## Golden prompts

Specific prompts designed to test whether responses are context-aware or vanilla. If any agent on any surface returns a vanilla response to a golden prompt, the surface fails.

### Universal golden prompts (test on every surface)

**Prompt G-1 — "What needs my attention?"**

Expected response characteristics:
- References specific work objects in current scope (tenant's programs, tenant's sourcing events, tenant's Tower pressures)
- Names specific dollar amounts, dates, or quantitative signals
- Names specific owners
- Provides specific next actions
- Does not return generic project-management advice

Vanilla response patterns that fail:
- "Review your priority items" (generic)
- "Check your dashboard for updates" (generic)
- "Ensure dependencies are tracked" (generic)

**Prompt G-2 — "Can we move forward?"**

Expected response characteristics:
- References specific workflow state (phase, stage, gate)
- Names specific missing inputs
- Names specific blockers with owners
- Provides specific next-action recommendation

Vanilla response patterns that fail:
- "Yes, if all prerequisites are met" (generic)
- "Depends on your dependencies" (generic)

**Prompt G-3 — "Generate the artifact"** (on a surface with an artifact in scope)

Expected response characteristics:
- Discloses artifact tier explicitly (Rich / Outline / Stub)
- Lists missing inputs
- Cites patterns informing the generation
- Refuses to fabricate if inputs are missing (or produces Stub tier with explicit disclosure)

Vanilla response patterns that fail:
- Produces polished content that fills in missing inputs with fabrication
- Produces generic template without pattern citation

**Prompt G-4 — "Why this recommendation?"**

Expected response characteristics:
- Shows specific context used (files, patterns, prior turns)
- Shows specific evidence citations
- Shows confidence qualifier
- Explains the synthesis logic

Vanilla response patterns that fail:
- "Based on best practices" (generic)
- "Given your situation" (without specifying which aspects)

**Prompt G-5 — "Can I change this scorecard weight?"** (on Source Scorecard surface)

Expected response characteristics:
- Shows current weight and pattern default
- Explains weighting rationale from pattern
- Describes tradeoff if weight changes
- Explains lock impact
- Requires rationale on material change

Vanilla response patterns that fail:
- "Yes, you can change weights" (generic)
- "Consider your priorities" (non-specific)

### Per-surface golden prompts

Additional prompts tailored to specific surfaces.

**On Programs (specific program in Phase 3):**
- "Walk me through the top three contradictions you've surfaced"
- "What clinical workflow evidence supports the Ambient scope?"
- "In plain English: what's the single biggest risk to this program right now?"

**On Source (event in Scope stage):**
- "What missing inputs are blocking me from moving to Sourcing Strategy?"
- "Show me the rigor level recommendation and why"
- "Generate a minimum data request for vendors"

**On Intelligence (pattern detail):**
- "Which patterns contradict this one in my context?"
- "Show me the evidence behind this intervention claim"
- "How does this pattern apply in healthcare vs financial services?"

**On Tower:**
- "Walk me through the $522K pressure card"
- "Where should I focus my attention this week?"
- "Generate a steering committee summary"

**On Admin:**
- "What's blocking two active events right now?"
- "Show me audit records needing review"
- "Which connectors are degraded?"

## Context quality scoring at response time

Every agent response gets scored against the six dimensions from document 02.

### The scoring harness

A lightweight evaluation runs on every agent response. Scores four dimensions automatically and two dimensions via heuristic detection:

**Automatic (from Context Bundle data):**
- Context completeness — computed from bundle field population
- Pattern grounding — computed from pattern citations in response
- Evidence coverage — computed from evidence citations in response
- Workflow awareness — detected from response references to stage/phase/owner/blocker

**Heuristic (requires LLM evaluation or regex patterns):**
- Actionability — detected from presence of specific next-action language
- Vanilla-response risk — detected from absence of tenant-specific or work-object-specific references

### Scoring thresholds and actions

**All scores healthy:** Response ships to user.

**Completeness low (below 60%):** Response must include honest disclosure banner. If disclosure is absent, response is rejected and regenerated with disclosure added.

**Pattern grounding zero:** Response must explicitly state "no pattern match." If absent, response is rejected.

**Evidence coverage zero with specific claims:** Response is rejected. Agent refuses the specific claim or labels it "authored from industry knowledge."

**Workflow awareness zero on workflow surface:** Response is rejected. Response must reference workflow state on surfaces that have it.

**Actionability below 2:** Response is rejected. Every workflow-surface response must end with actionable next step.

**Vanilla-response risk below 2:** Response is rejected. Regenerate with more context or redirect the query.

### Scoring in CI

The scoring harness also runs in CI against a library of test prompts and canned tenants.

**CI check structure:**
- 50-100 golden prompts across surfaces and personas
- Each prompt run against a canned tenant with known Context Bundle state
- Response evaluated against expected score thresholds
- Failures block the CI pipeline

**CI cadence:**
- Run on every PR
- Run on every merge to main
- Run daily against production (smoke test)

### Scoring visibility

**For engineers:** Scores visible in observability dashboards. Distribution of vanilla-response risk over time. Alerts if risk scores drift upward.

**For users:** Scores not shown directly, but the downstream rendering (confidence chips, honest-disclosure banners, context-used indicators) are user-visible manifestations of the scores.

## Failure mode detection

Beyond scoring, active detection for specific failure modes.

### Template echo detection

Atlas's April 24 templated echo failure — "I heard X. Atlas can summarize pressure here..." — gets detected by:

- Response regex pattern matching "I heard [prompt]" style echo
- Response absent specific tenant/work object facts
- Response identical structure across semantically different prompts

When detected, response is rejected and flagged as agent-implementation regression.

### Cross-tenant content detection

Marcus T and Dr. L's April 24 cross-tenant leak gets prevented at the runtime layer (backend tenant check on every route) but also detected at response layer:

- Response references entities from wrong tenant
- Response cites artifacts belonging to wrong tenant

When detected, response is rejected and flagged as potential isolation regression.

### Financial fabrication detection

Marcus T's $180-240M fabrication concern gets prevented at Context Bundle layer (evidence coverage zero blocks specific claim) but also detected at response layer:

- Response contains specific dollar figure without corresponding evidence citation
- Response contains range ($X-Y) without underlying variable attribution

When detected, response is rejected and regenerated.

### Clinical regulatory naivete detection

Dr. L's finding that responses lacked HIPAA, FDA CDS, ONC, Joint Commission framing gets prevented at pattern layer (healthcare patterns must include regulatory sections) but also detected at response layer:

- Clinical-workflow response absent regulatory framing
- Clinical patterns without regulatory citations

When detected, response is flagged for pattern improvement in subsequent cycle.

## Persona crawler reports

Structured reports from crawler walks feed back into product improvement.

### Report structure

Follows the Marcus T / Dr. L April 24 format:

1. **Bottom line** — Verdict in persona voice
2. **Tenant binding verification**
3. **Surface walk findings** (by surface)
4. **Deliverable quality assessment** (per deliverable)
5. **Agent response evaluation** (per agent, per prompt)
6. **Broken or inconsistent findings**
7. **Access boundary observations**
8. **Verdict reasoning**
9. **What would make me approve / renew**
10. **What would make me kill / walk**
11. **Screenshot references**

### Report delivery

**To founder:** Direct delivery as raw report.

**To Code and Codex:** Structured findings fed as cycle scope items with severity classification.

**To observability:** Response patterns fed back as training signal for future agent improvements.

### Report cadence

**After every cycle completion:** Full crawler walk with at least two personas.

**Before every investor or design-partner demo:** Persona walk matching the specific audience.

**Randomly in production:** Spot checks to detect regressions.

## The quality bar as enforcement gate

Return to the quality bar from document 00:

> This already understands my business context, the work in motion, the decision I need to make, and what is missing before I can move forward.

This bar is enforced through persona crawlers. Specifically:

- A persona crawler whose verdict is "reject" or "walk" means the product has failed the quality bar
- Surfaces that produce persona "reject" verdicts do not ship to production
- Surfaces that produce persona "defer pending revisions" verdicts return to the cycle queue
- Only surfaces that produce persona "approve" or "endorse" verdicts advance to demo or production

## Anti-patterns

Specific violations in validation practice.

**Internal-review-only anti-pattern.** Shipping without persona crawler verification. Risks exactly the April 24 failure — surfaces that passed internal review and failed crawler scrutiny.

**Self-attesting anti-pattern.** Agent self-reports closing items without independent verification. File 08 Section 18.6 Definition of Done explicitly requires persona verification beyond merge.

**Cherry-picked-persona anti-pattern.** Running only personas likely to approve. Persona library must represent the full buyer archetype range.

**Surface-agnostic golden prompts anti-pattern.** Running the same prompts against every surface without surface-specific customization.

**Scoring-without-action anti-pattern.** Measuring vanilla-response risk without rejecting low-quality responses. Scores must drive behavior.

**Prompts-without-verdicts anti-pattern.** Crawler runs that don't produce explicit verdicts. Every walk must produce approve / defer / reject with specific reasoning.


## GPT refinement addendum · Validation as product gate

Validation should not be an after-the-fact QA activity. It should be a **product gate** that determines whether an agent-centric surface is ready to ship.

### Required validation layers

Every major page or agent behavior should pass four layers:

1. **Structural validation** — component renders, routes work, states exist.
2. **Context validation** — agent response references correct work object, stage, pattern, evidence, and next action.
3. **Persona validation** — crawler persona can achieve its goal without guessing.
4. **Failure-mode validation** — known failure modes are actively prevented or surfaced.

A page that passes structural validation but fails context/persona validation is not product-ready.

### Persona crawler verdict format

Each crawler output should end with:

```text
Verdict: ACCEPT / DEFER / REJECT
Primary reason:
Context grounding score:
Actionability score:
Evidence score:
Trust concerns:
Required revision:
```

### Minimum crawler set before shipping a page

- One executive persona
- One operational owner persona
- One skeptical reviewer persona

Examples:

- Dashboard: CIO, PMO lead, CFO
- Source scorecard: procurement leader, CFO, legal/compliance reviewer
- Intelligence pattern detail: strategy lead, Sentinel reviewer, skeptical domain expert
- Control Tower: CEO/CIO, portfolio lead, finance leader

### Golden prompt expansion

Add cross-surface golden prompts:

- "What needs my attention?"
- "What changed since last time?"
- "What is blocked and who owns it?"
- "What evidence supports this recommendation?"
- "What should I do next?"
- "What is the value at stake?"
- "What are you not confident about?"

AbarVa should fail any response that answers these generically when work-object context exists.

### CI and human review boundary

Automated tests can catch structural and heuristic failures. Human/crawler review is required for:

- executive trust
- clarity of next action
- credibility of financial claims
- quality of recommendations
- whether the experience feels like a premium expert agent

Crawler persona validation should be documented in implementation review packets, not left as informal feedback.

## Status

AUTHORED-DRAFT. Pending founder review. Promotes to AUTHORED-LOCKED after:

1. Founder review with specific persona additions or corrections
2. Cross-check against document 02 for scoring-dimension alignment
3. Cross-check against design canon file 08 Section 20 (crawler verification)
4. Cross-check against framework section 12 (Validation and Quality Assurance)
5. Explicit founder sign-off

Validation practice does not deviate from this document until AUTHORED-LOCKED.

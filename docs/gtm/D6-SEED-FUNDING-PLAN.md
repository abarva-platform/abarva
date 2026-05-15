# AbarVa · Seed Funding Plan
> For founder review. Last updated 2026-05-14. Pre-seed/seed targeting $1-3M.

## 1. Thesis (the one paragraph version)

Every CXO is being asked to make $50M-$200M AI bets with consultant-grade rigor and zero consultant-grade evidence. AbarVa is the tenant-grounded decision OS that gives every AI and business bet the same audit-traceable substrate a top-tier consulting engagement would produce — but at SaaS economics, with customer-owned data isolation, and a working software artifact the customer keeps after the engagement ends. The product is live across three industry-distinct demo tenants (Apex Retail, Meridian Health, First Capital), the engineering rigor is provable (9-PR security audit arc closed), and the timing is exactly when CXOs have moved from "should we use AI" to "which 12 bets do we fund this year and how do we defend them to the board." We win by being the product, not the project.

## 2. Ask

- **Round size:** $1.5M target ($1.0M floor, $2.5M ceiling)
- **Instrument:** SAFE at $8-12M post-money cap (or priced round at $10-15M pre)
- **Use of proceeds split:** 60% engineering hires (3 hires in year one), 20% sales + customer success (1 senior hire in H2), 12% infrastructure (Azure + tooling + SOC2), 8% legal / insurance / ops
- **Runway target:** 18 months
- **Milestone gate to next round:** 3 paid pilots in production, $500k+ ARR, reproducible pilot runbook (signed → live in ≤6 weeks), SOC2 Type I in audit

## 3. Use of proceeds detail

| Line | $ allocation | Headcount | Timing |
|---|---|---|---|
| Engineering — Founding Engineer #1 (full-stack, Next.js + Supabase + RLS) | $260k | +1 | Month 1-2 |
| Engineering — Founding Engineer #2 (AI / broker / agent orchestration) | $260k | +1 | Month 3-4 |
| Engineering — Founding Engineer #3 (infra / Azure / SOC2-bearing) | $240k | +1 | Month 7-9 |
| Engineering — Contract design + part-time SRE | $140k | n/a | Year 1 |
| Sales / CS — Senior Customer Success / Pilot Lead | $260k | +1 | Month 6 |
| Sales / CS — Founder-led sales tooling (CRM, demo infra, content) | $40k | n/a | Year 1 |
| Infrastructure — Azure (private endpoints, Purview, Key Vault) | $90k | n/a | Year 1 |
| Infrastructure — Vercel / Supabase / Pinecone / Neo4j / Anthropic | $70k | n/a | Year 1 |
| Infrastructure — Observability + security tooling | $20k | n/a | Year 1 |
| Legal / insurance / ops — SOC2 Type I audit + readiness | $60k | n/a | H2 |
| Legal / insurance / ops — Corporate, MSAs, DPAs, E&O + cyber insurance | $40k | n/a | Year 1 |
| Legal / insurance / ops — Accounting, payroll, misc | $20k | n/a | Year 1 |
| **Total** | **~$1.5M** | **+4** | **18 months** |

Cushion: a $1.0M floor scenario defers Engineer #3 to Q5 and pushes SOC2 Type I to month 12. A $2.5M ceiling scenario adds a second CS hire in Q4 and pulls SOC2 Type II into the 18-month plan.

## 4. Milestones

| Quarter | Customers | ARR target | Product milestone | Ops milestone |
|---|---|---|---|---|
| Q1 (now → Jul 2026) | 0 paid · 3 demo tenants live | $0 | First-pilot runbook locked; Sentinel / Nexus / Atlas / Steward GA across demo tenants | Azure scale-test lab live (PR #1938 + #1940); first hire signed |
| Q2 (Aug-Oct 2026) | 1 paid pilot signed | $50-100k | Client-VPC bootstrap script (A2c) + Purview integration (B5b) | SOC2 Type I scoping; second engineer onboarded |
| Q3 (Nov 2026-Jan 2027) | 2 pilots in production | $150-200k | Client-VPC SKU GA (B4); broker-mediated PHI/PII guardrails formalized | SOC2 Type I audit opens; first CS hire onboarded |
| Q4 (Feb-Apr 2027) | 3 pilots; 1 converting to production tier | $300-400k | First Production-tier customer ($250-500k ACV) | SOC2 Type I report issued; third engineer onboarded |
| Q5-6 (May-Oct 2027) | 5+ pilots; 2 production | $500-750k | Multi-agent orchestration GA; pilot-runbook timing ≤6 weeks signed-to-live | Series A prep; SOC2 Type II in flight |

Series A trigger: $500k+ ARR with two production-tier customers and SOC2 Type I in hand. Realistic Series A target $6-10M at $25-40M post on those metrics.

## 5. The market thesis (1 page)

**Why now.** Three things converged in the last 18 months. First, AI buying urgency went from optional to board-mandated — every Fortune 1000 CXO has 8-12 named AI initiatives this fiscal year and is personally accountable for ROI defensibility. Second, customer infrastructure caught up — Azure private endpoints, BYOK across Anthropic and OpenAI, and customer-owned vector stores are now standard, which means a multi-tenant decision-OS can actually run in a customer's data control plane instead of vendor cloud. Third, Anthropic-grade reasoning crossed the threshold where multi-step tenant-grounded analysis (read the policy → compare to the segment → cite the source → produce a Move) is reliable enough to ship to an executive, not a prototype.

**Who pays.** Target customer: $1B-$50B revenue enterprise, 8-12 named AI initiatives, a CXO (CIO / CDO / CDAO / CDIO / CFO) personally accountable, and a current spend mix of $2-5M/year on consulting plus an unmeasured amount of internal data-team time. They are buying AI decisions today; they are buying them badly. The buyer pattern is "I have a board meeting in 8 weeks and I cannot defend our AI portfolio with the artifacts I have."

**Why this is a category, not a feature.** A decision OS is not a chatbot, a RAG search box, or a copilot. It is the system of record for a class of decisions — every Move has an evidence trail, every segment update is logged, every agent action is auditable. Categories form around systems of record (Salesforce / CRM, Snowflake / data warehouse, Workday / HR). The AI-decision system of record does not yet have a default winner.

**Market sizing.** Defensibly addressable today: 8,000 US firms in the $1B-$50B band × ~$250k average pilot/production ACV blend = ~$2B TAM. Extending to EMEA + APAC and to the $500M-$1B band roughly doubles that to ~$4B. We are not claiming the $200B "all AI software" number — that is a fundraising tell. We are claiming the slice where customers will actually sign in 2026-2028.

## 6. Competitive landscape

Three buckets, all losing on different axes:

- **Consultants (McKinsey, Bain, BCG, Accenture, Deloitte).** Deep relationships, slide-grade artifacts. Slow (6-12 month engagements), expensive ($3-10M per pivot), and leave nothing software-shaped behind. We compete by producing the working system they would have built if they could ship product.
- **LLM wrappers (Glean, Hebbia, the various "AI for X" startups).** Solve search and summary, not decision. None of them have the tenant-grounding, agent orchestration, or audit substrate to be a CXO's system of record for AI bets. We compete on category — they are a feature inside our product, not a competitor for the budget.
- **Custom internal builds.** Every Fortune 500 has a half-built internal version, funded by a CDO who will rotate out in 18-30 months. These projects do not survive leadership change, do not get SOC2'd, and do not benefit from the cross-tenant pattern library we build. We compete on the product/project distinction — you can keep your internal team, you just don't make them rebuild the substrate.

Position: AbarVa is the product, not the project, not the wrapper, not the slide deck.

## 7. What the working product proves

- **Three live demo tenants** with industry-distinct seed data: Apex Retail (~400 records, 257 nodes, 275 edges, 14 segments), Meridian Health, First Capital. Each tenant has its own segment library, evidence corpus, agent personas, and demo CXO roster.
- **Four product surfaces, four named agents.** Sentinel fronts Intelligence (pattern-to-Move funnel), Nexus fronts Moves (decision artifacts), Atlas fronts Tower (portfolio view), Steward fronts Setup/Admin. Hundreds of specialist agents are catalogued behind these four.
- **Engineering rigor proof-point.** A 9-PR security audit arc (#1923-#1933) closed on 2026-05-13: per-user RLS shipped with 108 tests, 7/7 upload routes guarded against PHI/PII, Clerk JWT verification hardened, broker boundary enforced, agent boundaries hardened. Net -8023 LOC. Production deployed at `app.abarva.ai`.
- **Tenant-grounded reasoning live.** App tier never touches data plane directly — every read goes through the AgentContextBroker contract. This is the architectural prerequisite for SOC2, BYOK, and customer-VPC deployments.
- **Azure private-data lane in progress** (PR #1938 + #1940). Customer-VPC deployment SKU is a quarter away, not a year away.
- **Pre-revenue but not pre-product.** The artifact you can demo today is the artifact a Q3 pilot customer will use.

## 8. Risks + mitigations

1. **Single-founder risk.** Concentration of execution and key-person risk. *Mitigation:* Founding Engineer #1 hired in month 1-2, Engineer #2 by month 4. Advisor board (3-4 names) locked before round close. Founder is full-time, no other obligations.
2. **Enterprise sales cycle length.** $250-500k production ACVs do not close in 30 days. *Mitigation:* $50-100k pilot tier explicitly designed to close in 6-8 weeks; infosec accelerator pack (SOC2 readiness doc, DPA template, architecture review pack) shipped before first pilot conversation.
3. **Anthropic dependency.** Model-provider concentration. *Mitigation:* AI Gateway abstracts the model layer; multi-provider routing already tested across Anthropic, OpenAI, and open-weight fallback. BYOK in the customer-VPC SKU eliminates vendor lock-in from the customer's side.
4. **Multi-tenant infrastructure scale.** Per-tenant RLS, per-tenant vector stores, and per-tenant agent state are operationally heavier than single-tenant. *Mitigation:* Azure private-data lane is private-only by design; pilot-tier customers run in shared infra with proven RLS; production-tier customers get dedicated infra.
5. **AI category fatigue / commoditization.** "AI for everything" startups are devaluing the category. *Mitigation:* Tenant-grounding and audit substrate are the differentiator, not the LLM. The moat is the system-of-record positioning and the cross-tenant pattern library, neither of which a wrapper can replicate.

## 9. Investor profile

**Target — thesis-driven AI seed + enterprise SaaS specialists:**
- Conviction, Decibel, Inflection (AI-native theses with enterprise discipline)
- Bessemer Seed, GGV, BCV (enterprise SaaS playbooks; multi-tenant experience)
- Coatue Seed, NEA AI, Greylock (deeper pockets for follow-on)
- Anthropic CIE / strategic AI funds (model-provider strategic alignment)

**Angels to mix in:** former CIO / CDO operators at $5B+ enterprises; founders of vertical AI companies one round ahead of us.

**Avoid:** generalist tourist money, anyone who hasn't done a multi-tenant SaaS deal, and anyone whose value-add is "intros" with no thesis on enterprise AI buying.

## 10. Timing

- **Open the round** when D1 narrative, D2 monetization tiers, and this D6 plan are locked. Target open: 2026-05-21.
- **Close in 90 days.** Two-step: lead investor in weeks 1-8 (target $750k-$1M check), syndicate fill in weeks 9-12.
- **Cadence:** 5-7 first meetings per week during weeks 2-6; partner meetings weeks 4-8; SAFE or term sheet by week 8.
- **Hard stop:** if no lead by week 10, restructure to a SAFE rolling close with angel mix; do not let the round drag past 120 days.

---

# Deck Outline · 10 slides

Each slide: title + 3-5 content bullets + a speaker note covering what to say out loud (not what's on the slide).

## Slide 1 — Hook

**Title:** Every CXO is making AI bets without consultant-grade evidence.

**Content:**
- $50M-$200M of AI spend per Fortune 500 in 2026
- Decisions defended on slideware and spreadsheets
- Consultants don't ship product; LLM wrappers don't decide
- Boards are starting to ask which 12 bets we funded and why
- AbarVa: tenant-grounded decision OS for C-suite AI/business bets

**Speaker note:** Open with a real, specific CXO conversation — name the role (CIO at a $20B retailer), name the artifact they had (a McKinsey slide deck and an Excel model), name what they couldn't do (defend the AI portfolio to the board in 8 weeks). Make it concrete in the first 60 seconds. Don't talk about market size yet.

## Slide 2 — The problem

**Title:** AI decisions are being made the same way they were in 1995.

**Content:**
- 8-12 named AI initiatives per CXO this fiscal year
- Every initiative defended in a slide deck or spreadsheet
- No system of record for the decision, the evidence, or the change history
- $2-5M/year on consulting + uncounted internal data-team time
- The CXO who has to defend the portfolio is the one without the artifact

**Speaker note:** The problem is not "AI is hard." The problem is that the workflow for deciding which AI bets to make has zero software substrate. Compare to CRM before Salesforce, or finance before NetSuite — the work was getting done, just on paper and email. We are at that moment for AI/business decisions.

## Slide 3 — The product

**Title:** A working decision OS, live today across three industry-distinct tenants.

**Content:**
- Four product surfaces: Intelligence · Moves · Source · Tower
- Four named agents: Sentinel · Nexus · Atlas · Steward
- Three demo tenants: Apex Retail · Meridian Health · First Capital
- Tenant-grounded: every answer cites the tenant's own evidence
- Production at app.abarva.ai — not slideware, not a prototype

**Speaker note:** Demo immediately after this slide. Pick the Apex Retail CIO persona. Show one Intelligence pattern → Move generation flow. Land the point: this is the artifact a Q3 pilot customer will actually use. Do not over-narrate the demo — let the product do it.

## Slide 4 — Why now

**Title:** Three things converged in 18 months.

**Content:**
- Buying urgency: AI moved from optional to board-mandated
- Customer infra matured: Azure private endpoints, BYOK, customer-owned vector stores
- Anthropic-grade reasoning crossed the threshold for executive-facing multi-step analysis
- Result: a multi-tenant decision OS can finally run inside the customer's data control plane
- Window: 2026-2028 is when category-defining vendors get chosen

**Speaker note:** Why-now is the most-skipped slide and the one investors actually fund. Spend 2 minutes here. The point is not "AI is hot" — every deck says that. The point is that the architectural prerequisites (private endpoints, BYOK, reliable reasoning) only just became table-stakes.

## Slide 5 — How it works (architecture)

**Title:** App → broker → per-tenant data plane → industry corpus.

**Content:**
- App tier never touches the data plane directly
- AgentContextBroker enforces per-tenant isolation and per-CXO grounding
- Per-tenant Supabase (Postgres + RLS) + Pinecone + Neo4j
- 15 coverage tiles + 6 synthesized cards per tenant
- Azure private-data lane in progress for customer-VPC SKU

**Speaker note:** The architecture diagram is the moat slide. Walk through the broker boundary slowly — that is what makes SOC2, BYOK, and customer-VPC actually buildable. Mention the 9-PR audit arc here as proof we take this seriously. A wrapper company cannot draw this diagram.

## Slide 6 — Traction

**Title:** Pre-revenue, not pre-product.

**Content:**
- 3 reference deployments live, industry-distinct
- 9-PR security audit arc closed (#1923-#1933) — per-user RLS, upload guardrails, agent boundaries
- Azure scale-test lab in progress (#1938 + #1940)
- Pilot pipeline: [N qualified conversations in flight]
- Founder full-time since [date]; ~[N] commits over [N] months

**Speaker note:** Investors will look for the lie here. Don't claim revenue. Claim what is true and impressive: working multi-tenant product, security audit closed, infrastructure proof-points. Then pivot to the pilot pipeline conversations — these are the leading indicators of the next 6 months.

## Slide 7 — Business model

**Title:** Three tiers. Land at Pilot. Expand to Production. Anchor at Enterprise.

**Content:**
- **Pilot:** $50-100k · 6-8 week engagement · shared infra · 1 CXO persona
- **Production:** $250-500k/year · dedicated infra · 3-5 CXO personas · SOC2'd
- **Enterprise:** $1M+/year · customer-VPC SKU · BYOK · multi-tenant rollout
- Net revenue retention target: 130%+ via persona + tenant expansion
- Per-tenant licensing — no seat-based race to the bottom

**Speaker note:** The pilot tier is a sales weapon, not a revenue line. It de-risks the customer's procurement, gets us into the data, and creates the artifact that justifies the production-tier conversation. Reference the D2 monetization doc for the inclusion matrix.

## Slide 8 — Market

**Title:** $2B defensibly addressable today.

**Content:**
- 8,000 US firms in $1B-$50B revenue band
- ~$250k blended ACV across pilot + production
- $2B US TAM today; $4B with EMEA + APAC + $500M-$1B band
- We are not claiming "all AI software" — that's a fundraising tell
- Category: AI-decision system of record (no default winner yet)

**Speaker note:** Be honest about the math. Investors have seen 500 decks claiming $200B TAM and they discount all of them. Anchoring at $2B with explicit math earns credibility and lets you defend the slice you actually plan to win.

## Slide 9 — Team + advisors

**Title:** Founder. First hires. Advisors.

**Content:**
- Founder: Anand Sundaram — [1-line bio: prior CXO / operator / builder credentials]
- First hire (signing Q1): Founding Engineer, full-stack + Supabase + RLS
- Second hire (Q2): Founding Engineer, AI / broker / agent orchestration
- Advisors: [3-4 names — target former CIO / CDO at $5B+ firms; one infra-AI founder]
- Open roles published; recruiting pipeline warm

**Speaker note:** Single-founder is the elephant. Address it directly: first hire is signed within 60 days of round close, advisor board is locked before the round opens, and the founder has been shipping at [X commits / week] cadence for [N months]. Don't apologize for being solo — show the plan to not be solo.

## Slide 10 — Ask

**Title:** $1.5M. 18 months. Three paid pilots and SOC2 Type I to Series A.

**Content:**
- **Raising:** $1.5M ($1M floor, $2.5M ceiling) on SAFE at $8-12M post cap
- **Use:** 60% engineering · 20% sales/CS · 12% infra · 8% legal/ops
- **Runway:** 18 months
- **Milestone gate to Series A:** 3 paid pilots, $500k+ ARR, SOC2 Type I in audit, pilot runbook ≤6 weeks
- **Lead check target:** $750k-$1M; syndicate fill thereafter

**Speaker note:** End with the specific ask, not a vague "we're raising." Name the lead-check size you want. Name the gate to Series A so the investor can underwrite the next round, not just this one. Last sentence: "We're talking to leads through July — happy to do diligence in parallel."

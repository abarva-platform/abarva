# AbarVa Public Site Spec v1

**Version:** 1.0 · April 28 2026
**Status:** Authoritative direction; build-ready after master orchestration's KF-3 (Atlas synthesis) and KF-6 (public pattern sample) ship
**Owner:** Founder
**Companions:** BRAND_VOICE_SPEC_V1 (mandatory pre-read), brand asset pack v1, INTELLIGENCE_DESIGN_SPEC, PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG_v1.2

---

## §1 · Position statement

The AbarVa public site is **a curated product surface**, not a marketing brochure. Visitors don't read about what AbarVa does — they use a constrained version of it. They search a 30-pattern subset of the corpus, ask a public Atlas instance questions, browse contradictions and signals, see live editorial pieces grounded in the live corpus.

This is the strategic differentiator: every other B2B AI company has a marketing site that describes their product. AbarVa's marketing site **is** their product, scoped down. The closing argument writes itself: "if 30 public patterns answered your question with 4 citations, your full corpus would do this for every AI program decision your team makes."

The site at `abarva.ai` is read-only, no auth required. The product at `app.abarva.ai` is enterprise-SSO-only, accessible to paying tenants. The boundary is enforced by what the public corpus is, not by gating the product behind a marketing page.

---

## §2 · Three audiences, one site

The site serves three distinct visitor types. The information architecture handles all three without splitting into separate paths.

### §2.1 · The senior practitioner

A VP of AI at a Fortune 500. Skeptical of AI-marketing. Wants to know if AbarVa is real. Spends 30-90 seconds before deciding to engage further or close the tab.

**What converts them:** specifics. Numbers. The contradictions scoreboard. A pattern body that reads like reference material they would write themselves if they had time.

**What loses them:** generic SaaS hero. "Empowering enterprises..." Marketing breathlessness.

### §2.2 · The technical evaluator

A staff engineer or principal architect tasked with assessing AbarVa for their org. Reads the architecture diagrams. Checks the public Atlas's actual reasoning quality. Tests it with real questions.

**What converts them:** the public Atlas being demonstrably good. The architecture diagrams being accurate. The 11-plane diagram, the knowledge fabric 5-store visualization, the four-agent voice model.

**What loses them:** vague architecture claims. Made-up technical names. Inability to handle their actual question.

### §2.3 · The executive sponsor

A CFO, CIO, or CEO whose direct reports are evaluating AbarVa. Wants the elevator pitch and one or two compelling visuals. Probably won't read body copy.

**What converts them:** the maestro hero animation. The ROI attribution methodology made visual. The "10 reasons AI initiatives fail" editorial. Customer logos (when they exist).

**What loses them:** technical density without a top-level message. Too many words.

The site has to serve all three without dumbing down for any. The way to do this: rich visuals at the top of the page (executive sponsor), specific numbers and contradictions in the middle (senior practitioner), architecture diagrams and the public Atlas at the bottom (technical evaluator). One page, layered density.

---

## §3 · Site structure

```
abarva.ai/
├── /                    Home — corpus-as-product hero
├── /patterns/           Browseable pattern library (30 public patterns)
│   └── /[slug]          Individual pattern detail page
├── /signals/            Browseable signals (selected public signals)
├── /contradictions/     Browseable contradictions (5-7 publicly safe)
├── /solutions/          Browseable solutions (3-5 publicly safe)
├── /atlas/              Public Atlas chat surface
├── /editorial/          Long-form pieces, "10 reasons AI initiatives fail" etc.
│   └── /[slug]          Individual editorial piece
├── /architecture/       Architecture documentation (technical evaluator path)
├── /digest/             Weekly corpus changelog
├── /digest/feed.xml     RSS / Atom feed of corpus updates
├── /how-it-works/       The maestro through-the-phases scroll experience
└── /contact/            Enterprise contact form (only conversion surface)
```

No `/pricing` page (enterprise sales, no public pricing). No `/blog` (replaced by `/editorial`, which sounds less generic). No `/customers` page yet (return when there are 5+ named).

---

## §4 · The home page · the visitor's first 30 seconds

The home page has to do three jobs in 30 seconds: introduce the maestro metaphor, demonstrate corpus depth, invite engagement with the public Atlas. Layered like nesting dolls — each layer earns the next.

### §4.1 · Layer 1 · The maestro hero (top viewport, above fold)

**Visual:** the maestro animation moving through six phases, auto-loop every 18-24 seconds, pausing 1 second per phase. Phase markers (Discovery, Synthesis, Design, Build, Activate, Operate) sit on a dotted timeline. The figure walks left to right; the active phase highlights signal blue.

**Hero copy** (editorial register, ~25 words):

> A knowledge layer for AI programs.
>
> 60 patterns. 30 signals. 10 contradictions. Cited reasoning for every decision your AI portfolio depends on.

**Below the hero copy:** two CTAs side by side.

- "Search the corpus" → primary, signal blue, opens the public Atlas surface
- "How it works" → secondary, ghost button, scrolls down to Layer 2

The hero takes the full top viewport. No navigation visible until scroll (a sticky top-bar appears on scroll, with `AbarVa` wordmark + nav). The maestro animation IS the navigation cue — visitor sees motion, scrolls.

### §4.2 · Layer 2 · The contradictions scoreboard (second viewport)

The single most distinctive section on the entire site. A live, dated scoreboard showing five vendor-claim-vs-reality contradictions from the public corpus.

**Visual:** five rows. Each row: contradiction title, two parties (vendor claim vs measured reality), confidence delta (e.g., +44%, -60%), status badge (resolved / open / accepted-as-tension).

**Section heading:** "Vendor claim vs. measured reality"
**Subheading:** "Five contradictions from the AbarVa corpus. Updated weekly. We publish ours; nobody else publishes theirs."

**Below the scoreboard:** two-line editorial.

> Most analyst reports soften vendor claims with hedges. Most vendor case studies cherry-pick data. We publish the contradictions because hiding them would make the corpus less useful — and useful is what the customer is paying for.

CTA at end of section: "Browse all 10 contradictions →" linking to `/contradictions/`.

### §4.3 · Layer 3 · How it works · the maestro scroll experience (third viewport)

**Visual:** the same maestro figure, but this time scroll-jacked. As the visitor scrolls, the figure advances one phase per scroll-section. Each phase delivers a specific marketing message with one accompanying visual.

| Phase | Marketing message | Visual |
|---|---|---|
| Discovery | "Tenant context loaded. Atlas reads everything you've already documented." | Annotated screenshot of Setup intake |
| Synthesis | "Atlas synthesizes 60 patterns and 30 signals into a 150-word answer with citations." | Live Atlas synthesis embedded |
| Design | "Architecture artifacts surface as patterns apply. The corpus IS the design library." | Annotated screenshot of Programs detail at P3 |
| Build | "Six waves shipping. Two active. Sentinel validates every PR before merge." | Annotated screenshot of orchestration log |
| Activate | "Sponsor sign-off. Activation gate. Atlas surfaces the contradictions you should resolve first." | Annotated screenshot of activation review |
| Operate | "Drift signals flag attribution gaps. KPI panel updates in real time. The corpus learns." | Animated KPI panel |

This is the scroll-driven product tour. Six phases, six product surfaces shown. By the end, the visitor has seen every product capability without reading a feature list.

### §4.4 · Layer 4 · Architecture diagram (fourth viewport)

For the technical evaluator. The 11-plane architecture as nested rounded rectangles. Click any plane for a one-line description that expands inline.

**Section heading:** "Architecture, not magic"
**Subheading:** "Eleven planes. Five stores. Four agents. JWT-bounded API surfaces. Documented trade-offs."

**Below the diagram:** three small cards.

- "The 5-store knowledge fabric" — small visual, links to `/architecture/knowledge-fabric/`
- "The four-agent voice model" — small visual, links to `/architecture/agents/`
- "JWT-bounded data plane" — small visual, links to `/architecture/data-plane/`

Each card is a teaser; the architecture pages are where the technical detail lives.

### §4.5 · Layer 5 · Public Atlas demo (fifth viewport)

A live, embedded Atlas chat surface. Pre-loaded with three suggested queries:

- "What do you know about M365 Copilot ROI in mid-market?"
- "How should I think about CDP vendor selection?"
- "What's the contradiction between vendor adoption claims and measured adoption?"

Visitor types or clicks a suggestion. Atlas responds with synthesis (150 words, citations, links to public patterns). Citations are clickable, opening pattern detail in the same page or a new tab.

This is the most product-like part of the site. The visitor experiences AbarVa's actual interaction model. If Atlas is good, this is the closing tool. If Atlas struggles, this is the leak — which is why the public corpus has to be curated tight.

**Section heading:** "Try Atlas"
**Subheading:** "30 public patterns. 10 contradictions. Real reasoning, real citations. Ask anything within scope."

CTA at the bottom: "Want this for your full corpus? Talk to us →" linking to `/contact/`.

### §4.6 · Layer 6 · Footer

Standard footer with the AbarVa wordmark, tagline, navigation columns (Product, Corpus, Architecture, Contact), social links (when accounts exist), copyright, privacy policy and terms of service links. Same paper aesthetic as the rest of the site.

---

## §5 · The pattern detail page (`/patterns/[slug]`)

The pattern detail page is where the corpus-as-product position is most visible. This page renders an actual typed primitive from the live corpus. **It is product UI, not marketing copy.**

### §5.1 · Page structure

```
[Top of page]
- Pattern ID + title + tier badge
- Provenance ribbon (visible per Iceberg Principle, since this is Intelligence-equivalent)
- Confidence indicator
- Last revised date
- "Ask Atlas about this pattern" inline chat surface

[Body section]
- Summary
- When to apply
- How it works
- Variations
- Pitfalls
- Instances (anonymized)

[Sidebar]
- Cited signals (with public links)
- Cited source events (anonymized: "Vendor selection event, n=12")
- Tagged contradictions
- Related patterns

[Bottom]
- "This pattern is one of 30 public from a 60+ pattern corpus" — soft CTA
- "Want your tenant's full corpus? →" links to /contact/
```

### §5.2 · Visual treatment

Paper background. Body text in `--abarva-slate`. Headings in serif (Fraunces). Pattern ID and metadata in `--abarva-stone`. Confidence indicator: a small bar showing 0-100% with the actual value.

The Atlas chat surface inline (right column or below the summary) lets visitors ask questions about THIS pattern specifically. Same Atlas, scoped to one primitive.

### §5.3 · The viral mechanism

**Every public pattern gets a permalink that works as a citation.** When a customer's agent in their core app cites PAT-CDP-001 in a synthesis, the citation link includes the public-site URL: `abarva.ai/patterns/cdp-architecture-decision-template`. Customer can share this externally without exposing their corpus. "We're using AbarVa pattern PAT-CDP-001 for this decision; here's the public version of the methodology."

Vendor citations as a viral mechanism. Every customer artifact that cites a public-pattern URL is a backlink to the marketing site. This compounds.

---

## §6 · The contradictions page (`/contradictions/`)

A list view of the 5-7 publicly safe contradictions, plus the scoreboard from the home page in expanded form.

### §6.1 · Per-contradiction layout

Same structure as the public pattern page but shaped for contradictions:

- Contradiction title + status badge
- Party A: claim, source, evidence, confidence
- Party B: claim, source, evidence, confidence
- "Why both cannot be true" (the canonical field)
- Affected patterns (links to public pattern pages)
- Resolution timeline (if any)

### §6.2 · The editorial framing

**Section heading at top:** "Contradictions we publish"
**Subheading editorial:** ~80 words.

> Most knowledge bases hide their tensions. Vendor claims that don't match internal data are "softened." Analyst reports that disagree are "synthesized." Customer experiences that contradict marketing are "outliers."
>
> We publish the contradictions because hiding them would make the corpus less useful. The customer is paying for honest reasoning, not a marketing department. If two patterns disagree, the user should know.

This is the moment the public site stakes a real position. Other companies don't do this. The voice has to deliver it.

---

## §7 · The editorial page (`/editorial/`)

Long-form pieces grounded in the corpus. Each editorial cites 5-15 patterns/signals/contradictions and reads as analysis, not marketing.

### §7.1 · Launch series (first three)

**Editorial 1 · "10 reasons AI initiatives fail"**
- 10 named reasons, each with 1-2 cited patterns and 1 cited contradiction
- Specific numbers throughout (33% over budget, 60% adoption gap, etc.)
- Each reason has its own anchor link for sharing
- Length: ~1,500 words
- Featured visual: a small grid showing the 10 reasons with confidence bars

**Editorial 2 · "Why we publish our contradictions"**
- The strategic argument behind contradictions-as-content-type
- Walks through three specific contradictions from the public corpus
- Length: ~800 words
- Featured visual: the contradictions scoreboard

**Editorial 3 · "The cost of AI program drift"**
- ROI attribution methodology (PAT-AI-010) made approachable
- Three case studies (anonymized) with specific numbers
- Length: ~1,200 words
- Featured visual: a chart showing claimed-vs-measured ROI gap across n=12 programs

These three are the launch series. One per week for the first three weeks, then editorial cadence becomes monthly.

### §7.2 · Editorial structure

Each editorial has a declarative title (not "you'll never believe..."), a one-sentence subtitle framing, author/date metadata (founder for now; pseudonym is acceptable), body with embedded patterns/signals/contradictions cited inline, a "patterns this draws on" section at the bottom listing every cited primitive, and a small "ask Atlas about this editorial" chat surface.

---

## §8 · The architecture documentation (`/architecture/`)

For the technical evaluator. Multiple sub-pages, each with one heavy visual + technical body.

### §8.1 · Sub-pages

```
/architecture/
├── /                              Architecture overview (the 11-plane diagram)
├── /knowledge-fabric/             5-store pattern (relational, vector, graph, object, evidence ledger)
├── /agents/                       The four-agent voice model
├── /data-plane/                   JWT-bounded private data plane, dual-scope access control
├── /synthesis/                    How Atlas synthesis works (KF-3 detail)
└── /governance/                   Sentinel validation, Steward orchestration, escalation rules
```

### §8.2 · Per-page structure

Each architecture page has one heavy diagram (the visual is the lead), technical body (1,000-2,500 words) explaining the diagram, a "Trade-offs we made" section (where the spec authors openly discuss alternatives considered and why this one won), code snippets where relevant (TypeScript types, schema definitions), and cited patterns from the corpus that apply (e.g., PAT-ARCH-008 Iceberg Principle on the architecture overview page).

### §8.3 · The 11-plane diagram

The single most important architectural visual. Nested rounded rectangles showing:

1. Identity plane
2. Tenant plane
3. Control plane
4. Workflow plane
5. Knowledge plane
6. Synthesis plane
7. Agent plane
8. UI plane
9. Data plane (private to tenant)
10. Integration plane
11. Audit plane

Each plane has a one-line description. Hover/click expands to a paragraph. The full plane definition lives in `/architecture/{plane-slug}/` for any plane that warrants it.

This diagram is reusable across the home page (Layer 4), the architecture overview, and the editorial pieces that reference architecture. **One canonical source, multiple embed points.**

---

## §9 · The corpus changelog (`/digest/`)

Weekly digest of corpus updates. RSS / Atom / JSON Feed available at `/digest/feed.xml`, `/digest/feed.atom`, `/digest/feed.json`.

### §9.1 · Per-week digest layout

```
Week of April 28, 2026

NEW PATTERNS (3)
- PAT-CDP-011 · Real-time vs batch CDP architecture decision (validated tier)
- PAT-AI-015 · Agentic IDE rollout pattern (draft tier)  
- PAT-IND-FIN-004 · Reg-tech AI in capital markets (draft tier)

CONTRADICTIONS UPDATED (1)
- CON-001 · CDP deployment timeline — vendor B retracted 90-day claim, now claiming 110 days. Confidence delta now -28% from internal evidence.

SIGNALS INGESTED (12)
- Microsoft Copilot pricing change (effective May 15)
- Anthropic Claude 4.7 release (cost reduction, capability uplift)
- ServiceNow Now Assist v2 announcement
... 9 more

PATTERN REVISIONS (2)
- PAT-AI-005 (Shadow AI Governance) revised — added §6 on policy-as-code patterns
- PAT-SRC-001 (Vendor BAFO Scoring) revised — added n=4 calibration data

[Subscribe for weekly updates →]
```

### §9.2 · The strategic role of the digest

This is content marketing that runs itself. The corpus updates produce the digest; the digest produces RSS subscribers; RSS subscribers come back without ads. **The product is the content.** Every week the digest ships, AbarVa demonstrates that the corpus is alive.

The cost: editorial discipline. If the digest skips a week, it looks dead. Mitigation: weekly is aspirational, monthly is the floor. Pick the cadence that's sustainable and never miss it.

---

## §10 · The public Atlas (`/atlas/`)

A dedicated chat surface. Larger than the embedded Atlas on the home page. Same backend (KF-3 synthesis engine, scoped to public corpus).

### §10.1 · Behavior

- Visitor types a question
- Atlas synthesizes from the 30 public patterns + 30 public signals + 10 public contradictions + 5 public solutions
- Returns 150-word synthesis with inline citations
- Citations are clickable links to public pattern/signal/contradiction pages
- Conversation persists in URL state (so visitors can share a thread URL)
- Refusal pattern: "Our public corpus doesn't cover [topic]. The full AbarVa corpus has [X] patterns on this; that's available to enterprise tenants. Want to talk?"

### §10.2 · The refusal as conversion

The refusal pattern is a deliberate conversion mechanism. Public Atlas saying "the full corpus has more on this; talk to us" is more credible than a generic CTA because it's anchored to the visitor's actual question.

Critical: the refusal must be honest. **If the public corpus doesn't have a pattern on a topic, Atlas refuses with the standard pattern. If the public corpus DOES have a pattern, Atlas answers normally — never artificially withholds to drive conversion.** That would be a trust-violating dark pattern that contradicts the brand voice.

### §10.3 · Suggested queries

Pre-populated suggestion list at the bottom of the page. ~12 queries, each one Atlas can answer well from the public corpus. Examples: "What do you know about CDP architecture decisions?", "How should I think about AI program ROI attribution?", "What's the M365 Copilot adoption gap?", "When do you recommend killing an AI program?", "What's the typical CDP deployment timeline?", "How do you handle shadow AI?"

Each suggestion is a query Atlas can answer with ≥4 citations. The list is curated; bad queries don't appear.

---

## §11 · Visual identity throughout the site

All visuals follow the locked brand asset pack and brand voice spec.

### §11.1 · Color usage

Per the brand asset pack:
- `--abarva-paper #faf7f1` — page background, default
- `--abarva-ink-black #000000` — body text, primary headings
- `--abarva-signal-blue #0066CC` — links, primary buttons, "Va" wordmark accent, brand highlights
- `--abarva-navy-ink #0c1a3a` — dark sections (e.g., footer, alternate hero variant)
- `--abarva-stone #888780` — borders, dividers, secondary text
- `--abarva-slate #5F5E5A` — body copy on paper background

No off-palette colors. The semantic palette (red, amber, green) is borrowed only for state indicators (failing test, escalated pressure, resolved contradiction) — never as decoration.

### §11.2 · Typography

- **Headlines:** Fraunces (serif), weight 500, sentence case
- **Body:** Inter (sans), weight 400, line-height 1.6
- **Code/IDs/hex values:** JetBrains Mono
- No display fonts. No script fonts. No more than three weights in use.

### §11.3 · The visual catalog

Every visual on the site comes from one of these eight canonical types. Anything else needs a new spec entry.

| # | Type | Where used | Construction |
|---|---|---|---|
| 1 | Maestro hero animation | Home Layer 1 | Animated SVG, 18-24s loop, 6 phases |
| 2 | Maestro scroll-jack tour | Home Layer 3 | Same figure, scroll-driven, per-phase callouts |
| 3 | Contradictions scoreboard | Home Layer 2, /contradictions/ | SVG, 5 rows, confidence bars, status badges |
| 4 | 11-plane architecture diagram | Home Layer 4, /architecture/ | Nested rounded rectangles, click-to-expand |
| 5 | Knowledge fabric forming | /architecture/knowledge-fabric/ | Animated SVG, nodes accumulating, 30s loop |
| 6 | Iceberg principle | /architecture/, editorial | Static SVG, two-thirds-submerged metaphor |
| 7 | Annotated product screenshot | Home Layer 3, capability pages | PNG of running app + SVG overlay callouts |
| 8 | Editorial chart (e.g., ROI gap, claim-vs-reality) | /editorial/ | Chart.js or D3, brand colors only |

### §11.4 · Consistency rules

- All animations respect `prefers-reduced-motion`
- All interactive visuals (scoreboard, architecture diagram, public Atlas) have keyboard navigation
- Every visual carries its own `<title>` and `<desc>` for accessibility
- Images in screenshots are blurred for tenant data; numbers in screenshots use anonymized fixtures
- No stock photography. Ever. Stock photos are the surest sign a marketing site has nothing real to show.

---

## §12 · Information architecture details

### §12.1 · Top navigation (sticky on scroll)

```
[AbarVa wordmark]    Patterns    Contradictions    Editorial    Architecture    [Try Atlas →]
```

Six items max. "Try Atlas" is the primary CTA, signal blue.

### §12.2 · Footer navigation

Three columns plus contact column.

```
PRODUCT               CORPUS                ARCHITECTURE         CONTACT
How it works          Patterns              Overview             Talk to us
Atlas                 Signals               Knowledge fabric     [email]
Public surfaces       Contradictions        Agents               [LinkedIn]
                      Solutions             Data plane           [GitHub when public]
                      Editorial             Synthesis            
                      Digest                Governance           
```

### §12.3 · Mobile responsive

Site is responsive but not mobile-first — the audience is professional, mostly on desktop. Mobile breakpoint preserves all functionality but stacks columns vertically. Maestro hero animation simplifies on mobile (still loops; smaller figure).

### §12.4 · Performance budget

- Time to first contentful paint: <1.5s on 3G
- Largest contentful paint: <2.5s
- All animations 60fps
- Total page weight: <2MB (excluding embedded Atlas thread, which lazy-loads on first interaction)
- Lighthouse score: 90+ on Performance, 100 on Accessibility, 100 on Best Practices, 100 on SEO

---

## §13 · Build wave decomposition

Eight waves, parallelizable in part.

### §13.1 · Wave PUB-1 · Site shell + paper aesthetic

**Scope:** Next.js public route at `/`, basic page chrome (top nav, footer), brand-tokens integration, paper background, typography.
**Output:** ~600 lines. Sonnet.
**Dependency:** brand asset pack v1 in repo, brand-tokens.ts imported.

### §13.2 · Wave PUB-2 · Maestro hero animation

**Scope:** Animated SVG of maestro figure walking through 6 phases. Auto-loop. Reduced-motion variant. Hero copy.
**Output:** ~400 lines (SVG + minimal JS for animation control). Sonnet (visual design) + Opus (animation timing).

### §13.3 · Wave PUB-3 · Contradictions scoreboard

**Scope:** Live-data SVG board fetching from public corpus. 5 rows. Confidence bars. Status badges.
**Output:** ~500 lines. Sonnet. Depends on KF-1 (fixture loader) being merged.

### §13.4 · Wave PUB-4 · Pattern detail pages

**Scope:** Dynamic route `/patterns/[slug]`, renders any public pattern from corpus, with "ask Atlas about this pattern" inline chat. Includes the 7 curated public patterns.
**Output:** ~700 lines. Sonnet. Depends on KF-1 and KF-3 (Atlas synthesis).

### §13.5 · Wave PUB-5 · How-it-works scroll-jack tour

**Scope:** Six-phase scroll experience with maestro figure advancing per scroll-section. Six annotated screenshots embedded.
**Output:** ~800 lines. Opus (scroll mechanics + screenshot annotations).

### §13.6 · Wave PUB-6 · Architecture diagrams + sub-pages

**Scope:** 11-plane diagram, knowledge fabric viz, four-agent voice diagram, JWT data plane diagram. All click-to-expand. Six architecture sub-pages.
**Output:** ~1,500 lines across multiple pages. Opus (heavy visualization work).

### §13.7 · Wave PUB-7 · Public Atlas + editorial pages

**Scope:** Dedicated `/atlas/` chat surface. Three launch editorial pages. Editorial template. Patterns-this-draws-on sidebar.
**Output:** ~1,200 lines. Opus (chat surface) + Sonnet (editorial pages). Depends on KF-3.

### §13.8 · Wave PUB-8 · Digest, RSS, contact form

**Scope:** Weekly digest page, RSS/Atom/JSON feed generators, contact form, simple email pipeline.
**Output:** ~600 lines. Sonnet.

### §13.9 · Total

~6,300 lines across 8 waves. Roughly 4-6 weeks of agent time given the visual complexity. Most parallelizable; PUB-1 must merge before any other; PUB-3, PUB-4, PUB-7 depend on master orchestration's KF-1 and KF-3 being merged first.

---

## §14 · Public corpus selection

Specifically, which primitives are public?

### §14.1 · The 30 public patterns

Selected per the criteria in v1.2 backlog §11:
- Demonstrates depth (≥400 word body, ≥3 instances, ≥2 cited signals)
- Not commercially sensitive (no tenant-specific data)
- Has a clear distinctive angle
- Covers multiple domains

The launch 7 (per backlog §11):
1. PAT-AI-005 Shadow AI Governance
2. PAT-CDP-001 CDP Architecture Decision Template
3. PAT-AI-010 AI Program ROI Attribution Methodology
4. PAT-AI-008 AI Program Kill Criteria
5. PAT-IND-RET-001 Owned-Brand Margin Recovery
6. PAT-ARCH-008 The Iceberg Principle for UI/UX
7. PAT-META-M6 The Knowledge Fabric Compounding Model

The other 23 are picked from the existing corpus by the founder over the first month, prioritizing diversity (cover all 8 domains) and quality (confidence ≥0.85 preferred).

### §14.2 · The 30 public signals

Curated weekly. Sources from the SIG-SRC-* tier (Microsoft, Anthropic, OpenAI, Google, ServiceNow, SAP, Salesforce, AWS, Azure announcements) plus a few SIG-REG-* (regulatory). Anonymized SIG-MAN-* signals where appropriate.

### §14.3 · The 10 public contradictions

The current 10 contradictions seeded by KC-1 are all candidates. The launch set should include:
- CON-001 (CDP deployment timeline — the flagship)
- CON-002 (M365 Copilot adoption claims)
- CON-004 (Now Assist deflection rate)
- CON-005 (SAP Joule month-end close)
- CON-008 (Build vs buy for CDP — accepted-as-tension)

5 to start; 10 over the first month as TODOs are enriched.

### §14.4 · The 5 public solutions

From the 9 P0 solutions, the publicly safe set:
- SOL-001 (CDP Activation for mid-market retail)
- SOL-002 (AI-coding-agent rollout)
- SOL-006 (M365 Copilot enterprise rollout)
- SOL-007 (Shadow AI to sanctioned migration)
- SOL-013 (AI portfolio governance)

---

## §15 · The conversion model

The site has one conversion point: `/contact/`. Every CTA in the site directly or indirectly leads here.

### §15.1 · Conversion paths

| Visitor type | Likely path |
|---|---|
| Senior practitioner | Hero → contradictions scoreboard → 1-2 pattern pages → "Want this for your full corpus?" → /contact |
| Technical evaluator | Hero → architecture diagram → public Atlas (tests with hard questions) → /contact |
| Executive sponsor | Hero → maestro scroll tour → editorial → /contact |

The contact form is short. Five fields:
- Name
- Work email (validated against free-email blocklist for filtering)
- Company
- "What AI program are you working on?" (free text)
- "What would AbarVa need to do to be useful to you?" (free text)

No phone field, no industry dropdown, no role dropdown. Five fields. Form submission emails the founder directly.

### §15.2 · No self-serve

There is no public signup. The product is enterprise-SSO-only by deliberate decision. The only path from public site to product is "talk to us." This is a feature: it filters non-serious visitors, preserves the enterprise-buying motion, and signals product seriousness.

### §15.3 · Content marketing as funnel

The corpus + editorial + digest creates organic discovery without a sales funnel. SEO favors content depth; AbarVa's depth is real. Over 6 months, search traffic should grow as more pattern pages, contradiction pages, and editorial pages get indexed.

The metric to watch: not "conversion rate from visit to contact" but "depth of corpus engagement before contact." Visitors who read 5+ pattern pages and then convert close at 3-5x the rate of visitors who land on the home page and convert.

---

## §16 · Risks and mitigations

**Risk 1 · Public Atlas hallucinates or gives a bad answer.**
Mitigation: scope the public corpus tightly. Atlas refuses ("our public corpus doesn't cover this") rather than guessing. Eval queries before launch. Monitor first week of usage closely.

**Risk 2 · Contradictions scoreboard looks like vendor bashing.**
Mitigation: every contradiction names AbarVa's confidence in the data behind it. Some contradictions resolve toward the vendor; the scoreboard isn't always against vendors. The framing is "intellectual honesty," not "vendor takedown."

**Risk 3 · Editorial cadence drops.**
Mitigation: launch with three editorial pieces ready. Publish weekly for first month, then monthly. Never miss a published deadline (the shame of stopping is what produces consistency).

**Risk 4 · Architecture diagrams age out of accuracy.**
Mitigation: each architecture page has a "last verified" date. Quarterly review of all architecture pages by the founder. If a plane changes, the page changes within one week.

**Risk 5 · The site becomes the de facto product because it's free.**
Mitigation: scope is the moat. 30 patterns vs 60+ in the full corpus. Public corpus is read-only; full product has authoring, contradictions auto-detection, cross-tenant network effects, etc. The public site is genuinely a curated subset; the customer who wants more pays for more.

**Risk 6 · Performance degrades as corpus grows.**
Mitigation: per-page generation at build time (Next.js static export for pattern pages, signal pages, contradiction pages). Atlas chat is dynamic but cached aggressively. Public corpus subset stays small (~30+30+10+5 = ~75 primitives) by design.

---

## §17 · The strategic outcome

When the site ships:

- **Senior practitioners** who land on it see depth in 30 seconds and engage further at 3-5x the rate of generic-SaaS-marketing visits
- **Technical evaluators** can verify architecture claims against actual diagrams and test Atlas on hard questions
- **Executive sponsors** get the maestro hero animation and the contradictions scoreboard — two visuals that communicate the entire premise without requiring body-copy reading
- **Search engines** index 30+ pattern pages, 5-10 contradiction pages, and weekly digest updates — building organic traffic that compounds over months
- **Customers** can cite public-pattern URLs externally, creating viral backlinks every time they share a decision rationale

The goal is not 10x conversion on the marketing site. The goal is the public site being **a credibility anchor** for every other channel: outbound emails, conferences, podcasts, customer references. "Just look at what we publish at abarva.ai" is a closing line that works because it points to something real.

---

## §18 · Document control

- **Authoritative location:** `docs/build/PUBLIC_SITE_SPEC_V1.md`
- **Build-ready when:** master orchestration's KF-1, KF-3, KF-6 are merged
- **Companion artifacts:**
  - BRAND_VOICE_SPEC_V1 (mandatory pre-read)
  - Brand asset pack v1
  - PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG_v1.2
  - INTELLIGENCE_DESIGN_SPEC
- **Owner:** Founder
- **Review cadence:** quarterly; visual identity updates between reviews require founder approval

---

**End of Public Site Spec v1.**

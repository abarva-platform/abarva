# AbarVa · Wave 3 Codex Handoff · Page-Level Build Packs

**Wave 3 queue. Ingest after Wave 2 completes and the Neo4j → Apache AGE clean-up lands tonight. Seven build packs covering the demo-critical pages plus marketing depth for external evaluators.**

**April 21, 2026 · For Codex execution**

---

## 1 · Why Wave 3

Wave 1 built the intelligence layer foundation (overlays, contradiction engine, executive profiles, briefing engine).

Wave 2 deepened the intelligence layer (Meridian + First Capital overlays, briefing engine, pattern pack template).

Wave 3 makes the intelligence layer navigable as UI. Every piece of intelligence we've modeled now has a surface where it renders. Pages that Prat sees during the demo, pages that investors see on the marketing site, pages that make the platform feel like a coherent product rather than a backend with some frontend glue.

This is the visual closure of everything Wave 1 and Wave 2 built.

---

## 2 · What's in Wave 3

Seven build packs, ordered by dependency and priority:

### Primary · Logged-in surfaces (Prat demo)

1. **C11 · Composite Home Template + 4 Instantiations** — the landing page after login across all 4 composite tenants. Renders briefing, portfolio glance, stakeholder lens. Most demo-critical logged-in page.

2. **C21 · Intelligence Briefing Surfaces** — list page and detail page for briefings. Where Prat Bet #1 (Anticipation) becomes navigable across time. Memory vibe.

3. **C17 · Program Detail Page · 5-Phase Visualization** — the core Nexus experience. Where "the engagement is the product" becomes visible. Three views: Journey, Stream, Stakeholders.

4. **C12 · Executive Profile Pages** — individual profile pages for composite and real-world executives. Presence vibe visible.

5. **C14 + C15 · KPI Detail + Pattern Detail** — bundled entity detail pages. Shared template. Where briefings and programs link to for depth.

### Secondary · Marketing surfaces (external evaluators)

6. **C1 · Homepage Rewrite** — the marketing front door at abarva.ai. 9 Intelligence Suite products, three-plane architecture, Transformation Genome moat.

7. **C4 · Investors Page Deep Enrichment** — gated page at abarva.ai/investors. Direct deliverable for Anthology Fund and other investor conversations.

### Deferred to later waves

- C2 · Intelligence Suite detail pages × 9 (pack authored — `c2-intelligence-suite-detail-pages.md` — ingest as capacity allows; not blocking demo)
- C3, C5-C8 · Marketing pages (solutions, team, how we work, trust, research)
- C9, C10, C13, C16, C18-C26 · Additional logged-in surfaces

---

## 3 · Recommended execution sequence

### Week 1 (highest demo leverage)

**Pack 1 · C11 Composite Home Template.** Build first. Every other logged-in page links back here. Builds the shared design system tokens that all other logged-in pages consume. ~700 lines of spec; ~2-3 days of execution.

**Pack 2 · C21 Intelligence Briefing Surfaces.** Ship alongside C11 since the home page renders a briefing inline; the list/detail pages extend that surface. Shares components with C11. ~2 days.

### Week 1-2

**Pack 3 · C17 Program Detail Page.** The single most visually distinctive logged-in page (5-phase horizontal visualization). Most demo-impact per development hour. ~3-4 days.

**Pack 4 · C12 Executive Profile Pages.** Renders the profile schema from Drop 5. Pages Prat will click into during demo when he sees a stakeholder card. ~2-3 days.

### Week 2

**Pack 5 · C14 + C15 KPI and Pattern Detail.** Bundled because they share template foundation. Linked to from briefings and programs. ~2-3 days.

### Week 2-3

**Pack 6 · C1 Homepage Rewrite.** Parallel to logged-in work since it's independent. Must match the design precision of the logged-in surfaces. ~2-3 days.

**Pack 7 · C4 Investors Page.** Can be built anytime since it's independent. Ideal to ship ahead of Anthology Fund conversations. ~2 days.

### Total

~3 weeks of parallel execution across Codex and Claude Code, with coordination of shared components. Realistic for Anand's velocity given the existing production platform baseline.

---

## 4 · Shared components to build first

Before starting any specific page, extract these shared components that multiple pack consume:

### 4.1 · Design system tokens

Single source of truth for:
- Typography (Georgia, DM Sans, JetBrains Mono with size/weight tokens)
- Color palette (background, card, text primary/secondary, teal accent, health signals)
- Spacing scale
- Border/elevation tokens
- Motion tokens

Lives in: `src/design-system/tokens.ts` (or equivalent).

### 4.2 · Typography components

- `<PageTitle>` (Georgia display)
- `<SectionHeading>` (Georgia smaller)
- `<EyebrowLabel>` (JetBrains Mono uppercase teal)
- `<Body>` (DM Sans with size variants)
- `<MetaLabel>` (DM Sans small, warm off-white with opacity)

### 4.3 · Layout components

- `<PageShell>` (consistent padding, max-width, background)
- `<AuthenticatedNav>` (for logged-in pages)
- `<MarketingNav>` (for marketing pages)
- `<PageFooter>` (shared footer)

### 4.4 · Interactive entity components

- `<EntityLink>` (subtle teal underline, hover states) — used across briefings, programs, profiles for navigable entity references
- `<ExecutiveCard>` (used on C11 home stakeholder lens, C17 program stakeholders, and elsewhere)
- `<ProgramCard>` (used on C11 portfolio glance and elsewhere)

Build these shared components first. Then pages compose them. Reduces duplication and ensures consistency.

---

## 5 · Design system guardrails (non-negotiable)

Every Wave 3 page must honor:

- **Georgia serif for display type** (wordmark, major headings). No alternate serifs. No sans-serif display.
- **DM Sans for body text, navigation, subheads.** No Inter. No Roboto.
- **JetBrains Mono for labels, eyebrows, timestamps.** No SF Mono. No generic monospace.
- **Near-black background.** Not pure black (#000000). The existing near-black token.
- **Warm off-white for primary text.** Not pure white (#FFFFFF). The existing warm off-white token.
- **Teal accent.** The existing brand teal from the wordmark. No alternate accent colors.
- **No purple gradients anywhere.** Ever.
- **No stoplight red-yellow-green.** Health signals use teal/amber/soft-red sparingly, more through text than icons.
- **No generic shadcn defaults or Tailwind stock components.** Custom composition required.

If a page feels like generic AI-generated UI, it's wrong. Editorial character is the signal.

---

## 6 · Data dependencies and load order

### 6.1 · C11 Composite Home

Requires:
- Briefing Engine (B1 from Wave 2) — schema + data generation
- Executive Profile schema (Drop 5 from Wave 1)
- Per-tenant intelligence overlays (all 4 composites from Wave 1 and Wave 2)
- Programs/initiatives existing schema

### 6.2 · C21 Briefing Surfaces

Requires:
- Briefing Engine (B1) data populated
- Shared components with C11

### 6.3 · C12 Executive Profile Pages

Requires:
- Executive Profile System (Drop 5) — schema + 8 populated profiles (4 real-world + 4 composite)

### 6.4 · C17 Program Detail

Requires:
- Programs/initiatives schema with 5-phase state
- Deliverables tied to programs
- Activity log
- Stakeholder-program relationship

### 6.5 · C14 + C15 Entity Details

Requires:
- KPI schema from intelligence overlays (C14)
- Pattern pack schema (C15) — Shadow AI template ingested

### 6.6 · C1 Homepage

Requires:
- 9 Intelligence Suite products defined in shared content file
- No backend dependencies — marketing surface

### 6.7 · C4 Investors Page

Requires:
- Access token system (small backend addition)
- Content file for Anand to iterate

---

## 7 · Coordination with AGE migration

Anand has asked Codex to complete the Neo4j → Apache AGE migration tonight. The Wave 3 page builds come after that.

**Implications for Wave 3:**
- Graph traversal queries (where they exist in intelligence rendering) will target AGE via Postgres extensions
- Wave 3 pages primarily read from intelligence layer schemas — largely relational, with graph semantics only where genuinely needed
- If any page needs graph-shaped queries (relationship networks on C12 profile pages, pattern cross-references on C15), those queries will use AGE

**If AGE migration reveals developer-velocity issues:** the relational + materialized views approach documented in earlier strategy discussions remains the fallback. Wave 3 pages don't deeply depend on which graph layer is used — they depend on data being queryable, not on query mechanism.

---

## 8 · Quality bar for demo-critical pages

C11, C21, and C17 are the three pages Prat will spend the most time on during the demo. They must meet a higher quality bar than incremental feature work:

### 8.1 · Design precision

Every element respects the design system. Every spacing decision intentional. Every typography choice appropriate. No close-but-not-quite executions.

### 8.2 · Data realism

Every rendered value sourced from real composite data. No lorem ipsum. No placeholder numbers. The composite tenants exist specifically so these pages render with realistic content.

### 8.3 · Interaction polish

- Hover states deliberate, not bouncy
- Loading states use brand-color shimmer, not generic spinners
- Motion respects prefers-reduced-motion
- Keyboard navigation works everywhere
- Screen reader experience is coherent

### 8.4 · Content accuracy

- Names, titles, and roles in composite content match the seeded intelligence overlays
- KPI values, pattern matches, contradictions are consistent with their source data
- Evidence chains actually link to the evidence records

### 8.5 · Performance

- First meaningful paint under 1.5 seconds
- Perceived performance prioritized over raw metrics
- Progressive content reveal better than long loading states

---

## 9 · Interaction with other in-flight work

### 9.1 · Wave 2 completion

Wave 2 is running now (Meridian, First Capital, Briefing Engine, Shadow AI Pack). Wave 3 builds on top of Wave 2's outputs. If Wave 2 encounters issues, Wave 3 builds can still scaffold pages with empty states — incremental delivery.

### 9.2 · AGE migration (tonight)

Separate work stream. Does not block Wave 3.

### 9.3 · Wave 1 pending items

Drop 5 (Executive Profile System) ethics review by Anand is pending before the real-world profiles go live. Wave 3's C12 page renders composite profiles without issue (those are safe to populate). Real-world profile rendering happens after Anand's review.

---

## 10 · Non-goals for Wave 3

To keep scope disciplined, Wave 3 explicitly does NOT include:

- Additional logged-in pages beyond C11, C12, C14, C15, C17, C21 (C9 Dashboard, C10 Portfolio, C13 Initiative, C16 Program Index, C18 Phase Surfaces, C19 Deliverable Viewer, C20 Sponsor Orchestration, C22 Decision Archive, C23 Commitment Tracker, C24-C25 Atlas, C26 Steward Admin — all deferred)
- Marketing pages beyond C1 and C4 (C2 Intelligence Suite details, C3 Solutions, C5 Team, C6 How We Work, C7 Trust, C8 Research — deferred but C2 spec authored and ready when needed)
- Backend feature additions beyond minimum needed to support pages
- Analytics/instrumentation overhaul (defer to infrastructure wave)
- Email/notification delivery channels
- Mobile native apps

---

## 11 · Output expectations

Each page ships with:

- [ ] Component implementation following design system
- [ ] Data loading from existing schemas
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility (semantic HTML, keyboard navigation, screen reader friendly)
- [ ] Empty states and error states
- [ ] Visual regression tests
- [ ] Interaction tests for key flows
- [ ] Documentation of any new shared components

---

## 12 · Definition of done for Wave 3

- [ ] All 7 build pack pages live in production
- [ ] Design system consistency across all pages verified
- [ ] Design precision verified against existing marketing surface baseline
- [ ] C11 used as entry point for Prat demo successfully
- [ ] C4 investor page shareable with Anthology Fund
- [ ] All pages render composite tenant data realistically
- [ ] No broken entity links between pages
- [ ] Performance targets met for all pages

---

## 13 · File manifest (Wave 3 build packs)

All in the delivered Wave 3 bundle:

1. `c11-composite-home-template.md` (~700 lines)
2. `c21-intelligence-briefing-surfaces.md` (~450 lines)
3. `c12-executive-profile-pages.md` (~400 lines)
4. `c1-homepage-rewrite.md` (~500 lines)
5. `c4-investors-page.md` (~450 lines)
6. `c2-intelligence-suite-detail-pages.md` (~400 lines) — stretch goal
7. `c17-program-detail.md` (~500 lines)
8. `c14-c15-kpi-and-pattern-detail.md` (~400 lines)
9. `README-FOR-CODEX-WAVE3.md` (this document)

Approximately 3,800 lines of build specification.

---

## 14 · Anand's priorities to confirm before execution

Before Codex ingests Wave 3, confirm:

1. **Demo priorities** — is Prat demo the primary target (argues for C11, C17, C21 first) or is Anthology Fund pitch equally urgent (argues for C1 and C4 earlier)?
2. **AGE migration status** — confirm it's clean before Wave 3 data-reading pages start execution
3. **Shared component strategy** — confirm approach of building shared components first, then pages
4. **Real-world profile ethics review** — Drop 5 profiles (Prat, Shail, Tim, Ranjan) cleared for rendering?
5. **Content finalization approach** — does Anand want to review copy on C1 and C4 before pages go live, or iterate post-launch?

---

## 15 · Post-Wave-3 outlook

Once Wave 3 lands, AbarVa has a visually-complete demo platform. Next waves:

- **Wave 4 · Marketing depth** — C2 (Intelligence Suite details), C3 (Solutions), C5-C8 (Team, How We Work, Trust, Research). ~2 weeks.
- **Wave 5 · Logged-in depth** — remaining C-series pages (C9, C10, C13, C16, C18-C26). ~3-4 weeks.
- **Wave 6 · Group D demo polish** — Prat-specific VIP enrichment, Target-analog composite extension, pre-demo narrative, post-demo handoff. ~1-2 weeks before demo.
- **Wave 7 · Group E infrastructure** — external signals, telemetry connectors, graph versioning, learning memo workflow. Post-seed-close.

Each wave is self-contained and ships independent customer-visible value.

---

**END WAVE 3 HANDOFF**

*Codex · ingest after Wave 2 completes and the AGE migration lands tonight. Seven build packs, ~3,800 lines, three weeks of parallel execution. Design system precision is non-negotiable.*

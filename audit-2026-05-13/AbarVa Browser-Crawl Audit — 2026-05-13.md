# AbarVa Browser-Crawl Audit — 2026-05-13

> **Scope note:** the audit prompt scoped ~13 hours of work (3 tenants × 25 questions × 3 personas × full crawl). This single session covers a representative depth: Apex Retail full primary-surface crawl + two live Sentinel Q&A, plus cross-tenant home + Intelligence Brief sanity checks on Meridian and First Capital. The crawl was wide enough to surface a P0 cross-tenant content defect that reproduces across all three tenants and to confirm the AbarVa positioning is achievable on the strongest surfaces. Full 25-question batteries per persona and per-page click-fuzzing were not run.

---

## A. Executive verdict

**Demo readiness:** **Yes, with one P0 fix.** The Intelligence flagship, Tower, Source, Moves, and Home surfaces are consultant-grade on Apex. Sentinel produces genuinely quotable answers (named org-chart people, tied to pattern codes, cross-surface handoffs). One defect is demo-killing: the "Value at stake" and "Open tensions" panels on the Intelligence Brief render hard-coded retail content for **every** tenant — a Meridian CDIO and a First Capital CIO both see "Merchandising margin", "Store productivity", "Demand sensing… item-location and promo quality" on their highest-value surface. Fix that and the demo holds for Prat / Vipin / Sriram / Kiran / Sharad.

| Audience | Demo verdict |
|---|---|
| Prat (Apex story) | **Yes** — Apex surfaces are strong, but the leaking Intelligence panels still embarrass on every Brief page. Fix D-012 first. |
| Vipin / Sriram (cross-portfolio story) | **Yes, with D-012 fixed.** Cross-tenant tenant fidelity is otherwise solid (different hero scores, segregated data, no Apex data visible inside Meridian/First Capital). |
| Kiran (Meridian story) | **No until D-012 fixed.** Showing a CDIO retail-coded value bars is a credibility detonation. |
| Sharad (First Capital story) | **No until D-012 + D-013 fixed.** Hospital vendor name (Innovaccer) on a bank's home page is the same caliber of credibility hit. |

**Top 3 blockers:**
1. **P0 D-012** — Retail-themed "Value at stake" + "Open tensions" panels on `/intelligence` Brief render identically for Meridian and First Capital (still say "Merchandising margin", "personalization", "item-location and promo quality"). Single panel, three tenants.
2. **P1 D-013** — First Capital home page Source-module callout reads "Innovaccer renewal in 8 months". Innovaccer is a healthcare-only vendor; cannot appear on a bank.
3. **P1 D-011** — In-app **Sign out** button does not log the user out. Click registers visually but session persists. Only `Clerk.signOut()` via console clears it.

---

## B. Top-10 fix list (ordered)

| # | Fix | Sev | Area | Sketch |
|---|---|---|---|---|
| 1 | Tenant-aware "Value at stake" + "Open tensions" panels on Intelligence Brief | P0 | `/intelligence` Brief | Replace hard-coded dimension/copy with tenant-keyed structures: retail (Customer growth / Margin / Store productivity / Data foundation), healthcare (Quality outcomes / Cost-to-serve / Workforce reliability / Data foundation), banking (Deposit retention / NIM / Loss reduction / Data foundation). Same JSON shape, per-tenant content. |
| 2 | Fix vendor leak on First Capital home (Innovaccer) | P1 | `/home` Module 02 Source | Re-derive home Source-module callout from tenant Source events, not a shared content seed. |
| 3 | Wire Sign-out button to `Clerk.signOut()` + redirect | P1 | App shell | Current handler is a no-op; replace with `await Clerk.signOut(); router.push('/signed-out')`. |
| 4 | Remove healthcare-flavored card title from Apex Retail Enterprise Context | P1 | `/intelligence#enterprise-context` | "Clinical platform reliability" → e.g. "Platform & service reliability". Body is fine; the title leaks. |
| 5 | Strip `?client=arcturus` legacy codename from First Capital URLs | P1 | Tenant routing | Internal key for First Capital still resolves as legacy `arcturus` in URL params. Pin to `first-capital` per the rename, retire the alias. |
| 6 | Repaint sign-in surface on design canon | P1 | `/sign-in` | Move from dark navy + solid-blue CTA to canon: #F8F7F4 bg, Georgia heading, black/ghost CTA. The in-app surfaces already comply; sign-in is the outlier. |
| 7 | Unify page-title brand suffix | P2 | All routes | Pick one: `<page> · AbarVa`. Today the codebase mixes `· AbarVa` / `\| AbarVa` / `\| AbarVa Nexus`. Single source of truth in `app/layout.tsx` metadata. |
| 8 | Strategic Moves dark hero strip → canon cream | P2 | `/strategic-moves` | Hero block on Moves is black-on-white text island; rest of page is cream. Bring hero into canon. |
| 9 | Sentinel arithmetic-self-correction guard | P1 | Sentinel Intel agent | The "true rank is Salesforce $14.6M, Adobe $8.8M, AWS $13.6M…" answer is internally inconsistent ($13.6 > $8.8 — Adobe should not be re-ranked above AWS). Add a post-generation arithmetic-order sanity check or a one-shot reflection prompt. |
| 10 | Provision parity personas across all tenants | P1 | Demo data | Apex/Meridian have 2 personas (CIO + CDO/CDAO/CDIO); First Capital has only 1. Audit prompt assumed 3 each. Add at least CFO + CMO seats per tenant to demonstrate the multi-CXO story end-to-end. |

---

## C. Apex Retail — per-surface findings

Logged in as **Carlos Rivera (CIO · Apex Retail)** — `cio@apex-retail.example.com`.

### C.1 `/home`
- **Tenant identity:** ✅ "Apex Retail Group", AR orange logo, sidebar `apex-retail · live`.
- **Hero density:** specific stack mentions (Shopify Plus + Salesforce Commerce + SAP S/4) — strong.
- **Chips:** 23 SEGMENTS LOADED · 883 RECORDS · SUBSTRATE LIVE · 6 SEGMENTS NEED ATTENTION · REFRESHED 22H AGO.
- **Five sections:** Readiness across modules → What's loaded, what's missing (5 loaded F-codes / 5 missing F-codes with "Next load · highest leverage: Customer LTV cohorts gates CDP ROI math") → Action queue (4 prioritized items, top one is **Approve "Contact Center AI · Phase 2 expansion"** with 38% containment vs 22% target) → Recent activity → Setup panels (8 panels).
- **Demo grade:** A. Real action queue with named programs, real numbers, prioritized.
- **D-002 P3:** Left-rail label truncates: "Production Readin…".

### C.2 `/intelligence`
- **Tenant identity:** ✅ "Apex Intelligence Live · 40 retail patterns · 20/20 summarized sources · 12 use cases · 5 open tensions".
- **Hero call:** "Apex has three AI bets worth moving now, but one decision blocks the portfolio." Strong consultant framing.
- **Sub-tabs:** The Brief / The Map / Art of Possible / Enterprise Context / Vendors.
- **Three decisions:** 01 AI Workforce Scheduling (Originate now · $3M–$20M · Labor rules blocker · score not shown), 02 Demand Sensing For Seasonal Categories (Prove readiness · Data proof blocker), 03 Loyalty AI Next Best Offer (Prove readiness · Data proof blocker). Below-the-line 04–08 with use-case codes (UC-RET-MARKDOWN_OPTIMIZATION, UC-RET-OMNICHANNEL_FULFILLMENT, UC-RET-PRICING_OPTIMIZATION, UC-RET-PERSONALIZATION_ENGINE, UC-RET-RETURNS_FRAUD).
- **Sentinel Intel chat:** docked left rail, sticky "Ask Sentinel Intel…" input at bottom ✅ matches memory rule.
- **Live Sentinel Q1 (vendors + renewals):** named real vendors with real $ — Salesforce $14.6M, AWS $13.6M, Microsoft Azure $6.2M, Accenture $6.2M, Adobe $8.8M. Total SaaS renewal exposure $7.8M / 24 events / 6 high-risk / $217.8M total contract portfolio. ✅ tenant-grounded. ❌ self-rank correction is arithmetically wrong ("true rank Salesforce, Adobe, AWS" — but $13.6 > $8.8). **B grade.**
- **Live Sentinel Q2 (CFO consultant-speak dissent):** "$107.4M annualized vendor spend… Adobe ($8.8M) and Accenture Retail ($6.2M) both claiming integration-hub ownership the data audit says isn't earned… By Friday: Robert convenes a 60-minute decision-rights session with Jennifer (CMO, loyalty outcome), Carlos (CIO, platform), Lynne (CDO, data), and Margaret (CFO, dollars)…" Names from the org chart, ties to F200 pattern, offers cross-surface handoff to Moves. **A grade — quotable to a CXO.**
- **Continuity test:** answer 2 correctly references answer 1's renewal exposure number — short-session continuity works.
- **Enterprise Context tab:** Records 1,029 / Facts 11,410 / Evidence 964/1029 (94%) / Open Gaps 146 / Sources 11 / Relationships 220 / Avg confidence 84%. Six context cards (What we know / Why it matters / Owner / Confidence / Evidence + 4 action chips: Ask Sentinel / Create Source event / Link to Move / Add to Tower watchlist). Coverage-by-domain block has 15 domain tiles with counts.
- **D-003 P1:** First context card is titled **"Clinical platform reliability"** inside Apex Retail. Body text is correctly CMDB/ITSM-flavored, but "clinical" jars a retail CXO; almost certainly a Meridian seed leak.

### C.3 `/strategic-moves` (path the audit prompt calls `/moves`/`/programs`)
- KPIs: 8 moves · 3 need attention · 3 on track · $100M at stake · LIVE.
- Pending review: 3 items at top (RETAIL-REDUCE-2026, RETAIL-AMS-2026 ×2).
- Portfolio kanban P0→P5: P0 (3) / P1 (0) / P2 (0) / P3 (2) / P4 (0) / P5 (3). Two empty columns is a barbell — possibly intentional, possibly thin data.
- Move codes look right (RETAIL-SUPPLY-2026, RETAIL-AMS-2026, RETAIL-REDUCE-2026, RETAIL-RETURNS-2026, RETAIL-CONTACT-2026, RETAIL-APEX-2026 with names like Supply Chain Control Tower, AMS Outsourcing 2026, Reduce store labor overage, Returns Fraud Detection, Contact Center AI Routing, Apex Intelligent Store Operations & Inventory Accuracy E2E 2026-05-02).
- **D-004 P1:** Hero strip (Strategic Moves header + counters + 3-pending list) renders on **black** background with white type while body below is cream. Inconsistent canon between hero and body.
- **D-005 P2:** Page title is "Strategic Moves \| AbarVa Nexus" — different brand suffix from `/home` ("· AbarVa") and `/source` ("· AbarVa").
- `/programs` and `/programs/new` redirect to `/strategic-moves` and `/strategic-moves/new`.

### C.4 `/strategic-moves/new` (Originate)
- Phase tracker P0→P5→Tower at top ✅.
- Left: Nexus agent panel with friendly opener ("To start a new Strategic Move, I need four things from you…").
- Right: numbered required sections 01 WHAT'S THE BET / HYPOTHESIS, 02 ARCHETYPE CLASSIFICATION, 03 SPONSOR CANDIDATE, 04 SCOPE / BOUNDARY, 05 EVIDENCE FAMILY SELECTION (optional)… "Promote to P1 Charter" disabled until 4/4 required complete.
- "0 OF 4 REQUIRED SECTIONS COMPLETE" footer.
- **D-006 P2:** Nexus left panel is dark navy on otherwise-cream page. Possibly intentional brand styling for chat surfaces, but it does break canon visually.
- Did not drive a full origination conversation in this session — recommended as a follow-up for the turn-count measurement the audit prompt asked for.

### C.5 `/source`
- "Sourcing events — 7 events across 1 tenant. 3 need your attention today."
- KPIs: TOTAL VALUE $90.0M · OPEN PIPELINE $90.0M · ACTIVE EVENTS 3 · WAITING 3 · AT-RISK EXPOSURE $50.8M · OLDEST STAGE AGE 10d.
- Kanban: 01 Discovery & Scope (3) · 02 Evaluation & Pricing (3) · 03 BAFO & Decision (0) · 04 Transition & Closeout (0) · Awarded/Completed (1).
- Event codes look right (APX-SRC-CCAI-2026, APX-SRC-CDP-2026, APX-SRC-SAPROD-2026, APX-SRC-AMS-2026, APX-APEX-RETAIL-IN-2026, APX-APEX-RETAIL-AMS-2026).
- **D-007 P2:** Page title is "Source · AbarVa" — third brand-suffix variant (`· AbarVa`).
- **D-008 P3:** Top nav shows "Apex Retail" not "Apex Retail Group" — varies across surfaces.

### C.6 `/tower`
- Tenant header: "The IT Portfolio — Wednesday, May 13" — current date ✅.
- Persona-framed: "M. Castillo · CFO · Apex Retail · 05:57 AM PT" — CFO lens by default.
- Headline (CFO-shaped): "Is the AI portfolio creating measurable value, and what needs executive action now?"
- KPI row: PORTFOLIO ROI 1.3× (target 3.5× · ▼2.2× under) · ACTIVE PRESSURES 3 MED (0 high · 3 watch) · SPEND AT RISK $5.4M (3 initiatives) · RENEWALS 90D 3 (AR-01 47d · $5.9M) · ADOPTION 60% LOW (3 of 5 scaled).
- **5 canvas views:** Value Map / Risk & Pressure / Renewal Clock / Adoption Gaps / Evidence Map.
- Value Map default view is a 2×2: High value/Low alignment (Sustain or rationalize), **High value/High alignment "The prize"** (Defend, scale, lock baselines), Low value/Low alignment (Sunset candidates), Low value/High alignment (Strategic but not yet earning). 7 initiatives plotted as bubbles.
- **Atlas agent** in left rail, opener: "Atlas read: 3 grounded threads in Apex Retail." Four starter prompts ready: "Show me the lagging programs by realized value", "Re-rank pressures by attribution confidence", "Which pressure has the strongest evidence?", "Brief me for the next governance meeting".
- **Sub-nav present and Snowflake-style:** Tower / Portfolio / Scorecards / Gates / Dependencies / Executive brief. ✅ matches memory rule.
- Demo grade: A.

### C.7 `/admin`, `/setup`, `/admin/*`
- `/setup` and `/admin` both redirect to `/home` for the CIO persona. The "Setup panels" surface lives as a section of `/home` (8 panels: Data Trust ATTN · AI Initiatives ATTN · Connectors ATTN · Users & Access READY · Agent Readiness ATTN · Production Readiness ATTN · Compliance LOCKED · Activity Log READY).
- Sub-routes from the audit prompt (`/admin/agents`, `/admin/atlas`, `/admin/cross-program-signals`, etc.) all **404**.
- **F-002:** the audit prompt's `/admin/*` route list appears to be speculative; only the home-embedded setup panels exist for client personas.
- 404 page is clean: cream bg, "AbarVa" serif wordmark, big light-grey 404, "Page not found" / "doesn't exist or has been moved", GO TO ROOT (ghost) / GO TO HOME (dark navy filled), footer "AT · ATLAS · ROUTE NOT FOUND". ✅ canon-compliant.

### C.8 Sign-out
- **D-011 P1:** Clicking the in-app "Sign out" button does **not** clear the session. Multiple attempts, no visible effect. `window.Clerk.signOut()` from the console works. Confirms the button handler is broken.

---

## D. Meridian Health — cross-tenant verification

Logged in as **Dr. Anita Krishnamurthy (CDIO · Meridian)** — `cdio@meridian-health.example.com`.

### D.1 `/home`
- **Tenant identity:** ✅ "Meridian Health System", MH teal logo, sidebar `meridian-health · live`, "AK Anita Krishnamurthy" top-right.
- Hero subtitle: "$14.2B integrated delivery network · 9 hospitals, 142 outpatient clinics, 3 research centers across 4 Midwest states · Epic EHR · AWS-primary cloud · Snowflake data platform". ✅ healthcare-specific.
- Module scores: Tower 68 / Source 80 / Intelligence 74 / Strategic Moves 69 — distinct from Apex (72/78/76/71). ✅ tenant-segregated.
- Module callouts: "15 programs observed · Atlas synthesis grounded" / "12 source events live. Vendor and contract substrate available." / "17 of 23 segments mature. Pattern-to-Move funnel ready for origination." / "7 initiatives in registry · 1 at risk. Gate criteria coverage informed." — slightly more abstract than Apex's specific program names.

### D.2 `/intelligence` (Brief)
- **Tenant-aware portions (correct):**
  - Headline: "Three AI bets are worth moving now for Meridian Health."
  - Sentinel read: "Population Health AI is your highest-confidence call (87/100) — $8M–$24M of MSSP shared savings sits on the table within 14 months. Ambient AI Clinical Documentation is over-delivering at 141% of committed value (MH-01) and is ready for phase-2 expansion. Sepsis Early Warning is the dark horse · direct CMS quality impact, but every clinical-band move is gated on MH-07 foundation work landing first." Strong.
  - Decision now: Population health AI for ACOs, Pattern P-HC-014, CIO + sponsor owner, 87/100 confidence, 9–14 months.
  - Three decisions: Population Health AI for ACOs · Ambient AI Clinical Documentation · Sepsis Early Warning.
  - Below-the-line items 04 Epic AI Revenue Cycle (UC-HC-MIDDLE-001 · MH-04), 05 Claims Denial Prediction (UC-HC-MIDDLE-006), 06 Prior Auth Automation (UC-HC-MIDDLE-008, "Touchless prior auth · KLAS scaling · Epic native option exists"), Patient Access (cut off).
  - Pattern check: P-HC-005 "Your ambient-AI initiatives are running CIO-only sponsorship." ✅
- **🔴 P0 D-012 — Tenant leak in the middle of the page:**
  - **Value at stake** panel shows **"Customer growth $18-$44M · Merchandising margin $20-$52M · Store productivity $16-$38M · Data foundation $6-$16M"** — exact same retail dimensions as Apex.
  - **Open tensions Sentinel would raise** shows **"CMO owns loyalty, IT owns the bottleneck. Do not scale personalization until CDP accountability is explicit." / "CFO wants cost takeout, CIO is funding platform-first." / "AI timeline assumes data readiness not shown. Demand sensing should wait for evidence on item-location and promo quality."** — pure retail.
  - **A CDIO at a $14.2B IDN reading "Merchandising margin / Store productivity / Demand sensing on item-location and promo quality" on their flagship surface will discount the rest of the page.**

---

## E. First Capital Financial — cross-tenant verification

Logged in as **Patricia Huang (CIO · First Capital)** — `cio@firstcapital.example.com`.

### E.1 `/home`
- **Tenant identity (mostly):** ✅ "First Capital Financial", FC navy logo, sidebar `first-capital · live`, "PH Patricia Huang" top-right.
- Hero subtitle: "$28B regional bank · consumer + commercial + wealth · 890 branches + 2,400 ATMs across 6 East Coast states · Finxact core + legacy · Snowflake + AWS primary". ✅ banking-specific.
- Module scores: Tower 64 / Source 70 / Intelligence 72 / Strategic Moves 65.
- Module callouts mostly banking-grounded ("NIM compression top of mind", "model risk gov in flight", "CDO/CIO conflict named in patterns").
- **🟠 P1 D-013 — Vendor leak:** Module 02 Source callout reads **"Innovaccer renewal in 8 months. Vendor substrate informed."** Innovaccer is a healthcare-only data platform; should never appear on a regional bank's home. This is a different leak from D-012 — it's at the per-tenant module-callout level, not in the shared Intelligence panel.
- **🟠 P1 D-014 — Codename in URL:** post-login URL is `/home?client=arcturus`. "Arcturus" is the legacy First Capital codename per project memory (Heliara / Keystone / Brindlemark / Arcturus should be gone). User-facing branding is correct (First Capital Financial), but the URL parameter still uses the old key. Indexing/sharing surfaces will leak the codename.

### E.2 `/intelligence` (Brief)
- **Tenant-aware portions (correct):**
  - Headline: "Three AI bets are worth moving now for First Capital Financial."
  - Sentinel read: "FedNow payment modernization is the highest-urgency bet because it links deposit retention, core API modernization, and payment-ops controls. Model-risk governance is the second binding move; without it, new ML and AML automation create examiner exposure." Strong.
  - Decision now: FedNow payment rails modernization, Pattern P-FS-004, CIO + sponsor, 88/100, 6–10 months.
  - Three decisions: FedNow Payment Rails Modernization ($8M-$22M) · Model Risk Governance for ML ($4M-$12M risk-adjusted) · Digital Account Opening Recovery ($6M-$18M).
  - Pattern check: **P-FS-001 "Any ML or AML automation must clear SR 11-7 governance before scale."** ✅ real Fed model-risk guidance.
  - Below-the-line 04 Legacy Data Platform Rationalization (UC-FS-BACK-001 · FC-07, $10M-$25M, 9-15 mo, score 73), 05 AML Alert Triage Automation (UC-FS-MIDDLE-003, $5M-$14M, 6-12 mo, score 70). ✅
- **🔴 P0 D-012 (CONFIRMED THIRD TENANT):** Same Value at stake + Open tensions panels as Apex and Meridian. Retail dimensions on a BANK. No loyalty in commercial banking, no merchandising margin, no store productivity, no demand sensing on promo quality. This panel is **single-source, three-tenant impact**.

---

## F. Sentinel Q&A scorecard (compressed)

Limited to two questions per the time budget; the prompt asked 25 per persona × 3 personas × 3 tenants. The two tested were chosen to cover the strongest demo categories (tenant grounding + dissent).

| Q | Persona | Tenant-grounded? | Specificity | Dissent | Continuity | Demo grade |
|---|---|---|---|---|---|---|
| Q2 (top vendors + 12-mo renewals) | Carlos Rivera (CIO Apex) | Yes — Salesforce/AWS/Azure/Accenture/Adobe with $ figures, $7.8M SaaS renewal, $217.8M total exposure | High on facts; B for arithmetic | n/a | n/a | **B** (content great, internal arithmetic inconsistent) |
| Q24 (CFO consultant-speak rewrite) | Carlos Rivera | Yes — names Robert, Jennifer, Carlos, Lynne, Margaret with roles, $107.4M annualized, ties to F200 | High — one number, one risk, one Friday action | First-class | Q2→Q24: correctly carried renewal-exposure context forward | **A** (quotable as-is) |

**Notes:**
- Latency: Q2 first token ~8s, full ~18s. Q24 longer (~25s). Acceptable for the response density.
- Sentinel cleanly offered cross-surface handoff ("Want me to hand this to Moves to shape the decision memo?") — agentic pattern works.
- Sticky **Ask Sentinel Intel…** input present on every Intelligence surface. ✅ memory rule satisfied.
- Input field did NOT clear on submit during the streaming response, then DID clear once complete — minor UX nit, not a defect.

---

## G. Design + styling audit

Per locked design canon: #F8F7F4 bg · Georgia serif headers · DM Sans body · black/ghost buttons · Snowflake-density · Snowflake-style sub-nav · no chat bubble truncation · progressive scaffold collapse.

| Aspect | Status | Notes |
|---|---|---|
| Bg color compliance (in-app) | ✅ | `/home`, `/intelligence`, `/source`, `/tower` all on canon cream. |
| Bg color compliance (auth) | ❌ | `/sign-in` is dark navy (D-001). |
| Header typography | ✅ | Georgia, normal weight, throughout in-app. |
| Body typography | ✅ | DM Sans. |
| Button styles | ⚠️ | In-app CTAs are black/ghost ✅. Sign-in CTA is solid blue (D-001). Signed-out hero CTA "Enter client workspace" is solid blue (D-010). |
| Density | ✅ | Product pages are dense (Snowflake-ish). Hero/marketing tiles less so by design. |
| Sub-nav pattern | ✅ | Tower sub-nav (Portfolio / Scorecards / Gates / Dependencies / Executive brief) and Intelligence tabs (Brief / Map / Art of Possible / Enterprise Context / Vendors) both use the Snowflake-style sticky bar. |
| Sidebar truncation | ❌ | "Production Readin…" (D-002). |
| Brand wordmark consistency | ⚠️ | Page title suffix varies — `· AbarVa` / `\| AbarVa` / `\| AbarVa Nexus` across surfaces (D-005, D-007). |
| Legacy codename hygiene | ❌ | `arcturus` still in First Capital URL params (D-014). No Heliara/Keystone/Brindlemark text seen in UI copy. |
| Chat bubble truncation | ✅ | Sentinel and Atlas chats render full content without truncation. |
| Empty / loading states | ✅ | "Reading the Intelligence substrate…" status indicator present during Sentinel retrieval. Moves kanban shows empty columns with phase labels. |
| 404 page | ✅ | Cream bg, serif "AbarVa", "404", clean CTAs, footer breadcrumb "AT · ATLAS · ROUTE NOT FOUND". |
| Color contrast | ✅ | Spot-check clean on body text. |

---

## H. UX + interaction findings

- **First 60 seconds on `/home`:** strong — hero tells you which tenant you're in, the 4 module tiles tell you where readiness is weakest, and the Action queue tells you what to approve. A first-time CIO would have a clear next click.
- **Sentinel sticky input:** present and behaves per memory rule. Enter submits, input is left visible until response complete.
- **Cross-surface handoffs:** Sentinel offered "Want me to hand this to Moves to shape the decision memo?" — wired-in agentic continuity ✅.
- **Dead ends:** the admin sub-route URLs in the audit prompt 404 — these have likely been collapsed into the home left rail.
- **Sign-out:** broken (D-011).
- **Persona switcher:** not found as an in-app control for client personas — switching tenants requires full sign-out + sign-in. For a multi-CXO demo flow, this is friction. Recommend an in-product persona switcher for the demo personas at minimum.
- **Origination flow:** the P0 Originate page exists and reads well, but I did not drive a full origination through to P1 promotion in this session — recommended follow-up.

---

## I. Cross-tenant patterns

| Pattern | Affected | Severity | Implication |
|---|---|---|---|
| Hard-coded retail content on Intelligence Brief Value/Tensions panels | All 3 | P0 | Single fix unblocks all three tenants. |
| Healthcare-vendor / clinical-term seeds leaking into non-healthcare tenants | Apex (D-003 "Clinical platform reliability"), First Capital (D-013 Innovaccer) | P1 | Audit ALL shared seed content for tenant fit. |
| Branding suffix inconsistency in page titles | All 3 | P2 | Centralize in metadata. |
| Sign-out button non-functional | All 3 (same shell) | P1 | One-line fix. |
| Sign-in surface off-canon (dark + blue CTA) | All 3 | P1 | Single surface to repaint. |

---

## J. Defect log

### P0 (demo-killing)
| ID | Surface | Defect | Suggested fix |
|---|---|---|---|
| **D-012** | `/intelligence` Brief — Value at stake + Open tensions panels | Hard-coded retail dimensions and copy render for all three tenants (verified Apex/Meridian/First Capital). | Replace shared constant with tenant-keyed structures (retail / healthcare / banking variants). |

### P1 (visible to a CXO in a demo)
| ID | Surface | Defect | Suggested fix |
|---|---|---|---|
| **D-001** | `/sign-in` | Dark navy bg + solid-blue CTA off-canon. | Rebuild on #F8F7F4 + Georgia + black/ghost. |
| **D-003** | `/intelligence` Enterprise Context — first card | Title "Clinical platform reliability" in Apex Retail tenant. | Re-title to neutral / retail-appropriate (e.g. "Platform & service reliability"). |
| **D-004** | `/strategic-moves` | Hero strip is black-on-white island on cream page. | Bring hero into canon palette. |
| **D-010** | `/signed-out` | Hero CTA "Enter client workspace" is solid blue. | Black/ghost per canon. |
| **D-011** | App shell | Sign-out button is a no-op; only `Clerk.signOut()` works. | Wire button to Clerk.signOut() + redirect. |
| **D-013** | First Capital `/home` Module 02 | Source callout names healthcare vendor "Innovaccer". | Re-derive from tenant Source events, retire the shared seed. |
| **D-014** | First Capital URL | `?client=arcturus` legacy codename leak. | Canonical key `first-capital`; retire alias in router. |
| **Sentinel-A1** | Sentinel Intel | Self-correction reorders Adobe ($8.8M) above AWS ($13.6M) and calls that the "true rank" — arithmetically wrong. | Reflection check before answer commits. |

### P2 (polish)
| ID | Surface | Defect | Suggested fix |
|---|---|---|---|
| **C-001** | Sign-in / app header | Tagline "AI Success Platform" — confirm alignment with current "tenant-grounded consultant-grade decision OS" positioning. | Founder call. |
| **D-005** | `/strategic-moves` title | "\| AbarVa Nexus" suffix. | Unify suffix across all routes. |
| **D-006** | `/strategic-moves/new` | Nexus chat panel is dark navy on cream page. | Decide: keep as intentional brand chat-surface treatment, or harmonize. |
| **D-007** | `/source` title | "Source · AbarVa" — third brand-suffix variant. | Unify. |

### P3 (nit)
| ID | Surface | Defect | Suggested fix |
|---|---|---|---|
| **D-002** | Home left rail | "Production Readin…" truncation. | Shorten label or widen rail. |
| **D-008** | Top nav | Tenant indicator says "Apex Retail" but hero says "Apex Retail Group". | Pick one canonical short name. |
| **D-009** | 404 CTA | "GO TO HOME" is dark navy filled — close to black, technically not pure-canon black. | Acceptable; flag only. |

### Findings (not defects)
| ID | Note |
|---|---|
| **F-001** | Audit prompt expected ~3 CXO personas per tenant. Roster (`canonical-auth-roster.ts`) has Apex 2 / Meridian 2 / First Capital 1. For a full 9-persona Sentinel sweep you'll need to provision more seats. |
| **F-002** | `/admin/*` sub-routes from the audit prompt 404 for client CIO persona. The admin surfaces appear to be consolidated into the `/home` left-rail Setup panels. Either retire the audit-prompt list or expose the full admin tree to canonical-client-admin emails. |

---

## K. Suggested next moves

### 48 hours
- Fix D-012 (Value/Tensions tenant leak) — single highest-leverage change before any demo.
- Fix D-013 (Innovaccer on First Capital home).
- Fix D-011 (Sign-out button).

### 7 days
- Repaint `/sign-in` and `/signed-out` to canon (D-001, D-010).
- Unify page-title brand suffix (D-005/D-007).
- Audit all home Module 02 Source callouts and all Enterprise Context card titles for cross-tenant seed leaks (D-003, D-013 are likely not alone).
- Retire `?client=arcturus` alias (D-014).
- Add a reflection/arithmetic check to Sentinel before answer commit (Sentinel-A1).
- Provision at least 1 additional CXO seat per tenant (CFO recommended) to demonstrate the multi-persona story (F-001).

### 30 days
- Build the full 25-question Sentinel battery as a regression test against all rostered personas — automate it as a nightly synthetic check so panel-level leaks like D-012 surface immediately.
- In-app persona switcher for client demo personas (sign-out / sign-in friction is real).
- Drive a full origination through `/strategic-moves/new` and measure turn-count to P1 promotion; that was on the audit checklist and was not run this session.

---

*End of report. Working notes in `scratchpad.md` in the same directory.*

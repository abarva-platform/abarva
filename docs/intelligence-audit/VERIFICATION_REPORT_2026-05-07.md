# Intelligence Audit — Verification Report

| | |
|---|---|
| **Date** | 2026-05-07 |
| **Verifier** | Claude Code session (browser-Chrome MCP) |
| **Browser-Chrome MCP available** | Yes |
| **Target URL** | `https://app.abarva.ai/intelligence` (public route) |
| **Tenants tested** | One tenant context only — see T5/T6 caveat below |
| **Companion** | [INTELLIGENCE_AUDIT_2026-05-07.md](INTELLIGENCE_AUDIT_2026-05-07.md) · [AUDIT_VERIFICATION_PROMPT_2026-05-07.md](AUDIT_VERIFICATION_PROMPT_2026-05-07.md) |

---

## §0 · Headline finding

**The deployed `/intelligence` page is a public, unauthenticated, doctrine-driven page — not a tenant-bound workspace.** Top-right shows "Sign in" (no auth required to view); no tenant switcher anywhere in the header; the Today stage references "Meridian" only as flavoring text within otherwise universal content; 6 of 7 stage canvases render the same content for any visitor.

This shifts the meaning of the audit. The audit treated the page as a Meridian-bound workspace (substrate-binding gaps, partial-state behavior). What's deployed is a content surface — closer to marketing/CXO storytelling than operational Intelligence. The roadmap's substrate-binding PRs (I-3..I-7) are still correct in principle, but they're additionally a transition from "doctrine page" to "tenant workspace."

---

## §1 · Per-target verification

### Target 1 — "Shape into a Move" affordance

**Claim:** Per-card affordances missing on Today pressure cards and on failure mode cards.

**Verdict:** **CONFIRMED MISSING** (with high confidence).

**Evidence:**
- DOM scan via `javascript_tool` of the Intelligence index page returned **0 matches** for any element whose text matched `/shape.*move|originate|originating|validate.*bet|originate.*bet|new strategic move/i`.
- Total interactive elements on the page: **10 buttons, 19 links, 0 forms, 0 text inputs**. Buttons are: Sign out, 7 stage tabs, Show Sessions canvas, "Stop Claude" (browser-extension artifact, not page).
- Pressure cards (Foundation readiness / Metric gaps / Vendor claims) have h3 headings but **no buttons or links**. Pure visual cards.
- Twin CTAs ("Originate new bets" / "Validate existing bets") have h2 headings but **no buttons or links** either — they are decorative section-intro cards, not action affordances.
- Failure mode cards ARE clickable links (`/intelligence/failure-modes/{slug}`). Detail page is long-form essay (Why it kills programs · What good looks like · Research anchors · Example scenarios · Patterns · Related topics) with **0 affordances** to convert pattern→Move.

**Implication for roadmap:**
- **PR I-1 stays in roadmap.** Additionally needs to address the twin-CTA cards — they should become functional affordances or be relabeled. Today they imply interaction that doesn't exist.
- The failure mode detail page is a second place per-card affordance is needed (not just on the index card).

**Screenshots:** [01-today-default.png](screenshots/01-today-default.png) · [phantom-sponsor-detail.png](screenshots/phantom-sponsor-detail.png)

---

### Target 2 — "What we can't yet see" honest-restraint section

**Claim:** Section missing.

**Verdict:** **CONFIRMED MISSING.**

**Evidence:**
- DOM scan returned **0 matches** for `/can'?t yet see|cannot yet see|substrate gap|not yet visible|missing substrate/i`.
- Scope-lock paragraph ("Intelligence supports strategy thinking. It does not generate enterprise AI strategy from scratch.") addresses *what Intelligence does not do* (boundary), but does not name *specific substrate gaps* preventing specific syntheses (which is the design-intent §5.3 ask).
- Walked all 7 stages — none contain a gap-naming section.

**Implication for roadmap:** PR I-8 stays in roadmap as designed.

---

### Target 3 — Per-stage tab behavior

**Verdict:** **CORRECTED — page is doctrine-driven, not tenant-bound, on 6 of 7 stages.**

| Stage | Title | Content shape | Tenant-bound? | Substrate consumed | Notes |
|-------|-------|---------------|---------------|---------------------|-------|
| Today (Stage 1) | "Sentinel curated entry-state: what needs attention right now" | 3 pressure cards: HIGH/MEDIUM/WATCH. Sentinel ambient guide. | **Partly** — only the HIGH card uses "Meridian" by name; otherwise generic | None visible (cards reference Epic/RCM/prior-auth — doctrine flavor) | Only stage that hints at tenant binding |
| By function (Stage 2) | "Industry exploration by front, middle, and back office" | 3 functional-domain cards: Healthcare middle office · Retail middle office · Financial-services middle office. Each with a "Candidate move:" suffix. | **No** — all 3 industries on one screen | None | Doctrine-constant |
| Patterns (Stage 1) | "Corpus pattern catalog with failure-mode and industry filters" | The 10 failure modes again, with provenance stamps ("Provenance: McKinsey — 2026-04-30") | **No** | Pattern records (the `17` count) | Same content as Today's failure-mode library, different framing. Filters mentioned but not seen rendered. |
| Vendors (Stage 3) | "Vendor landscape intelligence and claim discipline" | 3 conceptual cards: Claim discipline · Landscape fit · Source handoff | **No** | None — generic vendor framing, no per-vendor profiles | Doctrine-constant. No Innovaccer / Olive AI / Epic detail cards as audit §2.5 anticipated. |
| Peer activity (Stage 3) | "Anonymized aggregate view of what peers are doing" | Peer signals #1, #2, #3 (4 of 14 peer specialty retailers · Healthcare IDNs · etc.) | **No** | None — multi-industry aggregate signals | Mixed retail+healthcare in same view. Doctrine. |
| My strategy (Stage 2) | "Uploaded client strategy artifacts structured and compared to evidence" | 3 explanatory layer cards: Strategy layer 1, 2, 3 | **No** | None | Pure scaffolding/placeholder content describing what *will* be uploaded |
| Sessions (Stage 1) | "Persistent thinking sessions that can become move evidence" | 3 persistent-session cards: Healthcare analytics · Retail store ops · Financial-services risk | **No** | None | Doctrine. Top banner: "Sessions canvas is open. Pick up a saved working thread or turn this exploration into Strategic Move evidence." — implies Move-evidence affordance, but no button. |

**Implication for roadmap:**
- PRs I-3 through I-7 (substrate binding) remain correct in shape but are bigger than the audit assumed: each stage is currently doctrine-constant scaffolding. Binding tenant substrate ≠ refining existing tenant content; it's transitioning from doctrine card → tenant card.
- The "STAGE 1/2/3" labels on tabs imply maturity ranking (S1 = entry, S3 = depth). All stages are at S1 in terms of substrate binding today.

**Screenshots:** stage-today, stage-by-function, stage-patterns, stage-vendors, stage-peer-activity, stage-my-strategy, stage-sessions (saved via screenshot tool).

---

### Target 4 — Confidence display

**Claim:** No explicit confidence indicators.

**Verdict:** **CONFIRMED MISSING.**

**Evidence:**
- DOM scan returned **0 matches** for `/confidence/i` anywhere on the index page or the Phantom Sponsor detail page.
- Severity chips (HIGH / MEDIUM / WATCH) on Today pressure cards substitute partially. Provenance stamps on Patterns stage cards ("Provenance: McKinsey — 2026-04-30") substitute partially. Neither is an explicit confidence number/bar.
- Failure mode metadata is `2 patterns · 3 anchors` — count, not confidence.

**Implication for roadmap:** Per design intent §11.Q3 best-answer (numeric + visual bar), confidence indicators should be added when patterns become tenant-bound (PRs I-3 onward). For doctrine pages, severity chips and provenance stamps are arguably sufficient and more readable for an executive audience — recommend keeping them as the doctrine-tier indicator.

---

### Target 5 — Empty / Partial / Mature state behavior

**Verdict:** **NOT TESTABLE WITHOUT TENANT-SCOPED ROUTE.**

**Evidence:**
- The deployed `/intelligence` page is publicly accessible. There is no tenant switcher in the header (only AbarVa wordmark + Sign in). All visitors see identical content.
- The repo has a tenant-scoped variant (`/(maestro)/tenant/[tenantSlug]/intelligence`) but I did not authenticate into a real tenant session to test it (memory says admin Clerk OTP is `424242` — not used here per verification-prompt scope).
- Cannot determine empty-state behavior from a public doctrine page. The page essentially renders one state — call it "doctrine state" — which is technically the empty-data version because no tenant data is consumed.

**Implication for roadmap:**
- Empty/partial/mature states need to be tested on the tenant-scoped route in a follow-up verification pass with authenticated tenant access.
- Recommend: a separate verification round that signs into the Apex / Meridian / First Capital tenants and walks the tenant-scoped intelligence route. Estimated effort: 1 hour.

---

### Target 6 — Substrate counts (10 / 17 / 30 / v1.0.0)

**Verdict:** **CONFIRMED — these are doctrine constants, not per-tenant aggregates.**

**Evidence:**
- The counts are visible on the public, unauthenticated index. No tenant context exists when this page renders for an anonymous visitor — the numbers must be doctrine constants.
- 10 failure modes ÷ ~2 patterns per card ≈ 17 (matches "17 pattern records"). 10 × ~3 anchors = 30 (matches "30 research anchors"). The counts are sums across the doctrine library, not tenant aggregations.
- The "v1.0.0" doctrine stamp confirms versioned-doctrine framing (audit §1.8 preserve note).

**Implication for roadmap:** Doctrine counts are correct as-is. When tenant binding lands, additional per-tenant counts may appear elsewhere (e.g., "5 active patterns for First Capital · 2 contradictions · 1 synthesis ready"), but the doctrine panel can stay.

---

### Target 7 — Sentinel left-rail behavior

**Verdict:** **CONFIRMED — ambient, no chat input, single non-chat affordance.**

**Evidence:**
- 0 forms / 0 text inputs / 0 textareas on the entire page (confirms §2.2 design-intent boundary).
- Sentinel left-rail content is one short paragraph ("Three things matter today: foundation readiness, metric-to-bet translation, and vendor claim discipline. I can deepen any card or turn a mature thread into Strategic Move evidence.") — declarative narration, not interactive.
- Single button: **"Show Sessions canvas / focus right pane"** (single button, two-line label). Clicking it swaps the right pane to the Sessions canvas (equivalent to clicking the Sessions stage tab). Pill turns green: "Sessions canvas is open · active". The button essentially is a duplicate path to the Sessions tab — not a unique affordance.
- No hover state visible; no other interactive elements in the left rail.

**Implication for roadmap:** Sentinel ambient pattern is well-formed. Could be extended to include short Move-evidence affordance once Shape-into-Move (I-1) lands.

---

## §2 · Roadmap impact summary

| # | Audit roadmap PR | Verified status | Adjustment needed |
|---|------------------|-----------------|-------------------|
| I-1 | Per-card "Shape into a Move" | **Confirmed missing** | Keep — and **extend scope** to include twin-CTA cards (currently decorative) and failure-mode detail pages |
| I-2 | AI Transformation synthesis card on Today | (not directly verified — segment 23 absent from current Today canvas; confirmed via DOM scan that no AI Transformation card is present) | Keep |
| I-3 | Stakeholder Notes → Today pressure cards (segment 16) | Confirmed Today pressure cards have no attribution / verbatims today | Keep — note substrate readiness blocker (segment 16 is 0% across all tenants per substrate readiness check 2026-05-07) |
| I-4 | KPI History → failure mode card augmentations (segment 15) | Confirmed failure mode cards have generic industry stats, no tenant overlay | Keep — substrate is STUB (no quarterly actuals) per readiness check; needs upgrade to LOADED first |
| I-5 | Decision Traces → "By function" stage (segment 19) | Confirmed By function stage is doctrine-constant scaffolding (3 functional domain cards per industry, no decision history) | Keep — significantly larger scope than audit assumed (transitioning whole stage from doctrine → tenant binding) |
| I-6 | Peer Benchmarks → "Peer activity" stage (segment 17) | Confirmed Peer activity is anonymized aggregate signals across multiple industries; no named peer comparison | Keep — substrate is STUB (peer-name strings only, no metric × peer matrix); needs upgrade |
| I-7 | Vendor Intelligence → "Vendors" stage (segment 21) | Confirmed Vendors stage is 3 conceptual cards (Claim discipline / Landscape fit / Source handoff); no per-vendor detail | Keep — significantly larger scope than audit assumed |
| I-8 | "What we can't yet see" honest-restraint section | Confirmed missing | Keep |

### New PR recommendation

| # | Title | Reason |
|---|-------|--------|
| **I-0** | **Tenant binding plumbing** | The page renders the same content for everyone today. Before any I-3..I-7 substrate binding can ship, there must be a tenant-context-aware variant of the route (or the public page must conditionally render tenant content when authenticated). This is upstream of audit's I-3 through I-7. Without it, those PRs have nowhere to write tenant-specific cards. |
| **I-9** | **Tower link removal from main nav** | Discovered during T1 — the global header has a Tower link (`https://app.abarva.ai/tower`). Per design intent §2.6 and Q5 best-answer, no Tower references until Tower ships. Either remove the link, gate it behind a feature flag, or accept that Tower has shipped enough to surface. Single-line nav fix. |

### Audit claims that turned out to be incorrect

- **Audit assumed page was Meridian-bound.** Verification shows it is unauthenticated/public with Meridian flavoring in only one of 21 visible cards (the Today HIGH pressure card). All other content is multi-industry doctrine.
- **Audit §2.4 expected named peer comparison.** Reality: the Peer activity stage shows aggregate signals across multiple industries — not named peers at all.
- **Audit §2.5 expected per-vendor profiles (Innovaccer / Olive / Epic).** Reality: the Vendors stage is 3 conceptual cards about vendor work, not vendor profiles.

---

## §3 · New findings

Things observed during verification that the audit didn't anticipate:

### 3.1 Tower link in main nav (§2.6 boundary violation)

The site-wide nav contains a `Tower` link pointing to `https://app.abarva.ai/tower`. Per design intent §2.6 (no Tower references until Tower ships) and Q5 best-answer locked 2026-05-07, this is a violation. Two options:

- **A.** Tower has actually shipped enough to be reachable — in which case the boundary rule should be revisited.
- **B.** The link is a placeholder — in which case it should be removed/feature-flagged.

Either way, founder decision needed.

### 3.2 The "Stop Claude" button artifact

A "Stop Claude" button appeared in the DOM during JS scan. This is a Claude Code browser-extension artifact, not part of the deployed app. Mentioning so the founder can ignore it; not a finding.

### 3.3 Twin-CTA cards are not actually CTAs

"Originate new bets" / "Validate existing bets" appear visually as primary action cards (large, prominent, below hero). They have no `<a>` or `<button>` element — h2 + p only. A reasonable user assumption is they're clickable. Currently they're decorative.

This is a clean wireframing issue that PR I-1 should address: either make them genuinely click-through (to a flow), or restyle them so they don't look like CTAs.

### 3.4 The failure-mode detail page is editorial, not pattern-card

The detail page (`/intelligence/failure-modes/{slug}`) is long-form essay (Why it kills programs · What good looks like · Research anchors · Example scenarios · Patterns · Related topics) — closer to a thought-leadership article than a structured pattern card with substrate citations. This is great content but doesn't resemble the "pattern card" the design intent doc envisioned (name + citation + confidence + implication + affordances). When PR I-1 ships, the detail page needs to inherit the affordance — and possibly grow a structured "Tenant impact" sidebar.

### 3.5 Sessions stage promises "turn into Strategic Move evidence" but provides no button

Banner text on Sessions stage: "Sessions canvas is open. Pick up a saved working thread or turn this exploration into Strategic Move evidence." There is **no button** to do this. Strong implied affordance, no implementation.

This is the most acute case of "Intelligence promises directional pull but doesn't deliver it." Worth flagging into PR I-1's scope.

### 3.6 Provenance stamps are excellent

Failure mode cards on the Patterns stage carry "Provenance: McKinsey — 2026-04-30" stamps. Detail pages show 28+ research-anchor mentions (McKinsey ×7, MIT ×5, BCG ×5, Forrester ×5, IBM ×2). This is the doctrine-tier alternative to confidence indicators — and it's done well. Preserve note.

---

## §4 · Recommendations

### 4.1 Update the design-intent doc per audit §4

The audit's §4 doc-update list (adopt "explore layer for AI bets" framing, three-substrates user-facing layer, 7-stage nav, twin-CTA pattern, failure-modes library, audience lock, doctrine versioning) is correct and should ship before any I-1..I-9 implementation.

### 4.2 Reconcile design intent with the deployed page's strengths

The implementation prompt I drafted earlier today (`docs/build/intelligence/INTELLIGENCE_V1_IMPLEMENTATION_PROMPT_2026-05-07.md`) should be **revised**, not deleted. Specifically:

- **Drop** §3.2 "Files to remove" list — `/intelligence/failure-modes/` is excellent editorial content and stays primary, not relocates to `/library/failure-modes/`. The boundary rule §2.3 (no telemetry console) was correct in principle, but the deployed implementation is editorial reference, not telemetry. No removal needed.
- **Keep** the Shape-into-Move plumbing — that's PR I-1, still required.
- **Keep** §0 substrate prereqs — the readiness check still stands.
- **Add** the I-0 (tenant binding plumbing) and I-9 (Tower link cleanup) PRs.
- **Reframe** the IA section — adopt the 7-stage nav as canonical IA, rather than the page-header / attention-strip / pattern-queue layout from the design intent doc.

I'll produce a revised implementation prompt as the next deliverable.

### 4.3 Greenlight needed on three founder calls

1. **Tower link in nav** — remove, feature-flag, or revisit boundary rule?
2. **Twin-CTA functional vs. decorative** — make clickable, or restyle?
3. **Tenant context model** — does the public `/intelligence` page get a tenant-aware variant when authenticated, or does the tenant workspace live exclusively at `/(maestro)/tenant/[slug]/intelligence`?

### 4.4 Follow-up verification

A second verification pass with authenticated tenant access (Apex / Meridian / First Capital sessions) should be run before PR I-3 starts, to:
- Confirm whether tenant-scoped routes exist and what they currently render
- Test empty / partial / mature state on the tenant-scoped variant
- Verify the substrate-counts panel changes (or doesn't) per tenant

Effort: ~1 hour.

---

## §5 · Audit quality

The audit itself was well-formed — it correctly identified the page as preserve-worthy prior art and produced an evolution-shaped roadmap rather than a rebuild. The `[UNVERIFIED]` markers were honest about read confidence. Verification corrected one major framing assumption (page is public, not Meridian-bound) but otherwise the audit's calls hold up. The verification methodology in `AUDIT_VERIFICATION_PROMPT.md` was directly executable — minor friction noted only on T5/T6 (tenant-scoped routes need authenticated access, not public verification).

End of verification report.

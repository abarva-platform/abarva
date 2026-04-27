# Wave — Admin Surface Canonical Redesign (`wave-admin-redesign`)

_Status: PLANNED | Wave ID: `wave-admin-redesign` | Wave number: tentatively wave-33_

> Founder source: 5 wireframe screenshots + `abarva_logo_lockup_v2.svg` shared 2026-04-27.
> Goal of this wave: make admin pages render the canonical 3-zone editorial layout with the new logo, color palette, typography, agent rail, Steward editorial pattern, and Live caveat enforcement.

---

## Theme

Admin Surface Canonical Redesign — replace the current "scores 72/100 but visibly drifts" admin shell with the canonical editorial layout the wireframes lock down.

---

## Goal

Make admin pages render the canonical 3-zone editorial layout (sidebar / canvas / agent rail), wired to:

1. The new `abarva_logo_lockup_v2.svg` lockup
2. The locked color palette (`#070707` ink, `#0b4a91` navy, `#FBFAF7` cream, soft mint/amber/coral status pills, sky-pale highlight)
3. Cormorant Garamond serif page titles + DM Sans body
4. The 8-item admin sub-nav (Overview / Data Trust / Connectors / Users & Access / Agent Readiness / Production Readiness / Build Progress / Architecture)
5. The Steward editorial card pattern (eyebrow + title + body + context-used + evidence strength + blocker + primary action)
6. The 5-cell context bar (TENANT / MODE / AGENT / DATA / LIVE STATUS)
7. The agent rail with primary agent header + 4 honest-posture agent cards (Steward / Nexus / Sentinel / Atlas) + "3 choices + custom" action set
8. The permanent Live caveat pill on every admin page
9. "Context-first, not chatbot-first" — no chat input on these pages

---

## Why this wave matters

The current admin compliance score is **72/100** on WIRE2B. The audit measured "imports canonical shell" and "no banned tokens in shell file" but the rendered pixels still violate the canon: teal accents, purple chips, missing agent rail, no Steward editorial card, no context bar.

This wave removes the structural ceiling. After it lands the rendered admin demonstrably matches the wireframe, and the score lifts to **92/100** — limited only by remaining live-data gaps that are out of scope for a UI redesign.

The founder shared the new logo + 5 wireframes on 2026-04-27. This wave converts those artifacts into shipped pixels.

---

## Founder source artifacts (2026-04-27)

- `abarva_logo_lockup_v2.svg` — refined orbital symbol + Cormorant Garamond wordmark ("Abar" `#070707` + "Va" `#0b4a91`, tight letter-spacing, 168px base size in source)
- 5 wireframe screenshots covering Overview, Production Readiness, Architecture, plus 2 supporting page variants
- Top-nav surfaces locked at 6 (Home / Programs / Source / Intelligence / Control Tower / Platform pill)
- Admin sub-sidebar locked at 8 items
- Color palette confirmed: `#070707` ink, `#0b4a91` navy, `#FBFAF7` cream, soft mint/amber/coral status pills
- Typography: Cormorant Garamond serif page titles, DM Sans body, Georgia fallback

---

## Pre-flight dependencies

- ADMIN0 (this backlog registration) merged
- Existing admin route tree resolves cleanly (`/admin`, `/admin/architecture`, `/admin/production-readiness` confirmed ACTIVE 2026-04-27)
- Existing W32D / W32E / W32F view-models present on main (they are — wave-32 merged)
- No banned-token sweep wave running concurrently on admin tree (would conflict with ADMIN1)

---

## Lane definitions

Each lane is delivered as a single PR. Lanes that depend on earlier lanes wait for those merges before starting.

---

### ADMIN1 — Foundation: logo + token lock

- **Slice ID:** ADMIN1
- **Worktree:** `/tmp/nexus-admin1`
- **Branch:** `wave33/admin1-foundation`
- **Type:** ui
- **Depends on:** ADMIN0
- **Estimated complexity:** S

**Allowed files**
- `public/brand/abarva-logo-lockup-v2.svg`
- `src/components/brand/AbarVaLogo.tsx`
- `src/components/brand/index.ts`
- `src/lib/design/abarva-shell.ts` (modify — token table only)
- `src/lib/design/design-tokens.ts` (new)
- `src/__tests__/integration/design/abarva-logo-v2.test.ts` (new)
- `docs/build/slices/ADMIN1_FOUNDATION_LOGO_TOKENS.md`

**Forbidden files**
- Any `src/app/(maestro)/admin/**`
- Any `src/components/admin/**`
- Any route, API, or migration file

**Implementation scope**
1. Copy SVG to `public/brand/abarva-logo-lockup-v2.svg`.
2. Update `AbarVaLogo.tsx` to support `variant: 'wordmark' | 'lockup'` prop. `'lockup'` renders the new SVG asset; `'wordmark'` keeps the current inline text behavior. Default stays `'wordmark'` to avoid changing existing call sites.
3. Create `src/lib/design/design-tokens.ts` exporting the canonical palette: `INK = '#070707'`, `NAVY = '#0b4a91'`, `CREAM = '#FBFAF7'`, `SKY_PALE = '#E8F0FA'`, `MINT_SOFT = '#E8F5E8'`, `AMBER_SOFT = '#FFF4E1'`, `CORAL_SOFT = '#FFE6E1'`. Export typed `DESIGN_TOKENS` const.
4. Add Cormorant Garamond via `next/font/google` in `src/app/layout.tsx` (or admin-specific layout once ADMIN2 lands). Import only — no application yet.
5. Update banned-token list to add purple, magenta, cyan (keep teal banned).

**Tests required**
- `src/__tests__/integration/design/abarva-logo-v2.test.ts` (15+ Jest tests):
  - token values match the locked palette exactly
  - logo `'lockup'` variant renders the new SVG
  - logo `'wordmark'` variant unchanged
  - no banned tokens appear in `design-tokens.ts`
  - banned-token list now includes purple/magenta/cyan
  - SVG file exists at `public/brand/abarva-logo-lockup-v2.svg`

**Acceptance criteria**
1. `npx tsc --noEmit` clean.
2. `npm run lint` (scoped) clean.
3. All ADMIN1 tests pass.
4. No app routes touched.
5. SVG file present in `public/brand/`.
6. `design-tokens.ts` exports exact hex values from the locked palette.

**LANE-SHA:** TBD (post-merge)

---

### ADMIN2 — Admin shell: 3-zone canonical layout

- **Slice ID:** ADMIN2
- **Worktree:** `/tmp/nexus-admin2`
- **Branch:** `wave33/admin2-shell-3zone`
- **Type:** ui
- **Depends on:** ADMIN1
- **Estimated complexity:** L

**Allowed files**
- `src/components/admin/AdminCanonShellV2.tsx` (new)
- `src/components/admin/AdminSidebar.tsx` (new — or modify existing)
- `src/components/admin/EditorialCanvas.tsx` (new)
- `src/components/admin/AgentRail.tsx` (new)
- `src/lib/admin/admin-shell-config.ts` (new)
- `src/__tests__/integration/admin/admin-shell-v2.test.ts` (new)
- `docs/build/slices/ADMIN2_ADMIN_SHELL_3ZONE.md`

**Forbidden files**
- Any `src/app/(maestro)/admin/**` page (those land in ADMIN4–6)
- `src/components/brand/AbarVaLogo.tsx` (owned by ADMIN1)
- `src/lib/design/design-tokens.ts` (owned by ADMIN1)

**Implementation scope**
1. Build `AdminCanonShellV2` — 3-zone CSS grid layout (sidebar 280px / canvas flex / agent-rail 320px). Cream background, ink text.
2. Build `AdminSidebar` — 8 sub-section items with subtitles, active state via Next.js `usePathname`, "Live caveat" amber pill at the bottom.
3. Build `EditorialCanvas` — slot for `eyebrow`, `title`, `subtitle`, `contextBar`, `children`. Cormorant Garamond title at canonical scale.
4. Build `AgentRail` — primary agent header card + 4 agent cards (Steward / Nexus / Sentinel / Atlas) + "3 choices + custom" action set. Cards expose honest posture (BLOCKED / PARTIAL / THIN).
5. Responsive: agent rail collapses to drawer below 1280px.
6. ALL components consume design tokens from ADMIN1 — no hex literals.

**Tests required**
- `src/__tests__/integration/admin/admin-shell-v2.test.ts` (30+ tests):
  - shell renders 3 zones
  - sidebar lists exactly the 8 canonical items in order
  - each sidebar item gets active state when its route matches
  - editorial canvas renders all slots
  - agent rail renders 4 agent cards
  - agent rail responsive collapse trigger present
  - no banned tokens in any new component
  - no hex literals (only token references)

**Acceptance criteria**
1. Shell renders standalone in tests.
2. 8 sub-pages addressable from sidebar.
3. No banned tokens.
4. ESLint clean.
5. `npx tsc --noEmit` clean.

**LANE-SHA:** TBD

---

### ADMIN3 — Steward editorial component

- **Slice ID:** ADMIN3
- **Worktree:** `/tmp/nexus-admin3`
- **Branch:** `wave33/admin3-steward-editorial`
- **Type:** ui
- **Depends on:** ADMIN1, ADMIN2
- **Estimated complexity:** M

**Allowed files**
- `src/components/admin/StewardEditorial.tsx` (new)
- `src/components/admin/ContextBar.tsx` (new)
- `src/components/admin/EvidenceStrengthPill.tsx` (new)
- `src/components/admin/BlockerPill.tsx` (new)
- `src/__tests__/integration/admin/steward-editorial.test.ts` (new)
- `docs/build/slices/ADMIN3_STEWARD_EDITORIAL.md`

**Forbidden files**
- Any `src/app/(maestro)/admin/**`
- Any other admin component owned by ADMIN2
- Any read-model file in `src/lib/admin/` (those land in ADMIN4–6)

**Implementation scope**
1. `StewardEditorial` props: `title: string`, `body: string`, `contextUsed: string[]`, `evidenceStrength: 'strong' | 'partial' | 'thin'`, `blocker?: string`, `primaryAction: { label: string; href: string }`. Renders eyebrow + serif title + body + context-used chips + evidence pill + optional blocker pill + primary action button.
2. `ContextBar` props: `tenant`, `mode`, `agent`, `data`, `liveStatus` — 5-cell strip with uppercase labels. Cell separators in navy.
3. `EvidenceStrengthPill` — soft mint/amber/coral fill based on strength.
4. `BlockerPill` — soft coral fill, only renders if a blocker prop is present.
5. All components are pure presentational (props in, JSX out — no data fetching, no side effects).

**Tests required**
- `src/__tests__/integration/admin/steward-editorial.test.ts` (25+ tests):
  - StewardEditorial renders with all required props
  - blocker pill is absent when blocker prop is omitted
  - evidence pill matches strength variant
  - context-used chips render every entry
  - context bar renders all 5 cells with correct labels
  - no fabricated defaults — every value comes from props

**Acceptance criteria**
1. Components render with all variants.
2. No fabricated data inputs allowed (props only).
3. `npx tsc --noEmit` clean.
4. ESLint clean.

**LANE-SHA:** TBD

---

### ADMIN4 — Architecture page wired to new shell

- **Slice ID:** ADMIN4
- **Worktree:** `/tmp/nexus-admin4`
- **Branch:** `wave33/admin4-architecture-page`
- **Type:** ui
- **Depends on:** ADMIN1, ADMIN2, ADMIN3
- **Estimated complexity:** M

**Allowed files**
- `src/app/(maestro)/admin/architecture/page.tsx` (modify)
- `src/lib/admin/architecture-page-view.ts` (new — read-model)
- `src/components/admin/ArchitecturePlaneStack.tsx` (new)
- `src/__tests__/integration/admin/architecture-page-view.test.ts` (new)
- `docs/build/slices/ADMIN4_ARCHITECTURE_PAGE.md`

**Forbidden files**
- Any other admin page
- Any component owned by ADMIN2 or ADMIN3
- Any token file (ADMIN1)

**Implementation scope**
1. Replace existing architecture page content with `AdminCanonShellV2` wrapper.
2. Steward editorial: title `"Atlas + Steward editorial · Architecture posture"`, honest body about plane coverage, context used, evidence strength `'partial'`, primary action `"Open Azure story"`.
3. 7-row plane stack (App / Agent / Context / Evidence / Data / Gateway+Tools / Deployment) — pure read-model, deterministic, no live calls.
4. Context bar: TENANT=Apex Retail, MODE=Setup/Admin, AGENT=Steward, DATA=Manifest+seeds, LIVE STATUS=Deferred.
5. Agent rail: Steward BLOCKED, primary action `"Open Azure story"`. Other agents reflect honest current posture.

**Tests required**
- `src/__tests__/integration/admin/architecture-page-view.test.ts` (20+ tests):
  - read-model returns 7 planes in canonical order
  - each plane has a name, status, and at least one component reference
  - read-model is deterministic (calling twice returns equivalent objects)
  - no banned tokens
  - agent rail honesty: Steward BLOCKED, no production_ready claims

**Acceptance criteria**
1. Page renders.
2. 7 planes visible.
3. No banned tokens.
4. Agent rail honest about posture.
5. `npx tsc --noEmit` clean.

**LANE-SHA:** TBD

---

### ADMIN5 — Production Readiness page wired to new shell

- **Slice ID:** ADMIN5
- **Worktree:** `/tmp/nexus-admin5`
- **Branch:** `wave33/admin5-production-readiness-page`
- **Type:** ui
- **Depends on:** ADMIN1, ADMIN2, ADMIN3
- **Estimated complexity:** M

**Allowed files**
- `src/app/(maestro)/admin/production-readiness/page.tsx` (modify)
- `src/lib/admin/production-readiness-page-view.ts` (new)
- `src/components/admin/DemoPilotProductionTiles.tsx` (new)
- `src/components/admin/TopBlockersTable.tsx` (new)
- `src/__tests__/integration/admin/production-readiness-page-view.test.ts` (new)
- `docs/build/slices/ADMIN5_PRODUCTION_READINESS_PAGE.md`

**Forbidden files**
- Architecture page (ADMIN4)
- Other admin pages (ADMIN6)

**Implementation scope**
1. Wrap page in `AdminCanonShellV2`.
2. Steward editorial card honest about pilot vs production.
3. Three tiles: Demo READY / Pilot PARTIAL / Production BLOCKED.
4. Top blockers table consumes the existing `W32F` blocker-detail view-model.
5. Context bar same template; LIVE STATUS=Deferred.
6. Agent rail: Steward primary, no `production_ready` promotion.

**Tests required**
- `src/__tests__/integration/admin/production-readiness-page-view.test.ts` (22+ tests):
  - tile statuses are Demo READY, Pilot PARTIAL, Production BLOCKED
  - blocker table consumes W32F view-model
  - drawer integration links to blocker detail
  - no `production_ready: true` anywhere
  - no fabricated counts

**Acceptance criteria**
1. Page renders.
2. Never claims `production_ready`.
3. Blocker drawer integration works.
4. `npx tsc --noEmit` clean.

**LANE-SHA:** TBD

---

### ADMIN6 — Remaining 6 sub-pages

- **Slice ID:** ADMIN6
- **Worktree:** `/tmp/nexus-admin6`
- **Branch:** `wave33/admin6-remaining-pages`
- **Type:** ui
- **Depends on:** ADMIN1, ADMIN2, ADMIN3
- **Estimated complexity:** XL

**Allowed files**
- `src/app/(maestro)/admin/page.tsx` (Overview)
- `src/app/(maestro)/admin/data-trust/page.tsx` (new or modify)
- `src/app/(maestro)/admin/connectors/page.tsx` (new or modify)
- `src/app/(maestro)/admin/users-access/page.tsx` (new or modify)
- `src/app/(maestro)/admin/agent-readiness/page.tsx` (new or modify)
- `src/app/(maestro)/admin/build-progress/page.tsx` (new or modify)
- Corresponding read-model files in `src/lib/admin/` (e.g. `admin-overview-page-view.ts`, `data-trust-page-view.ts`, etc.)
- Tests in `src/__tests__/integration/admin/`
- `docs/build/slices/ADMIN6_REMAINING_SUB_PAGES.md`

**Forbidden files**
- Architecture page (ADMIN4)
- Production Readiness page (ADMIN5)

**Implementation scope**
Each sub-page uses the same template (eyebrow + serif title + context bar + Steward editorial + page-specific content + agent rail).

- **Overview** — portfolio summary tiles (no fabricated metrics). Steward editorial: "What needs your attention this week."
- **Data Trust** — dataset trust ladder + sharing levels. Reuses `src/lib/data-trust/`.
- **Connectors** — consumes W32D `connectors-readiness-view`. 6 connectors.
- **Users & Access** — new view (deterministic seed list). Reuses ADM6 ground.
- **Agent Readiness** — consumes existing `agent-readiness` model.
- **Build Progress** — wave + slice progress (read from build-slices.json or existing progress view).

**Tests required**
- ~10 tests per page, ~60 total across 6 page tests:
  - each page renders the canonical 3-zone shell
  - each page renders a Steward editorial card
  - each page renders the 5-cell context bar
  - each page renders an agent rail with honest posture
  - each page renders the Live caveat pill
  - no banned tokens

**Acceptance criteria**
1. All 8 admin sub-routes resolve cleanly with the new shell (Overview + Data Trust + Connectors + Users & Access + Agent Readiness + Production Readiness + Build Progress + Architecture).
2. No fabricated counts or percentages.
3. `npx tsc --noEmit` clean.

**LANE-SHA:** TBD

---

### ADMIN7 — Visual lock + regression guard

- **Slice ID:** ADMIN7
- **Worktree:** `/tmp/nexus-admin7`
- **Branch:** `wave33/admin7-visual-lock`
- **Type:** qa
- **Depends on:** ADMIN1, ADMIN2, ADMIN3, ADMIN4, ADMIN5, ADMIN6
- **Estimated complexity:** M

**Allowed files**
- `src/__tests__/integration/admin/admin-visual-regression.test.ts` (new)
- `scripts/integration/check_admin_design_tokens.sh` (new)
- `src/lib/qa/wireframe-compliance-audit.ts` (modify — score updates)
- `docs/build/slices/ADMIN7_VISUAL_LOCK.md`

**Forbidden files**
- Any admin page or component (must already be merged via ADMIN1–6)
- Any token file

**Implementation scope**
1. Hex-scan test: any hex literal outside the canonical palette inside `src/app/(maestro)/admin/` or `src/components/admin/` fails.
2. Font-family scan: only Cormorant Garamond / DM Sans / Georgia fallback allowed in admin tree.
3. Logo presence test: every admin page must render `AbarVaLogo` from the canonical component (no inline wordmarks).
4. Update WIRE2B compliance scores: admin pages 72→92.
5. Optional: Playwright snapshot stubs (1280×800) if Playwright is configured. Skip cleanly if not.

**Tests required**
- `src/__tests__/integration/admin/admin-visual-regression.test.ts` (40+ tests):
  - hex-scan test passes against current admin tree
  - font-family scan passes
  - logo presence test passes
  - compliance score reflects new value
  - regression guard fails any future PR that drifts (test with synthetic violation fixture)

**Acceptance criteria**
1. Regression guard fails any future PR that drifts.
2. Score updates reflected in `wireframe-compliance-audit.ts`.
3. `npx tsc --noEmit` clean.

**LANE-SHA:** TBD

---

## Integration / release

**Cherry-pick order**
1. ADMIN1 (foundation)
2. ADMIN2 (shell)
3. ADMIN3 (steward editorial)
4. ADMIN4 (architecture page)
5. ADMIN5 (production readiness page)
6. ADMIN6 (remaining 6 pages)
7. ADMIN7 (regression guard)

**Expected conflicts**
- `docs/build/build-slices.json` — use `scripts/integration/cherry_resolve.py` to merge slice entries
- `src/components/brand/AbarVaLogo.tsx` — only ADMIN1 owns this. Reject any other lane that touches it.
- `src/lib/qa/wireframe-compliance-audit.ts` — only ADMIN7 modifies admin scores.

**Hygiene gate**
- `bash scripts/integration/hygiene_gate.sh --skip-build` must pass after every lane merge.

**PR title format**
- `feat(admin): canonical 3-zone editorial redesign — wave-admin-redesign`
- Per-lane: `feat(admin): ADMIN{N} {short-title} — wave-admin-redesign`

---

## Wave-level acceptance criteria

- [ ] Admin compliance score (WIRE2B) lifts 72→92
- [ ] Banned tokens on admin pages 11→0
- [ ] All 8 admin pages render the 3-zone shell
- [ ] All 8 admin pages show Steward editorial card
- [ ] All 8 admin pages show context bar
- [ ] All 8 admin pages show agent rail with honest posture
- [ ] Live caveat permanent on every admin page
- [ ] Logo lockup v2 rendered (not stub)
- [ ] New design tokens used (no hex literals in admin tree)
- [ ] 200+ new tests passing
- [ ] No production_ready promotion
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` green
- [ ] `hygiene_gate.sh --skip-build` PASS

---

## Risks and deferrals

- **Cormorant Garamond font subset** adds ~25KB to the admin route bundle. Acceptable for an internal-only surface; revisit if it leaks to public marketing.
- **Layout change is real** — reviewers will need to look at each page once. The wave is intentionally split across 7 lanes so each PR is reviewable in isolation.
- **Live data wiring is out of scope.** W32D/W32E/W32F are deterministic read-models; ADMIN6 wires them to UI without introducing live calls. Live wiring is its own future wave.
- **Playwright snapshots** are optional — if Playwright isn't set up in the repo, ADMIN7 ships text-based regression tests only.
- **Sidebar pathname matching** depends on Next.js App Router conventions; verify `usePathname()` behavior in the test environment before relying on `startsWith` matching.
- **No production_ready promotion in this wave.** This is a UI redesign, not a readiness milestone.

---

## Founder review routes (post-merge)

- /admin
- /admin/data-trust (or whichever path is canonical post-ADMIN6)
- /admin/connectors
- /admin/users-access
- /admin/agent-readiness
- /admin/production-readiness
- /admin/build-progress
- /admin/architecture

Each route should display: 3-zone shell, new logo lockup, Cormorant Garamond title, 5-cell context bar, Steward editorial card, 4-card agent rail with honest posture, and the permanent Live caveat pill.

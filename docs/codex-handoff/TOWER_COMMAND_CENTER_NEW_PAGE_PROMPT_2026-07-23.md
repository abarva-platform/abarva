# Tower Command Center — build a new page, 100% as designed — Codex prompt (2026-07-23)

## The job in one sentence

Build a **brand-new Tower page** that reproduces the approved design at
`docs/design/tower/command-center-2026-07-23/tower-command-center-design.html` exactly, fed by
real governed tenant data — and **do not modify, refactor, restyle, or "fix" the existing Tower
page while doing it**.

## What you must not touch

`src/components/tower/TowerIndexPage.tsx` is 13,727 lines and currently serves `/tower`. It stays
exactly as it is. Same for every component under `src/components/tower/` that it imports, and for
`src/app/(maestro)/tower/page.tsx`.

The new page is additive: a new route, a new component tree, a new CSS module, behind a flag. If
you find yourself editing `TowerIndexPage.tsx`, you have gone off-scope — stop and re-read this.

The one shared file you _may_ need to touch is `src/lib/cio-tower/tower-mart-view-model.ts`, and
only additively (new optional fields, new exported mapper). Adding a required field there breaks
the existing page; do not.

---

## 1 · The design source of truth

Open `docs/design/tower/command-center-2026-07-23/tower-command-center-design.html` in a browser
before you write a line of code. It is self-contained and fully interactive — all six tabs, all
seven sub-views, all four drawers, all five charts. Read
`docs/design/tower/command-center-2026-07-23/README.md` for how it was unpacked and what the two
files are.

**Where this HTML file and this prompt disagree, the HTML file wins.** This prompt exists to tell
you what the file cannot: what is already in the repo, what data is real, and what in the mockup
is fiction.

Line references below are into that file:

| What                                                                                   | Lines                              |
| -------------------------------------------------------------------------------------- | ---------------------------------- |
| Token palette the design was authored against                                          | 28–228                             |
| Component CSS (~290 lines — the layout contract)                                       | 229–516                            |
| Shell markup (`.app` → topbar → stage → bodyregion → drawer)                           | 519–550                            |
| `data()` — the entire mock dataset                                                     | 599–~700                           |
| `viewCommand` / `viewFunnel` / `viewLanes` / `viewAI` / `viewEvidence` / `viewActions` | 730 / 781 / 815 / 903 / 997 / 1048 |
| `progDrawer` / `aiDrawer` / `gapDrawer` / `actionDrawer`                               | 1096 / 1139 / 1163 / 1181          |
| `chart_week` / `chart_waterfall` / `chart_quad` / `chart_bubble` / `chart_lens`        | 1233 / 1253 / 1278 / 1300 / 1322   |

---

## 2 · Ground truth — verified on disk, do not assume otherwise

Everything in this section was checked against the working tree on 2026-07-23. Re-verify line
numbers before editing; they will have moved.

### 2.1 This is not a new information architecture

The current `/tower` **already ships the same six tabs** — Command Center, Value Proof, Decision
Lanes, AI Portfolio, Evidence, Recommended Actions. See the captured proof bundle
`proof/tower-e2e-qa-20260723/01-command-center.png` through `06-recommended-actions.png`.

The design is a **density and interaction rebuild** of an IA that already exists, not a new
concept. Treat the existing tab semantics as settled and do not re-litigate them.

### 2.2 The headline numbers in the mockup are already live and real

The current Tower renders, for the Healthcare Composite Demo tenant, from `cio_tower.mart_*`:

> `$650.0M` FY26 IT budget · `$53.7M` AI-tagged · `$35.5M` promised · `$3.8M` finance-validated ·
> `$0` claimable · `$31.7M` blocked

Those are the **exact** figures the design's Command Center and Value Proof tabs display. The
value-realization spine of this design is therefore already backed by governed data. Do not
rebuild it, and do not treat the design's top-line numbers as invented.

### 2.3 Every design token already exists

`docs/design/strategic-moves/tokens.css` already defines `--canon-teal` `#1d9e75`,
`--canon-teal-dark` `#0f6e56`, `--canon-teal-light` `#e1f5ee`, `--canon-amber` `#ba7517`,
`--canon-amber-light` `#faeeda`, `--canon-red` `#a32d2d`, `--canon-red-light` `#fceded`,
`--canon-bg-dark` `#0a0a0b`, `--canon-border`, `--canon-border-strong`, `--shadow-card`,
`--shadow-pop`, `--ease-out`, `--dur-fast/base/slow`, `--abarva-serif`, `--abarva-sans`,
`--abarva-mono`, `--abarva-signal-blue`. All match the design exactly.

`src/styles/canon-tokens.css` re-exports that file and is imported by
`src/app/(maestro)/layout.tsx:3`, so the tokens already resolve on every Tower route. **Do not add
a second palette.**

### 2.4 …except six neutrals, which drifted. This is the one real styling trap.

The design was authored against an **older, warmer** canon palette:

| Token              | Design (`tower-command-center-design.html`) | Repo today (`docs/design/strategic-moves/tokens.css`) |
| ------------------ | ------------------------------------------- | ----------------------------------------------------- |
| `--canon-bg-cream` | `#f5f1eb`                                   | `#ffffff` (line 52)                                   |
| `--canon-gray-900` | `#2c2c2a`                                   | `#1a1a18` (line 65)                                   |
| `--canon-gray-700` | `#444441`                                   | `#444444` (line 66)                                   |
| `--canon-gray-300` | `#b4b2a9`                                   | `#b4b4b8` (line 68)                                   |
| `--canon-gray-200` | `#d3d1c7`                                   | `#e5e5e5` (line 69)                                   |
| `--canon-gray-100` | `#f1efe8`                                   | `#f4f4f4` (line 70)                                   |

This is **not cosmetic**. With `--canon-bg-cream === --canon-bg-surface === #ffffff`, three things
in the design collapse to white-on-white and lose their separation entirely:

- `.lane-body` (line ~404 of the design CSS) — the Kanban lane backgrounds
- `.dr-grid` — the drawer's four-up stat block
- `.dr-foot` — the drawer footer bar

**Required approach:** scope the six overrides to the new page's root element only — e.g.
`.towerCommandCenter { --canon-bg-cream: #f5f1eb; … }` at the top of the new CSS module.

**Do NOT edit `docs/design/strategic-moves/tokens.css`.** That file is the locked global canon and
changing it would restyle Moves, Source, Intelligence and Home. If you believe the global palette
is wrong, say so in the PR and leave it alone.

### 2.5 The fixed-viewport shell is already free

The design is `height:100vh; overflow:hidden` with an internal `flex:1; min-height:0` body region
— no page scroll, ever. `src/components/shell/AppShell.tsx` is **already** exactly that: lines 97,
112 and 135 are `flex: 1` with `minHeight: 0` and `overflow: "hidden"` at lines 99, 114, 139. The
in-file comment (lines 91–100) explains that re-asserting `100vh` inside the shell is a known bug
that was just fixed on branch `fix/shell-phantom-viewport-scroll`.

**So: your page must NOT set `100vh`, `min-height:100vh`, or `height:100vh` anywhere.** Render a
`flex:1 / minHeight:0 / overflow:hidden` column and let the shell own the viewport. The design's
`.app { height:100vh }` rule (design CSS line ~741) is the one rule you must drop.

### 2.6 Recharts is already a dependency — but a different major

`package.json` has `recharts@^3.8.1`. The design targets `2.12.7` (loaded from esm.sh at design
file line ~566). Re-verify each of the five figures on v3 rather than assuming a clean port. The
four constructs most likely to have moved:

1. **The waterfall's transparent stacked base.** `chart_waterfall` renders two `<Bar>` on the same
   `stackId="a"`, the first with `fill:'transparent'`, to fake floating bars. Confirm v3 still
   honours a transparent stack segment and does not collapse or re-baseline it.
2. **`<Scatter onClick>` payload shape.** `chart_quad` does `onClick:(pt)=>this.progDrawer(pt.id)`
   and `chart_bubble` does `onClick:(pt)=>this.aiDrawer(pt.n)` — i.e. it reads the datum's own
   fields off the click argument. v3 may wrap the datum in `{ payload }`.
3. **`<LabelList>` nested inside `<Scatter>`** (bubble numbers rendered inside each circle).
4. **The custom two-line axis tick** — `_twoLine(props)` returns a `<text>` with `<tspan>`
   children and is passed as `tick:` to `<XAxis>`.

Where a v3 API genuinely differs, **match the rendered output, not the source**. The contract is
the picture.

### 2.7 The data model is already close to 1:1

`src/lib/cio-tower/tower-mart-view-model.ts` `loadTowerMartCommandView()` (line 191) already
returns, per tenant, from `cio_tower.mart_*`:

| Interface (line)                  | Feeds                                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TowerMartCommandCenter` (7)      | Command Center posture tiles, "this week's read"                                                                                                                                                                                |
| `TowerMartValueFunnelStage` (30)  | Value Proof waterfall                                                                                                                                                                                                           |
| `TowerMartProgramLane` (46)       | Decision Lanes — has `decisionLane: 'fund'\|'fix'\|'freeze'\|'stop'`, `approvedFundingUsd`, `promisedValueUsd`, `financeValidatedValueUsd`, `usageMetric`, `adoptionRatePct`, `requiredGates`, `decisionRationale`, `ownerRole` |
| `TowerMartAiPortfolioItem` (69)   | AI Portfolio — has `valueScore`, `readinessScore`, `aiTaggedSpendUsd`, `vendorName`, `systemName`, `aiSpendType`, `aiSpendCategory`, `itemKind`                                                                                 |
| `TowerMartCxoAction` (92)         | Recommended Actions — has `actionLane`, `ownerHint`, `moduleHandoff`                                                                                                                                                            |
| `TowerMartEvidenceLineage` (101)  | Evidence tab                                                                                                                                                                                                                    |
| `TowerMartRequiredFieldGap` (114) | Evidence tab, risk posture tile                                                                                                                                                                                                 |

`valueScore` / `readinessScore` map directly onto the bubble matrix axes. `decisionLane` maps
directly onto the four Kanban lanes. This is a good fit — use it.

### 2.8 Five fields the design needs that the mart does not carry

| Design field                       | Where used                           | Status     |
| ---------------------------------- | ------------------------------------ | ---------- |
| usage-supported value (`p.usage`)  | proof chain, waterfall, lane cards   | **derive** |
| claimable value (`p.claim`)        | proof chain, posture tile            | **derive** |
| blocked value (`p.blocked`)        | Top-5 blockers table, lane table     | **derive** |
| evidence maturity 0–100 (`p.evid`) | portfolio heatmap X axis             | **derive** |
| proof level 0–3 (`p.proof`)        | `.pips` in every table and lane card | **derive** |

Derive them in the new view-model from `valueFunnel` + `requiredGates` + `valueClaimStatus` +
`towerClaimAllowed`. Put the formula in one exported, unit-tested function with the arithmetic
stated in a comment — do not scatter the logic across components.

**Do not add mart columns in this change.** If the derivation turns out to need a persisted
column, land the UI first against the derived values and raise the mart change as a separate,
release-recorded slice with its own lineage rows.

### 2.9 The mockup's _content_ is fiction. Say so, then replace it.

This is the single most important honesty constraint in this build.

The mock dataset at design file lines 599–700 — "Risk & Compliance AI", "Payments
Modernization", "Wealth Advisor Copilot", the FINRA / OCC / DLP / SR 11-7 narrative, and the
tenant label "First Capital Financial" — is **invented banking copy layered on top of Healthcare
Composite Demo aggregates** (see §2.2: the $650M/$53.7M/$35.5M/$3.8M/$0 figures are the
healthcare tenant's).

For reference, First Capital's actual governed substrate is materially different:

- `tower-standardized-v1/first-capital-financial/family-4-financial-commercial/F12_it-budget-financials.csv`
  — 13 budget areas, **$2.132B** FY26 IT budget, **$324M** AI/data budget.
- `datasets/tenant-inputs/first-capital/standard-2026-07-v3/SA08_AI_Benefits_Realization_Usage_Ledger.csv`
  — **8** AI programs (Banker Productivity Copilot, ITSM AI Resolution Pilot, Core Banking
  Engineering Copilot, Fraud Copilot Readiness, AML/KYC Operations Assist, Customer 360, Loan
  Operations Automation, Regulatory Reporting), **$50.8M** promised, **$1.75M** finance-validated,
  **$0** claimable.

**Therefore:**

- **Layout, spacing, type, colour, density, interaction and chart geometry: reproduce 100%.**
- **Every string and every number: comes from the tenant's governed data.** The rendered page will
  say different things than the mockup. That is correct and expected.
- **Do not hardcode the mockup's programs, owners, blockers, gates or narrative** into shipped
  code. That would put un-governed synthetic content into an agent-usable surface, which violates
  `AGENTS.md` → "Context & corpus governance". It is also the exact "demo thinking" the project
  bans.
- Using the mock dataset as a **typed fixture in tests and Storybook-equivalent harnesses is fine
  and encouraged** — that is how you prove the layout is pixel-correct independent of live data.

If a design element has no governed data behind it for a tenant (e.g. "Top-3 vendor
concentration"), render an honest empty/unknown state in the same slot with the same geometry.
**Never fabricate a number to fill a tile.**

### 2.10 Chrome mismatch — flag it, do not silently resolve it

|             | Design                                           | Repo today                                                                                                 |
| ----------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Nav height  | 52px (`.topbar`, design CSS ~line 742)           | 72px min (`src/components/navigation/NexusTopNav.module.css:15`)                                           |
| Items       | 5 — Home · Intelligence · Moves · Source · Tower | 6 — Knowledge · Intelligence · Moves · Source · Tower · Learn (`src/components/shell/topbar-nav-items.ts`) |
| Tenant name | italic serif, inline after wordmark              | not rendered in nav                                                                                        |
| Right side  | nothing                                          | avatar + Sign out                                                                                          |

`NexusTopNav` is mounted once by `src/components/chrome/MaestroChrome.tsx:33` for all
shell-native surfaces (`/tower` is in `SHELL_SURFACE_PREFIXES`).

**Build the page 100% as designed _below_ the existing nav. Do not change `NexusTopNav`,
`topbar-nav-items.ts`, or `MaestroChrome`.** Changing the global nav to match the mockup would
restyle every authenticated surface and is a separate, product-owner decision. Note the delta in
the PR description and move on.

---

## 3 · Route, flag, file layout

```
src/app/(maestro)/tower/command/page.tsx          # new route — server component
src/components/tower/command-center/
  TowerCommandCenter.tsx                          # client root: tab + sub-view + drawer state
  TowerCommandCenter.module.css                   # verbatim transcription of design CSS 229–516
  views/CommandCenterView.tsx
  views/ValueProofView.tsx
  views/DecisionLanesView.tsx                     # 3 sub-views
  views/AiPortfolioView.tsx                       # 4 sub-views
  views/EvidenceView.tsx
  views/RecommendedActionsView.tsx
  drawers/ProgramDrawer.tsx
  drawers/AiInitiativeDrawer.tsx
  drawers/EvidenceGapDrawer.tsx
  drawers/ActionDrawer.tsx
  charts/{WeekReadChart,ValueWaterfallChart,PortfolioHeatmapChart,AiBubbleMatrixChart,AiSpendLensChart}.tsx
  __tests__/
src/lib/tower/command-center/
  view-model.ts                                   # mart → design shape, incl. the §2.8 derivations
  types.ts
  __tests__/
```

Flag: add `tower_command_center_v2` to `src/lib/features/registry.ts` (`FeatureFlagKey` union +
`FEATURE_FLAGS`), `policy: "tenant"`, `includeTenants: []` to start. Follow the existing
`tower_cxo_claude_story_blocks` entry (registry.ts:99) as the pattern, including a real `summary`
and the env-allowlist note.

Gate the route with `isFeatureEnabled({ clientKey }, "tower_command_center_v2")`; render a 404 /
redirect to `/tower` when off. `/tower` itself is untouched and keeps serving the current page.

---

## 4 · The view contract — 6 tabs, 11 view states

The design's `renderTabs()` (design file ~line 674) defines the tab bar. `Value Proof` and
`Evidence` carry a red attention dot; `Recommended Actions` carries a numeric count.

| #   | Tab                 | Sub-views                                                                    | Must contain                                                                                                                                                                                                                                                                              |
| --- | ------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Command Center      | —                                                                            | 4 posture tiles (Spend / Value / Risk / Decision), each with eyebrow + status chip + hero number + sub-line + 4 metric rows; "This week's read" card with serif run-on sentence, the week bar chart, and a footer CTA to Value Proof; "Decisions waiting on you" list of lane-tagged rows |
| 2   | Value Proof         | —                                                                            | Value waterfall chart + "The read" callout; "Top 5 blockers by dollar impact" table sorted by blocked $ desc                                                                                                                                                                              |
| 3   | Decision Lanes      | `Program table` (default) · `Kanban lanes` · `Portfolio heatmap`             | 8-column decision table; 4 lane columns (Fund/Fix/Freeze/Stop) with per-lane count + promised total + program cards; scatter of evidence-maturity × value-at-stake with quadrant reference lines                                                                                          |
| 4   | AI Portfolio        | `Integrated` (default) · `Bubble matrix` · `Spend lens` · `Initiative table` | value×readiness bubble matrix sized by spend; AI spend lens horizontal bars by category; "Not funded · candidate pool" dashed-border list; 7-column initiative table. Type filter chips (All/Funded/Embedded/Candidate/Governance/Platform) apply to all sub-views except Spend lens      |
| 5   | Evidence            | —                                                                            | 4-button segmented control ("What evidence exists?" / "What is missing?" / "Who owns the missing proof?" / "What decision is blocked until it arrives?"), one answer set shown at a time, two-column grid of large evidence rows with a right-aligned metric + unit + tag                 |
| 6   | Recommended Actions | —                                                                            | 5 owner columns (CFO / CIO / CDAO / Model Risk Office / Procurement & business owners), each a scrolling stack of lane-coloured action cards                                                                                                                                              |

Sub-view state, tab state, AI type filter and evidence question are all **client state, not
routing** in the design. Keep it that way, but reflect the active tab in a `?tab=` search param so
a link can deep-link and so E2E can address a tab directly.

---

## 5 · The four drawers

560px, right-anchored, `translateX` transition, dimmed backdrop, closes on backdrop click and on
`Escape` (design file ~line 693).

| Drawer        | Opened from                                 | Structure                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Program       | any program row / lane card / heatmap point | eyebrow (`Program · P3 · Fund`) → serif title → "In plain terms" tinted paragraph → 4-up stat grid → **value proof chain** (Promised → Usage-supported → Finance-validated → Claimable → Blocked, each with a one-line definition) → usage & adoption evidence bars → owner / function / next gate rows → "The read" with a cited source file → footer: lane + blocker, `Close`, `See the action` |
| AI initiative | bubble point / initiative row               | 4-up stat grid (spend / posture / value / readiness) → "In plain terms" → vendor & system rows → usage evidence bars → "The read" → footer                                                                                                                                                                                                                                                        |
| Evidence gap  | a gap row in the Evidence tab               | 4-up (owner / due / linked program / priority) → "Why it matters" → "Decision blocked until it arrives" → audit trace → footer: `Close`, `Route to action`                                                                                                                                                                                                                                        |
| Action        | any action card                             | 4-up (decision required / due / linked program / owner) → "Why now" → "Evidence needed" → **human-approval note** → footer: `Defer`, `Approve & route`                                                                                                                                                                                                                                            |

**The Action drawer's approve transition is part of the design, not a stub** (design file lines
1196–1203): clicking `Approve & route` replaces the drawer body with a centred confirmation
("Routed to CFO — created as a Move — '<move title>' — with its evidence chain attached") and
swaps the footer to `Close` / `View in Moves`.

Wire that to the real Moves handoff if a governed path exists (`TowerMartCxoAction.moduleHandoff`
is the hook, and `src/app/api/tower/decision/route.ts` already exists — read it before deciding).
If no governed create-a-Move path exists yet, render the confirmation state **only after a real
persisted write**, or disable the button with an honest reason. Do **not** ship a button that
shows "Routed to CFO" without anything having been routed.

---

## 6 · Non-functionals the mockup omits — you own these

The design file is a mockup and has none of the following. All are required to ship:

1. **Loading state** — the shell, header and tab bar render immediately; view bodies show skeletons
   sized to the final layout so nothing reflows.
2. **Empty state** — a tenant with no `cio_tower.mart_*` rows must get an honest "no governed Tower
   data for this tenant" panel, not zeros. Zeros are a claim.
3. **Error state** — the existing page's `withTowerReadTimeout` pattern
   (`src/app/(maestro)/tower/page.tsx:34`, 8s) is the precedent; degrade per-section, never blank
   the page.
4. **Accessibility** — the mockup's tabs are bare `<button>`s. Ship real `role="tablist"` /
   `role="tab"` / `aria-selected` / `aria-controls`, roving tabindex and arrow-key navigation; the
   evidence segmented control as a `radiogroup`; the drawer with `role="dialog"`, `aria-modal`,
   focus trap, focus restore on close, and a real accessible name. Charts need text alternatives —
   the adjacent tables are the natural one; associate them.
5. **Responsive** — the design has two media queries (`820px`, `1080px`, `1200px`). Below the
   smallest breakpoint the fixed-viewport model has to yield to scroll. Decide and document.
6. **Numbers** — `font-variant-numeric: tabular-nums` on every figure (the design does this on
   `.pt-row .rv`, `.tbl td.num`, `.drow .dv` — keep it, and extend it consistently).
7. **Telemetry** — tab change, sub-view change, drawer open, approve-and-route. Match whatever the
   surrounding surfaces already emit; do not invent a new event schema.

---

## 7 · Suggested slices

Land these as separate PRs; each must be independently green and independently revertible.

- **TCC-1 · Shell + tokens.** Route, flag, `TowerCommandCenter.tsx`, CSS module transcribed
  verbatim, scoped six-token override, header + tab bar + sub-navs, all six tabs rendering from
  the mock dataset as a **typed test fixture**. No live data. Deliverable: a page that is
  pixel-indistinguishable from the design file.
- **TCC-2 · Charts.** All five figures on Recharts 3, verified against the design file
  side-by-side.
- **TCC-3 · Drawers.** All four, including the approve transition wired to a real write or
  honestly disabled.
- **TCC-4 · View-model.** `loadTowerMartCommandView` → design shape, including the §2.8
  derivations with unit tests on the arithmetic. Swap the fixture for live data.
- **TCC-5 · Evidence derivation.** Map `mart_evidence_lineage` + `mart_required_field_gaps` onto
  the four question sets. Where the answer is narrative, Claude may write the _wording_ under the
  standing Tower rule — **Tower read models own every value; Claude never calculates spend, value,
  ROI or risk** (`AGENTS.md`).
- **TCC-6 · Non-functionals.** §6 in full.

---

## 8 · Gates — all must pass before you call anything done

```bash
npx eslint src/
npm run test:behaviors
npm run test:integration
node scripts/release-check.mjs --base origin/main --head HEAD
```

Plus:

- `tsc -p tsconfig.json --noEmit` — **jest green does not mean type-clean** in this repo (ts-jest
  does not type-check). If local `tsc` OOMs, say so and rely on CI, but do not skip it silently.
- New unit tests for the §2.8 derivation arithmetic and for the mart → view-model mapper,
  including the empty-mart case.
- A Playwright spec under `tests/e2e/` that visits each of the 6 tabs and 7 sub-views and opens
  each of the 4 drawers.
- A release record under `docs/releases/records/` from
  `docs/releases/templates/release-record-template.md`. Lane: `global-control-lane`
  (flag-gated → also note `experimental`). `npm run release:check` enforces this.

---

## 9 · Proof — what "done" means

Per `AGENTS.md` → "Deployment authority and runtime invariant", a PR may say _merged_, _deployed_
or _flagged_; it may **not** say _live-proven_ until:

1. The ACA web Container App template image, the 100%-traffic revision image, and worker job
   images all match the approved **digest-pinned** `@sha256:` image.
2. A **signed-in live client proof** on `https://app.abarva.ai` for each affected tenant.
3. A proof bundle under `proof/tower-command-center-v2-<date>/` containing one screenshot per tab
   and per sub-view, one per drawer, plus a console log showing no errors — matching the shape of
   the existing `proof/tower-e2e-qa-20260723/`.

Deploy only via the repo-owned main deploy workflow. No ad-hoc `az containerapp update`, no
`az acr build` against `acrabarvalab001/abarva/web`, no Vercel.

---

## 10 · Stop and ask — do not guess

Raise these in the PR rather than resolving them unilaterally:

1. **Which tenant is this for?** The mockup is labelled "First Capital Financial" but shows the
   Healthcare Composite Demo tenant's numbers (§2.2, §2.9). Confirm the launch tenant before
   wiring `includeTenants`.
2. **Global nav.** The design's 52px / 5-item bar vs. the shipped 72px / 6-item `NexusTopNav`
   (§2.10). Build below the existing nav; flag the delta.
3. **The approve-and-route write path.** If no governed Tower → Moves create path exists, say so
   rather than shipping a cosmetic confirmation (§5).
4. **Any design element with no governed data behind it.** Render an honest unknown state and list
   every such slot in the PR description (§2.9).

## 11 · The standing rules that override anything above

- Design is locked — no colour, font or layout invention beyond what the design file shows.
- No demo thinking — every choice must survive pilot scrutiny (audit, RBAC, RLS, telemetry).
- Real client names never appear in any agent-usable object or response; cover names are canonical.
- Anthropic-only for reasoning; Tower numbers stay deterministic.
- Do not push to `main`; open a PR and squash-merge.

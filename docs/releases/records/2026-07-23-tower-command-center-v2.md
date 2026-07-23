# 2026-07-23-tower-command-center-v2 — Tower Command Center, tenant-gated primary route

## Release ID

`2026-07-23-tower-command-center-v2`

## Status

`meridian-live-proven`

## Plain-English Summary

Tower gets a new Command Center surface that reproduces the approved design at
`docs/design/tower/command-center-2026-07-23/tower-command-center-design.html`.

It is the same six sections the current Tower already ships (Command Center, Value Proof, Decision
Lanes, AI Portfolio, Evidence, Recommended Actions), rebuilt at much higher density and with real
interaction: three sub-views inside Decision Lanes, four inside AI Portfolio, five charts, and four
detail drawers that open from any row, card or chart point. The Command Center also keeps the
existing governed Tower aVa behavior through the same `AtlasChatPanel` / `AgentDock` launcher and
`/api/tower/cio-chat` response path used by the previous Tower surface.

**This is tenant-gated.** `/tower` serves the new Command Center only when
`tower_command_center_v2` is explicitly enabled for the tenant. With the flag off, `/tower` serves
the previous Tower surface. The previous surface was lifted intact into `TowerLegacySurface` and is
also always available at `/tower/legacy`; `TowerIndexPage.tsx` itself is untouched.

`/tower/command` remains as a permanent alias that redirects to `/tower`, preserving query params,
so earlier links and test paths do not fork the Tower runtime into two separate pages.

Every number and every string on the page is read from the governed `cio_tower.mart_*` read
models. The design file's content — the banking programs, the FINRA/OCC narrative, the "First
Capital Financial" label — is invented copy layered on Healthcare Composite Demo aggregates. None
of it ships. It is committed only as a typed test fixture, so the layout can be proven at full
density without a database.

Where the mart carries nothing, the page says so. A tenant with no Tower rows gets an explicit
"no governed Tower data" panel, not a screen of zeros — a zero would be a claim that the budget,
promised value and claimable value are all nil, which is not what missing data means.

## Primary-route wiring and rollout correction — 2026-07-23

Changed at owner request after the build was reviewed. **`/tower` now serves the Command Center**
when `tower_command_center_v2` is on for the tenant, and the previous surface when it is off.

The first promotion edit made the flag `policy: "platform"` / `excludeTenants: []`, which would
have made the Command Center default-on for every tenant before live signed-in proof. That was
corrected before release. The final shipped posture is `policy: "tenant"` /
`includeTenants: ["meridian"]`:
the routing is ready, and the new UI/UX is scoped only to Meridian (`includeTenants: ["meridian"]`).
Every other tenant continues to receive the previous Tower surface.

Nothing was deleted, and `TowerIndexPage.tsx` was still never edited:

| Route            | Serves                                                           |
| ---------------- | ---------------------------------------------------------------- |
| `/tower`         | Command Center (flag on) · previous surface (flag off)           |
| `/tower/legacy`  | the previous surface, always, flag regardless                    |
| `/tower/command` | permanent alias → redirects to `/tower`, preserving query params |

The previous route body was lifted verbatim into `src/components/tower/TowerLegacySurface.tsx` so it
can be mounted from both `/tower` (as the flag-off fallback) and `/tower/legacy`. Its data loading —
`loadCioTowerCxoView`, `listTowerBudgetRollupsForClient`, the V3 runtime view and Claude story
blocks — is unchanged.

The Command Center is mounted through `TowerCommandCenterAvaShell`, which preserves the same
collapsed Tower aVa launcher pattern as the previous surface. aVa remains advisory only: the page
still renders the governance caption _"aVa proposes · you approve · nothing acts on its own"_, and
chat responses continue to flow through the governed Tower CIO chat API rather than a new route.

**Rollback is a one-line, no-deploy change:** remove the tenant from `includeTenants` (or clear the
env allowlist) and the previous Tower returns on the next request.

### Meridian live proof and remaining platform gate

1. **Meridian signed-in proof passed on 2026-07-23.** The merged Command Center+aVa revision was
   deployed through `.github/workflows/aca-main-deploy.yml`, the ACA runtime invariant passed, and
   a signed-in Meridian browser session proved `/tower`, `/tower/command`, `/tower/legacy`, the
   Command Center root, the governed aVa launcher, and a real `/api/tower/cio-chat` response.
2. **Platform default-on is still not approved.** The surface remains scoped only to Meridian. The
   live read-back still predicts three thin sections on the Healthcare Composite Demo tenant
   (see the live read-back section): a 75%-empty Evidence tab, ~80 bubble-matrix points against a
   design drawn for ~8, and 3 of 5 empty owner columns. Do not widen beyond Meridian until those
   tenant-shape concerns and cross-tenant signed-in proof are clean.

## Layer Impact

- **`global-control-lane`** — route wiring, new component tree, new view-model under
  `src/lib/tower/command-center/`. Shared app behaviour, but tenant-gated, so no tenant sees a
  change until the flag is turned on for that tenant.
- **`experimental`** — flag-gated and Meridian-only; `policy: "tenant"`,
  `includeTenants: ["meridian"]`.

No schema change, no migration, no new API route, no new data-plane read. The page uses the
existing `loadTowerMartCommandView()` reader that `/tower` already calls.

## Client Applicability

- All clients: no — only Meridian receives the new UI/UX.
- Specific clients: Meridian / Healthcare Demo only.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `tower_command_center_v2` (`policy: "tenant"`, `includeTenants: ["meridian"]`, env
  `ABARVA_FEATURE_TOWER_COMMAND_CENTER_V2_TENANTS`).

## Changes Included

Routes and flags:

- `src/app/(maestro)/tower/page.tsx` — primary Tower route: Command Center when the flag is on for
  the tenant, previous surface when off.
- `src/app/(maestro)/tower/command/page.tsx` — permanent alias that redirects to `/tower`.
- `src/app/(maestro)/tower/legacy/page.tsx` — previous Tower surface, always reachable regardless
  of flag state.
- `src/components/tower/TowerLegacySurface.tsx` — previous Tower route body lifted intact for both
  the flag-off fallback and `/tower/legacy`.
- `src/lib/features/registry.ts` — adds `tower_command_center_v2` to `FeatureFlagKey` and
  `FEATURE_FLAGS`.

Data layer (new, `src/lib/tower/command-center/`):

- `types.ts` — the presentation contract; money in whole USD throughout.
- `derive.ts` — the five fields the mart does not persist (usage-supported value, claimable value,
  blocked value, evidence maturity 0–100, proof level 0–3), each with its arithmetic written out.
- `view-model.ts` — `buildTowerCommandCenterView()`: mart → design shape, plus `unknownSlots` for
  every design slot with no governed data behind it.
- `format.ts` — the design's `$M` formatting, including its rule that a true zero renders as a
  bare `$0`.
- `__fixtures__/design-fixture.ts` — the design file's mock dataset in mart shape. **Tests only.**

Components (new, `src/components/tower/command-center/`):

- `TowerCommandCenter.tsx` — client root: tab, sub-view and drawer state.
- `TowerCommandCenter.module.css` — the design's component CSS transcribed verbatim, with three
  deliberate departures documented in the file header.
- `views/` — six views covering eleven view states.
- `drawers/` — `DrawerShell` plus the four drawers.
- `charts/` — the five Recharts figures, ported from 2.12.7 to the repo's 3.8.1.
- `primitives.tsx` — the repeated gestures (pips, chips, cards, meters, sub-nav).

Tests:

- `src/lib/tower/command-center/__tests__/derive.test.ts` — 34 tests on the derivation arithmetic.
- `src/lib/tower/command-center/__tests__/view-model.test.ts` — 23 tests on the mapper, including
  the empty-mart case.
- `src/components/tower/command-center/__tests__/css-contract.test.ts` — guards that every
  referenced CSS-module class exists, that no `100vh` is re-asserted, and that the token overrides
  stay page-scoped.
- `src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx` — 15 behaviour tests
  across all tabs, sub-views and drawers.
- `tests/e2e/tower-command-center.spec.ts` — Playwright coverage of 6 tabs, 7 sub-views, 4 drawers,
  the no-page-scroll invariant, and a console-error check.

### Three deliberate departures from the design file

1. **`.app { height:100vh }` is dropped.** `AppShell` already provides the fixed-viewport,
   `overflow:hidden` column (lines 97/112/135). Re-asserting `100vh` inside it demands a whole
   viewport _below_ the nav — the bug fixed in `3d89299e9` on this branch. The CSS-contract test
   fails the build if it comes back.
2. **Six neutral tokens are re-declared, scoped to the page root.** The design was authored against
   an older warmer canon palette. Today `--canon-bg-cream` is `#ffffff`, identical to
   `--canon-bg-surface`, which collapses the Kanban lane bodies, the drawer stat grid and the
   drawer footer to white-on-white. The overrides live on `.root` only.
   `docs/design/strategic-moves/tokens.css` is **not** edited — changing it would restyle Moves,
   Source, Intelligence and Home.
3. **`.ins` / `.ik` / `.itext` are defined.** The design uses them in `viewFunnel()` but never
   declares them; they are styled to match the drawer's `.dr-plain` callout.

### Recharts 2.12.7 → 3.8.1

All four constructs the port was most likely to break were checked against the installed types:

- The waterfall's transparent stacked base still floats its bars.
- **`<Scatter onClick>` changed.** v3 passes a `ScatterPointItem` with the datum under `.payload`;
  v2 spread the datum itself. The design's `onClick:(pt)=>this.progDrawer(pt.id)` would have read
  `undefined` on v3. `scatterDatum()` in `charts/chart-kit.tsx` reads either shape.
- `<LabelList>` nested in `<Scatter>` still renders the bubble numerals.
- The custom two-line axis tick still works; v3 types `x`/`y` as `number | string`, handled.

### Accessibility beyond the mockup

The mockup's tabs are bare `<button>`s and its drawers have no dialog semantics. Shipped here:
`role="tablist"`/`tab` with roving tabindex and arrow/Home/End navigation; the evidence control and
sub-navs as `radiogroup`s; drawers with `role="dialog"`, `aria-modal`, a focus trap, Escape-to-close
and focus restore; text alternatives for all five charts, associated via `aria-describedby`.

One correction to the transcription: an earlier pass put `role="button"` on the `<tr>` of each
decision table. That strips the row semantics that make a dense table readable. Row-opening is now
a real `<button>` inside the first cell, with the row click retained for pointer users.

## QA / Validation

Run locally on branch `fix/shell-phantom-viewport-scroll` at 2026-07-23:

| Gate                                                                                                                                                                                | Result                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc -p tsconfig.json --noEmit`                                                                                                                                                 | **Clean for this change.** Three pre-existing errors remain (`@xyflow/react`, `@dagrejs/dagre` not installed locally); byte-identical with this change stashed.                                                                                                                                                                           |
| `npx eslint src/components/tower/command-center src/lib/tower/command-center "src/app/(maestro)/tower/command" src/lib/features/registry.ts tests/e2e/tower-command-center.spec.ts` | Clean, no warnings.                                                                                                                                                                                                                                                                                                                       |
| `npx jest src/components/tower/command-center src/lib/tower/command-center`                                                                                                         | **75 passed / 75**, 4 suites.                                                                                                                                                                                                                                                                                                             |
| `npm run test:behaviors`                                                                                                                                                            | **195 passed / 195**, 15 suites.                                                                                                                                                                                                                                                                                                          |
| `npm run test:integration`                                                                                                                                                          | 10,130 passed / 389 failed — **all failures pre-existing and unrelated** (admin visual-lock, Source API stubs, Azure/Postgres suites on placeholder credentials). No integration suite references this code. The one suite that touches `features/registry.ts` (`home-v2-all-client-binding`) fails identically with this change stashed. |
| `node scripts/release-check.mjs --base origin/main --head HEAD`                                                                                                                     | See below.                                                                                                                                                                                                                                                                                                                                |

Not yet run: `npm run test:e2e` for the new spec — it needs Playwright browsers, a running dev
server with real Clerk + Azure/Postgres credentials, and the flag enabled for the test tenant.
That is part of the live-proof step, not local validation.

## Rollout Plan

1. Merge the PR to `main` (squash). Meridian is the only enabled tenant; every other tenant still
   receives the previous Tower surface. **Completed:** PR #5466 merged as `38b8e3dd`.
2. `.github/workflows/aca-main-deploy.yml` builds the digest-pinned image and deploys it. No
   ad-hoc `az acr build`, no ad-hoc `az containerapp update`, no Vercel. **Completed:** workflow
   run `30011196596` succeeded.
3. Capture the Meridian live signed-in proof bundle before this record moves past `candidate`.
   **Completed:** see `reports/tower-command-center-ava-live-proof/`.
4. Any future env update or tenant-widening must pass the digest-pinned `--image` alongside the
   change so ACA cannot rebuild a revision from a stale template.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may
  shift shared Product/Lab web traffic.
- Shared runtime mutators: none in this change. No branch or local Azure command touches the shared
  Container App.
- Approved image digest for the Tower/aVa deploy:
  `sha256:56a0e1dfba15dbe2e71426de85ab9b6b27c6979dd8c301037650e3f0023ddc0a`
  (`main-38b8e3dd`).
- ACA runtime invariant: **passed** at `2026-07-23T13:35:19.426Z`. Template image and 100%-traffic
  revision image both pointed at
  `acrabarvalab001.azurecr.io/abarva/web@sha256:56a0e1dfba15dbe2e71426de85ab9b6b27c6979dd8c301037650e3f0023ddc0a`;
  100% traffic was on `ca-abarva-web-lab-eastus--m38b8e3dd`; `/api/health` returned `ok: true`.
- Worker image invariant: unaffected — no worker job changes.
- Feature/env flag update path: registry `includeTenants`, or
  `ABARVA_FEATURE_TOWER_COMMAND_CENTER_V2_TENANTS`. Any `az containerapp update` that sets it must
  also pass the currently approved digest-pinned `--image`.
- Live signed-in proof required: **passed for Meridian** on `https://app.abarva.ai`. Still required
  for any future tenant before widening the flag.

## Rollback Plan

Fastest: remove the tenant from `includeTenants` (or clear the env allowlist). `/tower` serves the
previous Tower surface again on the next request, and `/tower/legacy` remains available as the
side-by-side rollback target.

Full: revert the PR. Because the change is purely additive — new route, new component tree, new
`src/lib/tower/command-center/` module, one added flag key — the revert touches nothing the
existing Tower page depends on. No migration, so no migration rollback.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/5466.
- Merge commit: `38b8e3dd1a12e6e17170913acced7833c047bc61`.
- PR checks: 21/21 passed before merge, including `Production readiness gate` and
  `Typecheck + reasoning-layer tests`.
- ACA main deploy: workflow run `30011196596`, success.
- ACA runtime invariant proof:
  `audit-artifacts/aca-runtime-drift/tower-command-center-ava-20260723/runtime-invariant-proof.json`.
- Design contract: `docs/design/tower/command-center-2026-07-23/` (the runnable design file, the
  untouched original artifact bundle so the unpacking can be re-verified, and a README).
- Build instructions: `docs/codex-handoff/TOWER_COMMAND_CENTER_NEW_PAGE_PROMPT_2026-07-23.md`.
- Derivation arithmetic: `src/lib/tower/command-center/derive.ts`, pinned by
  `__tests__/derive.test.ts`.
- Existing Tower proof bundle, for the "same six tabs" claim:
  `proof/tower-e2e-qa-20260723/01-command-center.png` … `06-recommended-actions.png`.
- Live signed-in proof bundle:
  - `reports/tower-command-center-ava-live-proof/2026-07-23-isolation/proof.json`
  - `reports/tower-command-center-ava-live-proof/2026-07-23-chat/proof.json`
  - screenshots in the same directories.

### Live signed-in proof — 2026-07-23

Run from a workstation with `.auth/agent-meridian.json` against `https://app.abarva.ai`.

Passed:

- `/tower?client=meridian` resolved to `/tower`, did not redirect to sign-in, and rendered
  `data-testid="tower-command-center"`.
- The governed aVa collapsed launcher rendered on the Command Center.
- Opening the launcher rendered the shared `AgentDock` composer and the Command Center opener copy.
- The governance caption remained visible: _"aVa proposes · you approve · nothing acts on its own"_.
- `/tower/command?tab=evidence&client=meridian` redirected to `/tower?tab=evidence` and selected
  the Evidence tab.
- `/tower/legacy?client=meridian` remained available, did not render the Command Center root, and
  still mounted AgentDock.
- A real Command Center aVa UI question posted to `/api/tower/cio-chat`, returned HTTP 200 with
  `application/x-ndjson`, rendered an agent answer, and did not show error fallback copy.
- The isolated live probes recorded zero console errors and zero page errors.

## Live VNet read-back — 2026-07-23

Localhost cannot reach the private Postgres, but the ACA runtime is inside the VNet and the shipped
Tower already reads `cio_tower.mart_*`. So the real mart shape was read back from
`https://app.abarva.ai/tower`, signed in as the Healthcare Composite Demo tenant. **Read-only: no
`az` mutation, no job run, no image build, no traffic change.**

Confirmed exactly as the handoff prompt §2.2 claimed — the mockup's headline numbers are this
tenant's real, governed figures:

> `$650.0M` FY26 budget · run `$487.5M` · change `$162.5M` · `$53.7M` AI-tagged · approved program
> budget `$291.9M` · promised `$35.5M` · finance-validated `$3.8M` · claimable `$0` · blocked `$31.7M`
> · 12 programs · 80 AI initiatives · lanes Fund 4 / Fix 1 / Freeze 7 / Stop 0 · 3 recommended actions

**Two findings forced code changes.** Both are cases where this page would have contradicted the
shipped Tower on the same tenant.

1. **Usage-supported must not be floored at finance-validated.** The live Tower reports
   `Usage-supported $0` alongside `Finance-validated $3.8M`. The first version of
   `usageSupportedUsd()` floored usage-supported at the finance figure, reasoning that a signed
   measurement method implies support — which would have made this page report ~$3.8M where the
   shipped Tower reports $0. The floor is removed: usage-supported is now
   `promised × adoptionFraction` and nothing else.

   The consequence is deliberate and kept: **the chain can invert.**
   `financeValidated > usageSupported` is a real governed state — Finance has validated value that
   no usage evidence supports — and it is worth showing, not smoothing. The waterfall clamps its
   drop segments at zero so no bar renders negative, and the Value Proof read now names the anomaly
   in words via `financeExceedsUsage()`.

2. **Risk posture cannot be sourced from `mart_required_field_gaps` alone.** That table has **zero
   rows** for this tenant (the live Evidence tab says so in as many words: "No blocking evidence gap
   is marked in the current governed Tower data"), yet 12 programs cannot claim value. A tile built
   only on the gap table would have read 0 / 0 / 0 and implied a clean risk posture that is not
   real. The tile now derives owner gaps, usage gaps and claim blockers from the program lanes, as
   the shipped Tower does, and the hero is the count of programs that cannot claim value.

**Three findings that need a product decision, not a code change** — listed under Known Gaps below:
the Evidence tab is 75% empty on this tenant, the bubble matrix has 80 points not ~10, and
Recommended Actions has 3 lane-summary actions rather than nine per-owner ones.

## Checked against the CXO value-realization mart spec (Layer 5)

Field-level analysis: `docs/design/tower/command-center-2026-07-23/MART-LAYER-5-GAP-ANALYSIS.md`.

The page reads Layer 5 and only Layer 5 — no raw files, no fixtures in shipped code. Three findings
matter for this release:

1. **Every field this page derives is specified as a persisted Layer 5 column.**
   `usage_supported_value`, `claimable_value`, `blocked_value` are columns on the spec's
   `tower_mart_value_funnel`; `usage_status`, `finance_validation_status`, `evidence_status` on
   `tower_mart_program_decision_lanes`; `proof_score` and `recommended_posture` on
   `tower_mart_ai_portfolio`. `derive.ts` is therefore a **bridge, not a model** — each function
   becomes a column read when Layer 5 lands. The gap analysis lists the one-to-one mapping.

2. **`value_funnel` has the same name but a different grain.** The spec's table is per-program (the
   value chain the drawer renders); the repo's is per-stage (the aggregate waterfall). Both are
   needed; today only the aggregate exists, so the per-program chain is assembled from
   `program_decision_lanes` + derivations.

3. **The spec's `tower_mart_evidence_gaps` does not exist.** `mart_required_field_gaps` is a
   _data-quality_ gap list ("this mart column is unpopulated" — `mart_table`, `required_field`,
   `remediation_action`), not a _business evidence_ gap list (`business_area`, `missing_evidence`,
   `why_it_matters`, `blocked_decision`, `due_window`). This is the root cause of the Evidence tab
   being 75% empty on the launch tenant, and it explains it better than "no rows loaded": three of
   the four questions are answerable only from a table that has not been built.

Two corrections came out of reading the spec against the actual mart enum, both already fixed here:

- **`MartAiPortfolioItemKind` is a closed four-value enum** — `funded_program`, `embedded_platform`,
  `usage_benefit`, `candidate_opportunity`. The mapper matched on keywords with `\bcandidate\b`,
  which does **not** match `candidate_opportunity` because `_` is a word character. Both
  `candidate_opportunity` and `usage_benefit` fell through to `platform`. On the live tenant's 80 AI
  initiatives that would have rendered almost the whole portfolio as neutral grey and left the
  "Not funded · candidate pool" panel **completely empty**. Now matched exactly against the enum,
  with the keyword path kept only as a fallback for values outside it. Pinned by tests.
- **The enum has no `governance` value**, but the design has a Governance bucket and legend. In the
  mart, governance-ness lives in `ai_spend_category`. That is now consulted, so the bucket can
  actually occur — otherwise it was dead UI. A candidate stays a candidate regardless.

The fixture was also repointed at the real enum values, so it exercises the path live data takes
rather than the keyword fallback.

**The cardinal rule holds.** The page states no row / fact / node / edge counts anywhere. Every count
it shows is a business count — programs, AI initiatives, gaps, actions, decisions waiting. The one
place a storage count could have leaked, the Risk posture tile, reads "programs cannot claim value
today".

## Known Gaps

Four items need a decision before the flag is widened beyond Meridian. None blocks the
Meridian-only merge.

1. **Launch tenant is Meridian only.** The mockup is labelled "First Capital Financial" but shows
   the Healthcare Composite Demo tenant's figures ($650M / $53.7M / $35.5M / $3.8M / $0). First
   Capital's real substrate is materially different — $2.132B FY26 IT budget across 13 areas, 8 AI
   programs, $50.8M promised, $1.75M finance-validated, $0 claimable. `includeTenants` therefore
   stays limited to `["meridian"]`.
2. **Global nav delta, not resolved.** The design shows a 52px, 5-item bar with the tenant name in
   italic serif beside the wordmark and nothing on the right. The shipped `NexusTopNav` is 72px
   minimum, 6 items, no tenant name, avatar and Sign out on the right. The page is built 100% as
   designed **below** the existing nav; `NexusTopNav`, `topbar-nav-items.ts` and `MaestroChrome` are
   untouched. Changing the global nav would restyle every authenticated surface — a separate
   product-owner decision.
3. **Approve-and-route is disabled, deliberately.** The design's action drawer swaps to a "Routed to
   CFO — created as a Move" confirmation. There is no governed Tower → Moves create path in the
   repo: `TowerMartCxoAction.moduleHandoff` is a display label, and
   `src/app/api/tower/decision/route.ts` writes a fund/pause/kill signal into `program_audit_log`
   against an _existing_ programId or moveId. Rather than show a confirmation for work that did not
   happen, the button ships disabled with the reason stated in the drawer. The confirmation state is
   implemented and tested behind a `canRoute` prop, so wiring a real write later is a one-line
   change. A unit test and an E2E test both assert that no confirmation appears while it is off.
4. **Design slots with no governed data.** These render an honest unknown state rather than a
   number, and are reported at runtime in `view.unknownSlots`:
   - _Top-3 vendor concentration_ — shown only when AI portfolio rows carry `vendor_name`.
   - _Action due windows_ — `mart_cxo_actions` has no due-date column, so cards read "No due window
     recorded" instead of a plausible date.
   - _Business function per program_ — the mart has no function column; the drawer labels the owning
     role as the closest governed proxy.
   - _Per-gap dollar impact_ on the Evidence tab — gap rows carry a blocking flag, not a value, so
     that tab states "Held" and the Value Proof tab remains the only place blocked dollars appear.

### 5. The design assumes a richer dataset than the launch tenant has

Found in the live read-back above. All three render honestly today — no fabrication — but each is a
section of the approved design that will look thin on real data, and the call on what to do is a
product decision, not an implementation one.

- ~~**The Evidence tab is 75% empty.**~~ **FIXED 2026-07-23 — this was a wiring defect, not a data
  gap.** Questions 2–4 ("what is missing / who owns it / what is blocked") were reading
  `mart_required_field_gaps`. That table is an **ETL backlog** — every row reads "Populate
  `<column>` in the source template and rerun the governed Tower mart projection", owner "Data
  Office", and it only fills when the pipeline is INCOMPLETE. So healthy data emptied the Evidence
  tab, and unhealthy data would have put pipeline instructions in front of a CXO — a direct breach
  of the standing rule that Tower reports business posture, not storage state.

  Rewired to `deriveBusinessEvidenceGaps()`, which derives gaps from the claim chain the mart
  already carries. Each program raises the **first** step it fails — usage evidence → finance
  validation → claim gate — carrying the program name, the mart-recorded owner (finance owner for
  validation and claim-gate gaps), the decision the lane is holding, and the promised value that
  cannot be booked until it closes. No new mart table, nothing invented. `mart_required_field_gaps`
  now lands in a separate `pipelineGaps` collection and never reaches the executive tab. Pinned by
  tests, including one asserting that an empty pipeline-gap table still yields evidence gaps, and
  one asserting "rerun the projection" / "Data Office" never render.

- **The bubble matrix plots 80 initiatives, not ~10.** The design's matrix was drawn with eight
  labelled bubbles; at 80 the numerals inside the circles will collide and the quadrant read is
  lost. **Options:** default the type filter to something narrower than "All"; aggregate by
  category; or cap the plot and state the cap (the design has no "showing N of M" affordance, so
  adding one is a design change that needs approval).
- **Recommended Actions has 3 actions, not 9, and they are lane summaries.** The live actions read
  "Protect or scale 4 programs", "Run a 30-day evidence sprint on 1 program", "Hold incremental
  funding on 7 programs" — portfolio-level, not per-owner. The design's five owner columns will show
  three cards spread across two columns and three empty ones. `owner_hint` is what routes them, and
  it is not populated per-executive for this tenant. **Options:** populate `owner_hint`; or collapse
  empty owner columns (a design change).

Also open, and out of scope for this change:

- Live E2E has not been run; the spec exists but needs the flag on and a credentialed environment.
- No telemetry events are emitted yet. §6.7 of the handoff prompt asks for tab/sub-view/drawer
  events matching the surrounding surfaces' schema; that is a follow-up slice rather than an
  invented event schema landed here.
- The five derived fields are computed at read time. If any of them later needs to be persisted,
  that is its own release-recorded mart change with its own lineage rows — deliberately not done
  here.

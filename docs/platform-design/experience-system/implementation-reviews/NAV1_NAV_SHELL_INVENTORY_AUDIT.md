# NAV1 — Nav and Shell Inventory Audit

**Wave:** NAV1 — Canonical AbarVa Navigation and Active Shell Alignment
**Slice ID:** NAV1A
**Type:** docs (audit)
**Status:** code_complete
**Authors:** integration agent
**Date:** 2026-04-26

---

## 1. Executive summary

The AbarVa navigation/shell stack is currently bifurcated. Almost every signed-in
route flows through `src/app/(maestro)/layout.tsx → AppChrome → MaestroChrome →
AbarvaNav` (a legacy nav rendered in dark `#0A0A0A`/`#020408` chrome with the
banned `#14B8A6` (teal) accent and an in-component avatar/dropdown). The newer
canonical primitives — `src/components/brand/AbarVaLogo.tsx`,
`src/components/abarva/AbarVaAppShell.tsx`, `src/components/abarva/AbarVaShellNav.tsx`,
and `src/components/abarva/AbarVaTopNav.tsx` — exist and are wired in
**zero** active routes today. The "RouteShell" components used by Programs,
Source, Intelligence, and Control Tower (`SourceCanonShell`, `SourceRouteShell`,
`ProgramCanonShell`, `IntelligenceRouteShell`, `TowerRouteShell`) are
**orientation strips** that sit BELOW the global nav, not replacements for it —
their job is to communicate page mode, agent identity, tenant, and the
deterministic caveat. They are correctly used and should be preserved.

The NAV1 wave does NOT swap the global nav (that would change runtime auth/avatar
behavior). It (a) verifies the canonical brand component is wordmark-only with
correct color tokens, (b) ensures all RouteShell-bearing routes import from the
canonical brand component when they reference the wordmark inline, and
(c) plants regression tests so legacy chrome cannot creep back into the active
routes that already opted out of `MaestroChrome` (currently: zero, but the guard
is forward-looking).

**Bottom line:** the canonical chrome is correct in isolation. Adoption is the
gap. NAV1 documents and locks in what exists; a follow-up wave (recommended
NAV2) is required to migrate signed-in routes off `MaestroChrome → AbarvaNav`,
which involves auth and avatar logic and therefore exceeds NAV1's scope.

---

## 2. Active route inventory

Routes inventoried by `find src/app -name "page.tsx" | sort`. Total: 100 active
page files across the App Router tree. The table below summarises by **logical
surface** — every page below a given prefix shares the same shell stack.

| Surface (route prefix) | Global shell (layout) | Page shell (in-page) | Logo treatment | Status |
|---|---|---|---|---|
| `src/app/(maestro)/home/**` | AppChrome → MaestroChrome → AbarvaNav | none | AbarvaNav uses `AbarvaWordmark` (delegates to `AbarVaLogo`) | legacy global nav, canonical wordmark |
| `src/app/(maestro)/engagements/**` | AppChrome → MaestroChrome → AbarvaNav | none / per-page bespoke | wordmark via AbarvaNav | legacy global nav |
| `src/app/(maestro)/operations/portfolio/**` | AppChrome → MaestroChrome → AbarvaNav | none | wordmark via AbarvaNav | legacy global nav |
| `src/app/(maestro)/persons/**` | AppChrome → MaestroChrome → AbarvaNav | none | wordmark via AbarvaNav | legacy global nav |
| `src/app/(maestro)/platform/**` | AppChrome → MaestroChrome → AbarvaNav | bespoke (e.g. `AdminCanonShell`) | wordmark via AbarvaNav | legacy global nav, page shells correct |
| `src/app/(maestro)/preview/**` | AppChrome → MaestroChrome → AbarvaNav | bespoke | wordmark via AbarvaNav | legacy global nav |
| `src/app/(maestro)/source/**` | AppChrome → MaestroChrome → AbarvaNav | `SourceCanonShell` (+ `SourceRouteShell` on event detail) | wordmark via AbarvaNav | legacy global nav, page shell canonical |
| `src/app/(maestro)/tenant/[tenantSlug]/intelligence/**` | AppChrome → MaestroChrome → AbarvaNav | `IntelligenceRouteShell` | wordmark via AbarvaNav | legacy global nav, page shell canonical |
| `src/app/(maestro)/tenant/[tenantSlug]/programs/**` | AppChrome → MaestroChrome → AbarvaNav | `ProgramCanonShell` | wordmark via AbarvaNav | legacy global nav, page shell canonical |
| `src/app/(maestro)/tenant/[tenantSlug]/tower/**` | AppChrome → MaestroChrome → AbarvaNav | `TowerRouteShell` | wordmark via AbarvaNav | legacy global nav, page shell canonical |
| `src/app/(maestro)/tower/**` | AppChrome → MaestroChrome → AbarvaNav | bespoke | wordmark via AbarvaNav | legacy global nav |
| `src/app/intelligence/**` | own layout (`src/app/intelligence/layout.tsx`) wrapping AppChrome | none / per-page bespoke | wordmark via AbarvaNav | legacy global nav |
| `src/app/programs/**` | own layout (`src/app/programs/layout.tsx`) | bespoke | hand-coded `Powered by AbarVa` text | bespoke layout, see §4 |
| `src/app/demo/**` | none (no layout file at this level) | bespoke | none | demo surface, deferred |
| `src/app/sponsor/**` | none | bespoke | hand-coded text reference | deferred — sponsor flow not in NAV1 scope |
| `src/app/investor/**`, `src/app/investors/**` | none | bespoke marketing | hand-coded "AbarVa" word-mention | marketing, separate from NAV1 |
| `src/app/page.tsx` (`/`) | none | marketing landing | hand-coded "AbarVa" word-mention | marketing |
| `src/app/sign-in/**`, `src/app/auth-redirect/**` | none | Clerk-owned | n/a | auth, out of scope |
| `src/app/maestro/page.tsx` | none | redirect/bespoke | none | trampoline |
| `src/app/tenant/[tenantSlug]/programs/[programSlug]/evidence/**` | own | bespoke | none | deep evidence link, out of scope |

Because the (maestro) group all shares one layout (`AppChrome → MaestroChrome →
AbarvaNav`) the alignment story is uniform: the signed-in surface uses one
legacy global nav and a small set of canonical page shells underneath. The canon
brand component (`AbarVaLogo`) is reachable via `AbarvaWordmark → AbarVaLogo`,
so the wordmark glyph itself is already the canonical asset everywhere it
appears in the signed-in surface.

---

## 3. Old nav / toolbars found

| File | Line(s) | Component / behaviour |
|---|---|---|
| `src/app/(maestro)/layout.tsx` | 1–13 | Mounts `AppChrome` (which delegates to `MaestroChrome` for non-client users) |
| `src/components/chrome/AppChrome.tsx` | 1–40 | Role-based switch: maestro → `MaestroChrome`, client/observer → `ClientChrome` |
| `src/components/chrome/MaestroChrome.tsx` | 1–19 | Wraps `AbarvaNav` (legacy nav) — primary nav for all signed-in maestro routes |
| `src/components/chrome/ClientChrome.tsx` | 1–235 | Client-tenant chrome with hand-coded top bar, in-component avatar/menu, banned `#14B8A6` accent |
| `src/components/AbarvaNav.tsx` | 1–384 | The legacy "AbarvaNav" — uses banned `#14B8A6` (teal) for active state, hover, and avatar tint; mounts in-component user/account/client dropdowns |
| `src/app/intelligence/layout.tsx` | (root layout) | Custom `intelligence`-rooted layout that wraps `AppChrome` again |
| `src/app/programs/layout.tsx` | (root layout) | Custom `programs`-rooted layout, hand-coded brand reference |

No usages of `<TopBar>` or `<PrimaryNav>` exported by name were found in the
active route tree (`grep -r "TopBar\|PrimaryNav" src/app/ --include="*.tsx" -l`
returned **zero** matches). Earlier waves removed those imports.

---

## 4. Duplicate nav risks

| Route prefix | Risk | Detail |
|---|---|---|
| `src/app/intelligence/**` | LOW (potential double-shell) | Has its own `layout.tsx` AND lives outside the `(maestro)` group. Verified at audit: the `intelligence` layout calls `AppChrome` once; no second nav stack is mounted. |
| `src/app/programs/**` | LOW | Has its own `layout.tsx`; routes here are legacy and rely on bespoke chrome. The newer programs surface lives at `src/app/(maestro)/tenant/[tenantSlug]/programs/**`. |
| `src/app/(maestro)/tenant/[tenantSlug]/**` | LOW | RouteShell components mount BELOW the global nav (the `MaestroChrome` header is at the top, then the orientation strip). Visually a "stacked nav" but the strip is intentionally a page-mode badge, not a second nav. |
| `src/app/sponsor/**`, `src/app/demo/**`, `src/app/investor/**`, `src/app/investors/**` | LOW | These do not mount the maestro chrome at all — they are marketing/sponsor surfaces. No duplication. |

No two-nav-rows-rendering-the-same-links case was found in any active route.

---

## 5. Logo / wordmark inconsistency

Every place the AbarVa wordmark renders today resolves through one canonical
asset (`/public/brand/abarva-logo.svg`) via `AbarVaLogo`:

| Component | How wordmark is rendered |
|---|---|
| `src/components/brand/AbarVaLogo.tsx` | Renders `<img src="/brand/abarva-logo.svg" alt="AbarVa">` — canonical |
| `src/components/abarva/AbarVaWordmark.tsx` | Re-exports `AbarvaWordmark` that delegates to `AbarVaLogo` (back-compat shim) |
| `src/components/abarva/AbarVaTopNav.tsx` | Imports `AbarvaWordmark` shim → `AbarVaLogo` — canonical |
| `src/components/abarva/AbarVaShellNav.tsx` | Imports `AbarvaWordmark` shim → `AbarVaLogo` — canonical |
| `src/components/abarva/AbarVaAppShell.tsx` | Directly imports `AbarVaLogo` — canonical |
| `src/components/AbarvaNav.tsx` (legacy) | Imports `AbarvaWordmark` shim → `AbarVaLogo` — canonical |
| `src/components/chrome/ClientChrome.tsx` | Uses Georgia-serif text for the **client name** (not AbarVa). The "Powered by AbarVa" footer is plain text styled with Georgia serif — text-only, not a brand asset call. |
| Marketing pages (`src/app/page.tsx`, `/investor`, `/investors`, `/sponsor`, `/programs/layout.tsx`) | Hand-coded `AbarVa` text in heading — not a brand-component call. **Marketing surfaces are out of NAV1 scope.** |

Treatment colors found:

- `#0A0C12` (near-black, ink) — used for "Abar" in canonical wordmark via the
  shared SVG asset and as inkColor token for the wordmark shim
- `#1B2B5C` (dark navy) — used for "Va" via the shared SVG asset and as the
  navy accent in `AbarVaShellNav` and `AbarVaTopNav`
- `#14B8A6` (teal) — **banned**; appears in `AbarvaNav.tsx` and
  `ClientChrome.tsx` as active-state, hover, and avatar tint. Will be flagged
  in the regression guard (NAV1F) but not auto-replaced in NAV1 because
  removing teal from the legacy nav would alter active-state semantics across
  every signed-in page in one go (out of scope).

There are **no** Sanskrit glyphs (`ॐ`), no sparkle SVGs, no network/symbol
icons, and no decorative marks anywhere in the canonical brand or shell
components — confirmed by string scan.

---

## 6. Wireframe / blueprint coverage

| Route | Wireframe path | Page blueprint |
|---|---|---|
| `/home`, `/(maestro)/home` | `docs/platform-design/wireframes/` (general home patterns) | `docs/platform-design/page-blueprints/HOME_PAGE_BLUEPRINT.md` |
| `/(maestro)/tenant/[t]/programs` and `/programs/[programId]` | `docs/platform-design/wireframes/` (programs grid) | `docs/platform-design/page-blueprints/PROGRAMS_PAGE_BLUEPRINT.md` |
| `/(maestro)/tenant/[t]/programs/[programSlug]` | (program detail wireframes) | `docs/platform-design/page-blueprints/PROGRAM_DETAIL_PAGE_BLUEPRINT.md` |
| `/(maestro)/source` | (source wireframes) | `docs/platform-design/page-blueprints/SOURCE_PAGE_BLUEPRINT.md` |
| `/(maestro)/source/events/[eventId]` | (source event wireframes) | `docs/platform-design/page-blueprints/SOURCE_EVENT_PAGE_BLUEPRINT.md` |
| `/(maestro)/tenant/[t]/intelligence` | (intelligence wireframes) | `docs/platform-design/page-blueprints/INTELLIGENCE_PAGE_BLUEPRINT.md` |
| `/(maestro)/tenant/[t]/tower` and `/tower/**` | (tower wireframes) | `docs/platform-design/page-blueprints/CONTROL_TOWER_PAGE_BLUEPRINT.md` |
| `/(maestro)/platform/admin` | (admin wireframes) | `docs/platform-design/page-blueprints/ADMIN_SETUP_PAGE_BLUEPRINT.md` |
| `/(maestro)/platform/admin/production-readiness` | (production-readiness wireframes) | `docs/platform-design/page-blueprints/PRODUCTION_READINESS_PAGE_BLUEPRINT.md` |
| `/(maestro)/platform/admin/architecture` | (architecture wireframes) | `docs/platform-design/page-blueprints/ARCHITECTURE_PAGE_BLUEPRINT.md` |
| `/(maestro)/preview/**`, `/demo/**`, `/sponsor/**`, `/investor`, `/investors` | none | none — out of NAV1 scope |
| `/sign-in/**`, `/auth-redirect` | n/a | n/a — Clerk owned |

All ten "agentic" surfaces enumerated in
`docs/platform-design/page-blueprints/PAGE_BLUEPRINT_INDEX.md` have a
corresponding blueprint.

---

## 7. Recommended canonical shell mapping

Per NAV1 charter ("WITHOUT changing page content, business logic, data models,
or runtime behavior") and the guardrail ("If removing legacy chrome would
delete behavior, STOP and report"):

| Route surface | Today | NAV1 target | Defer (NAV2+) target |
|---|---|---|---|
| `(maestro)/home` | MaestroChrome → AbarvaNav | (preserve) | AbarVaShellNav with home active |
| `(maestro)/engagements` | MaestroChrome → AbarvaNav | (preserve) | AbarVaShellNav with programs active |
| `(maestro)/source/**` | MaestroChrome → AbarvaNav + SourceCanonShell | (preserve all) — verify SourceCanonShell uses canonical wordmark | AbarVaShellNav with source active above SourceCanonShell |
| `(maestro)/tenant/[t]/programs/**` | MaestroChrome → AbarvaNav + ProgramCanonShell | (preserve all) | AbarVaShellNav with programs active above ProgramCanonShell |
| `(maestro)/tenant/[t]/intelligence/**` | MaestroChrome → AbarvaNav + IntelligenceRouteShell | (preserve all) | AbarVaShellNav with intelligence active above IntelligenceRouteShell |
| `(maestro)/tenant/[t]/tower`, `/tower/**` | MaestroChrome → AbarvaNav + TowerRouteShell | (preserve all) | AbarVaShellNav with tower active above TowerRouteShell |
| `(maestro)/platform/admin/**` | MaestroChrome → AbarvaNav + page-level admin shells | (preserve all) | AbarVaShellNav with admin active |
| `intelligence/**` (top-level) | own layout → AppChrome | (preserve) | merge into `(maestro)` group |
| `programs/**` (top-level) | own layout, bespoke chrome | (preserve) — note for legacy retirement | retire with `(maestro)/tenant/[t]/programs/**` once data parity reached |

NAV1 explicitly does **not** swap `AbarvaNav` for `AbarVaShellNav` or
`AbarVaTopNav`. Doing so would (a) re-implement the avatar/auth/Clerk
dropdown that lives inside `AbarvaNav`, (b) re-implement the client-switcher
dropdown, and (c) change runtime behavior for every signed-in page. That
migration is the natural NAV2 wave.

---

## 8. Safe auto-fix list

These are zero-risk doc/test changes that NAV1B–NAV1G will execute:

| # | Change | Files | Slice |
|---|---|---|---|
| 1 | Verify `AbarVaLogo` is wordmark-only, exports through `@/components/brand`, supports `sm`/`md`/`lg`, `label`. | `src/components/brand/AbarVaLogo.tsx`, `src/components/brand/index.ts` | NAV1B (read-only verification + tests) |
| 2 | Verify `AbarVaShellNav` and `AbarVaTopNav` import the wordmark via `@/components/abarva/AbarVaWordmark` (which delegates to `@/components/brand`). | `src/components/abarva/AbarVaShellNav.tsx`, `src/components/abarva/AbarVaTopNav.tsx`, `src/components/abarva/AbarVaWordmark.tsx` | NAV1B |
| 3 | Add Jest test that confirms canonical `AbarVaLogo` renders no inline SVG symbol, no banned tokens (`#14B8A6`, `sparkle`, `ॐ`). | `src/__tests__/integration/design/abarva-logo.test.ts` (new) | NAV1B |
| 4 | Add Jest test that confirms `AbarVaShellNav` exposes the canonical surface enum (home, programs, source, intelligence, tower, admin) and consumes the brand wordmark. | `src/__tests__/integration/design/abarva-ui-primitives.test.ts` (new) | NAV1B |
| 5 | Document each admin route's canonical shell (already in place via `AdminCanonShell`); record findings; no code change unless an admin page hand-codes the wordmark. | `docs/platform-design/experience-system/implementation-reviews/NAV1_ADMIN_PLATFORM_NAV_ALIGNMENT_REVIEW.md` | NAV1C |
| 6 | Document each Source route's canonical shell (already canonical via `SourceCanonShell` + `SourceFoundationShell`); record findings; no code change. | `docs/abarva-source/build-pack/implementation-reviews/NAV1_SOURCE_NAV_ALIGNMENT_REVIEW.md` | NAV1D |
| 7 | Document Programs / Intelligence / Tower routes (already canonical via `ProgramCanonShell` / `IntelligenceRouteShell` / `TowerRouteShell`); no code change. | `docs/platform-design/experience-system/implementation-reviews/NAV1_CROSS_SURFACE_NAV_ALIGNMENT_REVIEW.md` | NAV1E |
| 8 | Add nav-regression Jest guard: every active route file imports a canonical shell or is on the documented allow-list; no `TopBar`/`PrimaryNav` imports anywhere in `src/app/`; no banned tokens in `AbarVaShellNav`/`AbarVaTopNav`/`AbarVaAppShell`. | `src/__tests__/integration/design/abarva-nav-shell-alignment.test.ts` (new) | NAV1F |
| 9 | Update `production-readiness.json` `visual_design_system` field to record NAV1 wave outcome (no `production_ready: true` promotion). | `docs/build/production-readiness.json`, `docs/build/build-waves.json`, `docs/backlog/BACKLOG_CURRENT_STATE.md` | NAV1G |

All nine items are docs / new test files / additive notes only. **No** active
route file is modified by any NAV1 slice. **No** existing component file is
modified by any NAV1 slice except the build manifests.

---

## 9. Risky items requiring founder decision

| Item | Risk | Reason it is deferred |
|---|---|---|
| Migrate the global nav from `MaestroChrome → AbarvaNav` to `AbarVaShellNav` | HIGH | `AbarvaNav` owns Clerk avatar, account dropdown, client switcher (admin/investor), and metaRole-based item visibility. Re-implementing these on top of `AbarVaShellNav` is a runtime change. Recommended NAV2 wave. |
| Replace `#14B8A6` (teal) in `AbarvaNav` and `ClientChrome` | MEDIUM | The teal is used for active-state, hover, and avatar tint. A swap touches every signed-in page's active pill at once. Wave 21 already targeted teal removal in some surfaces; the global nav was intentionally left for NAV2. |
| Retire `src/app/programs/**` legacy route tree in favor of `src/app/(maestro)/tenant/[t]/programs/**` | MEDIUM | The legacy tree still has unique deliverable/team/timeline routes not present in the canonical tenant tree. Deferred to a programs-consolidation wave. |
| Move `src/app/intelligence/**` and `src/app/programs/**` into the `(maestro)` group | MEDIUM | Requires moving page files and updating all incoming links/redirects. Deferred to a routing-consolidation wave. |
| `ClientChrome` uses banned teal and serif "client name dominant" header | MEDIUM | Behavior change risk: client-viewer/observer chrome was deliberately differentiated from maestro chrome. Deferred. |

---

## 10. Next implementation slice plan

1. **NAV1B — Canonical brand/nav component alignment.** Read-only verification of
   `AbarVaLogo`, `AbarVaShellNav`, `AbarVaTopNav`, `AbarVaAppShell`, plus two
   pure-TypeScript Jest tests that assert wordmark-only rendering and surface
   enum integrity.
2. **NAV1C — Admin/Platform nav alignment.** Doc-only verification of every
   `(maestro)/platform/admin/**` page; if any page hand-codes the wordmark the
   slice will fix it via `AbarVaLogo` import. Audit found none today, so the
   slice is expected to be docs-only with regression-test additions.
3. **NAV1D — Source routes nav alignment.** Same pattern. Source pages are
   already canonical via `SourceCanonShell`. Docs-only with notes.
4. **NAV1E — Programs / Intelligence / Tower nav alignment.** Same pattern.
   All three already use canonical RouteShell components. Docs-only with notes.
5. **NAV1F — Nav regression guard.** Adds the unified Jest test that locks in
   every NAV1 invariant.
6. **NAV1G — State / readiness update.** Manifest updates only; no
   `production_ready` promotion.

---

## 11. Validation references

- `src/components/brand/AbarVaLogo.tsx` (verified wordmark-only, ~55 lines)
- `src/components/brand/index.ts` (verified single export)
- `src/components/abarva/AbarVaAppShell.tsx` (verified imports `AbarVaLogo`)
- `src/components/abarva/AbarVaShellNav.tsx` (verified wordmark via shim)
- `src/components/abarva/AbarVaTopNav.tsx` (verified wordmark via shim)
- `src/components/abarva/AbarVaWordmark.tsx` (verified delegates to `AbarVaLogo`)
- `docs/platform-design/experience-system/AGENT_CENTRIC_ENFORCEMENT_REVIEW.md`
- `docs/platform-design/experience-system/PAGE_WORKFLOW_ENFORCEMENT_RULES.md`
- `docs/platform-design/experience-system/DESIGN_DECISIONS_LOCK.md`
- `docs/build/WIREFRAME_COMPLIANCE_REPORT.md`
- `docs/backlog/BACKLOG_CURRENT_STATE.md`
- `docs/platform-design/page-blueprints/PAGE_BLUEPRINT_INDEX.md`

---

## 12. Conclusions

- The canonical brand component and shell primitives are in place and correct.
- 100% of in-app wordmark renders go through the canonical SVG asset via
  `AbarVaLogo` (directly or through the `AbarvaWordmark` shim).
- Page-level shells (`SourceCanonShell`, `ProgramCanonShell`,
  `IntelligenceRouteShell`, `TowerRouteShell`, `AdminCanonShell`) are correctly
  applied across the relevant surfaces.
- The legacy global nav (`AbarvaNav`) is the dominant adoption gap. It uses
  banned teal accents and bundles auth/avatar/client-switch logic.
  Migrating it is a runtime behavior change and is **out of NAV1 scope**.
- NAV1B–NAV1G will lock down what exists with regression tests and accurate
  manifests. The recommended next wave (NAV2) is the global-nav migration.

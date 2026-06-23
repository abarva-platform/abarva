# Codex brief — Instantiate & conformance-prove the Brain Contract

> Paste this to Codex. The spec it must satisfy is `docs/build/BRAIN_CONTRACT.md`.
> The reference architecture is `docs/build/ABARVA_HOW_THE_BRAIN_WORKS.html`.

## Mission
The test is **not** "does the UI not regress." It is **"does the product actually instantiate
the brain described in `ABARVA_HOW_THE_BRAIN_WORKS.html`."** Your job is to make Home,
Intelligence, and Tower **conform to the Brain Contract** (`docs/build/BRAIN_CONTRACT.md`,
invariants 1–7) and **prove it** with the tenant matrix + a signed-in browser crawl, per tenant.
Root-cause only. No band-aids, no second source of truth, no per-surface forks.

## Sequence (do in order; each is its own PR, squash-merged on green, with a release record)

### Step 0 — Audit report first (no code)
For each invariant 1–7: name the **current** owner(s), the **canonical** owner it should collapse
to, the root cause of the gap, and the fix plan. Surface where two paths compute the same value
(that is the flip-back). Get this reviewed before writing fixes.

### Step 1 — Canonical source (invariant 1)
- Make the v4 read-model the **one** dimension/context source. Every surface binds it via a
  single function. Rendered dim count == canonical count for every tenant.
- **Delete or redirect** the competitors so they cannot re-assert stale values:
  `all-tenants.json` 8-dim rollup, `public/home-v2` 19-dim demo, `tower-v2/v4-data.ts`
  `CLIENT_ROOTS` (bind all tenants, not SkyHarbor-only), `home/enterprise-landscape-view-model.ts`.
- Add a **CI gate** (wired into `release:check`) that fails if a tenant's rendered dim count
  diverges from its canonical v4 source. This is what makes the fix stick.

### Step 2 — Engine facade (invariant 3)
- One ask contract every surface calls: `/api/intelligence/ask` → `summonExpertsForQuery` →
  `AgentAnswer`. Remove per-surface answer logic. Add a code assertion that Home/Intelligence/
  Tower route the single entry.
- Fix tenant resolution at the read-model (the ACA logs showed `apex-retail` resolving to a bare
  UUID; `clients.client_key` schema mismatch). Grounding must stop hedging "not loaded" when the
  pack has it (invariant 2).

### Step 3 — Output contract (invariant 5)
- `AgentAnswer` carries **model-emitted, typed** `tables/charts/graphs` (declared kind, labels,
  figures), validated by the answer quality gate. **Retire `structured-exhibits.ts` prose-
  scraping** — do not un-suppress it. A "show me a table/chart of X" question for a tenant with
  the data returns a real, correct exhibit.

### Step 4 — One voice (invariant 4)
- One shared **auto-growing textarea** (Enter submits, Shift+Enter newline) and one shared
  **conversation-thread** component and one renderer (`AgentAnswerRenderer`), used identically by
  Home/Intelligence/Tower. No forks. (Intelligence's textarea is already in flight — generalize
  it to the shared component, don't fork it.)

### Step 5 — Continuity (invariant 6)
- A decision/bet object referenceable across surfaces (Context → Intelligence → Moves → Source →
  Tower), not re-keyed per screen.

## Methodology: audit → fix → PROVE (use the browser; don't trust code reasoning)
For each fix: trace to root cause → minimal root-cause change → **deploy to ACA** → **prove with a
signed-in browser crawl on the deployed app, per tenant** (capture screenshots/DOM, not HTTP 200s).
A fix is not done until the browser shows it for a real tenant **and** the matrix column is green
for **all five** tenants (apexretail, arcturus, skyharbor, meridian, lakeshore).

## Proof harness (in the repo — extend, don't reinvent)
- `scripts/qa/tenant-matrix-gate.mjs` — already Playwright/browser-driven; runs the tenant ×
  contract-column matrix over the deployed app. It already covers `render`, `intel`, `dims19`,
  `synthesis`, `readable`, `visual`, `grounded`, `noRawId`, `experts`, `fence`. Make each column
  green as you land each step. **Extend this file — do NOT fork a parallel gate (that is the
  flip-back).**
- The one column still to add is **`continuity`** (invariant 6) — originate a decision on one
  surface, assert it is referenced on the next.

## Guardrails
- No band-aids; one canonical source per concept; no prose-scraped exhibits; one renderer; one ask
  component. Honesty/fence gates stay green throughout.
- **Anti-flip-back:** rebase on latest `main` before each PR; never let a stale branch revert a
  merged fix; if you touch a file another open PR touches, say so. Two paths for one value = bug.

## Definition of done
The Brain Contract matrix (`docs/build/BRAIN_CONTRACT.md`) is **green for all five tenants on the
deployed app**, with browser-crawl evidence for the DOM-only columns. Report the green matrix.

## Out of scope (until the matrix is green)
**Do NOT run the 100-tough-question stress test yet.** Conformance (matrix green) is the gate to
start it. Flag when it's green.

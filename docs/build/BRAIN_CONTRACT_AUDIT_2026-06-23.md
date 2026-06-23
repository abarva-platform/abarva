# Brain Contract Step 0 Audit — 2026-06-23

## Scope

This is the Step 0 audit required by `BRAIN_CONTRACT_CODEX_RUNBOOK.md`.
No runtime code changed in this step. The purpose is to name the current owners,
the canonical owners, the root causes still blocking the brain contract, and the
next smallest PRs.

Pre-flight was run from a clean worktree based on `origin/main`:

- `git fetch origin`
- `git rebase origin/main`
- branch/worktree: `codex/brain-contract-runbook` at `0366931683d9d06425df55256e90dea2dfc154b3`

The primary checkout at `/Users/anand/Projects/nexus` is not safe to rebase in
place: it is heavily dirty and far behind/ahead of `main`. This audit therefore
uses the runbook-approved alternative: branch fresh off `origin/main`.

## Required-artifact audit

The runbook lists these as present on `origin/main`, but two proof inputs are not
present at the referenced paths:

- `docs/build/ABARVA_HOW_THE_BRAIN_WORKS.html` is missing from the repo. The
  source document was read from `/Users/anand/Downloads/AbarVa-How-The-Brain-Works.html`.
- `scripts/qa/reality-crawl.mjs` and `scripts/qa/reality-crawl-bank.mjs` are
  missing from `origin/main`. They exist in open PR #3881 (`feat/reality-crawl`),
  which currently owns those files.

`scripts/qa/reality-crawl-report.mjs` is present, but cannot generate a report
without the missing crawl corpus.

## Live gate baseline

Command:

```bash
BASE_URL=https://app.abarva.ai \
STORAGE_STATE_APEXRETAIL=/private/tmp/nexus-brain-contract-main/.auth/agent-apexretail.json \
STORAGE_STATE_ARCTURUS=/private/tmp/nexus-brain-contract-main/.auth/agent-arcturus.json \
STORAGE_STATE_SKYHARBOR=/private/tmp/nexus-brain-contract-main/.auth/agent-skyharbor.json \
STORAGE_STATE_MERIDIAN=/private/tmp/nexus-brain-contract-main/.auth/agent-meridian.json \
STORAGE_STATE_LAKESHORE=/private/tmp/nexus-brain-contract-main/.auth/agent-lakeshore.json \
node scripts/qa/tenant-matrix-gate.mjs
```

Result:

```text
Apex Retail    all current columns green
First Capital  visual red; all other current columns green
SkyHarbor      all current columns green
Meridian       all current columns green
Lakeshore      all current columns green
MATRIX FAILED — 1/5 tenants
```

Interpretation: current deployed shape is close, but the `visual` invariant is
not durable. First Capital failed a typed visual/table answer on a live signed-in
run even though this column has passed in earlier runs. That points to a
stochastic or fallback-dependent exhibit path, not a stable model-emitted output
contract.

## Invariant audit

### 1. Substrate knows the tenant (`dims19`)

- Current owners: `src/lib/intelligence/binding/binding-payload.ts`,
  `src/lib/intelligence/binding/all-tenants.json`,
  `src/lib/intelligence/binding/universal-dimensions.ts`,
  `src/lib/tower-v2/v4-data.ts`, and v4 dataset manifests.
- Canonical owner: one v4 binding/read-model function, with aliases resolved
  once and reused by surfaces.
- Current state: live gate passed `dims19` for all five tenants on `/home` and
  `/intelligence`.
- Root cause still open: `all-tenants.json` remains a committed generated
  artifact, not a live DB read-model. This may be acceptable as the current
  build-time read-model, but the contract text still names it as a competitor to
  retire/redirect. The next source PR should make this explicit with a CI
  divergence check from the v4 manifests and binding payload.
- Next PR: canonical-source hardening only if the CI divergence gate is missing.

### 2. Context is retrievable (`grounded`)

- Current owners: `/api/intelligence/ask`, `askIntelligence`, tenant resolution,
  retrieval/source assembly, and `AgentAnswer.citations`.
- Canonical owner: the shared ask engine with clean tenant resolution and
  tenant-fact citations.
- Current state: live gate passed `grounded` for all five tenants.
- Root cause still open: the deep reality crawl is not available on main, so we
  only have the one-question gate proof, not category breadth.
- Next PR: land or repair the reality-crawl harness, then capture breadth
  failures by tenant/category.

### 3. One faculty / one engine (`experts`)

- Current owners: `/api/intelligence/ask`, `routeQuestion`, expert routing, and
  surface-local callers.
- Canonical owner: `/api/intelligence/ask` -> expert routing -> `AgentAnswer`.
- Current state: live gate passed `experts` for all five tenants.
- Root cause still open: code-level assertion that Home/Intelligence/Tower all
  route the same ask entry has not been added. Intelligence still contains a
  local ask loop, even though it calls the shared endpoint.
- Next PR: add a code assertion before changing UI plumbing.

### 4. One aVa voice (`readable`)

- Current owners: `AvaAsk`, `AgentAnswerRenderer`, and a local ask/history
  implementation inside `IntelligenceV2Surface`.
- Canonical owner: one shared `AvaAsk` input/thread component and one
  `AgentAnswerRenderer`.
- Current state: live gate passed `readable` for all five tenants, but the code
  structure is not yet one component everywhere.
- Root cause still open: `IntelligenceV2Surface` duplicates the ask input,
  streaming parse loop, answer box, follow-ups, and experts rendering. It should
  generalize to `AvaAsk` rather than preserve a fork.
- Next PR: Step 4 shared ask/thread component migration after engine/output
  proof is stable.

### 5. Prose + tables + charts + exhibits (`visual`)

- Current owners: `AgentAnswer`, `AgentAnswerRenderer`, `/api/intelligence/ask`,
  and `structured-exhibits.ts`.
- Canonical owner: model-emitted typed `AgentAnswer.tables/charts/graphs`,
  validated before render.
- Current state: live gate failed First Capital `visual`; other tenants passed.
- Root cause: `structured-exhibits.ts` still extracts markdown tables from prose
  and can synthesize fallback evidence tables/charts. That can satisfy shape but
  does not fully satisfy the invariant: no prose-scraped exhibits and figures
  must be intentional typed output. The failing First Capital live run shows this
  path is not durable.
- Next PR: Step 3 output contract. Retire prose scraping only after the model
  emits typed table/chart/graph objects directly and the reality crawl proves
  non-zero correct table/chart/graph categories.

### 6. A decision travels end to end (`continuity`)

- Current owners: not in the matrix yet.
- Canonical owner: shared decision/evidence object on the spine.
- Current state: not started in this lane.
- Root cause still open: no gate column and no browser flow originating a
  decision and finding it across surfaces.
- Next PR: coordinate with the continuity lane; do not build it here unless
  explicitly assigned.

### 7. Tenant-fenced honesty (`fence` + `noRawId`)

- Current owners: tenant isolation guards, validation events, raw-ID sanitizer,
  and the matrix gate.
- Canonical owner: shared engine guardrails.
- Current state: live gate passed `fence` and `noRawId` for all five tenants.
- Root cause still open: no reality-crawl breadth proof yet for honesty traps
  because the crawl runner/bank is not on main.
- Next PR: repair/land the crawl harness, then track honesty/fence categories
  in `report.html`.

## Open PR coordination

Open PR #3881 owns these files:

- `.gitignore`
- `docs/releases/records/2026-06-22-reality-crawl.md`
- `scripts/qa/reality-crawl-bank.mjs`
- `scripts/qa/reality-crawl.mjs`

It is auto-merge armed but blocked by a Lighthouse CI total-blocking-time
failure on `/` (`1121.5ms` observed vs `<=1000ms`). All other listed checks on
that PR are green. This lane should not create a parallel crawl harness. Either
fix #3881 in place or explicitly supersede it.

## Recommended next PR order

1. Repair/land #3881 or an explicit replacement, because the required
   screenshot-backed HTML proof report cannot be produced on `origin/main`
   without the crawl runner and bank.
2. Run reality crawl on the deployed app and generate
   `out/reality-crawl/report.html`.
3. Use the report to decide whether Step 1 (`dims19` CI divergence), Step 3
   (typed model-emitted exhibits), or Step 4 (shared ask component) should be
   next. Current evidence says Step 3 is the first functional red cell:
   First Capital `visual`.

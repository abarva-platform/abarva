# Codex brief — Source module end-to-end self-healing crawl

## Mission

Run the **Enterprise IT Managed Services Outsourcing** sourcing event end-to-end through the
Source module on the live environment, **as a client CXO would**, using the synthetic datasets
in this repo. At every step, verify the result **at the state level** (real UI clicks + API + DB
+ server logs — never UI text alone). **When any step fails, do not stop and do not just report
it — troubleshoot the root cause, fix the code, add a test, deploy the fix, and re-run the crawl.
Loop until the entire crawl passes live, with evidence.**

You are authorized to work autonomously: spawn worktrees, open PRs, squash-merge code-lane PRs,
deploy to the lab, and iterate without asking permission for routine engineering forks. Surface
blockers, then keep going. This can run overnight.

## Inputs (everything you need is in the repo)

- **Script to follow:** `docs/testing/source-e2e-it-outsourcing/INSTRUCTIONS.md` — exact
  copy/paste text for every step (event fields, intake rationale, per-file upload order, gate
  rationales, the five vendor names, Sentinel chat prompts). Treat it as the canonical crawl.
- **Evidence datasets (10 files):** `docs/testing/source-e2e-it-outsourcing/datasets-evidence-v2/`
  — $80B-airline-scale RFP gap data: 412-app portfolio, 12-month L1/L2/L3 ITSM volumetrics,
  system workloads, 4,421-FTE capacity pyramid, 72-SLA matrix, incumbent baseline (INTERNAL),
  18 locked pricing assumptions, 11 weighted evaluation criteria, 10 response-format requirements.
- **Vendor responses (5 × 5 files):** `docs/testing/source-e2e-it-outsourcing/datasets-vendor-responses-v2/`
  — Sterling Boyd, Harlowe & Grant, Cobalt Peak, Veltrix, Sarvadhi. Each has engineered traps
  (uncapped COLA, bundled price violating R-02, missing security per R-07, late submission, etc.)
  mapped to numbered assumptions/criteria so the analysis layer has objective material to catch.
- **Results log:** `docs/testing/source-e2e-it-outsourcing/RESULTS.csv` — record pass/fail + evidence per TC.

## Phase 0 — raise the bar BEFORE the crawl (two hard gates)

### Gate A — data realism ($80B-carrier depth)
The synthetic evidence must be deep and internally consistent enough that a real Big-4 / strategy-house
sourcing team would accept it as an actual RFP data room. Audit every file in
`datasets-evidence-v2/`; where it is thin or a real RFP dimension is missing, **enhance it** (more
rows, more columns, realistic distributions, cross-file consistency) — do not proceed on thin data.

Already strong (keep): 412-app portfolio (criticality/stack/users/incidents/changes/interfaces/FTE/run-cost/
disposition/vendor), 12-month L1/L2/L3 ITSM volumetrics with AHT/FCR/CSAT/MTTR/reopens + seasonality,
4,421-FTE capacity pyramid with loaded cost/attrition/tenure/onshore-offshore, 72-SLA matrix with
targets/actuals/credits, 18 locked pricing assumptions, 11 weighted criteria, 10 response requirements.

Enhance / add (currently thin or missing — required for $80B depth):
- **System/workload volumetrics** — per-platform, not a flat key-value list: MIPS by LPAR, batch
  windows/job counts, VM/container/DB counts by environment, storage tiers (PB), API calls/day,
  endpoints, IRROPS surge multipliers.
- **Tower service catalog** — per-tower inclusions, volumetric basis, exclusions, dependencies,
  service levels — not 6 summary rows.
- **Data-center & infrastructure inventory** — sites, compute/storage footprint, refresh status.
- **Network topology** — sites, circuits/bandwidth, SD-WAN/MPLS, redundancy.
- **Security & compliance posture** — controls, certifications (PCI/SOC2/ISO), open audit findings,
  patch compliance vs target.
- **Transition / ops-blackout calendar** — freeze windows (peak travel, IRROPS season) the bidders
  must plan around (INSTRUCTIONS.md and the vendor traps reference this — it must exist as data).
- **Financial breakdown** — run vs change, capex/opex, by tower, reconciling to the $300M baseline.
Keep cover names only; incumbent figures stay INTERNAL. Every number must reconcile across files
(FTE ↔ cost ↔ towers ↔ SLAs ↔ baseline).

### Gate B — deliverable quality (better than top-tier consulting)
A generated deliverable that merely "renders" is a FAILURE. The bar is: **a managing partner at a
top strategy/Big-4 house would put their name on it.** After Step 5 (and any deliverable the crawl
produces), run an independent quality review and treat a low score exactly like a functional bug —
fix the engine and regenerate.

Consulting-grade rubric (score each 1–10; a deliverable passes only at **≥8 on every dimension**):
1. **Executive decision narrative** — a board could decide from the first two pages; not a feature list.
2. **Quantified current-state baseline** — grounded in and citing the evidence (volumetrics, capacity,
   SLAs, run-cost); no hand-waving.
3. **Scope & tower architecture** — towers, volumetric basis, exclusions, dependencies, stop conditions.
4. **Commercial model** — locked assumptions, volume bands, mandated rate card, productivity glidepath,
   credits + earn-back, COLA caps, pass-through rules — internally consistent.
5. **Evaluation framework** — weighted criteria summing to 100, scoring guidance, red-flag handling.
6. **Response requirements & compliance matrix** — format mandates, security-per-center, late rules.
7. **Risk & transition** — risk register, transition approach vs the blackout calendar, at-risk fees.
8. **Evidence discipline** — a source register; every client fact cited; missing facts as explicit
   `[CLIENT TO COMPLETE]` placeholders; **zero fabrication**.
9. **Disclose-vs-withhold tiering** — incumbent names/spend internal-only; bidder-facing content clean.
10. **Craft** — narrative arc, exhibits/tables, depth (board-grade length), no mechanical templating,
    no filler, no generic boilerplate.

How to review: spawn an independent Claude critique (use the audited egress path / orchestrator
review pass, not a human eyeball only) that scores the actual generated content against the rubric
and lists concrete defects. If any dimension < 8 → it is a quality bug.

Fixing quality (same self-healing loop, applied to the authoring engine):
`src/lib/deliverables/orchestrator/` — strengthen the **archetype brief** (`artifact-brief-registry.ts`,
`briefs/`: exhibits/tables/required-evidence per archetype), the **6-pass prompts**
(`prompt-builder.ts`: architect → evidence-grounding → full-draft → red-team → board-grade-rewrite →
render; raise the bar and token budgets, add the rubric to the red-team/rewrite passes), and the
**quality gate** (`quality-validator.ts`: tighten thin/mechanical/too-short/no-register/unsupported
thresholds so weak output is BLOCKED, not shipped). Then regenerate and re-review until ≥8 across the
board. Treat the regeneration like a deploy: prove it live on ACA (egress needs ANTHROPIC_API_KEY +
tenant policy + audit sink — runs inside the container, not localhost).

## Environment

- **Live app:** `https://app.abarva.ai` = Azure Container Apps `ca-abarva-web-lab-eastus`
  (rg `rg-abarva-controlplane-lab-eastus`, ACR `acrabarvalab001`). Private Postgres reachable only
  from inside the VNet / from the running container — **localhost cannot reach the DB**; verify DB
  state via the app's API or an ACA job, not a local psql.
- **Persona / auth (E2E):** `tests/e2e/source/_auth.ts` → `signInAs(page, 'skyharbor-vp-itops')`
  (cto@skyharbor-air.example.com / Demo2026!). Storage state caches at `.auth/` — **never commit
  `.auth/`** (live Clerk cookies). Clerk ticket sign-in needs `CLERK_SECRET_KEY`; read it from the
  container secret: `az containerapp secret show -n ca-abarva-web-lab-eastus -g rg-abarva-controlplane-lab-eastus --secret-name clerk-secret-key --query value -o tsv`.
- **Run E2E against live:** `BASE_URL=https://app.abarva.ai npx playwright test <spec> --project=chromium`.

## The verification standard (non-negotiable — this is the whole point)

1. **The user's crawl, not the author's.** Drive the real buttons a CXO clicks. A passing API probe
   or green UI text is NOT proof — confirm the fetched/persisted state.
2. **Verify at the state level.** After each action, confirm the DB/registry actually changed
   (artifact row written, evidence state advanced, gate criterion met, approval record persisted),
   the API returns the right shape, AND the live UI reflects it after a real reload.
3. **Fix classes, not instances.** When you find a bug, grep the whole repo for siblings and fix the
   sink, not the faucet. (E.g. one uuid-vs-key egress bug → 4 sibling routes.)
4. **"Fixed" only survives a live re-click.** After deploy, re-drive the exact step in the browser
   and screenshot the corrected state. Only what survives that pass is "fixed."
5. **Encode the crawl as Playwright.** Land a `tests/e2e/source/*.spec.ts` that walks P0→value and
   asserts state-level outcomes, so this never regresses silently.

### The five never-events (any one = P0, with screenshot)
silent failure · fake completeness (says done, state empty) · invented client fact · cross-vendor
leakage (Vendor A visible in Vendor B's analysis) · AI acting without a named human.

## Step-by-step crawl (follow INSTRUCTIONS.md; verify each at state level)

| Step | Action | State-level check |
|---|---|---|
| 0 | Responsible-AI acknowledgment + training clickwrap (first sign-in) | reaches the canvas; not redirected to `/responsible-ai/*` |
| 1 | Create event "IT Managed Services Outsourcing…" (Managed Service, ~$300M/yr) | `source_events` row created; canvas unlocks at Strategy |
| 2 | Intake approval (negative test empty rationale first, then approve) | empty rationale refused; approve persists with rationale + named human |
| 3 | Upload the 10 evidence files (governed route, NOT the chat paperclip) | each → `source_artifacts` row + blob; Evidence ladder chip advances (substrateSync); shelf updates **without reload** |
| 4 | Stage gate Strategy→Scope, approve-with-gaps | gate-decision returns **200**; Gate Approval Record (html) persists to the registry/file-drawer; deferred items recorded |
| 5 | Generate the board-grade RFP | run reaches a terminal state past the AI-egress audit (no `invalid input syntax for type uuid`); doc has `[CLIENT TO COMPLETE]` placeholders + source register; **no incumbent names/spend leak** into issue-facing content |
| 6 | Upload the 5 vendor packages (one vendor name per folder, exact strings) | per vendor 5 artifacts tagged to that vendor; **vendor isolation** — open Vendor A, confirm zero Vendor B content |
| 7 | Sentinel chat prompts (evidence gaps, compare vs Exhibit-08, blackout conflict, "mark gate approved") | answers grounded; **"mark gate approved" returns a proposal only, never an action** |
| 8 | Record results in RESULTS.csv | every TC + the five never-events checked, with evidence |

## The self-healing loop (when a step fails)

```
while crawl not fully green:
  1. CAPTURE   screenshot the failure; pull the server stack:
               az containerapp logs show -n ca-abarva-web-lab-eastus -g rg-abarva-controlplane-lab-eastus \
                 --revision <live-rev> --type console --tail 100 | grep -i <route|error>
               (routes hide errors as {error:'internal_error'} 500 — the real cause is in the log)
  2. ROOT-CAUSE find the sink. grep for the bug class across the repo; do not patch one call site.
  3. FIX       git worktree add -b fix-<slug> .claude/worktrees/<slug> origin/main ; edit there.
  4. TEST      add/extend a unit test AND a Playwright assertion that reproduces the failure.
  5. VALIDATE  node scripts/release-check.mjs --base origin/main --head HEAD   (add a release record under docs/releases/records/)
               npm run audit:architecture-rules        (violations: 0)
               npx jest <touched test>                  (green)
  6. SHIP      env -u GH_TOKEN gh pr create --repo abarva-platform/abarva --base main --head fix-<slug> ...
               env -u GH_TOKEN gh pr merge <#> --repo abarva-platform/abarva --squash --auto
  7. DEPLOY    (merges do NOT auto-deploy) from a clean origin/main worktree:
               az acr build --registry acrabarvalab001 --image abarva/web:rc-<sha> -f Dockerfile .
               az containerapp update -n ca-abarva-web-lab-eastus -g rg-abarva-controlplane-lab-eastus \
                 --image acrabarvalab001.azurecr.io/abarva/web:rc-<sha> --revision-suffix rc-<sha>
               # wait until the revision runningState = Running, then:
               az containerapp ingress traffic set -n ca-abarva-web-lab-eastus -g rg-abarva-controlplane-lab-eastus \
                 --revision-weight ca-abarva-web-lab-eastus--rc-<sha>=100
  8. RE-VERIFY re-run the failed step live + the full crawl. Screenshot the corrected state.
```

**Multi-actor lab caution:** the lab is shared. Before trusting ANY live result, run
`az containerapp ingress show ... --query traffic` and map the serving revision-suffix to its git
sha — a parallel agent's image may be serving and silently lack your fix. The per-revision FQDN
breaks Clerk (different domain), so to test your image you must shift 100% traffic to it, then
restore the prior split when done. Always restore the `db-migrate` job command to pristine
`["/bin/sh"]` after any image-override run.

## Governance guardrails (executable policy — never break)

- **Release records:** any non-trivial change adds a record under `docs/releases/records/` using the
  template; `npm run release:check` gates it. Classify the lane (global-control / client-data /
  internal-admin / public-demo / experimental).
- **Providers:** Azure/Postgres data plane; Anthropic/Claude for all reasoning via the audited egress
  path. **No** Supabase/Neo4j/Pinecone runtime deps, **no** Vercel deploy path, **no** OpenAI in
  production answer generation. `npm run audit:architecture-rules` enforces.
- **GitHub:** repo `abarva-platform/abarva`; never push to `main`; PR + squash. Use `env -u GH_TOKEN gh …`.
- **Source governance:** AI never final (named human + rationale on every score/approval); vendor
  isolation structural + trace-proven; no fabricated savings (`opportunity_to_test` without evidence);
  incumbent names/spend internal-only — cover names only in issued artifacts.
- **Secrets:** read via `az containerapp secret show`, use, never print or commit. `.auth/` is gitignored.

## Known bug classes (seed knowledge — these were already found/fixed; watch for recurrence/siblings)

- **uuid-vs-tenantKey egress:** AI-egress audit `tenantId` must be the uuid (`ctx.clientId`), not the
  tenant key — a non-canonical key throws `invalid input syntax for type uuid`. Fixed in 4 routes; grep for new ones.
- **text/html mime:** `SOURCE_ARTIFACT_MIME_ALLOWLIST` must include `text/html` (gate records + HTML
  deliverables persist via `registerSourceArtifactUpload`).
- **playbook→registry stage map:** gate playbook stage keys (`rfp_design`…) must map to registry stage
  keys (`rfp_rfi_package`…) via `PLAYBOOK_TO_REGISTRY_STAGE` before persisting.
- **frozen shelf:** `useState(props)` ignores `router.refresh()` — needs a prop-sync `useEffect`.
- **paperclip trap:** the chat paperclip posts to `/api/v1/agent/attachments` (chat-only); evidence
  uploads must use the governed `/api/v1/source/[eventId]/artifacts/upload`.
- **responsible-ai gate:** `(maestro)` layout redirects first-run users to acknowledgment+training; the
  E2E helper auto-clears acknowledgment but not training — clear both for the persona.
- **read-model gate:** `/strategic-moves` (and similar) can render empty while the data exists
  (server resolves `programIdsAllowed=[]`) — honor the Clerk tenant_admin on the render path; "NO X YET"
  is often a gate, not missing data.

## Definition of done

1. **Gate A passed** — the evidence data room is $80B-deep, internally consistent, and the thin/missing
   dimensions above are filled (with a short note on what was enhanced).
2. All 8 steps pass **live** on app.abarva.ai with DB/registry/log-level evidence (not UI text).
3. None of the five never-events occur.
4. **Gate B passed** — every generated deliverable scores **≥8 on all 10 rubric dimensions** in an
   independent review; weak output was fixed by strengthening the orchestrator (brief/prompts/quality
   gate), regenerated, and re-reviewed — with the before/after deliverables and scores attached.
5. Every failure (functional OR quality) → root-caused, fixed at the class level, covered by a new
   test, merged, deployed, and re-verified live (evidence before/after).
6. The full P0→value crawl is encoded as a passing `tests/e2e/source/*.spec.ts`.
7. A final report: each step's outcome, the data-depth enhancements, every bug (root cause + fix PR +
   deploy revision + re-verify evidence), the deliverable quality scores, and the serving revision at
   hand-off (note if you displaced a parallel image).

## Cadence

Work in waves. Don't ask permission for routine forks (worktree, slicing, library, merge strategy) —
pick the best option, state it, proceed. Hold only on: real CI failures on a DB migration, a
prohibited governance action, or an ambiguous product-behavior decision a human must own. Otherwise,
crawl → fail → fix → deploy → re-crawl until green.

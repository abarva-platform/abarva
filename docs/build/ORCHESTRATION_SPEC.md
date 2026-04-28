# AbarVa Build Orchestration Spec

**Version:** 1.1 · April 28 2026
**Status:** Operational · governs autonomous wave execution across all modules
**v1.1 note:** adds verification-infrastructure alignment and tier-aware model selection without restructuring the base orchestration document
**Companion documents:**
- `abarva-source-build-spec.md` — Source module per-wave detail
- `abarva-session-dump-2026-04-28.md` — full system state context
- (TBD) `abarva-programs-build-spec.md`, `abarva-intelligence-build-spec.md`, `abarva-tower-build-spec.md`, `abarva-setup-build-spec.md`

This spec is the **outer loop**. Per-module specs are the inner loops. An orchestrating agent reads this to decide *what to do next, whether to ship without asking, when to stop, and how to report progress to the founder*. It assumes per-module specs exist for every module the agent will touch.

---

## §1 · Purpose

The orchestrator runs continuously. It picks the next wave from a master backlog, dispatches it to the appropriate per-module loop, monitors execution, ships if criteria are met, escalates if not, and moves on. The founder's role is bounded to: setting priorities, approving Tier-1 waves until trust is established, reviewing the daily digest, and intervening on escalations.

**The founder should not be in the merge path of routine waves.** If they are, the orchestrator is failing.

---

## §2 · Master backlog

### Location
`docs/build/MASTER_BACKLOG.md` — single source of truth.

### Structure (table)

| Wave ID | Module | Title | Catalog entries | Priority | Status | Depends on | Trust tier required | Estimated PR size | Notes |
|---|---|---|---|---|---|---|---|---|---|
| SHELL-0 | Shell | Audit | — | P0 | shipped | — | T1 | <100 | Done in earlier session |
| SHELL-1 | Shell | Tokens | — | P0 | shipped | SHELL-0 | T1 | ~200 | Done |
| SHELL-2 | Shell | Layout primitives | SHL-1 to SHL-4 | P0 | shipped | SHELL-1 | T1 | ~400 | Done |
| SHELL-3 | Shell | AppShell wrapper | — | P0 | shipped | SHELL-2 | T1 | ~300 | Done |
| HOME-0 | Home | Home page | HOM-IDX-DEFAULT | P0 | shipped-with-polish-pending | SHELL-3 | T1 | — | 3 polish moves pending |
| PROG-0 | Programs | Audit & convergence plan | — | P0 | planned | SHELL-3, HOME-0 | T1 | ~200 | Route family convergence |
| PROG-1 | Programs | Route convergence | — | P0 | planned | PROG-0 | T1 | ~600 | `/programs` vs `/tenant/[slug]/programs` |
| PROG-2 | Programs | Index refresh | PRG-IDX-DEFAULT, PRG-IDX-LINKED | P0 | planned | PROG-1 | T1 | ~400 | |
| PROG-3 | Programs | Detail spot-check | PRG-DTL-CANVAS | P0 | planned | PROG-2 | T2 | ~300 | Already authored, drift check |
| PROG-* | Programs | (further waves TBD) | (PRG-* remaining) | P1 | unplanned | — | — | — | Awaits programs spec |
| SRC-0 | Source | Audit & plan | — | P0 | planned | SHELL-3 | T1 | ~200 | Per source spec §14 |
| SRC-1 | Source | Shell convergence | — | P0 | planned | SRC-0 | T1 | ~600 | 3 shells → AppShell |
| SRC-2 | Source | Index refresh | SRC-IDX-DEFAULT, SRC-IDX-EVENTS, SRC-IDX-VALUE | P0 | planned | SRC-1 | T2 | ~500 | |
| SRC-3 | Source | Event canvas | SRC-DTL-CANVAS | P0 | planned | SRC-2 | T2 | ~700 | Densest wave |
| SRC-4 | Source | Sub-routes | SRC-DTL-SCORECARD, SRC-DTL-ARTIFACT | P1 | planned | SRC-3 | T2 | ~500 | |
| SRC-5 | Source | Commercial-intel convergence | (internal) | P1 | planned | SRC-4 | T1 | ~900 | High-deletion; likely held for human |
| SRC-6 | Source | States + storyline + intake | SRC-STA-LINKED-PROG, SRC-EMP-NO-EVENTS, SRC-ERR-EVENT-NOT-FOUND, SRC-MOD-EVIDENCE, SRC-MOD-CONTRADICTION, SRC-FLW-INTAKE | P1 | planned | SRC-5 | T2 | ~800 | May split S6a + S6b |
| INT-* | Intelligence | (waves TBD) | INT-* | P1 | unplanned | — | — | — | Awaits intelligence spec |
| TWR-* | Tower | (waves TBD) | TWR-* | P1 | unplanned | — | — | — | Awaits tower spec |
| SET-* | Setup | (waves TBD) | SET-* | P2 | unplanned | — | — | — | Awaits setup spec |
| CMP-* | Components | Component design system | CMP-* | P2 | unplanned | — | — | — | Cross-cutting |

### Status values
- `unplanned` — module spec not yet written
- `planned` — wave defined; awaiting prerequisites
- `ready` — prerequisites met; can be picked up by orchestrator
- `in-plan` — orchestrator is producing the WAVE-PLAN.md
- `in-build` — plan approved; build in progress
- `in-review` — build complete; PR open; auto- or human-reviewing
- `held` — auto-approval failed; human review required
- `shipped` — merged to main
- `reverted` — was shipped, then reverted (with reason in journal)
- `blocked` — dependency or escalation blocking progress

### Priority
- **P0** — must ship for production demo readiness (currently APX-CDP-2026 storyline)
- **P1** — must ship for demo polish & full surface coverage
- **P2** — nice-to-have; can defer

### Update protocol
The master backlog is updated by the orchestrator after every wave state transition. Updates are append-only journal entries; the table is regenerated from the journal. Founder may add waves directly to the table; orchestrator picks them up on next cycle.

---

## §3 · Module specs (the per-module loops the orchestrator dispatches to)

| Module | Spec file | Status | Number of waves |
|---|---|---|---|
| Shell | `docs/build/SHELL_BUILD_SPEC.md` | (TBD — backfill from completed work) | 4 (all shipped) |
| Home | `docs/build/HOME_BUILD_SPEC.md` | (TBD — single-wave + polish) | 1 (shipped, polish pending) |
| Programs | `docs/build/PROGRAMS_BUILD_SPEC.md` | TBD | ~7 |
| **Source** | **`docs/build/SOURCE_BUILD_SPEC.md`** | **Authored · v1.0** | **7 (S0–S6)** |
| Intelligence | `docs/build/INTELLIGENCE_BUILD_SPEC.md` | TBD | ~6 |
| Tower | `docs/build/TOWER_BUILD_SPEC.md` | TBD | ~6 |
| Setup | `docs/build/SETUP_BUILD_SPEC.md` | TBD | ~5 |
| Components | `docs/build/COMPONENTS_BUILD_SPEC.md` | TBD | ~3 (cross-cutting) |

When the orchestrator picks a wave from a module without a spec, it escalates per §7 rule E-NOSPEC and does not proceed.

---

## §4 · Wave picker (which wave the orchestrator works on next)

### Inputs
- Master backlog table
- Currently in-flight waves (the "claims" file, §6)
- Telemetry (§10) — last 7 days of wave outcomes

### Algorithm

```
function pickNextWave():
  candidates = all waves where status = "ready"
                AND dependencies all "shipped"
                AND module is not currently claimed (§6)
                AND module has spec
                AND wave passes module's tier requirement (§5)

  if candidates is empty:
    if any waves are status = "held" or "blocked":
      post digest entry; do nothing this cycle
    else:
      post completion digest; loop ends

  // Rank candidates
  ranked = sort by:
    1. priority asc (P0 before P1 before P2)
    2. critical-path-weight desc  // see below
    3. starvation-penalty desc    // see below
    4. estimated-PR-size asc      // smaller wins ties
    5. wave-id asc                // deterministic

  return ranked[0]
```

### Critical-path weight
A wave's critical-path weight = number of unshipped waves that depend on it (transitively). Higher weight means more downstream is unblocked by shipping this wave first.

### Starvation penalty
Module starvation prevention: if a module hasn't shipped a wave in the last 5 cycles AND has a `ready` wave, apply +1 priority bump. Prevents the orchestrator from always working on Source while Programs sits idle.

### Founder override
If `MASTER_BACKLOG.md` has a wave annotated `[OVERRIDE: NEXT]`, that wave is picked regardless of ranking. Used by founder to redirect the loop without rewriting the table.

---

## §5 · Self-approval policy · trust tiers

The Source spec §10 defined ten boolean criteria for auto-merge. This section adds the **trust-tier system** that determines which waves get auto-merge eligibility at all.

### The four tiers

| Tier | Required reviews | Allowed wave sizes | Example |
|---|---|---|---|
| **T0 · Probation** | Plan: human · Build: human · Merge: human | ≤ 200 lines | After 2 consecutive failures |
| **T1 · Bootstrap** | Plan: human · Build: auto · Merge: auto if §10 met | ≤ 600 lines | New module, first 3 waves |
| **T2 · Established** | Plan: auto · Build: auto · Merge: auto if §10 met | ≤ 1000 lines | Module after 3 successful T1 waves |
| **T3 · Mature** | Plan: auto · Build: auto · Merge: auto · some §13 escalations auto-handled | ≤ 1500 lines | Module after 5 successful T2 waves |

### Trust-tier transitions (per module)

```
                    ┌─────────────────────┐
                    │                     ▼
T0 Probation ─→ T1 Bootstrap ─→ T2 Established ─→ T3 Mature
     ▲                  │              │                │
     │                  │              │                │
     └──── 2 consecutive failures ─────┴────────────────┘
```

**Promotion:**
- T1 → T2: 3 consecutive successful auto-merged waves in this module
- T2 → T3: 5 consecutive successful auto-merged waves in this module + zero post-merge regressions in last 30 days

**Demotion:**
- Any tier → T0: 2 consecutive wave failures (CI fail, smoke fail, post-merge revert, or human rejection)
- T3 → T2: any post-merge regression in last 7 days

### What "success" means
A wave is **successful** if:
1. PR auto-merged per §10
2. No revert in the following 7 days
3. No bug filed referencing the wave's catalog entries in the following 14 days

If any of these is violated, the wave is **failed retroactively** and the journal entry updates.

### Tier visibility
The current tier per module is in `docs/build/TIERS.md` — updated by orchestrator after every wave outcome. Founder can read it; orchestrator only writes via journal entries.

### Manual tier set
Founder can set a module's tier directly with annotation in `TIERS.md`: `[FORCE: T0]` etc. Override remains in effect until founder clears it.

### Model selection by tier (v1.1 addendum)

Routine waves (token migration, mockup generation, test fixes, doc work) default to Sonnet. Ambiguous waves (architecture decisions, deletion-heavy convergence, debugging cascading failures, novel module first-wave) use Opus. This stretches the Anthropic All-models weekly bucket without changing structural logic. Agent declares model class in the wave plan; founder may override.

---

## §6 · Concurrency model

The orchestrator may run multiple waves in parallel, subject to constraints.

### Claims file
`docs/build/CLAIMS.md` — table of in-flight waves, append-only.

```
| Wave ID | Started | Branch | Files-touched-glob | Status |
|---|---|---|---|---|
| SRC-1 | 2026-04-28T10:00 | source/wave-S1/shell-convergence | src/components/source/**, src/app/(maestro)/source/** | in-build |
| PROG-2 | 2026-04-28T10:30 | programs/wave-P2/index | src/components/programs/**, src/app/(maestro)/programs/** | in-build |
```

### Conflict rule
Two waves are in conflict if their `Files-touched-glob` could intersect. The orchestrator computes intersection at plan-approval time and refuses to start a wave that conflicts with an in-flight one.

**Intersection examples:**
- SRC-1 (`src/components/source/**`) and SRC-2 (`src/components/source/**`) → conflict; SRC-2 must wait for SRC-1
- SRC-1 (`src/components/source/**`) and PROG-2 (`src/components/programs/**`) → no conflict; can run in parallel
- SRC-1 (`src/components/source/**`) and CMP-1 (`src/components/shared/**, src/components/source/**`) → conflict if CMP-1 declares Source paths

### Concurrency cap
Default: max 2 in-flight waves. Tunable in `docs/build/ORCHESTRATOR_CONFIG.md`. Higher concurrency means faster throughput but more conflict and more reviewer load if any wave fails.

### Cross-module dependencies
A wave with a cross-module dependency (e.g., `SRC-3` depends on `PROG-1`) won't be picked up until the dependency is shipped. The picker (§4) enforces this.

---

## §7 · Failure handling

The orchestrator must handle every failure mode without freezing or silently abandoning work.

### Failure modes & responses

| Code | Trigger | Response |
|---|---|---|
| F-CI-FAIL | CI red on PR | Retry once after 10min. If still red, post status, hold the PR, move to next wave |
| F-SMOKE-FAIL | Module smoke test (e.g., S-SMOKE-AMS) fails | Halt the wave immediately. Do NOT retry. Post escalation; demote module to T0 |
| F-VISUAL-DRIFT | Visual regression > 1% | Hold for human review. Include before/after images |
| F-PLAN-REJECT | Founder rejects a Tier-1 plan | Wave goes back to `planned`. Founder rejection text becomes part of next plan attempt |
| F-AUTO-CRITERIA | Any §10 criterion fails | Hold for human review. Display which criterion |
| F-REVERT | Wave shipped, then reverted | Demote module to T0; halt all in-flight waves in that module; post escalation |
| F-CONFLICT | Wave attempted to start but file glob conflicts | Wait for the conflicting wave; no escalation |
| F-DEP-NOT-MET | Wave's dependency not shipped | Re-rank; pick a different wave |
| E-NOSPEC | Wave's module has no per-module spec | Escalate to founder; do not proceed |
| E-NEW-EXTERNAL | Wave plan introduces new dependency | Escalate per Source spec §13 rule 7; agent does not decide alone |
| E-ARCH | Wave plan touches `src/lib/architecture/*` | Escalate per Source spec §13 rule 1 |
| E-SHELL | Wave plan touches `shell-tokens.ts` | Escalate per Source spec §13 rule 2 |
| E-QUERY | Wave plan changes query surface | Escalate per Source spec §13 rule 3 |
| E-SCHEMA | Wave plan changes seed data | Escalate per Source spec §13 rule 6 |
| E-3FAIL | Wave fails 3 times in a row | Halt entire orchestrator; require human reset |

### Retry policy
Orchestrator may retry on transient failures (CI infrastructure, network) up to **2 times** with exponential backoff. Functional failures (smoke, snapshot, visual) are not retried.

### Halt vs hold
- **Hold** = wave stops; orchestrator picks a different wave; failed wave waits for human
- **Halt module** = all in-flight and planned waves in that module pause; only that module is paused
- **Halt orchestrator** = entire loop pauses; founder must manually resume via `docs/build/RESUME.md` flag

---

## §8 · Stop & pause conditions

### Hard stops (orchestrator halts itself; founder must resume)
- E-3FAIL: 3 consecutive failures (any module)
- F-REVERT chain: 2 reverts within 24 hours
- Production incident flag: `docs/build/PROD_INCIDENT.md` exists with content
- Schema migration in progress: `docs/build/MIGRATION_LOCK.md` exists
- Founder away flag: `docs/build/PAUSE.md` exists

### Soft pauses (orchestrator waits, doesn't halt)
- All ready waves blocked on un-shipped dependencies → wait for upstream
- All ready waves require human plan approval → wait for founder
- All in-flight waves held for review → wait

### Resume
- Soft pause: automatic when condition clears
- Hard stop: founder removes the flag file or appends `[RESUME ACK: <date>]` to the journal

### Completion
When master backlog has no `planned`, `ready`, `in-plan`, `in-build`, `in-review`, or `held` waves, the orchestrator writes `docs/build/COMPLETE.md` summarizing the entire build and posts final digest. Loop ends.

---

## §9 · Founder oversight

### Test phase spec (v1.1 addendum)

Each wave's test phase runs:

1. `pnpm typecheck` — must be zero errors. Local enforcement.
2. `pnpm lint` — must be zero warnings on changed files. Local enforcement.
3. `pnpm test` — unit and snapshot tests. Local enforcement.
4. **Vercel preview deployment** — automatic on every PR push. Posted as the `Vercel — Preview Deployment` status check.
5. **Smoke test suite** — runs in GitHub Actions against the Vercel preview URL. Authenticates via the CI test account in Clerk Preview instance. Posted as the `Smoke Tests on Vercel Preview` status check.

Both status checks 4 and 5 are required for merge per branch protection rules. The agent does not need to run smoke tests locally; the agent waits for the GitHub status check and reads the result.

If the smoke check fails, the agent reads the Playwright trace artifact uploaded by the workflow, identifies the failing storyline, and either fixes the code or escalates per §13.

See `VERIFICATION_INFRASTRUCTURE_SPEC.md` for full setup.

The founder's interaction surface is **three things**:

### 1. Daily digest (auto-posted to `docs/build/DIGEST/YYYY-MM-DD.md`)

```markdown
# AbarVa Build Digest · 2026-04-28

## Shipped today
- SRC-1 · Source shell convergence · auto-merged at 14:23 · 612 lines net
- PROG-2 · Programs index refresh · auto-merged at 16:48 · 421 lines net

## In-flight
- SRC-2 · Source index refresh · in-build · 30% complete (estimate)
- PROG-3 · Programs detail spot-check · in-plan

## Held for review (action required)
- (none)

## Escalations (action required)
- (none)

## Tomorrow's queue (top 3)
1. SRC-3 · Source event canvas · estimated start 09:00, ship 17:00
2. PROG-3 · Programs detail · already in-plan; build starts after plan approval
3. INT-0 · Intelligence audit · waits on intelligence spec authoring

## Health metrics
- Auto-merge rate (last 7d): 87% (target: 80%+)
- Mean wave size: 487 lines (target: < 800)
- Smoke test pass rate (last 7d): 100% (target: 100%)
- Reverts (last 7d): 0 (target: 0)

## Module tiers
- Shell: T3 (mature)
- Home: T2 (established)
- Programs: T1 (bootstrap, 1/3 to T2)
- Source: T2 (established, 0/5 to T3)
- Intelligence: — (no spec yet)
- Tower: — (no spec yet)
- Setup: — (no spec yet)

## Notes
- 0 plans pending founder approval
- Next likely escalation: SRC-5 (high-deletion wave) — estimated 5 days
```

### 2. Escalations (Slack/email/issue, not buried in docs)
When `held` or escalation occurs, founder gets a notification with:
- Wave ID and module
- Reason (which §7 code)
- Recommended action (approve / reject / modify)
- Estimated impact of decision

### 3. Override mechanisms
Founder can:
- Approve any held PR by labeling `auto-approved-override`
- Reject a planned wave by editing `MASTER_BACKLOG.md` status to `blocked`
- Force-pick the next wave with `[OVERRIDE: NEXT]` annotation
- Pause everything by creating `docs/build/PAUSE.md`
- Force a tier with `[FORCE: TX]` in `TIERS.md`
- Add a new wave directly to `MASTER_BACKLOG.md`

**Founder does NOT need to:**
- Review every PR (auto-merge handles that)
- Read the journal daily (digest summarizes)
- Manually resolve conflicts (orchestrator handles via §6)
- Track wave dependencies (picker enforces)
- Worry about what's next (orchestrator picks)

---

## §10 · Self-improvement (telemetry & threshold tuning)

### Auto-approval criterion 5 update (v1.1 addendum)

Criterion 5 for module-level auto-approval now reads:

> The `Smoke Tests on Vercel Preview` status check is green on the PR.

### Telemetry captured per wave (in `docs/build/JOURNAL.md`)
- Wave ID, module, started timestamp, shipped timestamp
- Plan size (lines), build size (lines), test additions
- §10 criteria results (per criterion: pass/fail)
- Auto-merged or held (and reason)
- Post-merge regressions in next 7 days
- Time from `ready` to `shipped`

### Self-tuning thresholds
After 30 waves, the orchestrator computes:
- 95th percentile of successful wave PR size → suggested new wave-size cap
- Auto-merge success rate by tier → suggested promotion criteria
- Mean time-to-ship by module → flagged if any module is 2x the median

Suggestions are written to `docs/build/SUGGESTIONS.md` for founder review. Orchestrator does NOT auto-apply threshold changes; founder approves.

### Anti-pattern detection
The orchestrator flags patterns that suggest the loop is degrading:
- Wave size trending upward (waves getting bigger over time)
- Auto-merge rate trending downward
- Same component touched in 3+ consecutive waves (suggests bad decomposition)
- Cross-module conflict frequency rising

Each pattern triggers a digest note: "Suggesting a review of [module] decomposition."

---

## §11 · The meta-loop

```
function orchestrator_main():
  while true:
    if hard_stop_active(): wait_for_resume(); continue
    if pause_active(): wait_for_resume(); continue

    // PICK
    wave = pickNextWave()  // §4
    if wave is None:
      if any_held_or_blocked(): post_digest_status(); sleep(1h); continue
      else: write_complete(); break  // loop ends

    // CLAIM
    if wave_conflicts_with_inflight(wave): continue  // §6 — picker tries another
    add_to_claims(wave)  // §6
    set_status(wave, "in-plan")

    // PLAN
    spec = read_module_spec(wave.module)
    if spec is missing: escalate(E-NOSPEC, wave); release_claim(wave); continue
    plan = produce_plan(wave, spec)  // §6 of module spec
    if not plan_passes_template(plan): escalate(F-PLAN-INVALID, wave); release_claim(wave); continue

    tier = current_tier(wave.module)
    if tier == T1: post_plan_for_human_review(plan); wait_for_response()
    if plan_rejected: handle(F-PLAN-REJECT); release_claim(wave); continue

    // BUILD
    set_status(wave, "in-build")
    branch = create_branch(wave)
    mockups = produce_or_verify_mockups(wave, spec)  // §7 of module spec
    code = build(wave, plan, mockups)  // §8 of module spec
    push(branch)

    // TEST & PR
    pr = open_pr(wave, branch, plan)
    set_status(wave, "in-review")
    ci_result = run_ci(pr)
    if ci_result.failed:
      retry_once_after(10min)
      ci_result = run_ci(pr)
      if ci_result.failed: handle(F-CI-FAIL, wave); continue

    smoke_result = run_smoke_tests(wave.module)
    if smoke_result.failed: handle(F-SMOKE-FAIL, wave); continue

    visual_result = run_visual_regression(wave)
    if visual_result.diff_exceeds_threshold: handle(F-VISUAL-DRIFT, wave); continue

    // AUTO-APPROVE
    if all_§10_criteria_met(pr) and tier >= T1:
      auto_merge(pr)
      set_status(wave, "shipped")
      tag_release(wave)
      remove_from_claims(wave)
      record_telemetry(wave)
      check_tier_promotion(wave.module)
      post_digest_entry(wave)
    else:
      handle(F-AUTO-CRITERIA, wave)
      remove_from_claims(wave)

    // POST-MERGE WATCH (continues for 7 days)
    schedule_regression_check(wave, days=7)
```

The loop is single-threaded for clarity. In practice, multiple waves can be in different stages concurrently (one in-plan, one in-build, one in-review) per the concurrency model in §6.

---

## §12 · Bootstrap (starting the loop from a cold state)

### Pre-flight (one-time)

1. Founder creates `docs/build/MASTER_BACKLOG.md` from this spec's §2 template.
2. Founder creates `docs/build/TIERS.md` with all modules at T1.
3. Founder authors per-module specs (`SOURCE_BUILD_SPEC.md` exists; others TBD).
4. Founder creates empty `docs/build/CLAIMS.md`, `docs/build/JOURNAL.md`, `docs/build/DIGEST/`.
5. Founder confirms ESLint plugin `@abarva/no-orphan-data` is installed (per Source §S0).

### First cycle

The orchestrator's first picked wave will be SRC-0 (Source audit) — assuming Programs spec is not yet authored. Once SRC-0 ships, SRC-1 becomes ready. And so on.

If founder authors Programs spec mid-cycle, the orchestrator picks up PROG-0 in the next cycle's `pickNextWave()`.

### Founder's first-week role

- Day 1–3: review every Tier-1 plan as it comes in. Reject when needed; the orchestrator learns from rejection text. Approve quickly when correct.
- Day 4: read first digest. Confirm the loop is healthy.
- Day 5: confirm at least one module has promoted to T2. If not, debug.
- Day 7+: read digest only. Intervene only on escalations or strategy changes.

By Day 14, the orchestrator should be operating with founder reviewing < 30 minutes per day.

---

## §13 · Cross-module invariants

### Escalation rule 13 (v1.1 addendum)

**Vercel preview deployment failure.** If the Vercel preview build fails for reasons not addressable by code changes (env var missing, Clerk instance misconfigured, third-party API quota exhausted), agent halts and escalates. Do not modify Vercel project settings or GitHub Actions secrets without explicit founder authorization.

These must remain true across all modules and all waves. The orchestrator enforces by refusing to ship any PR that violates them.

### I-1 · AppShell uniformity
Every page in `src/app/(maestro)/**` is wrapped in `AppShell`. No exceptions. CI rule: any page file not importing AppShell fails the build.

### I-2 · Token discipline
No inline color hex values in component files (except where a token genuinely doesn't fit, marked with `// token-exempt: <reason>`). All colors go through `shell-tokens.ts`. CI rule: ESLint custom rule `@abarva/no-inline-hex`.

### I-3 · Provenance plumbing
Every component that renders Source, Programs, Intelligence, Tower, or Setup data accepts a `provenance` prop. CI rule: ESLint custom rule `@abarva/no-orphan-data`.

### I-4 · Iceberg principle
Provenance is rendered visibly only inside `CMP-EVIDENCE-ROW`, `PRG-MOD-EVIDENCE-DRAWER`, `PRG-MOD-CONTRADICTION`, or `CMP-MISSING-INPUT-CHIP`. Any other component rendering `<ProvenanceRibbon>` or similar is blocked. CI rule: import-from-allowlist on provenance display components.

### I-5 · Architecture invariants
Files in `src/lib/architecture/*` and `src/lib/shell/shell-tokens.ts` change only via founder-approved escalation. CI rule: file-path block on PRs that lack the `architecture-approved` label.

### I-6 · No silent data fetching from clients
Client components do not call `/api/v1/*` directly. They receive data via props (server component drilling) or React Query bound to keys from `query-keys.ts`. CI rule: ESLint `@abarva/no-direct-api-fetch`.

### I-7 · Smoke test coverage
Every module has at least one smoke test that walks its primary storyline end-to-end. Source has S-SMOKE-AMS. Programs needs P-SMOKE-CDP (APX-CDP-2026 storyline). Etc. Module spec includes its smoke test definition; CI runs all module smokes on every PR.

### I-8 · Single source of truth
The catalog (`pages.yaml`) is the single source of truth for what exists. Any new page must have a catalog entry first; orchestrator refuses to plan a wave for a page not in the catalog. Founder updates catalog directly; orchestrator reads.

---

## §14 · Roles & responsibilities

| Role | Responsibilities |
|---|---|
| **Founder** | Authors specs, sets priorities, approves T1 plans, reviews escalations, reads daily digest, intervenes on strategy. |
| **Orchestrator** | Picks waves, dispatches to per-module loops, monitors execution, ships per §10, escalates per §7, posts digest. |
| **Per-module loop** (the agent doing the actual work) | Plans, designs, builds, tests per the module spec. Lives entirely inside a single wave's lifecycle. Returns to orchestrator on completion or failure. |
| **CI** | Runs typecheck, lint, unit, snapshot, visual, smoke. Reports pass/fail to orchestrator. |
| **Reviewer (human, when needed)** | Approves T1 plans, reviews held PRs, resolves escalations. |

The orchestrator is *not* the per-module loop. It dispatches to the per-module loop and waits for results. This separation lets the orchestrator handle multiple modules in parallel without conflating concerns.

---

## §15 · Failure recovery & rollback

### Per-wave rollback
Every shipped wave is tagged (`source-wave-S{N}-shipped-YYYY-MM-DD`). Rollback = `git revert <tag>`. The PR template (Source spec §11) requires explicit rollback instruction per wave.

### Cascading rollback
If wave N is reverted and waves N+1, N+2 depended on it, those must be reverted too in reverse order. The orchestrator plans this automatically: revert request → orchestrator computes the reverse-dependency chain → produces a multi-revert plan → founder approves → orchestrator executes.

### Post-revert
After any revert:
- Module is demoted to T0
- All in-flight waves in that module are halted
- Founder is notified with revert reason and recommended next action
- Journal entry is appended with full reversion graph

### Recovery from hard stop
1. Founder reads the halt reason in `docs/build/JOURNAL.md`
2. Founder either:
   - Approves: removes halt flag; appends `[RESUME ACK]` to journal
   - Investigates: runs whatever debug needed; commits fixes; then resumes
3. Orchestrator picks up on next cycle

---

## §16 · Document control

- **Authoritative location:** `docs/build/ORCHESTRATION_SPEC.md`
- **Version:** 1.0
- **Authored:** April 28 2026
- **Owner:** Founder (Anand)
- **Update protocol:** Founder edits directly. Orchestrator reads.
- **Companion specs:** Per-module specs in `docs/build/{MODULE}_BUILD_SPEC.md`

When this spec changes (e.g., a tier criterion is tightened), the change is logged in `docs/build/JOURNAL.md` with a `[SPEC-CHANGE]` tag. Orchestrator re-reads spec at the top of every cycle.

---

## §17 · Quick reference · the founder's whole job, summarized

**Day 0 (one-time setup):**
- Author master backlog (§2 template) — 1 hour
- Author per-module specs as needed (Source done; Programs/Intel/Tower/Setup remain) — 2-3 hours each
- Confirm CI rules (§13) installed — 30 min
- Start orchestrator

**Daily (15–30 min):**
- Read digest
- Approve any T1 plans (first 3 waves of each new module)
- Resolve any escalations
- That's it

**Weekly (1 hour):**
- Read tier promotions / demotions
- Check anti-pattern flags
- Decide whether to apply suggested threshold tweaks
- Update priorities if business context changed

**On-demand:**
- Review held PRs (rare once tiers mature)
- Approve architecture-touching PRs (rare by design)
- Strategy redirects (annotate `[OVERRIDE: NEXT]` to redirect)

**The founder is not in the merge path.** That's the whole point.

---

**End of orchestration spec.**

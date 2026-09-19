# Dead Monitors and the Efficacy Gap — Execution Backlog

**For:** Codex (or any implementing agent)
**Repo:** `abarva-platform/abarva` (PUBLIC — no client names, no incident narrative)
**Every figure below was measured from the GitHub Actions API, not estimated.**

---

## 0. The finding

Six scheduled checks are failing continuously. Two are security controls.

| Workflow | Success | Last green | Class |
|---|---|---|---|
| `rls-regression.yml` | **0/20** | none in 40 | network |
| `sec-p0-post-deploy.yml` | **0/20** | none in 40 | secrets |
| `l10-soc2-evidence-pack.yml` | **0/4** | none in 40 | network |
| `ai-cost-daily.yml` | **0/20** | none in 40 | unknown |
| `migration-drift-nightly.yml` | 0/20 | 2026-06-03 | network — **fix in PR #7312** |
| `atlas-prod-comprehensive-surface.yml` | 1/20 | 2026-08-15 | unknown |

Healthy, for contrast: `canonical-tenant-drift`, `azure-l5-reset-replay`,
`dependency-vulnerability-report`, `request-access-monitor`,
`context-corpus-governance`, `aca-runtime-drift-monitor` — all 20/20 or 18/20.

### Why it happened

The platform moved to Azure Postgres behind a private VNet. Every workflow that
connected **directly from a GitHub runner** went blind at the same time. Some
still hold a decommissioned Supabase DSN; others point at a real Azure host a
hosted runner cannot route to.

Nothing surfaced it because **a red scheduled job produces no signal anyone
reads**. Six have been failing nightly for months.

### Why it matters beyond these six

The most consequential defect found recently — generation using ~10% of the
available context window — was found by a person reading output and asking why
it was thin. No automated check could have caught it, because every green signal
in this repo measures **completion**, not **efficacy**:

- tests pass → the code ran
- deploy succeeds → the image shipped
- gate green → criteria were ticked
- release-check passes → the record exists

None asks *was the output good, and did it use what it had?* Section 5 is about
closing that.

---

## 1. Root causes — measured, not inferred

### Class A · Network architecture (runner cannot reach the database)

**`rls-regression.yml`** — failing step `Run RLS regression`
```
Failed to connect: (ENOTFOUND) tenant/user postgres.xtbymdryojmvoulaotce not found
```
Decommissioned Supabase pooler DSN.

**`l10-soc2-evidence-pack.yml`** — failing step `Export evidence pack`
```
"error": "getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com"
```
Correct Azure host, but private — unroutable from a hosted runner.

**Fix:** submit the work through the private operator job, exactly as
`db-migration-lab.yml`'s preflight does and as PR #7312 does for drift. Same
deployed image, same secret reference, same network path. **Copy that pattern;
do not invent a new one.**

### Class B · Missing secrets (no code change will fix this)

**`sec-p0-post-deploy.yml`** — failing step `Resolve environment URLs`
```
Missing SEC-P0 probe secrets for production.
Required: BASE_URL, MERIDIAN_CLIENT_ID, and one of APEX_SESSION or APEX_COOKIE_HEADER.
```
The workflow is behaving correctly — it refuses to probe without credentials.
**This needs repo-secret access and is Anand's to action, not Codex's.** Do not
work around it by weakening the guard.

### Class C · Unknown — investigate before proposing a fix

**`ai-cost-daily.yml`** — fails at `Open snapshot PR`. Secret guard passes
(`missing=0`), so this is not a credential problem. Likely workflow permissions
for PR creation. **Diagnose first.**

**`atlas-prod-comprehensive-surface.yml`** — fails at
`Run comprehensive Atlas production surface gauntlet`. One success in 20, most
recent 2026-08-15. Establish whether this is environmental or a real product
regression. **A failing production-surface gauntlet may be reporting something
true.** Do not assume it is broken tooling.

---

## 2. Item 1 — Revive Class A monitors · HIGHEST PRIORITY

`rls-regression` is the highest-severity item in this document, above everything
else including the context work. It guards tenant isolation. Cross-tenant
leakage is the one failure this product cannot absorb, and its regression
harness has not run successfully in at least 40 attempts.

> **`rls-regression.yml` is being taken separately — do not start it.**
> Take `l10-soc2-evidence-pack.yml`.

For `l10-soc2-evidence-pack.yml`:

1. Replace direct DB access with `npm run ops:aca-job -- --script <script>
   --container <c> --secret-env DATABASE_URL=<secret-ref> --out-dir <dir>`,
   mirroring `db-migration-lab.yml`'s preflight.
2. Add `permissions: { contents: read, id-token: write }` and the Azure OIDC
   login block.
3. Resolve the deployed image digest rather than building one.
4. **Three outcomes, kept apart** — see §3.
5. Upload evidence artifacts on `always()`.

**You cannot prove an Azure-touching workflow from a feature branch.** The
federated identity is scoped to `main`:
```
AADSTS700213: No matching federated identity record found for presented assertion
subject 'repo:abarva-platform/abarva:ref:refs/heads/<branch>'
```
That is correct security posture. The sequence is **merge → dispatch from
`main` → report**. Until that dispatch runs the workflow is `merged`, never
`live_proven`, and say so.

---

## 3. Item 2 — A monitor must prove it ran

Every revived monitor reports **three** outcomes, not two:

```
checked + clean   → the thing was examined and is fine
checked + problem → the thing was examined and is not fine
NOT CHECKED       → the check did not run, or produced no readable output
```

The third is the point. **A monitor that cannot reach its target has not found
"clean" — it has found nothing**, and must fail loudly saying the state is
unknown. This is the same rule the product applies to unreadable documents and
unscanned artifacts.

Also **state each monitor's blind spot in its own clean result.** The drift
check compares the migrations directory against the `schema_migrations` ledger,
so a migration recorded as applied whose objects are missing is not detected —
that exact drift exists in the live database right now. A clean result that does
not say what it did not check is a half-truth.

---

## 4. Item 3 — Make a dead monitor visible

Six workflows failed nightly for months and nobody knew. Red is currently
indistinguishable from silence.

Add a scheduled job that reads the Actions API for every workflow with a
`schedule:` trigger and reports, per workflow: success rate over the last N
runs, and the date of the last green run. Fail when any scheduled workflow has
no success within a threshold window.

Keep it dependency-free — it must not become another thing that silently stops
working. It should be able to detect its own staleness.

---

## 5. Item 4 — Ledger versus reality

The migration ledger records `20260530133918_tower_dora_metrics.sql` and
`20260530134151_tower_workforce.sql` as applied. Neither table exists in the
live database:

```
relation "tower_dora_metrics" does not exist
relation "tower_workforce" does not exist
```

The ledger has 351 applied entries and a `..._ledger_repair.sql` in its history,
so this has happened before.

**Build a schema readback**: for each migration recorded as applied, assert its
principal objects exist. Report ledger-says-applied-but-absent as its own
finding class, separate from pending migrations.

Generalise where cheap — any table recording "this happened" should be
periodically checked against the thing supposedly having happened. Artifact
`status` versus artifact content is the same shape and has already produced one
live defect.

---

## 6. Item 5 — Declared-but-inert configuration

`matureDataSourceCount` is declared in the adaptive-depth signal interface,
defaulted, derived from prose on every resolution — and **never read**. Zero
`signals.matureDataSourceCount` references. Every other signal has 1–5.

Anyone reading that interface reasonably concludes data-source maturity affects
complexity. It does not.

**Write a static audit**: for each declared field on a signal/flag/policy
interface, count reads. Report write-only fields. Run it over adaptive depth,
readiness signals, quality-bar config and consumer policies.

Expect more than one. This is cheap to find and impossible to notice by reading.

---

## 7. Item 6 — Efficacy, not just completion

The deepest gap, and the reason a person had to find the context problem.

1. **Retrieval quality** — coverage telemetry now records available → packed →
   cited. Extend it: how much of the *approved* evidence set reached the prompt,
   and how much of what reached it was actually used.
2. **Artifact quality against a bar** — a generated artifact should be
   measurable against a reference standard, not only against "did it render".
3. **Claim support** — citations currently attach to answers wholesale. Whether
   a specific claim is supported by a specific cited source is unmeasured.

Item 1 is concrete and mostly built. Items 2 and 3 need design first — do not
start them speculatively.

---

## 8. Non-negotiables

- **Never weaken a guard to make a check pass.** `sec-p0-post-deploy` refusing
  to run without credentials is correct behaviour.
- **Never report unchecked as clean.** Applies to every item here.
- **Every rule gets a negative test.** A guard with only positive tests becomes
  noise people learn to ignore.
- **`deployed` and `live_proven` are different facts.** A merged workflow that
  has never completed a real run is not proven.
- **Public repo.** No client names, no incident narrative. Describe the
  mechanism, never the engagement.
- **Read-only stays read-only.** These are monitors. None of them may acquire
  the ability to mutate what they observe.

## 9. Status reporting

Maintain `docs/status/observability/STATUS.md` with one row per item, using the
vocabulary `not_started · in_progress · pr_open · merged · deployed ·
live_proven`. Push on every transition, and immediately on any blocker.

For each revived monitor also record: **first green run id and date.** That is
the only evidence that a monitor is actually monitoring.

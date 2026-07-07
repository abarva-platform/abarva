# Source — Golden Event Test Bar

Executable spec for the Apex AMS Sourcing $35M event. Every Hard Pass/Fail rule from the audit is encoded as a Playwright test; flipping a red test to green closes a Wave 1 ticket.

## Purpose

Encode the Apex AMS $35M end-to-end sourcing event (`apex-retail-ams-outsourcing-2026`) as the single bar Source must clear before pilot. The specs here are the source of truth — not audit docs, not design memos.

## Spec inventory

| Spec file | What it covers |
|---|---|
| [golden-event-apex-ams.spec.ts](./golden-event-apex-ams.spec.ts) | Canonical 11-stage walkthrough (Strategy → Value). One test per stage + dedicated Executive Decision and Value Ledger deep-dive tests. |
| [cross-tenant-isolation.spec.ts](./cross-tenant-isolation.spec.ts) | 6 hard `toBe(404)` assertions proving Meridian CDIO cannot see Apex events, stored-document artifact drawers, artifacts, or list rows. |
| [separation-of-duties.spec.ts](./separation-of-duties.spec.ts) | Pilot-vs-production governance contract: non-approver submit, approver clear, pilot self-approve, prod self-approve reject. |
| [_audit-harness.ts](./_audit-harness.ts) | Playwright fixture emitting per-test evidence packets (screenshots, console.log, HAR, audit.json) under `reports/source-golden-event/<run-stamp>/`. |
| [_auth.ts](./_auth.ts) | Persona helper (`signInAs(page, personaKey)`) with storageState caching. |

## Hard pass/fail rules → spec coverage

The 11 audit rules map onto the three specs above:

| # | Rule | Covered in |
|---|------|------|
| 1 | Every stage has required inputs, evidence, artifacts, exit criteria | `golden-event-apex-ams` (each stage test) |
| 2 | Stage advance is blocked when approval/evidence is missing | `golden-event-apex-ams` (every `captureGateBlock` call) |
| 3 | AI artifacts visibly labeled "AI Draft" | `golden-event-apex-ams` (Scope, Pricing, Executive Decision stages) |
| 4 | AI artifacts cannot be committed without human edit/review | `golden-event-apex-ams` (Scope, Decision Brief stages) |
| 5 | Vendor recommendation requires explicit human approval + reason | `golden-event-apex-ams` (Executive Decision deep-dive) |
| 6 | Executive packet includes evidence + missing data + risks + dissent + approval record | `golden-event-apex-ams` (Executive Decision deep-dive) |
| 7 | Apex data is invisible to Meridian/SkyHarbor | `cross-tenant-isolation` (6 hard 404 assertions, including Stored Documents drawer route) |
| 8 | All outputs downloadable/inspectable | `golden-event-apex-ams` (every `captureArtifact` call) |
| 9 | No truncation in executive summaries | `golden-event-apex-ams` (Executive Decision: last-paragraph terminal-punctuation check) |
| 10 | Approver identity + reason persisted on every approval | `golden-event-apex-ams` + `separation-of-duties` (`captureApprovalRecord`) |
| 11 | Value ledger ties decision to projected + realized outcomes | `golden-event-apex-ams` (dedicated Value Ledger test) |

## How to run

**Locally** (requires real Clerk + Azure/Postgres credentials per `AGENTS.md`, plus `npx playwright install chromium`):
```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/source/
```

**Against deployed preview**:
```bash
PLAYWRIGHT_BASE_URL=https://nexus-vert-kappa.vercel.app npx playwright test tests/e2e/source/
```

**Single spec**:
```bash
npx playwright test tests/e2e/source/cross-tenant-isolation.spec.ts
```

Cached storageState files land under `.auth/`. Add `.auth/` to `.gitignore` — these contain live `__session` cookies.

## Audit packet output

Each run writes to `reports/source-golden-event/<YYYY-MM-DD-HH-mm-ss>/`:
- One directory per test: `<test-slug>/` with `screenshots/`, `console.log`, `network.har`, `audit.json`
- Run root: `INDEX.md` summarizing every test's audit.json — gate blocks, approvals, step errors, status mix

The cross-tenant spec additionally writes `reports/<YYYY-MM-DD>-source-xtenant-isolation/raw.json` for backwards-compat with the existing audit-doc tooling.

## Expected first-run state

Once persona provisioning and seed data are in place, the specs will divide as follows:

**GREEN (already enforced in code):**
- `cross-tenant-isolation` — RLS + adapter-level filters proven solid in the audit
- `separation-of-duties` tests 1–2 (non-approver block, approver clear) — basic auth flow exists

**RED (annotated `test.fail` — the Wave 1 acceptance list):**
- Every stage gate test → `AUDIT §Source-P0-01 GATE_NOT_ENFORCED`
- Scope + Decision Brief AI Draft tests → `AUDIT §Source-P0-02 AI_DRAFT_LABEL_MISSING`
- BAFO + Executive Decision artifact downloads → `AUDIT §Source-P0-03 PHANTOM_ARTIFACTS`
- Decision Brief non-truncation → `AUDIT §Source-P0-04 BRIEF_TRUNCATED`
- Executive Decision approval-reason assertion → `AUDIT §Source-P0-05 APPROVAL_REASON_NOT_PERSISTED`
- Value Ledger decision-linkback → no current persistence path

When a blocker is fixed, remove the `test.fail()` annotation. Tests flip red → green automatically; CI surfaces the regression if the fix drifts.

## Personas

`signInAs(page, personaKey)` in `_auth.ts` supports:
- `apex-vp-sourcing` — `cio@apex-retail.example.com` — approver
- `apex-non-approver` — non-approver in Apex tenant (gap: provision required)
- `meridian-cdio` — `cdio@meridian-health.example.com` — cross-tenant isolation foil
- `meridian-cdao` — `cdao@meridian-health.example.com` — Meridian CDAO source smoke persona

CXO personas require `scripts/provision-cxo-personas.ts --apply` before E2E. The helper falls back to demo-account credentials (`Demo2026!` / `424242`) if Clerk testing tokens aren't configured.

## Three-tier review

| Tier | Role |
|---|---|
| **Codex / primary CI** | Runs these specs on every PR; failures block merge once blockers are flipped |
| **Claude (Chrome extension)** | Independent re-run of the critical path against deployed preview; produces a second audit packet that should match |
| **Human VP** | Final gate — reviews `INDEX.md`, opens the executive brief artifact, judges business realism. Specs cannot prove brief quality, dissent fidelity, or whether the recommendation survives CFO challenge. |

## What specs do NOT cover

A human still owns these:
- Executive-brief readability and tone
- Judgment quality of cited evidence
- Business realism of pricing normalization
- Whether the value-ledger projections track an outcome a sourcing leader would defend in front of CFO + Board

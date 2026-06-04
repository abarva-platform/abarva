# Operational Readiness Live Evidence

Status: execution-control runbook

Owner: AbarVa founder/operator

Backlog rows: T106, T110, T115, T121, T123, T305

## Purpose

This runbook turns the remaining Operational Readiness backlog into a concrete evidence workflow. The repo already contains the major operating artifacts for demo readiness, disaster drills, OFAC screening, and founder cadence. The remaining work is live proof, founder acknowledgement, customer/vendor evidence, or scheduler/account setup.

## Closure Rule

Do not mark these rows Done from this runbook alone. A row closes only when:

- the repo-controlled artifact is merged to main,
- the row-specific live or founder evidence below exists,
- private evidence is stored outside the public repository when it includes identities, customer records, screenshots, vendor output, or account details,
- and `/Users/anand/Downloads/ABARVA_PILOT_READINESS_PLAN.xlsx` names the PR, command, evidence path, and remaining risk.

## Evidence Location

Use `audit-artifacts/operational-readiness/<task-id>-<slug>-YYYY-MM-DD/` for sanitized proof. Store sensitive proof in the private evidence vault and commit only redacted indexes or summaries.

Every evidence folder should include:

- `README.md` with task id, date, operator, environment, and summary.
- `commands.log` for exact commands, with secrets and tenant identifiers redacted.
- `results.md` or `results.json` with pass/fail outcomes.
- `redactions.md` describing any withheld private material.
- `owner-signoff.md` when the evidence requires founder acknowledgement or approval.

## Open Rows

| Row | Current blocker | Existing repo artifact | Done evidence required |
| --- | --- | --- | --- |
| T110 | Hosted synthetic demo environment is not proven live. | `docs/demo/DEMO_ENVIRONMENT_OPERATIONS.md`; `npm run demo:environment:verify` | Passing verifier output, browser smoke for `demo.abarva.com` or approved preview, Clerk demo-user sign-in proof, nightly reset scheduler log for Apex/Meridian/First Capital, tenant-isolation smoke, and synthetic-data copy honesty proof. |
| T115 | Disaster scenarios are documented but not drilled. | `docs/runbooks/disaster-scenario-drills.md` | One recorded drill packet covering scenario, date, participants, decision log, recovery steps, observed gaps, owners, and follow-up retest where needed. |
| T121 | OFAC screening foundation exists but live/manual evidence is not retained. | `docs/runbooks/ofac-screening.md`; `scripts/compliance/verify-ofac-screening.mjs` | New-customer screening record, source date for OFAC list or approved provider, match/no-match result, reviewer signoff, and retention location. |
| T305 | Two parallel close-sprint bandwidth plan exists but founder acknowledgement is not evidenced. | `docs/runbooks/founder-operating-system.md`; `npm run ops:founder-operating-system:verify` | Founder acknowledgement in a live weekly review, named active/deferred work, and two-week capacity forecast. |
| T106 | Hire plan exists but founder approval and trigger evidence are not captured. | `docs/runbooks/founder-operating-system.md`; `npm run ops:founder-operating-system:verify` | Founder-approved trigger-based hiring sequence, first-role scorecard, funding or signed-pilot trigger evidence, and onboarding/access checklist. |
| T123 | Founder cadence is documented but has not been run with retained evidence. | `docs/runbooks/founder-operating-system.md`; `npm run ops:founder-operating-system:verify` | At least one weekly operating review packet, monthly metrics/finance packet when applicable, quarterly review schedule or first review notes, and retained action register. |

## Closure Sequence

1. Demo proof: close T110 only after hosted route, auth, reset, isolation, and synthetic-copy proof exist.
2. Safety and compliance proof: close T115 and T121 only after a retained drill and screening record exist.
3. Founder operating proof: close T305, T106, and T123 only after founder signoff and live cadence evidence exist.

## QA Commands

Run the existing verifier for the row before collecting live evidence:

```bash
npm run demo:environment:verify
node scripts/compliance/verify-ofac-screening.mjs
npm run ops:founder-operating-system:verify
```

For this runbook itself:

```bash
node scripts/ops/verify-operational-readiness-live-evidence.mjs
node --check scripts/ops/verify-operational-readiness-live-evidence.mjs
git diff --check origin/main...HEAD
npm run release:check -- --base origin/main --head HEAD
```

## Founder Or External Work Required

- T110 requires hosted route/DNS or approved preview proof, Clerk demo-user evidence, and scheduler logs.
- T115 requires people to run and record a drill.
- T121 requires live customer/prospect screening evidence and reviewer signoff.
- T305, T106, and T123 require founder acknowledgement, approval, and actual operating review evidence.

## Current Truth

Operational Readiness is not blocked by missing policy text. It is blocked by live hosted demo evidence, retained disaster/screening evidence, and founder operating proof. Keep all six rows In progress until those proofs exist.

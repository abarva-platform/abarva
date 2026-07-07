## T035 — Admin ops surface

Status: Partial

Date: 2026-06-04

What was run

- `node scripts/admin/verify-admin-ops-surface.mjs`
- `npx jest src/lib/admin/__tests__/ops-surface.test.ts src/lib/admin/__tests__/home-overview-v2-pre-w4-pr5.test.ts --runInBand`
- Live `admin_audit_log` sample query

Evidence files

- `verify-admin-ops-surface.txt`
- `jest-admin-ops-surface.txt`
- `admin-audit-log-sample.json`

What passed

- The admin ops surface verifier passed.
- Focused admin ops tests passed.
- The live data plane contains recent `admin_audit_log` rows, including connector and dataset activity, which confirms that admin audit evidence is being persisted in the current environment.

What the current surface is

- `/admin/ops` exists as a governed read surface.
- It documents:
  - operation purpose
  - approval path
  - dry-run requirement
  - validation steps
  - rollback guidance
- It does not execute production jobs directly.

Why this is not Done

- The control packet calls for live job execution controls, approvals, locks, retries, idempotency, and immutable audit writes.
- The current implementation is still a read-only governance surface, not a production job runner.

Concrete remediation

- Wire a dedicated job-runner path for one approved operation class, capture approval and execution state transitions, and write immutable audit evidence for the run from request through completion.

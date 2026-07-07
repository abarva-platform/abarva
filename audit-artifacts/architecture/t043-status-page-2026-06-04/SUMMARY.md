## T043 — Public status page

Status: Blocked

Date: 2026-06-04

What was run

- `node scripts/ops/verify-status-page-readiness.mjs`
- Route/code/provider search across `src`, `docs`, and `scripts`

Evidence files

- `../t043-status-page-readiness-2026-06-04.json`

What passed

- The status-page readiness verifier passed.
- Public `/status` foundation exists and is reachable through the public-route
  allowlist.
- The current foundation includes:
  - canonical URL wiring
  - public route
  - component/status layout
  - incident communication model
  - operator runbook

Important live findings

- No external status provider integration was found in the current repo or
  runtime-facing configuration surfaces.
- The page is still intentionally truthful that monitor-backed uptime and
  incident history are not yet connected.

Provider options

- Better Stack
- Atlassian Statuspage
- Instatus

Exact integration points in the codebase

- Public render surface: `/src/app/(public)/status/page.tsx`
- Public-route allowlist: `/src/proxy.ts`
- Canonical public URL: `/src/lib/public-site/canonical-urls.ts`
- Readiness verifier: `/scripts/ops/verify-status-page-readiness.mjs`
- Operator runbook: `/docs/runbooks/status-page.md`

Why this is not Done

- This row requires a human provider choice plus external service setup.
- Missing closure items:
  - provider selected
  - public status host approved
  - monitor-backed uptime feed connected
  - subscriber notifications configured
  - synthetic incident or maintenance-window drill posted and archived

Concrete remediation

- Choose Better Stack, Statuspage, or Instatus; connect the provider to the
  `/status` operating model above; then publish one synthetic maintenance or
  incident drill and archive the resulting public proof.

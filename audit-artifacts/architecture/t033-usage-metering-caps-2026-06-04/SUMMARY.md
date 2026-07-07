## T033 — Usage metering + caps

Status: Partial

Date: 2026-06-04

What was run

- `npm run azure:observability:audit`
- `npx jest src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts src/lib/integrations/ai-egress/__tests__/tenant-usage-cap-policy.test.ts --runInBand`
- Inline usage-cap harness using `evaluateTenantUsageCap(...)`
- Live AI egress metadata probe against `ai_egress_audit`

Evidence files

- `azure-observability-audit.txt`
- `jest-usage-cap-tests.txt`
- `usage-cap-harness.json`
- `live-usage-cap-metadata-probe.json`

What passed

- Azure observability audit passed.
- Live Azure cost controls exist at the subscription layer:
  - monthly lab budget exists
  - notifications are configured at 50%, 80%, and 100%
  - alert receiver is `alerts@abarva.ai`
- Usage-cap policy tests passed.
- The harness proves the current contract behaves correctly for:
  - below-threshold allow
  - 80% alert threshold
  - 100% block threshold

Important live findings

- The live `ai_egress_audit` table currently shows `0` rows with embedded `usageCap` / `usage_cap` metadata across all client tenants in the recent dataset probe.
- So durable cap telemetry is not yet appearing in the live customer-admin reporting surface, even though the policy logic and Azure budget alerting foundation exist.

Why this is not Done

- This row still lacks closure-grade tenant-scoped runtime proof that usage-cap decisions are being stamped into live `ai_egress_audit.request_metadata` and surfaced to operators or customers.

Concrete remediation

- Drive one live tenant-scoped AI call through the egress path with usage-cap evaluation enabled, capture the resulting `usage_cap_*` metadata in `ai_egress_audit`, and then capture the corresponding customer/admin reporting surface.

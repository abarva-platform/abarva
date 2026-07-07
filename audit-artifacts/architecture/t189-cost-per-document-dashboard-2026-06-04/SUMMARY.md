## T189 — Cost per document dashboard

Status: Partial

Date: 2026-06-04

What was run

- Live AI egress search for document and cost metadata
- Live tenant-level document-economics probe against `ai_egress_audit`
- Route and read-model inspection for the existing customer-admin cost surface

Evidence files

- `ai-egress-usage-search.json`
- `document-dashboard-probe.json`

What passed

- The dashboard foundation exists in code:
  - `/src/app/(maestro)/admin/customer/page.tsx`
  - `/src/lib/admin/customer-admin-read-model.ts`
- The current customer-admin read model is prepared to surface:
  - document count
  - parse cost
  - chat cost
  - total cost
  - cache hit rate
  - top metered documents

Important live findings

- Across all five client tenants, the current live `ai_egress_audit` dataset probe found:
  - `0` document-key rows
  - `0` cost rows
  - `0` cache-telemetry rows
- So the dashboard surface exists, but the live runtime data spine is not yet feeding document-bound parse/chat/cache economics into the audit metadata it depends on.

Why this is not Done

- This row still lacks real document-bound cost evidence in the live data plane.
- There is no closure-grade screenshot or runtime panel output worth calling authoritative yet, because the panel would only reflect missing metering rather than a working per-document cost view.

Concrete remediation

- Emit document identity, parse cost, total cost, and cache telemetry into live `ai_egress_audit.request_metadata` for at least one real document workflow, then capture the resulting customer-admin panel output or API/view-model packet.

# Static Surface Contracts

Evidence bundle: `docs/build/qa/2026-06-19-surface-agent-insight-readiness/`

Generated during PR #3715 hardening work. This is a read-only source audit. It does not prove live ACA state, signed-in browser behavior, Azure Search retrieval, or all-client runtime data.

Mutation performed: none.

## Summary

| Surface | Current backing model | Tenant scope observed | Static verdict |
| --- | --- | --- | --- |
| Home | Active client row, AI initiative read model, program approval queue, pure Home brief composer. | `activeClient.id` for AI initiatives; `activeClient.key` for approval queue. | Good tenant-scoped shape. Needs live read-model and signed-in browser proof. |
| Tower | `/tower` iframe fed by `/api/tower/v2-frame`; data script built from checked-in synthetic CSV packs selected by client key/name. AI Control Tower read model has data-plane path plus First Capital synthetic fallback. | Pack selected from active client key/name; AI Control Tower data-plane path filters by `client_id` or `client_key`. | Migration risk until Tower is either constrained as synthetic/demo or live-proven from data-plane rows per tenant. |
| Intelligence | Static binding payload from `all-tenants.json` when present; otherwise enterprise context overview and AI Control Tower read model. Agent answers use tenant context and broker bundles. | Page resolves active client and locked tenant session, then canonicalizes tenant key; enterprise context reads canonical tenant key. | Mixed: tenant-keyed static binding is useful but not live data-plane proof. Needs retrieval/read-model proof per tenant. |
| Admin | `resolveAdminTenant`, inventory substrate snapshot, load-studio view model, source files from context chunks. | Admin tenant context plus `clientKeyToInventorySubstrateKey`; source files filtered by active `client_id`. | Good tenant-scoped shape. Needs signed-in browser proof and state-by-state ingestion proof. |
| Agent toolbar | `/api/chat/agent` resolves active client server-side, requires tenancy where available, assembles context bundle, applies access policies, and has golden/eval/trace scaffolding. | Active client key/name, inventory substrate key, `requireTenancy`, program/source access policy, broker tenant key. | Good guardrail scaffolding. Needs live tough-question eval with traces/citations. |

## Home

Route/component:

- `src/app/(maestro)/home/page.tsx`
- `src/lib/home/home-brief.ts`

Read path:

- Active tenant identity from `getActiveClientRow`.
- Signed-in user context from `getCurrentUser`.
- AI initiative portfolio from `listInitiativesForClient(activeClient.id)`.
- Pending program approvals from `getApprovalQueueForTenant(activeClient.key)`.
- UI model from `buildHomeBrief`.

Tenant filters:

- `listInitiativesForClient` selects `ai_initiatives` with `where: { client_id: clientId }` and resolves goals with `where: { client_id: clientId }`.
- `getApprovalQueueForTenant` filters `program_approval_requests` by `.eq("tenant_key", tenantKey)` and pending status.

Fail-closed / empty state:

- `buildHomeBrief` is pure and derives KPIs only from supplied rows.
- Empty initiatives produce `No initiatives loaded` and dash values rather than fabricated values.
- Home only routes decisions to the owning workspace; it does not approve inline.

Risks / remaining proof:

- Need signed-in browser proof for all six tenants.
- Need read-model proof that `activeClient.id` and `activeClient.key` are aligned for each signed-in tenant.
- Need deliberate empty-data proof for at least one tenant or controlled fixture.

## Tower

Route/component:

- `src/app/(maestro)/tower/page.tsx`
- `src/app/api/tower/v2-frame/route.ts`
- `src/app/api/tower/v2-data/route.ts`
- `src/lib/tower-v2/v4-data.ts`
- `src/lib/ai-control-tower/read-model.ts`

Read path:

- `/tower` renders an iframe to `/api/tower/v2-frame`.
- `/api/tower/v2-frame` and `/api/tower/v2-data` resolve `getActiveClientRow`, derive a display name, and call `buildTowerV2V4DataScript`.
- `buildTowerV2V4DataScript` resolves a dataset pack from active client key/name and reads checked-in CSV files under `datasets/`.
- `getAiControlTowerReadModel` first tries `ai_control_refresh_runs` by `client_id` or `client_key`, then related `ai_control_*` tables by `refresh_run_id`.
- If no data-plane rows exist and the tenant looks like First Capital, `getAiControlTowerReadModel` can use `first_capital_local_synthetic_fallback`.

Tenant filters:

- Tower v2 pack selection is active-client-derived but synthetic dataset backed.
- AI Control Tower read model filters the refresh run by `client_id` when available, else `client_key`, then all dependent reads by `refresh_run_id`.

Fail-closed / empty state:

- AI Control Tower returns an empty read model when no data-plane rows exist and fallback is not allowed.
- Tower v2 iframe data script currently has a fallback pack when no client pack matches.

Risks / remaining proof:

- Tower v2 should not be counted as data-plane-backed migration proof while it is fed by synthetic CSV packs.
- The default pack fallback can make an unknown tenant look populated; signed-in all-client proof must check tenant identity and visible synthetic labels.
- Need a decision: either mark Tower v2 as demo/synthetic for migration, or wire/prove a tenant data-plane-backed Tower path before go-live.

## Intelligence

Route/component:

- `src/app/(maestro)/intelligence/page.tsx`
- `src/lib/intelligence/binding/binding-payload.ts`
- `src/lib/enterprise-context/intelligence-read-model.ts`
- `src/lib/ai-control-tower/read-model.ts`
- `src/lib/intelligence/persistence.ts`

Read path:

- Page checks locked tenant session and active client row.
- It canonicalizes the tenant key for enterprise context and binding lookup.
- `getIntelligenceBindingPayload` returns committed build-time data from `all-tenants.json` when the tenant has a binding payload.
- Without a binding payload, the page uses `getEnterpriseContextOverviewForTenant` and `getAiControlTowerReadModel`.
- Agent answer context can use `buildTenantContextBlock`, context broker bundles, stage/category retrieval, and tenant technology context.

Tenant filters:

- Binding payload lookup is tenant-keyed through aliases.
- Enterprise context overview canonicalizes tenant key and reads tenant-scoped enterprise context tables.
- Chunk-backed enterprise context fallback uses tenant-specific context chunks.
- AI Control Tower path scopes by `client_id`, `client_key`, or `refresh_run_id`.

Fail-closed / empty state:

- `getEnterpriseContextOverviewForTenant` returns `null` when no tenant key or no rows/chunks are available.
- Agent golden assertions require missing-context caveats on unsupported questions.

Risks / remaining proof:

- `all-tenants.json` is a committed binding artifact, not live read-model proof.
- Need per-tenant retrieval proof that answers retrieve the active tenant's chunks/facts/patterns and cite source ids.
- Need proof that binding data, enterprise context rows, AI Control Tower rows, and agent retrieval do not disagree for the same tenant.

## Admin

Route/component:

- `src/app/(maestro)/admin/page.tsx`
- `src/lib/admin/admin-tenant.ts`
- `src/app/(maestro)/admin/_cached-helpers.ts`
- `src/lib/admin/setup-load-studio-view.ts`
- `src/lib/context-ingestion/tenant-context-read-model.ts`

Read path:

- Admin route resolves tenant through `resolveAdminTenant`.
- It maps app client key to inventory substrate key with `clientKeyToInventorySubstrateKey`.
- It reads inventory posture through `cachedInventorySnapshot(brokerTenantKey)`.
- It builds the setup view through `buildLoadStudioView`.
- It reads source files through `getTenantSourceFiles(activeClient.id, { limit: 50 })`.

Tenant filters:

- Admin tenant context is server-resolved.
- Source file rows are grouped from `enterprise_context_chunks` fetched by `client_id`.
- Evidence-map reads also filter by `client_id` and `source_doc`.

Fail-closed / empty state:

- If no active client row exists, source files are an empty list.
- Load-studio view is derived from provided snapshot and should preserve state distinctions rather than collapse to "loaded."

Risks / remaining proof:

- Need signed-in proof that Admin shows separate ingestion states: uploaded, mapping proposed, committed, indexed, retrieval-proven, and review-required.
- Need read-model proof that chunk/file counts match the tenant's committed context rows.
- Need retrieval proof before claiming loaded context is usable in answers.

## Agent Toolbar

Route/component:

- `src/app/api/chat/agent/route.ts`
- `src/lib/agent-golden/*`
- `src/lib/agent-trace/*`
- `src/lib/agent-verification/*`
- `src/scripts/qa/agent-answer-quality-probe.ts`

Read path:

- The route resolves active client server-side and uses canonical display name instead of trusting `body.tenantName`.
- `requireTenancy` is used where program/source access policy is needed.
- Program data loads through tenant-aware helpers.
- Source access policy loads when on Source surfaces.
- Agent context bundle uses broker tenant key derived from active client key.
- Tenant context block uses inventory substrate key.
- Tool use runs through registered tools after prompt and policy assembly.

Tenant filters / guardrails:

- Cross-tenant write intent detection can refuse suspicious requests.
- Program and source access policy blocks constrain what the model may reveal or mutate.
- Agent traces record tenant key, retrieved context, retrieved patterns, artifacts, exclusions, citations, and validation status.
- Golden assertions test wrong tenant, cross-tenant leakage, expected tenant context, expected corpus pattern, missing-context language, and citation emission.

Fail-closed / empty state:

- Unsupported golden questions must receive a missing-data caveat.
- Claim/citation validation and tenant-isolation validation are part of the verification runner.

Risks / remaining proof:

- Lab verification only proves framework wiring. It does not generate live answers.
- Live tough-question eval must run against signed-in or ACA-side real agent paths with trace/citation capture.
- Mutation-boundary prompts must prove the agent stops at approval/runbook instructions and does not claim it loaded data, flipped flags, deployed, or mutated RBAC.

## Required Next Evidence

1. Run focused local tests listed in `docs/runbooks/surface-agent-insight-readiness.md`.
2. Run signed-in browser proof for all six clients on `/home`, `/tower`, `/intelligence`, and `/admin`.
3. Run live agent answer-quality probes inside ACA or another environment with the private data plane and model credentials.
4. Capture read-model row counts and retrieval traces per tenant.
5. Resolve the Tower v2 synthetic fallback decision before migration go-live claims.
6. Keep feature flags off until the tenant-invariant fix is merged, deployed, and live-proven.

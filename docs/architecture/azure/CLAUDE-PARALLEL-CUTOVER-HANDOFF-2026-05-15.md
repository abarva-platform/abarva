# Claude Parallel Cutover Handoff - 2026-05-15

Audience: Claude Code session working in the AbarVa repo  
Goal: advance the Azure parallel-run / cutover readiness work without duplicating Codex's current AZLAB51 evidence PR.

## Founder Goal

Stand up a full Azure-hosted AbarVa environment in parallel to the current production path, prove it returns equivalent tenant context and product behavior, then prepare for controlled cutover.

The question is not "do Azure resources exist?" The question is:

> Can a CXO sign in to Azure-hosted AbarVa, use Home / Intelligence / Moves / Source / Tower against Azure-backed data and retrieval, and get the same tenant-grounded answers we trust in the current product?

## Current Truth

| Area | Current state | Cutover implication |
|---|---|---|
| Azure foundation | Live | Subscription, networking, ACR, Key Vault, Container Apps, Blob, Service Bus, Event Grid, Azure AI Search, Cosmos Gremlin, Azure Postgres, Log Analytics, App Insights exist. |
| Azure Postgres | Mostly ready | Schema/migrations and synthetic tenant context are copied. Postgres is the real system-of-record candidate. |
| App runtime | Partial | Real AbarVa image builds and runs in Container Apps. Health checks work. Full authenticated UX parity still needs live proof. |
| Ingestion / Day-2 refresh | Mostly ready | Blob -> Service Bus -> worker -> sensitive-upload guard -> audit table works. L9 mixed good+poison live drill passed. |
| Retrieval | Partial | Azure AI Search has tenant context chunks, but AgentContextBroker is not fully switched to the Azure Search adapter. |
| Graph | Partial/defer | Postgres graph nodes/edges are real. Neo4j is not strategic. Cosmos Gremlin is the Azure-native projected graph target, but app adapter work remains. |
| Auth | Pilot-ready on Clerk | Keep Clerk for pilot. Entra External ID is post-pilot. Azure authenticated test matrix still needs clean run. |
| Cutover proof | Pending | Need parallel-run diff comparing current prod path vs Azure path for tenant facts, counts, patterns, KPIs, and surface-level invariants. |

## Codex Work In Flight - Do Not Duplicate

Codex is currently finishing the AZLAB51 evidence PR:

- Branch: `codex/azlab51-l9-mixed-batch-live-evidence-20260515`
- Files touched:
  - `docs/architecture/azure/AZLAB51-l9-live-mixed-batch-evidence.md`
  - `docs/architecture/azure/CURRENT-STATE.md`
  - `docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`
- Purpose: document the successful live L9 mixed-batch run:
  - Run id: `l9-mixed-20260515231810`
  - Good message audit row: `547a4683-61c0-483c-8221-51882b6cbbd7`
  - Good final decision: `allow`
  - Poison DLQ reason: `missing_tenantClientKey`
  - Image: `acrabarvalab001.azurecr.io/abarva/web:lab-l9-mixed-batch-20260515-r3`
  - Digest: `sha256:3e381bb075a9b2a2e65bc539fb6f5b5e83abe37caaf083bb696d46247d5a7b73`

Do not edit those three files unless the AZLAB51 PR has merged and you have pulled fresh `main`.

## Recommended Parallel Lanes

Pick one lane per Claude Code session. Use a fresh branch per lane. Do not stack unrelated work.

### Lane A - Azure Postgres Data-Access Adapter

Priority: P0 for cutover  
Effort: 1-2 days  
Branch suggestion: `claude/azure-postgres-data-adapter-20260515`

Problem:

The app still has routes/read-models that assume Supabase REST or Supabase client access. Azure Postgres is populated, but product surfaces need a clean adapter boundary so the same app can run against current Supabase and Azure Postgres without route rewrites.

Scope:

1. Inventory data access paths used by:
   - `/home`
   - `/intelligence`
   - `/strategic-moves`
   - `/source`
   - `/tower`
   - `/api/chat/agent`
   - `/api/intelligence/query`
2. Identify direct Supabase calls that are in the runtime path for those surfaces.
3. Add or extend a repository/provider interface where needed.
4. Implement Azure Postgres-backed read path for the highest-value shared tenant-context queries first.
5. Keep Supabase path intact behind config.

Acceptance:

- No product UI changes.
- No production DB mutation.
- A single env flag or provider config can select current/Supabase vs Azure Postgres path.
- Unit/integration tests prove the adapter returns the same view-model shape as the existing path for at least one primary surface.
- Document remaining direct Supabase dependencies in a table.

Likely files to inspect:

- `src/lib/enterprise-context/*`
- `src/lib/agent/*`
- `src/app/api/intelligence/query/route.ts`
- `src/app/api/chat/agent/route.ts`
- `src/lib/*/queries.ts`
- `src/lib/*/repository.ts`

### Lane B - AgentContextBroker Azure AI Search Adapter

Priority: P0 for cutover  
Effort: 1-2 days  
Branch suggestion: `claude/agent-context-broker-azure-search-20260515`

Problem:

Azure AI Search has tenant chunks loaded, but Sentinel/Nexus/Source still need to retrieve through the broker using Azure Search as a provider. Loaded indexes do not matter until the broker uses them.

Scope:

1. Locate AgentContextBroker and current retrieval provider boundaries.
2. Add an Azure AI Search provider adapter for `tenant-context-v1`.
3. Preserve tenant filtering as mandatory:
   - no query can execute without canonical tenant key.
   - results must include only matching tenant key.
4. Return the same context-bundle shape expected by agents.
5. Add a smoke script or test that queries Azure Search for one Apex, Meridian, and First Capital question.

Acceptance:

- Broker can retrieve from Azure Search when configured.
- Existing provider still works.
- Tenant filter cannot be omitted.
- Test proves no tenant-B chunk appears in tenant-A retrieval.
- Include latency logging at provider boundary.

Likely files to inspect:

- `src/lib/agent/context*`
- `src/lib/agent/context-bundle*`
- `src/lib/azure-search/*`
- `src/scripts/azure-search-*`
- `src/app/api/intelligence/query/route.ts`

### Lane C - Authenticated Azure Surface Matrix

Priority: P0 for cutover proof  
Effort: 0.5-1 day if auth cookie/Clerk host is ready  
Branch suggestion: `claude/azure-authenticated-surface-matrix-20260515`

Problem:

We have health checks and infrastructure proofs. We still need a clean authenticated UX run against the Azure Container App host.

Scope:

1. Confirm Azure host:
   - `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io`
2. Use canonical demo users:
   - `cio@apex-retail.example.com`
   - `cdo@apex-retail.example.com`
   - `cdio@meridian-health.example.com`
   - `cdao@meridian-health.example.com`
   - `cio@firstcapital.example.com`
3. Run the existing Playwright matrix against Azure if secrets/host config are ready.
4. If blocked by Clerk host/session cookie, document the exact missing config and create a minimal preflight check.

Acceptance:

- A report says pass/fail per tenant x surface.
- Screenshots or trace artifacts captured for failures.
- Blockers are concrete: e.g., "Clerk allowed origins missing Azure FQDN" or "session cookie absent".
- No app code changes unless fixing a real runtime bug.

Likely files:

- `.github/workflows/azure-l6-primary-surfaces.yml`
- `tests/e2e/primary-surfaces-tenant-matrix.spec.ts`
- `src/lib/auth/canonical-auth-roster.ts`

### Lane D - Parallel-Run Diff Harness

Priority: P0 for cutover decision  
Effort: 1 day  
Branch suggestion: `claude/parallel-run-diff-harness-20260515`

Problem:

We need a founder-readable proof that Azure and current production return equivalent tenant facts, not just "pages load."

Scope:

Create a script that compares current production and Azure lab for canonical invariants:

- tenant identity
- loaded segment counts
- context chunk counts
- graph node/edge counts
- top 3 KPI names
- top 3 Intelligence decisions/patterns
- Source event counts
- Tower portfolio KPI row

The script should output JSON and markdown.

Acceptance:

- Command accepts:
  - `--left-base-url`
  - `--right-base-url`
  - `--tenant`
  - optional auth cookie/session header
- Output includes:
  - `pass`
  - `warn`
  - `fail`
  - exact left/right values
- Works for at least one unauthenticated/admin health invariant immediately.
- Authenticated invariants can be gated with a clear "cookie required" preflight.

Likely files:

- `docs/architecture/azure/PARALLEL-RUN-DIFF-PROTOCOL.md`
- `src/scripts/*parallel*`
- `src/app/api/admin/parallel-run-invariants/route.ts`

### Lane E - L3 Strict Security Hardening Backlog

Priority: P1 before customer infosec review  
Effort: 0.5-1 day audit/update, more if remediating  
Branch suggestion: `claude/l3-strict-security-hardening-plan-20260515`

Problem:

AZLAB27 found 0 fail, 9 attention. Those attention items are acceptable in lab but need closure/waiver before customer private-data-lane pilot.

Scope:

1. Read AZLAB27 and current security audit output.
2. Produce an execution table:
   - close now
   - waive for lab
   - close before pilot
   - close before production
3. For items safe to close with IaC/config, implement narrowly.

Common attention categories:

- Service Bus public reachability / local auth.
- Search public reachability / local auth.
- Key Vault public manageability.
- Cosmos local auth.
- Over-broad Storage/Service Bus RBAC scopes.

Acceptance:

- Founder-readable table with exact Azure resource, current posture, target posture, and action.
- If code/IaC changes are made, include `what-if` or equivalent validation.
- Do not break live lab manageability without an operator path.

Likely files:

- `docs/architecture/azure/AZLAB27-azure-security-audit.md`
- `scripts/azure/audit-lab-security.mjs`
- `infra/` or `docs/architecture/azure/bicep-stubs/*`

## Execution Rules

1. Work in a clean worktree and a fresh branch.
2. One lane per PR.
3. Do not edit Codex's AZLAB51 files until merged.
4. Do not mutate production data.
5. Azure lab DB/data mutations are allowed only for synthetic smoke/drill data and must be documented.
6. Preserve current Vercel/Supabase behavior while adding Azure paths.
7. Tenant isolation is non-negotiable. Any route/provider accepting tenant input must enforce the caller's canonical tenant.
8. Keep outputs founder-readable: table of completed vs pending, not long terminal dumps.

## Suggested First Claude Assignment

If only one Claude lane can run first, choose Lane D: Parallel-Run Diff Harness.

Why:

- It gives the founder a cutover dashboard.
- It turns vague "Azure is close" into measurable parity.
- It exposes whether Lane A or Lane B is the real blocker.
- It can start with existing endpoints and expand as adapters land.

Opening prompt:

```text
You are working in the AbarVa repo. Read docs/architecture/azure/CLAUDE-PARALLEL-CUTOVER-HANDOFF-2026-05-15.md. Pick Lane D only: build the parallel-run diff harness. Do not edit AZLAB51 files. Do not mutate production data. Create one PR with script, docs, and validation. Output a founder-readable pass/warn/fail comparison for current prod vs Azure lab, even if some authenticated checks are preflight-blocked.
```

## Founder-Readable Target State

The handoff is successful when we can say:

| Cutover question | Evidence |
|---|---|
| Can Azure run the app? | Container Apps real image + health route + direct Postgres pass. |
| Can Azure hold the tenant context? | Azure Postgres row counts + chunks + graph nodes/edges. |
| Can Azure refresh context incrementally? | Blob/Service Bus/Event Grid/worker/audit live smoke. |
| Can Azure protect sensitive uploads? | Guard + quarantine/audit + L9 mixed-batch evidence. |
| Can agents retrieve from Azure context? | AgentContextBroker Azure Search adapter + retrieval tests. |
| Can CXOs use it end to end? | Authenticated Playwright tenant matrix. |
| Can we prove parity before cutover? | Parallel-run diff harness, left=current prod, right=Azure lab. |


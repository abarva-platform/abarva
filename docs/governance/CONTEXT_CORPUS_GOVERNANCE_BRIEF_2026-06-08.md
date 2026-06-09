# AbarVa Context & Corpus Governance Framework — Hardened Execution Brief (2026-06-08)

> Updated/hardened from the original Codex draft. Changes are grounded in `CANONICAL_TENANTS.ts`,
> the existing CI gate machinery, the Azure-native retrieval reality, and the read-model-gate
> lessons from PR #3321 / #3322. **Source of truth for tenants is code, not this prose.**

## Mission

A repo-level framework every client dataset, tenant context record, industry corpus item,
pattern, evidence artifact, chunk, and agent retrieval source MUST pass before any agent (Nexus,
Sentinel, Atlas, Source, Tower, Steward, or future agents) may use it. Applies to **all existing
Azure-native datasets and all future datasets**, no tenant exceptions.

**Core rule:** No context/corpus object is agent-usable unless it passes the canonical policy
contract. **Claude/reasoning models never receive raw or ungoverned context** — every agent call
uses a validated, policy-built, source-aware, confidence-scored bundle.

## Non-negotiable constraints (carry into every PR)

- Azure Container Apps only. No Vercel deploys. No DNS change.
- No Supabase / Neo4j / Pinecone **runtime** dependencies (legacy names may remain in shims/tests).
- Retrieval readiness is **Azure-native** (Postgres FTS + Azure AI Search). OpenAI
  `text-embedding-3-*` embeddings feeding Azure AI Search vectors are the **live, allowed** path;
  **Anthropic-only governs REASONING (Claude), not embeddings.** The retired/blocked item is the old
  **Pinecone-targeting** `embed:pending-chunks` runner (no Pinecone runtime) — never make Pinecone a
  readiness requirement.
- No destructive migrations; additive-only; reverse SQL documented; run via `npm run db:migrate`
  (call out the manual paste step explicitly).
- No data reload to "fix" an empty surface until a **read-only diagnostic proves data is missing**
  and Anand approves the write (data-present-but-gated is the more common cause).
- Private Azure DB is **unreachable from any workstation** (`getaddrinfo ENOTFOUND` proven). All
  live-DB validators/backfills run as **Container Apps Jobs in the VNet** (operator-job pattern),
  never from localhost. If a live step can't run, emit the exact `az containerapp job` command.
- No invented citations. Missing evidence is surfaced, never fabricated.
- **Real-client-name protection.** Cover names are canonical: `meridian-health` (real client: PHS)
  and `lakeshore-holdings` (real client: Morgan Street Holdings); other tenants similarly. The
  **real client names must NEVER appear** in product UI, corpus, context, embeddings, or any agent
  output. Real identities are `restricted`, mapped to the cover key at the ingest boundary, stored
  only in an ops-restricted mapping (never in agent-usable layers). A CI + runtime **leak check**
  fails if a real-client name/alias appears in any agent-usable object or response. "Arcturus" is
  NOT a canonical tenant — dropped.

## Source-of-truth files to create

- `docs/governance/CONTEXT_CORPUS_POLICY.md` — the canonical policy.
- `docs/governance/CONTEXT_CORPUS_ENFORCEMENT_TRACKER_2026-06-08.md` — human tracker.
- `docs/governance/context-corpus-enforcement-tracker.json` — **machine-readable** tracker a CI
  check reads (block if a gate regresses).
- `AGENTS.md` — add a "Context & Corpus Governance" section linking the policy (so Codex AND Claude
  Code read it at session start). **This is the agent-agnostic instruction gate; CI is the hard gate.**

## Canonical tenant enumeration (THE no-exceptions mechanism)

Every scanner/validator/report/test **iterates `CANONICAL_TENANT_KEYS` imported from
`src/config/tenants/CANONICAL_TENANTS.ts`** — never a hand-typed list. Today that is:
`apex-retail, meridian-health, northstar-clinical, first-capital, skyharbor-air, lakeshore-holdings`.
(The draft's "Arcturus / First Financial / PHS / SkyHarbour" must be reconciled to these keys;
"Arcturus" is not a canonical tenant — confirm or drop. `skyharbor-air` is the canonical SkyHarbor.)
A tenant present in DB but missing from `CANONICAL_TENANTS` is itself a policy failure.

## Canonical fields (additive to the draft)

Keep the draft's required fields, plus:

- `retrievability`: `not_indexed / committed_not_indexed / fts_indexed / search_indexed` — the
  loaded≠indexed≠retrievable distinction (the Lakeshore/SkyHarbor trap).
- `cited_render_verified_at` — last time an end-to-end probe confirmed the object can surface as a
  visible citation (not just exist in DB).
- `compliance_basis` — derived from `CANONICAL_TENANTS` compliance metadata (BAA/HIPAA), not a
  parallel PHI system.
- `policy_version` + `contract_hash` — so contract changes are tracked and re-validation is forced.

`agent_readiness_status` enum (extend the draft): `not_reviewed / committed_not_indexed /
agent_ready / restricted / quarantined / blocked / retired`.

---

## PR-0 — Best-in-class target data architecture _(design-first; precedes PR-1)_

Design the target context/corpus data model BEFORE the contract + migrations bind to it, so we
don't patch-then-redesign. Deliver `docs/governance/CONTEXT_CORPUS_DATA_ARCHITECTURE.md` (target
schema + ERD + the expand/contract migration path from today's tables) plus a current→target gap
map. The governance types (PR-1) and migrations (PR-3) MUST conform to this target.

**Best-in-class principles (the design must satisfy all):**

1. **Tenant isolation by construction** — `tenant_id` (clientId) on every context row; DB row-level
   security; corpus (industry) is shared but retrieval is tenant-scoped; zero cross-tenant joins.
2. **One canonical object model across all tenants** — SkyHarbor == Lakeshore == Meridian
   structurally; no per-tenant special-casing. Collapses the 3 bundle shapes into one.
3. **Layered pipeline with an explicit state machine** — raw/blob → parsed/structured (facts,
   records) → retrievable (chunks + FTS/Azure-AI-Search index) → validated reasoning bundle →
   cited output. Readiness: `committed → indexed → retrievable → cited`, each a tracked state.
4. **Provenance as first-class, append-only lineage** — source file → parse run → extraction →
   commit → index, immutable + auditable (build on `data_ingestion_runs`); provenance never
   stripped through any hop (the #3322 failure mode becomes a tested invariant).
5. **Cover-name canonicalization at the boundary** — real identities mapped to cover keys on
   ingest; real names never persisted in agent-usable layers; ops-only restricted mapping.
6. **Confidence + classification as data** — every object scored + classified, classification
   derived from `CANONICAL_TENANTS` compliance metadata (BAA/HIPAA).
7. **Retrieval-agnostic indexing** — Azure-native (Postgres FTS / Azure AI Search), pluggable; no
   lock-in to the blocked OpenAI/Pinecone embed path.
8. **Idempotent, replayable ingestion** — re-running a load never duplicates; deterministic
   backfills; every write traces to a run + owner.
9. **Versioned + reversible** — `policy_version` + `contract_hash`; schema evolution via
   expand/contract only; every migration additive with documented reverse SQL.
10. **Auditable end-to-end** — any cited claim traces DB row → run → source → confidence; any
    object's readiness traces to the probe that last verified it renders.

Acceptance: data-architecture doc + ERD + gap map + migration strategy committed; reviewed; no
code/data change yet. PR-1 types are generated to match this model.

## PR-1 — Policy + canonical contract _(sequential; first)_

Create the policy doc, both trackers, `src/lib/governance/context-corpus-policy.ts` (TypeScript
canonical types), Zod schemas, and controlled enums (industry, enterprise_area, function,
process_area, use_case_category, phase, classification, confidence, source_layer,
agent_readiness, retrievability, applicable_agents).

Policy must state the draft's rules **plus**: retrievability is Azure-native; `agent_ready`
requires end-to-end cite-render verification, not DB presence; classification derives from tenant
compliance metadata; the canonical bundle is the only shape agents consume.

Acceptance: policy doc + types + Zod + enums exist; `tsc` clean; both trackers initialized;
AGENTS.md references the policy.

## PR-2 — Inventory scanner (all current datasets) _(sequential)_

Scanner over: TS corpus seeds, generated pattern manifest, `pattern_packs`, `genome_patterns`,
`knowledge_sources`, `enterprise_context_chunks`, tenant data records, `data_inventory_records`,
`deliverables_v2`, `program_evidence_items`, `program_attachments`, move/program artifacts, source
event artifacts, KPI/financial/vendor/system records. **Iterate `CANONICAL_TENANT_KEYS`.**
Output `docs/governance/CONTEXT_CORPUS_INVENTORY_REPORT_2026-06-08.md` with the draft's breakdowns
**plus a `retrievability` column** and a per-tenant row for **every** canonical key (skyharbor-air
explicitly). Read-only; live-DB pass runs as an ACA job (emit the command if creds absent).

## PR-3 — Readiness fields + additive migration _(sequential)_

Additive columns only where missing (readiness/policy_validation/source_basis/confidence/
classification/applicable_agents/retrievability/policy_version). Dry-run report first (no writes);
deterministic backfill; objects missing critical fields → `not_reviewed`/`blocked`; committed but
not Azure-indexed → `committed_not_indexed` (NOT agent_ready); PHI/PII per compliance metadata →
`restricted`/`quarantined`. Reverse SQL documented. Backfill runs as an ACA job.

## PR-4 — CI validators _(sequential; the hard gate)_

Scripts wired into `scripts/ci/` + a new `.github/workflows/context-corpus-governance.yml`
(mirror `architecture-rules.yml`): `validate:context-corpus`,
`:tenant-coverage`, `:agent-readiness`, `:duplicates`. Fail CI on the draft's conditions **plus**:
object `agent_ready` but `retrievability ∈ {not_indexed, committed_not_indexed}`; provenance not
carried end-to-end; a canonical tenant absent from coverage; an **expired** entry in the
exception file. Exception file (`docs/governance/policy-exceptions.json`): owner + reason + expiry

- remediation PR, **CI fails on expiry**; no permanent blanket exceptions. CI also reads the JSON
  tracker and fails if a previously-green gate regresses.

## PR-5 — Runtime bundle enforcement _(after PR-4; parallel with PR-7)_

`buildValidatedAgentContextBundle(...)` in `src/lib/governance/` that **subsumes `AskSource[]` /
`CompositionBundle` / `ContextBundle`** into one canonical bundle and is the `retrievalBundle`
inside a `DecisionReasoningRequest` spine. It: calls retrieval → enforces policy → **filters out
blocked/quarantined/non-agent_ready at query time** (runtime defense-in-depth, so ungoverned rows
can't reach Claude even if they exist) → includes restricted only when user/agent/action allows →
returns source basis, confidence, missing context, blocked context, and a pass/warn/block result
before the model call. Migrate Sentinel → Nexus → Source → Atlas → Tower. Tests: blocked objects
never enter model input; missing context surfaces (warn/block, no hallucination).

## PR-6 — Apply + tenant coverage report _(after PR-5)_

`docs/governance/CONTEXT_CORPUS_TENANT_COVERAGE_REPORT_2026-06-08.md` with the draft's per-tenant
table **plus an end-to-end column**: for each canonical tenant, a probe that signs in and confirms
DB→retrieval→bundle→**visible citation** (the real SkyHarbor guarantee). No tenant silently
excluded; if `skyharbor-air` has no data, state "skyharbor-air present in CANONICAL_TENANTS but no
data found in <sources>" with search evidence — do not omit. Pass/fail by agent.

## PR-7 — Visible source/confidence output _(after PR-4; parallel with PR-5)_

**PR-7a is DONE** (Sentinel evidence drawer + gated warning, #3322, live). PR-7b: extend the same
contract to Nexus and any agent on `AgentDock`; emit selected context/patterns, source basis,
confidence, missing/blocked context, unsupported-claim flags, evidence-drawer-ready objects; tests
prove source objects are emitted and render-ready and that provenance survives retrieval→synthesis
→stream→UI (the #3322 failure mode).

## PR-8 — Future-dataset onboarding gate _(after PR-4)_

`docs/governance/NEW_DATASET_ONBOARDING_POLICY.md` + `DATASET_POLICY_MANIFEST_TEMPLATE.json`. Any
new dataset/corpus/client import (incl. the admin bulk-upload pipeline) must ship a policy manifest
validated against the Zod schema in CI; import scripts run validators before marking data
agent_ready; the setup/admin upload route writes policy metadata. Docs target future
Codex/Claude/Cursor agents. Validator rejects manifest-less datasets.

## Sequencing

**PR-0 (data-architecture design) first — it gates the contract + migrations.** Then
PR-1 → PR-2 → PR-3 → PR-4 sequential. PR-5 ∥ PR-7 after PR-4. PR-6 after PR-5. PR-8 after PR-4.
One PR per slice, target `main`, CI green before merge, update both trackers after each PR, output
PR#/merge-hash/validation/DB-status/next-action.

## Completion definition

All gates green in the JSON tracker; canonical types + Zod exist; scanner ran over all datasets;
readiness fields/migration applied (additive, reversible); validators run in CI; runtime bundle
enforcement live; tenant-coverage report covers **every** canonical key with end-to-end proof
(skyharbor-air explicit); visible source/confidence output; onboarding gate active; AGENTS.md
references the policy.

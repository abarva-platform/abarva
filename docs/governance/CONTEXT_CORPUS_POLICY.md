# AbarVa Context & Corpus Policy (v1.0.0)

Canonical, enforced policy for every context/corpus object used by any agent. Machine contract:
`src/lib/governance/context-corpus-policy.ts` (`GovernedObject` + Zod + `evaluateGovernedObject`).
Target model: `CONTEXT_CORPUS_DATA_ARCHITECTURE.md`. Applies to **all tenants, no exceptions**.

## Core rules

1. **No agent reasoning without a validated context bundle.** Claude/reasoning models never receive
   raw or ungoverned context. Every agent call uses `buildValidatedAgentContextBundle` (PR-5).
2. **No context bundle without policy validation.** Objects are filtered through
   `evaluateGovernedObject`; `block` objects never enter a bundle (runtime defense-in-depth).
3. **No recommendation without source basis + confidence.** `agent_ready` requires `source_basis`,
   `confidence_level`, `provenance`, an **indexed** `retrievability` (`fts_indexed`/`search_indexed`),
   and **end-to-end cite-render verification** (`cited_render_verified_at`). Claiming `agent_ready`
   while failing any of these is a **block** — this is the structural fix for "loaded but not
   indexed" (Lakeshore) and "indexed but not surfaced" (#3322).
4. **No artifact without phase, owner, evidence, and readiness status.**
5. **Tenant-private context cannot be promoted to reusable corpus without explicit curation.**
6. **PHI / PII / restricted content cannot enter shared corpus or an agent bundle** unless policy
   explicitly allows it for an authorized user/agent/action.
7. **Missing source / confidence / data / KPI surfaces as warn or block — never fabricated.**
8. **Tenant enumeration is code** (`CANONICAL_TENANT_KEYS`), never a hand-typed list. A `client_key`
   that isn't canonical or `corpus_global` is a block.
9. **Real client names never appear** in any agent-usable object or response. Cover names
   (`meridian-health`, `lakeshore-holdings`, …) are canonical; real identities are `restricted`,
   mapped at the ingest boundary, stored ops-only. CI + runtime leak checks enforce this.
10. **Future agents and Codex / Claude Code / Cursor tasks MUST follow this policy** — referenced
    from `AGENTS.md` (instruction gate) and enforced in CI (hard gate) + at runtime (filter).

## Readiness state machine

`uploaded → committed → indexed → retrievable → cite-render-verified`. Only the last is
`agent_ready`. Other statuses: `not_reviewed`, `committed_not_indexed`, `restricted`,
`quarantined`, `blocked`, `retired`.

## Retrievability (Azure-native)

`not_indexed` / `committed_not_indexed` / `fts_indexed` (Postgres FTS) / `search_indexed`
(Azure AI Search; OpenAI `text-embedding-3-*` vectors). **No Pinecone.** Anthropic-only governs
reasoning, not embeddings.

## Enforcement layers

- **Instruction gate** — `AGENTS.md` references this policy (read by Codex AND Claude Code).
- **Build gate (CI)** — PR-4 validators (`validate:context-corpus*`) + a required workflow; iterate
  `CANONICAL_TENANT_KEYS`; exception file with CI-enforced expiry; machine tracker read on every run.
- **Runtime gate** — `buildValidatedAgentContextBundle` filters `block` objects before the model.

## Versioning

`POLICY_VERSION` (currently `1.0.0`) + per-object `policy_version` + `contract_hash`. Contract
changes bump the version and force re-validation. Schema evolution is expand/contract only,
additive, with documented reverse SQL.

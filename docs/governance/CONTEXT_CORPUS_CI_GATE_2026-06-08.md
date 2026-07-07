# Context & Corpus CI Gate (2026-06-08) — PR-4

The hard, static enforcement layer of the governance framework. It runs in CI
(`.github/workflows/context-corpus-governance.yml`) and cannot reach the private
Azure DB, so it enforces what is checkable from the repo alone. Live coverage /
readiness is proven by the ACA-job reports (PR-2 inventory, PR-3 backfill, PR-6
coverage).

## Why this exists

The directive was "enforcement should be strict … doesn't matter what agent
(Codex or Claude Code) works on new tasks." This gate is that mechanism: a future
change cannot quietly weaken the contract without a human seeing a red check.

## What it checks (`npm run validate:context-corpus`)

| Subcommand        | Fails the build when…                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `exceptions`      | `policy-exceptions.json` has an expired, malformed, duplicate, or non-canonical-tenant entry (CI-enforced expiry).                            |
| `tenant-coverage` | a governance module hand-types canonical tenant keys instead of importing `CANONICAL_TENANT_KEYS`.                                            |
| `agent-readiness` | runtime code mints `agent_ready` without routing through the policy contract (`evaluateGovernedObject` / `buildValidatedAgentContextBundle`). |
| `duplicates`      | a canonical enum (`AGENT_READINESS`, `RETRIEVABILITY`, …) is defined in more than one place.                                                  |

Each subcommand is independently runnable
(`npm run validate:context-corpus:<subcommand>`). The pure exception validator is
unit-tested (`src/lib/governance/__tests__/policy-exceptions.test.ts`).

## Time-boxed exceptions

Every exception is temporary and auditable. Add an entry to
`docs/governance/policy-exceptions.json`:

```json
{
  "id": "lakeshore-confidence-backfill",
  "rule": "missing_confidence",
  "scope": "lakeshore-holdings",
  "object_table": "enterprise_context_chunks",
  "object_id": null,
  "reason": "confidence backfill in flight; remove once PR-3 backfill completes",
  "granted_by": "anand",
  "granted_at": "2026-06-08",
  "expires_at": "2026-07-01"
}
```

- `rule` ∈ the `EXCEPTABLE_RULES` set in `src/lib/governance/policy-exceptions.ts`.
- `scope` ∈ a canonical tenant key, `corpus_global`, or `all` (broad scopes warn).
- `expires_at` in the past **fails CI** — exceptions cannot rot into permanence.
- Windows over 90 days warn; prefer the narrowest scope and shortest window.

The healthy default is an empty `exceptions` array.

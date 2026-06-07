# 2026-06-07-anthropic-first-party-egress-policy — Claude is first-party; default-allow

## Release ID

`2026-06-07-anthropic-first-party-egress-policy`

## Status

`candidate`

## Plain-English Summary

Under the Azure-native, Anthropic-only standard, Claude is the platform's sanctioned
**first-party** reasoning provider — not "external AI". This change makes the AI
egress policy treat Anthropic that way: a tenant gets Claude **by default**, gated
only by an explicit `allowClaude:false` opt-out and the data-class ceiling, instead
of being blocked by the `allowExternalAI` / `kernelOnlyMode` controls that exist to
govern genuinely third-party providers. Without this, the conservative default
(`allowClaude:false`, `kernelOnlyMode:true`, `maxDataClass:internal`) makes the egress
preflight **deny Claude**, so Sentinel/Nexus return the deterministic fallback for any
tenant not explicitly enabled — which today is most of them.

## Layer Impact

- `global-control-lane`: AI egress decision logic + the default tenant AI policy.
- `client-data-lane`: a migration sets `clients.ai_policy` default and enables Claude
  for all existing tenants (data + schema default change).

## Client Applicability

- All clients: Yes — every tenant is default-allowed Claude (first-party). A tenant
  can still be locked down with an explicit `allowClaude:false`.

## Changes Included

- `src/lib/integrations/ai-egress/policy.ts`:
  - `evaluateAiEgressPolicy`: new first-party Anthropic branch — `anthropic` is
    allowed when `allowClaude` is true and the data class is within the tenant max;
    it is no longer subject to `allowExternalAI` / `kernelOnlyMode` / redaction gates
    (those still govern Gamma and any other external provider).
  - `CONSERVATIVE_TENANT_AI_POLICY`: `allowClaude:false→true`,
    `kernelOnlyMode:true→false`, `maxDataClass:internal→confidential`.
- `supabase/migrations/20260607150000_anthropic_first_party_default_policy.sql`:
  flips the `clients.ai_policy` column default to the first-party policy and
  default-allows Claude for all existing tenants (merge; preserves other fields and
  any explicit `restricted` ceiling). Idempotent; additive over the base
  control-plane migration.
- `src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts`: updated to the new
  semantics (default allows Claude; deny only when `allowClaude:false`).
- `docs/architecture/AZURE_NATIVE_ANTHROPIC_STANDARD.md`: first-party policy note.

No Supabase use/fallback. No DNS/Vercel/account changes. No corpus/data-load changes.

## QA / Validation

- `jest` ai-egress + sentinel-reasoning suites → 5 suites / 29 tests pass.
- `npm run guard:reasoning` + `npm run audit:architecture-rules` → pass.
- `tsc --noEmit`: no new errors. ESLint clean. `release:check` → see PR CI.

## Rollout Plan

Merge to `main`. Apply DB migrations to Azure with `npm run db:migrate` (this needs
the base control-plane migration `20260522170000` too, which also creates the
`ai_egress_audit` / `tenant_policy_audit` tables the audit sink writes to). Redeploy
the Azure Container App from `main`. After that, Sentinel/Nexus synthesis runs on
Claude for all tenants.

## Rollback Plan

- Code: revert the PR — egress reverts to treating Anthropic under the external-AI
  gates and the conservative default denies Claude.
- Data: re-run an `UPDATE clients SET ai_policy = ai_policy || '{"allowClaude":false}'`
  (or restore the prior policy snapshot). The column/tables remain (non-destructive).

## Audit Evidence

- PR: `cursor/anthropic-first-party-egress-policy` → main.
- `ai_egress_audit` rows now show `policyDecision:"allow"` with reason
  "Anthropic is the sanctioned first-party reasoning provider" for tenant Claude calls.

## Known Gaps

- `restricted` data class still requires an explicit `maxDataClass:"restricted"` per
  tenant (intentional — confidential is the default ceiling).
- Making this true in running prod still requires the Azure `db:migrate` + Container
  App redeploy (ops).

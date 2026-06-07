# Provider / Audit Proof — 2026-06-07

This is the repeatable proof for the Anthropic provider migration. It is scoped
to the production answer-generation paths and their audit trail wiring.

## Command

```bash
npm run audit:provider-proof
```

## What the verifier proves

The verifier fails closed unless all of the following remain true:

| Area | Proof |
| --- | --- |
| Nexus free text | Uses `getAuditedAnthropicClient`; workflow `programs-nexus-free-text`; Claude model id present; no OpenAI answer-generation patterns. |
| Sentinel Ask synthesis | Uses `createIntelligenceAskAnthropicText`; workflow `intelligence-ask-synthesis`; no OpenAI synthesis runtime import. |
| Sentinel Ask runtime | Uses `getAuditedAnthropicClient`; requires `ANTHROPIC_API_KEY`; Claude model ids present; no OpenAI/GPT patterns. |
| Source Sentinel chat | Uses `getAuditedAnthropicClient`; workflow `source-sentinel-chat`; Claude model id present; no direct OpenAI path. |
| Anthropic preflight | Stamps `provider: 'anthropic'`, `route: 'anthropic-direct'`, loads tenant AI policy, and writes through `createSupabaseAiEgressAuditSink`. |
| Audit writer | Writes to `ai_egress_audit` through the broker monopoly and stamps `intendedTenantKey` / `resolvedTenantKey`. |
| Schema | `ai_egress_audit` includes provider/workflow/route/policy columns and provider/workflow recent indexes. |

## Latest static result

`npm run audit:provider-proof` passed locally on this branch and emitted JSON
showing all static checks as `pass`.

## Live audit-row confirmation

Static proof does not replace signed-in QA. After a Clerk-capable operator
exercises Nexus, Sentinel Ask, and Source chat, confirm runtime rows with:

```sql
select workflow, provider, route, model, policy_decision, count(*) as calls, max(created_at) as latest_call
from public.ai_egress_audit
where workflow in ('programs-nexus-free-text', 'intelligence-ask-synthesis', 'source-sentinel-chat')
  and created_at >= now() - interval '24 hours'
group by workflow, provider, route, model, policy_decision
order by workflow, latest_call desc;
```

Acceptance for the provider/audit gate:

- Each exercised workflow returns `provider = 'anthropic'`.
- Each row uses `route = 'anthropic-direct'`.
- `policy_decision` is `allow` for successful calls, or a deliberate policy
  denial with the expected reason if tenant AI policy blocks the call.
- `request_metadata` includes tenant stamping (`intendedTenantKey` and
  `resolvedTenantKey`) through the egress audit writer.

## Current limitation

Signed-in Azure QA is still blocked in this VM because Clerk secrets/session
material are absent. The live SQL above must be run after the signed-in QA in
`SIGNED_IN_AZURE_QA.md` is completed.

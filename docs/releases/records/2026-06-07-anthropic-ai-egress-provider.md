# 2026-06-07-anthropic-ai-egress-provider — Anthropic AI Egress Provider Audit

## Release ID

`2026-06-07-anthropic-ai-egress-provider`

## Status

`candidate`

## Plain-English Summary

Sentinel and Source LLM-backed flows now route their user-facing model generation through Anthropic audit paths so AI egress audit rows identify the provider as `anthropic`. Source artifact generation keeps its existing API URL for compatibility, but the model client, environment check, fallback wording, and prompt defaults now align to Anthropic.

## Layer Impact

- `global-control-lane`: Updates shared Source/Sentinel AI egress behavior and audit-provider provenance for all tenants using these model-backed workflows.
- Application route layer: Source artifact generation changes from the OpenAI preflight/client path to the Anthropic preflight/client path.
- Audit/control-plane layer: AI egress audit evidence for the affected Source workflow is expected to record `provider=anthropic`.

## Client Applicability

- All clients: Applies to tenants that use Sentinel reasoning, Source synthesis/chat, or Source artifact generation with live LLM configuration.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing runtime configuration still controls whether live model calls are available.

## Changes Included

- Source artifact generation route switches to `preflightAnthropicDirectClient` and Anthropic Messages API usage.
- Source artifact prompt registry default model changes to `claude-sonnet-4-6`.
- Source generation comments and fallback copy now refer to Anthropic rather than OpenAI.
- Static integration regression test added for Sentinel and Source AI egress provider wiring.

## QA / Validation

- Not run in this VM: focused integration validation is pending because
  `node_modules/` is absent in the current agent checkout.
- Not run in this VM: live `ai_egress_audit` verification requires configured
  Anthropic credentials, tenant data, and a signed-in QA path.

## Rollout Plan

Merge to `main` and deploy the application normally. No migration or manual data backfill is required; new AI egress rows written after deployment should carry the corrected provider metadata.

## Rollback Plan

Revert the application commit and redeploy. Existing audit rows remain immutable historical evidence; rollback only affects future Source artifact-generation calls.

## Audit Evidence

- PR URL after creation.
- Local validation output for the focused integration test.
- Runtime `ai_egress_audit` rows for `source-artifact-generate` and Sentinel workflows after deployment.

## Known Gaps

Live database verification requires configured Anthropic credentials and tenant data; this record covers code-level routing and local tests.

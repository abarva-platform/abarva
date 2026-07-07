## T187 — Anthropic prompt cache

Status: Done

Date: 2026-06-04

What was run

- `npx jest src/lib/integrations/ai-egress/__tests__/anthropic-prompt-cache.test.ts src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts src/lib/admin/__tests__/customer-admin-page-view-safety.test.ts src/lib/reasoning/__tests__/telemetry-backends-postgres.test.ts --runInBand`
- Live Anthropic prompt-cache probe with a short prompt
- Live Anthropic prompt-cache probe with a long repeated document context

Evidence files

- `jest-prompt-cache-and-telemetry.txt`
- `live-anthropic-prompt-cache.json`
- `live-anthropic-prompt-cache-long.json`

What passed

- Focused prompt-cache and telemetry tests passed.
- The long-form live Anthropic probe produced real provider usage metadata showing prompt-cache behavior:
  - first call: `cache_creation_input_tokens = 7193`
  - second call: `cache_read_input_tokens = 7193`
- Both calls used the same stable prompt-cache key and the same cacheable prompt prefix.

Important live findings

- The short initial live probe did not cross Anthropic's cacheable prefix threshold and returned `0` cache create/read tokens.
- The long repeated document-context probe did cross that threshold and produced the expected create-then-read pattern.

Closure note

- This row is closed for the control packet standard because the required live provider proof now exists and is captured in sanitized evidence.

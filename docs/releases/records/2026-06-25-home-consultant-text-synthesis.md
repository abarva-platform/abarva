# 2026-06-25-home-consultant-text-synthesis — Home Consultant Text Synthesis

## Release ID

`2026-06-25-home-consultant-text-synthesis`

## Status

`candidate`

## Plain-English Summary

Home/aVa no longer requires Claude to return strict JSON for consultant synthesis. AbarVa still builds the dimension dossier, rollups, artifacts, citations, gaps, and answer boundary deterministically. Claude now writes only the final user-facing consultant prose as plain text. Valid Claude text is selected; deterministic dossier prose remains the fallback for timeout, empty text, safety, grounding, tenant, raw-ID, or unsupported recommendation failures.

Follow-up from live proof: the 25K default token budget must use Anthropic streaming. The text-first composer now calls the audited client with `messages.stream(...).finalMessage()` so Claude can produce the long-form plain-text answer instead of tripping the non-streaming long-request guard.

Second live-proof hardening: cross-tenant validation now derives full tenant aliases from the canonical client registry instead of matching ordinary standalone words such as `Apex`, so valid consultant prose is not discarded by an over-broad leakage tripwire.

Third live-proof hardening: the Home answer renderer no longer rewrites `evidence supports` into the awkward visible phrase `source support supports`; renderer sanitization now uses `source context` when removing the word from user-facing Home prose.

Fourth live-proof hardening: the Home consultant composer now avoids and normalizes user-facing `evidence` / `rows` wording before the API response is selected, so the clean answer contract no longer depends on the React renderer to polish raw Claude prose.

## Layer Impact

- `global-control-lane`: Changes the shared Home KNOW answer synthesis path and feature-flagged Claude behavior for opted-in tenants.
- `client-data-lane`: No data mutation. The feature reads existing tenant dossier evidence.

## Client Applicability

- All clients: shared code path and deterministic fallback behavior.
- Specific clients: Claude text synthesis remains tenant-flagged for SkyHarbor and Lakeshore.
- Internal only: proof traces and QA bundles.
- Public/demo only: not applicable.
- Feature flag: `home_know_claude_synthesis`.

## Changes Included

- `src/lib/home/know/home-consultant-text-synthesis.ts`
- `src/lib/home/know/home-know-engine.ts`
- `src/lib/home/know/home-know-contract.ts`
- `src/app/api/home/know/ask/route.ts`
- `src/lib/features/registry.ts`
- `src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts`
- `src/components/home/know/HomeKnowAnswerRenderer.tsx`
- `src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx`
- `docs/home-know/HOME_CONSULTANT_TEXT_SYNTHESIS_PROMPT.md`
- `docs/home-know/HOME_CLAUDE_TEXT_OUTPUT_CONTRACT.md`
- `docs/home-know/HOME_JSON_CONTRACT_DEPRECATION.md`
- `docs/home-know/GOLDEN_QUESTION_TEXT_SYNTHESIS_PROOF.md`

## QA / Validation

- `npx jest src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts --runInBand`: pass, 12/12.
- Follow-up test assertion: the 25K default budget uses `messages.stream`, not non-streaming `messages.create`.
- Follow-up test assertion: `Apex Retail` is blocked as cross-tenant content, while ordinary `apex-level` wording is allowed.
- Follow-up renderer assertion: `loaded evidence supports` renders as `loaded source context supports`, not `source support supports`.
- Follow-up composer assertion: raw Claude prose containing `evidence` / `rows` is normalized before selection, and selected API prose cannot include those terms.
- `npx jest src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand`: pass, 27/27.
- `npx jest src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand`: pass, 39/39.
- `npx eslint src/lib/home/know/home-consultant-text-synthesis.ts src/lib/home/know/home-know-engine.ts src/lib/home/know/evaluate-home-consultant-synthesis.ts src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts src/app/api/home/know/ask/route.ts src/lib/features/registry.ts`: pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false --skipLibCheck`: not completed locally; interrupted after a long silent run. Production Docker/ACA build remains required before deployment and will exercise the build/type path.
- `npm run release:check`: pass.
- `npm run audit:control-plane-purity:check`: pass.
- PR CI: all required checks passed for PR #3951, #3953, and #3955 before merge.
- Signed-in SkyHarbor/Lakeshore API proof after ACA deploy: SkyHarbor 3/3 and Lakeshore 2/2 used `composer=claude_text_synthesis`, `fallbackUsed=false`, with no forbidden phrases.
- Signed-in SkyHarbor browser/UI proof after ACA deploy: Home Ask POST used `composer=claude_text_synthesis`, `fallbackUsed=false`; screenshot captured at `/tmp/home-consultant-live-ui-skyharbor-after-ask.png`.

## Rollout Plan

Merge to main after local gates, deploy through the approved Azure Container Apps lane, set the Home Claude env values, and run signed-in SkyHarbor/Lakeshore proof against `https://app.abarva.ai/home`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Azure Container Apps image deploy and env var update through approved ACA lane.
- Approved image digest: `sha256:b064138b5a96f95f18cfcdb7b8c4f24d39a70d49040c0e2b7d1297781c6dd8cd` for main SHA `876578e517de3d01bd7113c00898e075f6a826c8`.
- ACA runtime invariant: Active revision must use the digest-pinned image and receive 100% traffic.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: `HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED=true`, `HOME_KNOW_CLAUDE_OUTPUT_MODE=text`, `HOME_KNOW_CLAUDE_MAX_TOKENS=25000`, `HOME_KNOW_CLAUDE_TIMEOUT_MS=60000`.
- Live signed-in proof required: Yes.

## Rollback Plan

Redeploy the previous known-good ACA image or disable `HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED`. Deterministic Home dossier prose remains available without data migration.

## Audit Evidence

- Final API/browser payload: `/tmp/home-consultant-live-proof-876578e.json`
- Signed-in screenshot: `/tmp/home-consultant-live-ui-skyharbor-after-ask.png`
- ACA revision: `ca-abarva-web-lab-eastus--0000150`
- Image digest: `sha256:b064138b5a96f95f18cfcdb7b8c4f24d39a70d49040c0e2b7d1297781c6dd8cd`
- Health check: `https://app.abarva.ai/api/health` returned `ok=true`, `postgres=true`, `direct_postgres=true`, `azure_graph=postgres`.

## Known Gaps

No known runtime blocker. The renderer sanitizer follow-up requires one final deploy after the UI wording patch.

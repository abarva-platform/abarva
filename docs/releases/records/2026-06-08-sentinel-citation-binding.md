# 2026-06-08-sentinel-citation-binding — Surface Sentinel/Nexus evidence citations in the UI

## Release ID

`2026-06-08-sentinel-citation-binding`

## Status

`candidate`

## Plain-English Summary

Sentinel/Nexus answers were grounded in real, tenant-scoped evidence, but the UI threw
that evidence away and always showed "Citation gap: this AI output has no source citations
attached." Root cause (traced, not assumed): the `/api/intelligence/ask` server already
streams a `sources` event with full provenance (`AskSource{type,name,id,detail,url,confidence}`),
but the client stream reader only handled `delta`/`error`/`done` and silently dropped the
`sources` event, so the citation-gap banner — driven by a plain-text heuristic over prose the
synthesizer deliberately keeps citation-free — always fired. This binds the already-streamed
sources to the answer turn, renders an "Evidence basis" drawer, and suppresses the gap warning
only when real citations are present. Client-only; no server, retrieval, or data change.

## Layer Impact

Affects the **global-control-lane** app tier (shared `AgentDock` + Sentinel chat UI used by all
Intelligence/Nexus surfaces). No data-plane, schema, retrieval, broker, or auth change. The UI
renders only the sources the server already retrieved and tenant-scoped — tenant isolation is
unchanged (no new fetch, no policy change).

## Client Applicability

- All clients: any tenant whose Sentinel/Nexus answers carry retrieved sources now shows them.
- Specific clients: validated against Lakeshore Holdings.
- Feature flag: none (UI behavior; degrades safely — no citations ⇒ no drawer ⇒ honest gap warning).

## Changes Included

- `src/components/agent/EvidenceBasis.tsx` (new) — grouped evidence drawer (Client context / Corpus
  patterns / Industry & research); internal ids only in element title, never visible prose.
- `src/components/agent/AgentDock.tsx` — `citations?: AskSource[]` on `ChatMessage`; render
  `<EvidenceBasis>`; gate the citation-gap warning on `citations.length === 0`.
- `src/components/intelligence-v3/SentinelChat.tsx` — handle the `sources` stream event and bind it
  to the in-flight agent turn.
- `src/components/agent/__tests__/EvidenceBasis.test.tsx` (new) — grouping, count, and the
  no-raw-ids-in-prose rule.

## QA / Validation

- `npx jest src/components/agent/__tests__/EvidenceBasis.test.tsx` — **3/3 passed**.
- `npx tsc --noEmit` — **passed** (0 errors in changed files).
- `npx eslint` on the four changed files — **passed**.
- Browser proof on `app.abarva.ai` after ACA deploy: pending in this lane's final report.

## Rollout Plan

Merge to `main`; build the Azure image in ACR; deploy to Azure Container Apps by pinned digest;
shift 100% traffic only after the revision is healthy. No Vercel, no DNS change.

## Rollback Plan

Revert this PR (UI-only; no migrations, no data). The citation-gap warning falls back to the prior
prose heuristic; no data or retrieval state is affected.

## Audit Evidence

- `reports/lakeshore-sentinel-citation-hardening-2026-06-08/request-path-map.md` (the traced seam).
- PR URL + CI run (added on PR open).
- Post-deploy ACA revision/digest + signed-in Lakeshore screenshots (final report).

## Known Gaps

- The "0 proof points" footer is a separate read-model population task (`lakeshore-live.ts` hardcodes
  `proofPoints: []`) — out of scope here, flagged for a follow-up.
- The richer answer contract (explicit "what I'd do next" + structured missing-evidence) and the
  50-question QA scorecard + tenant-isolation probes are the next lanes in this hardening effort.

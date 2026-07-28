# 2026-07-28-knowledge-ava-dock-consistency — Knowledge vNext aVa dock consistency

## Release ID

`2026-07-28-knowledge-ava-dock-consistency`

## Status

`candidate`

## Plain-English Summary

Brings the Knowledge vNext aVa companion into line with the aVa chat experience used
across the other product modules (Intelligence, Source, Tower, Moves). Two changes:

1. **Window chrome** — the dock now supports the same modes as the app-wide dock:
   side rail, pinned-to-bottom strip, an expanded modal overlay (Esc/Return to
   restore), and a collapsed chip — with the mode remembered between visits.
2. **Rich answers** — aVa answers now render markdown, data **tables**, and **charts**
   using the *same shared renderer* Intelligence uses, instead of plain text. The
   fixture reasoning path emits evidence-bound exhibits (a table of the governed
   objects in view and a chart of their distribution by domain), grounded strictly in
   what is already in scope.

## Layer Impact

- **Products (layer 4) — UI/UX only.** Presentation consistency for the Knowledge
  companion. Not `client-data-lane`, not a data-plane change, not `public-demo`. The
  dock still talks only to the governed consumption runtime; no broker/auth/tenant
  coupling was introduced (the shared `AgentDock` chrome was replicated locally rather
  than imported, precisely to preserve the feature's data isolation). The shared answer
  *renderer* is reused as pure presentation — the answer content still comes only from
  the aVa reasoning path.

## Client Applicability

- All clients: No.
- Specific clients: No.
- Internal only: Yes — admin-only `/knowledge-preview` route, synthetic fixtures.
- Public/demo only: No.
- Feature flag: `home_knowledge_vnext` remains **default-OFF**.

## Changes Included

- `src/components/knowledge/vnext/AvaDock.tsx` — dock modes (side-rail / pin-bottom /
  expand overlay / collapsed chip), auto-grow / Enter-to-send / Shift+Enter composer,
  and rich answer rendering via the shared `AgentAnswerRenderer`.
- `src/components/knowledge/vnext/state.tsx` — `AvaDockMode` state + `abarva.agent-dock.
  knowledge-vnext.mode` persistence (shared-dock convention); `avaOpen` kept as a
  derived helper.
- `src/components/knowledge/vnext/KnowledgeShell.tsx` — rail on/off layout flag; drops
  the redundant topstrip reopen button (the collapsed chip replaces it).
- `src/components/knowledge/vnext/knowledge-vnext.css` — mode chrome styling.
- `src/components/knowledge/vnext/ava-answer-adapter.ts` (new) — maps the vNext
  `AvaAnswer` to the shared `AvaAnswerPacket` for the shared renderer (presentation
  adapter; no data crosses a governance boundary).
- `src/lib/knowledge/consumption-contracts/ava.ts` — `AvaAnswer` gains optional
  `artifacts` (shared exhibit types, type-only import).
- `src/lib/knowledge/consumption-client/ava-provider.ts` + `factory.ts` — the
  deterministic fixture provider gains an in-scope corpus and emits evidence-bound
  table/chart artifacts (only from packet-scoped refs; never fabricated).

## QA / Validation

- Unit tests: `npx jest src/lib/knowledge/consumption-client
  src/lib/knowledge/consumption-contracts src/lib/knowledge/operations-lens` → **66
  passed**. (Three unrelated legacy suites — tenant-data stub-adapter, context-broker
  pinecone-client, tenant-enterprise-context — fail pre-existing on placeholder creds
  and touch none of these files.)
- Typecheck: scoped `tsc --noEmit` over changed files → clean (full-project `tsc` OOMs
  locally; CI authoritative).
- Lint: `eslint` over all changed/new files → **0 problems**.
- Live visual proof (fixtures-only dev harness, since removed): verified the aVa answer
  renders **markdown + a data table (Object/Type/Domain/Status) + a recharts chart
  ("Objects in view by domain")** via the shared renderer; and all four dock modes —
  side-rail, expand overlay (Return/Esc restores), collapsed chip, pin-bottom fixed
  strip — with the mode persisted to `localStorage`.

## Rollout Plan

Merge to `main` via squash PR. **No runtime rollout / no deploy.** Admin-preview only;
flag OFF. Behind the HTTP provider, rich artifacts light up when the real aVa reasoning
path emits them (a foundation-lane capability); the renderer and chrome are already in
place with no further UI change required.

## Deployment Authority

Not applicable — mutates no Azure resource, deploy workflow, runtime image, worker job,
traffic, DNS, feature-flag default, or environment.

## Rollback Plan

Revert the squash commit. No schema, migration, data, or runtime state to unwind.

## Known Gaps

- **Live signed-in proof owed after activation.** Visual proof is fixtures-only; the
  governed HTTP-provider path (and real aVa artifacts) prove out after the foundation
  lane activates the baseline and the reasoning egress.
- **Fixture artifacts are illustrative-but-governed.** The deterministic provider
  exhibits objects-in-view / by-domain from the in-scope fixture corpus; the real
  reasoning path will emit richer, question-specific tables/charts.
- **`AvaSurface` not widened.** The adapter maps to surface `"home"` (chrome hidden)
  rather than adding a `"knowledge"` member to the shared enum, to avoid rippling
  exhaustive switches; revisit if a Knowledge surface is formally added.
- **Full-project local `tsc` OOMs**; typecheck verified scoped, CI authoritative.

## Audit Evidence

- PR URL: (to be filled on open)
- CI run: (to be filled on open)
- Test output: `66 passed` (see QA / Validation)
- Reference mapping: shared renderer `@/components/agent-answer/AgentAnswerRenderer`,
  shared dock contract `@/components/agent/AgentDock` (replicated, not imported).

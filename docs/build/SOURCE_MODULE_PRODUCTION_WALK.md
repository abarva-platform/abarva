# Source Module Production Walk · PR-SRC-H

Status: local development walk completed
Date: 2026-04-29 CT / 2026-04-30 UTC
Branch: docs/source-production-walk
Scope: Source module route walk, design-consistency verification, and release-readiness notes after PR-SRC-A through PR-SRC-G.

## Executive Verdict

The Source module now has the intended agent-centric shell for both standalone sourcing and program-spawned sourcing workflows.

- `/source` loads as a Sentinel-led portfolio canvas.
- `/source/events/apex-retail-ams-outsourcing-2026` loads as an event-specific Sentinel canvas.
- Stage navigation is visible on the event route.
- Sourcing stage packs S0-S7 are present.
- Sourcing artifact channel renderers are in place.
- Deterministic Source-local tool contracts are present.
- Programs-to-Sourcing handoff contract is merged into main.

This walk did not exercise live production auth, live model calls, durable database writes, or a Vercel production deployment. It verified the local application route shape and module integration boundary.

## Walk Environment

- App runtime: local Next.js dev server
- URL base: `http://127.0.0.1:3020`
- Browser method: Codex in-app browser session
- Auth state: local route access was not blocked by Clerk during this walk
- Corpus policy: no `PAT-SRC-*` corpus authoring was performed in this PR

## Route Results

| Route | Result | Evidence |
| --- | --- | --- |
| `/source` | PASS | Page loaded without auth block. Agent canvas region was present. Sentinel portfolio copy was visible. |
| `/source/events/apex-retail-ams-outsourcing-2026` | PASS | Page loaded without auth block. Event canvas region was present. Apex Retail event title and stage controls were visible. |

Observed event-route text included the Apex Retail sourcing event, the Sentinel event canvas, and the stage sequence: Plan, RFI, Shortlist, RFP/Q&A, Initial-Bid, BAFO, Selection, Award, Onboard.

## Design Consistency Checklist

| Check | Result | Notes |
| --- | --- | --- |
| Reuses AgentCanvas pattern | PASS | Portfolio and event routes use chat-dominant Source/Sentinel canvases rather than static list-first pages. |
| Preserves dual-mode Source model | PASS | Standalone `/source` and event-specific `/source/events/[eventId]` are both represented. |
| Keeps corpus separate from module | PASS | Module consumes sourcing doctrine; this PR did not author or mutate sourcing corpus patterns. |
| Uses Source-local contracts | PASS | Tools and handoff live under Source-specific modules and broker-facing contracts rather than direct graph/vector imports. |
| Supports reactive artifacts | PASS | Vendor cards, pricing benchmarks, contract clauses, BAFO scoreboards, walkaway signals, and stage progress artifacts are available through the Source reactive panel. |
| Supports Programs handoff | PASS | The merged handoff contract can spawn a sourcing event from program context and link a sourcing event back to a program. |
| Keeps app-tier sync boundary | PASS | Source module work avoids Programs UI rewiring and follows the shared AgentCanvas/canvas-continuity conventions. |

## Validation Evidence

Validation completed across the merged Source module PR series before this walk:

- PR-SRC-A: sourcing stage pack scaffold and S5 BAFO reference pack merged.
- PR-SRC-B: `/source` Sentinel portfolio AgentCanvas merged.
- PR-SRC-C: `/source/events/[eventId]` event canvas merged.
- PR-SRC-D: sourcing artifact channel and reactive panel merged.
- PR-SRC-E: deterministic Source-local tools contract merged.
- PR-SRC-F: Programs-to-Sourcing handoff contract merged.
- PR-SRC-G: remaining stage packs S0-S4 and S6-S7 merged.

Local browser walk completed after PR-SRC-F was merged and this branch was rebased onto current `origin/main`.

## Remaining Gaps

These are not failures of PR-SRC-H; they are the next production-hardening edges.

1. Production Vercel walk: repeat this check against a preview or production deployment with an approved Clerk test account.
2. Live agent invocation: exercise Source chat with tool-calling enabled and confirm artifact markers render through the reactive panel.
3. Durable write-back: connect stage advancement, vendor comparison, BAFO checks, and handoff events to the persistence/broker path when the app-tier persistence gate opens.
4. Tenant isolation smoke test: when vector/graph persistence is enabled, prove Source retrieval returns zero cross-tenant evidence with tenant filters applied.
5. Operator voice review: test whether Sentinel's current voice is sufficient for active sourcing orchestration or whether a separate Sourcer persona is needed.

## Release Recommendation

Ship the module scaffold behind the current application access controls. Treat it as a coherent demo-ready Source surface, not yet as a production sourcing system of record.

The next useful slice is a signed-in Vercel preview walk that exercises the Sentinel chat path and confirms artifact rendering from an actual agent response.

# 2026-05-26-packet-27-agent-intelligence-fixes — Packet 27 hand-off

## Release ID

`2026-05-26-packet-27-agent-intelligence-fixes`

## Status

`candidate`

## Plain-English Summary

Comprehensive Codex hand-off for the agent intelligence gaps surfaced by the 2026-05-26 dry-run audit. Four streams: G (Northstar named-entity fact chunks), H (retriever extension to structured tables), I (hallucination prevention via fact-fingerprint), J (demo-readiness checker). After all four land, the agent moves from "smart medtech consultant" tier to "your CIO's second brain" tier with proven hallucination prevention.

## Layer Impact

- `ops-release-lane`: adds the Codex hand-off brief for Streams G/H/I/J under `docs/build/`. Documentation-only lane impact — no runtime path, no schema, no tenant-data write in this PR. Downstream streams will land their own changes (Stream G touches client-data-lane via chunk loading; Streams H and I touch agent-reasoning-lane via retriever + synthesizer; Stream J touches ops-release-lane via the readiness checker).
- No other lane affected by THIS PR.

## Client Applicability

- All clients: yes — Streams H, I, J apply globally
- Specific clients: Northstar gets the new fact chunks via Stream G first; pattern extends to other tenants
- Internal only: yes — this packet is a Codex brief
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/build/PACKET_27_AGENT_INTELLIGENCE_FIXES.md`
- PR: this PR

## QA / Validation

- Packet specifies acceptance criteria for each stream: **passed** (self-review)
- Streams G + H + I + J are independent enough to run in parallel: **confirmed**
- Estimated effort: 1.5 days parallelized, 3-4 days serial: **realistic** based on similar prior packets

## Rollout Plan

Merge to `main`. Codex picks up Streams G/H/I/J in parallel worktrees. Re-run the agent intelligence audit after all four land. Target: zero hallucinated answers, ≥ 7/10 grounded answers on demo questions.

## Rollback Plan

Revert this PR (documentation only, no runtime impact).

## Audit Evidence

- Triggering audit results documented in Packet 27 body (4 questions, 1 hallucination, 3 honest confessions, all observed during the 2026-05-26 dry-run at 08:51 UTC)

## Known Gaps

- Streams G-J have not started yet; this packet is the brief.
- The hallucination on Q1 ("top 5 apps") is a HIGH-RISK demo behavior — coach the demo questions away from named-entity recall tomorrow until Stream G + Stream I land.
- Multi-tenant rollout of Stream G fact chunks is out of scope; will follow Northstar pattern after demo.
- Task #17 remains open.

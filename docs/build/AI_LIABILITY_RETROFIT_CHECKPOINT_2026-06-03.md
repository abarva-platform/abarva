# AI Liability Retrofit Checkpoint Manifest

Date: 2026-06-03
Status: candidate
Backlog: T251
Release lane: internal-admin

## What Changed

Added a single rollup checkpoint for the T231-T250 AI liability retrofit wave.
The checkpoint makes completion measurable by module and separates strict
`Done` status from in-progress implementation evidence.

## Included

- Canonical checkpoint:
  `docs/legal/AI_LIABILITY_RETROFIT_COMPLETION_CHECKPOINT.md`
- Catalog coverage:
  `docs/security/ai-surface-control-catalog.json`
- Runbook:
  `docs/runbooks/ai-liability-retrofit-checkpoint.md`
- Verifier:
  `scripts/ai-liability/verify-retrofit-completion-checkpoint.mjs`
- Release record:
  `docs/releases/records/2026-06-03-ai-liability-retrofit-checkpoint.md`

## Current Snapshot

- Strict completion: 11 / 20 rows = 55%.
- Weighted execution signal: 15.5 / 20 = 77.5%.
- Not-started blockers: none.
- In-progress rows needing durable evidence: T238, T240, T242, T243, T244,
  T245, T247, T248, T250.

## Boundary

This slice adds a checkpoint, runbook, verifier, and release evidence. It does
not mark T251 `Done`, does not change product runtime behavior, and does not
claim pilot completion.

T251 remains `In progress` until every row in T231-T250 is `Done` with
implementation or accepted external evidence.

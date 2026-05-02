# AbarVa Canonical Vision Package — 2026-05-02

This folder is the in-repository copy of the locked canonical vision package supplied on 2026-05-02.

## Execution Posture

Codex lanes are authorized to execute continuously against these briefs. The briefs replace review-first behavior with understand-then-execute behavior: read the lock, sequence by dependency, update `docs/build/session-coordination/EVENT_LOG.md`, run standard checks, open and merge PRs when green, and surface only true blockers.

## Documents

| File | Role |
| --- | --- |
| `INTELLIGENCE_CANONICAL_DESIGN_V2.html` | Locked V2 product/design spine: Atrium pattern, three substrates, two outcomes, seven Intelligence submenus, metric gap engine. |
| `ATRIUM_PATTERN_CROSS_MODULE_BRIEF.html` | Cross-module Atrium contract for Home, Setup, Strategic Moves, Source, Intelligence, and Tower. |
| `METRICS_CORPUS_AUTHORING_BRIEF.html` | Knowledge-layer authoring contract for structured `PAT-MET-*` metric records. |
| `CODEX_HANDOFF_NEW_VISION_REVIEW.html` | Continuous execution authorization and sequencing discipline for Codex lanes. |

## First Executable Slice

This import is paired with code-level contracts for the Atrium registry and the initial structured metrics corpus foundation. The package is source of truth; code and tests should enforce it rather than leaving it as passive documentation.

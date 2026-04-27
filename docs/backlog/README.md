# AbarVa Master Backlog

_This is the canonical backlog for the Nexus procurement intelligence platform. Last updated: 2026-04-26 | Wave 21 complete | BLG1_

---

## Quick Reference

| What you need | Where to find it |
|---|---|
| Product overview and strategic direction | `MASTER_PLAN.md` |
| All slices in one place | `BACKLOG_INDEX.md` |
| How to run a wave | `BACKLOG_EXECUTION_PROTOCOL.md` |
| How the build system works | `BACKLOG_OPERATING_MODEL.md` |
| Track details (by surface) | `tracks/NN-<name>/BACKLOG.md` |
| Wave specs (by wave) | `waves/WAVE-NN-<name>.md` |
| Current status summary | `BACKLOG_STATUS_SUMMARY.md` |
| Wave roadmap (20-30) | `WAVE_ROADMAP.md` |
| Founder review checklist | `BACKLOG_FOUNDER_REVIEW_CHECKLIST.md` |
| Slice template | `BACKLOG_SLICE_TEMPLATE.md` |
| Wave template | `BACKLOG_WAVE_TEMPLATE.md` |
| Prompt library | `BACKLOG_PROMPT_LIBRARY.md` |

---

## How This Backlog Is Organized

### Tracks (13 total)

Tracks are functional areas of the product. Each track has a `BACKLOG.md` that documents:
- What the track owns
- Current state vs target state
- All slices (work items) for that track with status
- Per-slice specs for backlog items

| Track | Name |
|---|---|
| 00 | Executive Summary + Master Roadmap |
| 01 | Brand + Design System |
| 02 | Page Experience + Shell |
| 03 | Programs Flagship |
| 04 | Source Commercial |
| 05 | Intelligence + Control Tower |
| 06 | Admin + Readiness + Architecture |
| 07 | Data Trust + Evidence |
| 08 | Agent Runtime + Model Gateway + Tools |
| 09 | SaaS + Azure + Private Data Plane |
| 10 | Demo + QA + Production Hardening |
| 11 | Solution Intelligence + Pattern Library |
| 12 | Build Ops + Orchestration |

### Waves (execution units)

A wave is a set of slices executed together. Each wave has a spec file in `waves/`.

Current waves: 20 (completed), 21 (merged), 22-26 (planning)

### JSON Registries

- `docs/build/build-slices.json` — All slices with status
- `docs/build/build-waves.json` — All waves with status and completed slices
- `docs/build/production-readiness.json` — Component-level production readiness
- `docs/backlog/backlog-registry.json` — Backlog-native slice + wave index

---

## Critical Rules for All Agents

1. **DOCS ONLY in this directory** — No app code, no migrations, no seeds in `docs/backlog/`
2. **Never set `production_ready: true`** — requires founder review
3. **Never `git add .`** — stage files explicitly by name
4. **Never skip the hygiene gate** — `bash scripts/integration/hygiene_gate.sh --skip-build` must pass 11/11
5. **Always output `LANE-SHA: <sha>`** as the last line of every lane report
6. **No teal (#14B8A6), no cyan, no sparkle emoji (✨)** — forbidden design tokens
7. **No fabricated dollar amounts or percentages** — only cite what the source data supports
8. **AbarVaLogo.tsx is canonical** — never hand-code the logo
9. **No `any` TypeScript type** — use proper types
10. **Design is locked** — never change colors/fonts/layout without explicit founder instruction

---

## Current State (Wave 21)

- **Waves merged**: 21 waves complete
- **Demo-ready surfaces**: Programs, Source, Intelligence, Tower, Admin
- **Primary demo tenant**: Apex Retail (rich data)
- **Overall production readiness**: ~24%
- **Next priority wave**: Wave 22 (Programs Polish)

For the full status breakdown, see `BACKLOG_STATUS_SUMMARY.md`.

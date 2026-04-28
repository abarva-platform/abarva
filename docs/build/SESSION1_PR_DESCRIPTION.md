# Session 1 Specs · PR Description

## Deliverables

- `VERCEL-SETUP-SPEC` · [VERIFICATION_INFRASTRUCTURE_SPEC.md](/Users/anand/Projects/nexus/docs/build/VERIFICATION_INFRASTRUCTURE_SPEC.md) · **3,484 words**
- `PROG-SPEC` · [PROGRAMS_BUILD_SPEC.md](/Users/anand/Projects/nexus/docs/build/PROGRAMS_BUILD_SPEC.md) · **3,222 words**
- `SET-SPEC` · [SETUP_BUILD_SPEC.md](/Users/anand/Projects/nexus/docs/build/SETUP_BUILD_SPEC.md) · **2,760 words**
- `INT-I0` · [AUDIT.md](/Users/anand/Projects/nexus/docs/build/intelligence/AUDIT.md), [WAVE_ROADMAP.md](/Users/anand/Projects/nexus/docs/build/intelligence/WAVE_ROADMAP.md), [WAVE-I1-PLAN.md](/Users/anand/Projects/nexus/docs/build/intelligence/WAVE-I1-PLAN.md) through [WAVE-I7-PLAN.md](/Users/anand/Projects/nexus/docs/build/intelligence/WAVE-I7-PLAN.md), [JOURNAL.md](/Users/anand/Projects/nexus/docs/build/intelligence/JOURNAL.md) · **3,063 words total**
- `ORCH-UPDATE` · surgical addenda in [ORCHESTRATION_SPEC.md](/Users/anand/Projects/nexus/docs/build/ORCHESTRATION_SPEC.md) · version note plus targeted v1.1 updates only
- `JOURNAL-BACKFILL` · [JOURNAL.md](/Users/anand/Projects/nexus/docs/build/JOURNAL.md) · **638 words**

## Catalog entries documented

### Programs

`PRG-IDX-DEFAULT`, `PRG-IDX-EMPTY`, `PRG-IDX-FILTERED`, `PRG-FLW-ORIGINATE`, `PRG-DTL-P1`, `PRG-DTL-P2`, `PRG-DTL-P3`, `PRG-DTL-P4`, `PRG-DTL-P5`, `PRG-DTL-P6`, `PRG-STA-GATE-PENDING`, `PRG-MOD-GATE-APPROVE`, `PRG-MOD-CONTRADICTION`, `PRG-MOD-EVIDENCE-DRAWER`, `PRG-MOD-CUSTOM-ACTION`, `PRG-STA-PHASE-TRANSITION`, `PRG-STA-FILE-UPLOAD`, `PRG-STA-AGENT-HANDOFF`, `PRG-STA-SUGGESTED-ACTION`, `PRG-MOD-SCORECARD-OVERRIDE`

### Setup

`SET-IDX-CONN`, `SET-IDX-USR`, `SET-IDX-AUD`, `SET-IDX-POL`, `SET-IDX-TEN`, `SET-IDX-ARC`, `SET-DTL-CONN-DEGRADED`, `SET-DTL-CONN-HEALTHY`, `SET-FLW-CONN-RECONNECT`, `SET-FLW-USR-INVITE`, `SET-MOD-POLICY-REVIEW`

## Intelligence I0 scope

- Components audited: **27 TSX files** under `src/components/intelligence/**`
- Top-level directory entries observed: **20**
- Graph validation baseline captured: **76 RELATED_TO**, **14 APPLIED_IN**, **44 APPLICABLE_TO_TENANT**, **334 SOURCED_FROM**, with **0 errors** and **0 warnings**

## Change boundaries

- No production code files were modified
- No files outside `docs/**` were created or edited
- `ORCHESTRATION_SPEC.md` edits are surgical: top-level v1.1 note plus addenda in **§5**, **§9**, **§10**, and **§13**
- Journal backfill entries added: **25** rows covering PRs **#540 through #564**

## What this unblocks

Programs waves can start from a real per-module spec, Setup waves can start from a real connector/governance spec, Intelligence I1 can start from an explicit audit and roadmap, and the verification path is now documented well enough to stop relying on unverifiable smoke claims.

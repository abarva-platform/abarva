# DEMO1 - Boardroom Demo Script / Walkthrough

Slice ID: DEMO1
Slice name: Boardroom Demo Script / Walkthrough
Category: demo
Status: code_complete
Authored: 2026-04-26
Wave: wave-11 (Demo Readiness + Architecture Overview)
Primary agent: Lane B (demo-docs parallel pack)
Depends on: OPS9, ADM7, QA16, QA17, PROD6

## Purpose

DEMO1 creates the canonical boardroom demo script for AbarVa at
`docs/demo/ABARVA_BOARDROOM_DEMO_SCRIPT.md`.

It answers a single founder-facing question:

> How do I run a 20-minute, 45-minute, or 90-minute boardroom demo
> that is honest about seed data, honest about deferrals, and still
> compelling to a CIO/CTO/CFO/CAIO audience?

DEMO1 is a documentation-only slice. It creates no source files, no
migration, and no test files. It does not deploy, does not call any
provider, does not poll Vercel or GitHub, and does not promote any
production-readiness component above its current honest status.

## What Changed

- New directory `docs/demo/` created.
- New boardroom demo script at `docs/demo/ABARVA_BOARDROOM_DEMO_SCRIPT.md`
  (this slice's primary deliverable).
- New slice contract at `docs/build/slices/DEMO1_BOARDROOM_DEMO_WALKTHROUGH.md`
  (this file).
- Append-only update to `docs/build/build-slices.json` recording the
  DEMO1 slice entry at status `code_complete`.
- Conservative union-update to `docs/build/production-readiness.json`:
  notes appended to `validation_qa` and `production_deployment` components;
  no status fields changed.
- New wave-11 entry appended to `docs/build/build-waves.json` for the
  Demo Readiness + Architecture Overview wave; no existing wave entries
  modified.

## Files Created

| File | Description |
|------|-------------|
| `docs/demo/ABARVA_BOARDROOM_DEMO_SCRIPT.md` | Comprehensive boardroom demo script with 20/45/90-min versions |
| `docs/build/slices/DEMO1_BOARDROOM_DEMO_WALKTHROUGH.md` | This slice contract |

## Files Modified (JSON updates only)

| File | Change |
|------|--------|
| `docs/build/build-slices.json` | DEMO1 entry appended |
| `docs/build/production-readiness.json` | Notes appended to `validation_qa` and `production_deployment` components |
| `docs/build/build-waves.json` | `wave-11` entry appended |

## Demo Script Coverage

The boardroom demo script at `docs/demo/ABARVA_BOARDROOM_DEMO_SCRIPT.md`
covers:

### Story Arc

```
Home → Admin/Setup → Production Readiness → Programs → Program Workshop Mode
  → Meeting Notes / Proposed Updates → Deliverables / Artifact Canvas
  → Intelligence Patterns → AI Control Tower → Solution Intelligence
  → Data Trust / Private Data Plane narrative → Close / Ask
```

### Three Demo Versions

- **20-minute Sprint:** Home → Admin → Programs → Intelligence → Tower → Close.
  Audience: time-boxed C-suite first meeting.
- **45-minute Standard:** Full story arc including Workshop Mode, Deliverables,
  and Solution Intelligence. Audience: champion meeting, detailed evaluation.
- **90-minute Founder / Deep Dive:** Full arc plus architecture deep dive,
  enterprise trust narrative, and Azure private data plane pitch.
  Audience: technical co-evaluation, pilot scoping.

### Enterprise Trust Narrative

The script documents the four trust pillars:
1. Governed Intelligence Fabric (no-fabrication, basis declarations)
2. Human-in-the-Loop by Design (gate sign-off, deliverable approval)
3. Audit by Default (immutable audit ledger, per-tenant, exportable)
4. Tenant Isolation (TEN2/TEN4 envelope at every read path)

### Azure / Private Data Plane Narrative

The script covers three deployment postures with explicit what-to-claim
and what-NOT-to-claim guardrails:
1. Hosted (AbarVa-managed on Azure)
2. Azure VNet Private Data Plane (customer subscription, customer-managed keys)
3. Air-gapped / On-premises (future, directional only)

### Close / Ask Framework

The script includes a structured pilot offer (90-day governed pilot):
- Tenant setup
- Seed program onboarding
- Live workshop run (one phase)
- Intelligence baseline (first Sentinel brief)
- Control Tower review (first Atlas executive brief)
- Governance posture report

### Honesty Framework

Every demo stop includes:
- What to show / click
- What NOT to claim (explicit guardrails)
- Known caveats (seed data only, no live LLM in demo environment,
  read models not live, deferred capabilities named explicitly)

The script includes a full caveats summary table mapping every major
surface to its current state and GA target.

## Validation Status

code_complete — documentation only, no TypeScript or build artifacts.

Validation commands:
- `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); console.log('slices json ok')"`
- `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-waves.json','utf8')); console.log('waves json ok')"`
- `node -e "JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('prod-readiness json ok')"`
- `npx tsc --noEmit --pretty false`

## What This Slice Does NOT Do

- Does not create source files, migrations, or test files.
- Does not deploy.
- Does not poll Vercel or GitHub.
- Does not call any model provider.
- Does not promote any production-readiness component status.
- Does not modify auth, supabase, migrations, or runtime code.
- Does not change build configuration.
- Does not push to remote or open a PR.

## Cross-References

- OPS9 — Build Run Retrospective (informed the accomplishments and deferrals
  sections of the demo script).
- ADM7 — Admin Surface Completeness (informed the Admin/Setup demo stop).
- QA16 — Production Readiness Promotion Gate (informed the Production
  Readiness demo stop).
- ACT6 / ACT8 / ACT11 / ACT12 — AI Control Tower slices (informed the
  Tower demo stop).
- I7 / I8 — Intelligence depth slices (informed the Intelligence demo stop).
- TEN4 / CLOUD6 / TRUST4 — Enterprise trust + data plane slices (informed
  the Azure/private data plane narrative).

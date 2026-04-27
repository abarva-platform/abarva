# AbarVa Open Risk and Dependency Register

Date: 2026-04-26
Owner lens: Steward
Supporting lenses: Atlas, Nexus, Sentinel
Primary sources:
- `docs/build/production-readiness.json`
- `docs/planning/abarva-master-backlog/MASTER_PRODUCT_READINESS_MAP.md`
- `docs/planning/abarva-master-backlog/EIGHT_HOUR_THREE_DAY_PILOT_ROADMAP.md`
- `docs/backlog/BACKLOG_STATUS_SUMMARY.md`

## Purpose

This register is the founder-facing ledger of what can still go wrong, what is blocked, and what must be true before the product can move from deterministic demo strength toward controlled pilot readiness.

It is not a generic project-management list. It is designed for autonomous execution handoff and leadership review. Every item should answer one or more of these questions:

- What can stop the next slice from landing cleanly?
- What makes the current demo less credible than it looks?
- What prevents any pilot or production claim?
- Which risks are execution noise versus true product/system gaps?

## How to read this register

### Severity scale

- `critical`: blocks pilot or production claims directly
- `high`: materially weakens the flagship product path or causes serious execution risk
- `medium`: does not stop current progress, but will create rework or trust issues if ignored
- `low`: should be handled, but can follow higher-impact work safely

### Risk categories

- `execution`: sequencing, branch/PR, CI, tracker, or orchestration risk
- `demo_integrity`: the product can be shown, but the story can drift from reality
- `design_quality`: route, shell, visual, or workflow clarity risk
- `runtime_foundation`: persistence, gateway, audit, evidence, or ingestion risk
- `tenant_security`: auth, tenant boundary, or data-isolation risk
- `deployment_operability`: deploy truth, environment, or observability risk

## Founder summary

The current product does not have a "many small problems" posture. It has a "few major system blockers plus several manageable proof/clarity gaps" posture.

The major blockers are:

1. evidence and ingestion are not production-real,
2. audit/governance are not production-real,
3. model gateway/runtime controls are not production-real,
4. deploy truth and observability are not production-real.

The manageable gaps are:

- authenticated visual QA coverage,
- cross-surface Apex Retail storyline proof,
- some shell and route-consistency verification,
- and the continued discipline required to keep deterministic demo strength from turning into overclaiming.

## A. Active execution blockers

These are the risks most likely to disrupt autonomous backlog execution in the near term.

| ID | Category | Severity | Current condition | What it blocks | Owner | Immediate mitigation |
|---|---|---|---|---|---|---|
| EXE-01 | execution | high | Shared planning control-plane files (`backlog-registry.json`, `BACKLOG_CURRENT_STATE.md`, track files) create unavoidable overlap between summary slices | True parallel execution of planning/status items | Steward | Keep executive-summary and tracker items strictly serial |
| EXE-02 | execution | medium | Registry-driven scans are intentionally noisy because the registry stores validation command text and one future slice title contains a future-state keyword that the scan pattern also matches | Clean binary interpretation of the broad keyword scan | Steward | Treat the broad scan as a review signal, then run focused scans on the newly changed files |
| EXE-03 | execution | medium | Long-running GitHub checks can appear hung even when they are healthy | Premature manual intervention or unnecessary reruns | Steward | Verify actual run state before escalating; do not assume pending means failed |
| EXE-04 | execution | medium | The main checkout is dirty with unrelated work, so branch work must stay isolated | Safe staging and merge hygiene from the primary repo root | Steward | Continue to use the clean worktree and stage only approved files |
| EXE-05 | execution | medium | Control-plane reconciliation was needed because planning docs and actual merged mainline state drifted apart | Blind autonomous wave execution from stale metadata | Atlas | Keep registry and checkpoint updates attached to actual merged outcomes |

### Execution interpretation

These blockers are real, but they are manageable. They do not mean autonomy is failing. They mean autonomy has to stay disciplined about file scopes, actual merge evidence, and the difference between stateful planning files and ordinary docs.

## B. Demo-integrity risks

These are the risks that could make a founder or customer walkthrough feel more complete than the product really is.

| ID | Category | Severity | Current condition | What it blocks | Owner | Immediate mitigation |
|---|---|---|---|---|---|---|
| DEMO-01 | demo_integrity | high | Apex Retail is the strongest story, but not every linked route has screenshot-backed authenticated visual proof yet | High-confidence founder walkthrough on all flagship routes | Atlas | Complete authenticated route review before broadening the demo script |
| DEMO-02 | demo_integrity | high | Many Source and Programs surfaces are seeded and deterministic rather than live | Any claim of real-time, evidence-backed operating behavior | Nexus | Keep explicit seeded-data caveats visible and consistent |
| DEMO-03 | demo_integrity | medium | Intelligence and Control Tower are credible in deterministic form, but thinner than Source on tenant-specific richness | A uniformly strong multi-surface narrative | Sentinel / Atlas | Position these as emerging executive/intelligence surfaces, not fully live operations layers |
| DEMO-04 | demo_integrity | medium | Transition/value/approval themes can invite overclaiming because the product names them before the runtime exists | Founder or customer assumption that workflow automation is already operational | Steward | Keep future-only surfaces clearly advisory and avoid implied automation language |
| DEMO-05 | demo_integrity | medium | The product has many compelling deterministic panels, but demo choreography is still dispersed across docs and route knowledge | A crisp repeatable walkthrough by any operator | Atlas | Finish the demo storyline catalog and route order script |

### Demo-integrity interpretation

The product is strong enough to demo, but only when the operator is honest and deliberate. The current risk is not "the product is fake." The real risk is that a rich deterministic surface can be mistaken for a live operating workflow unless the walkthrough explicitly names what is seeded, proposed, blocked, or future-only.

## C. Design and route-quality risks

These are the risks that weaken trust through visual inconsistency, route ambiguity, or shell drift.

| ID | Category | Severity | Current condition | What it blocks | Owner | Immediate mitigation |
|---|---|---|---|---|---|---|
| DESIGN-01 | design_quality | high | Authenticated visual QA is not yet fully recorded on the most important routes | Strong founder confidence in route polish and shell correctness | Atlas | Execute the authenticated visual QA pass and capture concrete findings |
| DESIGN-02 | design_quality | medium | `VIS4` remains blocked because checklist enforcement still needs a narrower execution contract | Broader automated design-compliance expansion | Steward | Keep blocked until file-scope reconciliation is explicit |
| DESIGN-03 | design_quality | medium | `DESIGN1` remains blocked because Experience Gallery screenshot polish should follow real visual review rather than speculative refinement | More screenshot-driven gallery polish | Atlas | Defer until visual review proves the need |
| DESIGN-04 | design_quality | medium | Source is the flagship workflow, so any shell/nav inconsistency on Source routes disproportionately damages product trust | Clean flagship posture | Nexus | Keep route-shell verification and Source visual review high priority |
| DESIGN-05 | design_quality | low | Experience Gallery is useful internally, but can drift from active route reality if it becomes a detached mood board | Design-system trust | Atlas | Keep the gallery subordinate to actual product routes and canonical docs |

### Design-quality interpretation

The main visual risk is no longer "there is no design system." The system exists. The risk is that product routes and design authority may drift unless authenticated route review stays ahead of additional polish work.

## D. Runtime foundation blockers

These are the true blockers to pilot readiness and production credibility.

| ID | Category | Severity | Current condition | What it blocks | Owner | Immediate mitigation |
|---|---|---|---|---|---|---|
| RT-01 | runtime_foundation | critical | Evidence ledger remains contract-defined rather than tenant-bound and production-usable | Evidence-backed agent trust, decision traceability, safe pilot claims | Steward | Prioritize evidence ledger and ingestion planning before new live-agent claims |
| RT-02 | runtime_foundation | critical | Upload/parsing runtime is not implemented or certified | Real file-to-evidence workflow in Source and beyond | Steward | Keep uploads blocked until the MVP plan and trust rules are approved |
| RT-03 | runtime_foundation | critical | Model Gateway is not implemented as a live routed/audited control plane | Any production model-assisted agent behavior | Nexus | Keep all model-call expansion blocked behind gateway planning |
| RT-04 | runtime_foundation | critical | Audit/governance runtime is still scaffolded, not operational | Pilot safety, replay, policy review, compliance posture | Steward | Treat audit as a prerequisite control, not a follow-on nice-to-have |
| RT-05 | runtime_foundation | high | Source workflow persistence and artifact lifecycle execution are still deferred | Real multi-session operating behavior on the flagship product | Nexus | Keep Source additions bounded to deterministic read models until persistence is explicitly scoped |
| RT-06 | runtime_foundation | high | Admin-to-Source readiness backing is still a plan-level contract rather than a live operating path | Trustworthy readiness propagation from setup into Source | Steward | Prioritize the backing-plan slice before runtime readiness claims |

### Runtime-foundation interpretation

These are the blockers that matter most. They are the difference between "convincing deterministic workflow software" and "a system that can operate responsibly with real users and real data."

## E. Tenant, auth, and security risks

| ID | Category | Severity | Current condition | What it blocks | Owner | Immediate mitigation |
|---|---|---|---|---|---|---|
| TEN-01 | tenant_security | critical | Full live tenant-isolation proof does not exist across the eventual runtime stack | Pilot and production trust | Steward | Keep tenant checks explicit in every future runtime slice and route review |
| TEN-02 | tenant_security | high | The user has already raised concern that login should hard-lock to a single client with no cross-account visibility | Any ambiguity in account/client-scoping behavior | Steward | Treat client-lock and route-verification work as a separate approved lane; do not let demo assumptions stand in for real auth proof |
| TEN-03 | tenant_security | high | Source-specific tenant/security depth is not production-validated | Safe expansion of flagship Source behavior | Nexus | Keep Source promoted only as deterministic until tenant/runtime gates are complete |
| TEN-04 | tenant_security | medium | Admin and internal routes are valuable, but internal surfaces can still mislead if they imply capabilities the runtime does not enforce | Governance credibility | Steward | Keep internal wording precise and non-operational where required |

### Tenant/security interpretation

This is not a cosmetic category. If tenant and auth behavior are ambiguous, everything else becomes secondary. Any future autonomous work touching auth or client locking should remain an explicit human-approval boundary unless the slice is narrowly scoped and already defined.

## F. Deployment and operability risks

| ID | Category | Severity | Current condition | What it blocks | Owner | Immediate mitigation |
|---|---|---|---|---|---|---|
| DEP-01 | deployment_operability | critical | Production deployment truth is still blocked in the readiness manifest | Honest production posture | Steward | Keep deploy verification work separate from app-feature claims |
| DEP-02 | deployment_operability | high | Vercel checks are useful, but build/deploy truth still needs route, auth, DNS, and observability confirmation | Reliable founder answer to "is this deployed and usable?" | Steward | Continue separating merge state, preview state, and production state explicitly |
| DEP-03 | deployment_operability | high | Production observability and rollback confidence remain planning-level concerns | Safe pilot operation | Steward | Prioritize observability and deployment protocols before pilot-readiness claims |
| DEP-04 | deployment_operability | medium | Billing/CI issues recently interrupted check execution, proving the release system itself can become a blocker | Predictable autonomous merge velocity | Steward | Keep CI health visible and avoid assuming infrastructure friction is permanently solved |

### Deployment interpretation

The product can keep shipping code while still being far from operationally trustworthy in production. That distinction must remain explicit in every founder update.

## Dependency register

The next material dependencies are not abstract. They can be sequenced clearly.

### Near-term dependencies

1. `VIS2` depends on no runtime work, but it should happen before more visual polish claims.
2. `DEMO1` and `DEMO2` depend on route review evidence and benefit from `VIS2`.
3. `SRC42` and `SRC43` depend on current Source event-canvas stability and should follow visual proof, not precede it.
4. `ADM10`, `EVID1`, `EVID2`, and `PROD6` depend on planning clarity from the current executive-summary wave and should precede any pilot-language expansion.
5. `AGRT1` and later runtime/gateway planning depend on the evidence/governance story being explicit enough to constrain safe model behavior.

### Dependency chain to pilot credibility

The shortest honest chain is:

1. visual proof on flagship routes
2. coherent demo storyline
3. evidence/upload planning
4. admin-to-source readiness plan
5. model gateway and agent-runtime control planning
6. audit/governance hardening
7. authenticated route smoke and persona-walk protocols
8. deployment verification and observability discipline

If any one of steps 3 through 8 is missing, the pilot claim is still premature.

## Recommended mitigation order

### Order 1: keep execution safe

- preserve worktree isolation
- keep shared state files serial
- keep PR scopes literal

### Order 2: keep the demo honest

- complete visual QA
- complete the Apex Retail walkthrough artifacts
- keep deterministic disclaimers visible

### Order 3: attack the real blockers

- evidence/upload planning
- admin/source readiness backing
- model gateway planning
- audit/governance planning
- deployment verification planning

## What not to do

To reduce risk, the following moves should be avoided:

- do not add more seeded breadth instead of solving control-system gaps
- do not treat more UI panels as a substitute for evidence or audit
- do not soften wording around pilot or production readiness
- do not assume tenant safety from route existence alone
- do not let autonomous momentum overrun auth, security, or runtime boundaries

## Final judgment

The current product is not fragile in the sense of being directionless. It is fragile only if the team forgets which risks are merely execution friction and which risks are true system blockers.

Execution friction is manageable.

The real blockers are:
- evidence,
- ingestion,
- audit,
- gateway,
- tenant safety,
- and deploy truth.

As long as future waves keep those blockers visible and sequence work accordingly, AbarVa can keep moving quickly without confusing demo strength for operational readiness.

// Door 1 — existing-contract "Diagnose → Recover" — public surface.
//
// Same engine underneath both front doors (redesign brief §2): playbooks → value
// levers → deterministic math → deliverables. Door 1 is the no-RFP wedge that
// diagnoses leakage in a signed contract, quantifies a recoverable range, and
// recommends the play — escalating into Door 2 when a rebid is warranted.
//
// Coded against two existing contracts (the fact model + the archetype value-lever
// rules) plus one DECLARED interface, `ValueLeverResult` — the seam with the
// parallel evaluator slice (see the RECONCILIATION CONTRACT note in types.ts).

export * from './types';
export { evaluateLeverRule } from './evaluate';
export { diagnoseLeakage, isLeakageLever, leakageLeversFor } from './diagnose';
export { buildValueBridge } from './bridge';
export { recommendPlay } from './play';
export { resolveAnnualRunCost } from './run-cost';
export { buildBaseline, runSourceOptimization } from './optimize';

// Expert Kernel — shared phase-playbook types.
//
// `PhaseTrap` and `KillTrigger` are structurally identical across the
// Design & Plan and Mobilize phase playbooks, so they live here once. Each
// phase still defines its own specialized `PlaybookQuestion` / required-
// evidence shapes — those legitimately differ per phase and stay local.
//
// Pure type module: no runtime code.

/**
 * A named trap — a recurring mistake in a Moves phase and how the kernel
 * guards against it.
 */
export interface PhaseTrap {
  key: string;
  /** The trap, named. */
  trap: string;
  /** How the kernel guards against it. */
  guard: string;
}

/**
 * A named kill trigger — a condition under which a Moves phase says "stop".
 * Carries a fix-condition ("revisit when X is true", spec §5.2) so a stop is
 * never a dead end. Distinct from a business-case kill criterion: a trigger
 * is about Move readiness, not economics.
 */
export interface KillTrigger {
  code: string;
  /** The condition that fires the kill. */
  condition: string;
  /** The fix-condition — "revisit when X is true". Trust comes from saying no. */
  fixCondition: string;
}

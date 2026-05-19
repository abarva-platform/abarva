// Expert Kernel — human + agent RACI and decision-rights matrix.
//
// A Design & Plan deliverable. For each major decision and workstream in the
// Move, the matrix records who is Responsible / Accountable / Consulted /
// Informed — across BOTH humans and AI agents. The honesty rule is hard:
//
//   - Every decision has exactly one Accountable party.
//   - An AI agent may be Responsible (does the work) but NEVER Accountable for
//     a governance decision (funding, scope, go-live, kill). Accountability
//     for governance always rests with a named human.
//   - Agent autonomy is explicit, not assumed.
//
// Pure module: deterministic, no I/O.

/** A RACI role. */
export type RaciRole = 'responsible' | 'accountable' | 'consulted' | 'informed';

/** Whether a party is a human or an AI agent. */
export type PartyKind = 'human' | 'agent';

/** A party in the matrix — a named human or a named AI agent. */
export interface RaciParty {
  /** Stable id, e.g. 'sponsor_cio' or 'agent_solution_designer'. */
  id: string;
  /** Display name / title, e.g. 'CIO (Sponsor)' or 'Solution-Design Agent'. */
  name: string;
  kind: PartyKind;
}

/** The kind of decision — governance decisions cannot be agent-accountable. */
export type DecisionKind =
  | 'governance' // funding, scope, go-live, kill — human-accountable always
  | 'design' // architecture, sequencing — agent may assist heavily
  | 'delivery' // build execution — agent may be responsible
  | 'operational'; // run-time decisions

/** A decision or workstream the matrix assigns rights for. */
export interface RaciDecisionInput {
  /** Stable key, e.g. 'd_fund_move'. */
  key: string;
  /** The decision stated plainly. */
  decision: string;
  kind: DecisionKind;
  /** Party id → role assignments. A party may hold one role per decision. */
  assignments: { partyId: string; role: RaciRole }[];
  /**
   * For agent-Responsible decisions: the autonomy level. Required when an
   * agent is Responsible — autonomy is explicit, never assumed.
   */
  agentAutonomy?: 'assist' | 'recommend' | 'act_with_approval' | 'act';
}

export interface RaciMatrixInput {
  moveName: string;
  parties: RaciParty[];
  decisions: RaciDecisionInput[];
}

export interface RaciDecision extends RaciDecisionInput {
  /** The single accountable party id. */
  accountablePartyId: string;
  /** Resolved responsible party ids. */
  responsiblePartyIds: string[];
}

/** A violation of the RACI honesty rules — surfaced, never silently dropped. */
export interface RaciViolation {
  code: string;
  decisionKey: string;
  message: string;
}

export interface RaciMatrix {
  moveName: string;
  parties: RaciParty[];
  decisions: RaciDecision[];
  /** Honesty-rule violations. A non-empty list means the matrix is not valid. */
  violations: RaciViolation[];
  /** True when the matrix passes every honesty rule. */
  valid: boolean;
  /** Decisions where an AI agent is Responsible — the agent-autonomy surface. */
  agentResponsibleDecisions: RaciDecision[];
}

/**
 * Build and validate the human+agent RACI matrix. Throws on structural input
 * errors (unknown party, a party with two roles on one decision). Honesty-rule
 * violations are returned as `violations`, not thrown — they must be visible.
 */
export function buildRaciMatrix(input: RaciMatrixInput): RaciMatrix {
  if (input.decisions.length === 0) {
    throw new Error('A RACI matrix needs at least one decision.');
  }
  const partyById = new Map<string, RaciParty>();
  for (const p of input.parties) partyById.set(p.id, p);

  const violations: RaciViolation[] = [];

  const decisions: RaciDecision[] = input.decisions.map((d) => {
    const seenParties = new Set<string>();
    for (const a of d.assignments) {
      if (!partyById.has(a.partyId)) {
        throw new Error(
          `Decision '${d.key}' assigns unknown party '${a.partyId}'.`,
        );
      }
      if (seenParties.has(a.partyId)) {
        throw new Error(
          `Decision '${d.key}' assigns party '${a.partyId}' more than once.`,
        );
      }
      seenParties.add(a.partyId);
    }

    const accountable = d.assignments.filter((a) => a.role === 'accountable');
    const responsible = d.assignments.filter((a) => a.role === 'responsible');

    // Honesty rule 1 — exactly one accountable party.
    if (accountable.length === 0) {
      violations.push({
        code: 'raci_no_accountable',
        decisionKey: d.key,
        message: `Decision '${d.decision}' has no Accountable party.`,
      });
    } else if (accountable.length > 1) {
      violations.push({
        code: 'raci_multiple_accountable',
        decisionKey: d.key,
        message:
          `Decision '${d.decision}' has ${accountable.length} Accountable ` +
          'parties — accountability cannot be shared.',
      });
    }

    // Honesty rule 2 — no agent accountable for a governance decision.
    for (const a of accountable) {
      const party = partyById.get(a.partyId)!;
      if (party.kind === 'agent' && d.kind === 'governance') {
        violations.push({
          code: 'raci_agent_accountable_governance',
          decisionKey: d.key,
          message:
            `AI agent '${party.name}' is Accountable for governance ` +
            `decision '${d.decision}' — governance accountability must rest ` +
            'with a named human.',
        });
      }
    }

    // Honesty rule 3 — at least one responsible party.
    if (responsible.length === 0) {
      violations.push({
        code: 'raci_no_responsible',
        decisionKey: d.key,
        message: `Decision '${d.decision}' has no Responsible party.`,
      });
    }

    // Honesty rule 4 — an agent-Responsible decision must declare autonomy.
    const agentResponsible = responsible.some(
      (a) => partyById.get(a.partyId)!.kind === 'agent',
    );
    if (agentResponsible && !d.agentAutonomy) {
      violations.push({
        code: 'raci_agent_autonomy_undeclared',
        decisionKey: d.key,
        message:
          `Decision '${d.decision}' has an AI agent Responsible but no ` +
          'declared autonomy level — agent autonomy must be explicit.',
      });
    }
    // Honesty rule 5 — an agent on a governance decision may at most act
    // with approval; full autonomous 'act' on governance is forbidden.
    if (
      agentResponsible &&
      d.kind === 'governance' &&
      d.agentAutonomy === 'act'
    ) {
      violations.push({
        code: 'raci_agent_act_governance',
        decisionKey: d.key,
        message:
          `Decision '${d.decision}' grants an AI agent fully autonomous ` +
          "'act' on a governance decision — cap at 'act_with_approval'.",
      });
    }

    return {
      ...d,
      accountablePartyId: accountable[0]?.partyId ?? '',
      responsiblePartyIds: responsible.map((a) => a.partyId),
    };
  });

  const agentIds = new Set(
    input.parties.filter((p) => p.kind === 'agent').map((p) => p.id),
  );
  const agentResponsibleDecisions = decisions.filter((d) =>
    d.responsiblePartyIds.some((id) => agentIds.has(id)),
  );

  return {
    moveName: input.moveName,
    parties: input.parties,
    decisions,
    violations,
    valid: violations.length === 0,
    agentResponsibleDecisions,
  };
}

// PROG8 · Phase Gate Advancement Flow Contract tests.

import { readFileSync } from 'fs';
import { join } from 'path';

import {
  buildPhaseGateAdvancementProposal,
  evaluatePhaseGateReadiness,
  getBlockedPhaseGates,
  summarizePhaseGateAdvancements,
  type PhaseGateAdvancementProposal,
  type PhaseGateAdvancementStatus,
} from '@/lib/programs/phase-gate-advancement-flow';
import {
  CANONICAL_SIX_PHASES,
  type CanonicalPhase,
} from '@/lib/programs/programs-canonical-view';
import { buildAllProgramsSeedPlan } from '@/lib/programs/enhancement-seed-planner';

const plan = buildAllProgramsSeedPlan();

const ALL_STATUSES: ReadonlyArray<PhaseGateAdvancementStatus> = [
  'ready',
  'partially_ready',
  'blocked',
  'requires_waiver',
  'requires_review',
];

function buildAllProposals(): PhaseGateAdvancementProposal[] {
  const out: PhaseGateAdvancementProposal[] = [];
  for (const tenant of plan.tenants) {
    for (const program of tenant.programs) {
      for (const phase of CANONICAL_SIX_PHASES) {
        out.push(
          buildPhaseGateAdvancementProposal(
            tenant,
            program,
            phase as CanonicalPhase,
          ),
        );
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildPhaseGateAdvancementProposal · determinism', () => {
  it('returns deterministic output across repeated calls', () => {
    for (const tenant of plan.tenants) {
      for (const program of tenant.programs) {
        for (const phase of CANONICAL_SIX_PHASES) {
          const a = buildPhaseGateAdvancementProposal(
            tenant,
            program,
            phase as CanonicalPhase,
          );
          const b = buildPhaseGateAdvancementProposal(
            tenant,
            program,
            phase as CanonicalPhase,
          );
          expect(a).toEqual(b);
        }
      }
    }
  });

  it('produces byte-equal serialization across two builds', () => {
    const first = JSON.stringify(buildAllProposals());
    const second = JSON.stringify(buildAllProposals());
    expect(first).toBe(second);
  });

  it('every proposal carries createdFrom: deterministic_phase_gate_advancement_seed', () => {
    for (const proposal of buildAllProposals()) {
      expect(proposal.createdFrom).toBe(
        'deterministic_phase_gate_advancement_seed',
      );
    }
  });
});

// ---------------------------------------------------------------------
// Required field set / shape
// ---------------------------------------------------------------------

describe('PhaseGateAdvancementProposal shape', () => {
  it('every proposal carries the required field set', () => {
    for (const proposal of buildAllProposals()) {
      expect(typeof proposal.id).toBe('string');
      expect(proposal.id.length).toBeGreaterThan(0);
      expect(typeof proposal.tenantKey).toBe('string');
      expect(typeof proposal.tenantName).toBe('string');
      expect(typeof proposal.programCode).toBe('string');
      expect(typeof proposal.programSlug).toBe('string');
      expect(typeof proposal.programName).toBe('string');
      expect(proposal.fromPhase).toBeDefined();
      expect(proposal.fromPhase.index).toBeGreaterThanOrEqual(1);
      expect(proposal.fromPhase.index).toBeLessThanOrEqual(6);
      expect(proposal.gate).toBeDefined();
      expect([1, 2, 3, 4]).toContain(proposal.gate.index);
      expect(proposal.proposed).toBe(true);
      expect(ALL_STATUSES).toContain(proposal.advancementStatus);
      expect(proposal.stewardReadiness).toBeDefined();
      expect(Array.isArray(proposal.stewardReadiness.signals)).toBe(true);
      expect(Array.isArray(proposal.missingInputs)).toBe(true);
      expect(Array.isArray(proposal.evidenceRequirements)).toBe(true);
      expect(proposal.auditRequirement).toBeDefined();
      expect(proposal.recommendedNextAction).toBeDefined();
      expect(proposal.recommendedNextAction.label.length).toBeGreaterThan(0);
      expect(proposal.recommendedNextAction.routePath.length).toBeGreaterThan(
        0,
      );
      expect(proposal.recommendedNextAction.reason.length).toBeGreaterThan(0);
    }
  });

  it('proposal ids follow phase-gate-advancement:<tenantKey>:<programSlug>:p<phase>-g<gate> format', () => {
    for (const proposal of buildAllProposals()) {
      expect(proposal.id).toMatch(
        /^phase-gate-advancement:[a-z0-9-]+:[a-z0-9-]+:p[1-6]-g[1-4]$/,
      );
    }
  });

  it('proposal ids are unique across the portfolio', () => {
    const ids = buildAllProposals().map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------
// Proposed marker — never applied
// ---------------------------------------------------------------------

describe('proposed marker', () => {
  it('every proposal is marked proposed: true (no actual transitions)', () => {
    for (const proposal of buildAllProposals()) {
      expect(proposal.proposed).toBe(true);
    }
  });

  it('no proposal carries an applied / signed / transitioned literal', () => {
    for (const proposal of buildAllProposals()) {
      // Type-level: proposed is `true` literal. Belt-and-suspenders
      // check at runtime against accidental literal usage.
      const bag = proposal as unknown as Record<string, unknown>;
      expect(bag.applied).toBeUndefined();
      expect(bag.signed).toBeUndefined();
      expect(bag.transitioned).toBeUndefined();
    }
  });

  it('no string field claims the gate has been advanced / cleared / signed', () => {
    const advancedPattern = /\b(gate (advanced|cleared|signed)|phase advanced)\b/i;
    for (const proposal of buildAllProposals()) {
      const fields = collectStringFields(proposal);
      for (const f of fields) {
        expect(f).not.toMatch(advancedPattern);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Status coverage — all 5 status values represented
// ---------------------------------------------------------------------

describe('advancement status coverage', () => {
  it('all 5 PhaseGateAdvancementStatus values are represented across the portfolio', () => {
    const proposals = buildAllProposals();
    const seen = new Set<PhaseGateAdvancementStatus>();
    for (const proposal of proposals) {
      seen.add(proposal.advancementStatus);
    }
    for (const status of ALL_STATUSES) {
      expect(seen.has(status)).toBe(true);
    }
  });

  it('every advancementStatus value is one of the 5 canonical labels', () => {
    for (const proposal of buildAllProposals()) {
      expect(ALL_STATUSES).toContain(proposal.advancementStatus);
    }
  });
});

// ---------------------------------------------------------------------
// Blocked gates surface reason + waiver path
// ---------------------------------------------------------------------

describe('blocked gates surface reason + waiver path', () => {
  it('every blocked or requires_waiver proposal exposes at least one blocking signal or blocking missing input', () => {
    for (const proposal of buildAllProposals()) {
      if (
        proposal.advancementStatus !== 'blocked' &&
        proposal.advancementStatus !== 'requires_waiver'
      ) {
        continue;
      }
      const blockingSignals = proposal.stewardReadiness.signals.filter(
        (s) => s.state === 'blocking',
      );
      const blockingMissing = proposal.missingInputs.filter((m) => m.blocking);
      expect(blockingSignals.length + blockingMissing.length).toBeGreaterThan(
        0,
      );
    }
  });

  it('every requires_waiver proposal carries a non-empty waiverPathReason', () => {
    let sawWaiver = false;
    for (const proposal of buildAllProposals()) {
      if (proposal.advancementStatus !== 'requires_waiver') continue;
      sawWaiver = true;
      expect(proposal.waiverPathReason).not.toBeNull();
      expect(typeof proposal.waiverPathReason).toBe('string');
      expect((proposal.waiverPathReason ?? '').length).toBeGreaterThan(0);
      expect(proposal.recommendedNextAction.kind).toBe('invoke_waiver_path');
    }
    expect(sawWaiver).toBe(true);
  });

  it('non-waiver proposals have null waiverPathReason', () => {
    for (const proposal of buildAllProposals()) {
      if (proposal.advancementStatus === 'requires_waiver') continue;
      expect(proposal.waiverPathReason).toBeNull();
    }
  });

  it('getBlockedPhaseGates returns only blocked or requires_waiver proposals', () => {
    const proposals = buildAllProposals();
    const blocked = getBlockedPhaseGates(proposals);
    expect(blocked.length).toBeGreaterThan(0);
    for (const proposal of blocked) {
      expect(['blocked', 'requires_waiver']).toContain(
        proposal.advancementStatus,
      );
    }
  });

  it('getBlockedPhaseGates does not promote requires_review to blocked', () => {
    const proposals = buildAllProposals();
    const blocked = getBlockedPhaseGates(proposals);
    for (const proposal of blocked) {
      expect(proposal.advancementStatus).not.toBe('requires_review');
      expect(proposal.advancementStatus).not.toBe('partially_ready');
      expect(proposal.advancementStatus).not.toBe('ready');
    }
  });
});

// ---------------------------------------------------------------------
// Missing inputs explicit
// ---------------------------------------------------------------------

describe('missing inputs explicit', () => {
  it('every proposal targeting a real gate exposes at least one missing input', () => {
    for (const proposal of buildAllProposals()) {
      // Every canonical gate (G1..G4) names at least one missing input
      // because the canonical seed does not capture signature, CXO
      // interview, projected/realized value, or design-signoff events.
      expect(proposal.missingInputs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every missing input carries id, label, reason, and blocking flag', () => {
    for (const proposal of buildAllProposals()) {
      for (const mi of proposal.missingInputs) {
        expect(typeof mi.id).toBe('string');
        expect(mi.id.length).toBeGreaterThan(0);
        expect(typeof mi.label).toBe('string');
        expect(mi.label.length).toBeGreaterThan(0);
        expect(typeof mi.reason).toBe('string');
        expect(mi.reason.length).toBeGreaterThan(0);
        expect(typeof mi.blocking).toBe('boolean');
      }
    }
  });

  it('missing input ids are unique within a single proposal', () => {
    for (const proposal of buildAllProposals()) {
      const ids = proposal.missingInputs.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('blocked / requires_waiver proposals carry at least one blocking missing input or steward blocking signal', () => {
    for (const proposal of buildAllProposals()) {
      if (
        proposal.advancementStatus !== 'blocked' &&
        proposal.advancementStatus !== 'requires_waiver'
      ) {
        continue;
      }
      const blockingMi = proposal.missingInputs.filter((m) => m.blocking);
      const blockingSignals = proposal.stewardReadiness.signals.filter(
        (s) => s.state === 'blocking',
      );
      expect(blockingMi.length + blockingSignals.length).toBeGreaterThanOrEqual(
        1,
      );
    }
  });
});

// ---------------------------------------------------------------------
// Evidence requirements
// ---------------------------------------------------------------------

describe('evidence requirements', () => {
  it('every proposal exposes at least one evidence requirement', () => {
    for (const proposal of buildAllProposals()) {
      expect(proposal.evidenceRequirements.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every evidence requirement is honestly marked evidenceRegistryWired: false', () => {
    for (const proposal of buildAllProposals()) {
      for (const er of proposal.evidenceRequirements) {
        expect(er.evidenceRegistryWired).toBe(false);
      }
    }
  });

  it('every evidence requirement carries id, label, reason, and a structured kind', () => {
    const kinds = new Set([
      'document_capture',
      'cxo_interview_capture',
      'projected_value_capture',
      'realized_value_capture',
      'design_signoff',
      'charter_signature',
      'unknown',
    ]);
    for (const proposal of buildAllProposals()) {
      for (const er of proposal.evidenceRequirements) {
        expect(typeof er.id).toBe('string');
        expect(er.id.length).toBeGreaterThan(0);
        expect(typeof er.label).toBe('string');
        expect(er.label.length).toBeGreaterThan(0);
        expect(typeof er.reason).toBe('string');
        expect(er.reason.length).toBeGreaterThan(0);
        expect(kinds.has(er.kind)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Audit requirement always present
// ---------------------------------------------------------------------

describe('audit requirement always present', () => {
  it('every proposal carries an audit requirement', () => {
    for (const proposal of buildAllProposals()) {
      expect(proposal.auditRequirement).toBeDefined();
    }
  });

  it('audit requirement is honestly marked auditLogWired: false', () => {
    for (const proposal of buildAllProposals()) {
      expect(proposal.auditRequirement.auditLogWired).toBe(false);
    }
  });

  it('audit requirement signoff role is steward', () => {
    for (const proposal of buildAllProposals()) {
      expect(proposal.auditRequirement.signoffRole).toBe('steward');
    }
  });

  it('audit requirement names the canonical event types', () => {
    const allowed = new Set([
      'gate_advancement_proposed',
      'gate_advancement_evaluated',
      'steward_signoff_recorded',
      'evidence_capture_attached',
      'waiver_path_invoked',
    ]);
    for (const proposal of buildAllProposals()) {
      expect(
        proposal.auditRequirement.requiredAuditEvents.length,
      ).toBeGreaterThanOrEqual(4);
      for (const event of proposal.auditRequirement.requiredAuditEvents) {
        expect(allowed.has(event)).toBe(true);
      }
      // Always includes the four base events.
      expect(
        proposal.auditRequirement.requiredAuditEvents.includes(
          'gate_advancement_proposed',
        ),
      ).toBe(true);
      expect(
        proposal.auditRequirement.requiredAuditEvents.includes(
          'gate_advancement_evaluated',
        ),
      ).toBe(true);
      expect(
        proposal.auditRequirement.requiredAuditEvents.includes(
          'steward_signoff_recorded',
        ),
      ).toBe(true);
      expect(
        proposal.auditRequirement.requiredAuditEvents.includes(
          'evidence_capture_attached',
        ),
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Steward readiness
// ---------------------------------------------------------------------

describe('steward readiness', () => {
  it('every proposal exposes a steward readiness summary string', () => {
    for (const proposal of buildAllProposals()) {
      expect(typeof proposal.stewardReadiness.summary).toBe('string');
      expect(proposal.stewardReadiness.summary.length).toBeGreaterThan(0);
    }
  });

  it('readyCount + missingCount + blockingCount + deferredCount reconciles to signal count', () => {
    for (const proposal of buildAllProposals()) {
      const sum =
        proposal.stewardReadiness.readyCount +
        proposal.stewardReadiness.missingCount +
        proposal.stewardReadiness.blockingCount +
        proposal.stewardReadiness.deferredCount;
      expect(sum).toBe(proposal.stewardReadiness.signals.length);
    }
  });

  it('every steward readiness signal carries id, label, state, reason', () => {
    for (const proposal of buildAllProposals()) {
      for (const signal of proposal.stewardReadiness.signals) {
        expect(typeof signal.id).toBe('string');
        expect(signal.id.length).toBeGreaterThan(0);
        expect(typeof signal.label).toBe('string');
        expect(signal.label.length).toBeGreaterThan(0);
        expect(['ready', 'missing', 'blocking', 'deferred']).toContain(
          signal.state,
        );
        expect(typeof signal.reason).toBe('string');
        expect(signal.reason.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Recommended next action
// ---------------------------------------------------------------------

describe('recommended next action', () => {
  it('every proposal carries a recommended next action with non-empty fields', () => {
    for (const proposal of buildAllProposals()) {
      expect(proposal.recommendedNextAction.label.length).toBeGreaterThan(0);
      expect(proposal.recommendedNextAction.routePath.length).toBeGreaterThan(
        0,
      );
      expect(proposal.recommendedNextAction.reason.length).toBeGreaterThan(0);
      expect([
        'capture_missing_input',
        'resolve_blocker',
        'invoke_waiver_path',
        'request_steward_signoff',
        'review_gate_readiness',
      ]).toContain(proposal.recommendedNextAction.kind);
    }
  });

  it('recommendedNextAction.kind aligns with advancementStatus', () => {
    for (const proposal of buildAllProposals()) {
      const kind = proposal.recommendedNextAction.kind;
      switch (proposal.advancementStatus) {
        case 'ready':
          expect(kind).toBe('request_steward_signoff');
          break;
        case 'partially_ready':
          expect(kind).toBe('capture_missing_input');
          break;
        case 'blocked':
          expect(kind).toBe('resolve_blocker');
          break;
        case 'requires_waiver':
          expect(kind).toBe('invoke_waiver_path');
          break;
        case 'requires_review':
          expect(kind).toBe('review_gate_readiness');
          break;
      }
    }
  });
});

// ---------------------------------------------------------------------
// evaluatePhaseGateReadiness helper
// ---------------------------------------------------------------------

describe('evaluatePhaseGateReadiness', () => {
  it('returns the proposal status and signal counts', () => {
    for (const proposal of buildAllProposals()) {
      const evaluation = evaluatePhaseGateReadiness(proposal);
      expect(evaluation.status).toBe(proposal.advancementStatus);
      expect(evaluation.readyCount).toBe(
        proposal.stewardReadiness.readyCount,
      );
      expect(evaluation.missingCount).toBe(
        proposal.stewardReadiness.missingCount,
      );
      expect(evaluation.blockingCount).toBe(
        proposal.stewardReadiness.blockingCount,
      );
      expect(evaluation.deferredCount).toBe(
        proposal.stewardReadiness.deferredCount,
      );
      expect(evaluation.summary).toBe(proposal.stewardReadiness.summary);
    }
  });
});

// ---------------------------------------------------------------------
// Aggregate summary reconciliation
// ---------------------------------------------------------------------

describe('summarizePhaseGateAdvancements', () => {
  it('totalCount reconciles to the supplied list length', () => {
    const proposals = buildAllProposals();
    const summary = summarizePhaseGateAdvancements(proposals);
    expect(summary.totalCount).toBe(proposals.length);
  });

  it('byStatus reconciles to totalCount', () => {
    const proposals = buildAllProposals();
    const summary = summarizePhaseGateAdvancements(proposals);
    const sum = ALL_STATUSES.reduce(
      (acc, s) => acc + summary.byStatus[s],
      0,
    );
    expect(sum).toBe(summary.totalCount);
  });

  it('perTenant counts sum to totalCount', () => {
    const proposals = buildAllProposals();
    const summary = summarizePhaseGateAdvancements(proposals);
    const sum = summary.perTenant.reduce((acc, t) => acc + t.count, 0);
    expect(sum).toBe(summary.totalCount);
  });

  it('perGate counts sum to totalCount', () => {
    const proposals = buildAllProposals();
    const summary = summarizePhaseGateAdvancements(proposals);
    const sum = summary.perGate.reduce((acc, g) => acc + g.count, 0);
    expect(sum).toBe(summary.totalCount);
  });

  it('totalMissingInputs reconciles across proposals', () => {
    const proposals = buildAllProposals();
    const summary = summarizePhaseGateAdvancements(proposals);
    let mi = 0;
    let mib = 0;
    let er = 0;
    for (const p of proposals) {
      mi += p.missingInputs.length;
      mib += p.missingInputs.filter((m) => m.blocking).length;
      er += p.evidenceRequirements.length;
    }
    expect(summary.totalMissingInputs).toBe(mi);
    expect(summary.totalBlockingMissingInputs).toBe(mib);
    expect(summary.totalEvidenceRequirements).toBe(er);
  });

  it('summary on empty array is zeroed', () => {
    const summary = summarizePhaseGateAdvancements([]);
    expect(summary.totalCount).toBe(0);
    for (const status of ALL_STATUSES) {
      expect(summary.byStatus[status]).toBe(0);
    }
    expect(summary.totalMissingInputs).toBe(0);
    expect(summary.totalBlockingMissingInputs).toBe(0);
    expect(summary.totalEvidenceRequirements).toBe(0);
    expect(summary.perTenant.length).toBe(0);
    expect(summary.perGate.length).toBe(0);
  });

  it('perGate entries reference real canonical gates only', () => {
    const proposals = buildAllProposals();
    const summary = summarizePhaseGateAdvancements(proposals);
    for (const entry of summary.perGate) {
      expect([1, 2, 3, 4]).toContain(entry.gateIndex);
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// No fabrication
// ---------------------------------------------------------------------

describe('no fabrication', () => {
  it('no string field invents a dollar amount', () => {
    const dollarPattern = /\$\s?\d/;
    for (const proposal of buildAllProposals()) {
      const fields = collectStringFields(proposal);
      for (const f of fields) {
        expect(f).not.toMatch(dollarPattern);
      }
    }
  });

  it('no string field claims a real E-### evidence citation', () => {
    const eidPattern = /\bE-\d{2,}\b/;
    for (const proposal of buildAllProposals()) {
      const fields = collectStringFields(proposal);
      for (const f of fields) {
        expect(f).not.toMatch(eidPattern);
      }
    }
  });

  it('no string field claims an applied / signed transition', () => {
    const appliedPattern =
      /\b(transition (recorded|applied|completed|signed))\b/i;
    for (const proposal of buildAllProposals()) {
      const fields = collectStringFields(proposal);
      for (const f of fields) {
        expect(f).not.toMatch(appliedPattern);
      }
    }
  });
});

// ---------------------------------------------------------------------
// Module hygiene · no fake timestamps, no banned APIs, no banned imports
// ---------------------------------------------------------------------

describe('module hygiene · phase-gate-advancement-flow.ts', () => {
  const filePath = join(
    process.cwd(),
    'src/lib/programs/phase-gate-advancement-flow.ts',
  );
  const source = readFileSync(filePath, 'utf8');
  const codeOnly = source
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('does not call Date.now / Math.random / new Date', () => {
    expect(codeOnly).not.toMatch(/\bDate\.now\(/);
    expect(codeOnly).not.toMatch(/\bMath\.random\(/);
    expect(codeOnly).not.toMatch(/\bnew Date\(/);
  });

  it('does not call fetch', () => {
    expect(codeOnly).not.toMatch(/\bfetch\(/);
  });

  it('does not invoke Anthropic / OpenAI runtime', () => {
    expect(codeOnly).not.toMatch(/anthropic/i);
    expect(codeOnly).not.toMatch(/openai/i);
  });

  it('does not import Source UI', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/source\//);
    expect(codeOnly).not.toMatch(/from '@\/app\/\(maestro\)\/source\//);
  });

  it('does not import Sentinel / Atlas / Nexus / Agent runtime', () => {
    expect(codeOnly).not.toMatch(/from '@\/lib\/sentinel\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/atlas\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/nexus\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/agent\//);
    expect(codeOnly).not.toMatch(/from '@\/components\/agent\//);
  });

  it('does not import legacy /programs routes, mock.ts, auth, or supabase', () => {
    expect(codeOnly).not.toMatch(/from '@\/app\/programs\//);
    expect(codeOnly).not.toMatch(/from '@\/lib\/programs\/mock'/);
    expect(codeOnly).not.toMatch(/from '@\/lib\/auth\//);
    expect(codeOnly).not.toMatch(/from '@\/.*supabase/);
  });

  it('contains no placeholder strings', () => {
    expect(source).not.toContain('Coming soon');
    expect(source).not.toContain('TBD');
    expect(source).not.toContain('Lorem ipsum');
  });
});

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function collectStringFields(
  proposal: PhaseGateAdvancementProposal,
): string[] {
  const out: string[] = [
    proposal.id,
    proposal.tenantKey,
    proposal.tenantName,
    proposal.programCode,
    proposal.programSlug,
    proposal.programName,
    proposal.fromPhase.label,
    proposal.fromPhase.summary,
    proposal.gate.label,
    proposal.recommendedNextAction.label,
    proposal.recommendedNextAction.routePath,
    proposal.recommendedNextAction.reason,
    proposal.stewardReadiness.summary,
    proposal.auditRequirement.reason,
  ];
  if (proposal.toPhase) {
    out.push(proposal.toPhase.label);
    out.push(proposal.toPhase.summary);
  }
  if (proposal.waiverPathReason) {
    out.push(proposal.waiverPathReason);
  }
  for (const signal of proposal.stewardReadiness.signals) {
    out.push(signal.id, signal.label, signal.reason);
  }
  for (const mi of proposal.missingInputs) {
    out.push(mi.id, mi.label, mi.reason);
  }
  for (const er of proposal.evidenceRequirements) {
    out.push(er.id, er.label, er.reason);
  }
  return out;
}

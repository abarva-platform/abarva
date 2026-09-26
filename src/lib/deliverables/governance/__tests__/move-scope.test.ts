import {
  admitEvidence,
  type EvidenceAdmissionPolicy,
  type EvidenceCandidate,
  type GraphEdge,
  type MoveScope,
} from '../move-scope';

const scope: MoveScope = {
  moveId: 'MOVE-CC',
  version: 3,
  capabilityIds: ['CAP-VA'],
  programmeIds: ['PROG-CONTACT-KNOW'],
  systemIds: ['SYS-CRM', 'SYS-TELEPHONY'],
  dataDomains: ['transcripts'],
  businessFunctions: ['member_services'],
  accountableOwnerIds: ['OWNER-VP-MS'],
  vendorIds: [],
};

const policy: EvidenceAdmissionPolicy = {
  policyVersion: 'p2-current-state@1',
  artifactType: 'discovery_report',
  archetype: 'AI_PDLC',
  required: [
    { family: 'capability', minItems: 1, maxDepth: 0 },
    { family: 'operational_baseline', minItems: 3, requiredEvidenceKeys: ['kpi:aht'], maxDepth: 1 },
  ],
  permitted: [{ family: 'platform_risk', maxDepth: 1 }, { family: 'budget', maxDepth: 1, maxItems: 2 }],
  benchmark: [{ family: 'peer_programme', appendixOnly: true, mustBeLabelled: true }],
  excluded: ['unrelated_programme'],
  legalEdges: [
    { depth: 1, relationshipTypes: ['supports', 'runs_on'] },
    { depth: 2, relationshipTypes: ['feeds'] },
  ],
};

const edges: GraphEdge[] = [
  { fromId: 'SYS-CRM', relationshipType: 'supports', toId: 'RISK-CRM-LATENCY' },
  { fromId: 'SYS-TELEPHONY', relationshipType: 'supports', toId: 'BUDGET-TELEPHONY' },
  { fromId: 'RISK-CRM-LATENCY', relationshipType: 'feeds', toId: 'FAR-AWAY' },
  // A connection that exists but is not a legal edge type at any depth.
  { fromId: 'SYS-CRM', relationshipType: 'shares_vendor_with', toId: 'SYS-HR' },
];

const c = (over: Partial<EvidenceCandidate> & { evidenceId: string }): EvidenceCandidate => ({
  family: 'platform_risk',
  objectIds: [],
  ...over,
});

const admit = (candidates: EvidenceCandidate[], p = policy) =>
  admitEvidence({ scope, policy: p, candidates, edges, enterpriseAnchorFamilies: ['enterprise_profile'], enterpriseAnchorMaxItems: 2 });

describe('evidence admission', () => {
  it('admits a Move upload unconditionally, without needing a path', () => {
    // Tier A does not earn admission; it is the reason the Move has evidence.
    const [d] = admit([c({ evidenceId: 'up-1', family: 'anything_at_all', fromMoveUpload: true, uploadedAtPhase: 'P1' })]);
    expect(d.admitted).toBe(true);
    expect(d.admittedBy).toBe('move_upload');
    expect(d.reason).toContain('P1');
  });

  it('admits a record naming a declared scope object at depth 0', () => {
    const [d] = admit([c({ evidenceId: 'e-1', family: 'capability', objectIds: ['CAP-VA'] })]);
    expect(d).toMatchObject({ admitted: true, admittedBy: 'move_scope', traversalDepth: 0 });
  });

  it('admits a record one legal hop from scope, and records the path', () => {
    const [d] = admit([c({ evidenceId: 'e-2', objectIds: ['RISK-CRM-LATENCY'] })]);
    expect(d).toMatchObject({ admitted: true, admittedBy: 'named_object', traversalDepth: 1 });
    expect(d.traversalPath).toEqual([{ fromId: 'SYS-CRM', relationshipType: 'supports', toId: 'RISK-CRM-LATENCY' }]);
  });

  it('refuses a connection that exists but whose edge type is not legal', () => {
    // A depth budget alone would admit anything two hops away through any edge,
    // which in a richly connected tenant graph is most of the estate.
    const [d] = admit([c({ evidenceId: 'e-3', objectIds: ['SYS-HR'] })]);
    expect(d.admitted).toBe(false);
    expect(d.reason).toContain('no legal path');
  });

  it('refuses a record beyond the family maxDepth even on legal edges', () => {
    // FAR-AWAY is two legal hops out, but platform_risk is capped at depth 1.
    const [d] = admit([c({ evidenceId: 'e-4', objectIds: ['FAR-AWAY'] })]);
    expect(d.admitted).toBe(false);
    expect(d.reason).toContain('depth 1');
  });

  it('refuses an excluded family outright', () => {
    const [d] = admit([c({ evidenceId: 'e-5', family: 'unrelated_programme', objectIds: ['CAP-VA'] })]);
    expect(d.admitted).toBe(false);
    expect(d.reason).toContain('excluded by policy');
  });

  it('refuses a family that appears in no clause of the policy', () => {
    // Default is exclusion. Silence in the policy is not permission.
    const [d] = admit([c({ evidenceId: 'e-6', family: 'never_mentioned', objectIds: ['CAP-VA'] })]);
    expect(d.admitted).toBe(false);
    expect(d.reason).toContain('no clause');
  });

  it('admits the enterprise anchor without a path, but caps it', () => {
    const ds = admit([
      c({ evidenceId: 'a-1', family: 'enterprise_profile' }),
      c({ evidenceId: 'a-2', family: 'enterprise_profile' }),
      c({ evidenceId: 'a-3', family: 'enterprise_profile' }),
    ]);
    expect(ds.filter((d) => d.admitted)).toHaveLength(2);
    expect(ds[2].reason).toContain('capped at 2');
  });

  it('distinguishes "capped" from "inadmissible" in the reason', () => {
    // An item cut for a cap WAS admissible. Reporting both as the same thing
    // would send someone to fix a scope problem that does not exist.
    const ds = admit([
      c({ evidenceId: 'b-1', family: 'budget', objectIds: ['BUDGET-TELEPHONY'] }),
      c({ evidenceId: 'b-2', family: 'budget', objectIds: ['BUDGET-TELEPHONY'] }),
      c({ evidenceId: 'b-3', family: 'budget', objectIds: ['BUDGET-TELEPHONY'] }),
    ]);
    expect(ds[2].admitted).toBe(false);
    expect(ds[2].reason).toContain('admissible, but');
    expect(ds[2].reason).not.toContain('no legal path');
  });

  it('admits a constraint family without requiring a path', () => {
    // The first shadow run dropped the artifact's own claim-boundary record:
    // correct by the rules as written, absurd in effect. A constraint on what
    // may be claimed names no system and sits on no edge.
    const [d] = admitEvidence({
      scope,
      policy: { ...policy, permitted: [], alwaysAdmit: ['claim_boundaries'] },
      candidates: [c({ evidenceId: 'k-1', family: 'claim_boundaries', objectIds: [] })],
      edges,
    });
    expect(d.admitted).toBe(true);
    expect(d.reason).toContain('governs the artifact');
  });

  it('marks a benchmark family as benchmark rather than named_object', () => {
    const [d] = admit([c({ evidenceId: 'p-1', family: 'peer_programme', objectIds: ['PROG-CONTACT-KNOW'] })]);
    expect(d.admittedBy).toBe('benchmark');
  });

  it('records the shortest legal depth, not whichever was found first', () => {
    const withShortcut = [...edges, { fromId: 'SYS-CRM', relationshipType: 'supports', toId: 'FAR-AWAY' }];
    const [d] = admitEvidence({
      scope,
      policy: { ...policy, permitted: [{ family: 'platform_risk', maxDepth: 2 }] },
      candidates: [c({ evidenceId: 'e-7', objectIds: ['FAR-AWAY'] })],
      edges: withShortcut,
    });
    expect(d.traversalDepth).toBe(1);
  });
});

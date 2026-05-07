import {
  SOURCE_ARTIFACT_SPECS,
  SOURCE_GATE_CRITERIA,
  SOURCE_EVIDENCE_REQUIREMENTS,
  criteriaByArtifactCode,
  criteriaForStage,
  criterionById,
  evidenceById,
  evidenceForStage,
  gateDefiningSpecsForStage,
  hardCriteriaForStage,
  requiredEvidenceForStage,
  requiredSpecsForStage,
  specByCode,
  specsForStage,
} from '../canonical-specs';
import { SOURCE_STAGE_ORDER } from '../constants';
import type { SourceStageKey } from '../types';

const ALL_STAGES = SOURCE_STAGE_ORDER;

describe('canonical artifact specs · coverage', () => {
  it.each(ALL_STAGES)('stage %s has at least one required artifact', (stage) => {
    const required = requiredSpecsForStage(stage as SourceStageKey);
    expect(required.length).toBeGreaterThan(0);
  });

  it.each(ALL_STAGES)('stage %s has at least one gate-defining artifact', (stage) => {
    const gateDefining = gateDefiningSpecsForStage(stage as SourceStageKey);
    expect(gateDefining.length).toBeGreaterThan(0);
  });

  it('every artifact spec belongs to a canonical stage', () => {
    for (const spec of SOURCE_ARTIFACT_SPECS) {
      expect(ALL_STAGES).toContain(spec.stage);
    }
  });

  it('artifact codes are globally unique', () => {
    const codes = SOURCE_ARTIFACT_SPECS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('artifact codes follow the d<NN>_ pattern', () => {
    for (const spec of SOURCE_ARTIFACT_SPECS) {
      expect(spec.code).toMatch(/^d\d{2}_[a-z_]+$/);
    }
  });

  it('specByCode resolves a known code', () => {
    expect(specByCode('d05_scope_memo')?.name).toBe('Scope Memo with Boundaries');
    expect(specByCode('d99_nope')).toBeUndefined();
  });

  it('specsForStage returns only that stage', () => {
    const scope = specsForStage('scope');
    expect(scope.length).toBeGreaterThan(0);
    for (const spec of scope) expect(spec.stage).toBe('scope');
  });
});

describe('canonical gate criteria · coverage', () => {
  it.each(ALL_STAGES)('stage %s has at least one gate criterion', (stage) => {
    const criteria = criteriaForStage(stage as SourceStageKey);
    expect(criteria.length).toBeGreaterThan(0);
  });

  it.each(ALL_STAGES)('stage %s has at least one hard gate criterion', (stage) => {
    const hard = hardCriteriaForStage(stage as SourceStageKey);
    expect(hard.length).toBeGreaterThan(0);
  });

  it('gate criterion ids are globally unique', () => {
    const ids = SOURCE_GATE_CRITERIA.map((c) => c.criterionId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every linked artifact code resolves to an existing artifact spec', () => {
    for (const c of SOURCE_GATE_CRITERIA) {
      for (const code of c.linkedArtifactCodes) {
        const spec = specByCode(code);
        expect(spec).toBeDefined();
      }
    }
  });

  it('every gate criterion references a known stage', () => {
    for (const c of SOURCE_GATE_CRITERIA) {
      expect([...ALL_STAGES, 'closed']).toContain(c.fromStage);
      expect([...ALL_STAGES, 'closed']).toContain(c.toStage);
    }
  });

  it('criteria flow forward through canonical stage order', () => {
    for (const c of SOURCE_GATE_CRITERIA) {
      if (c.toStage === 'closed') continue;
      const fromIdx = SOURCE_STAGE_ORDER.indexOf(c.fromStage);
      const toIdx = SOURCE_STAGE_ORDER.indexOf(c.toStage as SourceStageKey);
      expect(toIdx).toBe(fromIdx + 1);
    }
  });

  it('criteriaByArtifactCode finds links', () => {
    const linked = criteriaByArtifactCode('d05_scope_memo');
    expect(linked.length).toBeGreaterThan(0);
    for (const c of linked) expect(c.linkedArtifactCodes).toContain('d05_scope_memo');
  });

  it('criterionById resolves', () => {
    expect(criterionById('GATE-SCOPE-01')?.title).toContain('Application portfolio');
    expect(criterionById('GATE-NOPE-99')).toBeUndefined();
  });
});

describe('canonical evidence requirements · coverage', () => {
  it.each(ALL_STAGES)('stage %s has at least one evidence requirement', (stage) => {
    const reqs = evidenceForStage(stage as SourceStageKey);
    expect(reqs.length).toBeGreaterThan(0);
  });

  it.each(ALL_STAGES)('stage %s has at least one required evidence item', (stage) => {
    const required = requiredEvidenceForStage(stage as SourceStageKey);
    expect(required.length).toBeGreaterThan(0);
  });

  it('evidence requirement ids are globally unique', () => {
    const ids = SOURCE_EVIDENCE_REQUIREMENTS.map((e) => e.requirementId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every evidence requirement belongs to a canonical stage', () => {
    for (const req of SOURCE_EVIDENCE_REQUIREMENTS) {
      expect(ALL_STAGES).toContain(req.stage);
    }
  });

  it('evidenceById resolves', () => {
    expect(evidenceById('EVID-SRC-SCOPE-TICKET-HISTORY')?.label).toBe('L2/L3 ticket history');
    expect(evidenceById('EVID-NOPE')).toBeUndefined();
  });
});

describe('canonical specs · totals (sanity bounds)', () => {
  it('artifact specs total is in the expected range', () => {
    expect(SOURCE_ARTIFACT_SPECS.length).toBeGreaterThanOrEqual(30);
    expect(SOURCE_ARTIFACT_SPECS.length).toBeLessThanOrEqual(60);
  });

  it('gate criteria total is in the expected range', () => {
    expect(SOURCE_GATE_CRITERIA.length).toBeGreaterThanOrEqual(30);
    expect(SOURCE_GATE_CRITERIA.length).toBeLessThanOrEqual(80);
  });

  it('evidence requirements total is in the expected range', () => {
    expect(SOURCE_EVIDENCE_REQUIREMENTS.length).toBeGreaterThanOrEqual(15);
    expect(SOURCE_EVIDENCE_REQUIREMENTS.length).toBeLessThanOrEqual(40);
  });
});

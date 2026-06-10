// PR-1 proof: the Deliverable Intelligence Orchestrator gives Claude expert latitude
// while binding client facts to governed evidence — and the gates block mediocre or
// fabricating output before export.
import {
  buildSourceRegister,
  scanForInternalLeaks,
  renderEvidenceForPrompt,
} from '../source-register';
import { buildSystemPrompt, buildPassPrompt, GENERATION_PASSES } from '../prompt-builder';
import { getArtifactBrief, hasDedicatedBrief } from '../artifact-brief-registry';
import { validateGenerationPlan } from '../generation-plan';
import { validateDeliverableQuality } from '../quality-validator';
import { runDeliverableOrchestration, extractJson } from '../orchestrator';
import type { ModelCaller } from '../orchestrator';
import { amsRfpRequest, goodPlan, goodDocument } from '../__fixtures__/ams-rfp';

describe('source register + citation discipline', () => {
  const candidates = amsRfpRequest().governedEvidenceBundle.map((e) => ({
    label: e.label, statement: e.statement, evidenceFamily: e.evidenceFamily,
    confidence: e.confidence, asOf: e.asOf, disclosureTier: e.disclosureTier, provenanceRef: e.provenanceRef,
  }));

  it('assigns stable 1-based citation numbers and a matching register', () => {
    const { evidence, register } = buildSourceRegister(candidates);
    expect(evidence[0].citationNumber).toBe(1);
    expect(register).toHaveLength(evidence.length);
    expect(register[0].label).toBe(evidence[0].label);
  });

  it('excludes internal_only evidence for a vendor-facing audience (no incumbent-spend leak)', () => {
    const vendor = buildSourceRegister(candidates, { audienceIsVendorFacing: true });
    expect(vendor.evidence.some((e) => e.evidenceFamily === 'contract_baseline')).toBe(false);
    const internal = buildSourceRegister(candidates);
    expect(internal.evidence.some((e) => e.evidenceFamily === 'contract_baseline')).toBe(true);
  });

  it('renders clean evidence for the prompt without internal ids', () => {
    const { evidence } = buildSourceRegister(candidates);
    const text = renderEvidenceForPrompt(evidence);
    expect(text).toMatch(/\[1\]/);
    expect(text).not.toMatch(/ev-tower-1|provenanceRef/);
  });

  it('leak scanner flags uuids, table refs, and internal status words', () => {
    expect(scanForInternalLeaks('see record 6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301')).toContain('uuid');
    expect(scanForInternalLeaks('from enterprise_context_facts')).toContain('table_ref');
    expect(scanForInternalLeaks('this is agent_ready')).toContain('internal_status');
    expect(scanForInternalLeaks('a perfectly clean executive sentence.')).toHaveLength(0);
  });
});

describe('artifact brief registry', () => {
  it('resolves a dedicated AMS RFP brief with expert latitude + governance boundary', () => {
    const brief = getArtifactBrief(amsRfpRequest());
    expect(hasDedicatedBrief('source', 'AMS_IT_OUTSOURCING', 'rfp_package')).toBe(true);
    expect(brief.recommendedStructure.length).toBeGreaterThanOrEqual(10);
    expect(brief.allowedExpertKnowledge).toMatch(/add sections/i);
    expect(brief.disallowedFabrication).toMatch(/incumbent vendor names|spend/i);
    expect(brief.expectedTables.some((t) => t.title === 'Application Inventory')).toBe(true);
  });

  it('falls back to a sound module default for an un-briefed deliverable', () => {
    const brief = getArtifactBrief(amsRfpRequest({ module: 'moves', useCaseArchetype: 'GENERIC', deliverableType: 'charter' }));
    expect(brief.recommendedStructure.length).toBeGreaterThanOrEqual(5);
    expect(brief.requiredSections.length).toBeGreaterThan(0);
  });
});

describe('multi-pass prompt builder', () => {
  const req = amsRfpRequest();
  const brief = getArtifactBrief(req);
  const evidence = req.governedEvidenceBundle;

  it('system prompt encodes the two-mode model and hard governance rules', () => {
    const sys = buildSystemPrompt(req);
    expect(sys).toMatch(/GOVERNED FACTUAL MODE/);
    expect(sys).toMatch(/EXPERT ARTIFACT MODE/);
    expect(sys).toMatch(/never invent/i);
    expect(sys).toMatch(/Do not optimize for short documents/i);
  });

  it('builds all six passes with generous high-stakes token budgets', () => {
    for (const pass of GENERATION_PASSES) {
      const p = buildPassPrompt(pass, { req, brief, evidence, approvedPlanJson: '{}', draftMarkdown: 'x', critiqueText: 'y', revisedDraftMarkdown: 'z' });
      expect(p.pass).toBe(pass);
      expect(p.highStakes).toBe(true);
    }
    const draft = buildPassPrompt('full_draft', { req, brief, evidence, approvedPlanJson: '{}' });
    expect(draft.maxTokens).toBeGreaterThanOrEqual(16000); // not a cramped call
  });

  it('architect prompt grants latitude and asks for a plan, not a draft', () => {
    const p = buildPassPrompt('architect', { req, brief, evidence });
    expect(p.user).toMatch(/DO NOT draft the full document yet/i);
    expect(p.user).toMatch(/not limited to the minimum sections|add sections/i);
    expect(p.user).toMatch(/DeliverableGenerationPlan/);
  });
});

describe('plan validation (gate before drafting)', () => {
  const req = amsRfpRequest();
  const brief = getArtifactBrief(req);

  it('accepts a complete, well-grounded plan', () => {
    const res = validateGenerationPlan(goodPlan(), req, brief);
    expect(res.ok).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('blocks a plan that cites non-existent evidence', () => {
    const bad = goodPlan();
    bad.sectionPlan[0].evidenceCitations = [99];
    const res = validateGenerationPlan(bad, req, brief);
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/\[99\]/);
  });

  it('blocks a governed_facts section that would fabricate (no citation/assumption/placeholder)', () => {
    const bad = goodPlan();
    bad.sectionPlan[1].evidenceCitations = []; // scope_service_towers is governed_facts
    const res = validateGenerationPlan(bad, req, brief);
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/would fabricate client facts/);
  });

  it('blocks a plan that omits a required section or drops a client-to-complete item', () => {
    const bad = goodPlan();
    bad.sectionPlan = bad.sectionPlan.filter((s) => s.key !== 'sla_kpi');
    bad.clientCompletePlan = bad.clientCompletePlan.filter((c) => c.key !== 'legal_positions');
    const res = validateGenerationPlan(bad, req, brief);
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/sla_kpi/);
    expect(res.errors.join(' ')).toMatch(/legal_positions/);
  });
});

describe('quality gate (before export)', () => {
  const req = amsRfpRequest();

  it('passes a board-grade document', () => {
    const res = validateDeliverableQuality(goodDocument(), req);
    expect(res.pass).toBe(true);
    expect(res.metrics.unsupportedClaimCount).toBe(0);
    expect(res.metrics.hasRecommendation).toBe(true);
  });

  it('blocks unsupported client-fact claims', () => {
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown = 'The incumbent spends $280M per year and has 1,200 staff in FY2026.';
    const res = validateDeliverableQuality(doc, req);
    expect(res.pass).toBe(false);
    expect(res.blockers.join(' ')).toMatch(/unsupported client-fact/);
  });

  it('blocks leaked internal ids and missing source register', () => {
    const doc = goodDocument();
    doc.generatedSections[0].bodyMarkdown += ' source object_id 6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301.';
    doc.sourceRegister = [];
    const res = validateDeliverableQuality(doc, req);
    expect(res.pass).toBe(false);
    expect(res.blockers.join(' ')).toMatch(/internal tags/);
    expect(res.blockers.join(' ')).toMatch(/source register/);
  });

  it('blocks an artificially short document', () => {
    const doc = goodDocument();
    doc.generatedSections = doc.generatedSections.slice(0, 2).map((s) => ({ ...s, bodyMarkdown: 'short.' }));
    const res = validateDeliverableQuality(doc, req);
    expect(res.pass).toBe(false);
    expect(res.blockers.join(' ')).toMatch(/too short|minimum/);
  });
});

describe('extractJson', () => {
  it('pulls JSON out of fenced and trailing-prose responses', () => {
    expect(extractJson<{ a: number }>('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson<{ a: number }>('Here is the plan: {"a": 2} — done.')).toEqual({ a: 2 });
    expect(extractJson('no json here')).toBeNull();
  });
});

describe('full multi-pass orchestration (injected stub model)', () => {
  const req = amsRfpRequest();

  // a stub that returns appropriate output per pass
  const stub: ModelCaller = async (prompt) => {
    switch (prompt.pass) {
      case 'architect': return { text: JSON.stringify(goodPlan()), responseId: 'r1' };
      case 'evidence_grounding': return { text: '{"evidenceMapping":[]}', responseId: 'r2' };
      case 'full_draft': return { text: '# Draft\n' + 'word '.repeat(300), responseId: 'r3' };
      case 'red_team': return { text: 'Tighten section 2; add a risk table.', responseId: 'r4' };
      case 'board_grade_rewrite': return { text: '# Final\n' + 'word '.repeat(300), responseId: 'r5' };
      case 'render_package': return { text: JSON.stringify(goodDocument()), responseId: 'r6' };
    }
  };

  it('runs all six passes, validates the plan, and passes the quality gate', async () => {
    const res = await runDeliverableOrchestration(req, stub);
    expect(res.passTrace.map((t) => t.pass)).toEqual(GENERATION_PASSES);
    expect(res.planValidation?.ok).toBe(true);
    expect(res.ok).toBe(true);
    expect(res.document?.title).toMatch(/SkyHarbor/);
    expect(res.quality?.pass).toBe(true);
  });

  it('blocks at the plan gate when the architect returns a fabricating plan', async () => {
    const badStub: ModelCaller = async (prompt) => {
      if (prompt.pass === 'architect') {
        const p = goodPlan();
        p.sectionPlan[1].evidenceCitations = [99];
        return { text: JSON.stringify(p) };
      }
      return { text: '{}' };
    };
    const res = await runDeliverableOrchestration(req, badStub);
    expect(res.ok).toBe(false);
    expect(res.blockedReason).toMatch(/plan failed validation/);
    expect(res.passTrace).toHaveLength(1); // stopped after architect
  });

  it('blocks at the quality gate when the rendered document has unsupported claims', async () => {
    const leakyStub: ModelCaller = async (prompt) => {
      if (prompt.pass === 'architect') return { text: JSON.stringify(goodPlan()) };
      if (prompt.pass === 'render_package') {
        const d = goodDocument();
        d.generatedSections[0].bodyMarkdown = 'The vendor bills $99,000,000 in 2026 with no citation.';
        return { text: JSON.stringify(d) };
      }
      return { text: 'word '.repeat(300) };
    };
    const res = await runDeliverableOrchestration(req, leakyStub);
    expect(res.ok).toBe(false);
    expect(res.blockedReason).toMatch(/quality gate/);
  });
});

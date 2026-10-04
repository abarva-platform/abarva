import {
  classifyUploadedMoveEvidence,
  mergeMoveEvidenceClassification,
  reviewFamilyKeyForUploadedMoveEvidence,
} from '../uploaded-move-evidence-classification';

describe('uploaded Move evidence classification', () => {
  it.each([
    {
      filename: 'red_lines_draft.csv',
      text: 'Proposed red lines. A finance-approved baseline is not available.',
      expected: 'control_evidence',
    },
    {
      filename: 'evidence_plan.csv',
      text: 'Evidence requested: current KPI baseline and control inventory.',
      expected: 'evidence_plan',
    },
    {
      filename: 'business_change_hypothesis.csv',
      text: 'Proposed adoption hypothesis; no operating-model decision is approved.',
      expected: 'adoption_change',
    },
    {
      filename: 'charter_decisions_human_redline_v2.md',
      text: 'Draft decision rights and sponsor progress-contact wording.',
      expected: 'charter_hypothesis',
    },
  ])('keeps P1 working material out of KPI and approval families: $filename', ({ filename, text, expected }) => {
    const classification = classifyUploadedMoveEvidence({
      filename,
      phase: 1,
      extractedText: text,
      originalEvidenceType: 'baseline_evidence',
    });

    expect(classification.evidenceType).toBe(expected);
    expect(classification.reviewFamilyKey).toBe('p1_uploaded_evidence');
    expect(classification.slotIds).toEqual([]);
    expect(classification.evidenceType).not.toBe('kpi_value_baseline');
    expect(classification.evidenceType).not.toBe('approval');
  });

  it('does not infer a P1 requirement family from generic baseline or decision wording', () => {
    const classification = classifyUploadedMoveEvidence({
      filename: 'supporting_notes.txt',
      phase: 1,
      extractedText: 'No approved decision or measured baseline is asserted.',
      originalEvidenceType: 'baseline_evidence',
    });

    expect(classification.evidenceType).toBe('other');
    expect(classification.reviewFamilyKey).toBe('p1_uploaded_evidence');
    expect(classification.slotIds).toEqual([]);
  });

  it('uses the validated uploader declaration for routing without changing the evidence class', () => {
    const classification = classifyUploadedMoveEvidence({
      filename: 'evidence_plan.csv',
      phase: 1,
      extractedText: 'A measured baseline is requested but not supplied.',
      originalEvidenceType: 'baseline_evidence',
    });

    expect(
      reviewFamilyKeyForUploadedMoveEvidence({
        classification,
        declaredFamilyKey: 'current_state_workflow_map',
      }),
    ).toBe('current_state_workflow_map');
    expect(classification.evidenceType).toBe('evidence_plan');
    expect(classification.slotIds).toEqual([]);
  });

  it('maps P2 legal request and queue files to current-state evidence slots', () => {
    const classification = classifyUploadedMoveEvidence({
      filename: 'Contract Request Log.csv',
      phase: 2,
      extractedText: 'legal work queue, contract request volume, queue aging, bottleneck signals',
      originalEvidenceType: 'uploaded_artifact',
    });

    expect(classification.evidenceType).toBe('ticket_evidence');
    expect(reviewFamilyKeyForUploadedMoveEvidence({ classification })).toBe('p2_business_current_state');
    expect(classification.sourceType).toBe('real_upload');
    expect(classification.slotIds).toEqual(
      expect.arrayContaining([
        'p2_business_current_state',
        'p2_process_pain_points',
        'p2_volumetrics_baseline',
        'p2_operational_work_item_evidence',
      ]),
    );
    expect(classification.whatFound.join(' ')).toMatch(/request volume/i);
    expect(classification.whereUsed).toEqual(
      expect.arrayContaining(['P2 current-state diagnosis', 'P4 value baseline']),
    );
  });

  it('maps P3 solution option files to the approach decision and architecture path', () => {
    const classification = classifyUploadedMoveEvidence({
      filename: 'Solution Options Decision Matrix.xlsx',
      phase: 3,
      extractedText: 'compare process-first, embedded AI, and orchestration options',
      originalEvidenceType: 'uploaded_artifact',
    });

    expect(classification.evidenceType).toBe('solution_options_decision');
    expect(classification.slotIds).toEqual(
      expect.arrayContaining([
        'p3_two_options',
        'p3_weighted_decision_matrix',
        'p3_arch_chosen_option',
      ]),
    );
    expect(classification.whatFound).toEqual(
      expect.arrayContaining(['solution options', 'selected approach', 'rejected approach']),
    );
    expect(classification.whereUsed).toEqual(
      expect.arrayContaining(['P3 solution approach', 'P4 roadmap planning']),
    );
  });

  it('maps P4 Tower metric files to measurement and handoff evidence', () => {
    const classification = classifyUploadedMoveEvidence({
      filename: 'Tower Metric Definitions.xlsx',
      phase: 4,
      extractedText: 'baseline, target, measurement owner, review cadence',
      originalEvidenceType: 'baseline_evidence',
    });

    expect(classification.evidenceType).toBe('kpi_value_baseline');
    expect(classification.slotIds).toEqual(
      expect.arrayContaining([
        'p4_roadmap_value_milestones',
        'p4_case_kpi_baseline_target',
        'p5_measurement_contract',
      ]),
    );
    expect(classification.whereUsed).toEqual(
      expect.arrayContaining(['P4 value plan', 'P5/Tower handoff']),
    );
  });

  it('merges client-facing evidence metadata into the recorded structured payload', () => {
    const evidence = {
      evidenceType: 'uploaded_artifact' as const,
      title: 'Contract Request Log.csv',
      extractedText: 'request log rows',
      extractedStructured: {
        parse_method: 'csv',
        warnings: [],
      },
    };
    const classification = classifyUploadedMoveEvidence({
      filename: 'Contract Request Log.csv',
      phase: 2,
      extractedText: evidence.extractedText,
      originalEvidenceType: evidence.evidenceType,
    });

    const merged = mergeMoveEvidenceClassification({
      evidence,
      classification,
      filename: evidence.title,
    });

    expect(merged.extractedStructured).toMatchObject({
      source_type: 'real_upload',
      evidence_type: 'ticket_evidence',
      citation: 'Contract Request Log.csv',
    });
    const structured = merged.extractedStructured as Record<string, unknown>;

    expect(structured.slot_ids).toEqual(
      expect.arrayContaining(['p2_operational_work_item_evidence']),
    );
    expect(structured.artifact_consumers).toEqual(
      expect.arrayContaining(['p2_discovery', 'discovery_report', 'business_case']),
    );
    expect(structured.what_found).toEqual(
      expect.arrayContaining(['request volume']),
    );
    expect(structured.where_used).toEqual(
      expect.arrayContaining(['P2 current-state diagnosis']),
    );
  });
});

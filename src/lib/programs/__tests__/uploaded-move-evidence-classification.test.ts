import {
  classifyUploadedMoveEvidence,
  mergeMoveEvidenceClassification,
} from '../uploaded-move-evidence-classification';

describe('uploaded Move evidence classification', () => {
  it('maps P2 legal request and queue files to current-state evidence slots', () => {
    const classification = classifyUploadedMoveEvidence({
      filename: 'Contract Request Log.csv',
      phase: 2,
      extractedText: 'legal work queue, contract request volume, queue aging, bottleneck signals',
      originalEvidenceType: 'uploaded_artifact',
    });

    expect(classification.evidenceType).toBe('ticket_evidence');
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

import {
  orchestratorDeliverableType,
  prescribedFormatForDeliverableType,
} from '../orchestrated-deliverable-map';
import { deliverableKeyForOrchestratorType } from '@/lib/deliverables/quality/deliverable-key-map';

describe('orchestrated deliverable map', () => {
  it('routes the P2 root-cause worksheet to its own orchestrator and quality profile', () => {
    const orchestratorType = orchestratorDeliverableType('root_cause_worksheet');
    expect(orchestratorType).toBe('root_cause_worksheet');
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe('root_cause_worksheet');
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe('docx');
  });

  it('routes the P5 value measurement contract to its own quality profile', () => {
    const orchestratorType = orchestratorDeliverableType('value_measurement_contract');
    expect(orchestratorType).toBe('value_measurement_contract');
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe('value_measurement_contract');
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe('docx');
  });

  it('routes P3 Solution Design to its own workflow-exhibit profile', () => {
    const orchestratorType = orchestratorDeliverableType('solution_design');
    expect(orchestratorType).toBe('solution_design');
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe('solution_design');
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe('docx');
  });

  it('routes P3 Operating Model Design to the canonical fixed operating-model brief', () => {
    const orchestratorType = orchestratorDeliverableType('operating_model_design');
    expect(orchestratorType).toBe('operating_model');
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe('operating_model_design');
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe('docx');
  });
});

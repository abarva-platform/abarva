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
});

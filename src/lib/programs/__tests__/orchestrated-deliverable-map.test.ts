import {
  orchestratorDeliverableType,
  prescribedFormatForDeliverableType,
} from '../orchestrated-deliverable-map';
import { deliverableKeyForOrchestratorType } from '@/lib/deliverables/quality/deliverable-key-map';

describe('orchestrated deliverable map', () => {
  it('routes the P5 value measurement contract to its own quality profile', () => {
    const orchestratorType = orchestratorDeliverableType('value_measurement_contract');
    expect(orchestratorType).toBe('value_measurement_contract');
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe('value_measurement_contract');
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe('docx');
  });
});

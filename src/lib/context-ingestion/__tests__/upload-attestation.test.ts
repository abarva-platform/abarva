import {
  PILOT_UPLOAD_ATTESTATION_VERSION,
  validatePilotUploadAttestation,
} from '../upload-attestation';

describe('validatePilotUploadAttestation', () => {
  const now = () => new Date('2026-06-02T12:00:00.000Z');

  it('accepts the current pilot data-load attestation contract', () => {
    const attestation = validatePilotUploadAttestation({
      accepted: 'true',
      version: PILOT_UPLOAD_ATTESTATION_VERSION,
      authorityConfirmed: 'on',
      dataUseConfirmed: 'yes',
      sensitiveDataConfirmed: '1',
      note: 'CAB approval CAB-42',
    }, now);

    expect(attestation).toEqual({
      version: PILOT_UPLOAD_ATTESTATION_VERSION,
      accepted: true,
      authorityConfirmed: true,
      dataUseConfirmed: true,
      sensitiveDataConfirmed: true,
      note: 'CAB approval CAB-42',
      acceptedAt: '2026-06-02T12:00:00.000Z',
    });
  });

  it('fails closed when any required acknowledgement is missing', () => {
    const attestation = validatePilotUploadAttestation({
      accepted: 'true',
      version: PILOT_UPLOAD_ATTESTATION_VERSION,
      authorityConfirmed: 'true',
      sensitiveDataConfirmed: 'true',
    }, now);

    expect(attestation).toEqual({
      error: 'upload_attestation_required',
      detail: expect.stringContaining('authority to load the data'),
      missing: ['operatorDataUseConfirmed'],
    });
  });
});

export const PILOT_UPLOAD_ATTESTATION_VERSION = 'pilot-loader-data-load-attestation-v1';

export interface PilotUploadAttestationInput {
  accepted?: unknown;
  version?: unknown;
  authorityConfirmed?: unknown;
  dataUseConfirmed?: unknown;
  sensitiveDataConfirmed?: unknown;
  note?: unknown;
}

export interface PilotUploadAttestation {
  version: typeof PILOT_UPLOAD_ATTESTATION_VERSION;
  accepted: true;
  authorityConfirmed: true;
  dataUseConfirmed: true;
  sensitiveDataConfirmed: true;
  note: string | null;
  acceptedAt: string;
}

export interface PilotUploadAttestationFailure {
  error: 'upload_attestation_required';
  detail: string;
  missing: string[];
}

function formBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function formString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validatePilotUploadAttestation(
  input: PilotUploadAttestationInput,
  now: () => Date = () => new Date(),
): PilotUploadAttestation | PilotUploadAttestationFailure {
  const missing: string[] = [];
  if (formString(input.version) !== PILOT_UPLOAD_ATTESTATION_VERSION) {
    missing.push('operatorAttestationVersion');
  }
  if (!formBoolean(input.accepted)) missing.push('operatorAttestationAccepted');
  if (!formBoolean(input.authorityConfirmed)) missing.push('operatorDataAuthorityConfirmed');
  if (!formBoolean(input.dataUseConfirmed)) missing.push('operatorDataUseConfirmed');
  if (!formBoolean(input.sensitiveDataConfirmed)) missing.push('operatorSensitiveDataConfirmed');

  if (missing.length > 0) {
    return {
      error: 'upload_attestation_required',
      detail:
        'A tenant admin must attest they have authority to load the data, understand the pilot data-use disclaimer, and have reviewed sensitive-data obligations before processing starts.',
      missing,
    };
  }

  return {
    version: PILOT_UPLOAD_ATTESTATION_VERSION,
    accepted: true,
    authorityConfirmed: true,
    dataUseConfirmed: true,
    sensitiveDataConfirmed: true,
    note: formString(input.note),
    acceptedAt: now().toISOString(),
  };
}

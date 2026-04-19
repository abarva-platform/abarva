export const FORBIDDEN_CLIENT_NAMES = [
  'CADE',
  'Accenture',
  'Dell',
  'McKinsey',
  'Deloitte',
  'BCG',
  'Bain',
  'Huron',
  'Navigant',
  'Presbyterian',
  'PHS',
  'MD Anderson',
  'CommonSpirit Health',
  'HP Inc',
].map((s) => s.toLowerCase());

export class ForbiddenNameError extends Error {
  constructor(name: string) {
    super(`Client name "${name}" is forbidden by naming policy.`);
    this.name = 'ForbiddenNameError';
  }
}

export function assertClientNameAllowed(name: string): void {
  const n = name.trim().toLowerCase();
  if (FORBIDDEN_CLIENT_NAMES.some((f) => n === f || n.includes(f))) {
    throw new ForbiddenNameError(name);
  }
}

export function isClientNameForbidden(name: string): boolean {
  const n = name.trim().toLowerCase();
  return FORBIDDEN_CLIENT_NAMES.some((f) => n === f || n.includes(f));
}

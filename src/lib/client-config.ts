export interface ClientOption {
  id: string;
  name: string;
  shortName: string;
  color: string;
  vertical: string;
}

export const ALL_CLIENTS: ClientOption[] = [
  {
    id: 'meridian',
    name: 'Meridian Health System',
    shortName: 'Meridian Health',
    color: '#14B8A6',
    vertical: 'Healthcare',
  },
  {
    id: 'apexretail',
    name: 'Apex Retail Group',
    shortName: 'Apex Retail',
    color: '#F59E0B',
    vertical: 'Retail',
  },
] as const;

export type ClientKey = (typeof ALL_CLIENTS)[number]['id'];

export const DEFAULT_CLIENT_KEY: ClientKey = 'meridian';

export const CLIENT_KEY_TO_DB_NAME: Record<ClientKey, string[]> = {
  meridian: ['Meridian Health', 'Meridian Health System'],
  apexretail: ['Apex Retail', 'Apex Retail Group'],
};

export const CLIENT_KEY_TO_INDUSTRY_CODE: Record<ClientKey, string> = {
  meridian: 'HEALTHCARE_IDN',
  apexretail: 'RETAIL',
};

export function isClientKey(value: string | null | undefined): value is ClientKey {
  return !!value && ALL_CLIENTS.some((client) => client.id === value);
}

export function getClientOption(id: string | null | undefined): ClientOption {
  return ALL_CLIENTS.find((client) => client.id === id) ?? ALL_CLIENTS[0];
}

export function inferClientKeyFromEmail(email: string | null | undefined): ClientKey | null {
  const normalized = email?.toLowerCase() ?? '';
  if (!normalized) return null;

  if (
    normalized.includes('demo-apexretail') ||
    normalized.includes('apexretail') ||
    normalized.includes('apex+clerk_test') ||
    // Catches demo accounts like anand+apex@abarva.com where the
    // local-part suffix is "+apex" (no "retail"). The "+" anchor
    // prevents false matches on domains containing "apex".
    normalized.includes('+apex@') ||
    normalized.includes('+apex_')
  ) {
    return 'apexretail';
  }

  if (
    normalized.includes('demo-meridian') ||
    normalized.includes('mh+clerk_test') ||
    normalized.includes('meridian') ||
    normalized.includes('thesundaram.com')
  ) {
    return 'meridian';
  }

  return null;
}

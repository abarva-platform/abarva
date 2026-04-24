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
    id: 'arcturus',
    name: 'Arcturus Financial Group',
    shortName: 'Arcturus Financial',
    color: '#818CF8',
    vertical: 'Financial Services',
  },
  {
    id: 'apexretail',
    name: 'Apex Retail Group',
    shortName: 'Apex Retail',
    color: '#F59E0B',
    vertical: 'Retail',
  },
  {
    id: 'keystone',
    name: 'Keystone Energy Holdings',
    shortName: 'Keystone Energy',
    color: '#60A5FA',
    vertical: 'Energy',
  },
] as const;

export type ClientKey = (typeof ALL_CLIENTS)[number]['id'];

export const DEFAULT_CLIENT_KEY: ClientKey = 'meridian';

export const CLIENT_KEY_TO_DB_NAME: Record<ClientKey, string[]> = {
  meridian: ['Meridian Health', 'Meridian Health System'],
  arcturus: ['Arcturus Financial', 'Arcturus Financial Group', 'First Capital Financial', 'First Capital'],
  apexretail: ['Apex Retail', 'Apex Retail Group'],
  keystone: ['Keystone Energy', 'Keystone Energy Holdings', 'Keystone Energy Holdings, Inc.'],
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
    normalized.includes('apex+clerk_test')
  ) {
    return 'apexretail';
  }

  if (
    normalized.includes('mh+clerk_test') ||
    normalized.includes('meridian')
  ) {
    return 'meridian';
  }

  if (
    normalized.includes('af+clerk_test') ||
    normalized.includes('arcturus') ||
    normalized.includes('firstcapital') ||
    normalized.includes('first-capital')
  ) {
    return 'arcturus';
  }

  if (
    normalized.includes('ke+clerk_test') ||
    normalized.includes('keystone')
  ) {
    return 'keystone';
  }

  return null;
}

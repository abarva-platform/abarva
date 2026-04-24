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
  arcturus: ['Arcturus Financial', 'Arcturus Financial Group'],
  apexretail: ['Apex Retail', 'Apex Retail Group'],
  keystone: ['Keystone Energy Holdings', 'Keystone Energy Holdings, Inc.'],
};

export const CLIENT_KEY_TO_ROUTE_SLUG: Record<ClientKey, string> = {
  meridian: 'meridian-health',
  arcturus: 'first-capital-financial',
  apexretail: 'apex-retail',
  keystone: 'keystone-energy',
};

const CLIENT_EMAIL_HINTS: Array<{ key: ClientKey; markers: string[] }> = [
  { key: 'apexretail', markers: ['demo-apexretail', 'apexretail', 'apex+clerk_test', 'apex'] },
  { key: 'meridian', markers: ['meridian', 'mh+clerk_test', 'mh@'] },
  { key: 'arcturus', markers: ['arcturus', 'firstcapital', 'first_capital', 'first-capital', 'af+clerk_test', 'af@'] },
  { key: 'keystone', markers: ['keystone+clerk_test', 'ke+clerk_test', 'keystone'] },
];

export function isClientKey(value: string | null | undefined): value is ClientKey {
  return !!value && ALL_CLIENTS.some((client) => client.id === value);
}

export function getClientOption(value: string | null | undefined): ClientOption | null {
  if (!isClientKey(value)) return null;
  return ALL_CLIENTS.find((client) => client.id === value) ?? null;
}

export function inferClientKeyFromEmail(email: string | null | undefined): ClientKey | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const [local = '', domain = ''] = normalized.split('@');
  const haystack = `${local} ${domain}`;

  for (const entry of CLIENT_EMAIL_HINTS) {
    if (entry.markers.some((marker) => haystack.includes(marker))) {
      return entry.key;
    }
  }

  return null;
}

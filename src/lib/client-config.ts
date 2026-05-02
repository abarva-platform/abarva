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
    name: 'First Capital Financial',
    shortName: 'First Capital',
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

export const CLIENT_KEY_TO_INDUSTRY_CODE: Record<ClientKey, string> = {
  meridian: 'HEALTHCARE_IDN',
  arcturus: 'FINSERV',
  apexretail: 'RETAIL',
  keystone: 'ENERGY',
};

export function industryCodeForClientName(name: string | null | undefined): string | null {
  const normalized = name?.trim().toLowerCase();
  if (!normalized) return null;

  for (const client of ALL_CLIENTS) {
    const candidates = CLIENT_KEY_TO_DB_NAME[client.id].map((candidate) =>
      candidate.trim().toLowerCase(),
    );
    if (candidates.includes(normalized)) {
      return CLIENT_KEY_TO_INDUSTRY_CODE[client.id];
    }
  }

  return null;
}

export function isClientKey(value: string | null | undefined): value is ClientKey {
  return !!value && ALL_CLIENTS.some((client) => client.id === value);
}

export function getClientOption(id: string | null | undefined): ClientOption {
  return ALL_CLIENTS.find((client) => client.id === id) ?? ALL_CLIENTS[0];
}

export function canonicalClientDisplayName(args: {
  key?: string | null;
  name?: string | null;
}): string | null {
  const key = args.key?.trim().toLowerCase();
  const name = args.name?.trim();
  const normalizedName = name?.toLowerCase();

  if (
    key === 'arcturus' ||
    key === 'firstcapital' ||
    key === 'first-capital' ||
    normalizedName === 'arcturus financial group' ||
    normalizedName === 'arcturus financial'
  ) {
    return 'First Capital Financial';
  }

  if (name) return name;
  const option = getClientOption(args.key);
  return option?.name ?? null;
}

export function inferClientKeyFromEmail(email: string | null | undefined): ClientKey | null {
  const normalized = email?.toLowerCase() ?? '';
  if (!normalized) return null;

  if (
    normalized.includes('apexretail') ||
    normalized.includes('apex-retail') ||
    // Catches demo accounts like anand+apex@abarva.com where the
    // local-part suffix is "+apex" (no "retail"). The "+" anchor
    // prevents false matches on domains containing "apex".
    normalized.includes('+apex@') ||
    normalized.includes('+apex_')
  ) {
    return 'apexretail';
  }

  if (
    normalized.includes('meridian-health') ||
    normalized.includes('meridian') ||
    normalized.includes('thesundaram.com')
  ) {
    return 'meridian';
  }

  if (
    normalized.includes('arcturus') ||
    normalized.includes('firstcapital') ||
    normalized.includes('first-capital')
  ) {
    return 'arcturus';
  }

  if (
    normalized.includes('nexora') ||
    normalized.includes('keystone')
  ) {
    return 'keystone';
  }

  return null;
}

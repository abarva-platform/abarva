export interface DataClient {
  id: string;
  name: string;
  industry: string;
  industryLabel: string;
}

export const DATA_CLIENTS: DataClient[] = [
  { id: 'meridian', name: 'Meridian Health', industry: 'healthcare_idn', industryLabel: 'Healthcare IDN' },
  { id: 'apex', name: 'Apex Retail', industry: 'retail', industryLabel: 'Retail' },
];

export function getDataClient(id: string): DataClient | null {
  return DATA_CLIENTS.find((c) => c.id === id) ?? null;
}

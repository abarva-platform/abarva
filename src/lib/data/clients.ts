export interface DataClient {
  id: string;
  name: string;
  industry: string;
  industryLabel: string;
}

export const DATA_CLIENTS: DataClient[] = [
  { id: 'meridian', name: 'Meridian Health', industry: 'healthcare_idn', industryLabel: 'Healthcare IDN' },
  { id: 'first_capital', name: 'First Capital', industry: 'finserv', industryLabel: 'Financial Services' },
  { id: 'apex', name: 'Apex Retail', industry: 'retail', industryLabel: 'Retail' },
];

export function getDataClient(id: string): DataClient | null {
  return DATA_CLIENTS.find((c) => c.id === id) ?? null;
}

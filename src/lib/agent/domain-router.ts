export type ClientDomain =
  | 'infra'
  | 'apps'
  | 'data'
  | 'cost'
  | 'eng'
  | 'ai'
  | 'rcm'
  | 'provops'
  | 'clinical'
  | 'px'
  | 'claims'
  | 'fraud'
  | 'cs'
  | 'digitalbanking'
  | 'supplychain'
  | 'stores'
  | 'ecommerce'
  | 'pricing'
  | 'returns'
  | 'pharma_discovery'
  | 'pharma_clinical'
  | 'pharma_regulatory'
  | 'pharma_commercial'
  | 'pharma_medaffairs';

type IndustryCode = 'HEALTHCARE_IDN' | 'FINSERV' | 'RETAIL' | 'PHARMA' | 'GENERAL';

const CROSS_INDUSTRY: ClientDomain[] = ['infra', 'apps', 'data', 'cost', 'eng', 'ai'];
const HEALTHCARE: ClientDomain[] = ['rcm', 'provops', 'clinical', 'px'];
const FINSERV: ClientDomain[] = ['claims', 'fraud', 'cs', 'digitalbanking'];
const RETAIL: ClientDomain[] = ['supplychain', 'stores', 'ecommerce', 'pricing', 'returns', 'cs'];
const PHARMA: ClientDomain[] = [
  'pharma_discovery',
  'pharma_clinical',
  'pharma_regulatory',
  'pharma_commercial',
  'pharma_medaffairs',
];

export const DOMAIN_KEYWORDS: Record<ClientDomain, string[]> = {
  infra: ['cloud', 'compute', 'storage', 'network', 'infrastructure', 'latency', 'capacity', 'ec2', 'rds', 's3', 'bedrock', 'sagemaker', 'datacenter', 'on-prem'],
  apps: ['application', 'system', 'integration', 'api', 'middleware', 'vendor', 'saas', 'erp', 'crm', 'ehr'],
  data: ['data source', 'data platform', 'pipeline', 'governance', 'quality', 'lineage', 'catalog', 'etl', 'warehouse', 'lakehouse', 'snowflake', 'databricks'],
  cost: ['cost', 'spend', 'budget', 'tco', 'roi', 'run rate', 'run_rate', 'opex', 'capex'],
  eng: ['deploy', 'cycle time', 'lead time', 'productivity', 'sprint', 'copilot', 'dora', 'mttr', 'change fail'],
  ai: ['ai model', 'llm', 'model', 'agent', 'copilot', 'gen ai', 'genai', 'fine-tun', 'embedding'],
  rcm: ['revenue cycle', 'denial', 'claims', 'billing', 'days in ar', 'coding', 'net collection', 'first pass resolution'],
  provops: ['throughput', 'capacity', 'staffing', 'scheduling', 'unit', 'hospital', 'clinic', 'or suite', 'icu', 'ed '],
  clinical: ['workflow', 'documentation', 'clinician', 'encounter', 'note', 'emr', 'specialty'],
  px: ['patient', 'portal', 'wait time', 'nps', 'hcahps', 'patient experience'],
  claims: ['underwriting', 'loan', 'mortgage', 'risk score', 'credit', 'straight-through', 'stp'],
  fraud: ['fraud', 'aml', 'suspicious', 'sar', 'transaction monitoring'],
  cs: ['call center', 'aht', 'average handle time', 'csat', 'agent', 'ticket', 'contact center', 'first contact resolution'],
  digitalbanking: ['mobile app', 'account opening', 'transfer', 'funnel', 'wire', 'digital banking'],
  supplychain: ['inventory', 'stockout', 'forecast', 'supplier', 'logistics', 'days inventory outstanding', 'otd', 'turns'],
  stores: ['store', 'sqft', 'retail footprint', 'traffic', 'basket', 'sales per'],
  ecommerce: ['ecommerce', 'e-commerce', 'conversion', 'cart', 'aov', 'checkout', 'bounce rate', 'session'],
  pricing: ['pricing', 'promotion', 'markdown', 'margin', 'discount', 'price elasticity'],
  returns: ['return', 'refund', 'exchange', 'damaged', 'returns rate'],
  pharma_discovery: ['target identification', 'molecule', 'compound', 'drug discovery', 'recursion', 'alphafold', 'small molecule', 'antibody', 'screening', 'insitro', 'atomwise', 'absci'],
  pharma_clinical: ['clinical trial', 'protocol', 'recruitment', 'site selection', 'edc', 'ectd', 'rwe', 'real-world evidence', 'medidata', 'veeva vault', 'deep 6', 'flatiron'],
  pharma_regulatory: ['pharmacovigilance', 'adverse event', 'regulatory submission', 'fda', 'ema', 'pmda', 'pharmora', 'icsr'],
  pharma_commercial: ['msl', 'hcp', 'formulary', 'market access', 'speaker program', 'next-best-action', 'aktana', 'trinity life sciences'],
  pharma_medaffairs: ['medical affairs', 'medical information', 'publication', 'kol', 'within3', 'doximity'],
};

export function isDomainApplicable(domain: ClientDomain, industry: IndustryCode | null | undefined): boolean {
  if (CROSS_INDUSTRY.includes(domain)) return true;
  if (industry === 'HEALTHCARE_IDN') return HEALTHCARE.includes(domain);
  if (industry === 'FINSERV') return FINSERV.includes(domain);
  if (industry === 'RETAIL') return RETAIL.includes(domain);
  if (industry === 'PHARMA') return PHARMA.includes(domain);
  return false;
}

export function domainsForIndustry(industry: IndustryCode | null | undefined): ClientDomain[] {
  const out: ClientDomain[] = [...CROSS_INDUSTRY];
  if (industry === 'HEALTHCARE_IDN') out.push(...HEALTHCARE);
  else if (industry === 'FINSERV') out.push(...FINSERV);
  else if (industry === 'RETAIL') out.push(...RETAIL);
  else if (industry === 'PHARMA') out.push(...PHARMA);
  return out;
}

export interface DomainMatch {
  domain: ClientDomain;
  matchedKeywords: string[];
}

export function detectRelevantDomains(
  query: string,
  clientIndustry: IndustryCode | null | undefined,
): DomainMatch[] {
  const q = query.toLowerCase();
  const matches: DomainMatch[] = [];
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as Array<[ClientDomain, string[]]>) {
    if (!isDomainApplicable(domain, clientIndustry)) continue;
    const hits = keywords.filter((kw) => q.includes(kw));
    if (hits.length > 0) {
      matches.push({ domain, matchedKeywords: hits });
    }
  }
  return matches;
}

export function pineconeNamespaceForDomain(clientId: string, domain: ClientDomain): string {
  return `client:${clientId}:${domain}`;
}

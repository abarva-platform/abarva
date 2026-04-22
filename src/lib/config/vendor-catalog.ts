// Structured vendor catalog used by /intelligence/library for browsable
// rendering. Categories follow the groupings in vendor-whitelist.ts (which
// is the name-only allow-list). Pricing + contract metadata composed from
// Pack J's structured entries where available.

export interface VendorCatalogEntry {
  name: string;
  category: VendorCategory;
  industries: string[];
  pricing?: string;
  detail?: string;
}

export type VendorCategory =
  | 'Foundation Models'
  | 'Healthcare AI'
  | 'FinServ AI'
  | 'Retail AI'
  | 'Horizontal Productivity'
  | 'Infrastructure';

const g = (
  names: string[],
  category: VendorCategory,
  industries: string[],
): VendorCatalogEntry[] => names.map((name) => ({ name, category, industries }));

export const VENDOR_CATALOG: VendorCatalogEntry[] = [
  ...g(
    ['Anthropic', 'OpenAI', 'Microsoft', 'Google', 'Meta', 'Mistral', 'Cohere'],
    'Foundation Models',
    ['GENERAL'],
  ),
  ...g(
    [
      'Abridge', 'Nuance DAX', 'Nabla', 'Cohere Health', 'Aidoc', 'Paige.AI',
      'HeartFlow', 'Epic', 'Tempus Next', 'Flywheel.io', 'Hyro', '3M 360 Encompass',
      'First Databank', 'Jeenie', 'Paradox AI', 'Docebo', 'Recursion',
      'Komodo Health', 'NVIDIA Clara', 'Syntegra', 'LeanTaaS iQueue', 'Kronos',
      'AWS Forecast', 'Anaplan',
    ],
    'Healthcare AI',
    ['HEALTHCARE_IDN'],
  ),
  ...g(
    [
      'Hebbia', 'Harvey', 'Kensho', 'Feedzai', 'NICE Actimize', 'Cresta',
      'Personetics', 'Ocrolus', 'Blend', 'Hummingbird', 'Socure', 'Kasisto',
      'Behavox', 'Quavo', 'TrueAccord', 'Zest AI', 'Saifr', 'Observe.AI',
      'AlphaSense', 'Mostly AI', 'ComplyAdvantage', 'Plaid', 'Credo AI',
      'Bloomberg', 'SAS',
    ],
    'FinServ AI',
    ['FINSERV'],
  ),
  ...g(
    [
      'Bloomreach', 'Algolia', 'Dynamic Yield', 'Nosto', 'Constructor.io',
      'Signifyd', 'Forter', 'o9 Solutions', 'Blue Yonder', 'RELEX Solutions',
      'Everseen', 'FourKites', 'Optoro', 'Reflexis', 'Syte', 'Shopify Magic',
      'Sierra', 'Yepic AI', 'Analytic Partners', 'Persado', 'Jasper',
    ],
    'Retail AI',
    ['RETAIL'],
  ),
  ...g(
    [
      'Microsoft Copilot', 'GitHub Copilot', 'Claude Enterprise', 'Moveworks',
      'Glean', 'Watershed', 'Notion AI', 'Codeium', 'Cursor', 'Cognition',
      'Doximity', 'Open Evidence', 'Consensus', 'Midjourney', 'Eightfold',
    ],
    'Horizontal Productivity',
    ['GENERAL'],
  ),
  ...g(
    [
      'Snowflake', 'Databricks', 'dbt', 'Informatica', 'AWS', 'Azure', 'GCP',
      'Oracle', 'Workday', 'SAP', 'Salesforce', 'ServiceNow', 'Genesys',
      'Zscaler', 'Netskope', 'Datadog',
    ],
    'Infrastructure',
    ['GENERAL'],
  ),
];

export const VENDOR_CATEGORIES: VendorCategory[] = [
  'Foundation Models',
  'Healthcare AI',
  'FinServ AI',
  'Retail AI',
  'Horizontal Productivity',
  'Infrastructure',
];

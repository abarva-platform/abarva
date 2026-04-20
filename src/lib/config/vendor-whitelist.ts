export const ALLOWED_AI_VENDORS = [
  // Foundation model providers
  'Anthropic', 'OpenAI', 'Microsoft', 'Google', 'Meta', 'Mistral', 'Cohere',

  // Healthcare AI
  'Abridge', 'Nuance DAX', 'Nabla', 'Cohere Health', 'Aidoc', 'Paige.AI',
  'HeartFlow', 'Epic', 'Tempus Next', 'Flywheel.io', 'Hyro', '3M 360 Encompass',
  'First Databank', 'Jeenie', 'Paradox AI', 'Docebo', 'Recursion',
  'Komodo Health', 'NVIDIA Clara', 'Syntegra', 'LeanTaaS iQueue', 'Kronos',
  'AWS Forecast', 'Anaplan',

  // FinServ AI
  'Hebbia', 'Harvey', 'Kensho', 'Feedzai', 'NICE Actimize', 'Cresta',
  'Personetics', 'Ocrolus', 'Blend', 'Hummingbird', 'Socure', 'Kasisto',
  'Behavox', 'Quavo', 'TrueAccord', 'Zest AI', 'Saifr', 'Observe.AI',
  'AlphaSense', 'Mostly AI', 'ComplyAdvantage', 'Plaid', 'Credo AI',
  'Bloomberg', 'SAS',

  // Retail AI
  'Bloomreach', 'Algolia', 'Dynamic Yield', 'Nosto', 'Constructor.io',
  'Signifyd', 'Forter', 'o9 Solutions', 'Blue Yonder', 'RELEX Solutions',
  'Everseen', 'FourKites', 'Optoro', 'Reflexis', 'Syte', 'Shopify Magic',
  'Sierra', 'Yepic AI', 'Analytic Partners', 'Persado', 'Jasper',

  // Horizontal AI
  'Microsoft Copilot', 'GitHub Copilot', 'Claude Enterprise', 'Moveworks',
  'Glean', 'Watershed', 'Notion AI', 'Codeium', 'Cursor', 'Cognition',
  'Doximity', 'Open Evidence', 'Consensus', 'Midjourney', 'Eightfold',

  // Infra / Platform
  'Snowflake', 'Databricks', 'dbt', 'Informatica', 'AWS', 'Azure', 'GCP',
  'Oracle', 'Workday', 'SAP', 'Salesforce', 'ServiceNow', 'Genesys',
  'Zscaler', 'Netskope', 'Datadog',
] as const;

const VENDOR_SET = new Set(ALLOWED_AI_VENDORS.map((v) => v.toLowerCase()));

export function isVendorAllowed(name: string): boolean {
  return VENDOR_SET.has(name.trim().toLowerCase());
}

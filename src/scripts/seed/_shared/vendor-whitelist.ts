export type VendorPricingModel =
  | 'per_seat'
  | 'per_api_call'
  | 'platform_fee'
  | 'hybrid'

export interface VendorWhitelistEntry {
  name: string
  pricing_model: VendorPricingModel
  typical_monthly_range_enterprise: [number, number]
  contract_terms_typical: string[]
  aliases?: string[]
}

export const FORBIDDEN_CLIENT_NAMES = [
  'cade',
  'mckinsey',
  'bcg',
  'accenture',
  'deloitte',
  'bain',
  'huron',
  'navigant',
  'presbyterian',
  'phs',
  'md anderson',
  'commonspirit',
  'hp inc',
  'meridian health system dupe',
  'first capital financial dupe',
] as const

export const ALLOWED_AI_VENDORS: VendorWhitelistEntry[] = [
  { name: 'Anthropic', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [5000, 450000], contract_terms_typical: ['annual commit', 'usage overage'], aliases: ['Claude', 'Claude.ai consumer', 'Claude Enterprise', 'Claude Enterprise (custom)'] },
  { name: 'OpenAI', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [5000, 650000], contract_terms_typical: ['usage-based', 'annual minimum'], aliases: ['ChatGPT Plus', 'OpenAI / Anthropic consumer', 'OpenAI'] },
  { name: 'Microsoft', pricing_model: 'hybrid', typical_monthly_range_enterprise: [20000, 1200000], contract_terms_typical: ['EA amendment', 'annual true-up'], aliases: ['Microsoft Copilot', 'Microsoft Copilot for M365', 'M365 Copilot', 'Microsoft Copilot for Frontline', 'Nuance DAX Copilot', 'Microsoft Copilot Studio', 'Azure OpenAI'] },
  { name: 'Google', pricing_model: 'hybrid', typical_monthly_range_enterprise: [10000, 500000], contract_terms_typical: ['workspace add-on', 'cloud commit'] },
  { name: 'Meta', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [0, 150000], contract_terms_typical: ['open-weight model usage'], aliases: ['Llama 3'] },
  { name: 'Mistral', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [5000, 180000], contract_terms_typical: ['usage commit'] },
  { name: 'Cohere', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [10000, 220000], contract_terms_typical: ['annual commit'] },
  { name: 'Abridge', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [80000, 600000], contract_terms_typical: ['multi-year enterprise license', 'provider-volume tiering'], aliases: ['Abridge (nursing beta)'] },
  { name: 'Nuance DAX', pricing_model: 'per_seat', typical_monthly_range_enterprise: [50000, 300000], contract_terms_typical: ['provider seat license', 'annual renewal'], aliases: ['Nuance DAX Copilot'] },
  { name: 'Nabla', pricing_model: 'per_seat', typical_monthly_range_enterprise: [10000, 120000], contract_terms_typical: ['provider seat license'] },
  { name: 'Cohere Health', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [40000, 350000], contract_terms_typical: ['payer/provider line-of-business pricing'] },
  { name: 'Aidoc', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [60000, 250000], contract_terms_typical: ['study-volume tiering', 'annual support fee'] },
  { name: 'Paige.AI', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [30000, 180000], contract_terms_typical: ['site license', 'modality add-on'] },
  { name: 'HeartFlow', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [25000, 160000], contract_terms_typical: ['study-based pricing'] },
  { name: 'Epic', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [50000, 400000], contract_terms_typical: ['module add-on', 'annual maintenance'], aliases: ['Epic Art of Medicine', 'Epic + Flywheel.io', 'Epic + internal model', 'Epic + Azure OpenAI'] },
  { name: 'Tempus Next', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [30000, 200000], contract_terms_typical: ['multi-year license'] },
  { name: 'Flywheel.io', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [15000, 120000], contract_terms_typical: ['research network contract'] },
  { name: 'Hyro', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [20000, 150000], contract_terms_typical: ['conversation-volume tiering'], aliases: ['Hyro + Epic MyChart'] },
  { name: '3M 360 Encompass', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [30000, 180000], contract_terms_typical: ['coder seat add-on'] },
  { name: 'First Databank', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [15000, 90000], contract_terms_typical: ['reference data subscription'] },
  { name: 'Jeenie', pricing_model: 'hybrid', typical_monthly_range_enterprise: [8000, 80000], contract_terms_typical: ['usage plus enterprise minimum'] },
  { name: 'Paradox AI', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [15000, 125000], contract_terms_typical: ['recruiting workflow license'] },
  { name: 'Docebo', pricing_model: 'per_seat', typical_monthly_range_enterprise: [15000, 100000], contract_terms_typical: ['annual LMS license'], aliases: ['Docebo AI'] },
  { name: 'Recursion', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [75000, 350000], contract_terms_typical: ['research partnership agreement'] },
  { name: 'Komodo Health', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [40000, 220000], contract_terms_typical: ['data subscription', 'analyst seats'] },
  { name: 'NVIDIA Clara', pricing_model: 'hybrid', typical_monthly_range_enterprise: [30000, 250000], contract_terms_typical: ['GPU commit', 'platform license'] },
  { name: 'Syntegra', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [15000, 100000], contract_terms_typical: ['annual subscription'] },
  { name: 'LeanTaaS iQueue', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [30000, 200000], contract_terms_typical: ['facility-based license'] },
  { name: 'Hebbia', pricing_model: 'per_seat', typical_monthly_range_enterprise: [40000, 200000], contract_terms_typical: ['workspace license', 'seat minimum'] },
  { name: 'Harvey', pricing_model: 'per_seat', typical_monthly_range_enterprise: [30000, 180000], contract_terms_typical: ['seat minimum', 'annual commit'], aliases: ['Harvey AI'] },
  { name: 'Kensho', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [80000, 300000], contract_terms_typical: ['market-data license'] },
  { name: 'Feedzai', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [120000, 500000], contract_terms_typical: ['transaction-volume pricing'] },
  { name: 'NICE Actimize', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [100000, 450000], contract_terms_typical: ['investigator seats', 'case-volume tiering'], aliases: ['NICE Actimize + internal'] },
  { name: 'Cresta', pricing_model: 'per_seat', typical_monthly_range_enterprise: [50000, 250000], contract_terms_typical: ['agent seat license'], aliases: ['Cresta + Genesys'] },
  { name: 'Personetics', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [100000, 350000], contract_terms_typical: ['customer-volume tiering'] },
  { name: 'Ocrolus', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [30000, 220000], contract_terms_typical: ['document volume pricing'] },
  { name: 'Blend', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [40000, 250000], contract_terms_typical: ['loan-volume tiering'] },
  { name: 'Hummingbird', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [20000, 120000], contract_terms_typical: ['entity-volume pricing'] },
  { name: 'Socure', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [25000, 180000], contract_terms_typical: ['verification-volume pricing'] },
  { name: 'Kasisto', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [25000, 150000], contract_terms_typical: ['conversation-volume pricing'] },
  { name: 'Behavox', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [30000, 180000], contract_terms_typical: ['surveillance seat license'] },
  { name: 'Quavo', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [15000, 100000], contract_terms_typical: ['case-volume pricing'] },
  { name: 'TrueAccord', pricing_model: 'hybrid', typical_monthly_range_enterprise: [20000, 120000], contract_terms_typical: ['performance-based collections pricing'] },
  { name: 'Zest AI', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [20000, 150000], contract_terms_typical: ['annual model license'] },
  { name: 'Saifr', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [15000, 90000], contract_terms_typical: ['annual license'] },
  { name: 'Observe.AI', pricing_model: 'per_seat', typical_monthly_range_enterprise: [30000, 180000], contract_terms_typical: ['agent seat license'] },
  { name: 'AlphaSense', pricing_model: 'per_seat', typical_monthly_range_enterprise: [25000, 160000], contract_terms_typical: ['seat packs'], aliases: ['AlphaSense + Cohere', 'AlphaSense trial'] },
  { name: 'Mostly AI', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [20000, 140000], contract_terms_typical: ['annual synthetic data license'] },
  { name: 'ComplyAdvantage', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [15000, 120000], contract_terms_typical: ['screening-volume pricing'] },
  { name: 'Plaid', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [10000, 150000], contract_terms_typical: ['API usage pricing'] },
  { name: 'Credo AI', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [15000, 100000], contract_terms_typical: ['annual governance license'] },
  { name: 'Bloomreach', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [80000, 350000], contract_terms_typical: ['GMV tiering'], aliases: ['Bloomreach Engagement + Discovery'] },
  { name: 'Algolia', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [15000, 150000], contract_terms_typical: ['query-volume pricing'], aliases: ['Algolia + internal rerank'] },
  { name: 'Dynamic Yield', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [40000, 200000], contract_terms_typical: ['site traffic tiering'] },
  { name: 'Nosto', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [20000, 120000], contract_terms_typical: ['traffic and recommendation volume pricing'], aliases: ['Nosto + internal'] },
  { name: 'Constructor.io', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [25000, 140000], contract_terms_typical: ['site traffic tiering'] },
  { name: 'Signifyd', pricing_model: 'hybrid', typical_monthly_range_enterprise: [80000, 300000], contract_terms_typical: ['GMV basis points', 'minimum platform fee'] },
  { name: 'Forter', pricing_model: 'hybrid', typical_monthly_range_enterprise: [60000, 250000], contract_terms_typical: ['GMV-based pricing'] },
  { name: 'o9 Solutions', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [180000, 500000], contract_terms_typical: ['module license', 'implementation services'] },
  { name: 'Blue Yonder', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [120000, 400000], contract_terms_typical: ['category or node-based pricing'], aliases: ['Blue Yonder + o9'] },
  { name: 'RELEX Solutions', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [90000, 300000], contract_terms_typical: ['store/node pricing'] },
  { name: 'Everseen', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [50000, 250000], contract_terms_typical: ['camera/site pricing'] },
  { name: 'FourKites', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [30000, 180000], contract_terms_typical: ['shipment-volume pricing'] },
  { name: 'Optoro', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [25000, 120000], contract_terms_typical: ['returns-volume pricing'] },
  { name: 'Reflexis', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [30000, 160000], contract_terms_typical: ['store-license'], aliases: ['Reflexis (Zebra)'] },
  { name: 'Syte', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [20000, 120000], contract_terms_typical: ['site license'] },
  { name: 'Shopify Magic', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [10000, 80000], contract_terms_typical: ['Shopify Plus add-on'] },
  { name: 'Sierra', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [20000, 150000], contract_terms_typical: ['pilot-to-enterprise conversion'] },
  { name: 'Yepic AI', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [5000, 60000], contract_terms_typical: ['usage tiering'] },
  { name: 'Analytic Partners', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [30000, 180000], contract_terms_typical: ['annual analytics subscription'] },
  { name: 'Persado', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [20000, 140000], contract_terms_typical: ['message-volume pricing'] },
  { name: 'Jasper', pricing_model: 'per_seat', typical_monthly_range_enterprise: [5000, 75000], contract_terms_typical: ['seat bundles'], aliases: ['Jasper + Anthropic'] },
  { name: 'GitHub Copilot', pricing_model: 'per_seat', typical_monthly_range_enterprise: [5000, 120000], contract_terms_typical: ['seat license'], aliases: ['GitHub Copilot Enterprise', 'GitHub Copilot'] },
  { name: 'Moveworks', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [50000, 250000], contract_terms_typical: ['employee-volume tiering'] },
  { name: 'Glean', pricing_model: 'per_seat', typical_monthly_range_enterprise: [20000, 180000], contract_terms_typical: ['knowledge-worker seat packs'] },
  { name: 'Watershed', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [15000, 90000], contract_terms_typical: ['annual ESG reporting license'] },
  { name: 'Notion AI', pricing_model: 'per_seat', typical_monthly_range_enterprise: [5000, 50000], contract_terms_typical: ['seat add-on'] },
  { name: 'Codeium', pricing_model: 'per_seat', typical_monthly_range_enterprise: [0, 30000], contract_terms_typical: ['seat license', 'team plan'], aliases: ['personal Codeium accounts'] },
  { name: 'Cursor', pricing_model: 'per_seat', typical_monthly_range_enterprise: [5000, 45000], contract_terms_typical: ['seat license'] },
  { name: 'Cognition', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [10000, 150000], contract_terms_typical: ['pilot subscription'], aliases: ['Devin'] },
  { name: 'Doximity', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [5000, 60000], contract_terms_typical: ['clinical seat license'], aliases: ['Doximity GPT'] },
  { name: 'Open Evidence', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [5000, 50000], contract_terms_typical: ['enterprise reference subscription'] },
  { name: 'Consensus', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [3000, 25000], contract_terms_typical: ['seat or team subscription'] },
  { name: 'Midjourney', pricing_model: 'per_seat', typical_monthly_range_enterprise: [3000, 40000], contract_terms_typical: ['seat plans'] },
  { name: 'Eightfold', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [20000, 180000], contract_terms_typical: ['annual talent intelligence license'], aliases: ['Eightfold AI'] },
  { name: 'Snowflake', pricing_model: 'hybrid', typical_monthly_range_enterprise: [50000, 500000], contract_terms_typical: ['capacity commit', 'consumption overage'], aliases: ['Snowflake Cortex'] },
  { name: 'Databricks', pricing_model: 'hybrid', typical_monthly_range_enterprise: [50000, 450000], contract_terms_typical: ['DBU commit', 'consumption overage'] },
  { name: 'dbt', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [10000, 120000], contract_terms_typical: ['developer seat pricing'] },
  { name: 'Informatica', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [25000, 220000], contract_terms_typical: ['node-based pricing'] },
  { name: 'AWS', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [50000, 600000], contract_terms_typical: ['cloud commit', 'consumption pricing'], aliases: ['AWS Forecast', 'AWS Bedrock', 'SageMaker', 'p5 instances'] },
  { name: 'Azure', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [20000, 400000], contract_terms_typical: ['cloud commit', 'consumption pricing'], aliases: ['Azure OpenAI'] },
  { name: 'GCP', pricing_model: 'per_api_call', typical_monthly_range_enterprise: [10000, 350000], contract_terms_typical: ['cloud commit'] },
  { name: 'Oracle', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [30000, 250000], contract_terms_typical: ['module license'] },
  { name: 'Workday', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [30000, 250000], contract_terms_typical: ['employee-volume pricing'] },
  { name: 'SAP', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [50000, 500000], contract_terms_typical: ['module license'], aliases: ['SAP S/4'] },
  { name: 'Salesforce', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [30000, 300000], contract_terms_typical: ['cloud module pricing'], aliases: ['Salesforce Financial Services Cloud', 'Salesforce Commerce'] },
  { name: 'ServiceNow', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [30000, 300000], contract_terms_typical: ['module license'] },
  { name: 'Genesys', pricing_model: 'per_seat', typical_monthly_range_enterprise: [20000, 220000], contract_terms_typical: ['agent seat license'], aliases: ['Genesys Cloud CX'] },
  { name: 'Zscaler', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [25000, 180000], contract_terms_typical: ['network security license'] },
  { name: 'Netskope', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [25000, 180000], contract_terms_typical: ['security subscription'] },
  { name: 'Datadog', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [15000, 150000], contract_terms_typical: ['host and event pricing'] },
  { name: 'Bloomberg', pricing_model: 'per_seat', typical_monthly_range_enterprise: [30000, 250000], contract_terms_typical: ['terminal seat pricing'] },
  { name: 'Kronos', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [15000, 120000], contract_terms_typical: ['workforce scheduling license'] },
  { name: 'Anaplan', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [25000, 180000], contract_terms_typical: ['workspace license'] },
  { name: 'SAS', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [20000, 200000], contract_terms_typical: ['analytics platform license'] },
  { name: 'Verint', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [20000, 160000], contract_terms_typical: ['seat license'] },
  { name: 'DocuSign AI Navigator', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [5000, 60000], contract_terms_typical: ['annual enterprise add-on'] },
  { name: 'Zapier AI', pricing_model: 'platform_fee', typical_monthly_range_enterprise: [1000, 20000], contract_terms_typical: ['task-volume pricing'] },
]

const ALLOWED_NON_VENDOR_REFERENCES = [
  'internal',
  'outside counsel',
  'vendor selection',
  'custom',
  'research arm',
  'internal model',
  'internal ml',
  'various',
]

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function assertNoForbiddenClientNames(context: string, values: string[]) {
  const lowered = values.map(normalize).join(' ')
  const match = FORBIDDEN_CLIENT_NAMES.find(name => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i')
    return pattern.test(lowered)
  })
  if (match) {
    throw new Error(`${context} contains forbidden client or firm reference: "${match}"`)
  }
}

export function findVendorEntryByProduct(productName: string) {
  const normalizedProduct = normalize(productName)
  return ALLOWED_AI_VENDORS.find(entry => {
    if (normalize(entry.name) === normalizedProduct) return true
    return (entry.aliases || []).some(alias => normalize(alias) === normalizedProduct || normalizedProduct.includes(normalize(alias)))
      || normalizedProduct.includes(normalize(entry.name))
  })
}

export function isAllowedNonVendorReference(productName: string) {
  const normalized = normalize(productName)
  return ALLOWED_NON_VENDOR_REFERENCES.some(entry => normalized.includes(entry))
}

export function assertAllowedVendorProducts(context: string, productNames: string[]) {
  for (const productName of productNames) {
    if (isAllowedNonVendorReference(productName)) {
      continue
    }
    if (!findVendorEntryByProduct(productName)) {
      throw new Error(`${context} references non-whitelisted vendor/product: "${productName}"`)
    }
  }
}

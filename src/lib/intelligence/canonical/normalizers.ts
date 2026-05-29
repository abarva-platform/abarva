import {
  CANONICAL_CONFIDENCE_LEVELS,
  CANONICAL_ENTERPRISE_AREAS,
  CANONICAL_INDUSTRIES,
  CANONICAL_MATURITY_LEVELS,
  CANONICAL_STRATEGIC_MOVE_PHASES,
  type CanonicalConfidenceLevel,
  type CanonicalEnterpriseArea,
  type CanonicalIndustry,
  type CanonicalMaturityLevel,
  type CanonicalStrategicMovePhase,
} from './industry-ai-pattern';

export interface CanonicalNormalizationResult<T extends string> {
  raw: string[];
  values: T[];
  unresolved: string[];
}

type AliasMap<T extends string> = Record<string, readonly T[]>;

const INDUSTRY_ALIASES: AliasMap<CanonicalIndustry> = {
  retail: ['retail'],
  retail_cpg: ['retail'],
  retailcpg: ['retail'],
  cpg: ['retail'],
  commerce: ['retail'],
  healthcare: ['healthcare_provider'],
  health_care: ['healthcare_provider'],
  healthcare_provider: ['healthcare_provider'],
  provider: ['healthcare_provider'],
  payer: ['healthcare_provider'],
  healthcare_medtech: ['healthcare_medtech'],
  medtech: ['healthcare_medtech'],
  medical_device: ['healthcare_medtech'],
  solventum: ['healthcare_medtech'],
  financial_services: ['financial_services'],
  financial_service: ['financial_services'],
  financial_services_energy: ['financial_services', 'energy'],
  financial_services_banking: ['financial_services_banking'],
  finserv: ['financial_services'],
  finance: ['financial_services'],
  fs: ['financial_services'],
  banking: ['financial_services_banking'],
  insurance: ['financial_services'],
  airline: ['airline'],
  aviation: ['airline'],
  global_network_airline: ['airline'],
  cross_industry: ['cross_industry'],
  cross_sector: ['cross_industry'],
  crossindustry: ['cross_industry'],
  enterprise: ['cross_industry'],
  energy: ['energy'],
  public_sector: ['public_sector'],
  government: ['public_sector'],
};

const ENTERPRISE_AREA_ALIASES: AliasMap<CanonicalEnterpriseArea> = {
  front: ['front_office'],
  front_office: ['front_office'],
  customer: ['front_office'],
  customer_experience: ['front_office'],
  patient_experience: ['front_office'],
  member_experience: ['front_office'],
  sales: ['front_office'],
  marketing: ['front_office'],
  contact_center: ['front_office'],
  middle: ['middle_office'],
  middle_office: ['middle_office'],
  operations: ['middle_office'],
  risk: ['middle_office'],
  compliance: ['middle_office'],
  clinical_operations: ['middle_office'],
  merchandising: ['middle_office'],
  supply_chain: ['middle_office'],
  back: ['back_office'],
  back_office: ['back_office'],
  finance: ['back_office'],
  hr: ['back_office'],
  procurement: ['back_office'],
  legal: ['back_office'],
  it: ['back_office'],
  enterprise_platform: ['enterprise_platform'],
  platform: ['enterprise_platform'],
  data_platform: ['enterprise_platform'],
};

const STRATEGIC_MOVE_PHASE_ALIASES: AliasMap<CanonicalStrategicMovePhase> = {
  p0: ['originate'],
  originate: ['originate'],
  origination: ['originate'],
  p1: ['charter'],
  charter: ['charter'],
  intake: ['charter'],
  p2: ['diagnose_discover'],
  diagnose: ['diagnose_discover'],
  discover: ['diagnose_discover'],
  diagnosis: ['diagnose_discover'],
  discovery: ['diagnose_discover'],
  diagnose_discover: ['diagnose_discover'],
  p3: ['design'],
  design: ['design'],
  solution_design: ['design'],
  p4: ['roadmap_business_case_change_value_plan'],
  roadmap: ['roadmap_business_case_change_value_plan'],
  estimates: ['roadmap_business_case_change_value_plan'],
  business_case: ['roadmap_business_case_change_value_plan'],
  change_plan: ['roadmap_business_case_change_value_plan'],
  value_realization_plan: ['roadmap_business_case_change_value_plan'],
  roadmap_business_case_change_value_plan: ['roadmap_business_case_change_value_plan'],
  p5: ['mobilize_handoff'],
  mobilize: ['mobilize_handoff'],
  mobilization: ['mobilize_handoff'],
  handoff: ['mobilize_handoff'],
  mobilize_handoff: ['mobilize_handoff'],
  mobilize_and_handoff: ['mobilize_handoff'],
};

const CONFIDENCE_ALIASES: AliasMap<CanonicalConfidenceLevel> = {
  low: ['low'],
  l: ['low'],
  medium: ['medium'],
  med: ['medium'],
  m: ['medium'],
  high: ['high'],
  h: ['high'],
  validated: ['validated'],
  validate: ['validated'],
  verified: ['validated'],
};

const MATURITY_ALIASES: AliasMap<CanonicalMaturityLevel> = {
  emerging: ['emerging'],
  new: ['emerging'],
  proven: ['proven'],
  mature: ['proven'],
  scaled: ['scaled'],
  scale: ['scaled'],
  advanced: ['scaled'],
  experimental: ['experimental'],
  frontier: ['experimental'],
};

function splitRaw(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(splitRaw);
  }

  if (value === null || value === undefined) return [];

  return String(value)
    .split(/[,/|;]+|\band\b/gi)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]+/g, '')
    .replace(/^_+|_+$/g, '');
}

function unique<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function normalizeWithAliases<T extends string>(
  value: unknown,
  aliases: AliasMap<T>,
  options: {
    allowed?: readonly T[];
    fallback?: T;
  } = {},
): CanonicalNormalizationResult<T> {
  const raw = splitRaw(value);
  const values: T[] = [];
  const unresolved: string[] = [];
  const allowed = new Set(options.allowed ?? []);

  for (const item of raw) {
    const token = normalizeToken(item);
    const aliasValues = aliases[token] ?? (allowed.has(token as T) ? [token as T] : undefined);

    if (aliasValues) {
      values.push(...aliasValues);
    } else {
      unresolved.push(item);
    }
  }

  if (values.length === 0 && options.fallback) {
    values.push(options.fallback);
  }

  return {
    raw,
    values: unique(values),
    unresolved: unique(unresolved),
  };
}

function normalizeFreeform(value: unknown): CanonicalNormalizationResult<string> {
  const raw = splitRaw(value);
  const values = raw.map(normalizeToken).filter(Boolean);
  return {
    raw,
    values: values.length > 0 ? unique(values) : ['other'],
    unresolved: values.length > 0 ? [] : raw,
  };
}

export function normalizeIndustry(value: unknown): CanonicalNormalizationResult<CanonicalIndustry> {
  return normalizeWithAliases(value, INDUSTRY_ALIASES, {
    allowed: CANONICAL_INDUSTRIES,
    fallback: 'other',
  });
}

export function normalizeEnterpriseArea(value: unknown): CanonicalNormalizationResult<CanonicalEnterpriseArea> {
  return normalizeWithAliases(value, ENTERPRISE_AREA_ALIASES, {
    allowed: CANONICAL_ENTERPRISE_AREAS,
  });
}

export function normalizeFunction(value: unknown): CanonicalNormalizationResult<string> {
  return normalizeFreeform(value);
}

export function normalizeProcessArea(value: unknown): CanonicalNormalizationResult<string> {
  return normalizeFreeform(value);
}

export function normalizeUseCaseCategory(value: unknown): CanonicalNormalizationResult<string> {
  return normalizeFreeform(value);
}

export function normalizeStrategicMovePhase(value: unknown): CanonicalNormalizationResult<CanonicalStrategicMovePhase> {
  return normalizeWithAliases(value, STRATEGIC_MOVE_PHASE_ALIASES, {
    allowed: CANONICAL_STRATEGIC_MOVE_PHASES,
  });
}

export function normalizeConfidenceLevel(value: unknown): CanonicalNormalizationResult<CanonicalConfidenceLevel> {
  if (typeof value === 'number') {
    if (value >= 0.8) return { raw: [String(value)], values: ['high'], unresolved: [] };
    if (value >= 0.6) return { raw: [String(value)], values: ['medium'], unresolved: [] };
    return { raw: [String(value)], values: ['low'], unresolved: [] };
  }

  return normalizeWithAliases(value, CONFIDENCE_ALIASES, {
    allowed: CANONICAL_CONFIDENCE_LEVELS,
  });
}

export function normalizeMaturityLevel(value: unknown): CanonicalNormalizationResult<CanonicalMaturityLevel> {
  return normalizeWithAliases(value, MATURITY_ALIASES, {
    allowed: CANONICAL_MATURITY_LEVELS,
  });
}

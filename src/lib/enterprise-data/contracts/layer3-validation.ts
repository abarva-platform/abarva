import type { CanonicalDomain, CanonicalValue } from "./canonical-ingestion";
import type { MappingProfile, MappingRule } from "./mapping-registry";
import type { TenantPacketSourceClass } from "./tenant-packet";

export type CanonicalObjectFamily =
  | "enterprise"
  | "organization"
  | "workforce"
  | "application"
  | "data"
  | "infrastructure"
  | "vendor"
  | "finance"
  | "program"
  | "ai"
  | "risk"
  | "process"
  | "evidence"
  | "industry"
  | "expert"
  | "relationship";

export type FactAuthorityKind =
  | "source_owned_descriptive"
  | "source_owned_count"
  | "source_owned_financial"
  | "derived_deterministic";

export type FactUsePolicy =
  | "may_project_with_evidence"
  | "must_not_be_model_invented";

export type RelationshipCategory =
  | "ownership"
  | "dependency"
  | "hosting"
  | "system_role"
  | "vendor"
  | "financial"
  | "risk"
  | "data_flow"
  | "usage"
  | "transformation"
  | "governance"
  | "rollup";

export interface CanonicalObjectDefinition {
  objectType: string;
  objectFamily: CanonicalObjectFamily;
  canonicalDomain: CanonicalDomain;
  sourceClasses: TenantPacketSourceClass[];
  identityAttributes: string[];
  displayNameAttribute: string;
  evidenceRequired: "source_file" | "source_file_and_row";
}

export interface FactAuthorityDefinition {
  factKey: string;
  objectType: string;
  attribute: string;
  valueType: CanonicalValue["valueType"];
  authorityKind: FactAuthorityKind;
  sourceLayer: "Layer 1" | "Layer 2" | "Layer 3";
  deterministic: boolean;
  usePolicy: FactUsePolicy;
  evidenceRequired: "source_file" | "source_file_and_row";
}

export interface RelationshipDictionaryEntry {
  relationshipType: string;
  canonicalLabel: string;
  inverseLabel: string;
  category: RelationshipCategory;
  directed: boolean;
  executiveSafe: boolean;
  allowedSourceFamilies: CanonicalObjectFamily[];
  allowedTargetFamilies: CanonicalObjectFamily[];
  aliases: string[];
  description: string;
}

export interface Layer3ValidationScaffoldReport {
  mappedObjectTypes: string[];
  objectRegistryGaps: string[];
  factAuthorityCheckedRules: string[];
  factAuthorityGaps: string[];
  relationshipDictionaryCheckedRules: string[];
  relationshipDictionaryGaps: string[];
}

export const CANONICAL_OBJECT_REGISTRY: CanonicalObjectDefinition[] = [
  objectDefinition(
    "enterprise_profile",
    "enterprise",
    "enterprise_structure",
    ["enterprise_profile"],
    ["entityName"],
  ),
  objectDefinition(
    "business_function",
    "organization",
    "enterprise_structure",
    ["organization_functions"],
    ["functionName"],
  ),
  objectDefinition(
    "organization_unit",
    "organization",
    "enterprise_structure",
    ["organization_functions"],
    ["orgUnit"],
  ),
  objectDefinition(
    "workforce_role",
    "workforce",
    "enterprise_structure",
    ["organization_functions"],
    ["personaOrRole", "functionName"],
  ),
  objectDefinition(
    "application_system",
    "application",
    "technology_estate",
    ["applications_systems"],
    ["systemName"],
  ),
  objectDefinition(
    "data_asset",
    "data",
    "technology_estate",
    ["data_assets_integrations"],
    ["dataAssetName"],
  ),
  objectDefinition(
    "infrastructure_platform",
    "infrastructure",
    "technology_estate",
    ["infrastructure_platforms"],
    ["platformName"],
  ),
  objectDefinition(
    "vendor_contract",
    "vendor",
    "vendor_commercial_estate",
    ["vendors_contracts"],
    ["vendorName"],
  ),
  objectDefinition(
    "spend_value_signal",
    "finance",
    "financial_value",
    ["spend_value"],
    ["spendCategory"],
  ),
  objectDefinition(
    "program_initiative",
    "program",
    "transformation_ai_portfolio",
    ["programs_priorities"],
    ["programName"],
  ),
  objectDefinition(
    "ai_use_case",
    "ai",
    "transformation_ai_portfolio",
    ["ai_automation_use_cases"],
    ["useCaseName"],
  ),
  objectDefinition(
    "risk_control",
    "risk",
    "risk_control_governance",
    ["risks_controls"],
    ["riskOrControlName"],
  ),
  objectDefinition(
    "evidence_source",
    "evidence",
    "intelligence_answering",
    ["evidence_registry"],
    ["sourceFile"],
  ),
  objectDefinition(
    "metric_outcome",
    "finance",
    "tower_outcomes",
    ["metrics_outcomes"],
    ["metricName"],
  ),
  objectDefinition(
    "industry_context_pattern",
    "industry",
    "intelligence_answering",
    ["industry_context_patterns"],
    ["patternName"],
  ),
  objectDefinition(
    "expert_lens",
    "expert",
    "intelligence_answering",
    ["expert_lenses"],
    ["lensName"],
  ),
  objectDefinition(
    "managed_service_scope",
    "vendor",
    "vendor_commercial_estate",
    ["service_scope_managed_services"],
    ["serviceName"],
  ),
  objectDefinition(
    "operational_process",
    "process",
    "enterprise_structure",
    ["operational_process_evidence"],
    ["processName"],
  ),
  objectDefinition(
    "relationship_edge",
    "relationship",
    "intelligence_answering",
    ["evidence_registry"],
    ["relationshipType"],
  ),
];

export const FACT_AUTHORITY_REGISTRY: FactAuthorityDefinition[] = [
  financialFact(
    "enterprise_profile.revenueUsd",
    "enterprise_profile",
    "revenueUsd",
  ),
  countFact(
    "enterprise_profile.employeeCount",
    "enterprise_profile",
    "employeeCount",
  ),
  financialFact(
    "business_function.annualBudgetUsd",
    "business_function",
    "annualBudgetUsd",
  ),
  countFact("business_function.fteCount", "business_function", "fteCount"),
  countFact("workforce_role.roleCount", "workforce_role", "roleCount"),
  financialFact(
    "vendor_contract.annualSpendUsd",
    "vendor_contract",
    "annualSpendUsd",
  ),
  financialFact(
    "spend_value_signal.annualSpendUsd",
    "spend_value_signal",
    "annualSpendUsd",
  ),
  financialFact(
    "spend_value_signal.savingsOpportunityUsd",
    "spend_value_signal",
    "savingsOpportunityUsd",
  ),
  financialFact(
    "managed_service_scope.runCostUsd",
    "managed_service_scope",
    "runCostUsd",
  ),
  financialFact(
    "program_initiative.budgetUsd",
    "program_initiative",
    "budgetUsd",
  ),
  financialFact(
    "program_initiative.expectedValueUsd",
    "program_initiative",
    "expectedValueUsd",
  ),
];

export const RELATIONSHIP_TYPE_DICTIONARY: RelationshipDictionaryEntry[] = [
  relationship("SUPPORTS", "supports", "is supported by", "dependency", [
    "supporting",
  ]),
  relationship("DEPENDS_ON", "depends on", "is depended on by", "dependency", [
    "depends on",
    "requires",
  ]),
  relationship("HOSTED_ON", "hosted on", "hosts", "hosting", [
    "hosted on",
    "runs on",
  ]),
  relationship("OWNED_BY", "owned by", "owns", "ownership", [
    "owner",
    "owned by",
    "owned_by",
  ]),
  relationship(
    "PRIMARY_SYSTEM_FOR",
    "primary system for",
    "has primary system",
    "system_role",
    ["primary", "primary system"],
  ),
  relationship(
    "SYSTEM_OF_RECORD_FOR",
    "system of record for",
    "has system of record",
    "system_role",
    ["system_of_record", "system of record"],
  ),
  relationship(
    "VENDOR_SUPPORTS_SYSTEM",
    "vendor supports system",
    "system supported by vendor",
    "vendor",
    ["vendor supported system", "vendor matched to supported system evidence"],
  ),
  relationship("FUNDS", "funds", "is funded by", "financial"),
  relationship("MITIGATES", "mitigates", "is mitigated by", "risk"),
  relationship("FEEDS", "feeds", "is fed by", "data_flow"),
  relationship("BLOCKS", "blocks", "is blocked by", "dependency"),
  relationship("MEASURES", "measures", "is measured by", "usage"),
  relationship("USES", "uses", "is used by", "usage"),
  relationship(
    "MODERNIZES",
    "modernizes",
    "is modernized by",
    "transformation",
  ),
  relationship("IMPACTS", "impacts", "is impacted by", "dependency"),
  relationship("GOVERNS", "governs", "is governed by", "governance"),
  relationship("ROLLS_UP_TO", "rolls up to", "rolls down to", "rollup", [
    "rolls up to",
    "parent",
  ]),
];

const objectRegistryByType = new Map(
  CANONICAL_OBJECT_REGISTRY.map((entry) => [entry.objectType, entry]),
);
const factAuthorityByKey = new Map(
  FACT_AUTHORITY_REGISTRY.map((entry) => [entry.factKey, entry]),
);
const relationshipDictionaryByType = new Map(
  RELATIONSHIP_TYPE_DICTIONARY.map((entry) => [entry.relationshipType, entry]),
);
const relationshipDictionaryByAlias = new Map(
  RELATIONSHIP_TYPE_DICTIONARY.flatMap((entry) =>
    [entry.relationshipType, entry.canonicalLabel, ...entry.aliases].map(
      (alias) => [normalizeRelationshipToken(alias), entry],
    ),
  ),
);

export function getCanonicalObjectDefinition(
  objectType: string,
): CanonicalObjectDefinition | undefined {
  return objectRegistryByType.get(objectType);
}

export function getFactAuthorityDefinition(
  factKey: string,
): FactAuthorityDefinition | undefined {
  return factAuthorityByKey.get(factKey);
}

export function getRelationshipDictionaryEntry(
  relationshipType: string,
): RelationshipDictionaryEntry | undefined {
  return relationshipDictionaryByType.get(relationshipType);
}

export function normalizeRelationshipType(
  rawRelationshipType: string,
): RelationshipDictionaryEntry | undefined {
  return relationshipDictionaryByAlias.get(
    normalizeRelationshipToken(rawRelationshipType),
  );
}

export function buildLayer3ValidationScaffoldReport(
  profiles: MappingProfile[],
): Layer3ValidationScaffoldReport {
  const rules = profiles.flatMap((profile) => profile.rules);
  const mappedObjectTypes = [
    ...new Set(rules.map((rule) => rule.targetObjectType)),
  ].sort();
  const objectRegistryGaps = mappedObjectTypes.filter(
    (objectType) => !getCanonicalObjectDefinition(objectType),
  );

  const factAuthorityCheckedRules = rules
    .filter(ruleRequiresFactAuthority)
    .map(ruleKey)
    .sort();
  const factAuthorityGaps = factAuthorityCheckedRules.filter(
    (key) => !getFactAuthorityDefinition(key),
  );

  const relationshipDictionaryCheckedRules = rules
    .filter((rule) => Boolean(rule.targetRelationshipType))
    .map((rule) => `${rule.mappingProfile}:${rule.targetRelationshipType}`)
    .sort();
  const relationshipDictionaryGaps = relationshipDictionaryCheckedRules.filter(
    (key) => {
      const relationshipType = key.split(":").at(-1);
      return !relationshipType || !normalizeRelationshipType(relationshipType);
    },
  );

  return {
    mappedObjectTypes,
    objectRegistryGaps,
    factAuthorityCheckedRules,
    factAuthorityGaps,
    relationshipDictionaryCheckedRules,
    relationshipDictionaryGaps,
  };
}

function objectDefinition(
  objectType: string,
  objectFamily: CanonicalObjectFamily,
  canonicalDomain: CanonicalDomain,
  sourceClasses: TenantPacketSourceClass[],
  identityAttributes: string[],
): CanonicalObjectDefinition {
  return {
    objectType,
    objectFamily,
    canonicalDomain,
    sourceClasses,
    identityAttributes,
    displayNameAttribute: identityAttributes[0],
    evidenceRequired: "source_file_and_row",
  };
}

function financialFact(
  factKey: string,
  objectType: string,
  attribute: string,
): FactAuthorityDefinition {
  return {
    factKey,
    objectType,
    attribute,
    valueType: "currency",
    authorityKind: "source_owned_financial",
    sourceLayer: "Layer 3",
    deterministic: true,
    usePolicy: "must_not_be_model_invented",
    evidenceRequired: "source_file_and_row",
  };
}

function countFact(
  factKey: string,
  objectType: string,
  attribute: string,
): FactAuthorityDefinition {
  return {
    factKey,
    objectType,
    attribute,
    valueType: "number",
    authorityKind: "source_owned_count",
    sourceLayer: "Layer 3",
    deterministic: true,
    usePolicy: "must_not_be_model_invented",
    evidenceRequired: "source_file_and_row",
  };
}

function relationship(
  relationshipType: string,
  canonicalLabel: string,
  inverseLabel: string,
  category: RelationshipCategory,
  aliases: string[] = [],
): RelationshipDictionaryEntry {
  return {
    relationshipType,
    canonicalLabel,
    inverseLabel,
    category,
    directed: true,
    executiveSafe: true,
    allowedSourceFamilies: [
      "enterprise",
      "organization",
      "workforce",
      "application",
      "data",
      "infrastructure",
      "vendor",
      "finance",
      "program",
      "ai",
      "risk",
      "process",
      "evidence",
      "industry",
      "expert",
    ],
    allowedTargetFamilies: [
      "enterprise",
      "organization",
      "workforce",
      "application",
      "data",
      "infrastructure",
      "vendor",
      "finance",
      "program",
      "ai",
      "risk",
      "process",
      "evidence",
      "industry",
      "expert",
    ],
    aliases,
    description: `${canonicalLabel} relationship normalized for Layer 3 graph validation.`,
  };
}

function ruleRequiresFactAuthority(rule: MappingRule): boolean {
  if (!rule.targetAttribute) return false;
  return (
    rule.targetDomain === "financial_value" ||
    ["parse_currency", "parse_number", "parse_percent"].includes(rule.transform)
  );
}

function ruleKey(rule: MappingRule): string {
  return `${rule.targetObjectType}.${rule.targetAttribute}`;
}

function normalizeRelationshipToken(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

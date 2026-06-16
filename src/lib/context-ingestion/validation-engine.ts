import { getTemplateById } from './template-registry';
import type {
  ContextValidationFinding,
  ExtractedContextFact,
  FileClassification,
} from './types';

const VALID_TIME_CLASSIFICATIONS = new Set(['invest', 'migrate', 'tolerate', 'retire']);

export const VALID_DOMAIN_SEGMENTS = new Set([
  'enterprise_profile',
  'it_financials',
  'program_inventory',
  'it_landscape',
  'org_structure',
  'data_estate',
  'infrastructure',
]);

// Keyword-to-segment mapping for auto-inference from vendor/system names.
const DOMAIN_SEGMENT_KEYWORDS: Array<{ keywords: string[]; segment: string }> = [
  {
    keywords: ['sap', 'oracle', 'erp', 'workday', 'peoplesoft', 'netsuite', 'dynamics', 'epicor', 'infor'],
    segment: 'it_landscape',
  },
  {
    keywords: ['epic', 'cerner', 'meditech', 'allscripts', 'ehr', 'emr', 'fhir', 'hl7', 'pacs', 'ris'],
    segment: 'it_landscape',
  },
  {
    keywords: ['aws', 'azure', 'gcp', 'vmware', 'server', 'network', 'storage', 'datacenter', 'infra', 'cloud'],
    segment: 'infrastructure',
  },
  {
    keywords: ['salesforce', 'crm', 'servicenow', 'itsm', 'jira', 'confluence', 'sharepoint', 'teams', 'slack'],
    segment: 'it_landscape',
  },
  {
    keywords: ['hr', 'payroll', 'talent', 'recruit', 'hris', 'workforce', 'headcount', 'org', 'people'],
    segment: 'org_structure',
  },
  {
    keywords: ['finance', 'accounting', 'billing', 'invoice', 'ap', 'ar', 'gl', 'ledger', 'treasury', 'budget'],
    segment: 'it_financials',
  },
  {
    keywords: ['data', 'analytics', 'warehouse', 'lake', 'etl', 'bi', 'tableau', 'powerbi', 'snowflake', 'databricks'],
    segment: 'data_estate',
  },
  {
    keywords: ['initiative', 'program', 'project', 'pmo', 'portfolio', 'roadmap', 'transformation', 'vendor'],
    segment: 'program_inventory',
  },
];

export interface DomainSegmentInferenceResult {
  segment: string | null;
  confidence: 'high' | 'low';
}

/**
 * Infers a domain segment from a vendor or system name using keyword matching.
 * Returns high confidence only when a unique keyword match is found.
 */
export function inferDomainSegment(nameHint: string): DomainSegmentInferenceResult {
  if (!nameHint || nameHint.trim() === '') {
    return { segment: null, confidence: 'low' };
  }
  const lower = nameHint.toLowerCase();
  const matches: string[] = [];
  for (const entry of DOMAIN_SEGMENT_KEYWORDS) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      if (!matches.includes(entry.segment)) {
        matches.push(entry.segment);
      }
    }
  }
  if (matches.length === 1) {
    return { segment: matches[0]!, confidence: 'high' };
  }
  return { segment: null, confidence: 'low' };
}

export function validateExtractedFacts(args: {
  classification: FileClassification;
  facts: ExtractedContextFact[];
}): ContextValidationFinding[] {
  const template = getTemplateById(args.classification.templateType);
  const findings: ContextValidationFinding[] = [];
  const factsByEntity = new Map<string, ExtractedContextFact[]>();
  for (const fact of args.facts) {
    const existing = factsByEntity.get(fact.entityKey) ?? [];
    existing.push(fact);
    factsByEntity.set(fact.entityKey, existing);
  }

  for (const [entityKey, facts] of factsByEntity) {
    const byField = new Map(facts.map((fact) => [fact.field, fact]));
    for (const required of template?.requiredFields ?? []) {
      const fact = byField.get(required);
      if (!fact || fact.valueText.trim() === '') {
        findings.push({
          severity: 'error',
          code: 'missing_required_field',
          message: `${entityKey} is missing required field ${required}.`,
          row: fact?.sourceLocator.row,
          field: required,
          expected: 'non-empty value',
          actual: fact?.valueText ?? '',
        });
      }
    }

    const costFact = byField.get('annual_value_usd') ?? byField.get('revenue_usd') ?? byField.get('committed_usd');
    if (costFact && costFact.valueText !== '' && Number.isNaN(Number(costFact.valueText))) {
      findings.push({
        severity: 'error',
        code: 'invalid_numeric_value',
        message: `${entityKey}.${costFact.field} must be numeric.`,
        row: costFact.sourceLocator.row,
        field: costFact.field,
        expected: 'number',
        actual: costFact.valueText,
      });
    }

    const timeClassification = byField.get('time_classification');
    if (
      timeClassification
      && timeClassification.valueText
      && !VALID_TIME_CLASSIFICATIONS.has(timeClassification.valueText)
    ) {
      findings.push({
        severity: 'error',
        code: 'invalid_enum_value',
        message: `${entityKey}.time_classification must be invest, migrate, tolerate, or retire.`,
        row: timeClassification.sourceLocator.row,
        field: 'time_classification',
        expected: 'invest | migrate | tolerate | retire',
        actual: timeClassification.valueText,
      });
    }

    const owner = byField.get('owner_role') ?? byField.get('sponsor_role');
    if (owner && owner.valueText.trim() === '') {
      findings.push({
        severity: 'warning',
        code: 'missing_owner',
        message: `${entityKey} has no named owner; approve only after steward assignment.`,
        row: owner.sourceLocator.row,
        field: owner.field,
      });
    }
  }

  return findings;
}

export function attachValidationFindings(
  facts: ExtractedContextFact[],
  findings: ContextValidationFinding[],
): ExtractedContextFact[] {
  return facts.map((fact) => ({
    ...fact,
    validationFindings: findings.filter(
      (finding) => finding.row === fact.sourceLocator.row && (!finding.field || finding.field === fact.field),
    ),
  }));
}

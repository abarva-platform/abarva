import type { UserProgramAccessPolicy } from '@/lib/auth/program-access-policy';

export interface RestrictedOutputPolicyLike {
  outputPolicy: {
    exactFinancialValues: boolean;
    restrictedSourceIds?: boolean;
  };
}

const MONEY_PATTERN = /\$\s?\d[\d,]*(?:\.\d+)?\s?(?:k|m|b|mm|bn|million|billion)?/gi;
const FINANCIAL_NUMERIC_PATTERN =
  /\b\d+(?:\.\d+)?\s?(?:%|bps|bp|x)(?=(?:[^.\n]{0,80})\b(?:budget|spend|spent|cost|costs|saving|savings|revenue|margin|roi|irr|npv|payback|business case|financial|mlr|denial rate|days in ar|loss ratio|premium|collections?)\b)/gi;
const FINANCIAL_KEYWORD_PATTERN =
  /\b(?:budget|spend|spent|cost take-?out|run[- ]rate|savings?|revenue|margin|roi|irr|npv|payback|business case|capex|opex|financial model|days in ar|denial rate|mlr|medical loss ratio)\b/i;
const RESTRICTED_SOURCE_ID_PATTERN =
  /\b(?:fin|financial|budget|spend|business-case|kpi|restricted)[_:.-][a-z0-9_:.-]+\b/gi;
const MONEY_TEST_PATTERN = /\$\s?\d[\d,]*(?:\.\d+)?\s?(?:k|m|b|mm|bn|million|billion)?/i;
const FINANCIAL_NUMERIC_TEST_PATTERN =
  /\b\d+(?:\.\d+)?\s?(?:%|bps|bp|x)(?=(?:[^.\n]{0,80})\b(?:budget|spend|spent|cost|costs|saving|savings|revenue|margin|roi|irr|npv|payback|business case|financial|mlr|denial rate|days in ar|loss ratio|premium|collections?)\b)/i;

export function sanitizeRestrictedFinancialText(text: string, policy: RestrictedOutputPolicyLike | null | undefined): string {
  if (!text || policy?.outputPolicy.exactFinancialValues) return text;

  return text
    .replace(MONEY_PATTERN, '[restricted financial value]')
    .replace(FINANCIAL_NUMERIC_PATTERN, '[restricted financial metric]')
    .replace(RESTRICTED_SOURCE_ID_PATTERN, '[restricted source]');
}

export function summarizeFinancialValueForPrompt(
  label: string,
  value: string | number | null | undefined,
  policy: RestrictedOutputPolicyLike | null | undefined,
): string {
  if (value === null || value === undefined || value === '') return '';
  if (policy?.outputPolicy.exactFinancialValues) return `${label}: ${value}`;
  return `${label}: restricted financial value available for risk/readiness reasoning only`;
}

export function shouldSuppressFinancialLine(
  line: string,
  policy: RestrictedOutputPolicyLike | null | undefined,
): boolean {
  if (policy?.outputPolicy.exactFinancialValues) return false;
  return FINANCIAL_KEYWORD_PATTERN.test(line) && (MONEY_TEST_PATTERN.test(line) || FINANCIAL_NUMERIC_TEST_PATTERN.test(line));
}

export function formatRestrictedOutputPolicyForPrompt(policy: UserProgramAccessPolicy | null | undefined): string {
  if (!policy || policy.outputPolicy.exactFinancialValues) return '';
  return [
    'RESTRICTED OUTPUT FIREWALL:',
    '- The user is not entitled to exact restricted financial values.',
    '- You may use financial-sensitive context only to form qualitative judgments such as small/material/high-exposure, ahead/behind, or CFO-grade evidence required.',
    '- Do not reveal budgets, spend, revenue, margins, ROI, NPV, IRR, payback, business-case dollars, sensitive KPI values, or restricted financial source IDs.',
    '- If asked directly for financial values, refuse the exact value and offer a non-numeric risk/readiness summary instead.',
    '- Apply the same restriction to generated charters, business cases, meeting notes, gate summaries, exports, and deliverables.',
  ].join('\n');
}

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { canonicalTenantKey, canonicalTenantDisplayName } from '@/lib/tenant/aliases';
import type { AskSource } from '@/lib/intelligence/ask/types';
import type { AiControlTowerContextFact } from '@/lib/ai-control-tower/contracts';

type JsonObject = Record<string, unknown>;

export interface DerivedEnterpriseInsight {
  id: string;
  headline: string;
  soWhat: string;
  domain: string;
  severity: 'high' | 'medium' | 'low' | string;
  evidence: string[];
}

export interface DerivedEnterpriseMove {
  title: string;
  owner: string;
  decision: string;
  expectedImpact: string;
}

export interface DerivedEnterprisePattern {
  patternId: string;
  patternName: string;
  domain: string;
  whyMatched: string;
}

export interface DerivedEnterpriseReadSummary {
  readId: string;
  tenantKey: string;
  tenantName: string;
  industry: string;
  headline: string;
  executiveSummary: string;
  architecturePattern: string;
  maturityRead: string;
  whatThisMeans: string;
  confirmedTechnologyStack: string[];
  dataQualityCaution: string | null;
  northStar: string;
  peerImplication: string;
  insights: DerivedEnterpriseInsight[];
  matchedPatterns: DerivedEnterprisePattern[];
  recommendedMoves: DerivedEnterpriseMove[];
  source: {
    kind: 'local_v4_derived_artifact';
    path: string;
  };
}

const DATASET_ROOTS: Record<string, string> = {
  'skyharbor-air': 'datasets/skyharbor-air-synthetic-v4',
  'first-capital': 'datasets/first-capital-financial-synthetic-v4',
  'meridian-health': 'datasets/meridian-health-synthetic-v4',
  lakeshore: 'datasets/lakeshore-industries-synthetic-v4',
  'apex-retail': 'datasets/apex-retail-synthetic-v4',
};

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => stringValue(item)).filter(Boolean);
}

function objectArray(value: unknown): JsonObject[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonObject => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : [];
}

function normalizeTenant(value: string | null | undefined): string | null {
  if (!value) return null;
  return canonicalTenantKey(value).trim().toLowerCase();
}

function summarizeRead(raw: JsonObject, fallbackTenantKey: string): DerivedEnterpriseReadSummary {
  const currentState = raw.currentStateRead && typeof raw.currentStateRead === 'object'
    ? raw.currentStateRead as JsonObject
    : {};
  const benchmarkRead = raw.benchmarkRead && typeof raw.benchmarkRead === 'object'
    ? raw.benchmarkRead as JsonObject
    : {};
  const readId = stringValue(raw.readId, `enterprise-read-${fallbackTenantKey}`);
  const tenantKey = stringValue(raw.tenantKey, fallbackTenantKey);
  const tenantName = canonicalTenantDisplayName(tenantKey, stringValue(raw.tenantName, tenantKey));
  const insights = objectArray(raw.derivedInsights).map((insight, index) => ({
    id: `${readId}-insight-${index + 1}`,
    headline: stringValue(insight.headline, `Derived insight ${index + 1}`),
    soWhat: stringValue(insight.soWhat),
    domain: stringValue(insight.domain, stringValue(insight.dimension, 'Enterprise context')),
    severity: stringValue(insight.severity, 'medium'),
    evidence: stringArray(insight.evidence),
  }));

  return {
    readId,
    tenantKey,
    tenantName,
    industry: stringValue(raw.industry, 'enterprise'),
    headline: stringValue(raw.headline, 'Enterprise context read'),
    executiveSummary: stringValue(raw.executiveSummary),
    architecturePattern: stringValue(currentState.architecturePattern),
    maturityRead: stringValue(currentState.maturityRead),
    whatThisMeans: stringValue(currentState.whatThisMeans),
    confirmedTechnologyStack: stringArray(currentState.confirmedTechnologyStack),
    dataQualityCaution: stringValue(currentState.dataQualityCaution) || null,
    northStar: stringValue(benchmarkRead.northStar),
    peerImplication: stringValue(benchmarkRead.peerImplication),
    insights,
    matchedPatterns: objectArray(raw.matchedPatterns).map((pattern) => ({
      patternId: stringValue(pattern.patternId),
      patternName: stringValue(pattern.patternName, 'Corpus pattern'),
      domain: stringValue(pattern.domain, 'Corpus'),
      whyMatched: stringValue(pattern.whyMatched),
    })),
    recommendedMoves: objectArray(raw.recommendedMoves).map((move) => ({
      title: stringValue(move.title, 'Recommended move'),
      owner: stringValue(move.owner, 'Executive owner'),
      decision: stringValue(move.decision, 'Approve next evidence-gated decision.'),
      expectedImpact: stringValue(move.expectedImpact, 'not quantified'),
    })),
    source: {
      kind: 'local_v4_derived_artifact',
      path: `${DATASET_ROOTS[fallbackTenantKey]}/derived-intelligence/enterprise-reads.json`,
    },
  };
}

export async function getDerivedEnterpriseReadForTenant(
  tenantKey: string | null | undefined,
): Promise<DerivedEnterpriseReadSummary | null> {
  const normalized = normalizeTenant(tenantKey);
  if (!normalized) return null;
  const root = DATASET_ROOTS[normalized];
  if (!root) return null;

  try {
    const relativePath = `${root}/derived-intelligence/enterprise-reads.json`;
    const payload = JSON.parse(await readFile(path.join(process.cwd(), relativePath), 'utf8')) as JsonObject;
    const read = objectArray(payload.reads)[0];
    return read ? summarizeRead(read, normalized) : null;
  } catch {
    return null;
  }
}

export function derivedEnterpriseReadToAskSources(read: DerivedEnterpriseReadSummary | null): AskSource[] {
  if (!read) return [];
  const sources: AskSource[] = [
    {
      type: 'TENANT',
      id: read.readId,
      name: `${read.tenantName} derived enterprise read`,
      confidence: 0.9,
      detail: [
        `Derived Enterprise Read for ${read.tenantName}.`,
        `Headline: ${read.headline}`,
        `Executive summary: ${read.executiveSummary}`,
        `Architecture pattern: ${read.architecturePattern}`,
        `Maturity read: ${read.maturityRead}`,
        `North star: ${read.northStar}`,
        `Peer implication: ${read.peerImplication}`,
        read.dataQualityCaution ? `Data quality caution: ${read.dataQualityCaution}` : '',
        `Source artifact: ${read.source.path}`,
      ].filter(Boolean).join('\n'),
    },
    ...read.insights.slice(0, 6).map((insight): AskSource => ({
      type: 'INSIGHT',
      id: insight.id,
      name: insight.headline,
      confidence: insight.severity === 'high' ? 0.88 : 0.78,
      detail: [
        `Derived insight (${insight.severity}) for ${read.tenantName}: ${insight.headline}`,
        `So what: ${insight.soWhat}`,
        `Domain: ${insight.domain}`,
        insight.evidence.length ? `Evidence: ${insight.evidence.join('; ')}` : '',
      ].filter(Boolean).join('\n'),
    })),
    ...read.matchedPatterns.slice(0, 4).map((pattern): AskSource => ({
      type: 'PATTERN',
      id: pattern.patternId,
      name: pattern.patternName,
      confidence: 0.76,
      detail: `Derived read matched corpus pattern for ${read.tenantName}. Domain: ${pattern.domain}. Why matched: ${pattern.whyMatched}`,
    })),
  ];
  return sources;
}

export function derivedEnterpriseReadToTowerFacts(input: {
  read: DerivedEnterpriseReadSummary | null;
  clientId: string | null;
  refreshRunId: string | null;
}): AiControlTowerContextFact[] {
  const { read } = input;
  if (!read) return [];
  const clientId = input.clientId ?? read.tenantKey;
  const refreshRunId = input.refreshRunId ?? `${read.tenantKey}-derived-enterprise-read`;
  return [
    {
      factId: `${read.readId}-summary`,
      clientId,
      refreshRunId,
      recordType: 'derived_enterprise_read',
      recordKey: read.readId,
      factKey: 'enterprise_context_read',
      factType: 'derived_read',
      factText: `${read.headline} ${read.executiveSummary}`,
      confidence: 0.9,
      evidenceStatus: 'committed',
      evidenceIds: [read.source.path],
    },
    ...read.insights.slice(0, 6).map((insight, index): AiControlTowerContextFact => ({
      factId: `${read.readId}-insight-${index + 1}`,
      clientId,
      refreshRunId,
      recordType: 'derived_enterprise_insight',
      recordKey: insight.id,
      factKey: `derived_enterprise_insight_${index + 1}`,
      factType: 'insight',
      factText: `${insight.headline}. ${insight.soWhat}`,
      confidence: insight.severity === 'high' ? 0.88 : 0.78,
      evidenceStatus: 'committed',
      evidenceIds: insight.evidence.length ? insight.evidence : [read.source.path],
    })),
  ];
}

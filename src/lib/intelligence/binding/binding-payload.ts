// Intelligence v2 binding payload read-model.
//
// Source of truth today: the committed build-time data asset `all-tenants.json`,
// produced by `scripts/context-packs/build-intelligence-binding-payload.py` from
// the v4 datasets (signals/context/corpus/questions/trust, evidence scaled to the
// real V4 ACA load depth). This is the contract the Intelligence v2 surface renders.
//
// Seam: when the binding contract is computed live from the data plane, swap the
// implementation of `getIntelligenceBindingPayload` to read from the DB — the
// return shape and call sites stay identical.

import bindingData from "./all-tenants.json";

export interface BindingMove {
  title: string;
  owner: string | null;
  impact: string | null;
}

export interface BindingSignal {
  id: string;
  domains: string[];
  crossDomain: boolean;
  headline: string;
  body: string;
  confidence: string;
  evidencePoints: number;
  sources: number;
  evidenceRefs: string[];
  move: BindingMove | null;
}

export interface BindingDimension {
  dimension: string;
  status: string;
  description: string;
  evidence: number;
  sources: number;
  trust: number;
  flag?: string;
}

export interface BindingCorpusPattern {
  patternName: string;
  domain: string;
  whenToApply: string;
}

export interface IntelligenceBindingPayload {
  tenant: { key: string; displayName: string; industry: string };
  ask: { placeholder: string; contract: string };
  trustLine: {
    dimensionsLoaded: number;
    evidencePoints: number;
    sources: number;
    searchVerifiedPct: number;
  };
  suggestedQuestions: string[];
  signals: BindingSignal[];
  context: BindingDimension[];
  corpus: BindingCorpusPattern[];
}

interface BindingFile {
  tenants: Record<string, IntelligenceBindingPayload>;
  tenantOrder?: string[];
}

const FILE = bindingData as unknown as BindingFile;

// App ClientKey / context key aliases → binding payload key.
const KEY_ALIASES: Record<string, string> = {
  firstcapital: "first-capital",
  arcturus: "first-capital",
  "first-capital": "first-capital",
  skyharbor: "skyharbor-air",
  "skyharbor-air": "skyharbor-air",
  meridian: "meridian-health",
  "meridian-health": "meridian-health",
  apexretail: "apex-retail",
  "apex-retail": "apex-retail",
  lakeshore: "lakeshore",
  "lakeshore-holdings": "lakeshore",
  "lakeshore-industries": "lakeshore",
  northstar: "northstar-clinical",
  "northstar-clinical": "northstar-clinical",
  "northstar-clinical-technologies": "northstar-clinical",
  "northstar-health": "northstar-clinical",
};

/** Resolve a tenant key (app ClientKey or context key) to its binding payload, or null. */
export function getIntelligenceBindingPayload(
  tenantKey: string | null | undefined,
): IntelligenceBindingPayload | null {
  if (!tenantKey) return null;
  const raw = tenantKey.trim().toLowerCase();
  const resolved = FILE.tenants[raw] ? raw : KEY_ALIASES[raw];
  if (!resolved) return null;
  return FILE.tenants[resolved] ?? null;
}

export function hasIntelligenceBindingPayload(
  tenantKey: string | null | undefined,
): boolean {
  return getIntelligenceBindingPayload(tenantKey) !== null;
}

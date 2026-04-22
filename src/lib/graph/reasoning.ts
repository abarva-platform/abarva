import { isInt } from 'neo4j-driver';
import { getGraphDriver } from './driver';

function unwrap(val: unknown): unknown {
  if (val == null) return val;
  if (isInt(val)) return (val as unknown as { toNumber: () => number }).toNumber();
  if (Array.isArray(val)) return val.map(unwrap);
  if (typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) out[k] = unwrap(v);
    return out;
  }
  return val;
}

function props(node: unknown): Record<string, unknown> {
  const n = node as { properties?: Record<string, unknown> } | null | undefined;
  return (unwrap(n?.properties ?? {}) as Record<string, unknown>) ?? {};
}

// ─── 1 · Use-case reasoning chain ───────────────────────────────────────────
export interface UseCaseReasoningResult {
  useCase: Record<string, unknown>;
  vendorStack: Array<{ vendor: Record<string, unknown>; product: Record<string, unknown>; posture: Record<string, unknown> }>;
  regulations: Array<{ regulation: Record<string, unknown>; section: Record<string, unknown> }>;
  patterns: Array<{ pattern: Record<string, unknown>; violates: Record<string, unknown> }>;
  benchmarks: Array<Record<string, unknown>>;
  peerEngagementsSamePattern: number;
}

export async function getUseCaseReasoning(useCaseId: string): Promise<UseCaseReasoningResult | null> {
  const cypher = `
    MATCH (uc:UseCase {id: $useCaseId})
    OPTIONAL MATCH (uc)-[:USES_PRODUCT]->(p:Product)<-[:OFFERS]-(v:Vendor)
    OPTIONAL MATCH (v)-[:HAS_POSTURE]->(posture:VendorPosture)
    OPTIONAL MATCH (uc)-[:SUBJECT_TO]->(r:Regulation)
    OPTIONAL MATCH (r)-[:HAS_SECTION]->(rs:RegulationSection)
    OPTIONAL MATCH (uc)-[:TRIGGERS]->(gp:GenomePattern)
    OPTIONAL MATCH (gp)-[:VIOLATES]->(fc:FrameworkControl)
    OPTIONAL MATCH (uc)-[:BENCHMARKED_AGAINST]->(b:Benchmark)
    OPTIONAL MATCH (uc)<-[:ADDRESSES]-(eng:Engagement)
    OPTIONAL MATCH (gp)<-[:SURFACED]-(peer:Engagement)
      WHERE peer.id <> eng.id
        AND peer.industry_code = uc.industry_code
    RETURN
      uc,
      collect(DISTINCT {vendor: v, product: p, posture: posture}) AS vendor_stack,
      collect(DISTINCT {regulation: r, section: rs}) AS regulations,
      collect(DISTINCT {pattern: gp, violates: fc}) AS patterns,
      collect(DISTINCT b) AS benchmarks,
      count(DISTINCT peer) AS peer_engagements_same_pattern
  `;
  const session = getGraphDriver().session();
  try {
    const res = await session.run(cypher, { useCaseId });
    if (res.records.length === 0) return null;
    const rec = res.records[0];
    const stackRaw = rec.get('vendor_stack') as Array<{ vendor: unknown; product: unknown; posture: unknown }>;
    const regsRaw = rec.get('regulations') as Array<{ regulation: unknown; section: unknown }>;
    const patsRaw = rec.get('patterns') as Array<{ pattern: unknown; violates: unknown }>;
    const benchRaw = rec.get('benchmarks') as unknown[];
    return {
      useCase: props(rec.get('uc')),
      vendorStack: stackRaw
        .filter((x) => x.vendor != null)
        .map((x) => ({ vendor: props(x.vendor), product: props(x.product), posture: props(x.posture) })),
      regulations: regsRaw
        .filter((x) => x.regulation != null)
        .map((x) => ({ regulation: props(x.regulation), section: props(x.section) })),
      patterns: patsRaw
        .filter((x) => x.pattern != null)
        .map((x) => ({ pattern: props(x.pattern), violates: props(x.violates) })),
      benchmarks: benchRaw.filter((b) => b != null).map((b) => props(b)),
      peerEngagementsSamePattern: Number(unwrap(rec.get('peer_engagements_same_pattern')) ?? 0),
    };
  } finally {
    await session.close();
  }
}

// ─── 2 · Vendor risk profile ────────────────────────────────────────────────
export interface VendorRiskProfile {
  vendor: Record<string, unknown>;
  posture: Record<string, unknown>;
  compliesWith: string[];
  applicableRegulations: string[];
}

export async function getVendorRiskProfile(
  vendorName: string,
  clientIndustry: string,
  dataClasses: string[],
): Promise<VendorRiskProfile | null> {
  const cypher = `
    MATCH (v:Vendor {name: $vendorName})
    OPTIONAL MATCH (v)-[:HAS_POSTURE]->(posture:VendorPosture)
    OPTIONAL MATCH (v)-[:COMPLIES_WITH]->(f:Framework)
    OPTIONAL MATCH (i:Industry {code: $clientIndustry})<-[:APPLIES_TO]-(r:Regulation)
      WHERE ANY(topic IN $dataClasses WHERE EXISTS {
        MATCH (r)-[:GOVERNS]->(t:Topic) WHERE t.key = topic
      })
    RETURN v, posture,
      collect(DISTINCT f.code) AS complies,
      collect(DISTINCT r.code) AS regulations
  `;
  const session = getGraphDriver().session();
  try {
    const res = await session.run(cypher, { vendorName, clientIndustry, dataClasses });
    if (res.records.length === 0) return null;
    const rec = res.records[0];
    return {
      vendor: props(rec.get('v')),
      posture: props(rec.get('posture')),
      compliesWith: ((unwrap(rec.get('complies')) as unknown[]) ?? []).filter((x) => typeof x === 'string') as string[],
      applicableRegulations: ((unwrap(rec.get('regulations')) as unknown[]) ?? []).filter(
        (x) => typeof x === 'string',
      ) as string[],
    };
  } finally {
    await session.close();
  }
}

// ─── 3 · Peer benchmark ─────────────────────────────────────────────────────
export interface PeerBenchmarkResult {
  benchmark: Record<string, unknown>;
  clientValue: number;
  percentile: number | null;
}

function computePercentile(clientValue: number, b: Record<string, unknown>): number | null {
  const median = typeof b.national_median === 'number' ? b.national_median : null;
  const p25 = typeof b.p25 === 'number' ? b.p25 : null;
  const p75 = typeof b.p75 === 'number' ? b.p75 : null;
  if (median == null) return null;
  if (p25 != null && clientValue <= p25) return 25;
  if (p75 != null && clientValue >= p75) return 75;
  if (clientValue < median) return 40;
  if (clientValue > median) return 60;
  return 50;
}

export async function getPeerBenchmark(
  metricName: string,
  industry: string,
  clientValue: number,
): Promise<PeerBenchmarkResult | null> {
  const cypher = `
    MATCH (b:Benchmark)-[:MEASURES_IN]->(:Industry {code: $industry})
    WHERE b.metric_name CONTAINS $metricName
    RETURN b
    ORDER BY b.as_of_date DESC
    LIMIT 1
  `;
  const session = getGraphDriver().session();
  try {
    const res = await session.run(cypher, { metricName, industry });
    if (res.records.length === 0) return null;
    const benchmark = props(res.records[0].get('b'));
    return { benchmark, clientValue, percentile: computePercentile(clientValue, benchmark) };
  } finally {
    await session.close();
  }
}

// ─── 4 · Pattern history ────────────────────────────────────────────────────
export interface PatternHistoryResult {
  failureRate: number | null;
  totalEngagements: number;
  succeeded: number;
  failed: number;
  recent: Array<{ engagement: string; client: string | null; outcome: string | null }>;
}

export async function getPatternHistory(
  patternCode: string,
  industry?: string,
): Promise<PatternHistoryResult | null> {
  const clause = industry ? 'WHERE eng.industry_code = $industry' : '';
  const cypher = `
    MATCH (gp:GenomePattern {code: $patternCode})<-[:SURFACED]-(eng:Engagement)
    ${clause}
    OPTIONAL MATCH (eng)-[:FOR]->(c:Client)
    RETURN
      gp.failure_rate_pct AS failure_rate,
      count(DISTINCT eng) AS total,
      count(DISTINCT CASE WHEN eng.outcome = 'succeeded' THEN eng END) AS succeeded,
      count(DISTINCT CASE WHEN eng.outcome = 'failed' THEN eng END) AS failed,
      collect(DISTINCT {engagement: eng.id, client: c.name, outcome: eng.outcome})[0..5] AS recent
  `;
  const session = getGraphDriver().session();
  try {
    const res = await session.run(cypher, { patternCode, industry: industry ?? null });
    if (res.records.length === 0) return null;
    const rec = res.records[0];
    const fr = unwrap(rec.get('failure_rate'));
    return {
      failureRate: typeof fr === 'number' ? fr : null,
      totalEngagements: Number(unwrap(rec.get('total')) ?? 0),
      succeeded: Number(unwrap(rec.get('succeeded')) ?? 0),
      failed: Number(unwrap(rec.get('failed')) ?? 0),
      recent: (unwrap(rec.get('recent')) as Array<{ engagement: string; client: string | null; outcome: string | null }>) ?? [],
    };
  } finally {
    await session.close();
  }
}

// ─── 5 · Applicable regulations ────────────────────────────────────────────
export interface ApplicableRegulation {
  code: string;
  name: string;
  jurisdiction: string | null;
  relevantSections: Array<{ code: string; title: string }>;
}

export async function getApplicableRegulations(
  industryCode: string,
  topicKeys?: string[],
): Promise<ApplicableRegulation[]> {
  const topicFilter = topicKeys && topicKeys.length > 0
    ? `WHERE EXISTS {
        MATCH (r)-[:HAS_SECTION]->(:RegulationSection)-[:GOVERNS]->(t:Topic)
        WHERE t.key IN $topicKeys
      }`
    : '';
  const cypher = `
    MATCH (i:Industry {code: $industryCode})<-[:APPLIES_TO]-(r:Regulation)
    ${topicFilter}
    OPTIONAL MATCH (r)-[:HAS_SECTION]->(rs:RegulationSection)
    RETURN
      r.code AS code,
      r.name AS name,
      r.jurisdiction AS jurisdiction,
      collect(DISTINCT {code: rs.code, title: rs.title}) AS sections
  `;
  const session = getGraphDriver().session();
  try {
    const res = await session.run(cypher, { industryCode, topicKeys: topicKeys ?? [] });
    return res.records.map((rec) => {
      const sectionsRaw = (unwrap(rec.get('sections')) as Array<{ code: string | null; title: string | null }>) ?? [];
      return {
        code: String(unwrap(rec.get('code')) ?? ''),
        name: String(unwrap(rec.get('name')) ?? ''),
        jurisdiction: (unwrap(rec.get('jurisdiction')) as string | null) ?? null,
        relevantSections: sectionsRaw
          .filter((s) => s.code)
          .map((s) => ({ code: s.code ?? '', title: s.title ?? '' })),
      };
    });
  } finally {
    await session.close();
  }
}

// ─── 6 · Cross-client learning ─────────────────────────────────────────────
export interface CrossClientLearning {
  engagementId: string;
  outcome: string | null;
  lesson: string | null;
  coTriggeredPatterns: string[];
  useCases: string[];
}

export async function getCrossClientLearning(
  currentEngagementId: string,
  patternCode: string,
): Promise<CrossClientLearning[]> {
  const cypher = `
    MATCH (currentEng:Engagement {id: $currentEngagementId})-[:FOR]->(currentClient:Client)
    MATCH (currentClient)-[:IN_INDUSTRY]->(i:Industry)
    MATCH (gp:GenomePattern {code: $patternCode})<-[:SURFACED]-(peerEng:Engagement)
      WHERE peerEng.id <> currentEng.id
    MATCH (peerEng)-[:FOR]->(peerClient:Client)-[:IN_INDUSTRY]->(i)
    OPTIONAL MATCH (peerEng)-[:ADDRESSES]->(peerUc:UseCase)
    OPTIONAL MATCH (peerEng)-[:SURFACED]->(otherGp:GenomePattern)
      WHERE otherGp <> gp
    RETURN
      peerEng.id AS engagement_id,
      peerEng.outcome AS outcome,
      peerEng.lesson_learned AS lesson,
      collect(DISTINCT otherGp.code) AS co_triggered,
      collect(DISTINCT peerUc.name) AS use_cases
    ORDER BY peerEng.completed_at DESC
    LIMIT 5
  `;
  const session = getGraphDriver().session();
  try {
    const res = await session.run(cypher, { currentEngagementId, patternCode });
    return res.records.map((rec) => ({
      engagementId: String(unwrap(rec.get('engagement_id')) ?? ''),
      outcome: (unwrap(rec.get('outcome')) as string | null) ?? null,
      lesson: (unwrap(rec.get('lesson')) as string | null) ?? null,
      coTriggeredPatterns: ((unwrap(rec.get('co_triggered')) as unknown[]) ?? []).filter(
        (s): s is string => typeof s === 'string' && s.length > 0,
      ),
      useCases: ((unwrap(rec.get('use_cases')) as unknown[]) ?? []).filter(
        (s): s is string => typeof s === 'string' && s.length > 0,
      ),
    }));
  } finally {
    await session.close();
  }
}

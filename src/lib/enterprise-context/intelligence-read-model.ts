
import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import { canonicalTenantKey } from '@/lib/tenant/aliases';
import {
  getDerivedEnterpriseReadForTenant,
  type DerivedEnterpriseReadSummary,
} from '@/lib/enterprise-context/derived-enterprise-read';
export interface EnterpriseContextRecordRow {
  record_type: string;
  title: string;
  source_system: string;
  owner: string | null;
  freshness_status: "fresh" | "attention" | "stale" | "unknown";
  confidence: number | null;
  payload: Record<string, unknown>;
}

export interface EnterpriseContextQualityRow {
  issue_type: string;
  severity: string;
  status: string;
  source_file: string | null;
  owner: string | null;
}

export interface EnterpriseContextSourceRow {
  source_system: string;
  display_name: string;
  system_of_record: boolean;
  source_owner: string | null;
  last_synced_at: string | null;
}

export interface EnterpriseContextChunkRow {
  source_doc: string | null;
  source_record_id: string | null;
  chunk_id: string | null;
  chunk_text: string | null;
  embedding_status: string | null;
  embedding_model: string | null;
  embedded_at: string | null;
  provenance: Record<string, unknown> | null;
  chunk_metadata: Record<string, unknown> | null;
}

export interface EnterpriseContextOverviewCard {
  key: string;
  title: string;
  whatWeKnow: string;
  whyItMatters: string;
  owner: string;
  freshness: string;
  confidence: string;
  evidenceCount: number;
  sourceSystems: string[];
  actions: string[];
}

export interface EnterpriseContextInsightRow {
  id: string;
  headline: string;
  so_what: string;
  domain: string;
  materiality: 'high' | 'medium' | 'low' | string;
  rule_id: string;
  evidence: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none' | string;
  freshness_status: 'fresh' | 'attention' | 'stale' | 'review' | 'unknown' | string;
  lifecycle_state: 'active' | 'review_required' | 'blocked_by_gap' | 'superseded' | string;
  action: string | null;
  entity_name: string | null;
  entity_type: string | null;
  derived_from_fact_ids?: string[] | null;
}

export type EnterpriseContextVendorCategory = 'hardware-cloud' | 'software-saas' | 'services-si';
export type EnterpriseContextVendorHealth = 'healthy' | 'watch' | 'risk';
export type EnterpriseContextVendorTier = 'incumbent' | 'challenger' | 'emerging';

export interface EnterpriseContextVendorSpendRow {
  vendor: string;
  category: EnterpriseContextVendorCategory;
  subcategory: string;
  spendUsdM: number;
  spendLabel: string;
  tier: EnterpriseContextVendorTier;
  health: EnterpriseContextVendorHealth;
  renewsInMonths: number | null;
  takeaway: string;
}

export interface EnterpriseContextOverview {
  tenantKey: string;
  tenantName: string;
  counts: {
    sources: number;
    records: number;
    facts: number;
    relationships: number;
    evidence: number;
    qualityIssues: number;
    stewardshipTasks: number;
    chunkQueue: number;
  };
  recordTypeCounts: Record<string, number>;
  freshnessCounts: Record<string, number>;
  sourceSystems: string[];
  evidenceUsableCount: number;
  confidenceAverage: number;
  qualitySummary: Record<string, number>;
  cards: EnterpriseContextOverviewCard[];
  contextInsights: EnterpriseContextInsightRow[];
  sentinelFacts: string[];
  vendorSpendRows: EnterpriseContextVendorSpendRow[];
  derivedEnterpriseRead?: DerivedEnterpriseReadSummary | null;
}

const TABLES = {
  sources: "enterprise_context_sources",
  records: "enterprise_context_records",
  facts: "enterprise_context_facts",
  relationships: "enterprise_context_relationships",
  evidence: "enterprise_context_evidence",
  qualityIssues: "enterprise_context_quality_issues",
  stewardshipTasks: "enterprise_context_stewardship_tasks",
  chunkQueue: "enterprise_context_chunk_queue",
} as const;

export async function getEnterpriseContextOverviewForTenant(
  tenantKey: string | null | undefined,
  tenantName: string | null | undefined,
): Promise<EnterpriseContextOverview | null> {
  const normalizedTenantKey = canonicalTenantKey(tenantKey?.trim());
  if (!normalizedTenantKey) return null;
  const derivedEnterpriseRead = await getDerivedEnterpriseReadForTenant(normalizedTenantKey);

  try {
    const counts = await countEnterpriseContextRows(normalizedTenantKey);

    if (counts.records === 0) {
      const chunkOverview = await getChunkBackedEnterpriseContextOverview({
        tenantKey: normalizedTenantKey,
        tenantName: tenantName ?? normalizedTenantKey,
      });
      if (chunkOverview) return chunkOverview;
      return null;
    }

    const records = await fetchTenantRows<EnterpriseContextRecordRow>(
      TABLES.records,
      normalizedTenantKey,
      "record_type,title,source_system,owner,freshness_status,confidence,payload",
    );
    const sources = await fetchTenantRows<EnterpriseContextSourceRow>(
      TABLES.sources,
      normalizedTenantKey,
      "source_system,display_name,system_of_record,source_owner,last_synced_at",
    );
    const qualityRows = await fetchTenantRows<EnterpriseContextQualityRow>(
      TABLES.qualityIssues,
      normalizedTenantKey,
      "issue_type,severity,status,source_file,owner",
    );
    const evidenceRows = await fetchTenantRows<{ evidence_usable: boolean }>(
      TABLES.evidence,
      normalizedTenantKey,
      "evidence_usable",
    );
    const insightRows = await fetchTenantRows<EnterpriseContextInsightRow>(
      'context_insights',
      normalizedTenantKey,
      'id,headline,so_what,domain,materiality,rule_id,evidence,confidence,freshness_status,lifecycle_state,action,entity_name,entity_type,derived_from_fact_ids',
    ).catch(() => []);

    if (counts.records === 0 && !derivedEnterpriseRead) return null;
    if (counts.records === 0 && derivedEnterpriseRead) {
      return summarizeEnterpriseContextRows({
        tenantKey: normalizedTenantKey,
        tenantName: tenantName ?? normalizedTenantKey,
        counts,
        records: [],
        sources: [],
        qualityRows: [],
        evidenceRows: [],
        insightRows: [],
        derivedEnterpriseRead,
      });
    }

    return summarizeEnterpriseContextRows({
      tenantKey: normalizedTenantKey,
      tenantName: tenantName ?? normalizedTenantKey,
      counts,
      records,
      sources,
      qualityRows,
      evidenceRows,
      insightRows,
      derivedEnterpriseRead,
    });
  } catch (error) {
    console.warn('[enterprise-context.overview]', error);
    if (derivedEnterpriseRead) {
      return summarizeEnterpriseContextRows({
        tenantKey: normalizedTenantKey,
        tenantName: tenantName ?? normalizedTenantKey,
        counts: emptyEnterpriseContextCounts(),
        records: [],
        sources: [],
        qualityRows: [],
        evidenceRows: [],
        insightRows: [],
        derivedEnterpriseRead,
      });
    }
    return null;
  }
}

export function summarizeEnterpriseContextRows(input: {
  tenantKey: string;
  tenantName: string;
  counts: EnterpriseContextOverview["counts"];
  records: EnterpriseContextRecordRow[];
  sources: EnterpriseContextSourceRow[];
  qualityRows: EnterpriseContextQualityRow[];
  evidenceRows: Array<{ evidence_usable: boolean }>;
  insightRows?: EnterpriseContextInsightRow[];
  derivedEnterpriseRead?: DerivedEnterpriseReadSummary | null;
}): EnterpriseContextOverview {
  const recordTypeCounts = countBy(input.records, (row) => row.record_type);
  const freshnessCounts = countBy(input.records, (row) => row.freshness_status);
  const qualitySummary = countBy(
    input.qualityRows,
    (row) => `${row.severity}:${row.status}:${row.issue_type}`,
  );
  const sourceSystems = [
    ...new Set(input.sources.map((row) => row.source_system)),
  ].sort();
  const evidenceUsableCount = input.evidenceRows.filter(
    (row) => row.evidence_usable,
  ).length;
  const confidenceAverage = average(
    input.records
      .map((row) => row.confidence ?? 0)
      .filter((value) => value > 0),
  );

  const recordsByType = new Map<string, EnterpriseContextRecordRow[]>();
  for (const row of input.records) {
    const bucket = recordsByType.get(row.record_type) ?? [];
    bucket.push(row);
    recordsByType.set(row.record_type, bucket);
  }

  const applications = recordsByType.get('cmdb_applications_services') ?? [];
  const orgRows = recordsByType.get('org_decision_rights') ?? [];
  const businessUnitRows = recordsByType.get('facilities_business_units') ?? [];
  const incidents = recordsByType.get('incidents') ?? [];
  const problems = recordsByType.get('problems') ?? [];
  const changes = recordsByType.get('changes') ?? [];
  const renewals = recordsByType.get('renewal_calendar') ?? [];
  const contracts = recordsByType.get('vendors_contract_inventory') ?? [];
  const spendRows = recordsByType.get('spend_baseline') ?? [];
  const kpis = recordsByType.get('kpi_metric') ?? recordsByType.get('financial_kpis') ?? [];
  const policies = recordsByType.get('policies_procedures') ?? [];
  const initiatives = recordsByType.get('initiative_portfolio') ?? [];
  const dataDomains = recordsByType.get('data_domains_stewardship') ?? [];
  const risks = recordsByType.get('risk_compliance_register') ?? [];
  const slaBreaches = incidents.filter((row) => row.payload.breach_sla === 'true' || row.payload.breach_sla === true).length;
  const tierOneApps = applications.filter((row) => String(row.payload.criticality ?? '').toLowerCase().includes('tier 1')).length;
  const highRenewals = renewals.filter((row) => String(row.payload.renewal_risk ?? '').toLowerCase() === 'high').length;
  const annualSpend = spendRows.reduce((sum, row) => sum + numeric(row.payload.run_rate_usd), 0);
  const renewalExposure = renewals.reduce((sum, row) => sum + numeric(row.payload.estimated_value_usd), 0);
  const vendorSpendRows = buildVendorSpendRows({ contracts, renewals, spendRows });
  const derivedContextInsights: EnterpriseContextInsightRow[] = (input.derivedEnterpriseRead?.insights ?? []).map((insight, index) => ({
    id: insight.id,
    headline: insight.headline,
    so_what: insight.soWhat,
    domain: insight.domain || input.derivedEnterpriseRead?.industry || 'Enterprise context',
    materiality: insight.severity,
    rule_id: `derived-enterprise-read:${input.derivedEnterpriseRead?.readId ?? 'unknown'}:${index + 1}`,
    evidence: insight.evidence.join('; ') || input.derivedEnterpriseRead?.source.path || null,
    confidence: insight.severity === 'high' ? 'high' : 'medium',
    freshness_status: 'fresh',
    lifecycle_state: 'active',
    action: input.derivedEnterpriseRead?.recommendedMoves[index]?.decision ?? 'Review evidence and decide next move',
    entity_name: input.derivedEnterpriseRead?.tenantName ?? input.tenantName,
    entity_type: 'derived_enterprise_read',
    derived_from_fact_ids: insight.evidence,
  }));
  const contextInsights = [...derivedContextInsights, ...(input.insightRows ?? [])].sort((a, b) => {
    const materialityOrder = (value: string) => value === 'high' ? 0 : value === 'medium' ? 1 : 2;
    return materialityOrder(a.materiality) - materialityOrder(b.materiality);
  });

  const cards: EnterpriseContextOverviewCard[] = [
    {
      // L1 fix (2026-05-13): the previous key/title used "clinical" — a
      // healthcare-specific term that surfaced on Apex Retail and First
      // Capital Enterprise Context cards. The body is industry-neutral
      // CMDB/ITSM narrative; rename the card itself to match.
      key: "platform-and-service-reliability",
      title: "Platform and service reliability",
      whatWeKnow: `${applications.length} systems/services loaded; ${tierOneApps} are Tier 1. ServiceNow contributes ${incidents.length} incidents, ${problems.length} problems, and ${changes.length} changes.`,
      whyItMatters:
        "This turns CMDB and ITSM data into a practical dependency map before approving AI, sourcing, or platform work.",
      owner:
        topOwner([...applications, ...incidents, ...problems]) ??
        "CMDB Stewardship",
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(confidenceAverage),
      evidenceCount: input.counts.evidence,
      sourceSystems: systemsFor([...applications, ...incidents, ...problems]),
      actions: [
        "Ask Sentinel",
        "Create Source event",
        "Link to Move",
        "Add to Tower watchlist",
      ],
    },
    {
      key: "incident-problem-pressure",
      title: "Incident and problem pressure",
      whatWeKnow: `${slaBreaches} incidents breached SLA. ${problems.length} problem records are available to separate noisy symptoms from durable blockers.`,
      whyItMatters:
        "Operational pain can now shape sourcing scope and phase-gate evidence instead of arriving as anecdote.",
      owner: topOwner([...incidents, ...problems]) ?? "IT Service Management",
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(
        average([...incidents, ...problems].map((row) => row.confidence ?? 0)),
      ),
      evidenceCount: incidents.length + problems.length,
      sourceSystems: systemsFor([...incidents, ...problems]),
      actions: [
        "Ask Sentinel",
        "Open blocker brief",
        "Link to Move",
        "Add to Tower watchlist",
      ],
    },
    {
      key: "contract-renewal-exposure",
      title: "Contract renewal exposure",
      whatWeKnow: `${contracts.length} vendor/contracts and ${renewals.length} renewals are loaded; ${highRenewals} renewals are high risk. Estimated renewal exposure is ${formatUsd(renewalExposure)}.`,
      whyItMatters:
        "Source can prioritize events from renewal exposure instead of waiting for a procurement escalation.",
      owner: topOwner([...contracts, ...renewals]) ?? "IT Sourcing",
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(
        average([...contracts, ...renewals].map((row) => row.confidence ?? 0)),
      ),
      evidenceCount: contracts.length + renewals.length,
      sourceSystems: systemsFor([...contracts, ...renewals]),
      actions: [
        "Ask Sentinel",
        "Create Source event",
        "Generate brief",
        "Add to Tower watchlist",
      ],
    },
    {
      key: "spend-baseline-confidence",
      title: "Spend baseline confidence",
      whatWeKnow: `${spendRows.length} spend-baseline rows are loaded across ${new Set(spendRows.map((row) => row.payload.category)).size} categories. Annual run-rate represented is ${formatUsd(annualSpend)}.`,
      whyItMatters:
        "Financial context gives CXOs a credible starting point for value capture, vendor leverage, and sourcing thresholds.",
      owner: topOwner(spendRows) ?? "Finance Operations",
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(
        average(spendRows.map((row) => row.confidence ?? 0)),
      ),
      evidenceCount: spendRows.length,
      sourceSystems: systemsFor(spendRows),
      actions: ["Ask Sentinel", "Generate brief", "Create Source event"],
    },
    {
      key: "policy-ai-guardrails",
      title: "Policy constraints for AI use",
      whatWeKnow: `${policies.length} policies/procedures and ${risks.length} risk/compliance findings are loaded. ${input.counts.qualityIssues} quality issues remain open.`,
      whyItMatters:
        "AI initiatives can be shaped around real governance constraints instead of generic policy warnings.",
      owner: topOwner([...policies, ...risks]) ?? "GRC",
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(
        average([...policies, ...risks].map((row) => row.confidence ?? 0)),
      ),
      evidenceCount: policies.length + risks.length,
      sourceSystems: systemsFor([...policies, ...risks]),
      actions: ["Ask Sentinel", "Generate brief", "Link to Move"],
    },
    {
      key: "initiative-dependency-map",
      title: "Initiative dependency map",
      whatWeKnow: `${initiatives.length} initiatives and ${dataDomains.length} data-domain stewardship records are loaded against ${input.counts.relationships} CI relationships.`,
      whyItMatters:
        "Moves and Tower can see collisions across systems, contracts, data domains, and owners before approvals proceed.",
      owner: topOwner([...initiatives, ...dataDomains]) ?? "Enterprise PMO",
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(
        average(
          [...initiatives, ...dataDomains].map((row) => row.confidence ?? 0),
        ),
      ),
      evidenceCount: initiatives.length + dataDomains.length,
      sourceSystems: systemsFor([...initiatives, ...dataDomains]),
      actions: ["Ask Sentinel", "Link to Move", "Add to Tower watchlist"],
    },
  ];

  const sentinelFacts = [
    ...(input.derivedEnterpriseRead ? [
      `${input.tenantName} Derived Enterprise Read: ${input.derivedEnterpriseRead.headline}`,
      `${input.tenantName} executive summary: ${input.derivedEnterpriseRead.executiveSummary}`,
      `${input.tenantName} architecture pattern: ${input.derivedEnterpriseRead.architecturePattern}`,
      `${input.tenantName} benchmark/north-star read: ${input.derivedEnterpriseRead.northStar} ${input.derivedEnterpriseRead.peerImplication}`,
      ...input.derivedEnterpriseRead.recommendedMoves.slice(0, 3).map((move) =>
        `Recommended move: ${move.title}. Owner: ${move.owner}. Decision: ${move.decision}. Expected impact: ${move.expectedImpact}.`,
      ),
      `Sentinel rule: lead with the Derived Enterprise Read before internal substrate counts; use raw context counts only as supporting proof.`,
    ] : []),
    `${input.tenantName} Enterprise Context: ${input.counts.records} records, ${input.counts.facts} facts, ${input.counts.relationships} CI relationships, and ${input.counts.evidence} evidence rows are loaded from internal context sources.`,
    `Enterprise Context domains include org and decision rights (${orgRows.length}), facilities/business units (${businessUnitRows.length}), systems/services (${applications.length}), vendors/contracts (${contracts.length}), renewals (${renewals.length}), spend baseline (${spendRows.length}), KPIs/metrics (${kpis.length}), incidents (${incidents.length}), problems (${problems.length}), changes (${changes.length}), policies/procedures (${policies.length}), initiatives (${initiatives.length}), data domains/capabilities (${dataDomains.length}), and risks/compliance (${risks.length}).`,
    `Evidence posture: ${evidenceUsableCount}/${input.counts.evidence} evidence rows are currently usable; ${input.counts.qualityIssues} quality issues and ${input.counts.stewardshipTasks} stewardship tasks remain open.`,
    `Operational posture: ${incidents.length} incidents, ${problems.length} problems, ${changes.length} changes, and ${slaBreaches} SLA-breaching incidents are available for current-state guidance.`,
    `Commercial posture: ${contracts.length} contracts, ${renewals.length} renewal rows, ${highRenewals} high-risk renewals, ${formatUsd(renewalExposure)} estimated renewal exposure, and ${formatUsd(annualSpend)} annualized spend baseline are available.`,
    ...contextInsights.slice(0, 8).map((insight) =>
      `CIO insight ${insight.domain}: ${insight.headline}. So what: ${insight.so_what} Action: ${insight.action ?? 'review evidence'}. Evidence: ${insight.evidence ?? 'context insights'}.`,
    ),
    `Sentinel rule: answer ${input.tenantName} current-state questions from Enterprise Context first, cite internal source systems and freshness/confidence, and mark external or industry guidance as outside this internal-context layer.`,
  ];

  return {
    tenantKey: input.tenantKey,
    tenantName: input.tenantName,
    counts: input.counts,
    recordTypeCounts,
    freshnessCounts,
    sourceSystems,
    evidenceUsableCount,
    confidenceAverage,
    qualitySummary,
    cards,
    contextInsights,
    sentinelFacts,
    vendorSpendRows,
    derivedEnterpriseRead: input.derivedEnterpriseRead ?? null,
  };
}

function emptyEnterpriseContextCounts(): EnterpriseContextOverview['counts'] {
  return {
    sources: 0,
    records: 0,
    facts: 0,
    relationships: 0,
    evidence: 0,
    qualityIssues: 0,
    stewardshipTasks: 0,
    chunkQueue: 0,
  };
}

function buildVendorSpendRows(input: {
  contracts: EnterpriseContextRecordRow[];
  renewals: EnterpriseContextRecordRow[];
  spendRows: EnterpriseContextRecordRow[];
}): EnterpriseContextVendorSpendRow[] {
  const renewalByVendor = new Map<string, EnterpriseContextRecordRow>();
  for (const renewal of input.renewals) {
    const key = normalizeVendorKey(vendorNameFor(renewal));
    if (key && !renewalByVendor.has(key)) renewalByVendor.set(key, renewal);
  }

  const rows = input.contracts
    .map((contract, index): EnterpriseContextVendorSpendRow | null => {
      const vendor = vendorNameFor(contract);
      if (!vendor) return null;
      const renewal = renewalByVendor.get(normalizeVendorKey(vendor) ?? '');
      const spend = firstNumeric(
        contract.payload.annual_spend_usd,
        contract.payload.annualized_spend_usd,
        contract.payload.ttm_spend_usd,
        contract.payload.run_rate_usd,
        contract.payload.contract_value_usd,
        contract.payload.estimated_annual_value_usd,
        contract.payload.estimated_value_usd,
        renewal?.payload.estimated_value_usd,
        renewal?.payload.contract_value_usd,
      );
      const health = healthFor(contract, renewal);
      return {
        vendor,
        category: categoryFor(contract),
        subcategory: subcategoryFor(contract),
        spendUsdM: spend / 1_000_000,
        spendLabel: spend > 0 ? formatUsd(spend) : 'Not sized',
        tier: tierFor(contract, index),
        health,
        renewsInMonths: renewalMonthsFor(contract, renewal),
        takeaway: takeawayFor(contract, renewal, health),
      };
    })
    .filter((row): row is EnterpriseContextVendorSpendRow => Boolean(row));

  if (rows.length > 0) {
    return rows.sort((a, b) => b.spendUsdM - a.spendUsdM).slice(0, 25);
  }

  return input.spendRows
    .map((row, index): EnterpriseContextVendorSpendRow | null => {
      const vendor = stringValue(row.payload.vendor_name, row.payload.vendor, row.payload.supplier_name, row.title);
      if (!vendor) return null;
      const spend = firstNumeric(
        row.payload.run_rate_usd,
        row.payload.annual_spend_usd,
        row.payload.annualized_spend_usd,
        row.payload.ttm_spend_usd,
      );
      return {
        vendor,
        category: categoryFor(row),
        subcategory: subcategoryFor(row),
        spendUsdM: spend / 1_000_000,
        spendLabel: spend > 0 ? formatUsd(spend) : 'Not sized',
        tier: index === 0 ? 'incumbent' : 'challenger',
        health: 'watch',
        renewsInMonths: null,
        takeaway: `Spend baseline loaded from ${row.source_system}; confirm contract and renewal detail before acting.`,
      };
    })
    .filter((row): row is EnterpriseContextVendorSpendRow => Boolean(row))
    .sort((a, b) => b.spendUsdM - a.spendUsdM)
    .slice(0, 25);
}

async function getChunkBackedEnterpriseContextOverview(input: {
  tenantKey: string;
  tenantName: string;
}): Promise<EnterpriseContextOverview | null> {
  const chunks = await fetchTenantRows<EnterpriseContextChunkRow>(
    "enterprise_context_chunks",
    input.tenantKey,
    "source_doc,source_record_id,chunk_id,chunk_text,embedding_status,embedding_model,embedded_at,provenance,chunk_metadata",
  );

  if (chunks.length === 0) return null;
  return summarizeEnterpriseContextChunks({ ...input, chunks });
}

export function summarizeEnterpriseContextChunks(input: {
  tenantKey: string;
  tenantName: string;
  chunks: EnterpriseContextChunkRow[];
}): EnterpriseContextOverview {
  const recordTypeCounts = countBy(input.chunks, (row) =>
    recordTypeFromSourceDoc(row.source_doc),
  );
  const statusCounts = countBy(
    input.chunks,
    (row) => row.embedding_status ?? "pending",
  );
  const embedded = statusCounts.embedded ?? 0;
  const pending = statusCounts.pending ?? 0;
  const failed = statusCounts.failed ?? 0;
  const sourceSystems = [
    ...new Set(input.chunks.map((row) => sourceDocLabel(row.source_doc))),
  ].sort();
  const sourceDocPreview = sourceSystems.slice(0, 6).join(", ");

  const counts: EnterpriseContextOverview["counts"] = {
    sources: sourceSystems.length,
    records: 0,
    facts: 0,
    relationships: recordTypeCounts.ci_relationships_dependencies ?? 0,
    evidence: input.chunks.length,
    qualityIssues: failed,
    stewardshipTasks: pending,
    chunkQueue: pending + failed,
  };

  const freshnessCounts = {
    fresh: embedded,
    attention: pending,
    stale: failed,
  };
  const confidenceAverage =
    input.chunks.length > 0 ? embedded / input.chunks.length : 0;

  const chunkCountFor = (...types: string[]) =>
    types.reduce((sum, type) => sum + (recordTypeCounts[type] ?? 0), 0);
  const orgChunks = chunkCountFor(
    "org_decision_rights",
    "facilities_business_units",
  );
  const systemChunks = chunkCountFor(
    "cmdb_applications_services",
    "ci_relationships_dependencies",
  );
  const serviceChunks = chunkCountFor(
    "incidents",
    "problems",
    "changes",
    "slas",
  );
  const commercialChunks = chunkCountFor(
    "vendors_contract_inventory",
    "renewal_calendar",
    "spend_baseline",
  );
  const governanceChunks = chunkCountFor(
    "policies_procedures",
    "risk_compliance_register",
  );
  const portfolioChunks = chunkCountFor(
    "initiative_portfolio",
    "data_domains_stewardship",
  );

  const cards: EnterpriseContextOverviewCard[] = [
    {
      key: "chunk-backed-loader-coverage",
      title: "Loaded context files",
      whatWeKnow: `${sourceSystems.length} Admin-loaded source files are available as ${input.chunks.length} chunk-backed evidence rows.`,
      whyItMatters:
        "This proves the tenant has retrievable setup evidence even while normalized Enterprise Context tables are still catching up.",
      owner: "Context Stewardship",
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(confidenceAverage),
      evidenceCount: input.chunks.length,
      sourceSystems: sourceSystems.slice(0, 4),
      actions: [
        "Ask Sentinel",
        "Open evidence map",
        "Review loader files",
        "Add to Tower watchlist",
      ],
    },
    {
      key: "chunk-backed-embedding-coverage",
      title: "Embedded evidence coverage",
      whatWeKnow: `${embedded}/${input.chunks.length} context chunks are embedded for retrieval; ${pending} are pending and ${failed} failed.`,
      whyItMatters:
        "Sentinel and Nexus can only ground answers on context that has been committed and embedded.",
      owner: "AI Platform Operations",
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(confidenceAverage),
      evidenceCount: embedded,
      sourceSystems: sourceSystems.slice(0, 4),
      actions: ["Ask Sentinel", "Review pending chunks", "Run embedding proof"],
    },
    {
      key: "chunk-backed-org-systems",
      title: "Organization and systems context",
      whatWeKnow: `${orgChunks} org/facility chunks and ${systemChunks} system/dependency chunks are loaded from the setup templates.`,
      whyItMatters:
        "AI strategy, modernization, and sourcing decisions need named owners, decision rights, facilities, applications, and dependencies.",
      owner: "Enterprise Architecture",
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(confidenceAverage),
      evidenceCount: orgChunks + systemChunks,
      sourceSystems: sourceSystems
        .filter((doc) => /org|facilities|cmdb|relationships/i.test(doc))
        .slice(0, 4),
      actions: ["Ask Sentinel", "Link to Move", "Open dependency brief"],
    },
    {
      key: "chunk-backed-service-pressure",
      title: "Service and operations context",
      whatWeKnow: `${serviceChunks} incident, problem, change, and SLA chunks are loaded for operational pressure analysis.`,
      whyItMatters:
        "This lets current-state recommendations reflect actual service pain instead of generic transformation language.",
      owner: "IT Service Management",
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(confidenceAverage),
      evidenceCount: serviceChunks,
      sourceSystems: sourceSystems
        .filter((doc) => /incident|problem|change|sla/i.test(doc))
        .slice(0, 4),
      actions: ["Ask Sentinel", "Open blocker brief", "Add to Tower watchlist"],
    },
    {
      key: "chunk-backed-commercial-context",
      title: "Vendor, renewal, and spend context",
      whatWeKnow: `${commercialChunks} vendor, renewal, and spend chunks are loaded for financial and sourcing context.`,
      whyItMatters:
        "Commercial evidence gives CXOs a defensible starting point for prioritizing spend, renewal, and partner decisions.",
      owner: "Finance and Sourcing",
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(confidenceAverage),
      evidenceCount: commercialChunks,
      sourceSystems: sourceSystems
        .filter((doc) => /vendor|renewal|spend/i.test(doc))
        .slice(0, 4),
      actions: ["Ask Sentinel", "Create Source event", "Generate brief"],
    },
    {
      key: "chunk-backed-governance-portfolio",
      title: "Governance and portfolio context",
      whatWeKnow: `${governanceChunks} policy/risk chunks and ${portfolioChunks} initiative/data-domain chunks are loaded.`,
      whyItMatters:
        "Moves can now tie recommendations to governance constraints, active initiatives, and data-domain ownership.",
      owner: "Enterprise PMO",
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(confidenceAverage),
      evidenceCount: governanceChunks + portfolioChunks,
      sourceSystems: sourceSystems
        .filter((doc) =>
          /polic|risk|initiative|data-domain|data_domains/i.test(doc),
        )
        .slice(0, 4),
      actions: ["Ask Sentinel", "Link to Move", "Review governance evidence"],
    },
  ];

  const sentinelFacts = [
    `${input.tenantName} Enterprise Context: ${embedded} embedded context chunks across ${sourceSystems.length} Admin-loaded source files are available from the chunk-backed context layer.`,
    `Embedded posture: ${embedded}/${input.chunks.length} chunks embedded, ${pending} pending, and ${failed} failed.`,
    `Loaded source documents include ${sourceDocPreview}${sourceSystems.length > 6 ? ", and more" : ""}.`,
    `Context domains include org/decision rights (${recordTypeCounts.org_decision_rights ?? 0}), facilities/business units (${recordTypeCounts.facilities_business_units ?? 0}), systems/services (${recordTypeCounts.cmdb_applications_services ?? 0}), dependencies (${recordTypeCounts.ci_relationships_dependencies ?? 0}), vendors/contracts (${recordTypeCounts.vendors_contract_inventory ?? 0}), renewals (${recordTypeCounts.renewal_calendar ?? 0}), spend baseline (${recordTypeCounts.spend_baseline ?? 0}), incidents (${recordTypeCounts.incidents ?? 0}), problems (${recordTypeCounts.problems ?? 0}), changes (${recordTypeCounts.changes ?? 0}), SLAs (${recordTypeCounts.slas ?? 0}), policies/procedures (${recordTypeCounts.policies_procedures ?? 0}), initiatives (${recordTypeCounts.initiative_portfolio ?? 0}), data domains (${recordTypeCounts.data_domains_stewardship ?? 0}), and risk/compliance (${recordTypeCounts.risk_compliance_register ?? 0}).`,
    `Sentinel rule: answer current-state questions from Admin-loaded context chunks when normalized Enterprise Context records are not yet populated, label the basis as chunk-backed loader evidence, and do not describe chunks as structured records or facts.`,
  ];

  return {
    tenantKey: input.tenantKey,
    tenantName: input.tenantName,
    counts,
    recordTypeCounts,
    freshnessCounts,
    sourceSystems,
    evidenceUsableCount: embedded,
    confidenceAverage,
    qualitySummary: {
      "embedding:embedded": embedded,
      "embedding:pending": pending,
      "embedding:failed": failed,
    },
    cards,
    contextInsights: [],
    sentinelFacts,
    vendorSpendRows: [],
  };
}

async function countEnterpriseContextRows(
  tenantKey: string,
): Promise<EnterpriseContextOverview["counts"]> {
  const counts: Partial<EnterpriseContextOverview["counts"]> = {};
  for (const [key, table] of Object.entries(TABLES)) {
    counts[key as keyof EnterpriseContextOverview["counts"]] = await countRows(
      table,
      tenantKey,
    );
  }

  if ((counts.records ?? 0) > 0 && (counts.evidence ?? 0) === 0) {
    counts.evidence = await countRows("enterprise_context_chunks", tenantKey);
  }

  return counts as EnterpriseContextOverview["counts"];
}

async function countRows(table: string, tenantKey: string): Promise<number> {
  const sb = getAzureReadFluentClient();
  const { count, error } = await sb
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("tenant_key", tenantKey);
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return count ?? 0;
}

async function fetchTenantRows<T extends object>(
  table: string,
  tenantKey: string,
  columns: string,
): Promise<T[]> {
  const sb = getAzureReadFluentClient();
  const rows: T[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from(table)
      .select(columns)
      .eq("tenant_key", tenantKey)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${table} page fetch failed: ${error.message}`);
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

function countBy<T>(
  rows: T[],
  keyFn: (row: T) => string | null | undefined,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = keyFn(row) || "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function average(values: number[]): number {
  const filtered = values.filter(
    (value) => Number.isFinite(value) && value > 0,
  );
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function numeric(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstNumeric(...values: unknown[]): number {
  for (const value of values) {
    const parsed = numeric(value);
    if (parsed > 0) return parsed;
  }
  return 0;
}

function stringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function vendorNameFor(row: EnterpriseContextRecordRow): string {
  return stringValue(
    row.payload.vendor_name,
    row.payload.vendor,
    row.payload.supplier_name,
    row.payload.provider,
    row.payload.contract_vendor,
    row.payload.counterparty,
    row.title,
  );
}

function normalizeVendorKey(value: string): string | null {
  const key = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return key || null;
}

function categoryFor(row: EnterpriseContextRecordRow): EnterpriseContextVendorCategory {
  const text = [
    row.title,
    row.source_system,
    row.payload.category,
    row.payload.spend_category,
    row.payload.contract_category,
    row.payload.technology_category,
    row.payload.platform,
    row.payload.description,
  ]
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ');

  if (/\b(si|systems integrator|implementation|consulting|advisory|managed service|staff aug|outsourc|professional service)\b/.test(text)) {
    return 'services-si';
  }
  if (/\b(cloud|aws|azure|gcp|google cloud|vmware|dell|emc|cisco|network|storage|compute|data center|datacenter|hyperconverged|hci|hardware|infrastructure)\b/.test(text)) {
    return 'hardware-cloud';
  }
  return 'software-saas';
}

function subcategoryFor(row: EnterpriseContextRecordRow): string {
  return stringValue(
    row.payload.subcategory,
    row.payload.spend_subcategory,
    row.payload.contract_type,
    row.payload.platform,
    row.payload.application_category,
    row.payload.category,
    row.record_type,
  ) || 'Enterprise vendor';
}

function tierFor(row: EnterpriseContextRecordRow, index: number): EnterpriseContextVendorTier {
  const text = stringValue(row.payload.tier, row.payload.vendor_tier, row.payload.relationship_type).toLowerCase();
  if (text.includes('emerging')) return 'emerging';
  if (text.includes('challenger')) return 'challenger';
  if (text.includes('incumbent') || text.includes('strategic')) return 'incumbent';
  return index < 8 ? 'incumbent' : 'challenger';
}

function healthFor(
  contract: EnterpriseContextRecordRow,
  renewal: EnterpriseContextRecordRow | undefined,
): EnterpriseContextVendorHealth {
  const text = [
    contract.payload.risk,
    contract.payload.risk_level,
    contract.payload.health,
    contract.payload.status,
    contract.payload.renewal_risk,
    renewal?.payload.renewal_risk,
    renewal?.payload.risk_level,
  ]
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ');

  if (/\b(high|critical|red|at risk|risk)\b/.test(text)) return 'risk';
  if (/\b(medium|watch|amber|yellow|attention)\b/.test(text)) return 'watch';
  return 'healthy';
}

function renewalMonthsFor(
  contract: EnterpriseContextRecordRow,
  renewal: EnterpriseContextRecordRow | undefined,
): number | null {
  const raw = stringValue(
    renewal?.payload.renewal_date,
    renewal?.payload.expiration_date,
    renewal?.payload.contract_end_date,
    contract.payload.renewal_date,
    contract.payload.expiration_date,
    contract.payload.contract_end_date,
  );
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = date.getTime() - Date.now();
  return Math.max(0, Math.round(diffMs / (30.44 * 86_400_000)));
}

function takeawayFor(
  contract: EnterpriseContextRecordRow,
  renewal: EnterpriseContextRecordRow | undefined,
  health: EnterpriseContextVendorHealth,
): string {
  const note = stringValue(
    contract.payload.takeaway,
    contract.payload.notes,
    contract.payload.description,
    renewal?.payload.notes,
  );
  if (note) return note;
  if (health === 'risk') return `Risk signal loaded from ${contract.source_system}; review renewal and dependency evidence before action.`;
  if (health === 'watch') return `Watch item loaded from ${contract.source_system}; confirm owner, renewal timing, and linked initiatives.`;
  return `Loaded from ${contract.source_system}; validate spend, renewal, and dependency evidence before acting.`;
}

function topOwner(rows: EnterpriseContextRecordRow[]): string | null {
  const counts = countBy(rows, (row) => row.owner);
  const [owner] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
  return owner && owner !== "unknown" ? owner : null;
}

function systemsFor(rows: EnterpriseContextRecordRow[]): string[] {
  return [...new Set(rows.map((row) => row.source_system).filter(Boolean))]
    .sort()
    .slice(0, 4);
}

function sourceDocLabel(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed || "unknown-source";
}

function recordTypeFromSourceDoc(value: string | null | undefined): string {
  const sourceDoc = sourceDocLabel(value).split("/").pop() ?? "unknown-source";
  return (
    sourceDoc
      .replace(/\.[^.]+$/, "")
      .replace(/^\d+[-_]+/, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase() || "unknown"
  );
}

function freshnessLabel(counts: Record<string, number>): string {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (total === 0) return "unknown";
  const fresh = counts.fresh ?? 0;
  return `${fresh}/${total} fresh`;
}

function confidenceLabel(value: number): string {
  if (!value) return "unknown";
  return `${Math.round(value * 100)}%`;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Math.round(value)}`;
}

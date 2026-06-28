import { azureRead, type AzureReadClient } from '@/lib/data-plane/azureRead';
import type {
  AIInitiative,
  AIInitiativeVendorRow,
  ConfidenceLevel,
  Stage,
  StatusFlag,
} from '@/lib/admin/ai-initiatives/queries';

type JsonRecord = Record<string, unknown>;

interface TowerReadModelInitiativeRow {
  initiative_id: string;
  display_id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  category_name: string | null;
  goal_id: string | null;
  goal_name: string | null;
  stage: string | null;
  stage_detail: string | null;
  owner_name: string | null;
  owner_title: string | null;
  owner_function: string | null;
  committed_annual_usd: string | number | null;
  committed_total_usd: string | number | null;
  measured_value_usd: string | number | null;
  status_flag: string | null;
  status_summary: string | null;
  confidence_level: string | null;
  aligned_callout: boolean | null;
  aligned_rationale: string | null;
  loaded_via_template: string | null;
  portfolio_company?: string | null;
  operating_company?: string | null;
  legal_entity?: string | null;
  business_unit?: string | null;
  business_function?: string | null;
  gaps: JsonRecord[] | null;
}

interface TowerReadModelVendorRow {
  vendor_id: string;
  vendor_name: string;
  initiative_id: string | null;
  initiative_display_id: string | null;
  initiative_name: string | null;
  contract_value_usd: string | number | null;
  renewal_date: string | Date | null;
  financial_health: string | null;
}

export interface MaterializedTowerReadModel {
  source: 'tower_materialized_read_model' | 'empty';
  initiatives: AIInitiative[];
  vendors: AIInitiativeVendorRow[];
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[$,]/g, '').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isoDate(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const raw = text(value);
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? raw : new Date(parsed).toISOString().slice(0, 10);
}

function normalizeStage(value: unknown): Stage {
  const raw = text(value).toLowerCase();
  if (raw === 'scaled' || raw === 'pilot' || raw === 'sunset') return raw;
  if (raw === 'in_strategic_move' || raw === 'multi_year_strategic_bet') return raw;
  if (raw.includes('scale') || raw.includes('run') || raw.includes('live')) return 'scaled';
  if (raw.includes('sunset') || raw.includes('retire')) return 'sunset';
  if (raw.includes('move') || raw.includes('build') || raw.includes('implement')) return 'in_strategic_move';
  if (raw.includes('multi') || raw.includes('transform')) return 'multi_year_strategic_bet';
  return 'pilot';
}

function normalizeStatus(value: unknown): StatusFlag {
  const raw = text(value).toLowerCase();
  if (
    raw === 'healthy' ||
    raw === 'in_move' ||
    raw === 'value_lag' ||
    raw === 'stalled' ||
    raw === 'adoption_gap' ||
    raw === 'cost_overrun' ||
    raw === 'duplication_risk' ||
    raw === 'foundation_phase'
  ) {
    return raw;
  }
  if (raw.includes('duplicate') || raw.includes('overlap')) return 'duplication_risk';
  if (raw.includes('cost') || raw.includes('overrun') || raw.includes('budget')) return 'cost_overrun';
  if (raw.includes('adoption')) return 'adoption_gap';
  if (raw.includes('blocked') || raw.includes('critical') || raw.includes('fail')) return 'stalled';
  if (raw.includes('high') || raw.includes('lag') || raw.includes('watch') || raw.includes('review')) return 'value_lag';
  if (raw.includes('foundation')) return 'foundation_phase';
  if (raw.includes('move')) return 'in_move';
  return 'healthy';
}

function normalizeConfidence(value: unknown): ConfidenceLevel {
  const raw = text(value).toUpperCase();
  if (raw === 'HIGH' || raw === 'MED' || raw === 'LOW') return raw;
  if (raw.includes('HIGH')) return 'HIGH';
  if (raw.includes('LOW')) return 'LOW';
  return 'MED';
}

function normalizeFinancialHealth(
  value: unknown,
): AIInitiativeVendorRow['financialHealth'] {
  const raw = text(value).toLowerCase();
  if (raw === 'strong' || raw === 'moderate' || raw === 'watch' || raw === 'at_risk') return raw;
  if (raw.includes('risk')) return 'at_risk';
  if (raw.includes('watch')) return 'watch';
  if (raw.includes('strong')) return 'strong';
  return 'moderate';
}

export function shapeTowerMaterializedReadModel(args: {
  initiativeRows: readonly TowerReadModelInitiativeRow[];
  vendorRows: readonly TowerReadModelVendorRow[];
}): MaterializedTowerReadModel {
  const initiatives = args.initiativeRows.map((row): AIInitiative => ({
    initiativeId: row.initiative_id,
    displayId: row.display_id,
    name: row.name,
    description: text(row.description, 'Loaded from the Tower read model.'),
    primaryCategoryId: text(row.category_id, 'it_portfolio'),
    primaryCategoryName: text(row.category_name, text(row.category_id, 'IT portfolio')),
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: text(row.goal_id, 'tower_it_portfolio'),
    primaryGoalName: text(row.goal_name, text(row.goal_id, 'IT portfolio value and control')),
    stage: normalizeStage(row.stage),
    stageDetail: text(row.stage_detail) || null,
    ownerName: text(row.owner_name, 'Loaded owner role'),
    ownerTitle: text(row.owner_title, text(row.owner_name, 'Loaded owner role')),
    ownerFunction: text(row.owner_function) || null,
    committedAnnualUsd: num(row.committed_annual_usd),
    committedTotalUsd: num(row.committed_total_usd),
    measuredValueUsd: num(row.measured_value_usd),
    statusFlag: normalizeStatus(row.status_flag),
    statusSummary: text(row.status_summary, 'Loaded from the Tower read model.'),
    confidenceLevel: normalizeConfidence(row.confidence_level),
    alignedCallout: row.aligned_callout === true,
    alignedRationale: text(row.aligned_rationale) || null,
    loadedViaTemplate: text(row.loaded_via_template, 'tower_materialized_read_model'),
    portfolioCompany: text(row.portfolio_company) || null,
    operatingCompany: text(row.operating_company) || null,
    legalEntity: text(row.legal_entity) || null,
    businessUnit: text(row.business_unit) || null,
    businessFunction: text(row.business_function) || null,
  }));

  const fallbackInitiative = initiatives[0] ?? null;
  const vendors = args.vendorRows.map((row): AIInitiativeVendorRow => ({
    vendorId: row.vendor_id,
    initiativeId: text(row.initiative_id, fallbackInitiative?.initiativeId ?? 'tower:portfolio'),
    initiativeDisplayId: text(row.initiative_display_id, fallbackInitiative?.displayId ?? 'IT-PORTFOLIO'),
    initiativeName: text(row.initiative_name, fallbackInitiative?.name ?? 'IT portfolio'),
    vendorName: row.vendor_name,
    contractValueUsd: num(row.contract_value_usd),
    renewalDate: isoDate(row.renewal_date),
    financialHealth: normalizeFinancialHealth(row.financial_health),
  }));

  return {
    source: initiatives.length > 0 || vendors.length > 0 ? 'tower_materialized_read_model' : 'empty',
    initiatives,
    vendors,
  };
}

export async function listMaterializedTowerReadModelForClient(args: {
  clientId: string;
  tenantKey: string | null;
  db?: AzureReadClient;
}): Promise<MaterializedTowerReadModel> {
  const db = args.db ?? azureRead;
  const tenantWhere = args.tenantKey ? { tenant_key: args.tenantKey } : null;
  const [initiativeRows, vendorRows] = await Promise.all([
    db.select<TowerReadModelInitiativeRow>({
      table: 'tower_read_model_initiatives',
      columns: [
        'initiative_id',
        'display_id',
        'name',
        'description',
        'category_id',
        'category_name',
        'goal_id',
        'goal_name',
        'stage',
        'stage_detail',
        'owner_name',
        'owner_title',
        'owner_function',
        'committed_annual_usd',
        'committed_total_usd',
        'measured_value_usd',
        'status_flag',
        'status_summary',
        'confidence_level',
        'aligned_callout',
        'aligned_rationale',
        'loaded_via_template',
        'portfolio_company',
        'operating_company',
        'legal_entity',
        'business_unit',
        'business_function',
        'gaps',
      ],
      where: tenantWhere ?? { client_id: args.clientId },
      orderBy: { column: 'display_id', direction: 'asc' },
      missingTable: 'empty',
      limit: 200,
    }),
    db.select<TowerReadModelVendorRow>({
      table: 'tower_read_model_vendors',
      columns: [
        'vendor_id',
        'vendor_name',
        'initiative_id',
        'initiative_display_id',
        'initiative_name',
        'contract_value_usd',
        'renewal_date',
        'financial_health',
      ],
      where: tenantWhere ?? { client_id: args.clientId },
      orderBy: { column: 'renewal_date', direction: 'asc', nulls: 'last' },
      missingTable: 'empty',
      limit: 500,
    }),
  ]);

  return shapeTowerMaterializedReadModel({ initiativeRows, vendorRows });
}

import type { AIInitiative, AIInitiativeVendorRow } from '@/lib/admin/ai-initiatives/queries';
import type { TowerPressuresView } from '@/lib/tower/pressure-cards-view';
import type { StrategicAlignment2x2View } from '@/lib/tower/strategic-alignment-2x2-view';

export type AtlasPatternId =
  | 'pattern_01_top_pressure'
  | 'pattern_02_shared_root'
  | 'pattern_03_defend_while_resolving'
  | 'pattern_04_vendor_clock'
  | 'pattern_05_look_ahead'
  | 'pattern_06_healthy_posture';

export interface AtlasSharedRoot {
  kind: 'status_flag' | 'category_confidence' | 'vendor' | 'goal';
  label: string;
  initiativeIds: ReadonlyArray<string>;
}

export interface AtlasPatternSelection {
  leadPattern: AtlasPatternId;
  secondaryPatterns: ReadonlyArray<AtlasPatternId>;
  sharedRoot: AtlasSharedRoot | null;
}

export interface AtlasPatternSelectionInput {
  initiatives: ReadonlyArray<AIInitiative>;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
  pressuresView: TowerPressuresView;
  alignment2x2View: StrategicAlignment2x2View;
  todayIso: string;
}

const RENEWAL_WINDOW_DAYS = 90;
const LOOK_AHEAD_WINDOW_DAYS = 365;

function daysUntil(targetIso: string, todayIso: string): number {
  const target = Date.parse(targetIso);
  const today = Date.parse(todayIso);
  if (Number.isNaN(target) || Number.isNaN(today)) return Number.POSITIVE_INFINITY;
  return Math.floor((target - today) / (1000 * 60 * 60 * 24));
}

function hasVendorInWindow(
  vendors: ReadonlyArray<AIInitiativeVendorRow>,
  todayIso: string,
  minDays: number,
  maxDays: number,
): boolean {
  return vendors.some((vendor) => {
    if (!vendor.renewalDate) return false;
    const days = daysUntil(vendor.renewalDate, todayIso);
    return days >= minDays && days <= maxDays;
  });
}

function pressureInitiatives(
  input: AtlasPatternSelectionInput,
): ReadonlyArray<AIInitiative> {
  const displayIds = new Set(
    input.pressuresView.cards
      .map((card) => card.displayId)
      .filter((id): id is string => Boolean(id)),
  );
  return input.initiatives.filter((initiative) => displayIds.has(initiative.displayId));
}

function findSharedRoot(input: AtlasPatternSelectionInput): AtlasSharedRoot | null {
  const pressured = pressureInitiatives(input);
  if (pressured.length < 2) return null;

  const byVendor = new Map<string, Set<string>>();
  for (const vendor of input.vendors) {
    if (!pressured.some((initiative) => initiative.initiativeId === vendor.initiativeId)) {
      continue;
    }
    const normalized = vendor.vendorName.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
    const set = byVendor.get(normalized) ?? new Set<string>();
    set.add(vendor.initiativeId);
    byVendor.set(normalized, set);
  }
  for (const [vendor, ids] of byVendor.entries()) {
    if (ids.size >= 2) {
      return {
        kind: 'vendor',
        label: `vendor family ${vendor}`,
        initiativeIds: [...ids],
      };
    }
  }

  const byGoal = new Map<string, AIInitiative[]>();
  for (const initiative of pressured) {
    const list = byGoal.get(initiative.primaryGoalId) ?? [];
    list.push(initiative);
    byGoal.set(initiative.primaryGoalId, list);
  }
  for (const list of byGoal.values()) {
    if (list.length >= 2) {
      return {
        kind: 'goal',
        label: list[0]!.primaryGoalName,
        initiativeIds: list.map((initiative) => initiative.initiativeId),
      };
    }
  }

  const byCategoryConfidence = new Map<string, AIInitiative[]>();
  for (const initiative of pressured) {
    const key = `${initiative.primaryCategoryId}|${initiative.confidenceLevel}`;
    const list = byCategoryConfidence.get(key) ?? [];
    list.push(initiative);
    byCategoryConfidence.set(key, list);
  }
  for (const list of byCategoryConfidence.values()) {
    if (list.length >= 2) {
      return {
        kind: 'category_confidence',
        label: `${list[0]!.primaryCategoryName} at ${list[0]!.confidenceLevel} confidence`,
        initiativeIds: list.map((initiative) => initiative.initiativeId),
      };
    }
  }

  const foundationBet = input.initiatives.find(
    (initiative) =>
      initiative.stage === 'multi_year_strategic_bet' &&
      initiative.statusFlag === 'foundation_phase',
  );
  if (foundationBet) {
    const references = pressured.filter((initiative) => {
      const haystack = `${initiative.description} ${initiative.statusSummary}`.toLowerCase();
      return (
        haystack.includes(foundationBet.displayId.toLowerCase()) ||
        haystack.includes('platform') ||
        haystack.includes('instrumentation') ||
        haystack.includes('integration')
      );
    });
    if (references.length >= 2) {
      return {
        kind: 'status_flag',
        label: `${foundationBet.displayId} foundation dependency`,
        initiativeIds: [...references.map((initiative) => initiative.initiativeId), foundationBet.initiativeId],
      };
    }
  }

  return null;
}

export function selectAtlasPatterns(input: AtlasPatternSelectionInput): AtlasPatternSelection {
  const hasPressures = input.pressuresView.cards.length > 0;
  const hasVendorPressure = input.pressuresView.cards[0]?.type === 'vend';
  const sharedRoot = findSharedRoot(input);
  const hasAlignedCallout = input.initiatives.some(
    (initiative) =>
      initiative.alignedCallout &&
      initiative.statusFlag !== 'cost_overrun' &&
      initiative.statusFlag !== 'duplication_risk' &&
      (initiative.measuredValueUsd ?? 0) > 0,
  );
  const hasLookAhead =
    input.alignment2x2View.strategicBets.length > 0 ||
    hasVendorInWindow(input.vendors, input.todayIso, RENEWAL_WINDOW_DAYS + 1, LOOK_AHEAD_WINDOW_DAYS);

  const leadPattern: AtlasPatternId = hasVendorPressure
    ? 'pattern_04_vendor_clock'
    : hasPressures
      ? 'pattern_01_top_pressure'
      : 'pattern_06_healthy_posture';

  const secondaryPatterns: AtlasPatternId[] = [];
  if (hasPressures && sharedRoot) {
    secondaryPatterns.push('pattern_02_shared_root');
  } else if (hasPressures && hasAlignedCallout) {
    secondaryPatterns.push('pattern_03_defend_while_resolving');
  } else if (!hasPressures && hasLookAhead) {
    secondaryPatterns.push('pattern_05_look_ahead');
  }

  if (hasLookAhead && !secondaryPatterns.includes('pattern_05_look_ahead')) {
    secondaryPatterns.push('pattern_05_look_ahead');
  }

  return {
    leadPattern,
    secondaryPatterns: secondaryPatterns.slice(0, 2),
    sharedRoot,
  };
}

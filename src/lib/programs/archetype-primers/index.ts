// PR-OV2-3a: Archetype primer registry.

import { CDP_ACTIVATION_PRIMER } from './PAT-PRG-CDP-001';
import { CONTACT_CENTER_AI_PRIMER } from './PAT-PRG-CC-AI-001';
import { DEMAND_FORECASTING_PRIMER } from './PAT-PRG-DATA-FAB-001';
import type { ArchetypePrimer } from './types';

export { CDP_ACTIVATION_PRIMER } from './PAT-PRG-CDP-001';
export { CONTACT_CENTER_AI_PRIMER } from './PAT-PRG-CC-AI-001';
export { DEMAND_FORECASTING_PRIMER } from './PAT-PRG-DATA-FAB-001';

const PRIMERS: ReadonlyArray<ArchetypePrimer> = [
  CDP_ACTIVATION_PRIMER,
  CONTACT_CENTER_AI_PRIMER,
  DEMAND_FORECASTING_PRIMER,
];

export function getArchetypePrimer(patternId: string): ArchetypePrimer | null {
  return PRIMERS.find((p) => p.patternId === patternId) ?? null;
}

export function listArchetypePrimers(): ReadonlyArray<ArchetypePrimer> {
  return PRIMERS;
}

export type {
  ArchetypePrimer,
  PrimerSME,
  PrimerTemplate,
  PrimerWorkshop,
  PrimerDataAsset,
  PrimerEngagementWindow,
  PrimerTemplateKind,
  PrimerDataAssetFormat,
  PrimerPrepItem,
} from './types';

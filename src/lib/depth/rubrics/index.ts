import type { DepthRubricDefinition, DepthRubricType } from '../types';
import { gateRubric } from './gate';
import { instrumentRubric } from './instrument';
import { patternRubric } from './pattern';
import { sentinelRubric } from './sentinel';
import { templateRubric } from './template';
import { workshopRubric } from './workshop';

export const DEPTH_RUBRICS: Record<DepthRubricType, DepthRubricDefinition> = {
  template: templateRubric,
  workshop: workshopRubric,
  instrument: instrumentRubric,
  pattern: patternRubric,
  gate: gateRubric,
  sentinel: sentinelRubric,
};

export function getDepthRubric(type: DepthRubricType): DepthRubricDefinition {
  return DEPTH_RUBRICS[type];
}

export const DEPTH_RUBRIC_TYPES = Object.keys(DEPTH_RUBRICS) as DepthRubricType[];

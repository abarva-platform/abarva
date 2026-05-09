import {
  validateAtlasCitations,
  type AtlasCitedObservation,
} from '../../../lib/tower/atlas-citation-validator';

export function probeCitationCompleteness(
  observations: ReadonlyArray<AtlasCitedObservation>,
): ReadonlyArray<string> {
  return validateAtlasCitations(observations);
}

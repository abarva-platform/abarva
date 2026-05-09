import type { AtlasInterpretiveObservation } from '../../../lib/tower/atlas-interpretation-view';

const FILLER = [
  'rapidly changing',
  'critical situation',
  'careful consideration',
  'it is important to note',
  'in today',
];

export function probeCompression(
  observations: ReadonlyArray<AtlasInterpretiveObservation>,
): ReadonlyArray<string> {
  const errors: string[] = [];
  for (const observation of observations) {
    if (observation.body.length < 40) {
      errors.push(`obs${observation.number} is too short to carry structural value`);
    }
    const lower = observation.body.toLowerCase();
    for (const phrase of FILLER) {
      if (lower.includes(phrase)) errors.push(`obs${observation.number} uses filler phrase "${phrase}"`);
    }
  }
  return errors;
}

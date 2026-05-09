import type { AtlasPatternId } from '../../../lib/tower/atlas-pattern-selectors';

export function probePatternCorrectness(args: {
  fired: ReadonlyArray<AtlasPatternId>;
  shouldFire?: ReadonlyArray<AtlasPatternId>;
  shouldNotFire?: ReadonlyArray<AtlasPatternId>;
}): ReadonlyArray<string> {
  const errors: string[] = [];
  for (const pattern of args.shouldFire ?? []) {
    if (!args.fired.includes(pattern)) errors.push(`missing expected pattern ${pattern}`);
  }
  for (const pattern of args.shouldNotFire ?? []) {
    if (args.fired.includes(pattern)) errors.push(`unexpected pattern ${pattern}`);
  }
  return errors;
}

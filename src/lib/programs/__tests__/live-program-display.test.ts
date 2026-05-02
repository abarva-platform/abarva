import { getLiveProgramDisplayId } from '../live-program-display';

describe('getLiveProgramDisplayId', () => {
  it('uses readable phase labels instead of raw DB UUID prefixes', () => {
    expect(getLiveProgramDisplayId(0)).toBe('LIVE-P0');
    expect(getLiveProgramDisplayId(4)).toBe('LIVE-P4');
  });
});

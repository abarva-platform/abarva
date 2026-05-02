import fs from 'node:fs';
import path from 'node:path';

describe('Programs P6 schema support', () => {
  it('ships a migration that allows engagements.current_phase = 6', () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), 'supabase/migrations/20260502060000_engagements_allow_p6.sql'),
      'utf8',
    );

    expect(migration).toContain('DROP CONSTRAINT IF EXISTS engagements_current_phase_check');
    expect(migration).toContain('current_phase <= 6');
  });
});

import { readFileSync } from 'fs';
import { join } from 'path';

const setupRailSource = readFileSync(
  join(process.cwd(), 'src/components/admin/SetupChatRail.tsx'),
  'utf8',
);

describe('SetupChatRail agent-first contract', () => {
  it('puts the Steward composer immediately after the header', () => {
    expect(setupRailSource).toContain('composerPlacement="afterHeader"');
  });

  it('keeps only the latest turns visible in the fixed rail', () => {
    expect(setupRailSource).toContain('conversationWindow={4}');
  });
});

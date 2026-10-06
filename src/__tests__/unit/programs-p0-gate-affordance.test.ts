import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('P0 gate affordance copy', () => {
  const programsPage = readFileSync(
    path.join(process.cwd(), 'src/app/programs/page.tsx'),
    'utf8',
  );
  const detailRoute = readFileSync(
    path.join(process.cwd(), 'src/app/programs/[id]/page.tsx'),
    'utf8',
  );
  it('treats approved P0 programs as pending until the signed P0 seed exists', () => {
    expect(programsPage).toContain('waitingForSetupApproval || approvedForP0');
    expect(detailRoute).toContain('hasSignedP0Seed');
    expect(detailRoute).toContain("view.gateStatus = hasSignedP0Seed ? 'open' : 'pending'");
  });

  // The client-side affordance is exercised by the rendered Program detail
  // suite. This file retains the server-route state derivation, which cannot
  // be proven by mounting the client component alone.
});

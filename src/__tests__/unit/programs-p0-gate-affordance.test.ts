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
  const detailPage = readFileSync(
    path.join(process.cwd(), 'src/components/programs/ProgramDetailPage.tsx'),
    'utf8',
  );

  it('treats approved P0 programs as pending until the signed P0 seed exists', () => {
    expect(programsPage).toContain('waitingForSetupApproval || approvedForP0');
    expect(detailRoute).toContain('hasSignedP0Seed');
    expect(detailRoute).toContain("view.gateStatus = hasSignedP0Seed ? 'open' : 'pending'");
  });

  it('disables direct P0 advance until seed artifacts are signed off', () => {
    expect(detailPage).toContain('Complete and sign off the P0 seed artifacts');
    expect(detailPage).toContain("view.gateStatus === 'pending'");
  });
});

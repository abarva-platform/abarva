import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('admin approval copy hygiene', () => {
  const detailPage = readFileSync(
    path.join(
      process.cwd(),
      'src/app/(maestro)/admin/programs/approvals/[requestId]/page.tsx',
    ),
    'utf8',
  );

  it('does not render request UUIDs in the visible approval header', () => {
    expect(detailPage).toContain('function RequestStatusLine');
    expect(detailPage).toContain('<span>Approval request</span>');
    expect(detailPage).not.toContain('REQUEST · {requestId}');
  });

  it('renders audit actors through display names, not raw IDs', () => {
    expect(detailPage).toContain('{requestedByDisplayName}');
    expect(detailPage).toContain('{decidedByDisplayName}');
    expect(detailPage).not.toContain('{requestedByUserId}');
    expect(detailPage).not.toContain('{decidedByUserId}');
  });
});

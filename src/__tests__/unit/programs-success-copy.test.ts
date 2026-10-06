import fs from 'node:fs';
import path from 'node:path';

describe('program origination success copy', () => {
  const repoRoot = process.cwd();

  it('does not instruct Nexus to expose raw program ids after commit_program succeeds', () => {
    const routeSource = fs.readFileSync(path.join(repoRoot, 'src/app/api/chat/agent/route.ts'), 'utf8');
    const commitToolSource = fs.readFileSync(path.join(repoRoot, 'src/lib/agent/tools/program/commitProgram.ts'), 'utf8');

    expect(routeSource).not.toContain('Program id: <engagement_id>');
    expect(routeSource).not.toContain('Open: /programs/<engagement_id>');
    expect(routeSource).toContain('Do not mention the raw program id, database id, UUID, or internal URL in chat prose');

    expect(commitToolSource).not.toContain('navigate to /programs/<engagement_id>');
    expect(commitToolSource).toContain('Do NOT mention raw program IDs, database IDs, UUIDs');
  });

  it('keeps live DB program chrome from labeling UUID records as deterministic seed', () => {
    const downloadButtonSource = fs.readFileSync(path.join(repoRoot, 'src/components/reasoning/DownloadContextButton.tsx'), 'utf8');

    // ProgramDetailPage's visible live-record label is asserted by its
    // rendered behavior suite. This remaining check belongs to a separate
    // component and guards against leaking an internal id in download copy.
    expect(downloadButtonSource).not.toContain('Download synthesis context JSON for ${instanceId}');
  });
});

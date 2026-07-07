import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('/admin/outputs page source', () => {
  const source = readFileSync(
    join(process.cwd(), 'src/app/(maestro)/admin/outputs/page.tsx'),
    'utf8',
  );
  const helper = readFileSync(
    join(process.cwd(), 'src/lib/admin/outputs-deliverables-explorer.ts'),
    'utf8',
  );

  it('uses the canonical admin shell and outputs explorer read model', () => {
    expect(source).toContain('AdminCanonShellV2');
    expect(source).toContain('loadOutputsDeliverablesExplorerModel');
    expect(source).toContain('Outputs and deliverables');
  });

  it('keeps private loader, schema preflight, and consent gate files out of the slice', () => {
    expect(source).not.toContain('CsvUploadConnector');
    expect(helper).not.toContain('CsvUploadConnector');
    expect(source).not.toContain('schema-preflight');
    expect(helper).not.toContain('schema-preflight');
    expect(source).not.toContain('consent');
    expect(helper).not.toContain('consent');
  });

  it('reads existing Move and Source models without migration or upload controls', () => {
    expect(helper).toContain('getStrategicMovePortfolio');
    expect(helper).toContain('selectSourceEventsReadAdapter');
    expect(helper).toContain("table: 'source_event_artifact_states'");
    expect(source).not.toContain('/api/admin/context-layer/csv-upload');
  });
});

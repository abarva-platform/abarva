import fs from 'node:fs';
import path from 'node:path';

const HANDOFF_ROOT = path.join(
  process.cwd(),
  'docs/build/client-context-simulations/meridian-agentic-care-data-accelerator',
);

function read(relativePath: string): string {
  return fs.readFileSync(path.join(HANDOFF_ROOT, relativePath), 'utf8');
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

describe('Meridian Agentic Care Data Accelerator handoff contract', () => {
  it('keeps the source artifact spine, handoff, and audits checked into the repo', () => {
    const requiredFiles = [
      'README.md',
      'SIMULATION_SEED_PACK.yaml',
      'artifacts/01_strategy_and_current_state_minutes.md',
      'artifacts/02_architecture_workshop_minutes.md',
      'artifacts/03_program_steering_decision_log.md',
      'artifacts/04_workshop_action_register.md',
      'artifacts/05_solution_input_summary.md',
      'handoff/app_wiring_map.yaml',
      'handoff/source_artifact_index.yaml',
      'handoff/validation_query_pack.yaml',
      'handoff/compatibility_note.md',
      'audits/corpus-manifest.yaml',
      'audits/latest-validation-report.json',
      'audits/publication-audit-embedding.json',
      'audits/publication-audit-upsert.json',
      'audits/smoke-tests-report.json',
    ];

    for (const file of requiredFiles) {
      expect(fs.existsSync(path.join(HANDOFF_ROOT, file))).toBe(true);
    }
  });

  it('preserves the app/data key boundary and published-not-app-wired status', () => {
    const readme = read('README.md');
    const compatibility = read('handoff/compatibility_note.md');
    const wiring = read('handoff/app_wiring_map.yaml');

    expect(readme).toContain('App client key: `meridian`');
    expect(readme).toContain('Data tenant key: `meridian-health`');
    expect(readme).toContain('Status: published but not app-wired');
    expect(compatibility).toContain('published but not app-wired');
    expect(wiring).toContain('program_id: MH-PROG-AGENTIC-CARE-DATA-ACCELERATOR');
    expect(wiring).toContain('lifecycle_phase: P3');
  });

  it('locks the six validation queries and the expected simulation corpus IDs', () => {
    const validationPack = read('handoff/validation_query_pack.yaml');
    const queryIds = validationPack.match(/id: VQ-\d{3}/g) ?? [];

    expect(queryIds).toHaveLength(6);
    expect(validationPack).toContain(
      'PAT-MERIDIAN-HEALTH-MH-PROG-AGENTIC-CARE-DATA-ACCELERATOR-SIM',
    );
    expect(validationPack).toContain(
      'REG-MERIDIAN-HEALTH-MH-PROG-AGENTIC-CARE-DATA-ACCELERATOR-SIM',
    );
    expect(validationPack).toContain(
      'EV-MERIDIAN-HEALTH-MH-PROG-AGENTIC-CARE-DATA-ACCELERATOR-SIM-V1',
    );
  });

  it('keeps publication audits aligned with the loaded corpus volume', () => {
    const manifest = read('audits/corpus-manifest.yaml');
    const validation = readJson<{
      summary: { files_checked: number; errors: number; warnings: number };
      findings: unknown[];
    }>('audits/latest-validation-report.json');
    const embedding = readJson<{
      run_mode: string;
      chunks_embedded: number;
      model: string;
      dim: number;
    }>('audits/publication-audit-embedding.json');
    const upsert = readJson<{
      run_mode: string;
      pinecone_index: string;
      counts_by_namespace: Record<string, number>;
    }>('audits/publication-audit-upsert.json');
    const smoke = readJson<{ suite_passed: boolean; suite_pass_ratio: number }>(
      'audits/smoke-tests-report.json',
    );

    expect(manifest).toContain('total: 148');
    expect(validation.summary.files_checked).toBe(148);
    expect(validation.summary.errors).toBe(0);
    expect(validation.summary.warnings).toBe(0);
    expect(validation.findings).toHaveLength(0);
    expect(embedding).toMatchObject({
      run_mode: 'live',
      chunks_embedded: 1026,
      model: 'text-embedding-3-large',
      dim: 1024,
    });
    expect(upsert.run_mode).toBe('live');
    expect(upsert.pinecone_index).toBe('abarva-knowledge-corpus-prod');
    expect(
      Object.values(upsert.counts_by_namespace).reduce((total, count) => total + count, 0),
    ).toBe(1026);
    expect(smoke.suite_passed).toBe(true);
    expect(smoke.suite_pass_ratio).toBe(1);
  });
});

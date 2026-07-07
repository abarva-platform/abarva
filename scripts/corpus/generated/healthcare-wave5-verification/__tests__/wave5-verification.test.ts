import fs from 'node:fs';
import path from 'node:path';

const REPORT_DIR = path.resolve(process.cwd(), 'reports/healthcare-harden/wave-5');
const EVAL_DIR = path.resolve(process.cwd(), 'reports/healthcare-harden/eval');

function readJsonl(filePath: string): Array<Record<string, unknown>> {
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe('healthcare Wave 5 estimation and RFP verification', () => {
  it('runs the three required cross-cutting evals without adding corpus rows', () => {
    const evalRows = readJsonl(path.join(REPORT_DIR, 'audit.jsonl'));
    expect(evalRows).toHaveLength(3);
    expect(evalRows.map((row) => row.verdict)).toEqual(['PASS', 'PASS', 'PASS']);

    expect(fs.readFileSync(path.join(REPORT_DIR, 'new-patterns.jsonl'), 'utf8').trim()).toBe('');
    expect(fs.readFileSync(path.join(REPORT_DIR, 'refined.jsonl'), 'utf8').trim()).toBe('');
    expect(fs.readFileSync(path.join(REPORT_DIR, 'killed.jsonl'), 'utf8').trim()).toBe('');
  });

  it('keeps Lakebridge P50/P80/P95 bands inside the calibration envelope', () => {
    const checkpoint = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, 'checkpoint.json'), 'utf8')) as {
      estimation: {
        estimateDays: { p50: number; p80: number; p95: number };
        withinExpectedBand: { p50: boolean; p80: boolean; p95: boolean };
      };
    };

    expect(checkpoint.estimation.estimateDays).toEqual({ p50: 118, p80: 163, p95: 217 });
    expect(checkpoint.estimation.withinExpectedBand).toEqual({ p50: true, p80: true, p95: true });
  });

  it('normalizes all three SI bids across seven Lakehouse pillars', () => {
    const checkpoint = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, 'checkpoint.json'), 'utf8')) as {
      rfp_normalization: Array<{
        id: string;
        lakehousePillarScores: Record<string, number>;
        recommendation: string;
        riskAdjustedPriceUsd: number;
      }>;
    };

    expect(checkpoint.rfp_normalization).toHaveLength(3);
    for (const bid of checkpoint.rfp_normalization) {
      expect(Object.keys(bid.lakehousePillarScores)).toHaveLength(7);
      expect(bid.riskAdjustedPriceUsd).toBeGreaterThan(0);
    }
    expect(checkpoint.rfp_normalization[0].id).toBe('SI-B');
    expect(checkpoint.rfp_normalization[2].recommendation).toBe('do not award without scope correction');
  });

  it('labels live retrieval as deferred pending governed upload', () => {
    const checkpoint = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, 'checkpoint.json'), 'utf8')) as {
      retrieval_connectivity: { status: string; rationale: string };
      patterns_added: number;
    };
    expect(checkpoint.patterns_added).toBe(0);
    expect(checkpoint.retrieval_connectivity.status).toBe('DEFERRED_PENDING_GOVERNED_UPLOAD');
    expect(checkpoint.retrieval_connectivity.rationale).toContain('governed admin loader');
    expect(fs.readFileSync(path.join(EVAL_DIR, 'SUMMARY.md'), 'utf8')).toContain(
      'deferred pending governed admin upload',
    );
  });
});

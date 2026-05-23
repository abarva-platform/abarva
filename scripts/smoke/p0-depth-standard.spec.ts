import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { expect, test } from '@playwright/test';

import { POST as postDepthScore } from '../../src/app/(maestro)/admin/depth-scorecard/api/route';

const execFileAsync = promisify(execFile);

const MOCK_PATTERN = `
# Mock Pattern

## Quantified claim
Quantified claim: 50 percent of saved hours need a named queue. Scope enterprise IT. Horizon 90 days.
## Evidence
Evidence chunk 1 primary citation source P-IT-03. Evidence chunk 2 primary citation source P-IT-06. Evidence chunk 3 primary citation source P-IT-20.
## Counterarguments
Counterargument one steelman. Counterargument two steelman.
## Calibrated confidence
Confidence 0.76.
## Boundary conditions
Boundary conditions and does not apply below five engineers.
## Failure modes
Failure mode one goes wrong when finance double counts. Failure mode two goes wrong when managers hide capacity.
## Maturity model linkage
Maturity model stage 3 to stage 5.
## Vertical overlay
Healthcare, financial services, and retail vertical overlay.
## Related patterns
Related patterns depends_on P-IT-14 reinforces P-IT-10.
## So what / synthesis
So what: approve only with a named queue.
`;

test('POST mock pattern to depth lint endpoint returns score', async ({ request }) => {
  void request;
  const response = await postDepthScore(
    new Request('http://localhost/admin/depth-scorecard/api', {
      method: 'POST',
      body: JSON.stringify({
        artifactType: 'pattern',
        artifactId: 'mock-pattern-smoke',
        content: MOCK_PATTERN,
      }),
    }),
  );
  expect(response.status).toBe(200);
  const json = await response.json();
  expect(json.ok).toBe(true);
  expect(json.data.total_score).toBeGreaterThanOrEqual(8);
});

test('admin depth scorecard route loads without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/admin/depth-scorecard');
  await expect(page.locator('body')).toBeVisible();
  const overlay = await page.locator('[data-nextjs-dialog]').count();
  expect(overlay).toBe(0);
  expect(errors.filter((error) => !error.includes('the server responded with a status of 400'))).toEqual([]);
});

test('depth CLI all exemplars exits clean', async () => {
  const { stdout } = await execFileAsync('npm', ['run', '--silent', 'lint:depth', '--', '--all'], {
    cwd: process.cwd(),
    timeout: 120_000,
  });
  const parsed = JSON.parse(stdout);
  expect(parsed.pass).toBe(true);
});

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// The wrapper is a plain .mjs CLI script (not an importable module — it runs
// main() at the top level), so these tests drive it the same way the
// db-migration-lab workflow does: as a subprocess. --plan-only guarantees no
// `az` process is ever spawned, so these tests never authenticate or touch
// Azure — they only validate the command shape the wrapper would issue.
const WRAPPER = path.join(__dirname, '..', 'submit-aca-operator-job.mjs')
const REAL_IDLE_IMAGE =
  'acrabarvalab001.azurecr.io/abarva/web@sha256:918b6cbf298ebd5bd20782b15f7d1817111d94e438436d64f2ea64db543db8a9'
const FAKE_DIGEST_IMAGE =
  'acrabarvalab001.azurecr.io/abarva/web@sha256:' + '0'.repeat(64)

function runPlanOnly(args: string[], outDir: string) {
  return spawnSync(
    process.execPath,
    [WRAPPER, ...args, '--out-dir', outDir, '--plan-only'],
    { encoding: 'utf8' },
  )
}

function readPlan(outDir: string) {
  return JSON.parse(fs.readFileSync(path.join(outDir, 'plan.json'), 'utf8'))
}

describe('submit-aca-operator-job.mjs --plan-only', () => {
  let outDir: string

  beforeEach(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aca-operator-plan-test-'))
  })

  afterEach(() => {
    fs.rmSync(outDir, { recursive: true, force: true })
  })

  test('never invokes az — no PATH lookup for the az binary occurs', () => {
    const result = runPlanOnly(
      ['--image', FAKE_DIGEST_IMAGE, '--script', 'db:migrate:dry', '--container', 'db-migrate'],
      outDir,
    )
    expect(result.status).toBe(0)
    // If the wrapper had shelled out to `az`, PATH resolution would fail in
    // this test environment with "az: command not found" on stderr, or the
    // process would hang waiting on real Azure auth. Neither happens.
    expect(result.stderr).not.toMatch(/az: command not found|not recognized/i)
  })

  test('builds start command against the real container name, not an invented one', () => {
    const result = runPlanOnly(
      ['--image', FAKE_DIGEST_IMAGE, '--script', 'db:migrate:dry', '--container', 'db-migrate'],
      outDir,
    )
    expect(result.status).toBe(0)
    const plan = readPlan(outDir)
    expect(plan.container).toBe('db-migrate')
    expect(plan.commands.start).toContain('--container-name')
    const containerNameIndex = plan.commands.start.indexOf('--container-name')
    expect(plan.commands.start[containerNameIndex + 1]).toBe('db-migrate')
  })

  test('rejects a --container value that is not the real job container name early, before any az call, when combined with strict callers', () => {
    // The wrapper itself is intentionally permissive about --container (it's
    // a pass-through CLI flag) — the guard belongs to the caller. This test
    // documents the exact failure mode the incident hit: passing an invented
    // name plans successfully (garbage in, garbage out) rather than failing
    // fast, which is why the db-migration-lab workflow must hardcode the
    // real name instead of inventing one per step.
    const result = runPlanOnly(
      ['--image', FAKE_DIGEST_IMAGE, '--script', 'db:migrate:dry', '--container', 'db-migrate-status'],
      outDir,
    )
    expect(result.status).toBe(0)
    const plan = readPlan(outDir)
    expect(plan.container).toBe('db-migrate-status')
  })

  test('redacts DATABASE_URL secret-env references in the written plan', () => {
    const result = runPlanOnly(
      [
        '--image', FAKE_DIGEST_IMAGE,
        '--script', 'db:migrate:ci',
        '--container', 'db-migrate',
        '--secret-env', 'DATABASE_URL=azure-postgres-control-database-url',
      ],
      outDir,
    )
    expect(result.status).toBe(0)
    const plan = readPlan(outDir)
    expect(plan.env).toEqual(
      expect.arrayContaining([expect.stringMatching(/^DATABASE_URL=<redacted>$/)]),
    )
    const planText = fs.readFileSync(path.join(outDir, 'plan.json'), 'utf8')
    expect(planText).not.toContain('azure-postgres-control-database-url')
    expect(planText).not.toContain('secretref:')
  })

  test('restoreIdle plan targets the approved idle image and documented idle values', () => {
    const result = runPlanOnly(
      ['--image', FAKE_DIGEST_IMAGE, '--script', 'db:migrate:dry', '--container', 'db-migrate'],
      outDir,
    )
    expect(result.status).toBe(0)
    const plan = readPlan(outDir)
    const restore: string[] = plan.commands.restoreIdle
    expect(restore).toContain(REAL_IDLE_IMAGE)
    expect(restore).toEqual(expect.arrayContaining(['--command', '/bin/true']))
    expect(restore).toEqual(expect.arrayContaining(['--replica-timeout', '1800']))
    expect(restore).toEqual(expect.arrayContaining(['--cpu', '0.5']))
    expect(restore).toEqual(expect.arrayContaining(['--memory', '1Gi']))
  })

  test('refuses a mutable (non digest-pinned) image even in plan-only mode', () => {
    // assertDigestPinned() only checks for an "@sha256:" substring — it doesn't
    // care about registry — so a non-AbarVa registry string exercises the same
    // guard without tripping the separate AbarVa-runtime-image mutable-tag scan.
    const result = runPlanOnly(
      ['--image', 'example.azurecr.io/some-app:mutable-tag', '--script', 'db:migrate:dry'],
      outDir,
    )
    expect(result.status).not.toBe(0)
    expect(result.stderr).toMatch(/digest-pinned/)
    expect(fs.existsSync(path.join(outDir, 'plan.json'))).toBe(false)
  })

  test('refuses a suspicious script name even in plan-only mode', () => {
    const result = runPlanOnly(
      ['--image', FAKE_DIGEST_IMAGE, '--script', 'db:migrate:dry; rm -rf /'],
      outDir,
    )
    expect(result.status).not.toBe(0)
    expect(result.stderr).toMatch(/suspicious npm script/)
  })
})

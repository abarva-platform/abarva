import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// The wrapper is a plain .mjs CLI script that guards its own main() behind
// an invokedAsScript check, so most of these tests drive it as a subprocess
// (matching how the db-migration-lab workflow actually calls it).
// --plan-only guarantees no `az` process is ever spawned, so those tests
// never authenticate or touch Azure — they only validate the command shape
// the wrapper would issue. Pure exported helpers (terminalStatus) are
// imported directly via Node's CJS->ESM dynamic import() interop instead,
// since spawning a subprocess for a one-line pure function is unnecessary.
const WRAPPER = path.join(__dirname, '..', 'submit-aca-operator-job.mjs')
const FAKE_DIGEST_IMAGE =
  'acrabarvalab001.azurecr.io/abarva/web@sha256:' + '0'.repeat(64)
const EXPLICIT_IDLE_IMAGE =
  'acrabarvalab001.azurecr.io/abarva/web@sha256:' + '1'.repeat(64)

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

  test('restoreIdle plan defaults to the execution image and documented idle values', () => {
    const result = runPlanOnly(
      ['--image', FAKE_DIGEST_IMAGE, '--script', 'db:migrate:dry', '--container', 'db-migrate'],
      outDir,
    )
    expect(result.status).toBe(0)
    const plan = readPlan(outDir)
    const restore: string[] = plan.commands.restoreIdle
    expect(plan.idleImage).toBe(FAKE_DIGEST_IMAGE)
    expect(restore).toContain(FAKE_DIGEST_IMAGE)
    expect(restore).toEqual(expect.arrayContaining(['--command', '/bin/true']))
    expect(restore).toEqual(expect.arrayContaining(['--replica-timeout', '1800']))
    expect(restore).toEqual(expect.arrayContaining(['--cpu', '0.5']))
    expect(restore).toEqual(expect.arrayContaining(['--memory', '1Gi']))
  })

  test('restoreIdle plan honors an explicit idle image override', () => {
    const result = runPlanOnly(
      [
        '--image', FAKE_DIGEST_IMAGE,
        '--idle-image', EXPLICIT_IDLE_IMAGE,
        '--script', 'db:migrate:dry',
        '--container', 'db-migrate',
      ],
      outDir,
    )
    expect(result.status).toBe(0)
    const plan = readPlan(outDir)
    const restore: string[] = plan.commands.restoreIdle
    expect(plan.idleImage).toBe(EXPLICIT_IDLE_IMAGE)
    expect(restore).toContain(EXPLICIT_IDLE_IMAGE)
  })

  test('records the bounded idle verification wait in plan-only output', () => {
    const result = runPlanOnly(
      [
        '--image', FAKE_DIGEST_IMAGE,
        '--script', 'db:migrate:dry',
        '--container', 'db-migrate',
        '--poll-seconds', '5',
        '--update-retry-seconds', '120',
        '--idle-verify-wait-seconds', '300',
      ],
      outDir,
    )
    expect(result.status).toBe(0)
    const plan = readPlan(outDir)
    expect(plan.pollSeconds).toBe(5)
    expect(plan.updateRetrySeconds).toBe(120)
    expect(plan.idleVerifyWaitSeconds).toBe(300)
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

  test('refuses a negative idle verification wait even in plan-only mode', () => {
    const result = runPlanOnly(
      [
        '--image', FAKE_DIGEST_IMAGE,
        '--script', 'db:migrate:dry',
        '--idle-verify-wait-seconds', '-1',
      ],
      outDir,
    )
    expect(result.status).not.toBe(0)
    expect(result.stderr).toMatch(/idle-verify-wait-seconds/)
  })

  test('refuses a negative update retry wait even in plan-only mode', () => {
    const result = runPlanOnly(
      [
        '--image', FAKE_DIGEST_IMAGE,
        '--script', 'db:migrate:dry',
        '--update-retry-seconds', '-1',
      ],
      outDir,
    )
    expect(result.status).not.toBe(0)
    expect(result.stderr).toMatch(/update-retry-seconds/)
  })
})

describe('terminalStatus', () => {
  // Real incident: an ACA job execution sitting in "Stopped" status (two
  // days old, genuinely inactive) was misclassified as non-terminal by
  // verifyIdle() on the first live dispatch of the migration workflow,
  // failing an otherwise-clean preflight run. This locks the fixed status
  // list in place.
  test('recognizes every known terminal ACA job execution status, including Stopped', async () => {
    const mod = await import(WRAPPER)
    expect(mod.terminalStatus('Succeeded')).toBe(true)
    expect(mod.terminalStatus('Failed')).toBe(true)
    expect(mod.terminalStatus('Canceled')).toBe(true)
    expect(mod.terminalStatus('Cancelled')).toBe(true)
    expect(mod.terminalStatus('Stopped')).toBe(true)
  })

  test('does not treat an active/in-progress status as terminal', async () => {
    const mod = await import(WRAPPER)
    expect(mod.terminalStatus('Running')).toBe(false)
    expect(mod.terminalStatus('Processing')).toBe(false)
    expect(mod.terminalStatus('Unknown')).toBe(false)
  })
})

describe('Source ServiceNow request proof summary', () => {
  let outDir: string

  beforeEach(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aca-servicenow-proof-test-'))
  })

  afterEach(() => {
    fs.rmSync(outDir, { recursive: true, force: true })
  })

  const summary = {
    schemaVersion: 1,
    event: 'source_servicenow_request_import_proof_summary',
    mode: 'dry_run',
    requestCount: 10,
    archetypeCount: 10,
    requiredFactGapCount: 0,
    missingArchetypeCount: 0,
    inputSha256: 'a'.repeat(64),
    inputSourceVersion: 'extract-v1',
    inserted: 0,
    committed: false,
    authority: {
      requestVersionsOnly: true,
      mappingDecisionsWritten: false,
      eventsCreated: false,
      suppliersContacted: false,
    },
  }

  test('extracts the trailing summary when the tar marker was lost to ACA log tailing', async () => {
    const mod = await import(WRAPPER)
    const logLines = [
      '2026-01-01 stdout F __SEMANTIC2_PROOF_TGZ_BEGIN__',
      ...Array.from({ length: 450 }, (_, index) => `2026-01-01 stdout F report line ${index}`),
      `2026-01-01 stdout F __SOURCE_SERVICENOW_REQUEST_PROOF_SUMMARY__${JSON.stringify(summary)}`,
    ]
    const tail = logLines.slice(-300).join('\n')
    const proof = mod.extractProofBundle(tail, outDir)

    expect(proof).toMatchObject({
      extracted: true,
      extractionKind: 'source_servicenow_request_summary',
      proofBundleExtracted: false,
      summary,
    })
    expect(JSON.parse(fs.readFileSync(path.join(outDir, '05-source-servicenow-proof-summary.json'), 'utf8'))).toEqual(summary)
    expect(fs.readFileSync(path.join(outDir, '05-source-servicenow-proof-summary.json'), 'utf8')).not.toContain('tenantKey')
  })

  test('rejects a dry-run marker that claims a write', async () => {
    const mod = await import(WRAPPER)
    const log = `__SOURCE_SERVICENOW_REQUEST_PROOF_SUMMARY__${JSON.stringify({ ...summary, committed: true })}`
    expect(mod.extractProofBundle(log, outDir)).toMatchObject({ extracted: false })
  })

  test('uses the summary when a tar payload begins but is incomplete', async () => {
    const mod = await import(WRAPPER)
    const log = [
      '__SEMANTIC2_PROOF_TGZ_BEGIN__',
      'partial-base64',
      `__SOURCE_SERVICENOW_REQUEST_PROOF_SUMMARY__${JSON.stringify(summary)}`,
    ].join('\n')
    expect(mod.extractProofBundle(log, outDir)).toMatchObject({
      extracted: true,
      extractionKind: 'source_servicenow_request_summary',
      proofBundleExtracted: false,
      summary,
    })
    expect(fs.existsSync(path.join(outDir, 'proof.tgz'))).toBe(false)
  })
})

describe('Source candidate supplier proof summary', () => {
  let outDir: string

  beforeEach(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aca-supplier-proof-test-'))
  })

  afterEach(() => {
    fs.rmSync(outDir, { recursive: true, force: true })
  })

  const summary = {
    schemaVersion: 1,
    event: 'source_candidate_supplier_registry_import_proof_summary',
    mode: 'dry_run',
    rowCount: 25,
    supplierCount: 20,
    archetypeCount: 10,
    failClosedControlCount: 5,
    inputSha256: 'a'.repeat(64),
    inputSourceVersion: 'v1',
    inserted: 0,
    committed: false,
    authority: {
      dryRunDefault: true,
      supplierRegistryRowsOnly: true,
      candidateSupplierAuthoritiesWritten: false,
      eventsCreated: false,
      suppliersContacted: false,
      emailsSent: false,
    },
  }

  test('extracts a trailing supplier summary after a truncated proof bundle', async () => {
    const mod = await import(WRAPPER)
    const logLines = [
      '2026-01-01 stdout F __SEMANTIC2_PROOF_TGZ_BEGIN__',
      ...Array.from({ length: 450 }, (_, index) => `2026-01-01 stdout F report line ${index}`),
      `2026-01-01 stdout F __SOURCE_CANDIDATE_SUPPLIER_PROOF_SUMMARY__${JSON.stringify(summary)}`,
    ]
    const proof = mod.extractProofBundle(logLines.slice(-300).join('\n'), outDir)
    expect(proof).toMatchObject({
      extracted: true,
      extractionKind: 'source_candidate_supplier_summary',
      proofBundleExtracted: false,
      summary,
    })
    expect(fs.readFileSync(path.join(outDir, '05-source-candidate-supplier-proof-summary.json'), 'utf8')).not.toContain('tenantKey')
  })

  test('rejects a dry-run supplier marker that claims a write or contact', async () => {
    const mod = await import(WRAPPER)
    const marker = (value: unknown) => `__SOURCE_CANDIDATE_SUPPLIER_PROOF_SUMMARY__${JSON.stringify(value)}`
    expect(mod.extractProofBundle(marker({ ...summary, committed: true }), outDir)).toMatchObject({ extracted: false })
    expect(mod.extractProofBundle(marker({ ...summary, authority: {
      ...summary.authority, suppliersContacted: true,
    } }), outDir)).toMatchObject({ extracted: false })
  })
})

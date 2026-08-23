#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(__dirname, '../../..')
const runner = path.join(repo, 'scripts/ecl/load_ecl_commercial_family.py')
const validator = path.join(repo, 'scripts/ecl/validate_ecl_commercial_local_load_runner.py')
const runContractPath = path.join(
  repo,
  'reports/ecl-commercial-lab-load-preflight-2026-08-23/ecl_commercial_lab_load_run_contract.json',
)
const gateTemplatePath = path.join(
  repo,
  'reports/ecl-commercial-lab-load-preflight-2026-08-23/ecl_commercial_lab_load_gate_manifest.template.json',
)

function runPython(args, extraEnv = {}) {
  return spawnSync('python3', args, {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      ECL_COMMERCIAL_TARGET_DATABASE_URL: '',
      ECL_COMMERCIAL_TARGET_DB_CLASSIFICATION: '',
      ECL_COMMERCIAL_GATE_MANIFEST_B64: '',
      ECL_COMMERCIAL_GATE_MANIFEST_JSON: '',
      ECL_COMMERCIAL_EMIT_PROOF_BUNDLE: '',
      ...extraEnv,
    },
  })
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function approvedGate(mutate = (gate) => gate) {
  const gate = readJson(gateTemplatePath)
  gate.approved = true
  gate.approval_file_purpose = 'local_disposable_operator_gate_manifest'
  gate.operator_approval_reference = 'local-test-only'
  gate.acknowledgements = Object.fromEntries(
    Object.keys(gate.acknowledgements).map((key) => [key, true]),
  )
  return mutate(gate)
}

function expectRefusal(name, args, expectedPattern) {
  const outDir = path.join(tmpRoot, name)
  const result = runPython([runner, ...args, '--out-dir', outDir])
  assert.notEqual(result.status, 0, `${name} unexpectedly succeeded\n${result.stdout}\n${result.stderr}`)
  const refusal = readJson(path.join(outDir, 'ecl_commercial_local_load_refusal.json'))
  assert.equal(refusal.actual_azure_execution, false)
  assert.equal(refusal.actual_shared_data_plane_mutation, false)
  assert(
    refusal.issues.some((issue) => expectedPattern.test(issue)),
    `${name} refusal issues did not include ${expectedPattern}: ${refusal.issues.join(', ')}`,
  )
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ecl-commercial-family-load-test-'))
try {
  const mockDb = path.join(tmpRoot, 'commercial-load-db.json')
  const mockDbFromEnvGate = path.join(tmpRoot, 'commercial-load-db-env-gate.json')
  const goodGatePath = path.join(tmpRoot, 'good-gate.json')
  const goodGate = approvedGate()
  writeJson(goodGatePath, goodGate)
  const goodGateB64 = Buffer.from(JSON.stringify(goodGate), 'utf8').toString('base64')

  expectRefusal(
    'missing-gate',
    [
      '--target-db-url',
      `json://${mockDb}`,
      '--target-db-classification',
      'local_disposable',
    ],
    /gate_contract_missing/,
  )

  expectRefusal(
    'target-not-marked',
    ['--gate-manifest', goodGatePath, '--target-db-url', `json://${mockDb}`],
    /target_database_classification_missing/,
  )

  const wrongTenantGate = path.join(tmpRoot, 'wrong-tenant-gate.json')
  writeJson(wrongTenantGate, approvedGate((gate) => {
    gate.tenant_scope = 'wrong-tenant-scope'
    return gate
  }))
  expectRefusal(
    'wrong-tenant',
    [
      '--gate-manifest',
      wrongTenantGate,
      '--target-db-url',
      `json://${mockDb}`,
      '--target-db-classification',
      'local_disposable',
    ],
    /gate_tenant_scope_mismatch/,
  )

  const wrongFamilyGate = path.join(tmpRoot, 'wrong-family-gate.json')
  writeJson(wrongFamilyGate, approvedGate((gate) => {
    gate.family = 'wrong_family'
    return gate
  }))
  expectRefusal(
    'wrong-family',
    [
      '--gate-manifest',
      wrongFamilyGate,
      '--target-db-url',
      `json://${mockDb}`,
      '--target-db-classification',
      'local_disposable',
    ],
    /gate_family_mismatch|gate_family_not_commercial/,
  )

  const changedHashGate = path.join(tmpRoot, 'changed-hash-gate.json')
  writeJson(changedHashGate, approvedGate((gate) => {
    const firstHashKey = Object.keys(gate.expected_local_proof_hashes)[0]
    gate.expected_local_proof_hashes[firstHashKey] = '0'.repeat(64)
    return gate
  }))
  expectRefusal(
    'changed-local-proof-hash',
    [
      '--gate-manifest',
      changedHashGate,
      '--target-db-url',
      `json://${mockDb}`,
      '--target-db-classification',
      'local_disposable',
    ],
    /gate_expected_local_proof_hashes_mismatch|gate_proof_hash_mismatch/,
  )

  const missingIdempotencyRunContract = path.join(tmpRoot, 'missing-idempotency-run-contract.json')
  writeJson(missingIdempotencyRunContract, (() => {
    const contract = readJson(runContractPath)
    delete contract.idempotency_key
    return contract
  })())
  expectRefusal(
    'missing-idempotency',
    [
      '--run-contract',
      missingIdempotencyRunContract,
      '--gate-manifest',
      goodGatePath,
      '--target-db-url',
      `json://${mockDb}`,
      '--target-db-classification',
      'local_disposable',
    ],
    /idempotency_key_missing/,
  )

  const missingReadbackRunContract = path.join(tmpRoot, 'missing-readback-run-contract.json')
  writeJson(missingReadbackRunContract, (() => {
    const contract = readJson(runContractPath)
    delete contract.readback_contract
    return contract
  })())
  expectRefusal(
    'missing-readback-contract',
    [
      '--run-contract',
      missingReadbackRunContract,
      '--gate-manifest',
      goodGatePath,
      '--target-db-url',
      `json://${mockDb}`,
      '--target-db-classification',
      'local_disposable',
    ],
    /readback_contract_missing/,
  )

  const successOutDir = path.join(tmpRoot, 'success')
  const successArgs = [
    runner,
    '--gate-manifest',
    goodGatePath,
    '--target-db-url',
    `json://${mockDb}`,
    '--target-db-classification',
    'local_disposable',
    '--out-dir',
    successOutDir,
  ]
  const first = runPython(successArgs)
  assert.equal(first.status, 0, first.stderr || first.stdout)
  const second = runPython(successArgs)
  assert.equal(second.status, 0, second.stderr || second.stdout)

  const db = readJson(mockDb)
  const contract = readJson(runContractPath)
  const runRecord = db.load_runs[contract.idempotency_key]
  assert.equal(runRecord.rerun_count, 2)
  assert.equal(Object.keys(db.load_runs).length, 1)
  assert.equal(db.commercial_counts.length, runRecord.row_counts.commercial_metric_rows)
  assert.equal(db.gap_records.length, runRecord.row_counts.gap_record_rows)
  assert(db.gap_records.length > 0)
  assert(db.gap_records.every((row) => row.numeric_value === null))

  const validate = runPython([validator, '--out-dir', successOutDir])
  assert.equal(validate.status, 0, validate.stderr || validate.stdout)

  const envGateOutDir = path.join(tmpRoot, 'success-env-gate')
  const envGate = runPython(
    [
      runner,
      '--target-db-url',
      `json://${mockDbFromEnvGate}`,
      '--target-db-classification',
      'local_disposable',
      '--emit-proof-bundle',
      '--out-dir',
      envGateOutDir,
    ],
    { ECL_COMMERCIAL_GATE_MANIFEST_B64: goodGateB64 },
  )
  assert.equal(envGate.status, 0, envGate.stderr || envGate.stdout)
  assert(envGate.stdout.includes('__SEMANTIC2_PROOF_TGZ_BEGIN__'))
  assert(envGate.stdout.includes('__SEMANTIC2_PROOF_TGZ_END__'))
  const envGateStatus = readJson(path.join(envGateOutDir, 'ecl_commercial_local_load_status.json'))
  assert.equal(envGateStatus.accepted, true)
  assert.equal(envGateStatus.actual_azure_execution, false)
  assert.equal(envGateStatus.actual_shared_data_plane_mutation, false)

  const badGateEnv = runPython(
    [
      runner,
      '--target-db-url',
      `json://${mockDbFromEnvGate}`,
      '--target-db-classification',
      'local_disposable',
      '--out-dir',
      path.join(tmpRoot, 'bad-env-gate'),
    ],
    { ECL_COMMERCIAL_GATE_MANIFEST_B64: 'not-base64' },
  )
  assert.notEqual(badGateEnv.status, 0)
  assert.match(badGateEnv.stderr, /gate_contract_env_b64_invalid/)
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
}

console.log('ECL commercial family local load tests passed')

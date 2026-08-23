#!/usr/bin/env node
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(__dirname, '../../..')
const preflightRunner = path.join(repo, 'scripts/ecl/run_ecl_commercial_lab_load_preflight.py')
const runner = path.join(repo, 'scripts/ecl/run_ecl_commercial_family_load.py')
const validator = path.join(repo, 'scripts/ecl/validate_ecl_commercial_family_load.py')

function runPython(args, options = {}) {
  return spawnSync('python3', args, {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    timeout: options.timeout ?? 120000,
  })
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? repo,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: options.stdio ?? 'pipe',
  })
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function approvedGateFromTemplate(template, mutate = (gate) => gate) {
  const gate = JSON.parse(JSON.stringify(template))
  gate.approved = true
  gate.approval_file_purpose = 'operator_gate_manifest'
  gate.operator_approval_reference = 'local-disposable-test-approval'
  gate.acknowledgements = Object.fromEntries(
    Object.keys(gate.acknowledgements).map((key) => [key, true]),
  )
  return mutate(gate)
}

function expectRefusal(name, args, env, expectedPattern) {
  const outDir = path.join(tmpRoot, name)
  fs.mkdirSync(outDir, { recursive: true })
  const result = runPython([...args, '--out-dir', outDir], { env })
  assert.notEqual(result.status, 0, `${name} unexpectedly succeeded\n${result.stdout}\n${result.stderr}`)
  assert.match(result.stderr + result.stdout, /Refused:/, `${name} did not print refusal`)
  const refusal = readJson(path.join(outDir, 'ecl_commercial_family_load_refusal.json'))
  assert.equal(refusal.actual_azure_execution, false)
  assert.equal(refusal.actual_database_write, false)
  assert(
    refusal.issues.some((issue) => expectedPattern.test(issue)),
    `${name} refusal issues did not include ${expectedPattern}: ${refusal.issues.join(', ')}`,
  )
}

function freePort() {
  const script = "import socket;s=socket.socket();s.bind(('127.0.0.1',0));print(s.getsockname()[1]);s.close()"
  return run('python3', ['-c', script]).trim()
}

function postgresEnv() {
  return {
    ...process.env,
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    LC_COLLATE: 'C.UTF-8',
    LC_CTYPE: 'C.UTF-8',
    LC_MESSAGES: 'C.UTF-8',
    LC_MONETARY: 'C.UTF-8',
    LC_NUMERIC: 'C.UTF-8',
    LC_TIME: 'C.UTF-8',
    LOGNAME: process.env.LOGNAME || process.env.USER || 'postgres',
    SHELL: process.env.SHELL || '/bin/sh',
    USER: process.env.USER || 'postgres',
    __CF_USER_TEXT_ENCODING: process.env.__CF_USER_TEXT_ENCODING || '0x1F6:0x0:0x0',
  }
}

function startPostgres(workDir) {
  const dataDir = path.join(workDir, 'data')
  const socketDir = path.join(workDir, 'socket')
  fs.mkdirSync(socketDir, { recursive: true })
  const port = freePort()
  const env = postgresEnv()
  run('initdb', ['-D', dataDir, '-A', 'trust', '-U', 'postgres', '--encoding=UTF8', '--locale=C.UTF-8'], { env })
  run(
    'pg_ctl',
    ['-D', dataDir, '-w', '-t', '20', '-o', `-p ${port} -k ${socketDir}`, '-l', path.join(workDir, 'postgres.log'), 'start'],
    { env },
  )
  run('createdb', ['-h', socketDir, '-p', port, '-U', 'postgres', 'ecl_local_load_test'], { env })
  const url = `postgresql://postgres@localhost:${port}/ecl_local_load_test?host=${encodeURIComponent(socketDir)}&sslmode=disable`
  return {
    dataDir,
    env,
    port,
    socketDir,
    stop() {
      try {
        run('pg_ctl', ['-D', dataDir, 'stop', '-m', 'fast'], { env })
      } catch {
        // Best-effort cleanup for a disposable test database.
      }
    },
    url,
  }
}

const tmpRoot = fs.mkdtempSync('/tmp/ecl-commercial-family-load-test-')
let postgres

try {
  const preflightDir = path.join(tmpRoot, 'preflight')
  const preflight = runPython([preflightRunner, '--out-dir', preflightDir])
  assert.equal(preflight.status, 0, preflight.stderr || preflight.stdout)

  const runContractPath = path.join(preflightDir, 'ecl_commercial_lab_load_run_contract.json')
  const readbackContractPath = path.join(preflightDir, 'ecl_commercial_lab_load_readback_contract.json')
  const gateTemplatePath = path.join(preflightDir, 'ecl_commercial_lab_load_gate_manifest.template.json')
  const template = readJson(gateTemplatePath)

  const dryRunDir = path.join(tmpRoot, 'dry-run')
  const dryRun = runPython([
    runner,
    '--mode',
    'dry-run',
    '--run-contract',
    runContractPath,
    '--readback-contract',
    readbackContractPath,
    '--out-dir',
    dryRunDir,
  ])
  assert.equal(dryRun.status, 0, dryRun.stderr || dryRun.stdout)
  const validateDryRun = runPython([validator, '--mode', 'dry-run', '--out-dir', dryRunDir])
  assert.equal(validateDryRun.status, 0, validateDryRun.stderr || validateDryRun.stdout)

  expectRefusal(
    'missing-gate',
    [runner, '--mode', 'execute', '--run-contract', runContractPath, '--readback-contract', readbackContractPath],
    {},
    /missing_gate_manifest/,
  )

  const wrongTenantGate = path.join(tmpRoot, 'wrong-tenant-gate.json')
  writeJson(
    wrongTenantGate,
    approvedGateFromTemplate(template, (gate) => {
      gate.tenant_scope = 'wrong-tenant'
      return gate
    }),
  )
  expectRefusal(
    'wrong-tenant',
    [
      runner,
      '--mode',
      'execute',
      '--run-contract',
      runContractPath,
      '--readback-contract',
      readbackContractPath,
      '--gate-manifest',
      wrongTenantGate,
    ],
    {},
    /gate_tenant_scope_mismatch/,
  )

  const badHashGate = path.join(tmpRoot, 'bad-hash-gate.json')
  const firstHashKey = Object.keys(template.expected_local_proof_hashes)[0]
  writeJson(
    badHashGate,
    approvedGateFromTemplate(template, (gate) => {
      gate.expected_local_proof_hashes[firstHashKey] = '0'.repeat(64)
      return gate
    }),
  )
  expectRefusal(
    'hash-mismatch',
    [
      runner,
      '--mode',
      'execute',
      '--run-contract',
      runContractPath,
      '--readback-contract',
      readbackContractPath,
      '--gate-manifest',
      badHashGate,
    ],
    {},
    /gate_expected_local_proof_hashes_mismatch/,
  )

  const missingIdempotencyGate = path.join(tmpRoot, 'missing-idempotency-gate.json')
  writeJson(
    missingIdempotencyGate,
    approvedGateFromTemplate(template, (gate) => {
      gate.idempotency_key = ''
      return gate
    }),
  )
  expectRefusal(
    'missing-idempotency',
    [
      runner,
      '--mode',
      'execute',
      '--run-contract',
      runContractPath,
      '--readback-contract',
      readbackContractPath,
      '--gate-manifest',
      missingIdempotencyGate,
    ],
    {},
    /gate_idempotency_key_mismatch/,
  )

  const missingReadbackGate = path.join(tmpRoot, 'missing-readback-gate.json')
  writeJson(
    missingReadbackGate,
    approvedGateFromTemplate(template, (gate) => {
      delete gate.readback_contract
      return gate
    }),
  )
  expectRefusal(
    'missing-readback',
    [
      runner,
      '--mode',
      'execute',
      '--run-contract',
      runContractPath,
      '--readback-contract',
      readbackContractPath,
      '--gate-manifest',
      missingReadbackGate,
    ],
    {},
    /gate_readback_contract_missing/,
  )

  const approvedGatePath = path.join(tmpRoot, 'approved-gate.json')
  writeJson(approvedGatePath, approvedGateFromTemplate(template))
  expectRefusal(
    'unmarked-target',
    [
      runner,
      '--mode',
      'execute',
      '--run-contract',
      runContractPath,
      '--readback-contract',
      readbackContractPath,
      '--gate-manifest',
      approvedGatePath,
    ],
    {
      ECL_COMMERCIAL_TARGET_DATABASE_URL: 'postgresql://postgres@localhost:5432/unsafe',
    },
    /target_database_write_not_explicitly_allowed/,
  )

  postgres = startPostgres(path.join(tmpRoot, 'postgres'))
  const executeEnv = {
    ECL_COMMERCIAL_TARGET_DATABASE_URL: postgres.url,
    ECL_COMMERCIAL_TARGET_ENV: 'local_disposable',
    ECL_COMMERCIAL_TARGET_SAFETY_MARKER: 'ECL_LOCAL_DISPOSABLE_DB',
    ECL_COMMERCIAL_ALLOW_DATABASE_WRITE: 'true',
  }
  const executeDir = path.join(tmpRoot, 'execute')
  const executeArgs = [
    runner,
    '--mode',
    'execute',
    '--run-contract',
    runContractPath,
    '--readback-contract',
    readbackContractPath,
    '--gate-manifest',
    approvedGatePath,
    '--out-dir',
    executeDir,
  ]
  const firstExecute = runPython(executeArgs, { env: executeEnv, timeout: 180000 })
  assert.equal(firstExecute.status, 0, firstExecute.stderr || firstExecute.stdout)
  const firstReadback = readJson(path.join(executeDir, 'ecl_commercial_family_load_readback.json'))
  assert.equal(firstReadback.accepted, true)
  assert.equal(firstReadback.idempotent_run_count, 1)
  assert.equal(firstReadback.parity.contracts.actual, 5)
  assert(firstReadback.quality.gap_flagged_contract_rows > 0)
  assert(firstReadback.quality.gated_value_levers_with_blocked_value > 0)
  assert.equal(firstReadback.quality.unknown_zero_measure_rows, 0)

  const secondExecute = runPython(executeArgs, { env: executeEnv, timeout: 180000 })
  assert.equal(secondExecute.status, 0, secondExecute.stderr || secondExecute.stdout)
  const secondReadback = readJson(path.join(executeDir, 'ecl_commercial_family_load_readback.json'))
  assert.equal(secondReadback.accepted, true)
  assert.equal(secondReadback.idempotent_run_count, 2)
  assert.deepEqual(secondReadback.actual_counts, firstReadback.actual_counts)

  const validateExecute = runPython([validator, '--mode', 'execute', '--out-dir', executeDir])
  assert.equal(validateExecute.status, 0, validateExecute.stderr || validateExecute.stdout)
} finally {
  if (postgres) postgres.stop()
  fs.rmSync(tmpRoot, { recursive: true, force: true })
}

console.log('ECL commercial family load tests passed')

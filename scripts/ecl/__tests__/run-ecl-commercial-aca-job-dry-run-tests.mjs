#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(__dirname, '../../..')
const runner = path.join(repo, 'scripts/ecl/run_ecl_commercial_aca_job_dry_run.py')
const validator = path.join(repo, 'scripts/ecl/validate_ecl_commercial_aca_job_dry_run.py')

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      ECL_COMMERCIAL_IMAGE: '',
      ECL_COMMERCIAL_TARGET_DATA_PLANE: '',
      DATABASE_URL: '',
      AZURE_STORAGE_CONNECTION_STRING: '',
    },
    ...options,
  })
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecl-commercial-aca-dry-run-test-'))
try {
  const dryRun = run('python3', [runner, '--out-dir', outDir])
  assert.equal(dryRun.status, 0, dryRun.stderr || dryRun.stdout)

  const validate = run('python3', [validator, '--out-dir', outDir])
  assert.equal(validate.status, 0, validate.stderr || validate.stdout)

  const jobSpec = readJson(path.join(outDir, 'ecl_commercial_aca_job_spec.json'))
  assert.equal(jobSpec.actual_azure_execution, false)
  assert.equal(jobSpec.dry_run_only, true)
  assert.deepEqual(jobSpec.candidate_wrapper_command.slice(0, 3), ['npm', 'run', 'ops:aca-job'])
  assert(jobSpec.candidate_wrapper_command.includes('--plan-only'))
  assert(!jobSpec.candidate_wrapper_command.includes('az'))

  const envValidation = readJson(path.join(outDir, 'ecl_commercial_aca_env_binding_validation.json'))
  assert.equal(envValidation.accepted_for_dry_run, true)
  assert.equal(envValidation.execution_eligible, false)
  assert(envValidation.missing_for_execution.includes('ECL_COMMERCIAL_IMAGE'))
  assert(envValidation.missing_for_execution.includes('DATABASE_URL'))

  const executeOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecl-commercial-aca-execute-refusal-test-'))
  const execute = run('python3', [runner, '--mode', 'execute', '--out-dir', executeOutDir])
  assert.notEqual(execute.status, 0)
  assert.match(execute.stderr + execute.stdout, /Refused: execute mode is gated out/)
  const refusal = readJson(path.join(executeOutDir, 'ecl_commercial_aca_execution_refusal.json'))
  assert.equal(refusal.actual_azure_execution, false)
  assert.equal(refusal.accepted, false)
} finally {
  fs.rmSync(outDir, { recursive: true, force: true })
}

console.log('ECL commercial ACA dry-run scaffold tests passed')

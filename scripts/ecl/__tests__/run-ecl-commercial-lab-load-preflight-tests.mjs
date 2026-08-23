#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(__dirname, '../../..')
const runner = path.join(repo, 'scripts/ecl/run_ecl_commercial_lab_load_preflight.py')
const validator = path.join(repo, 'scripts/ecl/validate_ecl_commercial_lab_load_preflight.py')

function runPython(args) {
  return spawnSync('python3', args, {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      ECL_COMMERCIAL_IMAGE: '',
      ECL_COMMERCIAL_TARGET_DATA_PLANE: '',
      DATABASE_URL: '',
      AZURE_STORAGE_CONNECTION_STRING: '',
    },
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
  gate.acknowledgements = Object.fromEntries(
    Object.keys(gate.acknowledgements).map((key) => [key, true]),
  )
  return mutate(gate)
}

function expectRefusal(name, gate, expectedPattern) {
  const outDir = path.join(tmpRoot, name)
  fs.mkdirSync(outDir, { recursive: true })
  const gatePath = path.join(outDir, 'gate.json')
  if (gate) writeJson(gatePath, gate)
  const args = [runner, '--mode', 'execute', '--out-dir', outDir]
  if (gate) args.push('--gate-manifest', gatePath)
  const result = runPython(args)
  assert.notEqual(result.status, 0, `${name} unexpectedly succeeded\n${result.stdout}\n${result.stderr}`)
  assert.match(result.stderr + result.stdout, /Refused: execute mode requires a matching explicit gate manifest/)
  const refusal = readJson(path.join(outDir, 'ecl_commercial_lab_load_refusal.json'))
  assert.equal(refusal.actual_azure_execution, false)
  assert(refusal.issues.some((issue) => expectedPattern.test(issue)), `${name} refusal issues did not include ${expectedPattern}: ${refusal.issues.join(', ')}`)
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ecl-commercial-lab-load-preflight-test-'))
try {
  const dryRunDir = path.join(tmpRoot, 'dry-run')
  const dryRun = runPython([runner, '--out-dir', dryRunDir])
  assert.equal(dryRun.status, 0, dryRun.stderr || dryRun.stdout)

  const validate = runPython([validator, '--out-dir', dryRunDir])
  assert.equal(validate.status, 0, validate.stderr || validate.stdout)

  const commandPlan = readJson(path.join(dryRunDir, 'ecl_commercial_lab_load_command_plan.json'))
  assert.equal(commandPlan.actual_azure_execution, false)
  assert.equal(commandPlan.az_invoked, false)
  assert.equal(commandPlan.command_was_executed, false)
  assert.deepEqual(commandPlan.dry_run_selected_command.slice(0, 3), ['npm', 'run', 'ops:aca-job'])
  assert(commandPlan.dry_run_selected_command.includes('--plan-only'))
  assert(!commandPlan.dry_run_selected_command.includes('az'))

  const template = readJson(path.join(dryRunDir, 'ecl_commercial_lab_load_gate_manifest.template.json'))

  expectRefusal('missing-gate', null, /missing_gate_manifest/)

  expectRefusal(
    'wrong-tenant',
    approvedGateFromTemplate(template, (gate) => {
      gate.tenant_scope = 'wrong-tenant-scope'
      return gate
    }),
    /gate_tenant_scope_mismatch/,
  )

  const firstHashKey = Object.keys(template.expected_local_proof_hashes)[0]
  expectRefusal(
    'missing-local-proof-hash',
    approvedGateFromTemplate(template, (gate) => {
      delete gate.expected_local_proof_hashes[firstHashKey]
      return gate
    }),
    /missing_local_proof_hash:/,
  )

  expectRefusal(
    'changed-local-proof-hash',
    approvedGateFromTemplate(template, (gate) => {
      gate.expected_local_proof_hashes[firstHashKey] = '0'.repeat(64)
      return gate
    }),
    /local_proof_hash_mismatch:/,
  )

  expectRefusal(
    'missing-readback-contract',
    approvedGateFromTemplate(template, (gate) => {
      delete gate.readback_contract
      return gate
    }),
    /readback_contract_missing/,
  )

  const approvedDir = path.join(tmpRoot, 'approved-preflight')
  fs.mkdirSync(approvedDir, { recursive: true })
  const approvedPath = path.join(approvedDir, 'gate.json')
  writeJson(approvedPath, approvedGateFromTemplate(template))
  const approved = runPython([runner, '--mode', 'execute', '--gate-manifest', approvedPath, '--out-dir', approvedDir])
  assert.equal(approved.status, 0, approved.stderr || approved.stdout)
  const approvedPlan = readJson(path.join(approvedDir, 'ecl_commercial_lab_load_command_plan.json'))
  assert.equal(approvedPlan.actual_azure_execution, false)
  assert.equal(approvedPlan.command_was_executed, false)
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
}

console.log('ECL commercial lab load preflight tests passed')

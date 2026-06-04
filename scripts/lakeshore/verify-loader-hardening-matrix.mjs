import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(path.join(repoRoot, 'docs/build/lakeshore/loaded/manifest.json'), 'utf8'));
const matrix = JSON.parse(readFileSync(path.join(repoRoot, 'docs/build/lakeshore/loader-hardening/lakeshore-loader-hardening-matrix.json'), 'utf8'));

const errors = [];
const warnings = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function fileExists(relPath) {
  return existsSync(path.join(repoRoot, relPath));
}

const manifestFormats = new Set(manifest.dataFiles.flatMap((file) => file.acceptedFormats));
for (const document of manifest.documents ?? []) {
  const ext = document.fileName.split('.').pop();
  if (ext) manifestFormats.add(ext);
}

assert(matrix.tenantKey === manifest.tenantKey, `tenantKey ${matrix.tenantKey} must match manifest ${manifest.tenantKey}`);
assert(matrix.brokerKey === manifest.brokerKey, `brokerKey ${matrix.brokerKey} must match manifest ${manifest.brokerKey}`);

for (const format of manifestFormats) {
  assert(matrix.formatMatrix?.[format], `format ${format} is present in Lakeshore package but missing from hardening matrix`);
  const entry = matrix.formatMatrix?.[format];
  if (entry) {
    assert(entry.parser && entry.parser.length > 0, `format ${format} must declare parser`);
    assert(entry.status && entry.status.length > 0, `format ${format} must declare status`);
    assert(Array.isArray(entry.mustProve) && entry.mustProve.length >= 3, `format ${format} must declare at least 3 proof requirements`);
  }
}

for (const format of Object.keys(matrix.formatMatrix ?? {})) {
  if (!manifestFormats.has(format)) warnings.push(`format ${format} is declared but not used by current Lakeshore package`);
}

for (const control of [
  'tenant_scope',
  'sensitive_upload_guard',
  'parser_or_declared_fallback',
  'template_validation',
  'approval',
  'commit_audit',
  'data_trust_snapshot',
  'embedding_after_commit',
]) {
  assert(matrix.requiredControls?.includes(control), `requiredControls must include ${control}`);
}

for (const relPath of [
  'src/lib/security/sensitive-upload-guard.ts',
  'src/lib/ingestion/document-upload-parser.ts',
  'src/lib/ingestion/document-intelligence-layout.ts',
  'src/lib/ingestion/parser-fallback-policy.ts',
  'src/lib/ingestion/document-storm-control.ts',
  'src/lib/context-ingestion/template-registry.ts',
  'src/lib/context-ingestion/validation-engine.ts',
  'src/scripts/embed-pending-chunks.ts',
  'docs/runbooks/document-intelligence.md',
]) {
  assert(fileExists(relPath), `Expected control file missing: ${relPath}`);
}

assert(Array.isArray(matrix.liveProofSequence) && matrix.liveProofSequence.length >= 8, 'liveProofSequence must include at least 8 steps');

const output = {
  status: errors.length === 0 ? 'ok' : 'failed',
  tenantKey: matrix.tenantKey,
  brokerKey: matrix.brokerKey,
  manifestFormats: [...manifestFormats].sort(),
  controls: matrix.requiredControls?.length ?? 0,
  liveProofSteps: matrix.liveProofSequence?.length ?? 0,
  warnings,
  errors,
};

console.log(JSON.stringify(output, null, 2));

if (errors.length > 0) process.exitCode = 1;

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SEARCH_ROOTS = ['src', 'scripts', 'tests', 'supabase/migrations', 'package.json'];

const FORBIDDEN = [
  { label: 'Brindlemark retired tenant', pattern: /\bbrindlemark\b/i },
  { label: 'Helix retired tenant key', pattern: /\bhelix-therapeutics\b/i },
  { label: 'Helix retired tenant name', pattern: /\bHelix Therapeutics\b/ },
  { label: 'Keystone retired tenant key', pattern: /\bkeystone-energy-holdings\b/i },
  { label: 'Keystone retired tenant name', pattern: /\bKeystone Energy Holdings\b/ },
  { label: 'Keystone retired demo account', pattern: /\bdemo-keystone\b/i },
  { label: 'Northstar retired tenant key', pattern: /\bnorthstar-medtech\b/i },
  { label: 'Northstar retired tenant alias', pattern: /\bnorthstar-clinical-tech\b/i },
  { label: 'Keystone retired tenant_key literal', pattern: /tenant_key\s*=\s*['"]keystone['"]/i },
  { label: 'Keystone retired client key literal', pattern: /clientKey:\s*['"]keystone['"]/i },
  { label: 'Keystone retired tenant key literal', pattern: /tenantKey:\s*['"]keystone['"]/i },
];

const ALLOWED_PATH_PATTERNS = [
  /^scripts\/phase0d-/,
  /^verification\//,
  /^docs\//,
  /^datasets\//,
  /^scripts\/verify-retired-tenant-references\.mjs$/,
  // Retired-tenant operator scripts must name retired keys in order to audit
  // and purge them. Keep this allowlist narrow; active/runtime scripts stay
  // subject to the retired-reference guard.
  /^scripts\/governance\/retired-tenant-inventory\.mjs$/,
  /^scripts\/ops\/audit-retired-tenant-residue\.mjs$/,
  /^scripts\/ops\/purge-retired-tenant-residue\.mjs$/,
  /^scripts\/ops\/purge-retired-tenant-rows\.mjs$/,
  // Fix A — Atlas retrieval alias normalization MUST reference the retired
  // names in order to NORMALIZE them; these two paths are the only place in
  // src/ where the retired names legitimately appear, and they appear inside
  // normalization code + its tests.
  /^src\/lib\/agent\/retrieval\.ts$/,
  /^src\/lib\/agent\/__tests__\/retrieval-tenant-leak\.test\.ts$/,
  // Fix B — Atlas invariant test ASSERTS retired aliases must not appear in
  // retrieval; it references the literal names to defend against re-introduction.
  /^src\/__tests__\/integration\/atlas\/atlas-invariants\.test\.ts$/,
];

function isAllowedPath(relativePath) {
  return ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(relativePath));
}

function shouldSkipLine(line) {
  return line.includes('northstar-clinical-tech-synthetic-v1')
    || line.includes('verify-retired-tenant-references');
}

function walk(entry) {
  const absolute = path.join(ROOT, entry);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [entry];
  const files = [];
  for (const child of fs.readdirSync(absolute)) {
    if (child === 'node_modules' || child === '.next' || child === '.git') continue;
    const childRel = path.join(entry, child);
    const childAbs = path.join(ROOT, childRel);
    const childStat = fs.statSync(childAbs);
    if (childStat.isDirectory()) {
      files.push(...walk(childRel));
    } else if (childStat.isFile()) {
      files.push(childRel);
    }
  }
  return files;
}

const findings = [];

for (const root of SEARCH_ROOTS) {
  for (const file of walk(root)) {
    const relativePath = file.replaceAll(path.sep, '/');
    if (isAllowedPath(relativePath)) continue;
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (shouldSkipLine(line)) return;
      for (const forbidden of FORBIDDEN) {
        if (forbidden.pattern.test(line)) {
          findings.push({
            file: relativePath,
            line: index + 1,
            label: forbidden.label,
            text: line.trim(),
          });
        }
      }
    });
  }
}

if (findings.length > 0) {
  console.error(`verify-retired-tenant-references: found ${findings.length} retired tenant reference(s)`);
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.label}] ${finding.text}`);
  }
  process.exit(1);
}

console.log('verify-retired-tenant-references: clean');

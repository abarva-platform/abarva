/**
 * Atlas Tier-1 invariant grep tests (audit §9.1).
 *
 * These are the cheapest layer of the three-tier Atlas eval harness. They scan
 * committed source for forbidden tokens, hardcoded fixtures, and missing
 * determinism settings. A failure here means a regression on one of the audit's
 * P0 / P1 contract rules has landed. They run on every commit via `npm run
 * atlas:eval`.
 *
 * Sibling fixes (A/B/C) close the source-level instances of each violation.
 * This file is the grep guard that keeps them closed.
 *
 * Scope:
 *  - `src/lib/atlas/**`
 *  - `src/lib/agent/retrieval*.ts`
 *  - `src/lib/agent/response-shape.ts`
 *  - `src/app/api/tower/synthesis/route.ts`
 *  - `src/app/api/v1/atlas/**`
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();

const ATLAS_RUNTIME_DIRS = [
  'src/lib/atlas',
  'src/lib/agent',
  'src/app/api/v1/atlas',
];

const ATLAS_RUNTIME_FILES = [
  'src/app/api/tower/synthesis/route.ts',
];

/**
 * Files that may legitimately reference the audit forbidden tokens for
 * documentation/comment/test purposes — these are NOT runtime code paths.
 */
const INVARIANT_TEST_FILE_SUFFIXES = [
  // Tier-1 invariant tests themselves
  'atlas-invariants.test.ts',
  // Tier-2 golden snapshots — contain references for assertion purposes
  'atlas-golden.test.ts',
];

function listSourceFiles(rootRelDir: string): string[] {
  const root = join(REPO_ROOT, rootRelDir);
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!entry.endsWith('.ts') && !entry.endsWith('.tsx')) continue;
      out.push(full);
    }
  }
  return out;
}

function collectAtlasRuntimeFiles(): string[] {
  const out = new Set<string>();
  for (const dir of ATLAS_RUNTIME_DIRS) {
    for (const file of listSourceFiles(dir)) out.add(file);
  }
  for (const rel of ATLAS_RUNTIME_FILES) {
    const full = join(REPO_ROOT, rel);
    if (existsSync(full)) out.add(full);
  }
  return Array.from(out).filter((file) => {
    // Exclude this file and the golden snapshots
    return !INVARIANT_TEST_FILE_SUFFIXES.some((suffix) => file.endsWith(suffix));
  });
}

interface ForbiddenTokenFinding {
  file: string;
  line: number;
  excerpt: string;
}

function scanForToken(files: string[], token: string): ForbiddenTokenFinding[] {
  const findings: ForbiddenTokenFinding[] = [];
  const lowered = token.toLowerCase();
  for (const file of files) {
    const contents = readFileSync(file, 'utf8');
    const lines = contents.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].toLowerCase().includes(lowered)) {
        findings.push({
          file: file.replace(`${REPO_ROOT}/`, ''),
          line: i + 1,
          excerpt: lines[i].trim().slice(0, 160),
        });
      }
    }
  }
  return findings;
}

describe('Atlas Tier-1 invariants', () => {
  const atlasRuntimeFiles = collectAtlasRuntimeFiles();

  describe('Tenant-correct rendering (audit C2)', () => {
    /**
     * Audit P0 — F3: synthesis route hardcoded to Apex Retail Group is the
     * canonical instance of the violation. Sibling fix A closes the source-level
     * leak; this invariant is the regression guard.
     *
     * The token `"Apex Retail Group"` (with quotes) must not appear as a hard
     * literal in any Atlas runtime file — Apex is the active tenant, not a hard
     * code identity that ships to every signed-in user.
     */
    it('no hardcoded "Apex Retail Group" literal survives in Atlas runtime', () => {
      const findings = scanForToken(atlasRuntimeFiles, '"Apex Retail Group"');
      if (findings.length > 0) {
        const msg = findings
          .map((f) => `${f.file}:${f.line}\n  ${f.excerpt}`)
          .join('\n\n');
        throw new Error(
          `Hardcoded "Apex Retail Group" literal found in Atlas runtime code. ` +
            `Atlas must render the active tenant name, not a hardcoded fixture.\n\n${msg}`,
        );
      }
    });

    it.skip('no hardcoded APEX_RETAIL_PROGRAM_INSTANCES import survives in Atlas runtime (enable after sibling fix A)', () => {
      const findings = scanForToken(atlasRuntimeFiles, 'APEX_RETAIL_PROGRAM_INSTANCES');
      if (findings.length > 0) {
        const msg = findings.map((f) => `${f.file}:${f.line}\n  ${f.excerpt}`).join('\n\n');
        throw new Error(
          `APEX_RETAIL_PROGRAM_INSTANCES referenced in Atlas runtime code. ` +
            `The program list must be loaded per-tenant, not from a hardcoded fixture.\n\n${msg}`,
        );
      }
    });

    /**
     * Audit P0 — F1: legacy demo aliases (Asterline, Heliara, Brindlemark) must
     * never appear as literal tokens in Atlas runtime code paths. They survive
     * in source-document chunks in the database; the scrub at retrieval time is
     * the runtime guard (sibling fix A). This invariant is the source-level
     * guard against the substring being reintroduced into prompts or templates.
     */
    const LEGACY_ALIASES = ['Asterline', 'Heliara', 'Brindlemark'];
    for (const alias of LEGACY_ALIASES) {
      it(`no legacy alias "${alias}" appears in Atlas runtime`, () => {
        const findings = scanForToken(atlasRuntimeFiles, alias);
        if (findings.length > 0) {
          const msg = findings
            .map((f) => `${f.file}:${f.line}\n  ${f.excerpt}`)
            .join('\n\n');
          throw new Error(
            `Legacy demo alias "${alias}" found in Atlas runtime code. ` +
              `These are the pre-rename tenant names and must never appear in any ` +
              `rendered output — apply normalizeLegacyClientAliases at retrieval time.\n\n${msg}`,
          );
        }
      });
    }
  });

  describe('Honest fallbacks (audit C5)', () => {
    /**
     * Audit P0 — F4: the literal strings `Needs validation.` and `Medium
     * pending evidence.` were the boilerplate fallbacks in
     * response-shape.ts:209-210. Sibling fix B replaces them with `'—'` or an
     * omitted row. This invariant is the source-level guard.
     */
    it.skip('no "Needs validation." boilerplate string survives in Atlas runtime (enable after sibling fix B)', () => {
      const findings = scanForToken(atlasRuntimeFiles, 'Needs validation.');
      if (findings.length > 0) {
        const msg = findings.map((f) => `${f.file}:${f.line}\n  ${f.excerpt}`).join('\n\n');
        throw new Error(
          `Boilerplate "Needs validation." literal found in Atlas runtime code. ` +
            `Use "—" or omit the column instead — confident-sounding boilerplate is worse than no answer.\n\n${msg}`,
        );
      }
    });

    it.skip('no "Medium pending evidence." boilerplate string survives in Atlas runtime (enable after sibling fix B)', () => {
      const findings = scanForToken(atlasRuntimeFiles, 'Medium pending evidence.');
      if (findings.length > 0) {
        const msg = findings.map((f) => `${f.file}:${f.line}\n  ${f.excerpt}`).join('\n\n');
        throw new Error(
          `Boilerplate "Medium pending evidence." literal found in Atlas runtime code. ` +
            `Use "—" or omit the column instead.\n\n${msg}`,
        );
      }
    });
  });

  describe('Percentile rendering (audit §4.3)', () => {
    /**
     * Audit §4.3: every percentile mention must include metric name + cohort
     * label + sample size. The full enforcement (sibling fix B's
     * renderPercentile helper) lives in response-shape.ts; this invariant is a
     * coarse grep guard that flags new naked percentile strings — when adding
     * new percentile renders, they must use the helper.
     *
     * Heuristic: flag lines that interpolate `${...percentile...}th percentile`
     * in template literals but do NOT also reference `cohort` or `sample` or
     * `metric` nearby.
     *
     * NOTE: pre-existing offender at `src/lib/atlas/scripted-engine.ts:117`
     * (`buildCohortPosition`) is closed by sibling fix B. This test is `.skip`d
     * until sibling B lands; flip to `it(` to activate the regression guard.
     */
    it.skip('every percentile rendering path references metric + cohort context (enable after sibling fix B)', () => {
      const offenders: ForbiddenTokenFinding[] = [];
      for (const file of atlasRuntimeFiles) {
        const contents = readFileSync(file, 'utf8');
        const lines = contents.split('\n');
        for (let i = 0; i < lines.length; i += 1) {
          const line = lines[i];
          // Skip comments
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
          // Looking for "${...percentile...}th percentile" template literals
          const naked = /\$\{[^}]*percentile[^}]*\}\s*th percentile/i.test(line);
          if (!naked) continue;
          // Tolerate if the same line also has metric/cohort/sample context
          if (/metric|cohort|sample|n=|peer/i.test(line)) continue;
          offenders.push({
            file: file.replace(`${REPO_ROOT}/`, ''),
            line: i + 1,
            excerpt: trimmed.slice(0, 200),
          });
        }
      }
      if (offenders.length > 0) {
        const msg = offenders.map((f) => `${f.file}:${f.line}\n  ${f.excerpt}`).join('\n\n');
        throw new Error(
          `Naked percentile rendering found (no metric/cohort/sample context). ` +
            `Use renderPercentile({ value, metricName, cohortLabel, sampleSize }) per audit §4.3.\n\n${msg}`,
        );
      }
    });
  });

  describe('Determinism (audit C3)', () => {
    /**
     * Audit P1 — F5: every Anthropic call must set `temperature: 0`. Sibling
     * fix C closes the source-level setting. This invariant is the regression
     * guard: any `messages.create` or `messages.stream` call in the Atlas
     * runtime must have a `temperature` field nearby (within 25 lines after).
     *
     * NOTE: pre-existing offenders (atlas/llm.ts:189, synthesis/route.ts:236,
     * + the sibling agent/* call sites) are closed by sibling fix C. This test
     * is `.skip`d until sibling C lands; flip to `it(` to activate the
     * regression guard.
     */
    it.skip('every Anthropic messages.* call in Atlas runtime sets temperature (enable after sibling fix C)', () => {
      const offenders: ForbiddenTokenFinding[] = [];
      const anthropicCallPattern = /\.messages\.(create|stream)\s*\(/;
      for (const file of atlasRuntimeFiles) {
        const contents = readFileSync(file, 'utf8');
        const lines = contents.split('\n');
        for (let i = 0; i < lines.length; i += 1) {
          if (!anthropicCallPattern.test(lines[i])) continue;
          // Look in the next 25 lines for "temperature"
          const window = lines.slice(i, Math.min(lines.length, i + 25)).join('\n');
          if (/temperature\s*:/.test(window)) continue;
          offenders.push({
            file: file.replace(`${REPO_ROOT}/`, ''),
            line: i + 1,
            excerpt: lines[i].trim().slice(0, 200),
          });
        }
      }
      if (offenders.length > 0) {
        const msg = offenders.map((f) => `${f.file}:${f.line}\n  ${f.excerpt}`).join('\n\n');
        throw new Error(
          `Anthropic messages.* call missing temperature parameter. ` +
            `Atlas is an audit-bearing surface — temperature must be 0 for determinism (audit C3).\n\n${msg}`,
        );
      }
    });
  });
});

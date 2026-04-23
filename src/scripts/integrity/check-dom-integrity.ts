// DOM integrity linter · Section 3.3 of page-agent-coherence-work-order.md
//
// Static analysis of TSX/HTML files for "looks-like-a-link-but-isn't"
// defects. Runs in CI; blocks merges on any violation. Catches:
//
//   - href="#" or href=""
//   - href="javascript:..."
//   - onClick={() => {}} or onClick={""} (no-op handlers)
//   - Text strings: TBD / Coming soon / Lorem ipsum / placeholder
//   - Unresolved template: {{ anything }} / ${unresolved}
//   - Pre-canon URLs: nexus-vert-kappa.vercel.app / abarva.local / localhost
//
// Write findings to reports/dom-integrity-{timestamp}.json and exit non-zero
// on any violation. Content docs (docs/**, docs/design-canon/**) are skipped
// since the design canon and work orders legitimately reference placeholder
// strings in authoring guidance.

import { readFileSync, readdirSync, mkdirSync, writeFileSync, statSync } from 'fs';
import { join, extname } from 'path';

interface Violation {
  page: string;
  line: number;
  kind:
    | 'placeholder_href'
    | 'javascript_href'
    | 'empty_onclick'
    | 'placeholder_text'
    | 'unresolved_template'
    | 'pre_canon_url';
  snippet: string;
  detail: string;
}

interface Report {
  generatedAt: string;
  summary: {
    filesScanned: number;
    violations: number;
    byKind: Record<string, number>;
  };
  violations: Violation[];
}

const SCAN_DIRS = ['src'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage', '__tests__', 'scripts']);
const SKIP_PATH_SUBSTRINGS = [
  // Design canon + work orders legitimately reference placeholder strings
  // while teaching what NOT to ship.
  'docs/design-canon/',
  'docs/',
  // DOM linter script itself references the substrings it scans for.
  'src/scripts/integrity/check-dom-integrity.ts',
  // Generated manifests / JSON are not rendered output.
  'generated/',
  // Seed data encodes composite-tenant narrative (e.g., "TBD — Hire 1" is
  // intentional content describing a recruitable slot, not a rendered
  // placeholder). Scan the UI that renders it, not the data.
  'src/data/',
  // Link-crawler references pre-canon URLs by name when detecting them.
  'src/lib/integrity/link-crawler.ts',
  // Library utility references hostname strings by name.
  'src/lib/intelligence/library.ts',
];
const VALID_EXT = new Set(['.tsx', '.ts', '.html', '.jsx', '.js']);
// Inline escape hatch: add `// dom-integrity-ignore-line` on the line
// above a violation to suppress. Use sparingly and document why.
const IGNORE_MARKER = 'dom-integrity-ignore-line';

const CHECKS: Array<{
  pattern: RegExp;
  kind: Violation['kind'];
  detail: string;
  // When true, matches on JSX/HTML tags only (not arbitrary strings).
  jsxOnly?: boolean;
}> = [
  {
    pattern: /\bhref\s*=\s*["']#["']/,
    kind: 'placeholder_href',
    detail: 'href="#" is a placeholder — replace with a real route or remove the link.',
  },
  {
    pattern: /\bhref\s*=\s*["']["']/,
    kind: 'placeholder_href',
    detail: 'Empty href — link goes nowhere.',
  },
  {
    pattern: /\bhref\s*=\s*["']javascript:/,
    kind: 'javascript_href',
    detail: 'javascript: hrefs are non-accessible and indicate a no-op anchor.',
  },
  {
    pattern: /onClick\s*=\s*\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/,
    kind: 'empty_onclick',
    detail: 'Empty onClick handler — remove the handler or wire real behavior.',
  },
  {
    pattern: /onClick\s*=\s*\{""\}|onClick\s*=\s*\{''\}/,
    kind: 'empty_onclick',
    detail: 'Empty string onClick handler.',
  },
  {
    pattern: /\b(?:TBD|Coming soon|Lorem ipsum)\b/i,
    kind: 'placeholder_text',
    detail: 'Placeholder text still in the rendered output.',
  },
  // Unresolved mustache-style templates. Match {{word}} but not template
  // literals in code (those are ${expression} inside backticks).
  {
    pattern: /\{\{[a-zA-Z_][a-zA-Z0-9_ .-]*\}\}/,
    kind: 'unresolved_template',
    detail: 'Unresolved {{template}} token in rendered output.',
  },
  {
    pattern: /nexus-vert-kappa\.vercel\.app/,
    kind: 'pre_canon_url',
    detail: 'Pre-canon preview URL leaked into rendered content — use relative paths.',
  },
  {
    pattern: /abarva\.local/,
    kind: 'pre_canon_url',
    detail: 'abarva.local reference — local dev host should not appear in shipped code.',
  },
  {
    // Match localhost only when used as a URL (localhost:3000 or //localhost).
    // Plain string "localhost" in code comments is fine.
    pattern: /["']https?:\/\/localhost/,
    kind: 'pre_canon_url',
    detail: 'Hardcoded localhost URL — should use relative or env-driven path.',
  },
];

function shouldSkip(path: string): boolean {
  for (const frag of SKIP_PATH_SUBSTRINGS) {
    if (path.includes(frag)) return true;
  }
  return false;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(entry) || shouldSkip(full)) continue;
      walk(full, out);
    } else if (VALID_EXT.has(extname(entry))) {
      if (shouldSkip(full)) continue;
      out.push(full);
    }
  }
  return out;
}

function scanFile(path: string): Violation[] {
  const found: Violation[] = [];
  const content = readFileSync(path, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    // Skip comments that legitimately discuss these patterns.
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    // Honour the inline escape hatch on the previous line.
    const previousLine = i > 0 ? lines[i - 1] : '';
    if (previousLine.includes(IGNORE_MARKER)) continue;
    for (const check of CHECKS) {
      if (check.pattern.test(line)) {
        found.push({
          page: path,
          line: i + 1,
          kind: check.kind,
          snippet: line.trim().slice(0, 200),
          detail: check.detail,
        });
      }
    }
  }
  return found;
}

function main() {
  const timestamp = process.env.REPORT_TIMESTAMP ?? new Date().toISOString().replace(/[:.]/g, '-');
  const files: string[] = [];
  for (const dir of SCAN_DIRS) {
    try {
      walk(dir, files);
    } catch (err) {
      console.error(`Skip dir ${dir}: ${(err as Error).message}`);
    }
  }

  const allViolations: Violation[] = [];
  for (const file of files) {
    allViolations.push(...scanFile(file));
  }

  const byKind: Record<string, number> = {};
  for (const v of allViolations) {
    byKind[v.kind] = (byKind[v.kind] ?? 0) + 1;
  }

  const report: Report = {
    generatedAt: new Date().toISOString(),
    summary: {
      filesScanned: files.length,
      violations: allViolations.length,
      byKind,
    },
    violations: allViolations,
  };

  const outputDir = join(process.cwd(), 'reports');
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, `dom-integrity-${timestamp}.json`);
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`DOM integrity report: ${outputPath}`);
  console.log(
    [
      `filesScanned=${report.summary.filesScanned}`,
      `violations=${report.summary.violations}`,
      ...Object.entries(byKind).map(([k, n]) => `${k}=${n}`),
    ].join(' · '),
  );

  if (allViolations.length > 0) {
    console.error('\nFirst 20 violations:');
    for (const v of allViolations.slice(0, 20)) {
      console.error(`  ${v.page}:${v.line} · ${v.kind} · ${v.snippet}`);
    }
    process.exitCode = 1;
  }
}

main();

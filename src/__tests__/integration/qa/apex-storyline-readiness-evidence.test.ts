// T-529 (a) — the readiness manifest's QA27 statements must agree with what the
// QA27 verifier actually reports.
//
// `docs/build/production-readiness.json` is not a document. It is read at
// request time by src/lib/admin/production-readiness-loader.ts and rendered on
// /admin/production-readiness, so a stale sentence in it is an operator-facing
// false statement about what has been verified.
//
// The manifest claimed six slice-integration checks were "deferred pending
// Wave 19 integration" while the verifier reported 14 pass / 0 deferred, and
// one of the six named slices (MW9) has no check in the verifier at all — it
// was reported as deferred by a report that never tested it.
//
// Truth here comes from running the verifier, never from the manifest, so the
// manifest cannot satisfy the assertion that checks it.

import { runApexStorylineVerification } from '@/lib/qa/apex-source-program-storyline-verification';

import fs from 'node:fs';
import path from 'node:path';

const MANIFEST_PATH = path.join(
  process.cwd(),
  'docs/build/production-readiness.json',
);

interface ReadinessComponent {
  id: string;
  [key: string]: unknown;
}

/** Every string anywhere inside a component, with the key path that holds it. */
function collectStrings(
  node: unknown,
  keyPath: string,
  out: Array<{ keyPath: string; value: string }>,
): void {
  if (typeof node === 'string') {
    out.push({ keyPath, value: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((entry, index) => collectStrings(entry, `${keyPath}[${index}]`, out));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      collectStrings(value, `${keyPath}.${key}`, out);
    }
  }
}

/**
 * The QA27 statements inside a string: from each "QA27" to the end of the
 * sentence that carries it.
 *
 * Scoping to the sentence matters. The same component says other, true things
 * are deferred (a dispatcher-boundary control, a CI validator); reading every
 * "deferred" in the component would flag those, and a check that cries wolf
 * gets widened until it stops failing.
 *
 * Named limit, so the next reader does not have to discover it: this is a text
 * reader, and a claim about QA27 written in a sentence that does not itself say
 * "QA27" is outside what it can see. Widening the window to the whole field was
 * measured and rejected — `nextAction` carries several unrelated and accurate
 * deferrals, and flagging those is how a check gets relaxed into uselessness.
 */
function qa27Statements(value: string): string[] {
  const statements: string[] = [];
  let cursor = value.indexOf('QA27');
  while (cursor !== -1) {
    const rest = value.slice(cursor);
    const end = rest.search(/\.(?:\s|$)/);
    statements.push(end === -1 ? rest : rest.slice(0, end + 1));
    cursor = value.indexOf('QA27', cursor + 4);
  }
  return statements;
}

/** Slice ids as the build register writes them: letters then digits, e.g. PROG15. */
function sliceIdsIn(statement: string): string[] {
  const matches = statement.match(/\b[A-Z]{2,6}\d{1,3}\b/g) ?? [];
  return [...new Set(matches)].filter((id) => id !== 'QA27');
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as {
  components: ReadinessComponent[];
};

const validationQa = manifest.components.find((c) => c.id === 'validation_qa');

const manifestStrings: Array<{ keyPath: string; value: string }> = [];
collectStrings(validationQa, '$.components[validation_qa]', manifestStrings);

const qa27Mentions = manifestStrings.flatMap(({ keyPath, value }) =>
  qa27Statements(value).map((statement) => ({ keyPath, statement })),
);

describe('QA27 readiness-manifest evidence agrees with the verifier', () => {
  const report = runApexStorylineVerification();

  // Anchor. Without this, deleting the QA27 sentences from the manifest would
  // make every assertion below vacuously true — the manifest would stop lying
  // by saying nothing, and the check would report that as health.
  it('the readiness manifest still makes QA27 claims for this test to check', () => {
    expect(validationQa).toBeDefined();
    expect(qa27Mentions.length).toBeGreaterThan(0);
  });

  it('no QA27 statement calls a check deferred that the verifier does not defer', () => {
    const contradictions: string[] = [];

    for (const { keyPath, statement } of qa27Mentions) {
      if (!/defer/i.test(statement)) continue;

      for (const sliceId of sliceIdsIn(statement)) {
        const checks = report.checks.filter((check) =>
          `${check.description} ${check.detail}`.includes(sliceId),
        );

        if (checks.length === 0) {
          contradictions.push(
            `${keyPath}: names ${sliceId} as deferred, but no QA27 check mentions ${sliceId} at all`,
          );
          continue;
        }

        if (!checks.some((check) => check.status === 'deferred')) {
          contradictions.push(
            `${keyPath}: names ${sliceId} as deferred, but ${checks
              .map((check) => `${check.checkId}=${check.status}`)
              .join(', ')}`,
          );
        }
      }
    }

    expect(contradictions).toEqual([]);
  });

  // The other direction, and the one that will matter next. Today the manifest
  // over-claimed deferrals; the moment it was corrected it began claiming a
  // clean bill, and a clean bill goes stale the same way — silently, the first
  // time a check starts failing or deferring again.
  it('no QA27 statement claims a clean bill the verifier does not report', () => {
    const CLEAN_BILL =
      /\ball\s+(?:\d{1,3}\s+)?checks?\s+pass\b|\ball\s+passing\b|\b(?:nothing|none\s+are)\s+outstanding\b/i;

    const overclaims: string[] = [];

    for (const { keyPath, statement } of qa27Mentions) {
      if (!CLEAN_BILL.test(statement)) continue;

      if (report.failCount > 0 || report.deferredCount > 0) {
        overclaims.push(
          `${keyPath}: claims a clean bill, verifier reports ` +
            `${report.passCount} pass / ${report.failCount} fail / ${report.deferredCount} deferred`,
        );
      }
    }

    expect(overclaims).toEqual([]);
  });

  it('every check count a QA27 statement quotes is the count the verifier produces', () => {
    const wrongCounts: string[] = [];

    for (const { keyPath, statement } of qa27Mentions) {
      // Every quoted count, not the first: a second, wrong number in the same
      // sentence is exactly the drift this is here to catch.
      for (const quoted of statement.matchAll(/\b(\d{1,3})\s+checks\b/g)) {
        const claimed = Number(quoted[1]);
        if (claimed !== report.checks.length) {
          wrongCounts.push(
            `${keyPath}: claims ${claimed} checks, verifier runs ${report.checks.length}`,
          );
        }
      }
    }

    expect(wrongCounts).toEqual([]);
  });
});

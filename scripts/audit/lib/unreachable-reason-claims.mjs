/**
 * `unreachableReason` says things about the repository, and until now nothing
 * checked them.
 *
 * `routeReachable: false` is the catalog's escape hatch: the control is real
 * code, no route mounts it, and the reason explains what is not on a screen
 * and what would put it there. The gate asked that reason for one thing —
 * forty characters of prose — so every factual clause inside it was free to
 * rot. That is the same failure `knownSuites` was built against, in the one
 * field `knownSuites` does not reach.
 *
 * It had already rotted. The Tower entry asserted that
 * `src/lib/qa/route-smoke-inventory.ts` and
 * `src/lib/qa/founder-demo-route-checklist.ts` *"still name it as the
 * component `/tenant/[tenantSlug]/tower` renders"*. Both files are on `main`
 * and neither contains `ProgramPressureCards` in any casing — both were
 * repointed at `TowerCommandCenterAvaShell`. The clause was false and the gate
 * was green.
 *
 * So the tree-facts a reason asserts are now derived from the tree, the way
 * `knownSuites` is. Three rules, and the grammar is deliberately narrow:
 *
 *   PATHS      every repo path named in a reason must exist.
 *   ATTRIBUTES `X names/mentions/lists/imports Y` — read X, look for Y.
 *   ABSENCE    `nothing imports Y` — walk the tree and confirm it.
 *
 * A narrow grammar is the point. A parser that tried to understand arbitrary
 * English would produce findings nobody trusts; this one recognises a handful
 * of anchored clause shapes and says so. What it must not do is let a clause
 * it *does* recognise go unchecked, so a recognised verb whose subject or
 * object will not resolve is reported rather than skipped: prose that evades
 * the gate by being vaguer is the failure mode this exists to stop.
 */

const REPO_ROOTS = ['src', 'docs', 'scripts', 'tests', 'datasets', 'public', 'supabase', '.github'];

/** A repo path: a known top-level directory, slashes, and a file extension. */
const REPO_PATH = new RegExp(
  `(?:${REPO_ROOTS.map((root) => root.replace('.', '\\.')).join('|')})/[A-Za-z0-9._@[\\]()-]+(?:/[A-Za-z0-9._@[\\]()-]+)*\\.[A-Za-z0-9]+`,
  'g',
);

/**
 * Trailing sentence punctuation is not part of a filename. A reason ending
 * "...recorded in docs/architecture/unreachable-components.json." names a file
 * that exists; reading the period as part of the name would report it missing,
 * which is a false finding of exactly the kind this gate must not produce.
 */
function trimTrailingPunctuation(token) {
  return token.replace(/[.,;:)]+$/, '');
}

export function repoPathsIn(reason) {
  const found = new Set();
  for (const match of reason.matchAll(REPO_PATH)) {
    const cleaned = trimTrailingPunctuation(match[0]);
    if (cleaned.includes('/')) found.add(cleaned);
  }
  return [...found];
}

const ATTRIBUTION_VERBS = 'names?|mentions?|lists?|imports?|records?';
const HEDGES = '(?:still|now|already|also|each|both|again|only)\\s+';

/**
 * `src/a.ts and src/b.ts still name it as ...` — one clause, two subjects.
 * The subject list is captured whole and split here rather than in the regex,
 * because `and`/`,` inside a path would break a regex that tried to do both.
 */
const ATTRIBUTION = new RegExp(
  `((?:${REPO_PATH.source})(?:\\s*(?:,|and)\\s*(?:${REPO_PATH.source}))*)` +
    `\\s+(?:${HEDGES})*(${ATTRIBUTION_VERBS})\\s+` +
    '(`[^`]+`|"[^"]+"|it\\b|this component\\b|[A-Za-z0-9._/@[\\]-]+)',
  'g',
);

/**
 * `nothing imports X` / `no route imports this component` — an absence claim.
 *
 * All four quantifiers are checked the same way, against the importers of X
 * among non-test product files. `no route` is the weaker claim of the two and
 * the route graph settles it independently a few lines up, but it is read here
 * too: a quantifier the grammar recognised and then declined to check is the
 * unchecked clause this whole module exists to stop.
 */
const ABSENCE = new RegExp(
  '\\b(?:[Nn]othing|[Nn]o file|[Nn]o module|[Nn]o route)\\s+(?:' +
    ATTRIBUTION_VERBS +
    ')\\s+(`[^`]+`|"[^"]+"|it\\b|this component\\b|[A-Za-z0-9._/@[\\]-]+)',
  'g',
);

/** `recorded in <path>` / `listed in <path>` — the object is the surface itself. */
const RECORDED_IN = new RegExp(
  `\\b(?:recorded|listed|catalogued|cataloged)\\s+in\\s+(${REPO_PATH.source})`,
  'g',
);

/**
 * A recognised verb anywhere in the reason. Used only to decide whether a
 * clause the three patterns above failed to resolve should be reported as
 * unverifiable, so it is intentionally looser than they are.
 */
const LOOSE_VERB = new RegExp(`\\b(?:${ATTRIBUTION_VERBS})\\b`, 'g');

function unquote(token) {
  const trimmed = trimTrailingPunctuation(token.trim());
  if (/^[`"].*[`"]$/.test(trimmed)) return trimmed.slice(1, -1);
  return trimmed;
}

/**
 * What to look for in the subject's text.
 *
 * `it` and `this component` are anaphors for the surface the reason belongs
 * to, so they resolve to that surface's module token — the same token
 * `knownSuites` is derived from, so the two rules agree about what naming a
 * component means. A repo path resolves to either the path itself or its
 * module token, because a file can legitimately cite a module by either.
 */
export function resolveObject(rawObject, surfacePath) {
  const object = unquote(rawObject);
  if (/^(it|this component)$/i.test(object)) {
    if (!surfacePath) return null;
    return { label: moduleTokenOf(surfacePath), needles: [moduleTokenOf(surfacePath)] };
  }
  if (object.includes('/') && /\.[A-Za-z0-9]+$/.test(object)) {
    return { label: object, needles: [object, moduleTokenOf(object)] };
  }
  // A bare word is only a code token if it looks like one. "the" is not.
  if (/[A-Z]/.test(object) || object.includes('.') || object.includes('-')) {
    return { label: object, needles: [object] };
  }
  return null;
}

function moduleTokenOf(filePath) {
  const base = filePath.split('/').pop() ?? filePath;
  return base.replace(/\.[^.]+$/, '');
}

/** Enough of the clause for a reader to find it in the reason, and no more. */
function excerptAround(reason, index, radius = 45) {
  const from = Math.max(0, index - radius);
  const to = Math.min(reason.length, index + radius);
  return `${from > 0 ? '…' : ''}${reason.slice(from, to).trim()}${to < reason.length ? '…' : ''}`;
}

function splitSubjects(raw) {
  return [...raw.matchAll(new RegExp(REPO_PATH.source, 'g'))].map((m) => trimTrailingPunctuation(m[0]));
}

/**
 * Evaluate one `unreachableReason` against the tree.
 *
 * `io` is injected so a suite can drive this over a fixture tree without
 * writing files, and so the audit can pass its own cwd-relative readers.
 */
export function evaluateUnreachableReason({ label, reason, surfacePath, io }) {
  const problems = [];
  if (typeof reason !== 'string' || !reason.trim()) return problems;

  for (const repoPath of repoPathsIn(reason)) {
    if (!io.exists(repoPath)) {
      problems.push(
        `${label}: unreachableReason names ${repoPath}, which is not in the tree — a reason is checked against the repository, not only for length`,
      );
    }
  }

  /*
   * Spans of text a rule below actually resolved into a checked claim. The
   * unresolved-verb rule at the end reads these positions rather than a count
   * of them: a first draft compared "verbs seen" with "clauses resolved" and
   * the two happened to be equal on a reason where the verb it saw and the
   * clause it resolved were different clauses. Two errors cancelling into
   * agreement reads exactly like agreement.
   */
  const checkedSpans = [];
  const markChecked = (match) => checkedSpans.push([match.index, match.index + match[0].length]);

  for (const match of reason.matchAll(ATTRIBUTION)) {
    const subjects = splitSubjects(match[1]);
    const resolved = resolveObject(match[3], surfacePath);
    if (subjects.length === 0 || !resolved) continue;
    markChecked(match);
    for (const subject of subjects) {
      const text = io.read(subject);
      if (text === null) continue; // already reported by the path rule above
      if (!resolved.needles.some((needle) => text.includes(needle))) {
        problems.push(
          `${label}: unreachableReason asserts that ${subject} ${match[2]} ${resolved.label}; ${subject} does not contain ${resolved.label} — the clause is stale, so either the file moved on or the reason has to`,
        );
      }
    }
  }

  for (const match of reason.matchAll(RECORDED_IN)) {
    const register = trimTrailingPunctuation(match[1]);
    if (!surfacePath) continue;
    markChecked(match);
    const text = io.read(register);
    if (text === null) continue;
    if (!text.includes(surfacePath)) {
      problems.push(
        `${label}: unreachableReason claims this surface is recorded in ${register}, and ${surfacePath} is not in it`,
      );
    }
  }

  for (const match of reason.matchAll(ABSENCE)) {
    const resolved = resolveObject(match[1], surfacePath);
    if (!resolved) continue;
    markChecked(match);
    const importers = io.importersOf(resolved.needles);
    if (importers.length > 0) {
      problems.push(
        `${label}: unreachableReason claims nothing imports ${resolved.label}, but ${importers.join(', ')} does`,
      );
    }
  }

  /*
   * A clause the grammar recognises but cannot resolve is reported, not
   * skipped. Skipping it would make the gate evadable by writing the same
   * assertion less precisely, which is how a control stops being one.
   */
  for (const verb of reason.matchAll(LOOSE_VERB)) {
    const inside = checkedSpans.some(([from, to]) => verb.index >= from && verb.index < to);
    if (inside) continue;
    problems.push(
      `${label}: unreachableReason says "${excerptAround(reason, verb.index)}" and the gate cannot resolve that to a file and a token, so nothing checks it. Name the file and the symbol, or say it without a naming or importing verb`,
    );
  }

  return problems;
}

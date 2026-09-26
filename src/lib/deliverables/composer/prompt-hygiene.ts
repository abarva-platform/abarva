/**
 * Assert an assembled prompt is free of serialisation debris before it is sent.
 *
 * A single missing field produced `- [133] undefined: <statement>` in the most
 * emphasised block of the prompt — the facts that MUST survive into the artifact.
 * The model copied the prefix verbatim into the document body, and the quality
 * gate then blocked the document for an unsupported claim. One wrong field name,
 * three steps downstream, reported as a content defect.
 *
 * None of that needed a model call to detect. `undefined` in a prompt is never
 * intentional, and the cheapest place to find it is before the call.
 *
 * The markers are deliberately narrow. A check that flagged any suspicious-looking
 * text would fire on legitimate prose — governed content can discuss a null
 * result or a NaN in a data-quality note — so it matches only the shapes that
 * string interpolation produces and prose does not.
 */

export interface HygieneFinding {
  marker: string;
  count: number;
  firstContext: string;
}

export interface HygieneVerdict {
  clean: boolean;
  findings: HygieneFinding[];
}

/**
 * Each pattern is a template-literal artefact, not a word.
 *
 * `undefined` and `null` are matched only where interpolation puts them —
 * after a delimiter, or standing where a value belongs — so a sentence about
 * "a null hypothesis" or "undefined scope" does not trip it.
 */
const MARKERS: { name: string; pattern: RegExp }[] = [
  { name: 'interpolated undefined', pattern: /(?:^|[\s[(])undefined(?=[\s:,;.)\]]|$)/gm },
  { name: 'interpolated null', pattern: /(?:^|[\s[(])null(?=[\s:,;.)\]]|$)/gm },
  { name: 'stringified object', pattern: /\[object [A-Z]\w+\]/g },
  { name: 'NaN value', pattern: /(?:^|[\s[(:])NaN(?=[\s:,;.)\]%]|$)/gm },
  { name: 'unresolved template', pattern: /\$\{[^}]*\}/g },
  // NOT an empty bracket rule. `[]` was flagged nine times in a real prompt,
  // every one of them a legitimate empty array in the JSON schema hint the
  // architect pass sends. A marker that fires on correct content is worse than
  // an absent one, because it teaches the reader to skip the whole report.
  { name: 'Invalid Date', pattern: /Invalid Date/g },
];

export function checkPromptHygiene(prompt: string): HygieneVerdict {
  const findings: HygieneFinding[] = [];
  for (const { name, pattern } of MARKERS) {
    const matches = [...prompt.matchAll(pattern)];
    if (matches.length === 0) continue;
    const at = matches[0].index ?? 0;
    findings.push({
      marker: name,
      count: matches.length,
      firstContext: prompt.slice(Math.max(0, at - 70), at + 90).replace(/\s+/g, ' '),
    });
  }
  return { clean: findings.length === 0, findings };
}

/** Throws with the marker and its first context. Cheap, and before the spend. */
export function assertPromptHygiene(prompt: string, label: string): void {
  const verdict = checkPromptHygiene(prompt);
  if (verdict.clean) return;
  const detail = verdict.findings
    .map((f) => `${f.marker} x${f.count} — "…${f.firstContext}…"`)
    .join('\n  ');
  throw new Error(`prompt "${label}" carries serialisation debris:\n  ${detail}`);
}

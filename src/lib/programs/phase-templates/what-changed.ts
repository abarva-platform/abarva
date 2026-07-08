// Moves — deterministic "What Changed" between a draft and a final upload.
// Pure text comparison read client-side (no backend, no Claude). Reports which
// sections changed/added/removed + line-level counts + which next-phase inputs
// are impacted (from the governed catalog). It does NOT interpret the meaning of
// the change — semantic summaries ("approach changed from X to Y") are a later,
// model-assisted step. Honest, structural, deterministic.

export interface WhatChangedResult {
  sectionsChanged: string[];
  sectionsAdded: string[];
  sectionsRemoved: string[];
  linesAdded: number;
  linesRemoved: number;
  /** Next-phase inputs that should be reviewed because this artifact changed. */
  impactedNextPhaseInputs: string[];
  hasChanges: boolean;
}

const HEADING_RE = /^#{1,6}\s+(.*)$/;

/** Parse a markdown-ish doc into { heading -> normalized body }. */
function sections(text: string): Map<string, string> {
  const map = new Map<string, string>();
  let current = '(top)';
  let buf: string[] = [];
  const flush = () => {
    map.set(current, buf.join('\n').trim());
  };
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.match(HEADING_RE);
    if (m) {
      flush();
      current = m[1].trim();
      buf = [];
    } else {
      buf.push(raw);
    }
  }
  flush();
  return map;
}

function lineSet(text: string): Set<string> {
  return new Set(
    text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !HEADING_RE.test(l)),
  );
}

export function computeWhatChanged(
  draft: string,
  final: string,
  impactedNextPhaseInputs: string[] = [],
): WhatChangedResult {
  const d = sections(draft);
  const f = sections(final);

  const sectionsChanged: string[] = [];
  const sectionsAdded: string[] = [];
  const sectionsRemoved: string[] = [];

  for (const [h, body] of f) {
    if (h === '(top)') continue;
    if (!d.has(h)) sectionsAdded.push(h);
    else if (d.get(h) !== body) sectionsChanged.push(h);
  }
  for (const h of d.keys()) {
    if (h === '(top)') continue;
    if (!f.has(h)) sectionsRemoved.push(h);
  }

  const dl = lineSet(draft);
  const fl = lineSet(final);
  let linesAdded = 0;
  let linesRemoved = 0;
  for (const l of fl) if (!dl.has(l)) linesAdded++;
  for (const l of dl) if (!fl.has(l)) linesRemoved++;

  const hasChanges =
    sectionsChanged.length > 0 ||
    sectionsAdded.length > 0 ||
    sectionsRemoved.length > 0 ||
    linesAdded > 0 ||
    linesRemoved > 0;

  return {
    sectionsChanged,
    sectionsAdded,
    sectionsRemoved,
    linesAdded,
    linesRemoved,
    impactedNextPhaseInputs: hasChanges ? Array.from(new Set(impactedNextPhaseInputs)) : [],
    hasChanges,
  };
}

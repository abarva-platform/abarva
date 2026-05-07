// Read-only enforcement. Two layers:
//   1. Label gate — anchor / button text matched against a forbidden
//      verb list before we click or follow.
//   2. Network gate — every request observed by the page is checked;
//      anything non-GET aborts the current path and is logged under
//      `skipped_mutating_paths[]`.
//
// We deliberately err on the side of "skip cleanly" — false positives
// are cheap (one missed page) compared to a single accidental write.

const FORBIDDEN_VERBS = [
  'create',
  'new',
  'add',
  'save',
  'submit',
  'send',
  'invite',
  'award',
  'approve',
  'reject',
  'delete',
  'archive',
  'publish',
  'launch',
  'cancel',
  'withdraw',
  'pay',
  'sign',
  'upload',
  'download all',
  'export all',
  'remove',
  'discard',
];

const FORBIDDEN_VERB_REGEX = new RegExp(
  `\\b(${FORBIDDEN_VERBS.map((v) => v.replace(/\s+/g, '\\s+')).join('|')})\\b`,
  'i',
);

export function isWriteLabel(text: string | null | undefined): boolean {
  if (!text) return false;
  return FORBIDDEN_VERB_REGEX.test(text);
}

export function isMutatingMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS';
}

export function isWriteConfirmationCopy(bodyText: string): boolean {
  // Heuristic: a page that loaded JUST after a click containing copy
  // like "Event created" or "Successfully submitted" is evidence we
  // accidentally triggered a write. Halt immediately.
  return /\b(created|submitted|saved|sent|published|approved|rejected|archived|deleted)\s+successfully\b/i.test(
    bodyText,
  ) || /\b(your|the)\s+(event|request|response|invitation)\s+(has\s+been|was)\s+(created|submitted|sent|published)\b/i.test(
    bodyText,
  );
}

// PII redactors — applied to entity_payload before it lands in JSONL.
// Raw HTML and full-page screenshots are not redacted but live in
// `vault/` (mode 0700, gitignored).

export function redactEmail(s: string): string {
  return s.replace(
    /([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g,
    '*****@$2',
  );
}

export function redactPhoneDigits(s: string): string {
  // Keep leading + and country digits up to 3, mask the rest.
  return s.replace(
    /(\+?\d{1,3})[\s().-]*\d[\d\s().-]{6,}\d/g,
    (m, country) => `${country}-XXXXXXX`,
  );
}

export function redactLongFreeText(s: string, limit = 500): string {
  if (s.length <= limit) return s;
  return `<<redacted_long_text:len=${s.length}>>`;
}

export function applyPiiRedaction(value: unknown): unknown {
  if (typeof value === 'string') {
    let v = value;
    v = redactEmail(v);
    v = redactPhoneDigits(v);
    v = redactLongFreeText(v);
    return v;
  }
  if (Array.isArray(value)) return value.map(applyPiiRedaction);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = applyPiiRedaction(v);
    return out;
  }
  return value;
}

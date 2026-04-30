// EXPORT-1 · Filename sanitization.
//
// Pure helper that builds a download filename from the deliverable spec
// + chosen format. Per design §5 (pilot-readiness floor): RFC 6266
// fallback only — strip everything outside `A-Za-z0-9_.-` from the
// generated stem.
//
// Pattern: `{slug}-{kind}-{yyyymmdd}.{ext}`
//   - `slug`     · sanitized, lowercased title; collapsed dashes
//   - `kind`     · the DeliverableKind discriminator
//   - `yyyymmdd` · UTC date stamp (caller may supply Date; defaults to now)
//   - `ext`      · lowercased format
// Total length is capped at 200 characters; if the slug + suffix would
// overflow, the slug is truncated (not the suffix — extension and date
// are load-bearing).

import type { DeliverableFormat, DeliverableKind } from './types';

/** Maximum total filename length, per RFC 6266 fallback discipline. */
const MAX_FILENAME_LENGTH = 200;

/** Characters disallowed by Windows / macOS filename rules. */
const UNSAFE_PATTERN = /[\\/:*?"<>|]/g;

/** Anything outside A-Za-z0-9_.- collapses to a single dash. */
const NON_RFC6266_PATTERN = /[^A-Za-z0-9_.-]+/g;

/** Build a safe download filename from a deliverable spec + format. */
export function buildExportFilename(args: {
  title: string;
  kind: DeliverableKind;
  format: DeliverableFormat;
  generatedAt?: Date;
}): string {
  const { title, kind, format } = args;
  const date = args.generatedAt ?? new Date();

  const ext = format.toLowerCase();
  const stamp = formatYyyymmdd(date);

  // Step 1 · replace explicitly unsafe chars with dashes.
  const dashed = title.replace(UNSAFE_PATTERN, '-');
  // Step 2 · collapse anything else outside the RFC 6266 ASCII set to dashes.
  const ascii = dashed.replace(NON_RFC6266_PATTERN, '-');
  // Step 3 · collapse runs of dashes; trim leading/trailing dashes; lowercase.
  const slug =
    ascii
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'deliverable';

  const suffix = `-${kind}-${stamp}.${ext}`;
  const room = MAX_FILENAME_LENGTH - suffix.length;
  // If the suffix alone is longer than the cap (kind names are bounded so
  // this is theoretical), truncate from the end; the kind+date+ext block
  // is more useful than a partial slug.
  const safeSlug =
    room > 0 ? slug.slice(0, room).replace(/-+$/g, '') || 'deliverable' : '';
  const full = `${safeSlug}${suffix}`;
  return full.length > MAX_FILENAME_LENGTH
    ? full.slice(0, MAX_FILENAME_LENGTH)
    : full;
}

function formatYyyymmdd(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, '0');
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return `${y}${m}${d}`;
}

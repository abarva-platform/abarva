# Home JSON Contract Deprecation

The Home consultant synthesis JSON contract is deprecated.

## Why

The previous Claude layer required a strict JSON object. Live proof showed that good consultant prose could be discarded solely because Claude did not return parseable JSON:

`Claude consultant synthesis fallback=No JSON object returned`

That failure mode is no longer acceptable for Home/aVa.

## New Rule

Home uses text-first Claude synthesis.

Claude may return normal prose. Home validates the prose and attaches deterministic artifacts, citations, gaps, and answer boundary from AbarVa-owned code.

## Removed Failure Modes

Home must not fall back solely because:

- no JSON object returned
- `JSON.parse` failed
- markdown fence was present
- optional schema field was missing
- prose was returned instead of object

Home still falls back for:

- timeout
- empty text
- raw IDs
- internal labels
- cross-tenant leakage
- unsupported recommendation
- false absence/refusal language
- safety or grounding violation


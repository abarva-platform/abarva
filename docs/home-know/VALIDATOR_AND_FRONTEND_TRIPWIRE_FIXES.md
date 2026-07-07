# Validator And Frontend Tripwire Fixes

## Backend Rule

Validators must not rewrite a valid dossier answer into weak fallback text when
usable evidence exists. The backend may sanitize critical safety/internal-token
leaks, but it should preserve sourced synthesis when evidence exists through any
supported channel.

## Frontend Rule

The frontend must not infer no-data from weak prose, missing facts, missing
tables, missing charts, or a generic safety flag.

It may render:

`I do not see that in the loaded data.`

only when the backend returns:

```json
{
  "answerStatus": "no_data",
  "safety": {
    "usableEvidence": false,
    "evidenceStatus": "empty_dossier"
  }
}
```

If a safety tripwire fires while usable evidence exists, the frontend renders a
validation message instead of false no-data:

`This Home answer needs validation before it can be shown.`

## Regression Coverage

- Zero-fact vendor/application dossiers with tables/charts/graphs/citations pass
  usable evidence.
- Empty dossiers fail usable evidence.
- Harmless `decision support` / `operating decisions` phrasing no longer erases
  sourced prose.
- Recommendation questions still route as handoffs.
- Raw IDs and internal/debug language remain blocked or sanitized.

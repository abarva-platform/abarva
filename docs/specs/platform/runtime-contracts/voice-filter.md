# Voice Filter Contract

Why this contract matters: Nexus output quality depends on two distinct filters staying stable during both streaming and post-stream cleanup. When a future change weakens either layer, internal tags or generic assistant phrasing leak directly into the product.

## Source of truth

- `src/lib/nexus/voiceFilter.ts`

## Two-phase filtering model

`applyVoiceFilter(text)` always runs in this order:

1. Strip internal signal tags
2. Strip forbidden phrases

Return shape:

- `cleaned: string`
- `strippedCount: number`
- `issues: string[]`

After stripping, whitespace is normalized with:

- multiple spaces collapsed
- spaces before punctuation removed
- final output trimmed

## Internal signal tag stripping

`INTERNAL_SIGNAL_TAG` is:

```ts
/<([a-z][a-z0-9_]*)>([\s\S]*?)<\/\1>/g
```

It matches:

- snake_case or lowercase ASCII tag names only
- a matching closing tag
- any inner content

It only strips a matched tag if `contentLooksLikeJson(inner)` returns true.

`contentLooksLikeJson()` rules:

- inner text must start with `{` and end with `}`
- valid JSON returns true
- malformed streamed JSON can still pass if it matches a permissive key/value pattern like `\"foo\":`

This is why legitimate prose markup like `<em>foo</em>` is preserved while tags such as `<gate_approval>{...}</gate_approval>` are removed.

## Forbidden phrase list

The current shipped forbidden patterns are:

- `as an AI (language )?model`
- `I think`
- `I believe`
- `I feel`
- `great question`
- `let me know if you need anything else`
- `hope that helps`
- `I apologize`
- `I'm sorry`
- `I'll try my best`

These are case-insensitive and removed globally.

## `issues` semantics

When internal tags are stripped, `issues` includes:

- `Stripped N internal signal tag(s) (...)`

When forbidden phrases are stripped, `issues` includes:

- `Stripped N forbidden phrase(s)`

`strippedCount` is the total across both classes.

## Streaming behavior

`liveStripInternalTags(text)` is the streaming-safe companion to `applyVoiceFilter()`.

Behavior:

- if no opening XML-like tag exists, return text unchanged
- if a full internal tag block is present, remove only those blocks whose inner content looks JSON-shaped
- if an opening tag has streamed but the closing tag has not arrived yet, cut output at the first opening tag and return only the visible prefix

This is what prevents a partial `<gate_approval>{` scaffold from flashing in the UI mid-stream.

## Structured payload filtering

`filterPayload(payload)` recursively walks:

- strings
- arrays
- objects

For every string value it runs `applyVoiceFilter()`.

Return shape:

- `filtered`
- `strippedCount`

This is for structured format outputs, not just plain text chat output.

## Change safety notes

- Do not turn the tag stripper into a hardcoded allowlist unless the route stack is updated at the same time; the current design deliberately closes the whole `<foo_bar>{json}</foo_bar>` class.
- Do not strip arbitrary HTML-like tags without the JSON-shape guard; that would break legitimate markup.
- Do not change streaming behavior independently of post-stream behavior; they are paired contracts.

## Changelog

- 2026-04-21: Initial contract doc authored from shipped source

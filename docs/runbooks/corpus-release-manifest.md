# Corpus Release Manifest Runbook

Status: active
Owner: AbarVa knowledge/corpus operations
Audience: corpus author, engineer, pilot operator
Backlog task: T040 - Version + tag industry corpus releases

Use this runbook when committed industry-corpus inputs change and the corpus
release needs a fresh manifest with checksums.

## What The Manifest Covers

The generator hashes committed corpus-release inputs from:

| Root | Purpose |
| --- | --- |
| `docs/knowledge-corpus/` | Schema, provenance, curation, validation, and generated corpus evidence. |
| `docs/pattern-library/` | Pattern-library source documents used by corpus authorship and retrieval. |
| `scripts/knowledge-data/` | Industry corpus source text packs. |
| `scripts/corpus/` | Corpus generation and reporting scripts. |
| `scripts/corpus-generation/` | Overlay generation scripts for industry-specific corpus waves. |

`docs/knowledge-corpus/releases/` is intentionally excluded so generated
manifest files do not hash themselves.

## Generate Or Refresh

Run:

```bash
npm run corpus:release-manifest
```

This writes:

- `docs/knowledge-corpus/releases/corpus-release-manifest.json`
- `docs/knowledge-corpus/releases/README.md`

## Check Idempotence

Run:

```bash
npm run corpus:release-manifest:check
```

The check passes only when the committed manifest matches the current corpus
inputs. A diff means either the corpus changed and the manifest must be
refreshed, or someone edited generated manifest files directly.

## Release ID And Version

The default seeded release is:

| Field | Default |
| --- | --- |
| Release ID | `corpus-release-2026-06-02` |
| Version | `v1.0` |
| Manifest date | `2026-06-02` |

Override when intentionally creating a new corpus release:

```bash
CORPUS_RELEASE_ID=corpus-release-YYYY-MM-DD \
CORPUS_RELEASE_VERSION=v1.1 \
CORPUS_RELEASE_DATE=YYYY-MM-DD \
npm run corpus:release-manifest
```

## Client / Pilot Pinning

When a client or pilot environment needs a fixed corpus version, record:

- `releaseId`
- `version`
- `aggregateSha256`
- JSON manifest path
- commit SHA containing the manifest
- any client-specific overlay or exclusions

Do not claim a client is pinned to a corpus release unless those fields are in
the pilot record or release evidence.

## Review Checklist

- [ ] Corpus source files changed intentionally.
- [ ] `npm run corpus:release-manifest` was run.
- [ ] `npm run corpus:release-manifest:check` passes.
- [ ] Aggregate SHA-256 changed only when corpus inputs changed.
- [ ] Release record explains whether the change affects internal corpus
      governance or a specific client/pilot pin.
- [ ] No private client data was added to public corpus roots.

## Rollback

Revert the corpus source change and regenerated manifest together. Do not
revert only the manifest, because that leaves the checksum release evidence
untrustworthy.

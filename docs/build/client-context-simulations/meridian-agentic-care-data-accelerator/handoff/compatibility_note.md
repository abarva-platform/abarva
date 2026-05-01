# Compatibility Note

Wave: `MH-PROG-AGENTIC-CARE-DATA-ACCELERATOR-WAVE-1`

## Index compatibility

- Published index: `abarva-knowledge-corpus-prod`
- Embedding model: `text-embedding-3-large`
- Embedding dimension used for publication: `1024`

## Corpus class mapping

- `abarva-knowledge-corpus-prod` (1024-dim): yes, this wave is published here.
- `abarva-tenant-context-prod` (1536-dim): not published in this wave.
- `abarva-worldview-prod` (3072-dim): not published in this wave.

## App query-path status

Status: **published but not app-wired**.

Reason:
- We have publication audits for index load.
- We do not yet have verified evidence in this thread that live app query paths are pointed at these namespaces for this tenant/program.
- No browser/API smoke proof has been captured here for Nexus/Sentinel/Atlas/Steward against this exact wave.

Required to change status to app-wired:
1. Confirm app retrieval configuration references this index + namespaces for tenant/program.
2. Run browser/API smoke tests for 5-10 validation questions.
3. Capture retrieved IDs and response behavior by agent.

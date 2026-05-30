# Intelligence Context Crawl Fan-Out Verification

Date: 2026-05-29

## Trigger

After PR #2443 deployed, live `/api/health` stayed green, but the authenticated
post-deploy crawl produced `EMAXCONNSESSION` logs on `/intelligence` from the
Enterprise Context overview loader.

## Finding

The Enterprise Context overview loader counted eight tables concurrently and
also fetched records, sources, quality rows, and evidence rows concurrently.
During crawl bursts this created unnecessary session-mode pressure.

## Change

- Enterprise Context table counts now run sequentially.
- Enterprise Context overview row fetches now run sequentially.
- The summarization output remains unchanged.

## Validation

- PASS: focused Enterprise Context read-model Jest test.
- PASS: added regression test asserting max active mocked DB queries is `1`.

## Rollback

Revert the PR. No schema or data rollback required.

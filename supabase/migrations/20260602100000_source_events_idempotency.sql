-- source_events idempotency · enforce uniqueness on (client_key, event_code).
--
-- Why: createSourcingEvent() generates an event_code deterministically from
-- (client_key, event_name) but until now the DB allowed duplicate rows. On
-- network retry, double-clicks, or replayed agent tool calls this produced
-- ghost duplicates that broke the value-proof loop and the operator audit
-- trail. The application layer is being switched to ON CONFLICT DO UPDATE on
-- this same pair; that requires the constraint to exist.
--
-- Conservative path: if duplicate (client_key, event_code) groups already
-- exist, ABORT with a clear message that lists each offending pair. The
-- operator must run `scripts/source-events-dedup.ts --apply` first to
-- soft-archive the dupes, then re-run the migration. This avoids silently
-- swallowing data that downstream substrate rows (artifacts, criteria,
-- value-proof entries) may already reference.

DO $$
DECLARE
  dup_count INT;
  dup_record RECORD;
  dup_list TEXT := '';
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT client_key, event_code
    FROM source_events
    GROUP BY client_key, event_code
    HAVING COUNT(*) > 1
  ) duplicates;

  IF dup_count > 0 THEN
    FOR dup_record IN
      SELECT client_key, event_code, COUNT(*) AS occurrences
      FROM source_events
      GROUP BY client_key, event_code
      HAVING COUNT(*) > 1
      ORDER BY client_key, event_code
    LOOP
      dup_list := dup_list || format(
        E'\n  - client_key=%L event_code=%L count=%s',
        dup_record.client_key,
        dup_record.event_code,
        dup_record.occurrences
      );
    END LOOP;

    RAISE EXCEPTION
      'source_events has % duplicate (client_key, event_code) group(s); aborting unique constraint creation. Run `npx tsx scripts/source-events-dedup.ts --apply` to soft-archive the duplicates, then re-run this migration. Offending groups:%',
      dup_count,
      dup_list;
  END IF;
END$$;

ALTER TABLE source_events
  ADD CONSTRAINT source_events_client_event_code_unique
  UNIQUE (client_key, event_code);

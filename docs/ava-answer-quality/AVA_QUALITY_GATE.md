# Ava Quality Gate

The gate lives at `src/lib/ava-answer/validateAvaAnswerPacket.ts`.

It fails answers that expose:

- `Read:`
- `Evidence:`
- `Evidence points`
- `Current-state read`
- raw UUIDs
- raw table names
- `read-model`
- route/debug/scaffold labels
- row-count-first lead sentences
- Home recommendations
- Home expert-pack participation

Partial and no-data answers must include a gap. Home answers should include a plain-English interpretation.

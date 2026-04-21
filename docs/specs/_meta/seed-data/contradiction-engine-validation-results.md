# Contradiction Engine Foundation · Validation Results

Validation run for the contradiction-engine foundation on `codex/contradiction-engine`.

## Migration results

Initial foundation migration run:

```text
✓  Connected to Postgres

Pending migrations (1):
   - 20260421152700_contradiction_engine_foundation.sql

→ 20260421152700_contradiction_engine_foundation.sql ... ✓

✓  1 migration applied.
```

Follow-up timestamp fix migration after the first seed pass exposed the trigger issue on `contradiction_detection_rules`:

```text
✓  Connected to Postgres

Pending migrations (1):
   - 20260421152800_contradiction_rule_updated_at_fix.sql

→ 20260421152800_contradiction_rule_updated_at_fix.sql ... ✓

✓  1 migration applied.
```

## Seed results

Raw output from `npm run db:seed:contradictions`:

```text
Contradiction engine seeded
  access scopes       · 16
  detection rules     · 15
  detection runs      · 20
  contradictions      · 20
  evidence rows       · 46
  evidence links      · 46
```

## Verification results

Raw output from `npm run db:verify:contradictions`:

```text
Contradiction engine verification
  PASS - contradiction access scopes = 16 - 16
  PASS - detection rules = 15 - 15
  PASS - detection runs = 20 - 20
  PASS - seeded contradictions = 20 - 20
  PASS - seeded evidence = 46 - 46
  PASS - contradiction evidence links = 46 - 46
  PASS - category A rows = 4 - 4
  PASS - category B rows = 4 - 4
  PASS - category C rows = 4 - 4
  PASS - category D rows = 4 - 4
  PASS - category E rows = 4 - 4
  PASS - all seeded contradictions scoped - 0
```

## Smoke results

Raw output from `npm run db:smoke:contradictions`:

```text
Q: Create a Category A contradiction on Apex tenant
A: Temp contradiction for schema smoke created under A_strategy_allocation
PASS: yes

Q: Query all open contradictions on Meridian
A: 5 open seeded contradictions returned for Meridian
PASS: yes

Q: Update a contradiction to resolved
A: aa50ba6b-3ec4-4405-adc0-9b54336bb2aa moved to resolved
PASS: yes

Q: Deduplicate overlapping detection
A: Matched existing Apex contradiction at index 0
PASS: yes

Q: Run A-R1 on Apex
A: Digital commerce is still underfunded relative to lower-ranked efficiency work
PASS: yes

Q: Run C-R1 on First Capital
A: Declared AML sponsor attendance is too thin for the risk profile of the program
PASS: yes

Q: Run E-R1 on Keystone
A: "AI-first grid operator" positioning is ahead of Keystone's internal maturity and governance reality
PASS: yes

Q: Query "what am I missing?" at Apex tenant
A: Digital commerce is still underfunded relative to lower-ranked efficiency work [A_strategy_allocation] | Apex reaffirmed digital growth promises that current conversion and loyalty trajectories do not support [B_commitment_pace] | Frictionless omnichannel messaging overstates the current fulfillment reality [E_external_internal_messaging]
PASS: yes

Q: Prepare conversation with Daniel Kovač
A: Apex reaffirmed digital growth promises that current conversion and loyalty trajectories do not support | Digital commerce is still underfunded relative to lower-ranked efficiency work
PASS: yes

Q: Strategic discussion about digital transformation
A: Digital commerce is still underfunded relative to lower-ranked efficiency work | Apex reaffirmed digital growth promises that current conversion and loyalty trajectories do not support
PASS: yes

Q: Contradiction with high sensitivity visible to program lead
A: Disclosure mode = full
PASS: yes

Q: Same contradiction visible to broader program audience
A: Disclosure mode = informed_indirection
PASS: yes

Q: Contradiction with severe sensitivity in cross-program context
A: Disclosure mode = reasoning_only
PASS: yes
```

## Notes

1. The foundation intentionally extends the existing `contradictions` table rather than creating a second contradiction universe, so current Tower readers keep working while the north-star fields land.
2. The foundation also adds `summary` and `impact` because existing retrieval and signal-sync code already queried those fields even though the original Tower table had never defined them.
3. A small follow-up migration (`20260421152800_contradiction_rule_updated_at_fix.sql`) was required after the first seed pass exposed a trigger/runtime mismatch on `contradiction_detection_rules`.
4. The seeded foundation includes 20 contradiction examples across 4 composite tenants and all 5 contradiction categories, with 46 linked evidence rows. This is enough for foundational rule, disclosure, and surfacing validation without pretending full production-grade rule evaluation already exists.

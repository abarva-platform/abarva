# Executive Profile System · Validation Results

Validation run for the executive-profile schema and composite-profile seed on `codex/executive-profile-system`.

## Migration results

Raw output from `npm run db:migrate`:

```text
✓  Connected to Postgres

Pending migrations (1):
   - 20260421152600_executive_profiles.sql

→ 20260421152600_executive_profiles.sql ... ✓

✓  1 migration applied.
```

## Seed results

Raw output from `npm run db:seed:executive-profiles`:

```text
Executive profiles seeded
  access scopes      · 4
  composite profiles · 4
  career rows        · 8
  statement rows     · 4
  persona overrides  · 4
  real-world profiles · SKIPPED (ethics review required)
  pending ethics set  · Prat Vemana · Shail Jain · Tim Peterson · Ranjan Goswami
```

## Verification results

Raw output from `npm run db:verify:executive-profiles`:

```text
Executive profile verification
  PASS · executive profiles >= 4 · 4
  PASS · composite profiles = 4 · 4
  PASS · career history rows >= 8 · 8
  PASS · public statements >= 4 · 4
  PASS · persona overrides = 4 · 4
  PASS · all composite profiles scoped · 0
  PASS · all composite profiles linked to persons · 0
```

## Smoke results

Raw output from `npm run db:smoke:executive-profiles`:

```text
Q: Composite Keystone maestro greets Jonathan
A: Jonathan, let's start from the combined customer-and-technology mandate and the multi-jurisdictional complexity you're carrying.
PASS: yes

Q: Apex maestro responds to a loyalty question posed as the customer executive
A: Karel profile leads with customer experience, loyalty evolution, customer data fragmentation and expects customer-outcome framing before capability talk.
PASS: yes

Q: Meridian maestro briefs on Linda Chen-Winters as subject
A: Linda Chen-Winters: VBC progression on the payer side | MA star-rating and member retention performance | Tighter health-plan and provider economics alignment. HIPAA baseline acknowledged.
PASS: yes

Q: First Capital maestro frames a finance conversation correctly
A: Elaine: What does this do to capital? | What is the regulatory implication? | How do we defend the assumptions?
PASS: yes

Q: Can a Meridian program maestro see Prat's real-world profile?
A: Real-world executive profiles remain unseeded until Anand completes ethics review.
PASS: yes
```

## Notes

1. The real-world executive profiles are intentionally not seeded in this PR. The code path stops short of ingesting them until Anand completes the ethics review called for in the source spec.
2. Two names in `executive-profile-system.md` conflicted with the current authoritative composite seeds:
   - Apex customer executive seeded as `Karel Jensen` rather than the older `Marcus Whitfield` reference
   - First Capital finance executive seeded as `Elaine Burakovsky-Park` rather than the older `Daniel Kovač` reference
3. `src/lib/agent/prompts/_shared/user-context.ts` now falls back to `executive_profiles` if a matching `vip_profiles` row is absent, which is the minimal integration hook required by the spec without replacing the existing VIP system.

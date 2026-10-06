# 2026-09-20-remove-pilot-identities-from-source — an access list that was also a profile

## Release ID

`2026-09-20-remove-pilot-identities-from-source`

## Status

`candidate`

## Plain-English Summary

A pilot access map in `src/lib/client-config.ts` carried, beside each address,
the person's full name, their job title and in one case their employer. This
repository is public.

That turns an access list into a published profile of **who is piloting what**
— a disclosure about those individuals and their organisations, not about this
code. The identifying detail is removed.

**No access changed.** The map's keys and values are byte-identical; only
trailing comments were deleted.

## Why the addresses stay

Each address **is** the grant. Removing or altering one changes who can reach a
tenant, which is a security change and not what this is. The addresses remain
exactly as they were; what has gone is the name, title and employer written
next to them.

Who an address belongs to is ops-only information and belongs wherever the
engagement records are kept, not in a public source file. That reasoning is now
a comment on the map, so the next person adding an entry sees it before they
add a name.

## The remaining exposure, which this does NOT fix

Scrubbing one file while the same information sits in others would look like a
resolution without being one, so the rest was searched for and is recorded
here. The same identities appear in:

- **three historical release records**, including one that ties a named
  individual to their employer and their access grant, and one whose
  **filename contains a person's given name**;
- **two generated report artifacts** under `reports/`.

None of that is touched here, deliberately. Editing historical release records
is a governance act rather than a code cleanup: they are the audit trail of
what was decided and when, the release-record contract is enforced in CI, and
renaming a record file has consequences beyond disclosure. Doing that silently
inside a change described as "remove comments" would be the wrong way to do a
right thing.

**It needs a decision, and it is the larger share of the exposure.** This
change removes the instance that sits in shipped source and is read by every
engineer who opens the access map; it does not clear the repository.

## Layer Impact

- `global-control-lane`. Comments in one source file. No product surface,
  tenant data, schema, projection, migration, flag, code path, or runtime
  behaviour, and **no change to any access grant**.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: no — this is a
  public-repository disclosure change
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/lib/client-config.ts` — identifying comments removed from the pilot map;
  a note added explaining why the addresses stay and the identities do not.

## QA / Validation

Measured on base `b1740c369`.

| What | Result |
|---|---|
| Map keys and values | **byte-identical** — diff is comments only |
| `src/lib/auth` suites | unchanged: 6 failed / 13 passed, 11 failing cases |
| `tsc` (exit code) | 0 |
| `release-check` | passed |

The auth suites were run specifically because this file is an access map: an
unchanged failure count is the evidence that no grant moved. The diff was also
read line by line to confirm every key and value survived unedited — a comment
change to an access list is exactly the kind of edit where an accidental
character would be quiet and serious.

## Rollout Plan

Merge to `main`. No behaviour change of any kind. No image build, migration,
flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. That restores the identifying comments, which is the thing this
change exists to remove — so a rollback here should be deliberate rather than
reflexive.

## Audit Evidence

- The diff, showing comment-only changes to the map.
- The unchanged auth suite counts.

## Known Gaps

- **The larger share of the exposure remains**, in three historical release
  records and two generated reports, and needs a decision about amending
  audit history.
- **Git history still contains the removed comments.** Removing a line from
  the working tree does not remove it from the repository's past, and anyone
  who has cloned already has it.
- **One address carries an employer in the domain itself.** That cannot be
  changed without changing the grant, so it stays.
- **Nothing prevents the next one.** No gate checks for a personal name beside
  an access entry; the new comment is guidance, not enforcement.

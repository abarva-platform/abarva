# Privacy and security control questions (PHI)

**SYNTHETIC - NOT CLIENT-ATTESTED.** No real privacy assessment, no DPIA, and no
approved control attestation is represented here. This is a question set, not a
finding.

## Candidate controls for design review

1. PHI access follows minimum necessary: each consumer gets only the fields and
   population its approved purpose requires.
2. Behavioral-health and other 42 CFR Part 2 protected data are segmented and
   released only under an explicit consent model.
3. De-identification or a limited-data-set path exists for analytics that do not
   need identified PHI; re-identification risk is reviewed.
4. Small-cell suppression protects aggregate outputs; the threshold is set by the
   privacy owner, not by the report author.
5. Every PHI export is logged with purpose, scope, and approver; break-the-glass
   access is exceptional, reviewed, and time-boxed.
6. Data shared with any processor is covered by an executed business-associate
   agreement before data moves.
7. Model context never receives raw PHI through an ungoverned path.

## Still required before this is a client fact

The real privacy review, the executed agreements, the de-identification policy,
the suppression threshold, and the named privacy and security owners are not
established here and must be confirmed with the client's compliance function.

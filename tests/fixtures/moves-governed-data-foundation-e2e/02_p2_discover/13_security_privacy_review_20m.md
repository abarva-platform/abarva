# Synthetic security and privacy review session (20 minutes)

**SYNTHETIC SESSION RECORD - NOT CLIENT-ATTESTED.** Role aliases and scripted
responses are fictional. This is a test input, not an actual security approval.

## Attendees

`ROLE-SECURITY` (security/privacy partner), `ROLE-DATA-PLATFORM` (platform
architect), `ROLE-HR-OWNER` (business owner), and `ROLE-DELIVERY` (delivery
lead). No person names or personal data are included.

## Scripted review

**00:00-00:04 | Scope.** The team confirms the candidate product is ten
aggregate HR analytics reports. This does not authorize employment decisions,
predictive scoring, free-text analysis, or a broader HR process redesign.

**00:04-00:08 | Data minimization.** The source-to-report field allowlist is not
yet approved. Direct identifiers, free text, health details, credentials, and
unnecessary row-level fields must be excluded. A role-based worker key may be
used only if the source owner and privacy reviewer approve its purpose.

**00:08-00:12 | Environment and access.** No production extract may enter a
development environment until approved. Use synthetic samples for development;
where production-like test is essential, document masking, access, retention,
and destruction proof first. Store credentials only in the approved secret
manager.

**00:12-00:16 | Publication.** Gold publication and report release require
certified definitions, critical quality checks, privacy suppression, freshness
status, and an accountable business review. Failed rules quarantine or hold the
affected output; they do not become caveats hidden from consumers.

**00:16-00:20 | Decision.** This session records questions and proposed stop
conditions only. It does **not** approve production access, controls, an
architecture, a risk rating, a retention period, or a release. The authorized
workspace user may accept this synthetic file for workflow testing; actual
security authority must be obtained during real delivery.

## Required follow-up evidence

1. Approved purpose and report audience.
2. Field-level source allowlist and prohibited-field tests.
3. Access-role matrix, entitlement expiry, and audit sample.
4. Small-cell suppression rule with test evidence.
5. Retention and deletion schedule.
6. Environment/data movement controls.
7. Incident-response ownership and publication decision rights.

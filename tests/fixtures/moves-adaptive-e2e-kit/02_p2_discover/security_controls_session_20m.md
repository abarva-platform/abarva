# P2 Privacy and Controls Follow-up — synthetic session

Evidence ID: SYN-SESSION-SEC-01
Participants by role: Privacy Officer; Compliance Lead; Security Architect; Product Owner
Duration: 20 minutes
Status: Synthetic workshop record; product reviewer must still explicitly approve extracted policy

- 00:00-04:00: Demo data must contain no real member identifiers, PHI, credentials, or copied client records.
- 04:00-08:00: Assistant may retrieve authorized operational status and approved knowledge. It may not decide medical necessity, eligibility, coverage, claim disposition, or prior authorization.
- 08:00-12:00: Output remains a draft for a human agent. No automatic CRM/claims writeback or external message in the initial pilot.
- 12:00-16:00: Every surfaced source needs owner and freshness where available; abstain/escalate when stale or conflicting.
- 16:00-20:00: Vendor terms must prohibit training/reuse of restricted data and state retention/deletion. Privacy/security and legal review remain launch prerequisites.

Decision: Use red_lines_validated.csv as the synthetic test oracle only after a human reviewer explicitly approves the extracted policy record.

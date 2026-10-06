# Privacy and security control questions

**SYNTHETIC - NOT CLIENT-ATTESTED.** This checklist is a proposed control
baseline, not legal advice, a privacy determination, or evidence of controls in
operation.

| Control area | Minimum design question | Proposed evidence before production |
|---|---|---|
| Purpose limitation | Which HR decisions and audiences are in scope? | Approved purpose and report-to-purpose mapping |
| Data minimization | Which fields are necessary for each report? | Field-level allowlist and rejected-field record |
| Access | Who can access raw, conformed, aggregate, and reports? | Role matrix, entitlement approval, access test |
| Small cells | Which aggregation threshold prevents re-identification risk? | Privacy-owner-approved rule and test cases |
| Free text | Are notes/comments excluded from ingestion? | Schema rejection and scan test |
| Encryption | How are source files, layers, extracts, and backups protected? | Platform configuration evidence and key ownership |
| Retention | How long are raw and derived data retained? | Approved schedule and verified delete workflow |
| Audit | Can access, query, export, and publication be traced? | Sample audit event and retention proof |
| Environments | Can production data enter nonproduction? | Data movement policy, access controls, test result |
| Incident response | Who contains exposure and reports it? | Tested escalation and containment runbook |

## Stop conditions

Do not ingest source records until the exact fields, purpose, access scope,
retention, suppression policy, and accountable privacy/security approver are
known. A synthetic sample is not a substitute for a privacy review. Do not
send raw or person-level HR data to a model or coding assistant.

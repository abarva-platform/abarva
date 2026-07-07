# Sales Execution Proof Kit

Status: candidate

Owner: AbarVa founder/operator

Backlog rows: T063, T254, T256, T257, T258, T264, T269, T277, T284-T304

## Purpose

The Sales backlog now has strong drafted assets, but most rows are correctly
still `In progress` because they need founder approval, outreach evidence,
meeting proof, client discovery notes, or a clean no-go decision. This kit
creates the operating proof layer between a drafted sales asset and a row that
can honestly move to `Done`.

Use this kit for PHS, KK/Delta, Surekha/Morgan Street, and backup prospects.
It is not a CRM replacement and it is not approval to send any message. It is a
controlled way to record what was approved, what was sent, who responded, what
was learned, and which tracker row can close.

## Proof Rule

No Sales row moves to `Done` based only on a repo draft, account research, or a
playbook. The row needs at least one of the following evidence types:

- founder-approved outbound message or deck,
- calendar invite or meeting completion proof,
- discovery notes with named decision owner and next step,
- approved SOW / commercial paper / no-go decision,
- sent/scheduled nurture touch with the exact approved copy,
- client-provided data, source evidence, or direct confirmation,
- or a founder decision that the row is intentionally closed as not pursued.

## Evidence Log Schema

Copy this table into the CRM, spreadsheet, or founder operating packet for each
sales action.

| Field | Required? | Notes |
| --- | --- | --- |
| Backlog row | Yes | Example: T284, T300, T354. |
| Prospect / account | Yes | PHS, Delta, Morgan Street, or backup prospect. |
| Contact / role | Yes | Name only if already known and appropriate to record. |
| Action type | Yes | Email, LinkedIn, call, workshop, SOW review, no-go, follow-up. |
| Asset used | Yes | Link to repo artifact, deck, memo, worksheet, or message. |
| Approval owner | Yes | Founder, counsel, advisor, or sponsor. |
| Approval timestamp | Yes | Date/time or meeting note reference. |
| Sent / scheduled timestamp | Conditional | Required for outreach/cadence rows. |
| Meeting timestamp | Conditional | Required for discovery/workshop rows. |
| Evidence captured | Yes | Notes, transcript, screenshot, calendar invite, or decision log. |
| Decision owner learned | Conditional | Required for decision-chain rows. |
| Budget / pain validation | Conditional | Required for CDAO/budget/pain rows. |
| Next step | Yes | Specific date, owner, and ask. |
| Done recommendation | Yes | Done, still in progress, no-go, or blocked. |

## Founder Approval Checklist

Use before sending any executive note, deck, SOW starter, or peer-pattern
follow-up.

| Check | Pass criteria |
| --- | --- |
| Source boundary | Public claims are cited or removed. No invented renewal, budget, vendor, or org-chart claims. |
| Human decision boundary | Copy says AbarVa supports decisions; it does not make autonomous commitments. |
| Client specificity | Message names the prospect's real context without pretending discovery happened. |
| Legal/procurement caution | SOW, pricing, indemnity, reference-rights, or case-study language goes through counsel/founder review. |
| Data boundary | No promise of live data loading until private data-plane approval and client permission exist. |
| Ask clarity | The recipient has one clear next action: debrief, working session, review, or decision meeting. |
| Row evidence | The approved copy can be tied back to one or more backlog row IDs. |

## PHS Execution Proof Path

Rows covered: T252, T253, T254, T255, T256, T257, T260, T261, T262, T263,
T264, T284, T285, T286, T287, T288, T289, T290, T291.

| Stage | Evidence required | Done candidate rows |
| --- | --- | --- |
| Founder approves CDAO memo and pitch deck | Approved memo/deck link plus approval note. | T256, T257 |
| Usage debrief call happens | Calendar proof and notes on what was tried, what worked, and what is missing. | T254, T284 |
| Decision chain is mapped | Named sponsor, sourcing partner, CIO/CFO/procurement path, and unresolved unknowns. | T286, T262 |
| Budget and pain are validated | Direct notes on budget authority, priority, AI pressure, and success criteria. | T253, T252, T255 |
| Joint working session happens | 90-minute session notes, candidate Moves, value math, and Azure/Databricks fit. | T261, T264, T285, T287 |
| SOW is iterated | Draft SOW, redlines, legal/procurement blockers, and next decision date. | T288, T289, T290 |
| Verbal alignment or no-go is captured | Written note of agreed pilot path, decision meeting, kickoff, or clean no-go. | T291 |

## KK / Delta Execution Proof Path

Rows covered: T265, T266, T267, T278, T279, T280, T292, T293, T294, T295,
T296, T297, T298, T299.

| Stage | Evidence required | Done candidate rows |
| --- | --- | --- |
| Usage debrief happens | Notes from KK/team on product-dev, AI, governance, methodology, and measurement fit. | T279, T292 |
| Software-delivery corpus decision is made | Founder decision to proceed with corpus wave or reposition as governance/measurement. | T293, T294 |
| CTO modernization positioning is approved | Founder-approved narrative that avoids unsupported AI/product-dev claims. | T266 |
| Lane A / Lane B SOW path is approved | Draft SOW or no-go criteria with value levers and evidence gaps. | T267, T280, T296 |
| Working session happens | Notes on methodology vs measurement itch and decision owner. | T295 |
| SOW/no-go decision is captured | Redlines, decision meeting, signed alignment, or clean no-go note. | T297, T298, T299 |
| Delta public research is validated | Direct or public confirmation of relevant investment/vendor/modernization context. | T265, T278 |

## Surekha / Morgan Street Execution Proof Path

Rows covered: T273, T274, T275, T276, T300, T301, T302, T303, T304.

| Stage | Evidence required | Done candidate rows |
| --- | --- | --- |
| Nurture timing is approved | Founder-approved send window and exact text. | T272 |
| LinkedIn or first-touch note is sent/scheduled | Sent/scheduled proof and approved copy. | T300 |
| Value piece is sent/scheduled | Approved 100-day framework or value piece plus send proof. | T273, T301 |
| Peer-pattern follow-up is sent/scheduled | Approved copy that does not imply unauthorized reference rights. | T302 |
| Starting-week meeting ask is sent | Approved July 1 first-week note and send/schedule proof. | T303 |
| Discovery call or working session happens | Notes, Move candidates, success criteria, and next step. | T274, T275, T304 |
| Pilot SOW starter is approved | Founder/counsel review and finalized success criteria. | T276 |

## Backup Prospect Business Case Proof

Rows covered: T258 and supporting backup-prospect rows.

Backup cases are ready for `Done` only when both backups have:

- named account owner,
- approved one-paragraph business case,
- approved first-touch or follow-up action,
- evidence source or caveat for every account-specific claim,
- and a next action with date and owner.

## Outreach Log Template

| Date | Account | Row | Action | Approved asset | Sent/scheduled? | Response | Next step | Done recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | PHS | T284 | Usage debrief ask | CXO memo v1 | Scheduled | Pending | Confirm CDAO + sourcing attendee | In progress |
| YYYY-MM-DD | Delta | T292 | Usage debrief ask | Delta Lane A/B note | Not yet | Pending founder approval | Approve copy | In progress |
| YYYY-MM-DD | Morgan Street | T300 | LinkedIn note | New-leader note v1 | Not before July 1 | Pending timing | Review July schedule | In progress |

## Meeting Notes Template

```text
Account:
Date:
Attendees:
Backlog rows covered:
What was tried:
What worked:
What did not land:
Decision owner:
Budget / authority signal:
Pain priority:
Evidence or data offered:
Legal / procurement blocker:
Next decision:
Owner:
Date:
Done recommendation:
```

## Done Criteria By Row Type

| Row type | Done only when |
| --- | --- |
| Research | Source evidence or direct discovery confirms the claim, or founder records a no-go/unknown boundary. |
| Memo / deck / one-pager | Founder approves the exact version for use. |
| Outreach / nurture | Message is sent or scheduled with approved text and timing. |
| Discovery call | Call happens and notes capture budget, pain, decision owner, and next step. |
| Working session | Session happens and outputs are attached. |
| SOW / commercial path | Founder/counsel approve the draft or client provides redlines/decision. |
| Decision meeting | Meeting is scheduled or a clean no-go is recorded. |

## Governance Notes

- Do not claim client facts from draft account research without a source or
  direct discovery.
- Do not use peer success language as a reference case unless approved.
- Do not imply that private data loading is available until the private
  data-plane rows have implementation and smoke evidence.
- Do not move rows to `Done` because this kit exists. Move them only when the
  evidence log says the proof happened.

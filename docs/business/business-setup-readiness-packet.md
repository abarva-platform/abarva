# Business Setup Readiness Packet

Status: draft for founder, counsel, CPA, insurance broker, and compliance review

Owner: AbarVa founder/operator

Backlog rows: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012, T013, T014

Purpose: make the non-code company setup work executable without overstating completion. This packet is not legal, tax, insurance, accounting, or trademark advice. A row moves to Done only when the external artifact exists and the evidence is saved.

## Readiness Rule

Every business setup row needs three things before it can be marked Done:

1. Executed artifact or third-party confirmation.
2. Evidence file saved in the company records folder.
3. Tracker note naming the artifact, date, owner, and any renewal deadline.

If the repo only contains a template, checklist, or operating packet, the row remains In progress.

## Evidence Folder Standard

Store executed evidence outside the public repo. Recommended structure:

```text
company-records/
  formation/
  tax-and-banking/
  founder-ip/
  contracts/
  insurance/
  privacy-and-public-policies/
  accounting/
  soc2/
  trademarks-and-domains/
```

Evidence may include signed PDFs, IRS confirmations, secretary-of-state receipts, bank letters, broker binders, policy exports, SOC 2 vendor workspaces, counsel emails, or screenshots from provider dashboards. Do not commit confidential executed documents to the public repository.

## Execution Board

| Row | Workstream | Required external artifact | Repo-controlled prep | Done evidence |
| --- | --- | --- | --- | --- |
| T001 | Delaware incorporation | Filed certificate, company formation record, cap table setup | Founder decision checklist below | Delaware filing receipt and company formation packet |
| T002 | 83(b) election | Timely mailed/filed 83(b), proof of mailing | Deadline and evidence checklist below | Copy of signed 83(b), IRS mail proof, board/share grant reference |
| T003 | EIN and banking | EIN confirmation, business bank account | Banking packet below | EIN letter, bank account confirmation, authorized signer record |
| T004 | Foreign qualification | State qualification or counsel decision not required yet | State operating checklist below | State filing receipt or counsel memo |
| T005 | Founder employment and IP assignment | Executed employment, invention assignment, confidentiality, IP transfer | Founder IP checklist below | Signed agreements and board/company approval evidence |
| T006 | Tech lawyer engagement | Signed engagement letter and review scope | Counsel intake packet below | Engagement letter and counsel contact record |
| T007 | Insurance | Bound cyber/E&O/general liability policies | Broker intake packet below | Binder, policy numbers, limits, exclusions, retroactive date |
| T008 | Trademark | USPTO filing or counsel decision | Trademark readiness checklist below | Filing receipt, serial number, specimen record |
| T009 | Domains | Locked domains and registrar security | Domain checklist below | Registrar screenshots, renewal dates, 2FA proof |
| T010 | Privacy, ToS, AUP | Published policies approved by counsel | Public policy starter outline below | Published URLs, approval record, version/date |
| T011 | Bookkeeping | Accounting system and operating cadence | Bookkeeping packet below | Vendor/account setup, chart of accounts, monthly close owner |
| T012 | CPA consult | CPA recommendation on tax timing and founder compensation | CPA agenda below | CPA memo or email with decisions and open items |
| T013 | SOC 2 Type 1 | Vendor workspace, scoped controls, owner assignment | SOC 2 launch checklist below | Vanta/Drata workspace evidence, auditor plan, control owners |
| T014 | SOC 2 Type 2 | Observation-window start plan | SOC 2 observation checklist below | Type 2 observation start date and monitoring evidence |

## T001 - Incorporation Packet

Minimum decisions to settle before filing:

- Entity type: Delaware C-Corp unless counsel says otherwise.
- Company legal name and DBA/domain alignment.
- Founder equity, vesting, acceleration, and repurchase terms.
- Initial board/stockholder consent.
- Registered agent and principal office.
- Initial IP contribution model.
- Whether formation provider is Atlas, Clerky, or law firm.

Done evidence:

- Delaware certificate or filing receipt.
- Formation provider packet or counsel closing set.
- Cap table export.
- Initial board consent.
- Registered agent confirmation.

## T002 - 83(b) Deadline Control

The 83(b) election is deadline-sensitive. Treat this as a calendar-controlled task with no silent assumptions.

Required packet:

- Stock grant date.
- 30-day deadline.
- Signed 83(b) election.
- IRS mailing method and tracking number.
- Copy sent to company records.
- Proof of mailing retained.

Do not mark Done until the signed election and mailing evidence are saved.

## T003 - EIN and Banking Packet

Required setup:

- EIN confirmation letter.
- Business bank account.
- Authorized signer record.
- Company address and beneficial ownership information.
- Basic treasury policy for pilot receipts and vendor payments.

Recommended controls:

- Separate operating account from personal funds.
- Use business credit card only after entity and bank setup are complete.
- Save bank letter and account metadata in company records, not in repo.

## T004 - Foreign Qualification Packet

Counsel or formation provider should decide whether AbarVa must foreign qualify in the founder's home state before pilot signing.

Evidence:

- Filing receipt if required.
- Counsel/provider memo if deferred.
- Renewal and registered-agent deadline.

## T005 - Founder Employment and IP Assignment

The objective is to make AbarVa own the product IP, trade secrets, designs, docs, and improvements, subject to counsel-approved employment constraints.

Required agreement areas:

- Proprietary information and invention assignment.
- Pre-existing IP disclosure schedule.
- Assignment of AbarVa-related code, docs, designs, data models, prompts, architectures, and product artifacts.
- Confidentiality and non-use of third-party confidential information.
- Founder role, compensation posture, and board approval.
- Open-source and third-party dependency representation.
- Prior-employer conflict representation reviewed by counsel.

Evidence:

- Signed founder employment or advisor agreement.
- Signed invention assignment.
- Signed pre-existing IP schedule.
- Board/company approval or consent.
- Counsel review note if any carve-outs exist.

## T006 - Counsel Engagement Packet

Counsel should be asked to review:

- Founder/IP assignment packet.
- First-pilot NDA, MSA, SOW, DPA, and security exhibits.
- Privacy Policy, Terms of Service, Acceptable Use Policy.
- Liability, indemnity, data processing, AI responsibility, and IP ownership positions.
- Insurance requirements in customer paper.
- Trademark filing posture.

Evidence:

- Signed engagement letter.
- Named attorney.
- Scope and fee structure.
- Review turnaround expectation.
- Stored issue log.

## T007 - Insurance Broker Packet

Recommended initial quotes:

- Technology E&O.
- Cyber liability.
- General liability.
- Directors and officers coverage when financing, board, or enterprise contracting posture requires it.

Broker intake should include:

- Product overview.
- Target pilot client profile.
- Data classes handled.
- Security posture and Azure/private-data-plane controls.
- AI decision-support language and human-in-the-loop controls.
- Revenue estimate and first-year client count.
- Contract insurance requirements when available.

Evidence:

- Quotes.
- Bound binder.
- Policy numbers.
- Limits, deductibles, exclusions, retroactive dates.
- Certificate of insurance.

## T008 - Trademark Readiness Packet

Before filing:

- Confirm mark, goods/services class, and specimen.
- Check domain and product naming consistency.
- Capture counsel search or clearance recommendation.
- Decide whether to file word mark first.

Evidence:

- Search memo or counsel recommendation.
- Filing receipt and serial number.
- Specimen copy.
- Renewal calendar.

## T009 - Domain Lock Packet

Minimum operational controls:

- Own primary commercial domains.
- Turn on registrar account 2FA.
- Enable domain lock where available.
- Use company-controlled email for registrar account.
- Calendar renewal dates.
- Capture DNS owner and admin contact.

Evidence:

- Registrar screenshots.
- DNS configuration export.
- Renewal calendar entry.
- 2FA/domain-lock proof.

## T010 - Public Policy Starter Pack

Public policy pages should be counsel-approved before customer launch. Starter outline:

- Privacy Policy: data collected, purposes, subprocessors, retention, security, customer data, user rights, contact method.
- Terms of Service: subscription scope, acceptable use, AI decision-support disclaimer, customer responsibilities, IP ownership, liability limits, termination.
- Acceptable Use Policy: prohibited data, prohibited abuse, security testing limits, illegal content, unauthorized scraping, model misuse, harmful decisions.
- AI Use Notice: AI-assisted suggestions require human review, source checking, and customer approval before consequential action.

Evidence:

- Counsel approval or redline.
- Published URLs.
- Version date.
- Change log.

## T011 - Bookkeeping Packet

Minimum setup:

- Accounting system or bookkeeping provider.
- Chart of accounts.
- Monthly close owner.
- Receipt capture process.
- Revenue recognition placeholder for pilot receipts.
- Vendor payment and reimbursement policy.

Evidence:

- System/provider setup confirmation.
- Chart of accounts export.
- First monthly close checklist.

## T012 - CPA Consult Agenda

Ask CPA to cover:

- Entity/tax posture after incorporation.
- Founder compensation timing.
- State tax and sales tax posture.
- R&D credit eligibility and documentation.
- Bookkeeping/chart of accounts.
- Estimated tax and payroll triggers.

Evidence:

- CPA memo or email.
- Decisions and open items.
- Follow-up deadlines.

## T013 - SOC 2 Type 1 Launch Packet

Minimum launch decisions:

- Trust Services Criteria scope.
- Control owner map.
- Evidence collection system.
- Initial policies.
- Access review cadence.
- Vendor inventory.
- Incident response and change-management workflows.
- Data retention and deletion evidence.

Evidence:

- Vendor workspace setup.
- Auditor or advisor plan.
- Control owner assignment.
- Initial evidence snapshot.

## T014 - SOC 2 Type 2 Observation Packet

Do not start Type 2 observation until controls are operating consistently.

Required before observation:

- Access reviews running.
- Vendor reviews running.
- Change-management evidence flowing through GitHub and release records.
- Incident response owner and drill plan.
- Security training completion path.
- Logging and monitoring evidence.

Evidence:

- Observation start date.
- Auditor/advisor confirmation.
- First operating evidence sample.

## Tracker Status Guidance

Suggested tracker updates after this packet lands:

- Move T005, T006, T007, T010, T011, T012, T013, and T014 to In progress if not already started.
- Keep T001, T002, T003, T004, T008, and T009 Not started unless external evidence exists.
- Do not mark any Business Setup row Done from this repo-only packet.

## Open Decisions

- Formation provider: Atlas, Clerky, or law firm.
- Counsel owner and budget.
- CPA owner and budget.
- Insurance broker owner and target bind date.
- SOC 2 platform: Vanta, Drata, or advisor-led manual start.
- Public policy publication host and approval date.
- Domain portfolio to buy/lock.

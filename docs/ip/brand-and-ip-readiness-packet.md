# Brand and IP Readiness Packet

Status: draft for founder and counsel review

Owner: AbarVa founder/operator

Backlog rows: T066, T067, T068, T069, T071, T075

Purpose: convert the open brand, trademark, copyright, trade-secret, and contractor-IP rows into an executable evidence plan. This packet is not legal advice. A row moves to Done only when the external search, filing, inventory, marking, or signed agreement evidence exists.

## Readiness Rule

Every IP row needs:

1. A named owner.
2. A counsel/founder decision or completed filing/search.
3. Evidence stored outside the public repo when confidential.
4. Tracker note naming the artifact, date, and next renewal or follow-up.

Repo checklists, forms, and drafts move rows to In progress only.

## Evidence Folder Standard

Recommended private evidence location:

```text
company-records/
  ip/
    brand-clearance/
    trademark-filings/
    corpus-copyright/
    trade-secrets/
    contractor-ip/
```

Do not commit confidential search reports, signed assignments, employee/contractor personal data, or unreleased trade-secret inventories into the public repo.

## Execution Board

| Row | Workstream | Required artifact | Done evidence |
| --- | --- | --- | --- |
| T066 | AbarVa word mark | USPTO/counsel search, filing decision, application if approved | Search memo, filing receipt or counsel-approved defer memo |
| T067 | Agent brand knockout search | Search for Sentinel, Atlas, Steward, Nexus, Maestro, and qualified `AbarVa <Agent>` variants | Search report and conflict/filing recommendation |
| T068 | Agent brand trademark filings | Filing decision for agent marks or qualified variants | Filing receipts or counsel-approved no-file memo |
| T069 | Corpus database copyright | Copyright-office registration decision and deposit package | Registration receipt or counsel-approved registration plan |
| T071 | Trade-secret inventory and marking | Inventory, owner map, marking convention, access boundary | Approved inventory and evidence that confidential materials are marked |
| T075 | Contractor/employee NDA and IP assignment | Counsel-approved template and signed agreements for each contributor | Signed NDA/IP assignment packet and contribution access log |

## T066 - AbarVa Trademark

Minimum prep:

- Confirm exact mark: `AbarVa`.
- Confirm goods/services description.
- Confirm first-use and intent-to-use posture.
- Capture domains and product references.
- Ask counsel whether to file word mark first.

Done evidence:

- Counsel search or filing recommendation.
- USPTO filing receipt and serial number, or counsel-approved defer memo.
- Specimen or planned specimen.
- Renewal calendar entry.

## T067 - Agent Brand Knockout Search

Search targets:

- Sentinel
- Atlas
- Steward
- Nexus
- Maestro
- AbarVa Sentinel
- AbarVa Atlas
- AbarVa Steward
- AbarVa Nexus
- AbarVa Maestro

Minimum search sources:

- USPTO TESS/TSDR or counsel search tool.
- Common-law web search.
- Domain and product-market search.
- Relevant software/SaaS categories.

Done evidence:

- Search date.
- Searcher.
- Search source list.
- Conflicts found.
- Risk rating.
- Recommendation: file, qualify with AbarVa, rename, or defer.

## T068 - Agent Brand Filing Plan

Counsel should decide whether agent brands are:

- product feature names only,
- qualified marks such as `AbarVa Sentinel`,
- future filings after customer traction,
- names to avoid because of conflict risk.

Done evidence:

- Counsel decision memo.
- Filing receipts if filed.
- Product-copy update plan if renaming or qualifying is required.

## T069 - Corpus Database Copyright

The corpus may include authored pattern packs, examples, taxonomies, metadata, prompts, and proprietary arrangement/selection work. Counsel should decide whether and how to register the database/corpus.

Preparation checklist:

- Identify copyrightable authored corpus assets.
- Separate third-party facts/source material from original selection, arrangement, and narrative.
- Build a deposit package that excludes confidential client data.
- Define annual re-registration trigger as corpus waves grow.

Done evidence:

- Counsel registration recommendation.
- Deposit package manifest.
- Copyright Office receipt or registration plan.
- Annual review calendar.

## T071 - Trade-Secret Inventory and Marking

Minimum inventory fields:

- Secret name.
- Owner.
- Description.
- Business value.
- Location.
- Access boundary.
- Marking status.
- Disclosure restrictions.
- Review cadence.

Initial candidate categories:

- AgentContextBroker boundary and routing patterns.
- Evaluation rubrics and answer-quality harnesses.
- Pattern-to-Move funnel design.
- Client data-plane operating playbooks.
- Corpus authoring and retrieval quality methods.
- Private pricing/commercial strategy.
- Non-public implementation runbooks and incident drills.

Marking convention:

- Public docs: no trade-secret label unless intentionally published.
- Internal confidential docs: `AbarVa Confidential - Trade Secret Candidate`.
- External counsel packets: include confidentiality header and recipient control.
- Source code comments: avoid noisy labels; protect via repo access controls and docs inventory.

Done evidence:

- Approved inventory.
- Marked sample set.
- Access review.
- Founder/counsel approval that inventory is usable.

## T075 - Contractor and Employee NDA/IP Assignment

No contractor, employee, or advisor should receive repository, product, customer, corpus, or confidential commercial access until signed documents are in place.

Required template areas:

- Confidentiality and non-use.
- Invention assignment.
- Work-made-for-hire where applicable.
- Pre-existing IP disclosure.
- Open-source contribution rules.
- Customer-data handling.
- Return/deletion at offboarding.
- No use of prior-employer or third-party confidential material.

Done evidence:

- Counsel-approved template.
- Signed agreement for each contributor.
- Access grant date and system list.
- Offboarding/return-delete clause.

## Tracker Status Guidance

Suggested tracker updates after this packet lands:

- Move T066, T067, T068, T069, T071, and T075 to In progress.
- Keep all six rows out of Done until counsel, filing, search, inventory, or signed-agreement evidence exists.

## Open Decisions

- Counsel owner for trademark/copyright/IP assignment.
- Whether to file `AbarVa` immediately before public launch.
- Which agent names are product marks versus internal labels.
- Whether the corpus registration should cover authored text, database arrangement, or both.
- Private location for trade-secret inventory.
- Contributor access policy for contractors, advisors, and future employees.

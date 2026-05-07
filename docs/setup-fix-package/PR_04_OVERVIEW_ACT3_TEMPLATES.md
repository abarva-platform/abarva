# PR 4 · Overview Act 3 upload templates

| | |
|---|---|
| **PR number** | 4 of 9 |
| **Type** | Functional fix — add templates and consequence specificity |
| **Branch** | `setup-fix/04-overview-act3-templates` |
| **Depends on** | PR 3 merged |
| **Blocks** | None |
| **Estimated effort** | 3-4 hours |
| **Gate?** | No |

---

## §1 · What this PR does

Addresses the universal Q2 fail across Setup: **no panel currently provides upload templates**. This PR adds them to Act 3 of the Overview panel — the section titled "What changes when you upload one more thing."

Per inventory §2.1: Act 3 has excellent consequence copy (Today/After Upload Steward voice quotes) but admins clicking "Add [Segment] →" have no idea what format the upload should take.

The fix: each Act 3 row gets a "Download starter template" affordance and a brief format example that previews what the upload should contain.

## §2 · The 4 segments in scope

Per current Act 3:

1. **Enterprise Profile** (segment 01)
2. **Compliance and Regulatory** (segment 12)
3. **IT System Landscape** (segment 03)
4. **Program Inventory** (segment 06)

Each gets:
- A downloadable starter template (CSV, JSON, or YAML — your call per segment, see §3)
- A brief format example shown inline (3-5 fields max)
- Updated CTA copy: "Download template ↓" alongside existing "Add [Segment] →"

## §3 · Template formats per segment

### 3.1 Enterprise Profile
**Format:** YAML or markdown (this is more narrative than tabular)

**Template starter:**
```yaml
# Enterprise Profile · First Capital Financial
legal_entity: "First Capital Financial Holdings Inc."
revenue_mix:
  - segment: Retail Banking
    pct: 45
  - segment: Commercial Lending
    pct: 30
  - segment: Wealth Management
    pct: 15
  - segment: Payments
    pct: 10
regulators:
  primary: OCC
  secondary: [Federal Reserve, FDIC, State of Virginia]
strategic_priorities:
  - Risk-controlled growth
  - Digital banking modernization
  - AI governance
risk_committee:
  name: "Board Risk Committee"
  cadence: monthly
  ai_decision_authority: true
```

**Inline preview:** show 3 fields with placeholder values + "Full template includes legal entity, revenue mix, regulators, strategic priorities, risk committee cadence."

### 3.2 Compliance and Regulatory
**Format:** CSV (tabular, multiple control entries)

**Template starter (CSV):**
```csv
control_framework,control_id,owner,status,evidence_url,last_tested,next_test
GLBA Safeguards Rule,GLBA-001,Director Information Security,In Place,/evidence/glba-001-2026q1.pdf,2026-03-15,2026-09-15
SOX 404,SOX-IT-001,VP Internal Audit,Open,,2025-11-30,2026-05-30
PCI-DSS v4.0,PCI-AUTH-002,Manager Card Operations,Remediation,/evidence/pci-002-rem-plan.pdf,2026-02-10,2026-05-10
```

**Inline preview:** show column headers + 1 example row.

### 3.3 IT System Landscape
**Format:** CSV (tabular, one row per system)

**Template starter (CSV):**
```csv
system_name,domain,authoritative_for,owner,vendor,environment,data_classification,integrations
Core Banking - Temenos T24,Core Banking,Customer/Account/Transaction,VP Core Platforms,Temenos,Production,Restricted,"CRM,DataWarehouse,Payments"
Salesforce Financial Services Cloud,CRM,Customer Relationship,Director CRM,Salesforce,Production,Confidential,"CoreBanking,MarketingCloud"
Snowflake Enterprise,Data Warehouse,Aggregated Analytics,VP Data Platforms,Snowflake,Production,Restricted,"CoreBanking,Salesforce,Tableau"
```

**Inline preview:** column headers + 1 example row.

### 3.4 Program Inventory
**Format:** CSV (tabular, one row per program)

**Template starter (CSV):**
```csv
program_name,phase,sponsor,owner,start_date,target_completion,budget_committed,strategic_objective
Digital Banking Risk Controls Modernization,P2 Discover,CRO,VP Risk Operations,2026-01-15,2026-12-31,3500000,Reduce manual control burden 40%
Customer Data Platform Implementation,P3 Design,CMO,VP Marketing Tech,2026-02-01,2026-09-30,2200000,Identity match rate 71% to 87%
Fraud Detection AI Modernization,P1 Charter,CRO,Director Financial Crimes,2026-03-01,2027-03-01,4800000,Detect emerging fraud patterns
```

**Inline preview:** column headers + 1 example row.

## §4 · Where templates live

Templates served from `public/setup-templates/` (or the Next.js equivalent — `public/` for static assets).

Files:
- `public/setup-templates/enterprise-profile.yaml`
- `public/setup-templates/compliance-and-regulatory.csv`
- `public/setup-templates/it-system-landscape.csv`
- `public/setup-templates/program-inventory.csv`

Each template includes a header comment / row noting:
- This is an example template
- Replace example values with your data
- Field definitions reference

## §5 · UI changes per Act 3 row

For each of the 4 rows, add:

### 5.1 Format preview block
Below the existing TODAY/AFTER UPLOAD quotes, add:

```
FORMAT PREVIEW
[3-line inline preview of expected fields]
[Download starter template ↓]   [Add [Segment] →]
```

The "Download starter template ↓" link points to `/setup-templates/[segment-slug].[ext]` (browser triggers download).

### 5.2 Visual treatment
- Format preview block uses a subtle background tint (paper / cream)
- Mono font for the field examples
- Same eyebrow / typography conventions used elsewhere in Setup

Match Source v0.3 design vocabulary if applicable. Don't invent new visual patterns.

## §6 · Hard scope rules

You MUST NOT:
- Modify substrate / migrations
- Modify Act 1, Act 2, or Client Data Landscape (PR 3's scope)
- Add upload functionality (just templates and previews — actual upload is out of scope)
- Modify other Setup panels
- Add templates to other panels (PR 5 may add SSO docs to Users & Access; this PR is Overview Act 3 only)

You MAY:
- Create the `public/setup-templates/` directory and files
- Modify the Overview Act 3 component to add format preview blocks
- Add a small TemplateDownload component if useful

## §7 · Test additions

1. Each template file exists and is downloadable
2. Format preview block renders for each Act 3 row
3. "Download starter template ↓" link produces correct file
4. Template files contain the headers / example rows specified in §3

## §8 · Verification commands + Vercel verification

Standard. After deploy, click each template download link, verify the correct file downloads.

## §9 · Acceptance criteria

- [ ] 4 template files exist in `public/setup-templates/`
- [ ] Each Act 3 row has a format preview block
- [ ] Each Act 3 row has working "Download template ↓" link
- [ ] Existing Act 3 functionality preserved (TODAY/AFTER quotes, "Add [Segment] →" CTA still works)
- [ ] Template files match §3 specifications exactly (same headers, same example values)
- [ ] Visual treatment consistent with rest of Setup
- [ ] No substrate changes
- [ ] Lint / type-check / build / tests pass
- [ ] New tests added
- [ ] Vercel preview verified — screenshots saved
- [ ] PR description references this spec

## §10 · Failure modes specific to PR 4

### 10.1 The "make templates more comprehensive" trap
Templates should be minimal starters, not exhaustive schemas. Goal is to show what good looks like, not to encode every possible field. Keep examples to 3-5 entries per template.

### 10.2 The "build the upload flow" trap
Upload flow is out of scope. Just templates and previews. The "Add [Segment] →" CTA continues to navigate to wherever it currently navigates.

### 10.3 The "use real customer data" trap
Templates use illustrative data — generic financial-services examples. NOT real First Capital data. NOT real anyone's data.

End of PR 4 spec.

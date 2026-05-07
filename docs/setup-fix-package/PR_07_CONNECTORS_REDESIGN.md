# PR 7 · Connectors structural redesign

| | |
|---|---|
| **PR number** | 7 of 9 |
| **Type** | Structural redesign — implements Claude Design output |
| **Branch** | `setup-fix/07-connectors-redesign` |
| **Depends on** | PR 1 + PR 2 merged + Claude Design output (Gate 3) |
| **Blocks** | None |
| **Estimated effort** | 10-12 hours |
| **Gate?** | **YES — Gate 3** |

---

## §1 · What this PR does

Redesigns the Connectors panel to:
1. Show tenant-relevant connectors (post PR 2 fix — currently shows Apex Retail connectors regardless of session tenant)
2. Populate inventory with FCF-relevant systems per the IT System Landscape substrate (core banking, loan origination, CRM, fraud/AML, data warehouse, etc. — not retail systems)
3. Add per-connector configuration templates / examples
4. Add per-connector consequence copy

Per inventory §2.3 — current panel shows 6 Apex Retail connector categories with `conn-apex-*` IDs and zero financial-services systems.

## §2 · Gate 3 — Claude Design output required

Same gate pattern as PR 6. Required deliverable:

```
docs/design/setup/connectors-redesign.html
```

Covering 3 states (empty / partial / mature) for the redesigned Connectors panel.

When you reach this PR, post Gate 3 trigger:

```markdown
🚪 Gate 3 — PR 7 requires Claude Design output

Connectors structural redesign needs visual design before implementation.

Required deliverable: HTML mockup at docs/design/setup/connectors-redesign.html

Awaiting Claude Design output OR Anand decision to skip design pass.
```

## §3 · Design intent

### 3.1 Connectors are tenant-specific

Apex Retail's connectors (POS, CDP, demand-forecast) are not FCF's connectors (core banking, loan origination, fraud/AML). The connector inventory must derive from the tenant's IT System Landscape substrate, not from a hardcoded list.

For FCF specifically, the panel should show categories like:
- Core Banking (Temenos T24, Fiserv DNA, etc.)
- Loan Origination (nCino, Encompass, etc.)
- CRM (Salesforce Financial Services Cloud)
- Data Warehouse (Snowflake, Redshift)
- Fraud / AML (Actimize, Verafin, etc.)
- Identity / SSO (Okta, Azure AD, Clerk)
- Payments (TCH, Fedwire, ACH)
- GRC (Archer, ServiceNow GRC)

Substrate may not have all of these populated. Use what's there; log gaps.

### 3.2 Per-connector requirements clear
For each connector, show:
- Configuration status (Not configured / Stub / Live)
- Pilot-required vs. Production-required vs. Optional
- What's needed to configure it (specific documents, credentials, approvals)
- Configuration template if applicable (OAuth setup guide, SAML metadata template)

### 3.3 Per-connector consequence copy
What does this connector unlock for which agent / surface?

Example:
- **Core Banking connector:** Unlocks Atlas reasoning about customer/account/transaction authoritative source for Sourcing decisions
- **Salesforce CRM:** Unlocks Sentinel pattern detection on customer interactions across channels
- **Fraud/AML:** Unlocks Steward gating on AI initiatives that touch transaction monitoring

### 3.4 Action queue at top
"Connectors needing your decision" — same pattern as PRs 6 and Source portfolio.

## §4 · The 3 states

Empty (no connectors configured), Partial (1-3 configured), Mature (5+ configured). Same shape as PR 6.

## §5 · Hard scope rules

Same as PR 6 §5. Do NOT build actual OAuth flows or live connector adapters — those are deferred. Just the configuration UI / templates / consequence copy.

## §6 · Test additions

Standard. Per-connector rendering, action queue, configuration template downloads.

## §7 · Acceptance criteria

- [ ] Gate 3 resolved
- [ ] Connectors inventory derives from tenant IT System Landscape substrate (not hardcoded)
- [ ] FCF tenant shows financial-services connectors (not retail)
- [ ] Per-connector configuration template / link to docs present
- [ ] Per-connector consequence copy present
- [ ] Action queue at top
- [ ] All 3 states render correctly
- [ ] Standard CI / verification gates pass
- [ ] Substrate gaps logged

## §8 · Failure modes

### 8.1 The "hardcode FCF connectors" trap
The fix to "shows Apex regardless of tenant" is to derive from substrate, not to hardcode a different list. If FCF's IT System Landscape substrate is incomplete, log gaps; show what's there.

### 8.2 The "build OAuth" trap
OAuth federation is substantial. Out of scope. Affordance only.

End of PR 7 spec.

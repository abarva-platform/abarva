# PR 9 · Production Readiness cosmetic polish

| | |
|---|---|
| **PR number** | 9 of 9 |
| **Type** | Cosmetic + linkage fix |
| **Branch** | `setup-fix/09-production-readiness-polish` |
| **Depends on** | PR 1 + PR 2 merged |
| **Blocks** | None |
| **Estimated effort** | 3-4 hours |
| **Gate?** | No |

---

## §1 · What this PR does

Per inventory §2.7 — the Production Readiness panel is structurally sound (Decision/Blockers/Gates/History tab structure is appropriate). Two improvements needed post-tenant-fix:

1. **Replace generic blocker text with linked specifics.** Current Pilot card says "Needs access, security, connectors, approvals." Each of these should link directly to the panel that resolves it.

2. **Tenant-specific copy.** Post PR 2, the panel will show correct tenant name, but the Steward editorial copy still reads as if hardcoded for Apex Retail. Update copy to be tenant-derived (or generic + tenant-substituted).

## §2 · The 2 changes

### 2.1 Pilot card linked blockers

Current:
```
Pilot — Partial
"Needs access, security, connectors, approvals."
[Status chip: Blocked inputs]
```

Replacement:
```
Pilot — Partial
Needs:
  • Access — [Configure SSO →] (Users & Access panel)
  • Security — [Connector readiness review →] (Connectors panel)
  • Connectors — [Pilot-required connectors →] (Connectors panel)
  • Approvals — [Steward review queue →] (Overview panel)
[Status chip: Blocked inputs]
```

Each link navigates to the relevant panel + appropriate tab/anchor where applicable.

### 2.2 Tenant-derived editorial copy

Current Steward editorial body: "Demo readiness is strong for Apex Retail. Pilot is partial. Production is blocked by live audit, model gateway execution, tenant security review, and Azure private data-plane proof."

Replacement: Tenant-substituted version that adapts to current tenant. Pseudocode:
```
"Demo readiness is strong for {tenant.display_name}. Pilot is partial. Production is blocked by live audit, model gateway execution, tenant security review, and Azure private data-plane proof."
```

Where `{tenant.display_name}` resolves per the canonical tenant resolution path (fixed in PR 2).

If the readiness assessment varies by tenant (it might — FCF has different blockers than Apex Retail), the copy should derive the assessment from substrate, not be hardcoded. If substrate doesn't support per-tenant readiness assessments, log as substrate gap and use a generic version that's accurate across tenants.

## §3 · Hard scope rules

You MUST NOT:
- Restructure the panel (Decision/Blockers/Gates/History tabs stay)
- Add new functionality (just linkage and copy)
- Modify other Setup panels
- Build the actual production readiness scan (deferred to Wave 27 per existing copy)

You MAY:
- Modify the Pilot card to add linked blocker list
- Modify Steward editorial copy to tenant-substitute
- Update tests

## §4 · Acceptance criteria

- [ ] Pilot card shows linked blockers (4 items)
- [ ] Each link navigates to the correct destination panel
- [ ] Steward editorial copy uses correct tenant name
- [ ] Demo / Pilot / Production card structure preserved
- [ ] Tab structure preserved
- [ ] Standard verification gates pass
- [ ] Substrate gaps logged if per-tenant readiness assessments not supported

## §5 · Failure modes

### 5.1 The "redesign the whole panel" trap
This is cosmetic + linkage. Don't change the three-card layout, the tab structure, or the editorial card pattern.

### 5.2 The "make the readiness assessment dynamic" trap
If substrate doesn't support per-tenant readiness, don't invent the logic. Use the same generic assessment for all tenants and log the gap.

End of PR 9 spec.

---

# After PR 9 — Package Complete

When PR 9 merges and deploys, post final completion comment per master prompt §1.9. Then produce the final completion report at `docs/setup-fix-package/COMPLETION_REPORT.md` per master prompt §2.3.

The Setup section now has:
- 6 panels (down from 10)
- All panels show correct tenant data
- Overview reconciled (no contradictions)
- Overview Act 3 has upload templates
- Users & Access has SSO path + consequence copy
- Data Trust redesigned with action queue + per-dataset paths
- Connectors derives from tenant substrate, has templates and consequence
- Agent Readiness separates engineering vs admin gaps, matrix as hero
- Production Readiness has linked blockers and tenant-correct copy

The package is complete. Stop. Anand reviews.

End.

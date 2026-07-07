# Home Panels Inventory

Home is the shared operating room for insight, decisions, action follow-through, and learning. Setup, data trust remediation, connectors, tenant profile, templates, outputs, users, and policy administration live under `/admin/*`.

## Panel inventory

| Order | Panel | Route | Group | Audience signal | Job |
|---:|---|---|---|---|---|
| 1 | Overview | `/home` | `insight` | Everyone | Tenant status and what needs attention. |
| 2 | AI Initiatives | `/home/ai-initiatives` | `insight` | CXO, admin, analyst | AI initiative inventory across the tenant. |
| 3 | Decision Room | `/home/decision` | `decision` | CXO, admin, analyst | Priority reads and decision focus. |
| 4 | Action Queue | `/home/queue` | `action` | CXO, admin, analyst | Open actions and approval follow-through. |
| 5 | Source Work | `/home/source` | `action` | CXO, admin, analyst | Sourcing handoffs and active event work. |
| 6 | Learn | `/home/learn` | `learn` | Everyone | Product info, doctrine, glossary, and orientation. |

## Non-Home Admin Workspaces

These are intentionally excluded from `HOME_PANELS`:

- Data Trust: `/admin/data-trust`
- Agent Readiness: `/admin/agent-readiness`
- Connectors: `/admin/connectors`
- Tenant Profile: `/admin/tenant`
- Setup / Configuration: `/admin/setup`
- Templates: `/admin/templates`
- Outputs: `/admin/outputs`
- Users & Access: `/admin/users-access`
- Policies / Compliance: `/admin/policies`, `/admin/compliance`

## Metadata Contract

```typescript
type PanelMetadata = {
  id: string;
  label: string;
  route: string;
  group: 'insight' | 'decision' | 'action' | 'learn';
  visibleToRoles: Role[];
  description: string;
  icon?: string;
};
```

`visibleToRoles` remains informational until role enforcement ships. It is still required because it gives role enforcement a cheap future filter without reworking the panel inventory.

## Acceptance Criteria

```
✓ Home panel metadata contains no /admin/* or /setup/* routes
✓ Home panel groups are insight / decision / action / learn
✓ Admin/setup taxonomy is absent from Home panel metadata
✓ Legacy /home/{data-trust,connectors,agent-readiness,configuration,tenant-profile} routes stay retired
✓ Admin workspaces remain discoverable from the Admin shell
✓ Browser verification: each remaining Home panel route is reachable
```

# Role Readiness Doctrine

**Outcome:** Build for the universe of users, hide for the current viewer. Today everyone is admin. Tomorrow role-segmentation flips one config and works. This doctrine governs the discipline that makes that future flip cheap.

---

## The principle

We are not building role-based access control (RBAC) in this package. We are building **metadata structure** that supports RBAC when it ships later — without any retrofit.

Three patterns to honor everywhere:

1. **Section by audience** — admin-flavored content lives in dedicated sections, not interleaved with operational content
2. **Component-level visibility metadata** — every panel, card, button, CTA has a `visibleToRoles` field today (informational); becomes role-gated tomorrow
3. **Admin actions named, not assumed** — buttons that perform admin operations have explicit `requiresRole` metadata

These patterns are cheap today (just metadata) and expensive to retrofit later. Lock now.

---

## Pattern 1 · Section by audience

**Today:** Home panels are grouped visually as Explore (operational), Configure (admin), Learn (everyone) — per HOME_PANELS_INVENTORY.md layout.

**Tomorrow:** When role logic ships, hiding the Configure group entirely from non-admins is a single conditional render. No reorganization of panels needed.

**The discipline:**
- Don't interleave admin and operational content in the same panel
- Don't put an admin-only field in the middle of a CXO-facing card
- If something is admin-only, it lives in an admin-only panel OR is clearly marked for role-gating

**Examples in current packages:**
- Setup Redesign Package's Overview ("operational status") vs Configuration ("admin settings") — clean separation ✓
- AI Initiatives Substrate Package's initiative card ("AI Initiative info") vs Edit/Delete affordances ("admin actions") — these need explicit role-gating metadata
- Connectors panel — entirely admin; no need for finer-grained gating within ✓

---

## Pattern 2 · Component-level visibility metadata

Every component that's role-relevant gets a metadata field, even if not enforced today.

### TypeScript shape

```typescript
type Role = 'admin' | 'cxo' | 'analyst' | 'end_user';

type RoleVisibilityMetadata = {
  visibleToRoles: Role[];
};

// Extend any component with this metadata
type PanelComponent = {
  id: string;
  label: string;
  route: string;
  // ... other component props
} & RoleVisibilityMetadata;

type CardComponent = {
  id: string;
  // ... other props
} & RoleVisibilityMetadata;

type CTAComponent = {
  id: string;
  label: string;
  action: () => void;
} & RoleVisibilityMetadata;
```

### Today's behavior

The `visibleToRoles` field is present and populated, but **no code reads it**. Every user sees everything because every test user is admin and everyone is implicitly visible.

### Tomorrow's enforcement

When role logic lands, a single utility function reads the metadata:

```typescript
function isVisibleToCurrentUser(
  component: { visibleToRoles: Role[] },
  currentUser: { roles: Role[] }
): boolean {
  return component.visibleToRoles.some(role =>
    currentUser.roles.includes(role)
  );
}

// Usage at render time
{HOME_PANELS
  .filter(panel => isVisibleToCurrentUser(panel, currentUser))
  .map(panel => <PanelCard panel={panel} key={panel.id} />)
}
```

One filter. No retrofit.

### What gets metadata

**Definitely:**
- Every Home panel (per HOME_PANELS_INVENTORY.md)
- Every nav item (top-level surfaces — though these may all be visible to everyone in v1)
- Every Configure-group action (admin-only)
- Every "Edit" / "Delete" / "Reset" / "Re-integrate" button
- Every settings or config panel

**Probably:**
- Cards that show admin-only data (substrate completeness percentages, integration health raw data)
- ⓘ provenance panels (if they show integration credentials or admin-level detail)
- Agent admin controls (if any — like "force re-train Sentinel")

**Not necessarily:**
- Read-only content cards visible to all roles (no role gating needed; metadata can be absent or list all roles)
- Glossary entries
- Public-facing doctrine page content

---

## Pattern 3 · Admin actions named, not assumed

Buttons that perform admin operations get explicit metadata flagging them, even when not enforced today.

### Examples

**An "Edit Initiative" button on an AI Initiative card:**

```typescript
{
  id: 'edit-initiative-cta',
  label: 'Edit',
  action: openEditModal,
  visibleToRoles: ['admin'],
  requiresRole: 'admin',
  description: 'Edit initiative metadata · admin only'
}
```

**A "Re-run integration" button on Connectors:**

```typescript
{
  id: 'rerun-integration-cta',
  label: 'Re-run integration',
  action: triggerReIntegration,
  visibleToRoles: ['admin'],
  requiresRole: 'admin',
  description: 'Force re-run of data integration · admin only'
}
```

**A "Browse glossary" button on Learn:**

```typescript
{
  id: 'browse-glossary-cta',
  label: 'Browse all terms',
  action: navigateToGlossary,
  visibleToRoles: ['admin', 'cxo', 'analyst', 'end_user'],
  // requiresRole: undefined — no admin gate
}
```

The `requiresRole` field is the explicit "this button does something only admins should do." Today every user has admin so it's always allowed. Tomorrow non-admin users see a disabled state or the button is hidden entirely.

---

## The role taxonomy (tentative · subject to revision)

Four roles for v1 of role-readiness metadata:

- **admin** — tenant administrator (typically IT lead, AbarVa procurement owner). Sees everything. Can configure.
- **cxo** — executive viewing for portfolio insight (CFO, CIO, CSO, CEO). Sees portfolio + intelligence. Doesn't configure.
- **analyst** — works with data (data analyst, business analyst). Sees substrate, can run queries, doesn't configure.
- **end_user** — uses outputs (clinician, salesperson, branch advisor). Sees own slice, sees Move outcomes that affect them.

These are intentionally coarse. Refine when actual customer deployment surfaces real role boundaries. The metadata structure (an array of roles per component) supports adding more roles later without breaking existing metadata.

---

## What's metadata vs what's enforcement

| Concern | Today (this package) | Tomorrow (role kit) |
|---|---|---|
| `visibleToRoles` field on components | ✅ shipped | ✅ enforced |
| `requiresRole` field on actions | ✅ shipped | ✅ enforced |
| Role assignment to test users | ❌ all admin | ✅ assigned per persona |
| Render-time filtering | ❌ no filter | ✅ filter applied |
| API-level enforcement | ❌ open API | ✅ middleware checks role |
| UI affordances for role-gated items | ❌ visible to all | ✅ hidden / disabled per role |

This package ships the **left column** (today). The role kit ships the **right column** (tomorrow).

---

## What this catches that we'd otherwise miss

Without role-readiness metadata, when role-segmentation lands later:

- Every panel gets refactored to add visibility checks
- Every button gets refactored to add role checks
- Every component file changes
- Tests for role-gated views need to be written from scratch
- Customer-facing role rollout takes weeks of refactoring

With role-readiness metadata in place:

- Role kit is mostly the role assignment + enforcement layer
- Metadata is already there
- Refactor is minimal
- Tests can be written against existing metadata
- Role rollout is days, not weeks

The metadata is small. The retrofit avoidance is large.

---

## Acceptance criteria for this package

```
✓ HOME_PANELS array carries visibleToRoles for each panel
✓ Top nav items array carries visibleToRoles (probably all roles for v1)
✓ Every admin-flavored button (edit/delete/reset/re-run) has visibleToRoles + requiresRole
✓ Component types extended to include RoleVisibilityMetadata interface
✓ No code currently READS the metadata (informational only · admin = everyone)
✓ Documentation comment in code: "TODO: enforce role-based filtering when role kit ships"
✓ Doctrine doc (this file) committed to repo for downstream reference
```

---

## Browser-Chrome verification

Verifying metadata is largely a code review concern, not a visual concern. The QA pass is:

```
Step 1 — Inspect Home panel array in code
  ✓ Every panel has visibleToRoles populated
  ✓ Field type is Role[]
  ✓ Values are valid (admin / cxo / analyst / end_user)

Step 2 — Inspect at least 5 admin-flavored buttons across surfaces
  ✓ Each has visibleToRoles
  ✓ Each has requiresRole if it performs admin operation

Step 3 — Inspect top nav items array
  ✓ Each nav item has visibleToRoles

Step 4 — Verify no enforcement is happening
  ✓ Logged in as admin, see all panels and buttons (expected)
  ✓ Code path that would filter is not yet active
```

Verification is mostly read-the-code, not browse-the-page. That's correct for this kind of metadata work.

---

## What this doctrine does NOT cover

- The role assignment system (how users get assigned to roles) — separate kit
- The API-level enforcement (middleware checking role on requests) — separate kit
- The role administration UI (how admin assigns roles to users) — separate kit
- Per-tenant role customization (different tenants have different role taxonomies) — much later
- Hierarchy / inheritance (role A includes role B's permissions) — much later

These are all real concerns for full RBAC. They ship later. This doctrine is just the metadata foundation.

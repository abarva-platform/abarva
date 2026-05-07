# PR 5 · Users & Access SSO instructions + consequence copy

| | |
|---|---|
| **PR number** | 5 of 9 |
| **Type** | Functional fix — add documentation and consequence copy |
| **Branch** | `setup-fix/05-users-access-sso` |
| **Depends on** | Nothing (parallelizable with PR 2) |
| **Blocks** | None |
| **Estimated effort** | 3 hours |
| **Gate?** | No |

---

## §1 · What this PR does

Per inventory §2.4, the Users & Access panel correctly identifies SSO as the blocker for inviting users, but provides no path to actually configuring SSO. The "Configure SSO" CTA links to a hash anchor (`#sso`) and the panel shows no SSO configuration form or instructions.

This PR adds:
1. SSO configuration instructions (or link to docs)
2. Consequence copy stating what unblocks when SSO is configured
3. Clearer messaging on wave-gated disabled buttons (replaces them with an explanation, not a broken button)

## §2 · The 3 changes

### 2.1 SSO configuration affordance

The current "Configure SSO" CTA needs an actual destination. Two options based on what exists in the codebase:

**Option A — In-page configuration form** (if AbarVa has SSO configuration UI built):
Add a form / drawer / panel allowing the admin to enter SSO IdP details (e.g., SAML metadata URL, OIDC client ID, scopes). Validation only — actual IdP federation may be deferred per Wave 27.

**Option B — Link to documentation** (if SSO config is manual / managed by AbarVa):
Replace the hash-anchor CTA with a real link to AbarVa support documentation describing how to request SSO configuration. Documentation page (markdown) lives at `docs/setup/sso-configuration.md` and is rendered at `/setup/docs/sso-configuration` (route added in this PR).

**Default:** Option B. SSO IdP configuration is typically not self-service for compliance reasons — admins request it, AbarVa configures it. Document the request flow.

### 2.2 Consequence copy

Add a "What this unlocks" section near the SSO CTA stating specifically:

> Configuring SSO unlocks:
> - **Invite pipeline:** Tenant admins can invite users by email, who then sign in via SSO
> - **Maestro access to Programs:** Engagement owners can be invited to drive Programs work
> - **Sponsor access to Tower briefs:** Executive sponsors can be invited to read scorecards and pressure cards
> - **Cross-tenant role assignment:** Platform admins can manage role assignments across tenants
>
> Until SSO is configured, the user roster shown above is read-only and reflects deterministic seed data.

Adjust this copy based on what's actually true in the codebase. If "Maestro access to Programs" doesn't actually require SSO, remove that line. The principle: every consequence claim must be verifiable.

### 2.3 Wave-gated buttons

Per inventory: "Two disabled buttons: 'Available in pilot environment (Wave 27)' (×2)"

Replace these with non-button copy that explains the same thing without looking like broken buttons:

```
[Wave 27] Live invite and revoke pipelines come online when SSO is configured AND the audit event store ships in Wave 27.
```

Visual treatment: muted text block, no button styling, explicit Wave 27 callout with what depends on it.

## §3 · Hard scope rules

You MUST NOT:
- Modify substrate / migrations
- Build the actual SSO IdP federation (just the config UI / docs link)
- Modify other Setup panels
- Add user invitation functionality (it's gated to Wave 27)
- Add user roster modification functionality

You MAY:
- Add an SSO configuration form OR a documentation link (per Option A / B)
- Add the SSO documentation page (`docs/setup/sso-configuration.md`)
- Modify the Users & Access panel to add the new sections
- Update tests for Users & Access

## §4 · Test additions

1. SSO CTA points to valid destination (not just `#sso`)
2. Consequence copy renders correctly
3. Wave-gated explanation renders without button styling
4. No regressions in existing Users & Access functionality (role matrix renders, exports work, etc.)

## §5 · Acceptance criteria

- [ ] SSO CTA leads to actual content (form or docs)
- [ ] Consequence copy added near SSO CTA
- [ ] Wave-gated buttons replaced with explanation
- [ ] Display name shown correctly (if not already fixed by PR 2)
- [ ] Lint / type-check / build / tests pass
- [ ] New tests added
- [ ] Vercel preview verified — screenshot saved
- [ ] PR description references this spec

## §6 · Failure modes specific to PR 5

### 6.1 The "build the SSO federation" trap
SSO IdP federation is a substantial feature. Out of scope. Just the configuration UI + consequence copy.

### 6.2 The "expand to other panels" trap
Other panels also have wave-gated buttons. Their consequence copy is also missing. Address those in their own PRs (specifically PR 6 / 7 / 8 / 9). This PR is Users & Access only.

End of PR 5 spec.

# Route Migration · Old URLs → New URLs

**Outcome:** Every old `/setup/*` URL has a 301 redirect to the admin-only setup workspace. Home does not receive setup, user, connector, template, tenant-policy, or data-load routes. No broken links. Bookmarks still work.

---

## URL mapping

### Top-level

| Old | New | Status |
|---|---|---|
| `/` | `/` | Existing route — content replaced with Home landing |
| `/setup` | `/admin` | 301 redirect |
| `/dashboard` (if exists) | `/home` | 301 redirect if product dashboard alias is retained |
| `/home` | `/home` | Canonical Home workspace |

### Admin setup panels

| Old | New | Notes |
|---|---|---|
| `/setup/overview` | `/admin` | Admin landing owns setup overview |
| `/setup/data-trust` | `/admin/data-trust` | |
| `/setup/agent-readiness` | `/admin/agent-readiness` | |
| `/setup/connectors` | `/admin/connectors` | |
| `/setup/tenant-profile` | `/admin?tab=tenant` | Tenant setup is admin-only |
| `/setup/configuration` | `/admin/configuration` | |
| `/setup/users` | `/admin/users` | Users and access are admin-only |
| `/setup/templates` | `/admin/templates` | Template library is admin-only |

### Home routes (no setup equivalent)

| New | Notes |
|---|---|
| `/home` | Everyday workspace: insights, decisions, actions, outcomes, learning |
| `/home/ai-initiatives` | Product insight surface, not tenant setup |
| `/home/decision` | Human decision surface |
| `/home/queue` | Action queue |
| `/home/source` | Source work entry |
| `/home/learn` | Learn panel index — NEW |
| `/home/learn/quickstart` | Quickstart placeholder |
| `/home/learn/glossary` | Glossary index placeholder |
| `/home/learn/glossary/:term` | Per-term placeholder (returns 200 with placeholder content) |
| `/home/learn/doctrine` | Doctrine reference index placeholder |
| `/home/learn/doctrine/:topic` | Per-topic placeholder |
| `/home/learn/agents` | Agents index placeholder |
| `/home/learn/agents/:agent` | Per-agent placeholder |
| `/home/learn/workflows` | Workflows index placeholder |
| `/home/learn/workflows/:slug` | Per-workflow placeholder |
| `/home/learn/about` | About AbarVa placeholder |

### Top-nav surfaces (no change)

| Route | Notes |
|---|---|
| `/intelligence` | No change |
| `/strategic-moves` | No change · "Moves" label in nav, full URL unchanged for SEO/links |
| `/source` | No change |
| `/tower` | No change |

---

## Redirect implementation

All old `/setup/*` routes get **HTTP 301 (Permanent) redirects** to `/admin` or an `/admin/*` equivalent. Implementation depends on framework:

### If using Next.js

In `next.config.js`:

```javascript
module.exports = {
  async redirects() {
    return [
      // /setup root
      { source: '/setup', destination: '/admin', permanent: true },

      // Setup/admin aliases -> Admin workspace
      { source: '/setup/overview', destination: '/admin', permanent: true },
      { source: '/setup/data-trust', destination: '/admin/data-trust', permanent: true },
      { source: '/setup/agent-readiness', destination: '/admin/agent-readiness', permanent: true },
      { source: '/setup/connectors', destination: '/admin/connectors', permanent: true },
      { source: '/setup/tenant-profile', destination: '/admin?tab=tenant', permanent: true },
      { source: '/setup/configuration', destination: '/admin/configuration', permanent: true },

      // Catch-all for any /setup/* not above
      { source: '/setup/:path*', destination: '/admin/:path*', permanent: true },

      // Old dashboard
      { source: '/dashboard', destination: '/home', permanent: true },
    ];
  },
};
```

### If using Vercel directly

Add to `vercel.json`:

```json
{
  "redirects": [
    { "source": "/setup", "destination": "/admin", "permanent": true },
    { "source": "/setup/(.*)", "destination": "/admin/$1", "permanent": true }
  ]
}
```

### If using middleware

Per-framework middleware adding 301s for matched paths.

---

## Why permanent (301) not temporary (302)

301 tells search engines and browsers to update their references. After deployment, links from external sources (docs, search results, bookmarks, emails) will eventually update to point to the new URLs. This is what we want.

302 would mean "this is temporary; check back" — which would prevent search engines updating. We're committing to the new URLs, so 301.

---

## Rollback considerations

If we need to roll back the redirect consolidation for any reason:

1. Revert the redirect rules (no longer redirect `/setup` → `/admin`)
2. Re-enable original `/setup/*` routes
3. Add temporary redirects from affected `/admin/*` setup aliases back to `/setup/*` if needed

Cost of rollback: low (config change). But avoid if possible — search engines and external references will be confused by repeated flips. Commit to the rename.

---

## Acceptance criteria

```
✓ All old /setup/* URLs return HTTP 301 with correct destination
✓ Verify with curl -I: HTTP/1.1 301 Moved Permanently · Location: /admin/*
✓ Browser navigation: type /setup in address bar, page redirects to /admin
✓ Browser navigation: bookmark /setup/data-trust, click bookmark, lands on /admin/data-trust
✓ Internal links throughout codebase use /admin/* for setup/admin surfaces
✓ External docs / READMEs that reference /setup/* updated to /admin/* where they mean setup/admin
✓ Search index (if any) updated for new URLs
```

---

## Browser-Chrome verification

```
Step 1 — Test redirect chain via curl
  curl -I https://app.abarva.com/setup
  ✓ Returns 301 with Location: /admin

Step 2 — Test panel redirects
  curl -I https://app.abarva.com/setup/data-trust
  ✓ Returns 301 with Location: /admin/data-trust

Step 3 — Browser navigation: visit /setup directly
  ✓ Browser address bar updates to /admin
  ✓ Admin workspace renders

Step 4 — Browser navigation: visit /setup/connectors directly
  ✓ Browser address bar updates to /admin/connectors
  ✓ Connectors panel renders

Step 5 — Click bookmark / external link to /setup/data-trust
  ✓ Lands on /admin/data-trust without intermediate page

Step 6 — Internal nav from Home to Admin entry
  ✓ Admin/setup controls use /admin/* directly (no /setup/* or /home/setup URLs)
```

6 verification steps minimum.

---

## What this does NOT do

- Does NOT update external partner / customer documentation that references `/setup` URLs (that's a customer-comms task, separate)
- Does NOT update browser bookmarks proactively (bookmarks update on first click via 301)
- Does NOT delete `/setup/*` compatibility behavior (it redirects, but compatibility stays so bookmarks work)
- Does NOT version the rename (no `/v2/setup` vs `/setup` ; the rename is global)

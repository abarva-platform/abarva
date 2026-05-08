# Route Migration · Old URLs → New URLs

**Outcome:** Every old `/setup/*` URL has a 301 redirect to the new `/home/*` (or flat `/{panel}`) equivalent. No broken links. Bookmarks still work. Search engines update naturally.

---

## URL mapping

### Top-level

| Old | New | Status |
|---|---|---|
| `/` | `/` | Existing route — content replaced with Home landing |
| `/setup` | `/` | 301 redirect |
| `/dashboard` (if exists) | `/` | 301 redirect |
| `/home` (if exists) | `/` | Already correct (or redirect to canonical) |

### Home panels

| Old | New | Notes |
|---|---|---|
| `/setup/overview` | `/home/overview` (or just `/`) | Overview content also lives at root `/` |
| `/setup/data-trust` | `/home/data-trust` | |
| `/setup/ai-initiatives` | `/home/ai-initiatives` | Per AI Initiatives Substrate Package update |
| `/setup/ai-initiatives/:id` | `/home/ai-initiatives/:id` | Initiative detail |
| `/setup/agent-readiness` | `/home/agent-readiness` | |
| `/setup/connectors` | `/home/connectors` | |
| `/setup/tenant-profile` | `/home/tenant-profile` | |
| `/setup/configuration` | `/home/configuration` | |

### New routes (no old equivalent)

| New | Notes |
|---|---|
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

All old `/setup/*` routes get **HTTP 301 (Permanent) redirects** to new URLs. Implementation depends on framework:

### If using Next.js

In `next.config.js`:

```javascript
module.exports = {
  async redirects() {
    return [
      // /setup root
      { source: '/setup', destination: '/', permanent: true },

      // Setup panels → Home panels
      { source: '/setup/overview', destination: '/home/overview', permanent: true },
      { source: '/setup/data-trust', destination: '/home/data-trust', permanent: true },
      { source: '/setup/ai-initiatives', destination: '/home/ai-initiatives', permanent: true },
      { source: '/setup/ai-initiatives/:id', destination: '/home/ai-initiatives/:id', permanent: true },
      { source: '/setup/agent-readiness', destination: '/home/agent-readiness', permanent: true },
      { source: '/setup/connectors', destination: '/home/connectors', permanent: true },
      { source: '/setup/tenant-profile', destination: '/home/tenant-profile', permanent: true },
      { source: '/setup/configuration', destination: '/home/configuration', permanent: true },

      // Catch-all for any /setup/* not above
      { source: '/setup/:path*', destination: '/home/:path*', permanent: true },

      // Old dashboard
      { source: '/dashboard', destination: '/', permanent: true },
    ];
  },
};
```

### If using Vercel directly

Add to `vercel.json`:

```json
{
  "redirects": [
    { "source": "/setup", "destination": "/", "permanent": true },
    { "source": "/setup/(.*)", "destination": "/home/$1", "permanent": true }
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

If we need to roll back the rename for any reason:

1. Revert the redirect rules (no longer redirect `/setup` → `/home`)
2. Re-enable original `/setup/*` routes
3. Add reverse redirects from `/home/*` → `/setup/*` (now 301 the other way)

Cost of rollback: low (config change). But avoid if possible — search engines and external references will be confused by repeated flips. Commit to the rename.

---

## Acceptance criteria

```
✓ All old /setup/* URLs return HTTP 301 with correct destination
✓ Verify with curl -I: HTTP/1.1 301 Moved Permanently · Location: /home/*
✓ Browser navigation: type /setup in address bar, page redirects to /
✓ Browser navigation: bookmark /setup/data-trust, click bookmark, lands on /home/data-trust
✓ Internal links throughout codebase use new /home/* URLs (not /setup/*)
✓ External docs / READMEs that reference /setup/* updated to /home/*
✓ Search index (if any) updated for new URLs
```

---

## Browser-Chrome verification

```
Step 1 — Test redirect chain via curl
  curl -I https://app.abarva.com/setup
  ✓ Returns 301 with Location: /

Step 2 — Test panel redirects
  curl -I https://app.abarva.com/setup/data-trust
  ✓ Returns 301 with Location: /home/data-trust

Step 3 — Browser navigation: visit /setup directly
  ✓ Browser address bar updates to /
  ✓ Home page renders

Step 4 — Browser navigation: visit /setup/ai-initiatives directly
  ✓ Browser address bar updates to /home/ai-initiatives
  ✓ AI Initiatives panel renders

Step 5 — Click bookmark / external link to /setup/data-trust
  ✓ Lands on /home/data-trust without intermediate page

Step 6 — Internal nav from Home panel to AI Initiatives
  ✓ Click navigates to /home/ai-initiatives directly (no /setup/* in URL)
```

6 verification steps minimum.

---

## What this does NOT do

- Does NOT update external partner / customer documentation that references `/setup` URLs (that's a customer-comms task, separate)
- Does NOT update browser bookmarks proactively (bookmarks update on first click via 301)
- Does NOT delete `/setup/*` routes (they redirect, but the route definitions stay so redirect works)
- Does NOT version the rename (no `/v2/setup` vs `/setup` ; the rename is global)

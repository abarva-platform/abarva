# 2026-07-24-home-density-pass — Cut boilerplate copy, tighten header spacing on /home

## Release ID

`2026-07-24-home-density-pass`

## Status

`candidate`

## Plain-English Summary

Direct feedback on the live `/home` page: too much whitespace, and text that explains what a
section is rather than showing real tenant content. Two changes to the page header/section-switch
region:

1. **Removed purely explanatory copy that carried no tenant-specific information**: the italic
   tagline ("The enterprise's digital understanding of itself."), and a section-index line ("01 ·
   ENTERPRISE SNAPSHOT") that duplicated the title already shown one row above in the tab bar,
   followed by a generic one-sentence description of what the section shows (e.g. "The executive
   read: what is known about the enterprise..."). None of this was tenant data — it was UI
   description, repeated identically for every tenant, on every visit. Removed `VIEW_META`'s now-
   unused `index`/`lead` fields entirely rather than leaving dead code.
2. **Tightened spacing** in the same region: outer page padding, header bottom-margin, H1 size,
   section-tab button padding, and body line-height — all reduced, none removed. No color or font
   changes — this is a spacing-only pass on the locked design system, not a redesign.

## Layer Impact

- `global-control-lane`: live for every tenant on `/home` — same page, no new route.

## Client Applicability

- All clients — this is the shared `/home` header, not tenant-specific content.
- Feature flag: none.

## Changes Included

- `src/components/home/HomeEnterpriseBriefApp.tsx`: removed `.heb-page-kicker` element + CSS rule,
  removed the redundant section-index line + generic lead paragraph, removed `index`/`lead` from
  `VIEW_META`'s type and all 14 entries (dead after the render change), tightened `.heb-main`,
  `.heb-page-head`, `.heb-section-tabs button`, `.heb-current-section` spacing values.

## QA / Validation

- `pass` — `npx eslint`, exit 0.
- `pass` — full `npm run build` (production Turbopack build), clean.
- `pending` — live signed-in browser verification post-deploy, same as every other change to this
  page this session.

## Rollout Plan

Merge through the normal PR path → `aca-main-deploy.yml` builds and deploys automatically. After
deploy: confirm the ACA runtime invariant, screenshot `/home` for a real tenant to confirm the
tightened header.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none — pure component/CSS change, no data, no schema.
- Live signed-in proof required: yes — same standing requirement as every other live `/home`
  change this session.

## Rollback Plan

Revert the PR. Header reverts to the prior spacing and copy — no data or schema involved either
way.

## Audit Evidence

- User-supplied screenshot of the live `/home` page (Meridian Health System) showing the
  whitespace/boilerplate-copy issue directly.

## Known Gaps

- Scoped to the page header/section-switch region only, matching what was actually flagged. Other
  areas of the page (dimension cards, tables) may have similar density opportunities not audited
  or touched in this pass.

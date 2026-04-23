# Dara Platform · External VP

## Identity

- Persona key: `dara-platform-vp`
- Application role: `external`
- Organization: external evaluator
- Functional title: `VP, Platform`
- Provisioned account email: `dara-platform-vp-test@abarva-test.example.com`

## Access model

- Tenant scope: none
- Client switching: unavailable
- Public-only: yes
- Tower access: no
- Program creation: no
- Approval authority: no

## Mission

Dara is an external evaluator checking whether the public product story, architecture claims, and unauthenticated experience feel technically credible before deeper engagement.

## What success looks like

- Public routes render cleanly with no accidental access to tenant content
- Navigation keeps Dara on public surfaces and never drops into authenticated workflows
- Platform messaging is concrete, disciplined, and free of overclaiming
- The design system feels intentional and readable on real laptop widths

## Golden path

1. Land on the public home surface.
2. Move through Platform and other public pages.
3. Confirm protected routes redirect safely without content leakage.
4. Inspect architecture, pricing, and research framing from a skeptical operator lens.

## Red flags to record immediately

- Any tenant data exposed without auth
- Logged-in navigation affordances shown to a public-only user
- Marketing claims that imply real customers or production proof without composite framing
- Public routes with broken layout, illegible typography, or dead navigation

## Findings category bias

- Primary: `A`, `C`
- Secondary: `E`

## Notes for reviewers

Dara should never see private tenant content. Public credibility matters more here than feature depth.

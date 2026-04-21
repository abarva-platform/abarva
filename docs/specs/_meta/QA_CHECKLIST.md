# AbarVa QA Checklist
Last verified: 2026-04-14

## CLEANUP
- [ ] PageShell.tsx deleted
- [ ] DataIntelligenceTab.tsx deleted  
- [ ] sign-up/page.tsx deleted
- [ ] No PageShell import in any file
- [ ] No Tailwind classes anywhere
- [ ] /investor is protected (redirects to /sign-in)

## NAVIGATION
- [ ] Logo → / from every page
- [ ] Intelligence ▾ → 5 items with descriptions — all clickable
- [ ] Intelligence items pass ?client= param in URL
- [ ] Solutions ▾ → 3 items, no role badges — all clickable
- [ ] Solutions pages are NOT 19-line placeholders
- [ ] Signed out: Clients ▾ shows 3 demo clients only
- [ ] Signed in: static client name (not dropdown)
- [ ] Signed out: Investor amber button + Login teal button
- [ ] Signed in: "My projects" + avatar + dropdown
- [ ] Avatar dropdown: "My projects" + "Sign out"
- [ ] Sign out → /

## HOMEPAGE
- [ ] Loads dark — no white
- [ ] Hero headline renders all 3 lines
- [ ] "See it with Meridian Health →" → /diagnose?client=meridian
- [ ] "#demo" anchor scrolls to demo section
- [ ] "#contact" anchor scrolls to contact section
- [ ] Problem band: $94M · 71% · 18 months shown
- [ ] 5 product cards all clickable with ?client=meridian
- [ ] 3 solution rows all clickable to /solutions/*
- [ ] Demo tiles: Meridian → /diagnose?client=meridian (no login)
- [ ] Demo tiles: First Capital → /diagnose?client=firstcapital
- [ ] Demo tiles: Apex → /diagnose?client=apexretail
- [ ] Proof: 340 · 89% · 79% shown
- [ ] Contact form renders all fields
- [ ] No console errors

## AUTH
- [ ] /admin → sign-in when not authenticated
- [ ] /admin/client/arcturus → sign-in when not authenticated
- [ ] /investor → sign-in when not authenticated
- [ ] /sign-in → dark branded Clerk
- [ ] Sign in → /admin
- [ ] Session persists on browser reopen
- [ ] Sign out → /
- [ ] /diagnose?client=meridian → NO login required

## PRODUCT PAGES
- [ ] /diagnose loads — Meridian by default
- [ ] /diagnose?client=arcturus → Arcturus data
- [ ] /diagnose?client=firstcapital → First Capital data
- [ ] CXO switcher tabs all clickable
- [ ] Each CXO shows different metrics
- [ ] /ai-strategy loads dark
- [ ] /select loads dark
- [ ] /justify loads dark
- [ ] /outcomes loads dark

## /admin ENGAGEMENT SELECTOR
- [ ] Shows 5 client cards
- [ ] All clients show correct status badges
- [ ] Click any card → /admin/client/[id]
- [ ] Filter: All / Active / In setup — all work
- [ ] "+ New client engagement" visible

## /admin/client/[id] MAESTRO WORKSPACE
- [ ] Loads for all 5 client IDs
- [ ] Client header shows real name/data from src/data/
- [ ] "← All engagements" → /admin
- [ ] 6 tabs, all clickable
- [ ] Approvals tab has red "2" badge
- [ ] All 4 Admin sub-sections switch correctly
- [ ] Overview 8 metrics from real data
- [ ] Data Intelligence 4 sub-tabs switch correctly
- [ ] Projects Dashboard ↔ Table switch works
- [ ] Approvals 3 sections with working buttons
- [ ] Activity 2 cards with full table rows

## DATA INTEGRITY
- [ ] Arcturus C/I ratio: exactly "71%"
- [ ] Arcturus AI with ROI: exactly "0 of 28"
- [ ] Arcturus CDO: "Vacant 11 months"
- [ ] Arcturus MAS: "Overdue 4 months"
- [ ] Arcturus portal: "44%"
- [ ] Arcturus reporting: "3 days"
- [ ] Arcturus AI maturity: "28 / 100"
- [ ] Arcturus IT budget: "4.2% of revenue"
- [ ] Meridian denial rate: "18.2%"
- [ ] Meridian operating margin: "1.8%"
- [ ] Nexora Einstein AI: "Not activated"
- [ ] Genome F005 failure rate: "82%"
- [ ] Genome F002 failure rate: "84%"
- [ ] Confidence: arcturusFinancials 96%, technology 88%, leadership 91%, regulatory 94%

## BUILD
- [ ] npm run build → exits 0
- [ ] npx tsc --noEmit → zero errors
- [ ] No console errors on any page
- [ ] No 404s on any asset or import

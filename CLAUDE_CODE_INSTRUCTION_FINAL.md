# AbarVa — MASTER BUILD INSTRUCTION v5 (FINAL)
# Comprehensive. Execute everything in exact order. No skipping.
# Written April 14, 2026 against actual codebase + full dataset audit.

---

## PRIME DIRECTIVE — QA EVERY INTERACTION

Every click, every menu item, every sub-menu, every tab, every sub-tab, every
data field MUST be tested before commit. No exceptions.

RULE: If you build it, you test it. If it renders, you verify the data behind it.
RULE: Every metric shown must trace to a real value in src/data/[client]/*.ts
RULE: Every navigation path must resolve to a real page — no 404s, no blank pages.
RULE: Every dropdown item must work. Every button must do something visible.

After building each task, run its QA section before proceeding to the next task.

---

## PLATFORM MODEL (read before touching any code)

ONE USER = ONE CLIENT. Always.
  - A signed-in Maestro belongs to exactly ONE client engagement.
  - The Clients ▾ dropdown is FOR SIGNED-OUT USERS ONLY.
  - When signed in: client name shows as STATIC TEXT in nav. Not a dropdown.

PROJECTS are the primary workspace.
  - Maestros work inside projects, not inside client selectors.
  - Products run WITHIN a project context.
  - Outputs have a lifecycle: Draft → Submitted → Approved (execution) / Not approved (archived)

DATA has three access tiers per project:
  - Tier 1: Approved for this project → Active, usable, contributes to confidence
  - Tier 2: Exists but not approved → Locked, shows "Request access" button
  - Tier 3: Doesn't exist yet → "Request new dataset" button

DEMO ACCOUNT (Anand as Admin Maestro):
  - Admin Maestros CAN see all clients → /admin shows all engagements
  - Regular Maestros see only their ONE client → /admin shows just their workspace
  - For demo: Anand's admin view is correct and intentional

---

## DESIGN SYSTEM (every file, no exceptions)

```typescript
const BG     = '#060A12'   // every page background — never override
const CARD   = '#0D1520'   // every card surface
const BORDER = '#1C2D45'   // every border
const TEAL   = '#2DD4C8'   // brand accent, CTAs, active states
const WHITE  = '#EFF6FF'   // all text
const MUTED  = '#94A3B8'   // secondary text
const DIM    = '#475569'   // tertiary text
const RED    = '#EF4444'   // critical signals
const AMBER  = '#F59E0B'   // warnings
const GREEN  = '#34D399'   // success, active
const PURPLE = '#818CF8'   // Arcturus accent
const ORANGE = '#F97316'   // Nexora accent
const SANS   = 'DM Sans, sans-serif'
const MONO   = 'JetBrains Mono, monospace'
const SERIF  = 'Georgia, serif'
```

NEVER USE: #FFFFFF · #fff · white · bg-gray-950 · any Tailwind class · Inter font
ALWAYS: inline style={{}} with typed constants. Every page: minHeight:'100vh', background:BG.

---

## KNOWN DATA — USE THESE VALUES (drawn from src/data/ audit)

### ARCTURUS FINANCIAL GROUP
From src/data/arcturus/index.ts + financials.ts + technology.ts + regulatory.ts + leadership.ts:
```
Org: Asset Manager · $16.2B revenue · 4,200 employees · New York · Founded 1987
AUM: $2,100B · Offices: NY, Boston, London, Frankfurt, Zurich, HK, Singapore, Dubai
Revenue by region: NA 60% ($9.7B) · EU 25% ($4.1B) · Asia/ME 15% ($2.4B)
Operating margin: 22.4% (declining from 28.1% in 2022)
C/I ratio: 71% vs 58% target → $840M efficiency gap
Net institutional flows: -$28B (peers: +$12B avg)
IT budget: $680M (4.2% of revenue vs 3.1% peer median — overspending with under-outcomes)
Consulting spend: $42M annually

AI Portfolio:
  28 active initiatives · $94M committed · $0 with documented ROI
  CDO: VACANT 11 months (F005 genome pattern — 82% failure rate)
  
Technology:
  Core OMS: Bloomberg AIM, 28 years old, 3 failed modernization attempts
  Aladdin Risk: partial — alternatives not in real-time risk, runs monthly (regulator wants daily)
  Client Portal: Salesforce FSC, $38M invested, 18 months live, 44% advisor adoption (target 85%), NPS 31
  Data systems: 14 systems, no golden record, 3-day reporting lag
  Aladdin license: $22M/yr · OMS maintenance: $42M/yr

Regulatory:
  SEC MRA: Model Risk Management — 14 models flagged (high risk, remediation in progress)
  MAS FEAT: AI governance — OVERDUE 4 months (critical, enforcement risk active)
  SEC AI Governance Rule: 2026-Q2 — not started (high risk, $8M est. cost)
  FCA Consumer Duty: 2026-Q1 — 40% complete
  EU AI Act: 2026-08 — gap assessment needed
  Daily stress testing: regulator wants daily, Aladdin runs monthly (high risk, $12M est.)

Leadership (with quotes for CXO switcher):
  CEO: Victoria Hargreaves · 3yr · Ex-BlackRock COO
    Quote: "We built this firm on information advantage. If we cannot use AI to serve clients 
    better than our competitors, we will lose our best relationships."
  CIO: Raj Malhotra · 8mo · Ex-JPMorgan CTO
    Quote: "I have 28 AI initiatives running that I did not commission and cannot explain. 
    Before I add anything, I need to know what we have and what it is doing."
  CFO: Thomas Kellner · 6yr · Internal promotion
    Quote: "I am not opposed to AI investment. I am opposed to AI investment with no 
    measurable outcome and no accountability."
  CRO: Sarah Chen · (regulatory owner for MAS FEAT)
  Head of Tech: Michael Santos (uploaded technology inventory)

Situation Metrics (8 metrics to display):
  C/I Ratio: 71% | Peers 61% · Target 58% | $840M efficiency gap | critical (red)
  AI with ROI: 0 of 28 | Industry: 14% | $94M untracked | critical (red)
  CDO Status: Vacant | 11 months unfilled | Blocking all AI decisions | critical (red)
  Client Portal: 44% | Target: 85% | $38M underperforming | warning (amber)
  Reporting Latency: 3 days | Real-time standard | Competitive disadvantage | critical (red)
  MAS FEAT: Overdue | Dec 2025 deadline | Enforcement risk | critical (red)
  Net Flows: -$28B | Peers: +$12B avg | AUM attrition | critical (red)
  AI Maturity: 28/100 | Peer median: 54 | Bottom quartile | critical (red)

Genome patterns matched (from failure-genome.ts):
  F005: CDO/AI leadership vacant → 82% failure rate → PRESENT
  F002: No named exec sponsor for AI → 84% failure rate → PRESENT (for individual initiatives)
  F003: Data readiness below threshold → 68% failure rate → PRESENT (no golden record)
  F004: Pilot purgatory → 76% failure rate → PRESENT (28 initiatives, 0 scaled)

Contradictions (for insight surfacing):
  "$94M spent on AI initiatives. Zero have a documented outcome baseline."
  "Client portal NPS is 31. The firm spent $38M on the implementation."
  "14 data systems. 3-day reporting lag. The firm competes on information advantage."
  "MAS FEAT Principles deadline was December 2025. No remediation plan exists."
  "C/I ratio 71% vs 61% peer median — $840M annual efficiency gap."
```

### MERIDIAN HEALTH SYSTEM
From src/data/meridian/index.ts + financials.ts + technology.ts + clinical.ts:
```
Org: IDN · $11.2B revenue · 42,000 employees · Charlotte NC · 23 hospitals · 6,800 beds
Physicians: 3,800 · Occupancy: 71% · Annual discharges: 210,000
Operating margin: 1.8% (target 4.0%) · IT budget: $340M · Consulting spend: $67M
Health plan: 187,000 covered lives · Medicare Advantage: 61,000 lives · Star rating: 3.5

RCM (Ensemble Health Partners — $48M/yr contract):
  Denial rate: 18.2% (target: <10%) · Denial write-off 2023: $94M
  Clean claim rate: 87% · Days in AR: 52 · Prior auth overturn: 61%
  SLA penalties: $8M owed, never enforced

Epic EHR:
  Optimization score: 58/100 (target 80/100)
  Cogito dashboards: 12 of 47 live
  MyChart adoption: 34% (target 60%)
  Prior auth automation: 23% of payers (purchased module, 77% unused)

Key contradictions:
  "IT budget +12% but 67% is run-the-business — only $84M for transformation vs $200M needed"
  "RCM outsourced at $48M/yr — vendor missing SLAs — $8M penalties never enforced"
  "Prior auth AI module purchased — only 23% deployed"
  "Blue Ridge Cerner migration 8 months overdue — no additional budget"

Situation metrics (display these for Meridian):
  Travel Nurse Cost: $48M | Target $28M | $20M over target | critical (red)
  Operating Margin: 1.8% | Target 4.0% | $179M/yr gap | critical (red)
  Prior Auth Days: 4.2 | Target 1.8d | Revenue delayed | critical (red)
  Epic Score: 61/100 | Target 80/100 | $34M CMS risk | warning (amber)
  Denial Rate: 18.2% | Target <10% | $94M write-off | critical (red)
  Days in AR: 52 | Target 35 | Cash flow impact | critical (red)
```

### FIRST CAPITAL FINANCIAL
From src/data/firstcapital/index.ts:
```
Org: Regional Bank · $18B assets · $1.84B revenue · 4,200 employees · 84 branches · Bethesda MD
C/I ratio: 68% (target 55%) · Digital adoption: 41% (target 67%) · Core banking age: 22 years
FedNow live: NO (68% of peer banks are live) · Commercial deposit risk: $180M

Key metrics:
  Digital adoption: 41% | Target 67% | 26pp gap | critical
  FedNow: Not live | 68% peers live | $180M commercial risk | critical
  C/I ratio: 68% | Target 55% | Efficiency gap | warning
  Mobile app rating: 3.2 | Benchmark 4.5+ | Customer loss risk | warning
  Account opening abandonment: 64% | Benchmark 32% | Revenue leakage | critical
  Core banking: 22yr old FIS HORIZON | EOL 2027 | Modernization urgent | critical
```

### APEX RETAIL GROUP
From src/data/apexretail/index.ts:
```
Org: Omnichannel Retailer · $12.4B revenue · 28,000 employees · 800 stores · Columbus OH
Operating margin: 3.8% (target 6.0%) · Ecommerce: 28% (target 45%)
Shrinkage: 2.8% / $347M · IT budget: $280M (2.3% revenue)
SAP ECC 6.0: 14yr old, 8,400 customizations, EOL 2027

Key metrics:
  Cart abandonment: 72% | Benchmark 58% | Revenue lost | critical
  Ecommerce conversion: 2.8% | Benchmark 4.2% | Gap: $44M | critical
  Inventory accuracy: 84% | Target 95%+ | Stockout risk | warning
  China sourcing: 48% | Tariff risk | Supply chain exposure | warning
  Shrinkage: 2.8% | Industry 1.4% | $175M excess | critical
  SAP EOL: 2027 | 8,400 customizations | Migration urgent | critical
```

### NEXORA RETAIL & CONSUMER
From src/data/nexora/index.ts:
```
Org: Global Retailer · $18.4B revenue · 89,000 employees · 2,400 stores · 28 countries · Atlanta GA
Operating margin: 3.2% (target 6.5%) · Margin gap: $610M
ERP systems: 6 (industry standard: 1-2) · Einstein AI: ACTIVATED=false, 18mo idle, $14M/yr license

Key metrics:
  Operating margin: 3.2% | Target 6.5% | $610M gap | critical
  Einstein AI: Not activated | 18mo idle | $248M revenue idle | critical
  AI committed vs ROI: $148M → $12M | 8 cents/dollar | critical
  Inventory turns: 4.2x | Benchmark 5.6x | $900M excess inventory | critical
  Ecommerce conversion: 2.3% | Benchmark 3.8% | $44M gap | critical
  Loyalty active rate: 42% | Benchmark 64% | $1.8B opportunity | warning
  Forecast accuracy: 62% | Target 85% | Stockout/overstock | warning
  SAP R/3: EOL 2027 | 3 prior failed migrations | Critical path | critical
```

### GENOME PATTERNS (from src/lib/intelligence/failure-genome.ts)
```
F001: Vendor Dependency Without Internal Capability → 72% failure rate
F002: No Named Executive Sponsor → 84% failure rate
F003: Data Readiness Below Threshold → 68% failure rate
F004: Pilot Purgatory (3+ pilots, none scaled) → 76% failure rate
F005: No CDO or AI Leadership → 82% failure rate
F006: No MLOps Infrastructure → 79% failure rate
F007: Change Management Gap → 61% failure rate
```

---

## TASK 0 — CLEANUP PASS

### 0a. DELETE dead files:
```bash
rm src/components/DataIntelligenceTab.tsx
rm src/app/sign-up/page.tsx
```

### 0b. REMOVE PageShell from product pages (keep all logic, just strip PageShell):
- src/app/diagnose/page.tsx — remove import + wrapper
- src/app/ai-strategy/page.tsx — remove import + wrapper
- src/app/select/page.tsx — remove import + wrapper
- src/app/outcomes/page.tsx — remove import + wrapper
- src/app/justify/page.tsx — remove import + wrapper

### 0c. DELETE PageShell component:
```bash
grep -r "PageShell" src/ && echo "STILL REFERENCED — fix above first" || rm src/components/PageShell.tsx
```

### 0d. REPLACE three 19-line solution placeholders:

src/app/solutions/pdlc/page.tsx:
```tsx
'use client'
import AbarvaNav from '@/components/AbarvaNav'
const B='#060A12',C='#0D1520',E='#1C2D45',T='#2DD4C8',W='#EFF6FF',M='#94A3B8',D='#475569'
const SANS='DM Sans, sans-serif', MONO='JetBrains Mono, monospace'
export default function SolutionPDLC() {
  return (
    <div style={{minHeight:'100vh',background:B,fontFamily:SANS,color:W}}>
      <AbarvaNav activePage="solutions"/>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'80px 32px',textAlign:'center'}}>
        <div style={{fontFamily:MONO,fontSize:'10px',color:T,letterSpacing:'.14em',textTransform:'uppercase' as const,marginBottom:'16px'}}>Solution · CIO · All verticals</div>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'44px',fontWeight:500,color:W,marginBottom:'16px',lineHeight:1.2}}>AI-Powered PDLC</h1>
        <p style={{fontSize:'17px',color:M,maxWidth:'600px',margin:'0 auto 12px',lineHeight:1.7}}>Build products at twice the velocity with AI agents alongside your engineering teams.</p>
        <p style={{fontFamily:MONO,fontSize:'13px',color:T,maxWidth:'600px',margin:'0 auto 48px',fontStyle:'italic'}}>"We're spending $300M in capital. Time to production is 16 months."</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',maxWidth:'800px',margin:'0 auto 48px'}}>
          {[['$18M','Consulting reduction'],['16→8mo','Time to production'],['2×','Build velocity']].map(([v,l])=>(
            <div key={v} style={{background:C,border:`1px solid ${E}`,borderRadius:'12px',padding:'24px',borderTop:`2px solid ${T}`}}>
              <div style={{fontFamily:'Georgia,serif',fontSize:'28px',color:T,marginBottom:'6px'}}>{v}</div>
              <div style={{fontSize:'12px',color:M}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{background:C,border:`1px dashed rgba(45,212,200,0.25)`,borderRadius:'12px',padding:'32px',maxWidth:'500px',margin:'0 auto 32px'}}>
          <div style={{fontSize:'13px',color:M,lineHeight:1.6}}>Full solution playbook available in your Maestro workspace. See it live with Meridian Health.</div>
        </div>
        <a href="/diagnose?client=meridian" style={{background:T,color:B,textDecoration:'none',padding:'13px 28px',borderRadius:'8px',fontSize:'13px',fontWeight:600,marginRight:'12px'}}>See it live →</a>
        <a href="/" style={{color:M,textDecoration:'none',fontSize:'13px'}}>Back to AbarVa</a>
      </div>
    </div>
  )
}
```

src/app/solutions/delivery/page.tsx — same pattern:
- Intelligence name: "Delivery Intelligence"  
- Title: "AI-Powered Transformation Delivery"
- Tagline: "Replace 40 consultants with 4 Maestros. Knowledge stays permanently."
- Quote: "80 consultants on site. 70% of their time is getting up to speed."
- Metrics: ["4 Maestros","Replace 40 consultants"] · ["0","Day-rate billing"] · ["100%","Knowledge retention"]

src/app/solutions/margin/page.tsx — same pattern:
- Intelligence name: "Margin Intelligence"
- Title: "Margin Optimization"  
- Tagline: "Recover margin across revenue, cost structure, and AI portfolio. Fee on outcomes only."
- Quote: "Operating margin 1.8% against a 4% target. Don't know which lever to pull."
- Metrics: ["$60–120M","Annual recovery"] · ["15–20%","Fee on verified savings only"] · ["Day 0","Baseline locked — immutable"]

### 0e. UPDATE src/middleware.ts:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/solutions(.*)',
  '/diagnose(.*)',
  '/ai-strategy(.*)',
  '/justify(.*)',
  '/select(.*)',
  '/outcomes(.*)',
  // NOTE: /investor is now PROTECTED (requires login)
  // NOTE: /sign-up removed (invite-only platform)
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect({
      unauthenticatedUrl: new URL('/sign-in', request.url).toString(),
    })
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

### 0f. UPDATE src/app/layout.tsx — remove sign-up references:
```tsx
<ClerkProvider signInUrl="/sign-in" afterSignInUrl="/admin" afterSignUpUrl="/admin">
```
Remove signUpUrl="/sign-up" from ClerkProvider props.

### 0g. VERIFY cleanup before proceeding:
```bash
grep -r "PageShell" src/ && echo "FAIL" || echo "PASS: PageShell removed"
grep -r "DataIntelligenceTab" src/ && echo "FAIL" || echo "PASS: DI gone"
grep -r "bg-gray\|tailwind" src/ && echo "FAIL: Tailwind present" || echo "PASS"
grep -r "sign-up" src/middleware.ts && echo "WARN: sign-up in middleware" || echo "PASS"
echo "Solutions pages line counts:"
wc -l src/app/solutions/*/page.tsx
```
All must pass. Solutions pages must each be >30 lines (not the 19-line placeholder).

---

## TASK 1 — REWRITE AbarvaNav.tsx

Full replacement of src/components/AbarvaNav.tsx.

### Props:
```tsx
interface NavProps {
  activePage?: 'home' | 'diagnose' | 'ai-strategy' | 'select' | 'justify' | 'outcomes' | 'solutions' | 'maestro' | 'investor'
  clientId?: string  // used to pass client context to product links
}
```

### Auth-aware layout:
```tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
```

### Nav structure (height 64px, sticky, z-index 200):
```
[AbarVa wordmark] [Intelligence ▾] [Solutions ▾] [Clients ▾ OR static client name] ··· [right side]
```

### Wordmark (always → /):
```tsx
<a href="/" style={{textDecoration:'none',display:'flex',flexDirection:'column',lineHeight:1,marginRight:'32px',flexShrink:0}}>
  <div style={{display:'flex',alignItems:'baseline'}}>
    <span style={{fontFamily:SERIF,fontSize:'17px',fontWeight:800,color:WHITE}}>Abar</span>
    <span style={{fontFamily:SERIF,fontSize:'22px',fontWeight:900,color:TEAL}}>Va</span>
  </div>
  <span style={{fontFamily:MONO,fontSize:'8px',color:WHITE,letterSpacing:'.04em',opacity:.7}}>know it. build it. own it.</span>
</a>
```

### Intelligence ▾ dropdown (hover, 5 products):
```
Situation      /diagnose?client=[clientId||'meridian']      "What's actually broken — and what is it costing?"
Strategy       /ai-strategy?client=[clientId||'meridian']   "Where should we place our AI bets?"
Vendor         /select?client=[clientId||'meridian']         "Which vendor actually wins in our situation?"
Business Case  /justify?client=[clientId||'meridian']        "How do we justify this to the board?"
Outcomes       /outcomes?client=[clientId||'meridian']       "Did it work — and can we prove it?"
```
Dropdown: bg #0D1520, border #1C2D45, border-radius 12px, padding 8px 0, min-width 320px
Each item: name (13px 500 white) + description (11px muted), padding 10px 20px, hover bg #1C2D45

### Solutions ▾ dropdown (hover, 3 solutions):
```
AI-Powered PDLC              /solutions/pdlc      "Build products at twice the velocity"
AI-Powered Delivery          /solutions/delivery  "Replace consulting teams with Maestros"
Margin Optimization          /solutions/margin    "Recover margin across revenue, cost, AI"
```
NO owner/role badges in Solutions dropdown items.

### Clients section — TWO STATES based on auth:

STATE A — NOT signed in (isLoaded && !user):
```tsx
// Clients ▾ dropdown showing DEMO CLIENTS ONLY
<DropMenu label="Clients">
  <DropSection label="Demo clients — no login required">
    Meridian Health System   → /diagnose?client=meridian    · Healthcare · $11.2B
    First Capital Financial  → /diagnose?client=firstcapital · Financial Services
    Apex Retail Group        → /diagnose?client=apexretail   · Retail · $12.4B
  </DropSection>
  [divider]
  <div style={{padding:'8px 20px',fontSize:'11px',color:DIM}}>
    Arcturus · Nexora · other Maestro clients require login
  </div>
</DropMenu>
```

STATE B — SIGNED IN (isLoaded && user):
```tsx
// Static text — no dropdown. Shows their client.
<span style={{fontSize:'13px',color:MUTED,padding:'0 16px',borderLeft:`1px solid ${BORDER}`}}>
  Arcturus Financial  {/* hardcoded for demo — will be dynamic per user in prod */}
</span>
```

### RIGHT SIDE — two states:

NOT signed in:
```tsx
<div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'8px'}}>
  <a href="/investor" style={{fontSize:'12px',color:AMBER,textDecoration:'none',
    padding:'6px 12px',border:`1px solid rgba(245,158,11,0.3)`,borderRadius:'6px'}}>
    Investor view
  </a>
  <a href="/sign-in" style={{background:TEAL,color:BG,textDecoration:'none',
    padding:'8px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:600}}>
    Login →
  </a>
</div>
```

SIGNED IN:
```tsx
const displayName = user.fullName || user.emailAddresses[0]?.emailAddress || 'Maestro'
const initials = displayName.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()

<div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'10px'}}>
  {/* My Projects link */}
  <a href="/admin" style={{fontSize:'12px',color:MUTED,textDecoration:'none',
    fontFamily:MONO,letterSpacing:'.04em'}}>
    My projects
  </a>
  {/* Identity with sign-out dropdown */}
  <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 12px',
    background:'rgba(45,212,200,0.06)',border:`1px solid rgba(45,212,200,0.15)`,borderRadius:'8px',
    cursor:'pointer'}} onClick={()=>setShowUserMenu(!showUserMenu)}>
    <div style={{textAlign:'right'}}>
      <div style={{fontSize:'12px',fontWeight:500,color:WHITE}}>{displayName}</div>
      <div style={{fontSize:'10px',color:MUTED}}>Admin Maestro</div>
    </div>
    <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(45,212,200,0.15)',
      border:`1px solid rgba(45,212,200,0.3)`,display:'flex',alignItems:'center',
      justifyContent:'center',fontSize:'11px',fontWeight:600,color:TEAL,fontFamily:MONO}}>
      {initials}
    </div>
  </div>
  {/* Dropdown: My projects | Sign out */}
  {showUserMenu && (
    <div style={{position:'absolute',top:'64px',right:'28px',background:CARD,
      border:`1px solid ${BORDER}`,borderRadius:'10px',padding:'6px 0',minWidth:'160px',zIndex:300}}>
      <a href="/admin" style={{display:'block',padding:'9px 16px',fontSize:'13px',
        color:WHITE,textDecoration:'none'}}>My projects</a>
      <button onClick={()=>signOut(()=>router.push('/'))} style={{width:'100%',textAlign:'left',
        padding:'9px 16px',fontSize:'13px',color:MUTED,background:'transparent',border:'none',
        cursor:'pointer',fontFamily:SANS}}>Sign out</button>
    </div>
  )}
</div>
```

### Dropdown implementation:
Use onMouseEnter/onMouseLeave with 200ms close timer on the menu (not the trigger):
```tsx
const [open, setOpen] = useState<string|null>(null)
const closeTimer = useRef<NodeJS.Timeout>()
const openDrop = (id:string) => { clearTimeout(closeTimer.current); setOpen(id) }
const startClose = () => { closeTimer.current = setTimeout(()=>setOpen(null), 200) }
const cancelClose = () => clearTimeout(closeTimer.current)
```

### QA — Task 1:
```
□ Logo → / from every page
□ Intelligence ▾ hover → dropdown with 5 items + descriptions
□ Each Intelligence item → correct URL with ?client= param
□ Solutions ▾ hover → 3 items, no role badges
□ Each Solution item → correct /solutions/* URL
□ Signed out: Clients ▾ shows 3 demo clients only
□ Signed in: client name shows as static text (not dropdown)
□ Signed out: Investor amber button + Login teal button visible
□ Signed in: "My projects" + avatar identity visible
□ Avatar click → dropdown with "My projects" + "Sign out"
□ Sign out → back to / (no auth wall on homepage)
□ Investor view → requires login (redirects to /sign-in)
□ No console errors on any page with nav
```

---

## TASK 2 — REWRITE src/app/page.tsx (Homepage)

Full replacement. Brand/marketing page. Everyone lands here.

### Entry points:
1. Demo → product pages (no login)
2. Login → /sign-in (then auto-routes by email)
3. Investor → /sign-in (secured separately)

### Complete page structure:
```tsx
'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'
// Design constants...

export default function Homepage() {
  const [formData, setFormData] = useState({name:'',org:'',email:'',interest:'',message:''})
  const [submitted, setSubmitted] = useState(false)
  return (
    <div style={{minHeight:'100vh',background:BG,fontFamily:SANS,color:WHITE}}>
      <AbarvaNav activePage="home" />
      <HeroSection />
      <ProblemBand />
      <ProductsSection />
      <SolutionsSection />
      <DemoSection />
      <HowWeEarnSection />
      <ProofSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
```

### HERO SECTION (two columns, padding 100px 32px):

Left column:
```
Eyebrow (mono 10px teal): "Enterprise transformation · AI-native · Outcome-accountable"
(small teal line after the text)

Headline (Georgia serif 52px 500):
  Line 1: "Act on intelligence."
  Line 2: "Before the"
  Line 3: "window closes." ← italic, teal
  
Subtext (17px muted, max-width 480px, lineHeight 1.7):
  "AbarVa diagnoses what's broken, prescribes the right architecture
  and vendors, embeds a small Maestro team to execute — and earns
  its fee only when outcomes are verified."

3 CTAs (flex row, gap 12px):
  [See it with Meridian Health →] — filled teal → /diagnose?client=meridian
  [Watch a demo] — outlined dark → #demo anchor
  [Contact us] — text only → #contact anchor

Investor note (small, 2px teal dot, amber text):
  "● Investor view secured separately — request access →" → /sign-in
```

Right column — 2×2 stat grid + one wide:
```
Stat 1 (red top border 2px):
  Label: "Consulting spend wasted"
  Value: "$800B" (Georgia 32px white)
  Sub: "Global annual market with no outcome accountability"

Stat 2 (amber top border):
  Label: "Enterprise AI with zero ROI"
  Value: "73%" (amber)
  Sub: "Of AI investments produce no verified outcome"

Stat 3 (green top border):
  Label: "AbarVa fee model"
  Value: "15–20%" (green)
  Sub: "Of verified savings only. Not a retainer. Not day-rates."

Stat 4 (teal top border):
  Label: "Time to first intelligence"
  Value: "48hrs" (teal)
  Sub: "From kickoff to your first Situation brief"

Wide card (full width, teal border):
  Lock icon + text (13px muted):
  "Harvey AI is $11B doing for legal what we do for enterprise transformation.
  Same structure. Their category $500B. Ours $800B. Nobody has touched it."
```

### PROBLEM BAND (full-width dark card, border top+bottom):
3 columns with dividers — REAL CLIENT DATA:
```
$94M (red serif 42px)
"Meridian Health's AI portfolio — zero with documented ROI"

71% (amber)
"Arcturus Financial's cost-to-income ratio vs 58% target — $840M gap"

18 months (amber)
"Since Apex deployed Salesforce Einstein — adoption: 23%"
```

### PRODUCTS SECTION:
Eyebrow: "Five products · One intelligence layer"
Title: "Intelligence that tells you what to do next."
Sub: "Each product runs on your data, your industry benchmarks, and 340 cross-client patterns
from the Transformation Genome. The answer is specific. The source is transparent."

5 product cards (grid, 1×5 or 2+3 layout):
Each card: Intelligence name (teal mono 9px) + CXO Question (13px 500) + impact line (11px dim) + "Explore →" (teal)
All link to their product page with ?client=meridian as default.

### SOLUTIONS SECTION:
Title: "Diagnosis is just the start. We execute."
Sub: "AbarVa doesn't hand you a report and leave. Maestros embed. They execute. They track outcomes."

3 solution rows (each row: name+desc | client quote | impact metric):
AI-Powered PDLC: → /solutions/pdlc | quote | $18M reduction · 16→8mo
AI-Powered Delivery: → /solutions/delivery | quote | 4 Maestros replace 40
Margin Optimization: → /solutions/margin | quote | $60–120M annual recovery

### DEMO SECTION (id="demo", dark card background):
Title: "See it working. Right now. No signup."
Sub: "Three real organizations. Three real problems. AbarVa's intelligence running live."

3 demo tiles (click → product page):
Meridian Health System (teal) · Healthcare · $11.2B
  → "$94M AI spend · zero documented ROI" → /diagnose?client=meridian

First Capital Financial (purple) · Financial Services · $1.84B
  → "41% digital adoption · target 67%" → /diagnose?client=firstcapital

Apex Retail Group (amber) · Retail · $12.4B
  → "$248M Einstein AI idle · 18 months deployed" → /diagnose?client=apexretail

Video placeholder:
  Play button circle (teal-tinted) + "Recorded product walkthrough — 8 minutes"
  Sub: "Watch a full Maestro session from Situation through Strategy to Business Case"
  Note (mono, dim): "Video coming soon · Request a live demo below"

### HOW WE EARN SECTION:
Title: "We earn nothing until outcomes are verified."
4 steps (horizontal card row):
  01 / DIAGNOSE → Situation product → 48hrs → real data
  02 / PRESCRIBE → Strategy + Vendor + Business Case
  03 / EXECUTE → Maestro team embeds → knowledge stays
  04 / VERIFY → Baseline vs actuals → 15-20% of verified savings
Arrow icons between steps.

Guarantee card (teal-tinted, full width):
"The baseline is locked on Day 0 and is immutable. Every metric. Every assumption.
Verified by the CXO. We cannot move the goalposts — and neither can you."

### PROOF SECTION:
3 cards with Genome numbers:
  340 → "Transformation patterns in the Genome — each with documented failure rates"
  89% → "Of organizations with regulatory overdue + no plan face enforcement action within 90 days"
  79% → "Of CDO vacancies at AI governance crunch points result in programme failure"

### CONTACT SECTION (id="contact"):
Two columns:
Left: 3 contact options (cards):
  "See a live demo" → /diagnose?client=meridian
  "Maestro login" → /sign-in · "Enter your org email — AbarVa routes you automatically"
  "Investor view" (amber) → /sign-in · "Secured separately — request access"

Right: Contact form:
  Name (2-col: first/last) · Organization email · Organization name
  Dropdown: "What brings you here?" (CXO / Investor / Exploring / Maestro candidate)
  Message textarea (optional)
  [Request a conversation →] teal button
  Note: "No sales calls. A Maestro responds within 24 hours."

### FOOTER:
AbarVa wordmark + links (Intelligence · Solutions · Investors · Contact · Login) + © 2026

### QA — Task 2:
```
□ Homepage loads at / — dark background, no white
□ Hero headline renders correctly (3 lines, teal on "window closes")
□ All 3 hero CTAs work: demo link, anchor scroll, anchor scroll
□ Investor note is amber and links to /sign-in
□ Problem band shows real data: $94M · 71% · 18 months
□ All 5 product cards link to correct product pages with ?client=meridian
□ All 3 solution rows link to /solutions/* pages
□ Demo tiles: Meridian → /diagnose?client=meridian (no login required)
□ Demo tiles: First Capital → /diagnose?client=firstcapital
□ Demo tiles: Apex → /diagnose?client=apexretail
□ #demo anchor scrolls to demo section
□ #contact anchor scrolls to contact section
□ 4 model steps render with arrows between
□ 3 proof cards render with correct numbers (340, 89%, 79%)
□ Contact form renders with all fields
□ Footer links all work
□ No white backgrounds anywhere
□ No console errors
```

---

## TASK 3 — CREATE /admin/client/[id]/page.tsx

Create: src/app/admin/client/[id]/page.tsx

This is the full 6-tab Maestro workspace. The /admin engagement selector already works 
and routes here on client card click.

### File structure:
```tsx
'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import AbarvaNav from '@/components/AbarvaNav'

// Import ALL client data
import { arcturusFinancial, arcturusFinancials, arcturusTechnology, arcturusLeadership, arcturusRegulatory, arcturusIndustryData } from '@/data/arcturus/index'
import { meridianHealth } from '@/data/meridian/index'
import { firstCapital } from '@/data/firstcapital/index'
import { apexRetail } from '@/data/apexretail/index'
import { nexoraRetail } from '@/data/nexora/index'

// Design constants
const BG='#060A12', CARD='#0D1520', BORDER='#1C2D45'
const TEAL='#2DD4C8', WHITE='#EFF6FF', MUTED='#94A3B8', DIM='#475569'
const RED='#EF4444', AMBER='#F59E0B', GREEN='#34D399'
const SANS='DM Sans, sans-serif', MONO='JetBrains Mono, monospace', SERIF='Georgia, serif'
```

### Auth guard:
```tsx
const { user, isLoaded } = useUser()
const router = useRouter()
const params = useParams()
const clientId = params.id as string

if (!isLoaded) return <div style={{minHeight:'100vh',background:BG}} />
if (!user) { router.push('/sign-in'); return null }
```

### Client data resolver:
```tsx
function getClientData(id: string) {
  switch(id) {
    case 'arcturus': return {
      meta: arcturusFinancial.org,
      metrics: arcturusFinancial.situationMetrics,
      contradictions: arcturusFinancial.contradictions,
      financials: arcturusFinancials,
      technology: arcturusTechnology,
      leadership: arcturusLeadership,
      regulatory: arcturusRegulatory,
      industry: arcturusIndustryData,
      color: '#818CF8',
      status: 'Active',
    }
    case 'meridian': return {
      meta: meridianHealth.org,
      metrics: meridianHealth.situationMetrics || [],
      contradictions: meridianHealth.contradictions,
      color: '#2DD4C8',
      status: 'Active',
    }
    case 'firstcapital': return {
      meta: firstCapital.org,
      metrics: firstCapital.situationMetrics || [],
      contradictions: firstCapital.contradictions || [],
      color: '#6366F1',
      status: 'Active',
    }
    case 'apexretail': return {
      meta: apexRetail.org,
      metrics: apexRetail.situationMetrics || [],
      contradictions: apexRetail.contradictions || [],
      color: '#F59E0B',
      status: 'Active',
    }
    case 'nexora': return {
      meta: nexoraRetail.org,
      metrics: nexoraRetail.situationMetrics,
      contradictions: nexoraRetail.contradictions,
      color: '#F97316',
      status: 'Setup',
    }
    default: return null
  }
}
```

### State:
```tsx
const [tab, setTab] = useState('admin')
const [adminSection, setAdminSection] = useState('setup')
const [diTab, setDiTab] = useState('client')
const [projView, setProjView] = useState('dashboard')
const [showNewProject, setShowNewProject] = useState(false)
```

### Page layout:
```tsx
const data = getClientData(clientId)
if (!data) return <div style={{minHeight:'100vh',background:BG,color:WHITE,display:'flex',alignItems:'center',justifyContent:'center'}}>Client not found</div>

return (
  <div style={{minHeight:'100vh',background:BG,fontFamily:SANS,color:WHITE}}>
    <AbarvaNav activePage="maestro" clientId={clientId} />
    
    {/* Breadcrumb */}
    <div style={{background:CARD,borderBottom:`1px solid ${BORDER}`,padding:'0 32px',height:'40px',display:'flex',alignItems:'center',gap:'12px'}}>
      <a href="/admin" style={{fontFamily:MONO,fontSize:'10px',color:TEAL,textDecoration:'none',letterSpacing:'.05em',textTransform:'uppercase' as const}}>← All engagements</a>
      <div style={{width:'1px',height:'16px',background:BORDER}} />
      <span style={{fontSize:'12px',color:MUTED}}>{data.meta.name}</span>
    </div>

    <div style={{maxWidth:'1400px',margin:'0 auto',padding:'0 28px 80px'}}>
      <ClientHeader data={data} />
      <TabBar tab={tab} setTab={setTab} />
      <TabContent />
    </div>
  </div>
)
```

### CLIENT HEADER:
```tsx
<div style={{padding:'20px 0 0',display:'flex',alignItems:'center',gap:'14px'}}>
  <div style={{width:12,height:12,borderRadius:'50%',background:data.color,flexShrink:0}} />
  <div style={{flex:1}}>
    <div style={{fontSize:'22px',fontWeight:500,color:WHITE,lineHeight:1.2}}>{data.meta.name}</div>
    <div style={{fontSize:'12px',color:MUTED,marginTop:'4px'}}>
      {data.meta.type} · ${data.meta.revenue}B revenue · {data.meta.employees?.toLocaleString()} employees · {data.meta.headquarters}
    </div>
  </div>
  <span style={{fontFamily:MONO,fontSize:'10px',padding:'3px 10px',borderRadius:'20px',
    background: data.status==='Active' ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)',
    color: data.status==='Active' ? GREEN : AMBER,
    border: `1px solid ${data.status==='Active' ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.25)'}`,
    letterSpacing:'.06em',textTransform:'uppercase' as const}}>
    {data.status}
  </span>
</div>
```

### TAB BAR (6 tabs):
```tsx
{[
  {id:'admin', label:'Admin'},
  {id:'overview', label:'Overview'},
  {id:'data', label:'Data Intelligence'},
  {id:'projects', label:'Projects'},
  {id:'approvals', label:'Approvals', badge:2},
  {id:'activity', label:'Activity'},
].map(t => (
  <button key={t.id} onClick={()=>setTab(t.id)} style={{
    background:'transparent',border:'none',cursor:'pointer',fontFamily:SANS,
    fontSize:'13px',color: tab===t.id ? TEAL : MUTED,
    padding:'0 18px',height:'44px',
    borderBottom: tab===t.id ? `2px solid ${TEAL}` : '2px solid transparent',
    display:'flex',alignItems:'center',gap:'6px',
  }}>
    {t.label}
    {t.badge && <span style={{fontFamily:MONO,fontSize:'9px',
      background:'rgba(239,68,68,0.15)',color:RED,padding:'1px 5px',borderRadius:'10px'}}>
      {t.badge}
    </span>}
  </button>
))}
```

---

### TAB 1: ADMIN

Four pill sub-section buttons:
[Setup & engagement] [Data & approvals] [Maestro users] [Security & governance]

**SETUP & ENGAGEMENT sub-section — two columns:**

Left — 4 steps (use real data.meta values):
```
Step 1 ✓ (green circle ✓):
  "1. Organization confirmed"
  "{data.meta.name} · {data.meta.type} · ${data.meta.revenue}B"
  "Completed by [user.fullName] · Apr 10, 2026"

Step 2 ✓ (green):
  "2. Foundation data uploaded"
  File list with colored dots:
  For arcturus: show arcturusFinancials.source files:
    ● arcturus_financials_2024.xlsx — Thomas Kellner (CFO) · Apr 1 · 96% confidence
    ● arcturus_technology_inventory.xlsx — Michael Santos · Apr 2 · 88% confidence
    ● arcturus_leadership_profiles.docx — Sarah Chen · Apr 3 · 91% confidence
    ● arcturus_regulatory_matters.xlsx — Sarah Chen · Apr 4 · 94% confidence
    ○ Vendor contracts — pending approval (amber)
  Buttons: "+ Upload file" and "Download templates"

Step 3 ✓ (green):
  "3. Maestro users set up"
  "2 Maestros active · 1 client stakeholder invited"
  CTA: "Manage users →" → switches to users sub-section

Step 4 ✓ (green) OR pending (circle outline):
  "4. Baseline locked"
  IF locked: "Apr 14, 2026 · Confirmed by Victoria Hargreaves (CEO)"
             "Immutable — cannot be changed" (green text)
  IF pending: "Schedule baseline interview → "
```

Right column — two cards:
Card 1 — Engagement settings (edit button):
  Client | Start date | Fee model: 15% of verified savings | Admin Maestro | Baseline | Scope
  "+ Open new engagement cycle →"

Card 2 — Products unlocked (5 rows with status):
  Situation: Active (green) — linked to /diagnose?client=[id]
  Strategy: Active (green) — linked to /ai-strategy?client=[id]
  Vendor: IF vendor contracts missing → "Partial — needs vendor data" (amber) ELSE Active
  Business Case: Active (green) — linked to /justify?client=[id]
  Outcomes: Active (green) — linked to /outcomes?client=[id]

**DATA & APPROVALS sub-section:**

Section 1 — Pending Admin approval ("2 pending" amber badge):
  Note: "Maestros can upload files. They stay inactive until you approve."
  Two file rows, each:
    [file type icon amber] filename | uploader · date · note | [Approve] [Reject] buttons
  File 1: arcturus_vendor_contracts_v2.xlsx · Priya Malhotra · Apr 15
  File 2: arcturus_ai_portfolio_update.docx · Priya Malhotra · Apr 15

Section 2 — Approved files (+ Upload file button):
  For Arcturus: 4 file rows (financials 96%, technology 88%, leadership 91%, regulatory 94%)
  Each: [green icon] filename | Approved by · date · confidence %

**MAESTRO USERS sub-section — two columns:**

Card 1 — Maestro team (+ Invite Maestro button):
  [AS teal] Anand Sundaram · anand@abarva.com · "Admin" badge · Last active today
  [PM purple] Priya Malhotra · priya@abarva.com · "Maestro" badge · [Edit] [Remove]
  [? dim] james.okafor@arcturus.com · Pending · [Resend]

Card 2 — Client stakeholders (+ Invite client button):
  Note: "Approvals only. Cannot run products or view data."
  [RM amber] Raj Malhotra (CIO) · raj.malhotra@arcturus.com · [Edit]

**SECURITY & GOVERNANCE sub-section:**

Two side-by-side cards:
  Card 1 — Access & security:
    Toggle: Require MFA · Toggle: SSO enforced · Toggle: Client access
    KV: Session timeout 8hr · Data region: US East
  Card 2 — Data governance:
    Toggle: File approval required (ON) · Toggle: Admin must approve reports (ON)
    Toggle: Audit log — always ON, greyed/non-clickable
    KV: Data retention 7 years

Compliance (full width, 3 items): SOC 2 ✓ · GDPR ✓ · HIPAA ✓

---

### TAB 2: OVERVIEW

Pull REAL DATA from data.metrics array. Each metric in situationMetrics has:
{ label, value, benchmark, status, gap }

Two rows of 4 metric cards. For Arcturus use arcturusFinancial.situationMetrics (8 metrics).
Each card:
  bg CARD, border-left 3px: status==='critical' → RED, status==='warning' → AMBER
  label (mono 10px dim uppercase)
  value (Georgia 22px): critical → RED, warning → AMBER
  benchmark (11px dim)
  gap (11px 500): same color as value

Row 1 (metrics 0–3): C/I Ratio · AI with ROI · CDO Status · MAS FEAT
Row 2 (metrics 4–7): Portal · Reporting Latency · Net Flows · AI Maturity

Two-column body (flex: 1 left, 260px right):

LEFT:
Card — Key findings (pull from data.contradictions):
  Header: "Key findings" + "Run Situation →" link → /diagnose?client=[id]
  3 findings, each:
    Colored left stripe (3px, red/amber) + title (contradiction text) + detail + source pills
    Finding 1 (red): data.contradictions[0]
    Finding 2 (red): data.contradictions[1]
    Finding 3 (amber): data.contradictions[2]
  Source pills per finding: "Client data" · "Industry benchmark" · "Genome"

Card — Next actions (3 numbered):
  1. Most urgent regulatory action → Approvals tab
  2. Most urgent data gap → Data Intelligence tab
  3. Most urgent organizational action → (relevant tab)

RIGHT (260px):
Card — Genome patterns (4 patterns from KNOWN DATA above):
  For Arcturus: F005 (82%) · F002 (84%) · F003 (68%) · F004 (76%)
  Each: failure rate % large red + pattern name + mitigation note
  Footer: "All 4 patterns present · 340-pattern library"

Card — Recent activity (5 rows): time · text · type badge
  Baseline (green) · Product (purple) · Data (teal) · Approval (amber) · Setup (gray)

Card — Pending approvals (compact): 2 pending with timestamps + "Review all →"

---

### TAB 3: DATA INTELLIGENCE

Confidence score: shown in tab header right-side, always visible.
For Arcturus: derive from weighted average of dimension files.

4 sub-tab pills (click switches content):
[● Client data 92%] [● Industry 89%] [● Public data 86%] [● Genome patterns 97%]

Content — two columns: file list left, insights panel right.

**CLIENT DATA sub-tab:**

Left — file list with real data from arcturusFinancials + arcturusTechnology + etc:
  Note: "Files provided by {data.meta.name}. Primary data layer for all 5 products."
  
  Active files (show real data):
    [XLS teal] arcturus_financials_2024.xlsx
      "{arcturusFinancials.uploadedBy} · {arcturusFinancials.uploadedDate}"
      "3yr P&L, cost structure, IT budget, AI investment breakdown"
      Active | {arcturusFinancials.confidence * 100}%
    
    [XLS teal] arcturus_technology_inventory.xlsx
      "{arcturusTechnology.uploadedBy} · {arcturusTechnology.uploadedDate}"
      "234 systems catalogued · OMS, risk, CRM, data architecture"
      Active | {arcturusTechnology.confidence * 100}%
    
    [DOC teal] arcturus_leadership_profiles.docx
      "{arcturusLeadership.uploadedDate}"
      "6 executives · priorities, concerns, decision style, direct quotes"
      Active | {arcturusLeadership.confidence * 100}%
    
    [XLS teal] arcturus_regulatory_matters.xlsx
      "{arcturusRegulatory.uploadedDate}"
      "{arcturusRegulatory.openMatters.length} open matters · {arcturusRegulatory.upcomingRequirements.length} upcoming requirements"
      Active | {arcturusRegulatory.confidence * 100}%
  
  Missing files (dimmed 55%):
    [? dim] Vendor contracts & SLA data
      "Not uploaded · Template available"
      "Unlocks: Vendor product · SLA credit detection · +5% confidence"
      Missing (red pill)
    
    [? dim] Pre-engagement outcome baselines
      "Required for Business Case and Outcomes products"
      "Unlocks: Business Case · Outcomes · fee calculation · +7% confidence"
      Missing (red pill)
  
  DATA REQUEST button at bottom:
    "Request new dataset →" → opens request form overlay

Right panel (3 stacked cards):
  Confidence:
    Overall % (derived from uploaded files)
    4 bars: Client · Genome · Industry · Public with real %s

  Critical findings (from contradictions):
    3 insights with ibadge + source + text

  Missing data impacts:
    Vendor contracts: +5% · "Unlocks Vendor product"
    Outcome baselines: +7% · "Unlocks Business Case"

DATA REQUEST TIER display:
  For each file that EXISTS but is not approved for this project:
    Show: [lock icon] "Dataset name" | "Available — request access"
    [Request access →] button
  For files that don't exist:
    [+ Request new dataset] at bottom of list

**INDUSTRY sub-tab:**

Left — benchmark sets from arcturusIndustryData.sources + peerBenchmarks:
  Show all benchmark sources: Oliver Wyman · McKinsey · Gartner · AbarVa · Forrester · ICI
  Each: amber icon + name + description + Active | confidence%

  Key benchmarks to display (from arcturusIndustryData.peerBenchmarks):
    C/I Ratio: Arcturus 71% vs peer median 61% vs top quartile 52%
    Tech spend: Arcturus 4.2% revenue vs peer median 3.1% ("35% overspend, under-outcomes")
    AUM per employee: from peerBenchmarks.aumPerEmployee
    AI maturity: Arcturus 28/100 vs peer median 54
    Net flows: Arcturus -$28B vs industry institutional average

Right panel:
  Key benchmark gaps card:
    Gap 1: C/I ratio 71% vs 61% peer median → $840M gap (critical)
    Gap 2: Tech spend 4.2% vs 3.1% peer median → "35% more spend, proportional outcomes missing" (warning)
    Gap 3: Net flows -$28B vs peers +$12B avg (critical)

**PUBLIC DATA sub-tab:**

Left — public sources (from arcturusIndustryData.sources):
  [PDF purple] Arcturus Annual Report 2024 | Parsed | 94%
  [PDF purple] SEC Form ADV 2025 — Arcturus | SEC EDGAR · AI disclosure gaps | Parsed | 98%
  [REG purple] MAS FEAT public registry | Status: Non-compliant · Enforcement window | Live | 99%
  [REG purple] FCA Register — Arcturus UK Ltd | FCA follow-up flagged Mar 2026 | Monitored | 97%
  [NEWS purple] Press & news monitoring 90 days | Bloomberg · Reuters · FT · 34 articles | Live | 82%
  [PDF purple] Analyst coverage 2025/26 | 6 reports · Avg target $47.20 · C/I cited in 5/6 | Parsed | 88%

Right panel:
  From public data:
    Critical · SEC Form ADV: "AI disclosure gaps in public filing — model governance not described"
    Critical · MAS Registry: "Non-compliant status publicly recorded — enforcement window open"
    Warning · Annual Report: "CEO references AI strategy — no quantified targets"

**GENOME PATTERNS sub-tab:**

Left — patterns matched to this client (from GENOME data):
  For Arcturus, show 4 matched patterns:
    [G green] F005: CDO/AI Leadership Vacant
      "14 prior engagements · 82% failure rate · PRESENT in this engagement"
      "Mitigation: Appoint interim CDO within 30 days — not optional"
      Risk 82% (red pill)
    
    [G green] F002: No Named Executive Sponsor
      "22 prior engagements · 84% failure rate · PRESENT — individual AI initiatives"
      "Mitigation: Each initiative needs a named C-suite owner with budget authority"
      Risk 84%
    
    [G green] F003: Data Readiness Below Threshold
      "18 prior engagements · 68% failure rate · PRESENT — no golden record"
      "Mitigation: MDM must precede AI portfolio rationalization"
      Risk 68%
    
    [G green] F004: Pilot Purgatory
      "12 prior engagements · 76% failure rate · PRESENT — 28 initiatives, 0 scaled"
      "Mitigation: Rationalize portfolio to 5 funded initiatives before adding new ones"
      Risk 76%

Right panel (2 cards):
  Card 1 — "All 4 patterns present — action required":
    Sorted by risk: F002 (84%) · F005 (82%) · F004 (76%) · F003 (68%)
  
  Card 2 — "Positive signals" (green border):
    "Cost problem not revenue — efficiency fixable at $500M AUM/employee"
    "New CIO Raj Malhotra from JPMorgan — similar profile resolved MDM in 8/10 prior cases"

---

### TAB 4: PROJECTS

View switcher: [Dashboard] [All projects] — pill buttons

**DASHBOARD view:**

Stats strip (5 cards, colored top borders):
  Total projects: 5 (teal)
  Active: 2 (green)
  Completed this month: 1 (gray)
  Product runs this month: 36 (purple)
  Maestros active: 2 (amber)

Maestro usage table (card):
  Columns: Maestro | Projects | Product runs | Last active | Most used | Activity bar
  Row 1: [AS] Anand Sundaram · Admin Maestro | 4 | 34 this month | Today 11:22 | Sit+Str | 100%
  Row 2: [PM] Priya Malhotra · Maestro | 1 | 2 this month | Today 14:22 | Situation | 6%
  "+ Invite Maestro" link

Active projects quick view (card):
  Header: "Active projects" + "View all →" (switches view)
  2 rows: project name + client + day | progress % | products | findings | maestro

**ALL PROJECTS view:**

Filter bar: [search input] [All✓] [Active] [Complete] [Archived] [Sort dropdown]

Table (7 columns):
  Project (name + client + date) | Maestro | Products | Last active | Findings | Progress | Status

Rows with REAL project data for this client:
  "AI Governance Gap Analysis" · Apr 14 · Day 4 | AS | Sit✓ Str→ | Today | 6 · 4 crit | 60% | Active
  "Salesforce FSC Recovery" · Apr 16 · Day 2 | AS | Sit✓ | Apr 16 | 3 · 2 crit | 25% | In progress
  "Initial Situation Diagnostic" · Apr 10 | AS | Sit✓ | Apr 14 | 4 | 100% | Complete (dimmed)

Hover row → background #1C2D45
Click row → (for demo: highlight the row with teal left border)
Footer: "Showing X of X projects · At 100 projects: filters, search, and pagination apply"

New project form (when "+ New project" clicked — appears at top):
  Name input · Problem description textarea
  Products checkboxes: [Situation] [Strategy] [Vendor] [Business Case]
  Status selector (for demo purposes): Working | Submitted | Approved | Not approved
  [Create project →] [Cancel]

PROJECT STATUS BADGES (important — shows the lifecycle):
  Working → amber "In progress"
  Submitted → teal "Awaiting approval"  
  Approved → green "In execution"
  Not approved → gray "Archived"

---

### TAB 5: APPROVALS

3 sections:

Section 1 — Pending your review (amber "2 pending"):
  Note: "Maestros upload files. They stay inactive until you approve."
  
  Row 1: [XLS amber] arcturus_vendor_contracts_v2.xlsx
    "Priya Malhotra · Apr 15, 14:22 · Updated vendor SLA terms from Q1 renegotiation"
    [PM avatar] Priya Malhotra
    [Approve] [Restrict] [Reject] buttons
  
  Row 2: [DOC amber] arcturus_ai_portfolio_update.docx
    "Priya Malhotra · Apr 15, 09:45 · Added 3 new initiatives from CIO briefing"
    [PM avatar]
    [Approve] [Restrict] [Reject] buttons

Section 2 — Sent to client (awaiting response):
  Row: "AI Governance Gap Analysis — project report"
    "Sent to Raj Malhotra (CIO) · Apr 15, 11:08"
    [RM avatar amber] Raj Malhotra (CIO)
    [Awaiting badge]

Section 3 — Resolved (history, 70% opacity):
  Row 1: arcturus_situation_findings.pdf | [Approved green] | Raj Malhotra · Apr 12
    "Findings confirmed. Proceed with recommendations."
  Row 2: arcturus_competitor_benchmarks.xlsx | [Restricted amber] | Thomas Kellner · Apr 11
    "Internal use only"

---

### TAB 6: ACTIVITY

Header: "Every action on this engagement. Automatic. Immutable." + [Export CSV] button

2 project activity cards:

Card 1 — "AI governance gap analysis" · Active badge:
  Table: Time | Actor | Action + detail | Type badge
  
  Today 11:22 | Anand S. · Admin Maestro
    "Strategy product run — Arcturus Financial"
    "3 AI bets identified · Wave 1: AI governance · Wave 2: MDM · Wave 3: Portal recovery"
    Product (purple)
  
  Today 09:14 | Anand S. · Admin Maestro
    "Baseline locked · Confirmed by Victoria Hargreaves (CEO)"
    "8 metrics locked: C/I 71%, AI 0/28, portal 44%, MAS overdue, reporting 3 days..."
    Baseline (green)
  
  Apr 14 08:30 | Anand S. · Admin Maestro
    "Situation product run — Arcturus Financial"
    "6 critical findings · 4 Genome patterns matched · 91% confidence · CDO vacancy flagged"
    Product (purple)

Card 2 — "Engagement setup" · Complete badge:
  Apr 13 16:45 | Sarah Chen · Client CRO
    "File uploaded: arcturus_regulatory_matters.xlsx"
    "2 open matters · 5 upcoming requirements · Confidence +4%"
    Data (teal)
  
  Apr 12 14:30 | Raj Malhotra · Client CIO
    "Approval: arcturus_situation_findings.pdf — Approved"
    '"Findings confirmed. Proceed with recommendations."'
    Approval (amber)
  
  Apr 10 09:00 | Anand S. · Admin Maestro
    "Engagement created — Arcturus Financial Group"
    "Step 1 complete · Organization confirmed · Admin Maestro assigned"
    Setup (gray)

### QA — Task 3:
```
□ /admin/client/arcturus loads — dark bg, breadcrumb, client header
□ /admin/client/meridian loads — different name/color/metrics
□ /admin/client/firstcapital loads
□ /admin/client/apexretail loads
□ /admin/client/nexora loads — "Setup" status badge
□ "← All engagements" → /admin
□ 6 tabs visible, all clickable

ADMIN TAB:
□ 4 sub-section pills clickable, content switches
□ Setup: 4 steps render with checkmarks
□ Setup: File list shows real file names (from arcturusFinancials data)
□ Setup: Confidence percentages match data files (96%, 88%, 91%, 94%)
□ Setup: Product links work (Situation → /diagnose?client=arcturus)
□ Data & approvals: 2 pending files with Approve/Reject buttons
□ Data & approvals: 4 approved files with Replace button
□ Maestro users: 3 users with correct badges
□ Security: Toggles render (all ON by default)
□ Compliance: 3 badges with checkmarks

OVERVIEW TAB:
□ 8 metric cards render from arcturusFinancial.situationMetrics
□ C/I Ratio shows "71%" in red
□ AI with ROI shows "0 of 28" in red
□ CDO shows "Vacant" in red
□ MAS FEAT shows "Overdue" in red
□ Portal shows "44%" in amber
□ Reporting shows "3 days" in red
□ Net Flows shows "-$28B" in red
□ AI Maturity shows "28/100" in amber
□ 3 findings pull from arcturusFinancial.contradictions
□ Source pills appear on each finding
□ Genome patterns show 4 patterns with failure rates
□ "Run Situation →" links to /diagnose?client=arcturus

DATA INTELLIGENCE TAB:
□ 4 sub-tabs visible with confidence percentages
□ Client data sub-tab: 4 active files with real names from data files
□ Client data: Confidence matches file data (96%, 88%, 91%, 94%)
□ Client data: 2 missing files shown (dimmed)
□ Client data: Upload and request buttons visible
□ Industry sub-tab: benchmark data from arcturusIndustryData
□ Industry: Shows real peer comparisons (71% vs 61%, etc.)
□ Public data sub-tab: 6 sources including MAS FEAT live status
□ Genome sub-tab: 4 patterns with correct failure rates (F005 82%, F002 84%, F003 68%, F004 76%)
□ Right panel updates when switching sub-tabs

PROJECTS TAB:
□ Dashboard loads with correct stats
□ Maestro usage shows 2 users
□ View switcher works (Dashboard ↔ All projects)
□ Table shows 3 projects with correct status badges
□ Working → amber "In progress"
□ Submitted → teal "Awaiting approval"
□ Approved → green "In execution"
□ "+ New project" shows form with status selector

APPROVALS TAB:
□ 3 sections render
□ 2 pending files with Approve/Restrict/Reject buttons
□ Sent to client: 1 row with Awaiting badge
□ Resolved: 2 rows with outcome badges (Approved/Restricted)

ACTIVITY TAB:
□ 2 project cards render
□ Each has Time/Actor/Action/Type columns
□ Type badges correct colors: Product purple · Data teal · Baseline green · Approval amber
□ Export CSV button visible

DATA INTEGRITY:
□ Every metric on Overview traces to arcturusFinancial.situationMetrics
□ Every file on Data Intelligence traces to data files in src/data/arcturus/
□ Confidence percentages match: financials.confidence, technology.confidence, etc.
□ Regulatory matters count matches arcturusRegulatory.openMatters.length
□ Genome patterns match GENOME constants in failure-genome.ts
```

---

## TASK 4 — QA_CHECKLIST.md

Create in repo root:

```markdown
# AbarVa QA Checklist — Complete
Last verified: [date]

## CLEANUP
- [ ] PageShell.tsx deleted
- [ ] DataIntelligenceTab.tsx deleted
- [ ] sign-up/page.tsx deleted
- [ ] No PageShell import in any file
- [ ] No Tailwind classes anywhere
- [ ] /investor is now protected (redirects to /sign-in)

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

## PRODUCT PAGES (do not break these)
- [ ] /diagnose loads — Meridian by default
- [ ] /diagnose?client=arcturus → Arcturus data
- [ ] /diagnose?client=firstcapital → First Capital data
- [ ] CXO switcher: CIO/CFO/COO/CMIO/CEO/Maestro all clickable
- [ ] Each CXO shows different metrics
- [ ] /ai-strategy loads dark
- [ ] /select loads dark
- [ ] /justify loads dark
- [ ] /outcomes loads dark
- [ ] /investor → requires login (protected)

## /admin ENGAGEMENT SELECTOR
- [ ] Shows 5 client cards
- [ ] Meridian, First Capital, Apex: "Active" green badge
- [ ] Arcturus: "Active" green badge
- [ ] Nexora: "Setup" amber badge
- [ ] Click any card → /admin/client/[id]
- [ ] Filter: All / Active / In setup — all work
- [ ] "+ New client engagement" visible
- [ ] Sign out works

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
- [ ] New project form appears on click
- [ ] Approvals 3 sections with working buttons
- [ ] Activity 2 cards with full table rows

## DATA INTEGRITY (most important)
- [ ] Arcturus C/I ratio: exactly "71%" (not 70%, not 72%)
- [ ] Arcturus AI with ROI: exactly "0 of 28"
- [ ] Arcturus CDO: "Vacant" / "11 months"
- [ ] Arcturus MAS: "Overdue" (not "In progress")
- [ ] Arcturus portal: "44%"
- [ ] Arcturus reporting: "3 days"
- [ ] Arcturus net flows: "-$28B"
- [ ] Arcturus AI maturity: "28/100"
- [ ] Meridian denial rate: "18.2%"
- [ ] Meridian operating margin: "1.8%"
- [ ] Nexora Einstein AI: "Not activated · 18 months idle"
- [ ] Genome F005 failure rate: exactly "82%"
- [ ] Genome F002 failure rate: exactly "84%"
- [ ] Confidence percentages trace to data files (arcturusFinancials.confidence = 0.96 → show 96%)

## BUILD
- [ ] npm run build → exits 0
- [ ] npx tsc --noEmit → zero errors
- [ ] No console errors on any page
- [ ] No 404s on any asset or import
```

---

## TASK 5 — BUILD AND COMMIT

```bash
# Step 1: Cleanup verification
grep -r "PageShell" src/ && echo "FAIL: PageShell still present" || echo "PASS"
grep -r "DataIntelligenceTab" src/ && echo "FAIL" || echo "PASS"
grep -r "bg-gray" src/ && echo "FAIL: Tailwind present" || echo "PASS"

# Step 2: Solutions pages check
wc -l src/app/solutions/*/page.tsx
# Each must be >30 lines. If any is 19, re-do Task 0d.

# Step 3: TypeScript
npx tsc --noEmit
# Fix ALL errors before proceeding. Common issues:
#   useParams() → always cast: const clientId = params.id as string
#   useUser() → always check isLoaded before accessing user
#   textTransform:'uppercase' → must be 'uppercase' as const
#   Object access → use optional chaining: data?.meta?.name

# Step 4: Build
npm run build
# Must exit 0. Fix all errors.

# Step 5: Self-QA
# Run through QA_CHECKLIST.md systematically.
# Mark each item PASS or FAIL. Fix every FAIL.
# Report final: X/Y passing before commit.

# Step 6: Commit
git add -A
git commit -m "feat: Complete AbarVa platform — homepage redesign, Maestro workspace 6 tabs, data integrity, comprehensive QA"
git push
```

---

## ABSOLUTE CODING RULES

1. 'use client' at top of EVERY file using hooks or browser APIs
2. Dark design only — BG #060A12 everywhere, no exceptions
3. AbarvaNav on every page — no custom nav wrappers
4. Tabs switch via useState — never router.push for tab changes
5. All interactive elements: cursor:'pointer'
6. useUser(): always check isLoaded first
7. useParams(): always cast — const id = params.id as string
8. No inline <style> tags — only style={{}} with typed constants
9. Every metric on screen must trace to a real value in src/data/
10. Every navigation link must resolve to a real page
11. Every button must do something visible when clicked
12. The /admin engagement selector is ALREADY BUILT — do not modify it
13. The product pages (diagnose, ai-strategy, select, justify, outcomes) are WORKING — only remove PageShell, touch nothing else


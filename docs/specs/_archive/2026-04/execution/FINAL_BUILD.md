# AbarVa — Final Build Instruction
# Everything remaining. Execute in order. Nothing else touched.

---

## WHAT IS WORKING (do not touch)
- /admin/client/[id] — 6-tab workspace with real data
- All product pages (diagnose, ai-strategy, select, justify, outcomes)
- /admin engagement selector
- Build passes, 0 TypeScript errors

## WHAT THIS BUILDS
- Role-based routing after sign-in
- Nav shows correct auth state (signed in vs out)
- Nav shows correct client name per page
- Identity (name, avatar, sign out) in nav
- /investor secured behind login
- sign-up page deleted
- Four solution pages with intake flow
- /solutions/tech (new route)
- User creation script in repo root

---

## TASK 1 — CREATE src/app/auth-redirect/page.tsx

```tsx
'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthRedirect() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (!user)  { router.push('/sign-in'); return }

    const role     = user.publicMetadata?.role     as string | undefined
    const clientId = user.publicMetadata?.clientId as string | undefined

    if (role === 'investor') { router.push('/investor');                     return }
    if (role === 'admin')    { router.push('/admin');                         return }
    if (clientId)            { router.push(`/admin/client/${clientId}`);     return }
    router.push('/admin')
  }, [isLoaded, user, router])

  return (
    <div style={{
      minHeight:'100vh', background:'#060A12', display:'flex',
      alignItems:'center', justifyContent:'center',
      fontFamily:'JetBrains Mono, monospace', fontSize:'11px',
      color:'#2DD4C8', letterSpacing:'.1em', textTransform:'uppercase' as const,
    }}>
      Loading your workspace...
    </div>
  )
}
```

---

## TASK 2 — UPDATE src/app/layout.tsx

Change ClerkProvider to:
```tsx
<ClerkProvider
  signInUrl="/sign-in"
  afterSignInUrl="/auth-redirect"
  afterSignUpUrl="/auth-redirect"
>
```
Remove signUpUrl="/sign-up".

---

## TASK 3 — UPDATE src/middleware.ts

Full replacement:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/auth-redirect(.*)',
  '/solutions(.*)',
  '/diagnose(.*)',
  '/ai-strategy(.*)',
  '/justify(.*)',
  '/select(.*)',
  '/outcomes(.*)',
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
Changes vs current: /auth-redirect added, /investor removed, /sign-up removed.

---

## TASK 4 — UPDATE src/components/AbarvaNav.tsx

Add at the very top after 'use client':
```tsx
import { useUser, useClerk } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
```

Add inside the component function, after existing useState lines:
```tsx
const { user, isLoaded }  = useUser()
const { signOut }         = useClerk()
const pathname            = usePathname()
const router              = useRouter()
const [userMenuOpen, setUserMenuOpen] = useState(false)

const signedIn = isLoaded && !!user

// Derive current client from URL path
// /admin/client/arcturus → 'arcturus'
const urlClientId = pathname?.split('/admin/client/')?.[1]?.split('/')?.[0] || null

const CLIENT_NAMES: Record<string, string> = {
  meridian:     'Meridian Health',
  firstcapital: 'First Capital',
  apexretail:   'Apex Retail',
  arcturus:     'Arcturus Financial',
  nexora:       'Nexora Retail',
}

const displayName = user?.fullName ||
  user?.emailAddresses?.[0]?.emailAddress?.split('@')?.[0] || 'Maestro'
const initials = displayName
  .split(' ')
  .map((n: string) => n[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()
```

Replace the ENTIRE right side of nav (from `{/* Right side */}` to its closing `</div>`
just before `</div></nav>`):

```tsx
<div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>

  {signedIn ? (
    <>
      {/* Current client name — static, derived from URL */}
      {urlClientId && CLIENT_NAMES[urlClientId] && (
        <span style={{
          fontSize:'13px', color:MUTED, padding:'0 16px',
          borderLeft:`1px solid ${BORDER}`, borderRight:`1px solid ${BORDER}`,
        }}>
          {CLIENT_NAMES[urlClientId]}
        </span>
      )}

      {/* My workspace text link */}
      <a href="/admin" style={{
        fontSize:'12px', color:MUTED, textDecoration:'none',
        fontFamily:'monospace', letterSpacing:'.04em', padding:'0 8px',
      }}>
        My workspace
      </a>

      {/* Identity button + dropdown */}
      <div style={{ position:'relative' }}>
        <button onClick={() => setUserMenuOpen(o => !o)} style={{
          display:'flex', alignItems:'center', gap:'8px',
          background:'rgba(45,212,200,0.06)',
          border:`1px solid rgba(45,212,200,0.2)`,
          borderRadius:'8px', padding:'6px 12px', cursor:'pointer',
        }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'12px', fontWeight:500, color:TEXT }}>
              {displayName}
            </div>
            <div style={{ fontSize:'10px', color:MUTED }}>Admin Maestro</div>
          </div>
          <div style={{
            width:'30px', height:'30px', borderRadius:'50%',
            background:'rgba(45,212,200,0.15)',
            border:`1px solid rgba(45,212,200,0.3)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'11px', fontWeight:600, color:TEAL, fontFamily:'monospace',
          }}>
            {initials}
          </div>
        </button>

        {userMenuOpen && (
          <div style={{
            position:'absolute', top:'calc(100% + 6px)', right:0,
            background:PAGE_BG, border:`1px solid ${BORDER}`,
            borderRadius:'10px', padding:'6px 0',
            zIndex:300, minWidth:'160px',
          }}>
            <a href="/admin" onClick={() => setUserMenuOpen(false)} style={{
              display:'block', padding:'9px 16px',
              fontSize:'13px', color:TEXT, textDecoration:'none',
            }}>
              My workspace
            </a>
            <button
              onClick={() => { setUserMenuOpen(false); signOut(() => router.push('/')) }}
              style={{
                width:'100%', textAlign:'left', padding:'9px 16px',
                fontSize:'13px', color:MUTED, background:'transparent',
                border:'none', borderTop:`1px solid ${BORDER}`,
                cursor:'pointer', fontFamily:'DM Sans, sans-serif',
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </>

  ) : (
    <>
      {/* Investor view — amber, subtle */}
      <a href="/investor" style={{
        fontSize:'12px', color:'#F59E0B', textDecoration:'none',
        padding:'6px 12px',
        border:'1px solid rgba(245,158,11,0.3)', borderRadius:'6px',
      }}>
        Investor view
      </a>

      {/* Login button */}
      <a href="/sign-in" style={{
        background:TEAL, color:'#060A12',
        fontSize:'13px', fontWeight:600, textDecoration:'none',
        padding:'8px 18px', borderRadius:'8px', flexShrink:0,
      }}>
        Login →
      </a>
    </>
  )}

</div>
```

Remove these old blocks entirely (they are replaced by the code above):
  {/* Active client pill */} — the entire block
  {/* Investor View */}     — the entire block
  {/* Maestro CTA */}       — the entire block

---

## TASK 5 — DELETE src/app/sign-up/page.tsx

```bash
rm src/app/sign-up/page.tsx
```

---

## TASK 6 — REBUILD src/app/solutions/pdlc/page.tsx

```tsx
'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const BG='#060A12',CARD='#0D1520',BORDER='#1C2D45',TEAL='#2DD4C8'
const WHITE='#EFF6FF',MUTED='#94A3B8',DIM='#475569'
const RED='#EF4444',AMBER='#F59E0B',GREEN='#34D399'
const SANS='DM Sans, sans-serif',MONO='JetBrains Mono, monospace',SERIF='Georgia, serif'

const PHASES = [
  { num:1, color:TEAL, title:'Diagnose the delivery bottleneck',
    desc:'AbarVa maps every handoff, every meeting displacing building, every vendor dependency without internal capability. In 48 hours you know exactly where your delivery cycle is leaking and which interventions recover the most time.',
    products:['Situation','Data Intelligence'] },
  { num:2, color:AMBER, title:'Embed AI into the build cycle',
    desc:'Maestros embed inside your engineering squads. AI agents handle scaffolding, testing, documentation, and review — the parts that slow humans down. Engineers build what requires judgment. Output doubles.',
    products:['Strategy','Vendor'] },
  { num:3, color:GREEN, title:'Verify improvement · earn the fee',
    desc:'Baseline locked Day 0: cycle time, output per engineer, consulting spend. Monthly actuals tracked. Fee on verified improvement only. If time to production does not drop, we do not get paid.',
    products:['Business Case','Outcomes'] },
]

const GENOME = [
  { rate:'72%', name:'Vendor dependency without internal capability', sub:'Teams cannot verify or recover when the vendor fails' },
  { rate:'61%', name:'Change management gap', sub:'Technology works — adoption fails. Engineers revert.' },
  { rate:'79%', name:'No MLOps infrastructure', sub:'AI cannot reach production without deployment rails' },
]

const DELIVERABLES = [
  'Delivery bottleneck map — every handoff quantified',
  'AI agent integration playbook — squad-level',
  'Vendor selection scored against your stack',
  'Baseline + monthly tracking + fee on verified cycle time reduction',
]

const STARTERS = [
  'Time to production is 16+ months. Engineers spend more time in meetings than building.',
  'We have 80 consultants on site. 70% of their time is onboarding, not building.',
  'We are spending $300M in engineering capital and shipping less than our competitors.',
]

const GENOME_FINDINGS = [
  { severity:'critical' as const, title:'$94M AI committed — zero with delivery infrastructure',
    detail:'28 AI initiatives running. None have MLOps infrastructure. Models cannot reach production. Genome pattern F006 — 79% failure rate without deployment rails.',
    sources:['Client data','Genome F006 · 79%'] },
  { severity:'critical' as const, title:'Technology spend 4.2% of revenue — 35% above peer median',
    detail:'Arcturus spends more than peers on technology without proportional delivery output. The cost is high — the velocity is not matching it.',
    sources:['Client financials','Industry benchmark'] },
]

export default function SolutionPDLC() {
  const [input,    setInput]    = useState('')
  const [step,     setStep]     = useState(0)
  const [selected, setSelected] = useState('')
  const [launched, setLaunched] = useState(false)

  return (
    <div style={{ minHeight:'100vh', background:BG, fontFamily:SANS, color:WHITE }}>
      <AbarvaNav activePage="solutions" />
      <SolutionLayout
        num="1 of 4" name="AI-Powered PDLC"
        tagline="Cut time to production in half. AI agents alongside your engineering teams — not replacing them. Knowledge stays permanently."
        meta={['CIO','All verticals','8–16 week delivery','Outcome-fee model']}
        stats={[
          { label:'Avg time to production', value:'16mo', color:RED, sub:'Enterprise median before AbarVa' },
          { label:'After AbarVa', value:'8mo', color:TEAL, sub:'50% reduction — Genome-validated' },
          { label:'Consulting reduction', value:'$18M', color:AMBER, sub:'Avg annual per engagement' },
          { label:'Knowledge retained', value:'100%', color:GREEN, sub:'Stays inside the org permanently' },
        ]}
        phases={PHASES}
        genome={GENOME}
        deliverables={DELIVERABLES}
        starters={STARTERS}
        findings={GENOME_FINDINGS}
        followUpQ="What is the primary bottleneck — speed, quality, or cost?"
        followUpOpts={['Speed — time to production','Cost — consulting and engineering spend','Quality — rework and failures','All three — they compound']}
        input={input} setInput={setInput}
        step={step} setStep={setStep}
        selected={selected} setSelected={setSelected}
        launched={launched} setLaunched={setLaunched}
      />
    </div>
  )
}
```

NOTE: SolutionLayout is a shared component defined at the bottom of this file
(or in a separate file src/components/SolutionLayout.tsx — see Task 10).

---

## TASK 7 — REBUILD src/app/solutions/delivery/page.tsx

Same structure as PDLC. Replace content with:

```tsx
name="AI-Powered Transformation Delivery"
tagline="Replace 40 consultants with 4 Maestros. Knowledge stays permanently. The engagement ends; the intelligence does not."
meta={['CIO · CTO','All verticals','Full engagement lifecycle','Outcome-fee model']}
stats={[
  { label:'Typical consulting team', value:'40', color:RED, sub:'People — 70% time onboarding' },
  { label:'AbarVa Maestro team', value:'4', color:TEAL, sub:'Embedded — knowledge stays permanently' },
  { label:'Knowledge lost (consulting)', value:'100%', color:AMBER, sub:'Exits with the team every Friday' },
  { label:'Consulting avoided', value:'$42M', color:GREEN, sub:'Avg annual spend replaced (Arcturus)' },
]}
phases={[
  { num:1, color:TEAL, title:'Diagnose — what you are actually paying for',
    desc:'AbarVa maps every consulting relationship: what is delivered vs promised, what knowledge stays vs leaves, what is rebuilt engagement after engagement.',
    products:['Situation'] },
  { num:2, color:AMBER, title:'Prescribe — the Maestro model',
    desc:'Define which consulting relationships to replace, what the Maestro team does instead, how knowledge is captured, and the board-level business case with CFO-grade ROI.',
    products:['Strategy','Business Case'] },
  { num:3, color:GREEN, title:'Execute — Maestros embed, consulting spend drops',
    desc:'Maestros replace the consulting engagement. Fee on verified reduction in consulting spend and verified outcomes delivered.',
    products:['Vendor','Outcomes'] },
]}
genome={[
  { rate:'84%', name:'No named executive sponsor', sub:'Transformation stalls without C-suite ownership' },
  { rate:'76%', name:'Pilot purgatory', sub:'Prior failed engagements create credibility deficit' },
  { rate:'61%', name:'Change management gap', sub:'Technology delivered — adoption fails' },
]}
deliverables={[
  'Consulting relationship audit — value vs cost mapped',
  'Maestro team design — roles, scope, knowledge model',
  'Transition plan — from consulting to Maestros',
  'Fee on verified consulting spend reduction',
]}
starters={[
  '80 consultants on site. 70% of their time is getting up to speed. Knowledge walks out every Friday.',
  'We are spending $42M on consulting annually and cannot point to what has permanently changed.',
  'Every transformation programme ends and we start the next one from scratch.',
]}
findings={[
  { severity:'critical', title:'$42M consulting spend — no documented knowledge transfer',
    detail:'Arcturus spends $42M annually on consulting. No knowledge management. Each engagement restarts from baseline.',
    sources:['Client financials','Genome F001 · 72%'] },
  { severity:'critical', title:'CDO vacant 11 months — no executive to own transformation',
    detail:'Every programme needs a named C-suite owner. Without one, consulting engagements drift without accountability.',
    sources:['Client leadership','Genome F002 · 84%'] },
]}
followUpQ="What is the primary goal — reduce cost, improve outcome quality, or retain knowledge?"
followUpOpts={['Reduce consulting cost','Improve delivery quality and speed','Retain knowledge permanently','All three — they are connected']}
```

---

## TASK 8 — REBUILD src/app/solutions/margin/page.tsx

```tsx
import { arcturusFinancial } from '@/data/arcturus/index'

// In the component, before return:
const ci    = arcturusFinancial.financials.costToIncomeRatio      // 71
const target = arcturusFinancial.org.targetCIRatio                // 58
const gap   = arcturusFinancial.financials.efficiencyGap          // 840
const ai    = arcturusFinancial.financials.aiCommitted            // 94

name="Margin Optimization"
tagline="Identify every margin lever — across revenue, cost structure, and AI portfolio — and create a board-ready recovery plan. Fee charged only on verified savings."
meta={['CEO · CFO · COO','Healthcare · FinServ · Retail','6–12 week delivery','15–20% of verified savings']}
stats={[
  { label:'C/I ratio — Arcturus', value:`${ci}%`, color:RED, sub:`vs ${target}% target · $${gap}M gap` },
  { label:'AI spend committed', value:`$${ai}M`, color:AMBER, sub:'Zero with documented ROI' },
  { label:'Recovery range', value:'$60–120M', color:TEAL, sub:'Annual · Genome-validated' },
  { label:'Fee model', value:'15–20%', color:GREEN, sub:'Of verified savings only' },
]}
phases={[
  { num:1, color:TEAL, title:'Diagnose — where the margin is leaking and why',
    desc:'AbarVa runs financials, cost structure, and AI portfolio through 340 Genome patterns. In 48 hours every margin gap is structured: which are fixable, which are structural, in what order to address them.',
    products:['Situation','Data Intelligence'] },
  { num:2, color:AMBER, title:'Prescribe — the sequenced recovery plan',
    desc:'3–5 specific interventions, sequenced by impact and feasibility. Each with a CFO-grade business case: investment required, savings range, timeline, risk, Genome validation.',
    products:['Strategy','Business Case'] },
  { num:3, color:GREEN, title:'Verify — baseline locked · savings tracked · fee earned',
    desc:'Baseline locked Day 0. Immutable. Monthly actuals tracked. Fee 15–20% of what is actually delivered — not what was promised.',
    products:['Outcomes'] },
]}
genome={[
  { rate:'89%', name:'No named executive sponsor', sub:'Margin programmes without C-suite owner stall at implementation' },
  { rate:'76%', name:'AI spend without verified ROI', sub:'Technology cost inflating margin — no traceable output' },
  { rate:'68%', name:'Cost misattribution', sub:'Teams optimise visible costs — structural drivers intact' },
]}
deliverables={[
  'Margin gap analysis — every driver quantified',
  '3–5 prioritised interventions with ROI ranges',
  'CFO-ready business case per intervention',
  'Baseline locked Day 0 · monthly tracking · fee on verified savings',
]}
// Starters use real data values:
starters={[
  `C/I ratio is ${ci}% vs ${target}% peer target. $${gap}M efficiency gap.`,
  `$${ai}M committed to AI initiatives. Cannot show ROI on any of them.`,
  'Technology is our largest cost after compensation. Cannot show what it is delivering.',
]}
findings={[
  { severity:'critical',
    title:`C/I ratio ${ci}% vs ${target}% target — $${gap}M annual efficiency gap`,
    detail:'Arcturus spends 35% more than peers on technology without proportional outcomes. The margin gap is structural, not cyclical — it will not self-correct.',
    sources:['Client financials','Industry benchmark','Genome (14 cases)'] },
  { severity:'critical',
    title:`$${ai}M AI committed — zero with a documented baseline`,
    detail:'Every initiative contributes to cost. None has a measurable return. Portfolio must be rationalized to 3–5 funded initiatives before adding new ones.',
    sources:['Client data','Genome F002 · 84%'] },
  { severity:'warning',
    title:'$38M client portal investment — 44% adoption, NPS 31',
    detail:'Portal recovery contributes 1.2–2.1pp to operating margin in similar cases once adoption exceeds 70%.',
    sources:['Client technology','Industry benchmark'] },
]}
followUpQ="Who is the executive sponsor — and what outcome do they care most about?"
followUpOpts={['CEO — total margin recovery','CFO — cost discipline and ROI accountability','CIO — technology cost and AI ROI','Board — competitive benchmarking story']}
```

---

## TASK 9 — CREATE src/app/solutions/tech/page.tsx (NEW)

```tsx
import { arcturusTechnology } from '@/data/arcturus/technology'

// In component before return:
const oms  = arcturusTechnology.corePlatform.orderManagement
const age  = oms.age           // 28
const maint = oms.annualMaintenanceCost  // 42
const att  = oms.modernizationAttempts  // 3

name="Technology Modernization"
tagline="Core systems going end-of-life. Three failed modernization attempts. The business case won't get approved. AbarVa diagnoses which systems actually need replacing, builds the case the CFO will approve, and governs the delivery."
meta={['CIO · CFO','All verticals','SAP · FIS · Bloomberg AIM · Epic','Outcome-fee model']}
stats={[
  { label:'Bloomberg AIM age', value:`${age}yr`, color:RED, sub:`$${maint}M annual maintenance` },
  { label:'Failed attempts', value:`${att}`, color:AMBER, sub:'Each built by the vendor — failed' },
  { label:'Success rate', value:'71%', color:TEAL, sub:'When client builds the business case' },
  { label:'Maintenance recovered', value:`$${maint}M`, color:GREEN, sub:'Annual once migration complete' },
]}
phases={[
  { num:1, color:TEAL, title:'Diagnose — which systems actually need replacing',
    desc:'Not everything needs modernizing. AbarVa maps every core system: actual vs perceived technical debt, true cost to maintain vs replace, what the business cannot do because of the system.',
    products:['Situation','Data Intelligence'] },
  { num:2, color:AMBER, title:'Build the case the CFO will approve',
    desc:'Three previous attempts failed because the business case was built by the vendor. AbarVa builds it from the client\'s data with Genome patterns from prior modernizations at peer organisations.',
    products:['Strategy','Vendor','Business Case'] },
  { num:3, color:GREEN, title:'Govern the delivery — Maestros embedded',
    desc:'Maestros govern the implementation. They hold the vendor accountable to the business case. Fee on verified maintenance cost reduction and milestone delivery.',
    products:['Outcomes'] },
]}
genome={[
  { rate:'72%', name:'Vendor dependency without internal capability', sub:'Cannot verify delivery or recover if vendor fails' },
  { rate:'68%', name:'Data readiness below threshold', sub:'Migration starts before data is clean — doubles cost' },
  { rate:'84%', name:'No named executive sponsor', sub:'Programme drifts without C-suite owner — vendor fills vacuum' },
]}
deliverables={[
  'System-by-system modernization assessment',
  'Vendor scored against your data — not analyst opinion',
  'CFO-ready business case with Genome-validated ranges',
  'Delivery governance · milestone tracking · fee on maintenance cost reduction',
]}
starters={[
  `${oms.vendor} is ${age} years old. ${att} failed modernization attempts. $${maint}M annual maintenance.`,
  'Aladdin Risk only covers liquid assets. Regulator wants daily stress testing. We run monthly.',
  '14 data systems. No golden record. 3-day reporting lag. We compete on information advantage.',
]}
findings={[
  { severity:'critical',
    title:`${oms.vendor} — ${age} years old · $${maint}M maintenance · ${att} failed attempts`,
    detail:'The business case was built by the vendor each time. When the client builds it from their own data — success rate is 71%. Vendor-built: 23%.',
    sources:['Client technology','Genome (11 cases)'] },
  { severity:'critical',
    title:'14 data systems — no golden record — 3-day reporting lag',
    detail:'Any OMS modernization fails if the data architecture problem is not solved first. Genome F003 — data readiness — present in 68% of failed modernizations.',
    sources:['Client technology','Genome F003 · 68%'] },
  { severity:'warning',
    title:'Aladdin Risk — alternatives not in real-time risk · regulator wants daily by 2026',
    detail:'This creates a compliance deadline that changes the CFO calculation entirely — the cost of NOT modernizing becomes visible.',
    sources:['Client technology','Regulatory deadline'] },
]}
followUpQ="What has stopped the CFO from approving this before?"
followUpOpts={[
  'Business case built by the vendor — not trusted',
  'Risk too high — too many unknowns',
  'Cost too high relative to perceived benefit',
  'No named executive to own the programme',
]}
```

---

## TASK 10 — CREATE src/components/SolutionLayout.tsx

This is the shared component used by all four solution pages.
Build it as a full component that accepts all the props used in Tasks 6–9.

The layout has three sections (reference: /mnt/user-data/outputs/abarva-solutions-final.html):

SECTION 1 — Hero:
  Left: eyebrow (mono, teal) + solution name (Georgia serif 36px) + tagline (16px muted) + meta tags
  Right: 2×2 stat grid — each card has label + large value (colored) + sub text

SECTION 2 — Body (two columns):
  Left: "Three phases" label + 3 phase rows
    Each phase: numbered circle (phase color) + title (14px 500) + desc (13px muted) + product pills
  Right: Genome patterns card + Deliverables card

SECTION 3 — Intake flow:
  Header: "Start this solution" (mono teal) + "Tell us what you're trying to solve." (22px)
  Card with 3 states controlled by step prop:

  STEP 0 — Input:
    Step dots (3 dots, first active)
    "Step 1 of 3 · describe the problem" label
    Question text
    Hint text
    textarea bound to input/setInput props
    [Match to Genome →] button → calls setStep(1)
    Starter pills → fill textarea on click

  STEP 1 — Genome response:
    "Genome match — what your client data already shows" label
    findings array rendered as: colored stripe + title + detail + source pills
    Follow-up question card:
      "Step 2 of 3 · one follow-up question"
      followUpQ text
      followUpOpts rendered as clickable option buttons
      → on click: setSelected(opt) + setStep(2)

  STEP 2 — Launch:
    [Create project and begin →] button
      → on click: setLaunched(true), after 1.2s navigate to /admin
    [Change my answer] → setStep(1)
    Note: "Creates project in your Maestro workspace with solution context pre-loaded"

Props interface:
```tsx
interface SolutionLayoutProps {
  num: string
  name: string
  tagline: string
  meta: string[]
  stats: { label: string; value: string; color: string; sub: string }[]
  phases: { num: number; color: string; title: string; desc: string; products: string[] }[]
  genome: { rate: string; name: string; sub: string }[]
  deliverables: string[]
  starters: string[]
  findings: { severity: 'critical' | 'warning'; title: string; detail: string; sources: string[] }[]
  followUpQ: string
  followUpOpts: string[]
  input: string
  setInput: (v: string) => void
  step: number
  setStep: (v: number) => void
  selected: string
  setSelected: (v: string) => void
  launched: boolean
  setLaunched: (v: boolean) => void
}
```

---

## TASK 11 — COPY USER CREATION SCRIPT

```bash
cp /mnt/user-data/outputs/create-users.mjs ./create-users.mjs
```

---

## TASK 12 — BUILD, QA, COMMIT

```bash
# 1. Verify deletions
ls src/app/sign-up 2>/dev/null && echo "FAIL: sign-up still exists" || echo "PASS"

# 2. Verify new/updated files
ls src/app/auth-redirect/page.tsx   && echo "PASS" || echo "FAIL"
ls src/app/solutions/tech/page.tsx  && echo "PASS" || echo "FAIL"
ls src/components/SolutionLayout.tsx && echo "PASS" || echo "FAIL"
ls create-users.mjs                 && echo "PASS" || echo "FAIL"

# 3. TypeScript — zero errors
npx tsc --noEmit

# 4. Build — exit 0
npm run build

# 5. Self-QA
# NAV SIGNED OUT:
# □ "Investor view" amber link visible
# □ "Login →" teal button visible
# □ No avatar or identity shown
# □ Clients ▾ shows only 3 demo clients (not Arcturus/Nexora)

# NAV SIGNED IN (verify from code — read auth state):
# □ useUser() imported and used
# □ signedIn = isLoaded && !!user
# □ urlClientId reads from pathname correctly
# □ CLIENT_NAMES lookup works for all 5 clients
# □ Avatar shows initials from displayName
# □ Sign out calls signOut(() => router.push('/'))

# AUTH ROUTING:
# □ layout.tsx afterSignInUrl is "/auth-redirect"
# □ auth-redirect reads role and clientId from publicMetadata
# □ middleware.ts has /auth-redirect in public routes
# □ middleware.ts does NOT have /investor or /sign-up in public routes

# SOLUTION PAGES:
# □ /solutions/pdlc — loads, 3 phases, Genome panel, textarea, starters, submit
# □ /solutions/delivery — loads, same structure
# □ /solutions/margin — loads, stat cards show REAL numbers (71%, $840M, $94M)
# □ /solutions/tech — loads, stat cards show REAL numbers (28yr, $42M, 3 attempts)
# □ Each intake: click starter → fills textarea
# □ Each intake: click "Match to Genome →" → shows findings section
# □ Each intake: select follow-up option → shows "Create project" button
# □ Click "Create project" → navigates to /admin after 1.2s

# 6. Commit
git add -A
git commit -m "feat: role-based routing, nav auth state, four solution pages with intake flow, user creation script"
git push
```

---

## AFTER THE BUILD — TWO STEPS

### Step A: Run user creation script

Get Clerk Secret Key from dashboard.clerk.com → API Keys → Secret key

```bash
CLERK_SECRET_KEY=sk_live_yourKeyHere node create-users.mjs
```

Output:
```
  ✓  anand@abarva.com              → /admin (all clients)
  ✓  investor@abarva.com           → /investor
  ✓  demo-arcturus@abarva.com      → /admin/client/arcturus
  ✓  demo-meridian@abarva.com      → /admin/client/meridian
  ✓  demo-firstcapital@abarva.com  → /admin/client/firstcapital
  ✓  demo-apexretail@abarva.com    → /admin/client/apexretail
  ✓  demo-nexora@abarva.com        → /admin/client/nexora
  ✓  demo-new@abarva.com           → /admin (new setup flow)
```

### Step B: Add Shail/Prat individually in Clerk Dashboard

dashboard.clerk.com → Users → Create user
  Email: shail@theirdomain.com
  Password: [set one]
  Public metadata: { "role": "investor" }

That's it. They sign in at /sign-in → land on /investor automatically.

---

## COMPLETE CREDENTIAL SHEET

```
ADMIN (sees all 5 clients):
  anand@abarva.com  /  AbarVa2026!

INVESTOR (secure brief):
  investor@abarva.com  /  Investor2026!

DEMO ACCOUNTS (all: Demo2026!) — each goes straight to their workspace:
  demo-arcturus@abarva.com      →  Arcturus Financial · C/I 71%, CDO vacant, AI $94M
  demo-meridian@abarva.com      →  Meridian Health · Denial 18.2%, margin 1.8%
  demo-firstcapital@abarva.com  →  First Capital · Digital 41%, FedNow not live
  demo-apexretail@abarva.com    →  Apex Retail · Einstein idle $248M, SAP EOL 2027
  demo-nexora@abarva.com        →  Nexora Retail · Margin 3.2%, 6 ERPs, AI $148M
  demo-new@abarva.com           →  New client setup onboarding flow (Step 1 of 4)
```

# AbarVa — FINAL INSTRUCTION
# One file. Everything Claude Code needs to complete the platform.
# Run in order. Do not skip anything.

---

## CURRENT STATE (from live site + code audit)

WORKING:
  ✓ /admin/client/[id] — 6-tab workspace loads with real data
  ✓ All 6 tabs render correctly
  ✓ Product pages (diagnose, ai-strategy, select, justify, outcomes)
  ✓ Build passes, 0 TypeScript errors
  ✓ All data traces to src/data/[client]/*.ts

BROKEN / MISSING:
  ✗ Maestro button → still goes to /admin (old engagement selector)
  ✗ Nav shows "Arcturus Financial" on ALL client pages (not dynamic)
  ✗ No role-based routing after sign-in
  ✗ No user identity in nav (no avatar, no name, no sign out)
  ✗ /investor still public (should require login)
  ✗ sign-up/page.tsx still exists
  ✗ Four solution pages need the new intake flow design
  ✗ /solutions/tech doesn't exist (Technology Modernization — new)
  ✗ auth-redirect page doesn't exist

---

## TASK 1 — CREATE src/app/auth-redirect/page.tsx

New file. Reads Clerk metadata. Routes by role.

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
    if (!user) { router.push('/sign-in'); return }

    const role     = user.publicMetadata?.role as string | undefined
    const clientId = user.publicMetadata?.clientId as string | undefined

    if (role === 'investor') { router.push('/investor'); return }
    if (role === 'admin')    { router.push('/admin'); return }
    if (clientId)            { router.push(`/admin/client/${clientId}`); return }
    router.push('/admin')
  }, [isLoaded, user, router])

  return (
    <div style={{
      minHeight:'100vh', background:'#060A12',
      display:'flex', alignItems:'center', justifyContent:'center',
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

Change ClerkProvider props:
```tsx
<ClerkProvider
  signInUrl="/sign-in"
  afterSignInUrl="/auth-redirect"
  afterSignUpUrl="/auth-redirect"
>
```

Remove signUpUrl="/sign-up" entirely.

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

Key changes vs current:
- /auth-redirect ADDED to public routes
- /investor REMOVED from public routes (now protected)
- /sign-up REMOVED from public routes

---

## TASK 4 — UPDATE src/components/AbarvaNav.tsx

Add imports at the very top (after 'use client'):
```tsx
import { useUser, useClerk } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
```

Inside the component function, add after existing useState lines:
```tsx
const { user, isLoaded } = useUser()
const { signOut } = useClerk()
const pathname = usePathname()
const router = useRouter()
const [userMenuOpen, setUserMenuOpen] = useState(false)

const signedIn = isLoaded && !!user

// Read current client from URL: /admin/client/arcturus → 'arcturus'
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
const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
```

Replace the ENTIRE right side of the nav
(from `{/* Right side */}` div to its closing `</div>`, just before `</div></nav>`):

```tsx
<div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>

  {signedIn ? (
    <>
      {/* Current client — static text derived from URL */}
      {urlClientId && CLIENT_NAMES[urlClientId] && (
        <span style={{
          fontSize:'13px', color:MUTED,
          padding:'0 16px',
          borderLeft:`1px solid ${BORDER}`,
          borderRight:`1px solid ${BORDER}`,
        }}>
          {CLIENT_NAMES[urlClientId]}
        </span>
      )}

      {/* My workspace link */}
      <a href="/admin" style={{
        fontSize:'12px', color:MUTED, textDecoration:'none',
        fontFamily:'monospace', letterSpacing:'.04em', padding:'0 8px',
      }}>
        My workspace
      </a>

      {/* Identity + dropdown */}
      <div style={{ position:'relative' }}>
        <button
          onClick={() => setUserMenuOpen(o => !o)}
          style={{
            display:'flex', alignItems:'center', gap:'8px',
            background:'rgba(45,212,200,0.06)',
            border:`1px solid rgba(45,212,200,0.2)`,
            borderRadius:'8px', padding:'6px 12px', cursor:'pointer',
          }}
        >
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'12px', fontWeight:500, color:TEXT }}>{displayName}</div>
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
            <a href="/admin" style={{
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
        border:'1px solid rgba(245,158,11,0.3)',
        borderRadius:'6px',
      }}>
        Investor view
      </a>

      {/* Login */}
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

Also remove the old blocks that are now replaced:
- `{/* Active client pill */}` block — remove entirely
- `{/* Investor View */}` block — remove entirely  
- `{/* Maestro CTA */}` block — remove entirely

---

## TASK 5 — DELETE src/app/sign-up/page.tsx

```bash
rm src/app/sign-up/page.tsx
```

---

## TASK 6 — REBUILD ALL FOUR SOLUTION PAGES

Reference design: /mnt/user-data/outputs/abarva-solutions-final.html

Each solution page has the same structure:
1. Hero section — name, tagline, 4 stat cards with REAL DATA
2. Three phases — what happens, which products used
3. Intake flow — textarea + Genome match + follow-up + create project

### SHARED PATTERN for all four pages:

```tsx
'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import AbarvaNav from '@/components/AbarvaNav'

const BG='#060A12', CARD='#0D1520', BORDER='#1C2D45'
const TEAL='#2DD4C8', WHITE='#EFF6FF', MUTED='#94A3B8', DIM='#475569'
const RED='#EF4444', AMBER='#F59E0B', GREEN='#34D399'
const SANS='DM Sans, sans-serif', MONO='JetBrains Mono, monospace', SERIF='Georgia, serif'

export default function SolutionXXX() {
  const { user, isLoaded } = useUser()
  const signedIn = isLoaded && !!user
  
  const [step, setStep]           = useState(0)   // 0=input, 1=response, 2=followup
  const [problem, setProblem]     = useState('')
  const [selectedOpt, setSelectedOpt] = useState('')
  const [launched, setLaunched]   = useState(false)

  const handleMatch = () => {
    if (!problem.trim()) return
    setStep(1)
  }

  const handleLaunch = () => {
    setLaunched(true)
    setTimeout(() => {
      // Navigate to workspace with solution context
      window.location.href = '/admin'
    }, 1200)
  }

  return (
    <div style={{ minHeight:'100vh', background:BG, fontFamily:SANS, color:WHITE }}>
      <AbarvaNav activePage="solutions" />
      {/* Hero + Phases + Intake sections */}
    </div>
  )
}
```

### src/app/solutions/pdlc/page.tsx

Hero stats (real data):
  "$300M" red — "Enterprise avg engineering capital — 70% in meetings not building"
  "16mo" red — "Average time to production before AbarVa"
  "8mo" teal — "After AbarVa — 50% reduction, Genome-validated"
  "$18M" green — "Average annual consulting reduction per engagement"

Three phases:
  Phase 1 (teal): "Diagnose the delivery bottleneck"
    Products: Situation · Data Intelligence
  Phase 2 (amber): "Embed AI into the build cycle"
    Products: Strategy · Vendor
  Phase 3 (green): "Verify delivery improvement · earn the fee"
    Products: Business Case · Outcomes

Genome patterns (right panel):
  72% — Vendor dependency without internal capability
  61% — Change management gap
  79% — No MLOps infrastructure

Deliverables:
  Delivery bottleneck map — every handoff quantified
  AI agent integration playbook — squad-level
  Vendor selection for tooling — scored against your stack
  Baseline + monthly tracking + fee on verified cycle time reduction

Intake starters:
  "Time to production is 16+ months. Engineers spend more time in meetings than building."
  "We have 80 consultants on site. 70% of their time is onboarding, not building."
  "We are spending $300M in engineering capital and shipping less than our competitors."

Follow-up question: "What is the primary bottleneck — speed, quality, or cost?"
Options: Speed — time to production | Cost — consulting and engineering spend | Quality — rework and failures | All three

---

### src/app/solutions/delivery/page.tsx

Hero stats:
  "40" red — "Typical consulting team — 70% time onboarding"
  "4" teal — "AbarVa Maestro team — knowledge stays permanently"
  "100%" amber — "Knowledge lost per traditional consulting engagement"
  "$42M" green — "Avg annual consulting spend replaced (Arcturus data)"

Three phases:
  Phase 1 (teal): "Diagnose — what you are actually paying for"
    Products: Situation
  Phase 2 (amber): "Prescribe — the Maestro model for this engagement"
    Products: Strategy · Business Case
  Phase 3 (green): "Execute — Maestros embed, consulting spend drops"
    Products: Vendor · Outcomes

Genome patterns:
  84% — No named executive sponsor
  76% — Pilot purgatory (3+ prior failed engagements)
  61% — Change management gap

Deliverables:
  Consulting relationship audit — value vs cost mapped
  Maestro team design — roles, scope, knowledge model
  Transition plan — from consulting to Maestros
  Fee on verified consulting spend reduction

Intake starters:
  "We have 80 consultants on site and 70% of their time is getting up to speed. Knowledge walks out every Friday."
  "We are spending $42M on consulting annually and cannot point to what has permanently changed."
  "Every transformation programme ends and we start the next one from scratch."

Follow-up: "What is the primary goal — reduce cost, improve outcome quality, or retain knowledge permanently?"
Options: Reduce consulting cost | Improve delivery quality and speed | Retain knowledge permanently | All three

---

### src/app/solutions/margin/page.tsx

Hero stats (pull from arcturusFinancial data):
  "71%" red — `C/I ratio — vs ${arcturusFinancial.org.targetCIRatio}% target · $${arcturusFinancial.financials.efficiencyGap}M gap`
  "$94M" amber — `AI committed · $${arcturusFinancial.financials.aiTrackedROI} tracked ROI`
  "$60–120M" teal — "Annual recovery range — Genome-validated"
  "15–20%" green — "Of verified savings only — not day-rates"

Import at top:
```tsx
import { arcturusFinancial } from '@/data/arcturus/index'
```

Three phases:
  Phase 1 (teal): "Diagnose — where the margin is leaking and why"
    Products: Situation · Data Intelligence
  Phase 2 (amber): "Prescribe — the sequenced recovery plan"
    Products: Strategy · Business Case
  Phase 3 (green): "Verify — baseline locked · savings tracked · fee earned"
    Products: Outcomes

Genome patterns:
  89% — No named executive sponsor
  76% — AI spend without verified ROI
  68% — Cost misattribution — wrong levers pulled

Deliverables:
  Margin gap analysis — every driver quantified
  3–5 prioritised interventions with ROI ranges
  CFO-ready business case per intervention
  Baseline locked Day 0 · monthly tracking · fee on verified savings

Intake starters — dynamic from real data:
```tsx
const starters = [
  `C/I ratio is ${arcturusFinancial.financials.costToIncomeRatio}% vs ${arcturusFinancial.org.targetCIRatio}% peer target. $${arcturusFinancial.financials.efficiencyGap}M efficiency gap.`,
  `$${arcturusFinancial.financials.aiCommitted}M committed to AI initiatives. Cannot show ROI on any of them.`,
  `Technology is our largest cost after compensation. Cannot show what it is delivering.`,
]
```

Genome match findings (when Maestro clicks "Match to Genome"):
```tsx
const findings = [
  {
    severity: 'critical',
    title: `C/I ratio ${arcturusFinancial.financials.costToIncomeRatio}% vs ${arcturusFinancial.org.targetCIRatio}% target — $${arcturusFinancial.financials.efficiencyGap}M annual gap`,
    detail: 'Arcturus spends 35% more than peers on technology without proportional outcomes. The margin gap is structural, not cyclical.',
    sources: ['Client financials', 'Industry benchmark', 'Genome (14 cases)'],
  },
  {
    severity: 'critical',
    title: `$${arcturusFinancial.financials.aiCommitted}M AI committed — zero with documented baseline`,
    detail: 'Every AI initiative contributes to cost. None has a measurable return. Portfolio must be rationalized to 3–5 funded initiatives.',
    sources: ['Client data', 'Genome F002 · 84%'],
  },
  {
    severity: 'warning',
    title: '$38M client portal investment — 44% adoption, NPS 31',
    detail: 'A primary digital revenue channel underperforming. Recovery contributes 1.2–2.1pp to operating margin once adoption exceeds 70%.',
    sources: ['Client technology', 'Industry benchmark'],
  },
]
```

Follow-up: "Who is the executive sponsor — and what outcome do they care most about?"
Options: CEO — total margin recovery | CFO — cost discipline and ROI | CIO — technology cost and AI ROI | Board — competitive benchmarking

---

### src/app/solutions/tech/page.tsx (NEW ROUTE — create this)

Hero stats — pull from arcturusTechnology:
  "28yr" red — "Bloomberg AIM core OMS age — $42M annual maintenance"
  "3" amber — "Failed modernization attempts — each built by the vendor"
  "71%" teal — "Success rate when client builds the business case"
  "$42M" green — "Annual maintenance cost recovered once migration complete"

Import:
```tsx
import { arcturusTechnology } from '@/data/arcturus/technology'
```

Three phases:
  Phase 1 (teal): "Diagnose — which systems actually need replacing"
    Products: Situation · Data Intelligence
  Phase 2 (amber): "Build the case the CFO will approve"
    Products: Strategy · Vendor · Business Case
  Phase 3 (green): "Govern the delivery — Maestros embedded"
    Products: Outcomes

Genome patterns:
  72% — Vendor dependency without internal capability
  68% — Data readiness below threshold
  84% — No named executive sponsor

Deliverables:
  System-by-system modernization assessment
  Vendor scored against your data — not analyst opinion
  CFO-ready business case with Genome-validated ranges
  Delivery governance · milestone tracking · fee on maintenance cost reduction

Intake starters — dynamic:
```tsx
const oms = arcturusTechnology.corePlatform.orderManagement
const starters = [
  `${oms.vendor} is ${oms.age} years old. ${oms.modernizationAttempts} failed modernization attempts. $${oms.annualMaintenanceCost}M annual maintenance.`,
  'Aladdin Risk only covers liquid assets. Regulator wants daily stress testing. We run monthly. Gap closes 2026.',
  '14 data systems. No golden record. 3-day reporting lag. We compete on information advantage.',
]
```

Genome match findings:
```tsx
const findings = [
  {
    severity: 'critical',
    title: `${oms.vendor} — ${oms.age} years old · $${oms.annualMaintenanceCost}M maintenance · ${oms.modernizationAttempts} failed attempts`,
    detail: 'The business case was built by the vendor each time. When the client builds it from their own data — success rate is 71%. Vendor-built: 23%.',
    sources: ['Client technology', 'Genome (11 cases)'],
  },
  {
    severity: 'critical',
    title: '14 data systems — no golden record — 3-day reporting lag',
    detail: 'Any OMS modernization fails if the data architecture problem is not solved first. Genome F003 — data readiness — present in 68% of failed modernizations.',
    sources: ['Client technology', 'Genome F003 · 68%'],
  },
  {
    severity: 'warning',
    title: 'Aladdin Risk — alternatives not in real-time risk · regulator wants daily',
    detail: 'Regulator requires daily stress testing by mid-2026. Current system runs monthly. This changes the CFO calculation entirely.',
    sources: ['Client technology', 'Regulatory deadline'],
  },
]
```

Follow-up: "What has stopped the CFO from approving this before?"
Options: Business case built by vendor — not trusted | Risk too high — too many unknowns | Cost too high vs perceived benefit | No named executive to own the programme

---

## TASK 7 — ADD /solutions/tech TO MIDDLEWARE

In src/middleware.ts, the public routes already include '/solutions(.*)' which covers /solutions/tech automatically. No change needed.

---

## TASK 8 — ADD USER CREATION SCRIPT TO REPO

Copy create-demo-users.mjs to the repo root:
```bash
cp /mnt/user-data/outputs/create-demo-users.mjs ./create-demo-users.mjs
```

Add to .gitignore if it doesn't already have node_modules:
```
node_modules/
.env.local
```

Do NOT commit .env.local or any secrets.

---

## TASK 9 — BUILD, QA, COMMIT

```bash
# Step 1: Verify deletions
ls src/app/sign-up 2>/dev/null && echo "FAIL: sign-up still exists" || echo "PASS: deleted"

# Step 2: Verify new files exist
ls src/app/auth-redirect/page.tsx && echo "PASS" || echo "FAIL: auth-redirect missing"
ls src/app/solutions/tech/page.tsx && echo "PASS" || echo "FAIL: tech solution missing"

# Step 3: TypeScript
npx tsc --noEmit
# Fix ALL errors before proceeding.
# Most common issues:
#   useUser() — always check isLoaded before accessing user
#   publicMetadata — cast as string: user.publicMetadata?.role as string | undefined
#   arcturusTechnology property access — use optional chaining

# Step 4: Build
npm run build
# Must exit 0. Fix all errors.

# Step 5: Self-QA
echo "Running QA checklist..."

# NAV — SIGNED OUT:
# □ Homepage nav: "Investor view" (amber) + "Login →" (teal) visible
# □ "Login →" → /sign-in
# □ No avatar or identity shown
# □ Clients ▾ shows 3 demo clients only

# NAV — SIGNED IN (check by reading code, not browser):
# □ Static client name shows when on /admin/client/[id]
# □ Avatar + name + role visible top right
# □ Avatar click → dropdown with "My workspace" + "Sign out"

# AUTH ROUTING:
# □ afterSignInUrl in layout.tsx is "/auth-redirect" (not "/admin")
# □ auth-redirect reads role from publicMetadata and routes correctly
# □ /investor requires login (not in public routes)
# □ /sign-up → 404 (file deleted)

# SOLUTIONS:
# □ /solutions/pdlc loads — 3 phases, Genome panel, intake flow
# □ /solutions/delivery loads — 3 phases, Genome panel, intake flow
# □ /solutions/margin loads — stat cards show REAL numbers from arcturusFinancial data
# □ /solutions/tech loads — stat cards show REAL numbers from arcturusTechnology data
# □ Each intake textarea accepts input
# □ "Match to Genome →" button shows findings section
# □ Follow-up question appears with selectable options
# □ "Create project and begin →" appears after option selected

# Step 6: Commit
git add -A
git commit -m "feat: role-based routing, auth redirect, nav auth state, four solution pages with intake flow"
git push
```

---

## WHAT HAPPENS AFTER THIS BUILD

### User flow — signed out:
```
Homepage → "Login →" (teal button) → /sign-in → /auth-redirect
  role=investor → /investor
  role=admin → /admin (engagement selector)
  clientId=arcturus → /admin/client/arcturus (straight in)
```

### User flow — Solutions intake:
```
/solutions/margin → see real Arcturus data in stats
Click "C/I ratio 71% — $840M gap" starter
Type or use pre-fill → "Match to Genome →"
Three findings surface from real src/data/ values
Select "CFO — cost discipline" as sponsor
"Create project and begin →" appears
Click → /admin (will navigate to workspace)
```

### Adding new users (no code changes ever needed):
```
1. Get Clerk Secret Key from dashboard.clerk.com → API Keys
2. Run: CLERK_SECRET_KEY=sk_live_xxx node create-demo-users.mjs
3. All 8 demo users created in one shot
4. For specific people (Shail, Prat): 
   Add manually in Clerk dashboard → Users → Create → set publicMetadata
```

---

## DESIGN CONSTANTS (use everywhere)

```
BG      = '#060A12'
CARD    = '#0D1520'
BORDER  = '#1C2D45'
TEAL    = '#2DD4C8'
WHITE   = '#EFF6FF'
MUTED   = '#94A3B8'
DIM     = '#475569'
RED     = '#EF4444'
AMBER   = '#F59E0B'
GREEN   = '#34D399'
SANS    = 'DM Sans, sans-serif'
MONO    = 'JetBrains Mono, monospace'
SERIF   = 'Georgia, serif'
```

# AbarVa — Targeted Fix Instruction
# Six precise fixes. Nothing else touched.
# Written April 14, 2026.

---

## WHAT IS BROKEN (from live site screenshots)

1. Maestro button in nav always links to /admin (engagement selector)
   — Should link to /admin/client/[id] when signed in
2. Nav always shows "Arcturus Financial" regardless of current page client  
   — Should show the client matching the current URL
3. No role-based routing after sign-in
   — afterSignInUrl="/admin" sends everyone to engagement selector
   — Should route: investor → /investor, admin → /admin, maestro → /admin/client/[id]
4. sign-up/page.tsx still exists (should have been deleted)
5. /investor is still public (should require login)
6. No user identity shown in nav (name, avatar, sign out)

## WHAT IS WORKING — DO NOT TOUCH

- /admin/client/[id] — 6-tab workspace loads correctly
- All 6 tabs render with real data
- /admin engagement selector works
- All product pages work
- AbarvaNav dropdowns work
- Build passes

---

## FIX 1 — src/components/AbarvaNav.tsx

Add these imports at the top:
```tsx
import { useUser, useClerk } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
```

Inside the component function, after existing useState declarations:
```tsx
const { user, isLoaded } = useUser()
const { signOut } = useClerk()
const pathname = usePathname()
const router = useRouter()
const [userMenuOpen, setUserMenuOpen] = useState(false)

// Derive clientId from URL if on a client page
// e.g. /admin/client/arcturus → 'arcturus'
const urlClientId = pathname?.split('/admin/client/')?.[1]?.split('/')?.[0] || null

// Display name and initials
const displayName = user?.fullName || user?.emailAddresses?.[0]?.emailAddress?.split('@')?.[0] || 'Maestro'
const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

// Is the user signed in?
const signedIn = isLoaded && !!user
```

Replace the entire RIGHT SIDE section (from `{/* Right side */}` to end of nav):
```tsx
{/* Right side */}
<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>

  {signedIn ? (
    <>
      {/* Static client name — shows current client, no dropdown */}
      {urlClientId && (() => {
        const CLIENT_NAMES: Record<string, string> = {
          meridian: 'Meridian Health',
          firstcapital: 'First Capital',
          apexretail: 'Apex Retail',
          arcturus: 'Arcturus Financial',
          nexora: 'Nexora Retail',
        }
        const name = CLIENT_NAMES[urlClientId]
        return name ? (
          <span style={{
            fontSize: '13px', color: MUTED,
            padding: '0 16px', borderLeft: `1px solid ${BORDER}`,
            borderRight: `1px solid ${BORDER}`,
          }}>
            {name}
          </span>
        ) : null
      })()}

      {/* My workspace link */}
      <a href="/admin" style={{
        fontSize: '12px', color: MUTED, textDecoration: 'none',
        fontFamily: 'monospace', letterSpacing: '.04em', padding: '0 8px',
      }}>
        My workspace
      </a>

      {/* Identity + sign out dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setUserMenuOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(45,212,200,0.06)', border: `1px solid rgba(45,212,200,0.2)`,
            borderRadius: '8px', padding: '6px 12px', cursor: 'pointer',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT }}>{displayName}</div>
            <div style={{ fontSize: '10px', color: MUTED }}>Admin Maestro</div>
          </div>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'rgba(45,212,200,0.15)', border: `1px solid rgba(45,212,200,0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 600, color: TEAL, fontFamily: 'monospace',
          }}>
            {initials}
          </div>
        </button>
        {userMenuOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            background: PAGE_BG, border: `1px solid ${BORDER}`, borderRadius: '10px',
            padding: '6px 0', zIndex: 300, minWidth: '160px',
          }}>
            <a href="/admin" style={{
              display: 'block', padding: '9px 16px', fontSize: '13px',
              color: TEXT, textDecoration: 'none',
            }}>
              My workspace
            </a>
            <button
              onClick={() => signOut(() => router.push('/'))}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 16px',
                fontSize: '13px', color: MUTED, background: 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: 'sans-serif',
                borderTop: `1px solid ${BORDER}`,
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
      {/* Investor View — subtle amber link */}
      <a href="/investor" style={{
        fontSize: '12px', color: '#F59E0B', textDecoration: 'none',
        padding: '6px 12px', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px',
      }}>
        Investor view
      </a>

      {/* Login button */}
      <a href="/sign-in" style={{
        background: TEAL, color: '#060A12',
        fontSize: '13px', fontWeight: 600, textDecoration: 'none',
        padding: '8px 18px', borderRadius: '8px', flexShrink: 0,
      }}>
        Login →
      </a>
    </>
  )}
</div>
```

Also remove the old `{/* Active client pill */}` block and the `{/* Investor View */}` and `{/* Maestro CTA */}` blocks — they are replaced by the new right side above.

QA for Fix 1:
- Signed out: "Investor view" amber + "Login →" teal visible
- Signed in: client name shows when on /admin/client/[id] page
- Signed in: name + avatar + dropdown visible
- Dropdown: "My workspace" + "Sign out" 
- Sign out → navigates to /

---

## FIX 2 — src/app/layout.tsx

Change afterSignInUrl from "/admin" to "/auth-redirect":
```tsx
<ClerkProvider 
  signInUrl="/sign-in" 
  afterSignInUrl="/auth-redirect"
  afterSignUpUrl="/auth-redirect"
>
```

Remove signUpUrl="/sign-up" entirely.

---

## FIX 3 — CREATE src/app/auth-redirect/page.tsx (NEW FILE)

```tsx
'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const BG = '#060A12'
const TEAL = '#2DD4C8'
const MONO = 'JetBrains Mono, monospace'

export default function AuthRedirect() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }

    const role     = user.publicMetadata?.role as string | undefined
    const clientId = user.publicMetadata?.clientId as string | undefined

    if (role === 'investor') {
      router.push('/investor')
      return
    }

    if (role === 'admin') {
      router.push('/admin')
      return
    }

    if (clientId) {
      router.push(`/admin/client/${clientId}`)
      return
    }

    // Default — show engagement selector
    router.push('/admin')
  }, [isLoaded, user, router])

  return (
    <div style={{
      minHeight: '100vh', background: BG,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '12px',
    }}>
      <div style={{
        fontFamily: MONO, fontSize: '11px', color: TEAL,
        letterSpacing: '.1em', textTransform: 'uppercase' as const,
      }}>
        Loading your workspace...
      </div>
      <div style={{
        width: '32px', height: '2px', background: TEAL, borderRadius: '1px',
        animation: 'pulse 1.2s ease-in-out infinite',
      }} />
    </div>
  )
}
```

---

## FIX 4 — src/middleware.ts

Full replacement:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/auth-redirect(.*)',   // NEW — intermediate routing page
  '/solutions(.*)',
  '/diagnose(.*)',
  '/ai-strategy(.*)',
  '/justify(.*)',
  '/select(.*)',
  '/outcomes(.*)',
  // NOTE: /investor is now PROTECTED (not listed here)
  // NOTE: /sign-up removed (invite-only)
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

---

## FIX 5 — DELETE src/app/sign-up/page.tsx

```bash
rm src/app/sign-up/page.tsx
```

---

## FIX 6 — VERIFY AND COMMIT

```bash
# Verify sign-up is gone
ls src/app/sign-up 2>/dev/null && echo "FAIL: sign-up still exists" || echo "PASS: deleted"

# Verify auth-redirect exists
ls src/app/auth-redirect/page.tsx && echo "PASS: auth-redirect created" || echo "FAIL: missing"

# TypeScript check
npx tsc --noEmit
# Fix any errors before proceeding.
# Common: useUser returns null before loaded — always check isLoaded first

# Build
npm run build
# Must exit 0

# Self-QA checklist:
# □ Signed out: homepage shows "Investor view" + "Login →" in nav (not "Maestro" button)
# □ Signed out: no identity/avatar in nav
# □ Click "Login →" → goes to /sign-in
# □ After sign in → /auth-redirect → then /admin/client/arcturus (for demo account)
# □ Signed in on /admin/client/firstcapital → nav shows "First Capital" static text
# □ Signed in on /admin/client/arcturus → nav shows "Arcturus Financial" static text  
# □ Identity shows: name + initials avatar in top right
# □ Avatar click → dropdown with "My workspace" + "Sign out"
# □ Sign out → back to /
# □ /investor → redirects to /sign-in (no longer public)
# □ /sign-up → 404 (deleted)
# □ npm run build exit 0
# □ Zero TypeScript errors

# Commit
git add -A
git commit -m "fix: nav auth state, role-based routing, investor secured, sign-up removed"
git push
```

---

## IMPORTANT NOTES FOR CLAUDE CODE

1. In AbarvaNav.tsx — the component currently has NO useUser import.
   Add it at the very top. This is the most important change.

2. The urlClientId derivation reads from pathname:
   pathname = "/admin/client/arcturus" → urlClientId = "arcturus"
   This is how the nav knows which client to show without props.

3. Do NOT change anything in /admin/client/[id]/page.tsx
   It is working correctly from the screenshots.

4. Do NOT change the engagement selector (/admin/page.tsx)
   Admin users (Anand) need it to switch between clients.

5. The auth-redirect page must be in the public routes list
   otherwise Clerk will block it before useUser() can read the session.

6. After these fixes, adding a new demo user is done entirely in Clerk Dashboard:
   - Create user with email + password
   - Set publicMetadata: { "role": "maestro", "clientId": "meridian" }
   - That user signs in → lands directly on /admin/client/meridian
   - No code change needed to add new users

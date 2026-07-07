'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function MobileGuard({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Don't block when embedded in an iframe (e.g. demo guided walkthrough)
    if (window.self !== window.top) return
    // Keep the public marketing and access-status pages available on phones.
    // The signed-in product surfaces remain desktop/tablet-first.
    const publicMobileAllowed =
      pathname === '/' ||
      pathname === '/signed-out' ||
      pathname === '/forbidden' ||
      pathname === '/access-denied'
    if (publicMobileAllowed) {
      setBlocked(false)
      return
    }
    // Only block actual mobile devices — not desktop browsers with DevTools open
    const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const check = () => setBlocked(isMobileUA && window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [pathname])

  if (!blocked) return <>{children}</>

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0D1117',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '24px' }}>⬛</div>
      <div style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 700,
        fontSize: '22px', color: '#E6EDF3', marginBottom: '12px', lineHeight: 1.3,
      }}>
        AbarVa is built for desktop
      </div>
      <div style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 400,
        fontSize: '15px', color: '#6B7280', maxWidth: '320px', lineHeight: 1.6,
      }}>
        Open this on a laptop or desktop for the full intelligence experience.
      </div>
    </div>
  )
}

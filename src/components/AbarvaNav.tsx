'use client'
import { useState, useRef } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const BG='#060A12', CARD='#0D1520', BORDER='#1C2D45'
const TEAL='#2DD4C8', WHITE='#EFF6FF', MUTED='#94A3B8'
const AMBER='#F59E0B'
const SANS='DM Sans, sans-serif', MONO='JetBrains Mono, monospace', SERIF='Georgia, serif'

interface NavProps {
  activePage?: 'home'|'diagnose'|'ai-strategy'|'select'|'justify'|'outcomes'|'solutions'|'maestro'|'investor'|'admin'|string
  clientId?: string
  onClientChange?: (id: any) => void
}

export default function AbarvaNav({ activePage, clientId }: NavProps) {
  const [open, setOpen] = useState<string|null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const openDrop = (id: string) => { clearTimeout(closeTimer.current); setOpen(id) }
  const startClose = () => { closeTimer.current = setTimeout(() => setOpen(null), 200) }
  const cancelClose = () => clearTimeout(closeTimer.current)

  const cid = clientId || 'meridian'

  return (
    <div style={{
      height: '64px',
      position: 'sticky' as const,
      top: 0,
      zIndex: 200,
      background: CARD,
      borderBottom: `1px solid ${BORDER}`,
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center',
      padding: '0 28px',
      gap: '4px',
      boxSizing: 'border-box' as const,
    }}>
      {/* Wordmark */}
      <a href="/" style={{textDecoration:'none',display:'flex',flexDirection:'column' as const,lineHeight:1,marginRight:'32px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'baseline'}}>
          <span style={{fontFamily:SERIF,fontSize:'17px',fontWeight:800,color:WHITE}}>Abar</span>
          <span style={{fontFamily:SERIF,fontSize:'22px',fontWeight:900,color:TEAL}}>Va</span>
        </div>
        <span style={{fontFamily:MONO,fontSize:'8px',color:WHITE,letterSpacing:'.04em',opacity:.7}}>know it. build it. own it.</span>
      </a>

      {/* Intelligence dropdown */}
      <div
        style={{position:'relative' as const}}
        onMouseEnter={() => openDrop('intel')}
        onMouseLeave={startClose}
      >
        <button style={{
          fontSize:'13px',color:MUTED,background:'none',border:'none',cursor:'pointer',
          padding:'8px 10px',fontFamily:SANS,
        }}>
          Intelligence ▾
        </button>
        {open === 'intel' && (
          <div
            style={{
              position:'absolute' as const,top:'64px',left:0,
              background:CARD,border:`1px solid ${BORDER}`,
              borderRadius:'12px',padding:'8px 0',minWidth:'320px',zIndex:300,
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={startClose}
          >
            {[
              { name:'Situation',     path:`/diagnose?client=${cid}`,    desc:"What's actually broken — and what is it costing?" },
              { name:'Strategy',      path:`/ai-strategy?client=${cid}`, desc:'Where should we place our AI bets?' },
              { name:'Vendor',        path:`/select?client=${cid}`,      desc:'Which vendor actually wins in our situation?' },
              { name:'Business Case', path:`/justify?client=${cid}`,     desc:'How do we justify this to the board?' },
              { name:'Outcomes',      path:`/outcomes?client=${cid}`,    desc:'Did it work — and can we prove it?' },
            ].map(item => (
              <a
                key={item.name}
                href={item.path}
                onClick={() => setOpen(null)}
                style={{display:'block',padding:'10px 20px',textDecoration:'none'}}
              >
                <div style={{fontSize:'13px',fontWeight:500,color:WHITE,fontFamily:SANS}}>{item.name}</div>
                <div style={{fontSize:'11px',color:MUTED,fontFamily:SANS,marginTop:'2px'}}>{item.desc}</div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Solutions dropdown */}
      <div
        style={{position:'relative' as const}}
        onMouseEnter={() => openDrop('solutions')}
        onMouseLeave={startClose}
      >
        <button style={{
          fontSize:'13px',color:MUTED,background:'none',border:'none',cursor:'pointer',
          padding:'8px 10px',fontFamily:SANS,
        }}>
          Solutions ▾
        </button>
        {open === 'solutions' && (
          <div
            style={{
              position:'absolute' as const,top:'64px',left:0,
              background:CARD,border:`1px solid ${BORDER}`,
              borderRadius:'12px',padding:'8px 0',minWidth:'320px',zIndex:300,
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={startClose}
          >
            {[
              { name:'AI-Powered PDLC',         path:'/solutions/pdlc',     desc:'Build products at twice the velocity' },
              { name:'AI-Powered Delivery',      path:'/solutions/delivery', desc:'Replace consulting teams with Maestros' },
              { name:'Margin Optimization',      path:'/solutions/margin',   desc:'Recover margin across revenue, cost, AI' },
            ].map(item => (
              <a
                key={item.name}
                href={item.path}
                onClick={() => setOpen(null)}
                style={{display:'block',padding:'10px 20px',textDecoration:'none'}}
              >
                <div style={{fontSize:'13px',fontWeight:500,color:WHITE,fontFamily:SANS}}>{item.name}</div>
                <div style={{fontSize:'11px',color:MUTED,fontFamily:SANS,marginTop:'2px'}}>{item.desc}</div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Clients dropdown — unauthenticated only */}
      {isLoaded && !user && (
        <div
          style={{position:'relative' as const}}
          onMouseEnter={() => openDrop('clients')}
          onMouseLeave={startClose}
        >
          <button style={{
            fontSize:'13px',color:MUTED,background:'none',border:'none',cursor:'pointer',
            padding:'8px 10px',fontFamily:SANS,
          }}>
            Clients ▾
          </button>
          {open === 'clients' && (
            <div
              style={{
                position:'absolute' as const,top:'64px',left:0,
                background:CARD,border:`1px solid ${BORDER}`,
                borderRadius:'12px',padding:'8px 0',minWidth:'320px',zIndex:300,
              }}
              onMouseEnter={cancelClose}
              onMouseLeave={startClose}
            >
              {[
                { name:'Meridian Health System',  path:'/diagnose?client=meridian',     sub:'Healthcare · $11.2B' },
                { name:'First Capital Financial', path:'/diagnose?client=firstcapital', sub:'Financial Services' },
                { name:'Apex Retail Group',       path:'/diagnose?client=apexretail',   sub:'Retail · $12.4B' },
              ].map(item => (
                <a
                  key={item.name}
                  href={item.path}
                  onClick={() => setOpen(null)}
                  style={{display:'block',padding:'10px 20px',textDecoration:'none'}}
                >
                  <div style={{fontSize:'13px',fontWeight:500,color:WHITE,fontFamily:SANS}}>{item.name}</div>
                  <div style={{fontSize:'11px',color:MUTED,fontFamily:SANS,marginTop:'2px'}}>{item.sub}</div>
                </a>
              ))}
              <div style={{borderTop:`1px solid ${BORDER}`,margin:'8px 0'}}/>
              <div style={{padding:'8px 20px',fontSize:'11px',color:'#475569',fontFamily:SANS}}>
                Arcturus · Nexora · other Maestro clients require login
              </div>
            </div>
          )}
        </div>
      )}

      {/* Signed-in static client label */}
      {isLoaded && user && (
        <span style={{fontSize:'13px',color:MUTED,padding:'0 16px',borderLeft:`1px solid ${BORDER}`,fontFamily:SANS}}>
          Arcturus Financial
        </span>
      )}

      {/* Right side — unauthenticated */}
      {isLoaded && !user && (
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'8px'}}>
          <a href="/investor" style={{
            fontSize:'12px',color:AMBER,textDecoration:'none',
            padding:'6px 12px',border:`1px solid rgba(245,158,11,0.3)`,borderRadius:'6px',
            fontFamily:SANS,
          }}>Investor view</a>
          <a href="/sign-in" style={{
            background:TEAL,color:BG,textDecoration:'none',
            padding:'8px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:600,
            fontFamily:SANS,
          }}>Login →</a>
        </div>
      )}

      {/* Right side — authenticated */}
      {isLoaded && user && (
        <AuthedRight user={user} showUserMenu={showUserMenu} setShowUserMenu={setShowUserMenu} signOut={signOut} router={router} />
      )}
    </div>
  )
}

function AuthedRight({ user, showUserMenu, setShowUserMenu, signOut, router }: {
  user: NonNullable<ReturnType<typeof useUser>['user']>
  showUserMenu: boolean
  setShowUserMenu: React.Dispatch<React.SetStateAction<boolean>>
  signOut: ReturnType<typeof useClerk>['signOut']
  router: ReturnType<typeof useRouter>
}) {
  const displayName = user.fullName || user.emailAddresses[0]?.emailAddress || 'Maestro'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'12px',position:'relative' as const}}>
      <a href="/admin" style={{
        fontSize:'13px',color:'#060A12',textDecoration:'none',fontFamily:SANS,
        background:TEAL,padding:'7px 16px',borderRadius:'8px',fontWeight:600,
      }}>
        Maestro →
      </a>
      <div style={{position:'relative' as const}}>
        <div
          onClick={() => setShowUserMenu(v => !v)}
          style={{
            width:'32px',height:'32px',borderRadius:'50%',
            background:TEAL,color:BG,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:SANS,flexShrink:0,
          }}
        >
          {initials}
        </div>
        {showUserMenu && (
          <div style={{
            position:'absolute' as const,top:'40px',right:0,
            background:CARD,border:`1px solid ${BORDER}`,
            borderRadius:'12px',padding:'8px 0',minWidth:'200px',zIndex:300,
          }}>
            <a
              href="/admin"
              onClick={() => setShowUserMenu(false)}
              style={{display:'block',padding:'10px 20px',textDecoration:'none',fontSize:'13px',color:WHITE,fontFamily:SANS}}
            >
              Maestro workspace
            </a>
            <button
              onClick={() => { setShowUserMenu(false); signOut(() => router.push('/')) }}
              style={{
                display:'block',width:'100%',textAlign:'left' as const,
                padding:'10px 20px',background:'none',border:'none',
                fontSize:'13px',color:MUTED,fontFamily:SANS,cursor:'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

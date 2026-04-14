'use client'
import AbarvaNav from '@/components/AbarvaNav'
const B='#060A12',C='#0D1520',E='#1C2D45',T='#2DD4C8',W='#EFF6FF',M='#94A3B8'
const SANS='DM Sans, sans-serif', MONO='JetBrains Mono, monospace', SERIF='Georgia, serif'
export default function SolutionMargin() {
  return (
    <div style={{minHeight:'100vh',background:B,fontFamily:SANS,color:W}}>
      <AbarvaNav activePage="solutions"/>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'80px 32px',textAlign:'center' as const}}>
        <div style={{fontFamily:MONO,fontSize:'10px',color:T,letterSpacing:'.14em',textTransform:'uppercase' as const,marginBottom:'16px'}}>Solution · Margin Intelligence · All verticals</div>
        <h1 style={{fontFamily:SERIF,fontSize:'44px',fontWeight:500,color:W,marginBottom:'16px',lineHeight:1.2}}>Margin Optimization</h1>
        <p style={{fontSize:'17px',color:M,maxWidth:'600px',margin:'0 auto 12px',lineHeight:1.7}}>Recover margin across revenue, cost structure, and AI portfolio. Fee on outcomes only.</p>
        <p style={{fontFamily:MONO,fontSize:'13px',color:T,maxWidth:'600px',margin:'0 auto 48px',fontStyle:'italic'}}>"Operating margin 1.8% against a 4% target. Don't know which lever to pull."</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',maxWidth:'800px',margin:'0 auto 48px'}}>
          {[['$60–120M','Annual recovery'],['15–20%','Fee on verified savings only'],['Day 0','Baseline locked — immutable']].map(([v,l])=>(
            <div key={v} style={{background:C,border:`1px solid ${E}`,borderRadius:'12px',padding:'24px',borderTop:`2px solid ${T}`}}>
              <div style={{fontFamily:SERIF,fontSize:'28px',color:T,marginBottom:'6px'}}>{v}</div>
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

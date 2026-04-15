'use client'
import { useState } from 'react'
import AbarvaNav from '@/components/AbarvaNav'

const BG='#060A12', CARD='#0D1520', BORDER='#1C2D45'
const TEAL='#2DD4C8', WHITE='#EFF6FF', MUTED='rgba(255,255,255,0.75)', DIM='rgba(255,255,255,0.6)'
const RED='#EF4444', AMBER='#F59E0B', GREEN='#34D399'
const SANS='DM Sans, sans-serif', MONO='JetBrains Mono, monospace', SERIF='Georgia, serif'

const inputStyle: React.CSSProperties = {
  background: '#0D1520',
  border: `1px solid ${BORDER}`,
  color: WHITE,
  borderRadius: 6,
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: SANS,
  width: '100%',
  boxSizing: 'border-box' as const,
}

export default function Homepage() {
  const [formData, setFormData] = useState({name:'',org:'',email:'',interest:'',message:''})
  const [submitted, setSubmitted] = useState(false)

  return (
    <div style={{minHeight:'100vh',background:BG,fontFamily:SANS,color:WHITE}}>
      <AbarvaNav activePage="home" />

      {/* HERO */}
      <div style={{padding:'100px 32px 80px'}}>
        <div style={{maxWidth:1280,margin:'0 auto',display:'grid',gridTemplateColumns:'45% 50%',gap:'5%',alignItems:'center'}}>

          {/* Left column */}
          <div>
            <div style={{fontFamily:MONO,fontSize:10,color:TEAL,letterSpacing:'.14em',textTransform:'uppercase' as const,marginBottom:16}}>
              Enterprise transformation · AI-native · Outcome-accountable
            </div>
            <h1 style={{fontFamily:SERIF,fontSize:52,fontWeight:500,lineHeight:1.15,marginBottom:20,margin:'0 0 20px'}}>
              Act on intelligence.<br />
              Before the<br />
              <em style={{color:TEAL}}>window closes.</em>
            </h1>
            <p style={{fontSize:17,color:MUTED,maxWidth:480,lineHeight:1.7,marginBottom:12}}>
              AbarVa diagnoses what&apos;s broken, prescribes the right architecture and vendors, and embeds a small Maestro team to execute — fee tied to your outcomes, not our hours.
            </p>
            <p style={{fontSize:14,color:'rgba(255,255,255,0.70)',maxWidth:480,lineHeight:1.6,marginBottom:32}}>
              Start with a Solution. Scale to full <a href="/ai-strategy" style={{color:TEAL,textDecoration:'none'}}>AI Value Realization</a>.
            </p>
            <div style={{display:'flex',gap:12,flexWrap:'wrap' as const}}>
              <a href="/diagnose?client=meridian" style={{background:TEAL,color:BG,padding:'12px 22px',borderRadius:8,fontSize:13,fontWeight:600,textDecoration:'none',cursor:'pointer'}}>
                See it with Meridian Health →
              </a>
              <a href="#demo" style={{background:'transparent',color:MUTED,border:`1px solid ${BORDER}`,padding:'12px 22px',borderRadius:8,fontSize:13,textDecoration:'none',cursor:'pointer'}}>
                Watch a demo
              </a>
              <a href="#contact" style={{color:MUTED,fontSize:13,textDecoration:'none',padding:'12px 0',cursor:'pointer'}}>
                Contact us
              </a>
            </div>
            <div style={{marginTop:24,display:'flex',alignItems:'center',gap:8}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:TEAL,flexShrink:0}} />
              <a href="/sign-in" style={{fontSize:'12px',color:AMBER,textDecoration:'none'}}>
                Investor view secured separately — request access →
              </a>
            </div>
          </div>

          {/* Right column — stat grid */}
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              {/* Stat 1 */}
              <div style={{background:CARD,border:`1px solid ${BORDER}`,borderTop:`2px solid ${RED}`,borderRadius:10,padding:'20px 16px'}}>
                <div style={{fontFamily:MONO,fontSize:9,color:MUTED,textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:8}}>Consulting spend wasted</div>
                <div style={{fontFamily:SERIF,fontSize:44,color:WHITE,lineHeight:1}}>$200B</div>
                <div style={{fontSize:11,color:MUTED,marginTop:4}}>Global annual market with no outcome accountability</div>
              </div>
              {/* Stat 2 */}
              <div style={{background:CARD,border:`1px solid ${BORDER}`,borderTop:`2px solid ${AMBER}`,borderRadius:10,padding:'20px 16px'}}>
                <div style={{fontFamily:MONO,fontSize:9,color:MUTED,textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:8}}>Enterprise AI with zero ROI</div>
                <div style={{fontFamily:SERIF,fontSize:44,color:AMBER,lineHeight:1}}>73%</div>
                <div style={{fontSize:11,color:MUTED,marginTop:4}}>Of AI investments produce no verified outcome</div>
              </div>
              {/* Stat 3 */}
              <div style={{background:CARD,border:`1px solid ${BORDER}`,borderTop:`2px solid ${GREEN}`,borderRadius:10,padding:'20px 16px'}}>
                <div style={{fontFamily:MONO,fontSize:9,color:MUTED,textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:8}}>AbarVa model</div>
                <div style={{fontFamily:SERIF,fontSize:28,color:GREEN,lineHeight:1.2}}>Skin in the game</div>
                <div style={{fontSize:11,color:MUTED,marginTop:4}}>Fee tied to your outcomes. Not our hours.</div>
              </div>
              {/* Stat 4 */}
              <div style={{background:CARD,border:`1px solid ${BORDER}`,borderTop:`2px solid ${TEAL}`,borderRadius:10,padding:'20px 16px'}}>
                <div style={{fontFamily:MONO,fontSize:9,color:MUTED,textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:8}}>Time to first intelligence</div>
                <div style={{fontFamily:SERIF,fontSize:44,color:TEAL,lineHeight:1}}>48hrs</div>
                <div style={{fontSize:11,color:MUTED,marginTop:4}}>From kickoff to your first Situation brief</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PROBLEM BAND */}
      <div style={{background:'#08101C',borderTop:`1px solid ${BORDER}`,borderBottom:`1px solid ${BORDER}`,padding:'40px 32px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1px 1fr 1px 1fr',gap:0,maxWidth:900,margin:'0 auto'}}>
          <div style={{padding:'0 32px',textAlign:'center' as const}}>
            <div style={{fontFamily:SERIF,fontSize:42,color:RED,marginBottom:8}}>$94M</div>
            <div style={{fontSize:13,color:MUTED}}>Meridian Health&apos;s AI portfolio — zero with documented ROI</div>
          </div>
          <div style={{background:BORDER}} />
          <div style={{padding:'0 32px',textAlign:'center' as const}}>
            <div style={{fontFamily:SERIF,fontSize:42,color:AMBER,marginBottom:8}}>71%</div>
            <div style={{fontSize:13,color:MUTED}}>Arcturus Financial&apos;s cost-to-income ratio vs 58% target — $840M gap</div>
          </div>
          <div style={{background:BORDER}} />
          <div style={{padding:'0 32px',textAlign:'center' as const}}>
            <div style={{fontFamily:SERIF,fontSize:42,color:AMBER,marginBottom:8}}>18 months</div>
            <div style={{fontSize:13,color:MUTED}}>Since Apex deployed Salesforce Einstein — adoption: 23%</div>
          </div>
        </div>
      </div>

      {/* PRODUCTS */}
      <div style={{padding:'80px 32px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{fontFamily:MONO,fontSize:10,color:TEAL,textTransform:'uppercase' as const,letterSpacing:'.14em',marginBottom:12}}>
            Five products · One intelligence layer
          </div>
          <div style={{fontFamily:SERIF,fontSize:38,color:WHITE,marginBottom:12}}>
            Intelligence that tells you what to do next.
          </div>
          <p style={{fontSize:16,color:MUTED,marginBottom:48,lineHeight:1.7}}>
            Each product runs on your data, your industry benchmarks, and 340 cross-client patterns from the Transformation Genome. The answer is specific. The source is transparent.
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:16}}>
            {[
              {id:'diagnose',    intel:'Situation Intelligence',     q:"What's actually broken — and what is it costing?",    impact:'Uncover the real cost of what\'s broken'},
              {id:'ai-strategy', intel:'AI Strategy Intelligence',   q:'Where should we place our AI bets?',                  impact:'Prioritize what actually delivers'},
              {id:'select',      intel:'Vendor Intelligence',        q:'Which vendor actually wins in our situation?',         impact:'Score against your data, not demos'},
              {id:'justify',     intel:'Business Case Intelligence', q:'How do we justify this to the board?',                 impact:'CFO-defensible models, risk-adjusted'},
              {id:'outcomes',    intel:'Outcome Intelligence',       q:"Did it work — and can we prove it?",                  impact:'Baseline locked. Outcomes verified.'},
            ].map(p => (
              <div key={p.id} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:'20px',position:'relative' as const,overflow:'hidden'}}>
                <div style={{fontFamily:MONO,fontSize:9,color:TEAL,textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:8}}>{p.intel}</div>
                <div style={{fontSize:13,fontWeight:500,color:WHITE,marginBottom:8,lineHeight:1.4}}>{p.q}</div>
                <div style={{fontSize:11,color:MUTED,marginBottom:16}}>{p.impact}</div>
                <a href={`/${p.id}?client=meridian`} style={{color:TEAL,fontFamily:MONO,fontSize:11,textDecoration:'none',cursor:'pointer'}}>Explore →</a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SOLUTIONS */}
      <div style={{padding:'0 32px 80px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{fontFamily:SERIF,fontSize:32,color:WHITE,marginBottom:8}}>Diagnosis is just the start. We execute.</div>
          <p style={{fontSize:15,color:MUTED,marginBottom:40,lineHeight:1.6}}>
            AbarVa doesn&apos;t hand you a report and leave. Maestros embed. They execute. They track outcomes.
          </p>
          <div style={{display:'flex',flexDirection:'column' as const,gap:0,border:`1px solid ${BORDER}`,borderRadius:12,overflow:'hidden'}}>
            {[
              {name:'AI-Powered PDLC',    href:'/solutions/pdlc',     desc:'Build products at twice the velocity', quote:'"We\'re spending $300M in capital. Time to production is 16 months. Engineers aren\'t building — they\'re in meetings."', metric:'$18M reduction', sub:'consulting spend'},
              {name:'AI-Powered Delivery',href:'/solutions/delivery', desc:'Replace consulting teams with Maestros', quote:'"80 consultants on site. 70% of their time is getting up to speed. Knowledge walks out the door every Friday."', metric:'4 Maestros', sub:'replace 40'},
              {name:'Margin Optimization',href:'/solutions/margin',   desc:'Recover margin across revenue, cost, AI', quote:'"Operating margin 1.8% against a 4% target. Don\'t know where it\'s leaking or which lever to pull first."', metric:'$60–120M', sub:'annual recovery'},
            ].map((row, i, arr) => (
              <div key={row.name} style={{display:'flex',alignItems:'stretch',borderBottom: i < arr.length-1 ? `1px solid ${BORDER}` : 'none'}}>
                <div style={{flex:1,padding:'24px',borderRight:`1px solid ${BORDER}`}}>
                  <div style={{fontFamily:MONO,fontSize:10,color:TEAL,textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:6}}>{row.name}</div>
                  <div style={{fontSize:14,fontWeight:500,color:WHITE,marginBottom:4}}>{row.desc}</div>
                  <a href={row.href} style={{color:TEAL,fontSize:'12px',textDecoration:'none',fontFamily:MONO,cursor:'pointer'}}>Learn more →</a>
                </div>
                <div style={{flex:1,padding:'24px',borderRight:`1px solid ${BORDER}`,background:'rgba(255,255,255,0.01)'}}>
                  <span style={{fontSize:13,color:MUTED,fontStyle:'italic',lineHeight:1.5}}>{row.quote}</span>
                </div>
                <div style={{width:160,flexShrink:0,padding:'24px',display:'flex',flexDirection:'column' as const,justifyContent:'center'}}>
                  <div style={{fontFamily:SERIF,fontSize:20,color:WHITE}}>{row.metric}</div>
                  <div style={{fontSize:11,color:MUTED}}>{row.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DEMO */}
      <div id="demo" style={{padding:'80px 32px',background:'#08101C',borderTop:`1px solid ${BORDER}`,borderBottom:`1px solid ${BORDER}`}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{fontFamily:MONO,fontSize:10,color:TEAL,letterSpacing:'.14em',textTransform:'uppercase' as const,marginBottom:12}}>
            See it working · No signup required
          </div>
          <div style={{fontFamily:SERIF,fontSize:32,color:WHITE,marginBottom:8}}>Two composite organizations. Real-world data. Live intelligence.</div>
          <p style={{fontSize:15,color:MUTED,marginBottom:40,lineHeight:1.6}}>
            Built from real-world datasets across healthcare and financial services. Every metric is real. Every problem is one a CXO has faced.
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16,marginBottom:48}}>
            {[
              {name:'Meridian Health System',    color:TEAL,      vertical:'Healthcare',         revenue:'$11.2B', finding:'"$94M AI spend · zero documented ROI"',     dataNote:'Built from real-world healthcare data', href:'/diagnose?client=meridian'},
              {name:'Arcturus Financial Group',  color:'#818CF8', vertical:'Financial Services', revenue:'$16.2B', finding:'"AI spend up. Pilots: zero ROI tracked."',   dataNote:'Built from real-world finserv data',    href:'/diagnose?client=arcturus'},
            ].map(t => (
              <a key={t.name} href={t.href} style={{display:'block',background:CARD,border:`1px solid ${BORDER}`,borderTop:`2px solid ${t.color}`,borderRadius:12,padding:24,textDecoration:'none',cursor:'pointer'}}>
                <div style={{fontSize:16,fontWeight:500,color:WHITE,marginBottom:4}}>{t.name}</div>
                <div style={{fontFamily:MONO,fontSize:10,color:MUTED}}>{t.vertical} · {t.revenue}</div>
                <div style={{fontSize:13,color:MUTED,fontStyle:'italic',marginTop:12,lineHeight:1.4}}>{t.finding}</div>
                <div style={{fontSize:11,color:MUTED,marginTop:8}}>{t.dataNote}</div>
              </a>
            ))}
          </div>
          {/* Video placeholder */}
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:'32px',textAlign:'center' as const,maxWidth:600,margin:'0 auto'}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:'rgba(45,212,200,0.15)',border:'1px solid rgba(45,212,200,0.4)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:18,color:TEAL,marginBottom:12}}>
              ▶
            </div>
            <div style={{fontSize:16,fontWeight:500,color:WHITE,marginBottom:8}}>Recorded product walkthrough — 8 minutes</div>
            <div style={{fontSize:13,color:MUTED,lineHeight:1.5,marginBottom:12}}>Watch a full Maestro session from Situation through Strategy to Business Case</div>
            <div style={{fontFamily:MONO,fontSize:11,color:MUTED}}>(Video coming soon · Request a live demo below)</div>
          </div>
        </div>
      </div>

      {/* HOW WE EARN */}
      <div style={{padding:'80px 32px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{fontFamily:SERIF,fontSize:32,color:WHITE,marginBottom:8}}>Skin in the game. Fee on outcomes only.</div>
          <p style={{fontSize:15,color:MUTED,marginBottom:48,lineHeight:1.6}}>
            Four steps. Baseline locked on day 0. Fee tied to your outcomes — not our hours.
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0,border:`1px solid ${BORDER}`,borderRadius:12,overflow:'hidden',marginBottom:32}}>
            {[
              {num:'01',name:'DIAGNOSE', desc:'Situation product · 48hrs · your data'},
              {num:'02',name:'PRESCRIBE',desc:'Strategy + Vendor + Business Case'},
              {num:'03',name:'EXECUTE',  desc:'Maestro team embeds · knowledge stays'},
              {num:'04',name:'VERIFY',   desc:'Baseline vs actuals · fee on outcomes only'},
            ].map((step, i, arr) => (
              <div key={step.num} style={{padding:'24px',borderRight: i < arr.length-1 ? `1px solid ${BORDER}` : 'none'}}>
                <div style={{fontFamily:MONO,fontSize:11,color:MUTED,marginBottom:16}}>{step.num}</div>
                <div style={{fontFamily:MONO,fontSize:11,color:TEAL,textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:8}}>{step.name}</div>
                <div style={{fontSize:13,color:MUTED,lineHeight:1.5}}>{step.desc}</div>
              </div>
            ))}
          </div>
          <div style={{background:'rgba(45,212,200,0.04)',border:'1px solid rgba(45,212,200,0.2)',borderRadius:12,padding:'24px 32px',display:'flex',alignItems:'flex-start' as const,gap:12}}>
            <span style={{fontSize:16,flexShrink:0}}>🔒</span>
            <span style={{fontSize:14,color:WHITE,lineHeight:1.6}}>
              The baseline is locked on Day 0 and is immutable. Every metric. Every assumption. Verified by the CXO. We cannot move the goalposts — and neither can you.
            </span>
          </div>
        </div>
      </div>

      {/* PROOF */}
      <div style={{padding:'80px 32px',background:'#08101C',borderTop:`1px solid ${BORDER}`,borderBottom:`1px solid ${BORDER}`}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,maxWidth:900,margin:'0 auto'}}>
          {[
            {num:'340', label:'Transformation patterns in the Genome — each with documented failure rates'},
            {num:'89%', label:'Of organizations with regulatory overdue + no plan face enforcement action within 90 days'},
            {num:'79%', label:'Of CDO vacancies at AI governance crunch points result in programme failure'},
          ].map(c => (
            <div key={c.num} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:'28px'}}>
              <div style={{fontFamily:SERIF,fontSize:48,color:TEAL}}>{c.num}</div>
              <div style={{fontSize:13,color:MUTED,marginTop:8,lineHeight:1.5}}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTACT */}
      <div id="contact" style={{padding:'80px 32px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{fontFamily:SERIF,fontSize:32,color:WHITE,marginBottom:8}}>Ready to see your organization in here?</div>
          <p style={{fontSize:15,color:MUTED,marginBottom:48}}>No sales calls. A Maestro responds within 24 hours.</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:48}}>

            {/* Left — contact options */}
            <div style={{display:'flex',flexDirection:'column' as const,gap:12}}>
              <a href="/diagnose?client=meridian" style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:'16px 20px',textDecoration:'none',display:'block',cursor:'pointer'}}>
                <div style={{fontSize:14,fontWeight:500,color:TEAL,marginBottom:4}}>See a live demo</div>
                <div style={{fontSize:12,color:MUTED}}>No login required. See real intelligence running on real data.</div>
              </a>
              <a href="/sign-in" style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:'16px 20px',textDecoration:'none',display:'block',cursor:'pointer'}}>
                <div style={{fontSize:14,fontWeight:500,color:WHITE,marginBottom:4}}>Maestro login</div>
                <div style={{fontSize:12,color:MUTED}}>Enter your org email — AbarVa routes you automatically</div>
              </a>
              <a href="/sign-in" style={{background:CARD,border:'1px solid rgba(245,158,11,0.3)',borderRadius:10,padding:'16px 20px',textDecoration:'none',display:'block',cursor:'pointer'}}>
                <div style={{fontSize:14,fontWeight:500,color:AMBER,marginBottom:4}}>Investor view</div>
                <div style={{fontSize:12,color:MUTED}}>Secured separately — request access</div>
              </a>
            </div>

            {/* Right — form */}
            <div>
              {!submitted ? (
                <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                    <input
                      placeholder="First name"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      style={inputStyle}
                    />
                    <input
                      placeholder="Last name"
                      style={inputStyle}
                    />
                  </div>
                  <input
                    placeholder="Organization email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    style={{...inputStyle, marginBottom:16}}
                  />
                  <input
                    placeholder="Organization name"
                    value={formData.org}
                    onChange={e => setFormData({...formData, org: e.target.value})}
                    style={{...inputStyle, marginBottom:16}}
                  />
                  <select
                    value={formData.interest}
                    onChange={e => setFormData({...formData, interest: e.target.value})}
                    style={{...inputStyle, marginBottom:16}}
                  >
                    <option value="">What brings you here?</option>
                    <option value="cxo">CXO / Executive</option>
                    <option value="investor">Investor</option>
                    <option value="exploring">Exploring AbarVa</option>
                    <option value="maestro">Maestro candidate</option>
                  </select>
                  <textarea
                    placeholder="Message (optional)"
                    rows={3}
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    style={{...inputStyle, marginBottom:16}}
                  />
                  <button
                    type="submit"
                    style={{width:'100%',background:TEAL,color:BG,padding:'12px',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',border:'none'}}
                  >
                    Request a conversation →
                  </button>
                  <div style={{fontSize:12,color:MUTED,marginTop:8}}>No sales calls. A Maestro responds within 24 hours.</div>
                </form>
              ) : (
                <div style={{fontSize:15,color:TEAL,lineHeight:1.7}}>
                  Thank you — a Maestro will be in touch within 24 hours.
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{borderTop:`1px solid ${BORDER}`}}>
        <div style={{padding:'32px',display:'flex',justifyContent:'space-between',alignItems:'center',maxWidth:1280,margin:'0 auto',flexWrap:'wrap' as const,gap:16}}>
          <div>
            <span style={{fontFamily:SERIF,fontSize:18,fontWeight:500,color:WHITE,letterSpacing:'-0.01em'}}>Abar</span>
            <span style={{fontFamily:MONO,fontSize:14,color:TEAL,letterSpacing:'.04em'}}>Va</span>
          </div>
          <div style={{display:'flex',gap:20,alignItems:'center',flexWrap:'wrap' as const}}>
            <a href="/diagnose?client=meridian" style={{fontSize:13,color:MUTED,textDecoration:'none',cursor:'pointer'}}>Intelligence</a>
            <a href="/solutions/pdlc" style={{fontSize:13,color:MUTED,textDecoration:'none',cursor:'pointer'}}>Solutions</a>
            <a href="/sign-in" style={{fontSize:13,color:MUTED,textDecoration:'none',cursor:'pointer'}}>Investors</a>
            <a href="#contact" style={{fontSize:13,color:MUTED,textDecoration:'none',cursor:'pointer'}}>Contact</a>
            <a href="/sign-in" style={{fontSize:13,color:MUTED,textDecoration:'none',cursor:'pointer'}}>Login</a>
            <span style={{fontSize:11,color:MUTED}}>© 2026 AbarVa</span>
          </div>
        </div>
      </div>

    </div>
  )
}

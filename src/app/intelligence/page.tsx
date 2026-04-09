'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { meridianTechInventory } from '@/data/meridian/technology_inventory'
import { apexRetailTechInventory } from '@/data/apexretail/technology_inventory'
import { firstCapitalTechInventory } from '@/data/firstcapital/technology_inventory'
import { calculateTechScore, getScoreLabel, getCriticalSystems, getSystemsByDomain, getSystemsByUnit, getSystemsByCategory, getTotalAnnualCost } from '@/data/knowledge/scoring'

type View = 'scorecard' | 'functional' | 'technical' | 'byunit'

function IntelligenceContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'meridian'
  const [activeView, setActiveView] = useState<View>('scorecard')
  const [selectedSystem, setSelectedSystem] = useState<any>(null)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [streamingResponse, setStreamingResponse] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const clientName = clientId === 'firstcapital' ? 'First Capital Financial' :
    clientId === 'apexretail' ? 'Apex Retail Group' : 'Meridian Health System'

  const inventory = clientId === 'apexretail' ? apexRetailTechInventory : clientId === 'firstcapital' ? firstCapitalTechInventory : meridianTechInventory
  const overallScore = calculateTechScore(inventory)
  const criticalSystems = getCriticalSystems(inventory)
  const totalCost = getTotalAnnualCost(inventory)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, streamingResponse])

  async function sendChat(text?: string) {
    const msg = text || chatInput
    if (!msg.trim()) return
    const newMsg = { role: 'user', content: msg }
    const updated = [...chatMessages, newMsg]
    setChatMessages(updated)
    setChatInput('')
    setChatLoading(true)
    setStreamingResponse('')
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updated, role: 'CIO', client: clientId })
    })
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let full = ''
    if (!reader) return
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      full += decoder.decode(value)
      setStreamingResponse(full)
    }
    setChatMessages(prev => [...prev, { role: 'assistant', content: full }])
    setStreamingResponse('')
    setChatLoading(false)
  }

  function healthBadge(health: string) {
    const map: Record<string, string> = {
      green: 'bg-green-900 text-green-300 border-green-700',
      yellow: 'bg-yellow-900 text-yellow-300 border-yellow-700',
      red: 'bg-red-900 text-red-300 border-red-700',
    }
    const label: Record<string, string> = { green: '● Healthy', yellow: '● Issues', red: '● At Risk' }
    return <span className={`text-xs px-2 py-0.5 rounded border ${map[health] || map.yellow}`}>{label[health] || '● Unknown'}</span>
  }

  function scoreBar(score: number) {
    const c = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
    return (
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${c}`} style={{ width: `${score}%` }} />
      </div>
    )
  }

  const domains = clientId === 'apexretail'
    ? ['Customer Experience', 'Store Operations', 'Supply Chain', 'Finance and Administration', 'Data and Analytics', 'Infrastructure']
    : clientId === 'firstcapital'
    ? ['Digital Banking', 'Core Banking', 'Payments', 'Risk and Compliance', 'Data and Analytics', 'Infrastructure']
    : ['Patient Care', 'Revenue Cycle', 'Patient Engagement', 'Finance and Administration', 'Supply Chain', 'Data and Analytics', 'Infrastructure', 'Health Plan']

  const businessUnits = clientId === 'apexretail'
    ? ['Digital', 'Store Operations', 'Marketing', 'Shared Services']
    : clientId === 'firstcapital'
    ? ['Retail Banking', 'Commercial Banking', 'Risk and Compliance', 'Shared Services']
    : ['Provider/Hospitals', 'Blue Ridge Facilities', 'Health Plan', 'Shared Services', 'Critical Access Hospitals']

  const categories = clientId === 'apexretail'
    ? ['ERP', 'Ecommerce Platform', 'Order Management', 'Supply Chain Planning', 'Warehouse Management', 'Customer Data Platform', 'Loyalty Platform', 'Data and AI Platform', 'Data Warehouse', 'Point of Sale']
    : clientId === 'firstcapital'
    ? ['Core Banking', 'Digital Banking', 'Payments', 'AML and Compliance', 'Data Warehouse', 'Cybersecurity']
    : ['EHR/EMR', 'Revenue Cycle Management', 'Patient Engagement', 'ERP', 'Data Warehouse', 'Business Intelligence', 'Cloud Platform', 'Cybersecurity', 'Integration Engine', 'Imaging/PACS', 'Pharmacy', 'Workforce Management']

  return (
    <div className="min-h-screen flex flex-col" style={{background: "#FAFAFA", color: "#0F172A"}}>
      <nav className="px-6 py-3 flex justify-between items-center flex-shrink-0" style={{background: "#FFFFFF", borderBottom: "1px solid #E2E8F0"}}>
        <div className="flex items-center gap-4">
          <button onClick={() => window.location.href = '/'} className="text-sm transition" style={{color: "#2563EB"}}>Back to Dashboard</button>
          <span className="text-gray-600">|</span>
          <h1 className="text-lg font-bold" style={{color: "#0F172A"}}>Technology Intelligence</h1>
          <span className="text-gray-600">|</span>
          <span className="text-sm" style={{color: "#475569"}}>{clientName}</span>
          <span className={`text-xs px-2 py-1 rounded ${overallScore >= 70 ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
            {overallScore}% complete
          </span>
        </div>
        <div className="flex gap-2">
          {([
            { id: 'scorecard', label: 'Scorecard' },
            { id: 'functional', label: 'By Function' },
            { id: 'technical', label: 'By Category' },
            { id: 'byunit', label: 'By Business Unit' },
          ] as {id: View, label: string}[]).map(v => (
            <button key={v.id} onClick={() => { setActiveView(v.id); setSelectedSystem(null); setSelectedDomain(null) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeView === v.id ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}>
              {v.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6" style={{background: "#FAFAFA"}}>

          {selectedSystem && (
            <div>
              <button onClick={() => setSelectedSystem(null)} className="text-sm text-gray-400 hover:text-white mb-4 transition">Back</button>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold mb-1">{selectedSystem.name}</h2>
                        <p className="text-gray-400 text-sm">{selectedSystem.vendor} · {selectedSystem.category}</p>
                      </div>
                      {healthBadge(selectedSystem.health)}
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Version', value: selectedSystem.version },
                        { label: 'Annual Cost', value: `$${selectedSystem.annualCost}M` },
                        { label: 'Contract Expiry', value: selectedSystem.contractExpiry },
                        { label: 'Completeness', value: `${selectedSystem.completeness}%` },
                      ].map((m, i) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                          <p className="font-semibold text-sm">{m.value}</p>
                        </div>
                      ))}
                    </div>
                    {selectedSystem.riskReason && (
                      <div className="bg-red-950 border border-red-800 rounded-lg p-4 mb-4">
                        <p className="text-xs font-semibold text-red-300 mb-1">Risk</p>
                        <p className="text-sm text-gray-300">{selectedSystem.riskReason}</p>
                      </div>
                    )}
                    {selectedSystem.businessOwner && (
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Business Owner: <span className="text-gray-300">{selectedSystem.businessOwner}</span></p>
                        <p>IT Owner: <span className="text-gray-300">{selectedSystem.itOwner}</span></p>
                      </div>
                    )}
                  </div>
                  {selectedSystem.issues && selectedSystem.issues.length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <h3 className="text-sm font-semibold mb-3">Known Issues</h3>
                      <div className="space-y-2">
                        {selectedSystem.issues.map((issue: string, i: number) => (
                          <div key={i} className="flex gap-2 text-sm">
                            <span className="text-red-400 flex-shrink-0">!</span>
                            <span className="text-gray-300">{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="bg-blue-950 border border-blue-800 rounded-xl p-5">
                    <h3 className="font-semibold text-blue-300 mb-3">Next Action</h3>
                    <p className="text-sm text-gray-300 mb-4">{selectedSystem.nextAction}</p>
                    <button onClick={() => sendChat(`Tell me about ${selectedSystem.name} and what we should do`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition">
                      Ask Abarva
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedSystem && activeView === 'scorecard' && (
            <div>
              <h2 className="text-xl font-bold mb-2">Technology Scorecard</h2>
              <p className="text-gray-400 text-sm mb-6">{inventory.metadata.totalSystems} systems · ${totalCost.toFixed(1)}M annual spend</p>
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-500 mb-2">Overall Score</p>
                  <div className={`text-5xl font-bold mb-1 ${overallScore >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>{overallScore}%</div>
                  <p className="text-xs text-gray-400 text-center">{getScoreLabel(overallScore)}</p>
                </div>
                {[
                  { label: 'Systems Documented', value: `${inventory.metadata.documentedSystems}/${inventory.metadata.totalSystems}`, sub: `${inventory.metadata.undocumentedSystems} undocumented` },
                  { label: 'Critical Risk', value: String(criticalSystems.length), sub: 'Require immediate action' },
                  { label: 'Annual Spend', value: `$${totalCost.toFixed(1)}M`, sub: 'Total technology cost' },
                ].map((m, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <p className="text-xs text-gray-400 mb-2">{m.label}</p>
                    <div className="text-2xl font-bold mb-1">{m.value}</div>
                    <div className="text-xs text-gray-500">{m.sub}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Score by Domain</h3>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                    {inventory.scoringModel.categories.map((cat: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{cat.name}</span>
                          <span className={`font-bold ${cat.score >= 70 ? 'text-green-400' : cat.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{cat.score}%</span>
                        </div>
                        {scoreBar(cat.score)}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Critical Systems</h3>
                  <div className="space-y-3">
                    {criticalSystems.map((sys: any, i: number) => (
                      <button key={i} onClick={() => setSelectedSystem(sys)}
                        className="w-full bg-red-950 border border-red-800 rounded-xl p-4 text-left hover:border-red-600 transition">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-sm">{sys.name}</span>
                          <span className="text-xs text-red-400">Critical</span>
                        </div>
                        <p className="text-xs" style={{color: "#94A3B8"}}>{sys.riskReason?.substring(0, 80)}...</p>
                      </button>
                    ))}
                  </div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-3">Architecture Gaps</h3>
                  <div className="space-y-2">
                    {inventory.gaps.map((gap: any, i: number) => (
                      <button key={i} onClick={() => sendChat(`Tell me about the ${gap.area} gap`)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-left hover:border-yellow-600 transition">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-sm">{gap.area}</span>
                          <span className="text-xs text-yellow-400">{gap.severity}</span>
                        </div>
                        <p className="text-xs" style={{color: "#94A3B8"}}>{gap.businessImpact}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedSystem && activeView === 'functional' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Technology by Business Function</h2>
              {!selectedDomain ? (
                <div className="grid grid-cols-2 gap-4">
                  {domains.map(domain => {
                    const systems = getSystemsByDomain(inventory, domain)
                    const redCount = systems.filter((s: any) => s.health === 'red').length
                    const domainCost = systems.reduce((sum: number, s: any) => sum + (s.annualCost || 0), 0)
                    return (
                      <button key={domain} onClick={() => setSelectedDomain(domain)}
                        className={`p-5 rounded-xl border text-left transition hover:opacity-90 ${redCount > 0 ? 'bg-red-950 border-red-800' : systems.length === 0 ? 'bg-gray-900 border-gray-700' : 'bg-gray-900 border-gray-800'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold">{domain}</h3>
                          <span className="text-xs" style={{color: "#94A3B8"}}>{systems.length === 0 ? 'No data' : `${systems.length} systems`}</span>
                        </div>
                        {domainCost > 0 && <p className="text-xs text-gray-500 mb-2">${domainCost.toFixed(1)}M/yr</p>}
                        <div className="flex flex-wrap gap-1">
                          {systems.slice(0, 3).map((s: any, i: number) => (
                            <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{s.name}</span>
                          ))}
                          {systems.length > 3 && <span className="text-xs text-gray-500">+{systems.length - 3} more</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div>
                  <button onClick={() => setSelectedDomain(null)} className="text-sm text-gray-400 hover:text-white mb-4 transition">Back</button>
                  <h3 className="text-lg font-bold mb-4">{selectedDomain}</h3>
                  <div className="space-y-3">
                    {getSystemsByDomain(inventory, selectedDomain).length === 0 ? (
                      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
                        <p className="text-gray-400 mb-2">No systems inventoried</p>
                        <button onClick={() => sendChat(`What systems should we have in ${selectedDomain}?`)} className="text-xs text-blue-400">Ask Abarva</button>
                      </div>
                    ) : getSystemsByDomain(inventory, selectedDomain).map((sys: any, i: number) => (
                      <button key={i} onClick={() => setSelectedSystem(sys)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-blue-500 transition">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{sys.name}</h4>
                            <p className="text-xs" style={{color: "#94A3B8"}}>{sys.vendor}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            {healthBadge(sys.health)}
                            <span className="text-sm">${sys.annualCost}M/yr</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Completeness: {sys.completeness}%</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!selectedSystem && activeView === 'technical' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Technology by System Category</h2>
              <div className="space-y-6">
                {categories.map(cat => {
                  const systems = getSystemsByCategory(inventory, cat)
                  if (systems.length === 0) return null
                  return (
                    <div key={cat}>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat}</h3>
                      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-800">
                              <th className="text-left p-3 text-gray-500 font-medium text-xs">System</th>
                              <th className="text-left p-3 text-gray-500 font-medium text-xs">Vendor</th>
                              <th className="text-left p-3 text-gray-500 font-medium text-xs">Health</th>
                              <th className="text-left p-3 text-gray-500 font-medium text-xs">Risk</th>
                              <th className="text-right p-3 text-gray-500 font-medium text-xs">Cost</th>
                              <th className="text-right p-3 text-gray-500 font-medium text-xs">Expiry</th>
                            </tr>
                          </thead>
                          <tbody>
                            {systems.map((sys: any, i: number) => (
                              <tr key={i} onClick={() => setSelectedSystem(sys)}
                                className="border-b border-gray-800 last:border-0 cursor-pointer hover:bg-gray-800 transition">
                                <td className="p-3 font-medium">{sys.name}</td>
                                <td className="p-3 text-gray-400 text-xs">{sys.vendor}</td>
                                <td className="p-3">{healthBadge(sys.health)}</td>
                                <td className="p-3 text-xs">
                                  <span className={sys.riskLevel === 'Critical' ? 'text-red-400' : sys.riskLevel === 'High' ? 'text-orange-400' : 'text-yellow-400'}>
                                    {sys.riskLevel}
                                  </span>
                                </td>
                                <td className="p-3 text-right text-xs">${sys.annualCost}M</td>
                                <td className="p-3 text-right text-xs text-gray-400">{sys.contractExpiry?.substring(0, 10)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!selectedSystem && activeView === 'byunit' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Technology by Business Unit</h2>
              <div className="space-y-6">
                {businessUnits.map(unit => {
                  const systems = getSystemsByUnit(inventory, unit)
                  const unitCost = systems.reduce((sum: number, s: any) => sum + (s.annualCost || 0), 0)
                  const redCount = systems.filter((s: any) => s.health === 'red').length
                  return (
                    <div key={unit}>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-gray-300">{unit}</h3>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>{systems.length} systems</span>
                          {unitCost > 0 && <span>${unitCost.toFixed(1)}M/yr</span>}
                          {redCount > 0 && <span className="text-red-400">{redCount} critical</span>}
                        </div>
                      </div>
                      {systems.length === 0 ? (
                        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-500">No systems documented</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-3">
                          {systems.map((sys: any, i: number) => (
                            <button key={i} onClick={() => setSelectedSystem(sys)}
                              className={`p-3 rounded-xl border text-left transition hover:opacity-80 ${sys.health === 'red' ? 'bg-red-950 border-red-800' : sys.health === 'yellow' ? 'bg-yellow-950 border-yellow-800' : 'bg-gray-900 border-gray-800'}`}>
                              <p className="font-medium text-xs mb-1">{sys.name}</p>
                              <p className="text-xs text-gray-500">${sys.annualCost}M/yr</p>
                              <div className="mt-2">{healthBadge(sys.health)}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>

        <div className="w-80 flex flex-col" style={{background: "#FFFFFF", borderLeft: "1px solid #E2E8F0"}}>
          <div className="p-4" style={{borderBottom: "1px solid #E2E8F0"}}>
            <h3 className="font-semibold text-sm mb-1" style={{color: "#0F172A"}}>Technology Agent</h3>
            <p className="text-xs" style={{color: "#94A3B8"}}>Ask anything about the technology landscape</p>
          </div>
          {chatMessages.length === 0 && (
            <div className="p-4 space-y-2">
              {['What systems are at highest risk?', 'Which contracts expire soon?', 'Where are we overspending?', 'What is our biggest integration risk?'].map((s, i) => (
                <button key={i} onClick={() => sendChat(s)}
                  className="w-full text-left text-xs rounded-lg p-3 transition" style={{background: "#F4F6F8", border: "1px solid #E2E8F0", color: "#374151"}}>{s}</button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-xl p-3 text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-200'}`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {chatLoading && !streamingResponse && <div className="text-xs p-3" style={{color: "#94A3B8"}}>Analyzing...</div>}
            {streamingResponse && (
              <div className="flex justify-start">
                <div className="rounded-xl p-3 text-xs max-w-xs whitespace-pre-wrap" style={{background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#374151"}}>{streamingResponse}</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 flex gap-2" style={{borderTop: "1px solid #E2E8F0"}}>
            <input className="flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none" style={{background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A"}}
              placeholder="Ask about any system..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendChat() }} />
            <button onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()}
              className="disabled:opacity-50 text-xs px-3 py-2 rounded-lg font-medium" style={{background: "#2563EB", color: "#FFFFFF"}}>Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IntelligencePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white flex items-center justify-center text-lg">Loading Intelligence Browser...</div>}>
      <IntelligenceContent />
    </Suspense>
  )
}

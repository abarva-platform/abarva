'use client' 
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const SUGGESTED_ORGS = [
  { name: 'HCA Healthcare', type: 'Health System', size: '$60B revenue' },
  { name: 'Mayo Clinic', type: 'Academic Medical Center', size: '$17B revenue' },
  { name: 'JPMorgan Chase', type: 'Financial Services', size: '$158B revenue' },
  { name: 'Bank of America', type: 'Financial Services', size: '$98B revenue' },
  { name: 'CommonSpirit Health', type: 'Health System', size: '$35B revenue' },
  { name: 'Ascension Health', type: 'Health System', size: '$28B revenue' },
]

export default function SearchPage() {
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [phase, setPhase] = useState('search')
  const [result, setResult] = useState('')
  const [gatheringSteps, setGatheringSteps] = useState<string[]>([])
  const [savedClientId, setSavedClientId] = useState<string | null>(null)

  const steps = [
    'Searching SEC EDGAR and financial filings...',
    'Pulling earnings call transcripts...',
    'Scanning CMS quality database...',
    'Analyzing job postings for technology signals...',
    'Processing recent news and press releases...',
    'Identifying leadership team...',
    'Mapping to transformation knowledge base...',
    'Generating intelligence brief...',
  ]

  async function searchOrg(name?: string) {
    const searchName = name || orgName
    if (!searchName.trim()) return
    setLoading(true)
    setPhase('gathering')
    setGatheringSteps([])
    setResult('')
    setSavedClientId(null)

    let stepIndex = 0
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setGatheringSteps(prev => [...prev, steps[stepIndex]])
        stepIndex++
      } else {
        clearInterval(stepInterval)
      }
    }, 800)

    const res = await fetch('/api/org-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgName: searchName })
    })

    clearInterval(stepInterval)
    setGatheringSteps(steps)

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let fullResult = ''
    if (!reader) return
    setPhase('result')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      fullResult += decoder.decode(value)
      setResult(fullResult)
    }
    setLoading(false)
  }

  async function saveAsClient() {
    setSaving(true)
    const industry = orgName.toLowerCase().includes('health') ||
      orgName.toLowerCase().includes('clinic') ||
      orgName.toLowerCase().includes('hospital') ||
      orgName.toLowerCase().includes('medical')
      ? 'Healthcare' : 'Financial Services'

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: orgName,
        type: 'New Client',
        industry,
        intelligence_brief: result,
        confidence_score: 45,
      })
      .select()
      .single()

    if (!error && data) {
      setSavedClientId(data.id)
    }
    setSaving(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">AbarVa</h1>
        <button
          onClick={() => window.location.href = '/'}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Back to dashboard
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-12">

        {phase === 'search' && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Instant Org Intelligence</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Enter any organization name. AbarVa gathers public intelligence,
                maps it to our knowledge base, and produces a transformation brief
                in under 60 seconds.
              </p>
            </div>

            <div className="flex gap-3 mb-12">
              <input
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-lg"
                placeholder="Enter any company or health system name..."
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchOrg()}
                autoFocus
              />
              <button
                onClick={() => searchOrg()}
                disabled={!orgName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-8 py-4 rounded-xl transition text-lg"
              >
                Analyze
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Try these organizations
              </p>
              <div className="grid grid-cols-3 gap-3">
                {SUGGESTED_ORGS.map((org, i) => (
                  <button
                    key={i}
                    onClick={() => { setOrgName(org.name); searchOrg(org.name) }}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-blue-500 transition"
                  >
                    <p className="font-medium text-sm mb-1">{org.name}</p>
                    <p className="text-xs text-gray-500">{org.type} · {org.size}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === 'gathering' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-2">Gathering intelligence on {orgName}</h2>
              <p className="text-gray-400">Searching public sources and mapping to knowledge base...</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
              {gatheringSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">{step}</span>
                </div>
              ))}
              {gatheringSteps.length < steps.length && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-blue-400 animate-pulse">●</span>
                  <span className="text-gray-400">{steps[gatheringSteps.length]}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-1">Intelligence Brief: {orgName}</h2>
                <p className="text-gray-400 text-sm">
                  Gathered from public sources · {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setPhase('search'); setResult(''); setOrgName('') }}
                  className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-gray-800 transition"
                >
                  Search another
                </button>
                {savedClientId ? (
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 rounded-lg text-sm bg-green-600 hover:bg-green-700 text-white transition"
                  >
                    Saved — Go to dashboard
                  </button>
                ) : (
                  <button
                    onClick={saveAsClient}
                    disabled={saving || loading}
                    className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition"
                  >
                    {saving ? 'Saving...' : 'Load as client'}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 whitespace-pre-wrap leading-relaxed text-sm text-gray-200 mb-6">
              {result || (loading ? 'Synthesizing intelligence...' : '')}
            </div>

            {!loading && result && !savedClientId && (
              <div className="bg-blue-950 border border-blue-800 rounded-xl p-6">
                <h3 className="font-semibold mb-2 text-blue-300">Next Step</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Save this organization as a client workspace. AbarVa will guide you
                  through loading additional data to increase confidence from 45% to 90%+.
                </p>
                <button
                  onClick={saveAsClient}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition text-sm"
                >
                  {saving ? 'Creating workspace...' : 'Create client workspace'}
                </button>
              </div>
            )}

            {savedClientId && (
              <div className="bg-green-950 border border-green-800 rounded-xl p-6">
                <h3 className="font-semibold mb-2 text-green-300">Client workspace created</h3>
                <p className="text-sm text-gray-300 mb-4">
                  {orgName} has been saved. Return to the dashboard to begin the guided data load.
                </p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition text-sm"
                >
                  Go to dashboard
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}

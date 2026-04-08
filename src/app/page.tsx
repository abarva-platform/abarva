'use client'
import { useState } from 'react'

export default function Home() {
  const [step, setStep] = useState('home')
  const [loading, setLoading] = useState(false)
  const [diagnosis, setDiagnosis] = useState('')
  const [form, setForm] = useState({
    orgName: '',
    orgSize: '',
    vertical: '',
    challenge: ''
  })

  async function runDiagnosis() {
    setLoading(true)
    setDiagnosis('')
    setStep('result')
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) return
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setDiagnosis(prev => prev + decoder.decode(value))
    }
    setLoading(false)
  }

  if (step === 'home') return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold mb-4">Abarva</h1>
        <p className="text-gray-400 text-xl mb-12">Vision to strategy to execution</p>
        <button onClick={() => setStep('diagnose')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition">
          Diagnose my organization
        </button>
      </div>
    </main>
  )

  if (step === 'diagnose') return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setStep('home')} className="text-gray-400 mb-8 hover:text-white">Back</button>
        <h2 className="text-3xl font-bold mb-8">Diagnose your organization</h2>
        <div className="space-y-4">
          <input className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500" placeholder="Organization name" value={form.orgName} onChange={e => setForm({...form, orgName: e.target.value})} />
          <select className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white" value={form.orgSize} onChange={e => setForm({...form, orgSize: e.target.value})}>
            <option value="">Organization size</option>
            <option>Small (under 1,000 employees)</option>
            <option>Mid-size (1,000-10,000 employees)</option>
            <option>Large (10,000-50,000 employees)</option>
            <option>Enterprise (50,000+ employees)</option>
          </select>
          <select className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white" value={form.vertical} onChange={e => setForm({...form, vertical: e.target.value})}>
            <option value="">Select industry</option>
            <option>Healthcare</option>
            <option>Financial Services</option>
            <option>Retail</option>
            <option>Manufacturing</option>
            <option>Public Sector</option>
          </select>
          <textarea className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 h-32 resize-none" placeholder="Describe your primary transformation challenge..." value={form.challenge} onChange={e => setForm({...form, challenge: e.target.value})} />
          <button onClick={runDiagnosis} disabled={loading || !form.orgName || !form.orgSize || !form.vertical || !form.challenge} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition">
            Run Diagnosis
          </button>
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setStep('diagnose')} className="text-gray-400 mb-8 hover:text-white">Run another diagnosis</button>
        <h2 className="text-3xl font-bold mb-2">{form.orgName}</h2>
        <p className="text-gray-400 mb-8">{form.vertical}</p>
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 whitespace-pre-wrap leading-relaxed">
          {loading && !diagnosis ? 'Analyzing...' : diagnosis}
        </div>
      </div>
    </main>
  )
}

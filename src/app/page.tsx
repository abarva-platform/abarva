'use client'
import { useState } from 'react'

export default function Home() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  async function askAbarva() {
    setLoading(true)
    setResponse('')
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
    const data = await res.json()
    setResponse(data.response)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Abarva</h1>
        <p className="text-gray-400 mb-8">
          Vision to strategy to execution — work made easy
        </p>
        <textarea
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 h-32 resize-none focus:outline-none focus:border-blue-500"
          placeholder="Describe your transformation challenge..."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button
          onClick={askAbarva}
          disabled={loading || !message}
          className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-lg transition"
        >
          {loading ? 'Thinking...' : 'Ask Abarva'}
        </button>
        {response && (
          <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-6 whitespace-pre-wrap leading-relaxed">
            {response}
          </div>
        )}
      </div>
    </main>
  )
}
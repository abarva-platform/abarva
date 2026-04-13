import { DEMO_RESPONSES, type DemoClient } from '@/data/demo'

// Demo mode is active when the URL contains ?demo=true or the env flag is set
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('demo') === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export function getDemoResponse(client: DemoClient, questionKey: string) {
  return DEMO_RESPONSES[client]?.[questionKey] ?? null
}

// Simulates a streaming response for demo playback
// Calls onChunk with each word, calls onDone when complete
export function streamDemoResponse(
  client: DemoClient,
  questionKey: string,
  onChunk: (chunk: string) => void,
  onDone: (sources: string[]) => void,
  wordsPerSecond = 40,
): () => void {
  const demo = getDemoResponse(client, questionKey)
  if (!demo) {
    onDone([])
    return () => {}
  }

  const words = demo.response.split(' ')
  let index = 0
  const interval = 1000 / wordsPerSecond

  const timer = setInterval(() => {
    if (index >= words.length) {
      clearInterval(timer)
      onDone(demo.sources)
      return
    }
    const chunk = index === 0 ? words[index] : ' ' + words[index]
    onChunk(chunk)
    index++
  }, interval)

  // Return cancel function
  return () => clearInterval(timer)
}

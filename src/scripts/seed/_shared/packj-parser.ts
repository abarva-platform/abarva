import fs from 'node:fs'
import path from 'node:path'

export type PackJClientKey = 'meridian' | 'firstcapital' | 'apex'

type ClientMarker = {
  start: string
  end?: string
}

const CLIENT_MARKERS: Record<PackJClientKey, ClientMarker> = {
  meridian: {
    start: '# Client 1 · Meridian Health System',
    end: '# Client 2 · First Capital Financial',
  },
  firstcapital: {
    start: '# Client 2 · First Capital Financial',
    end: '# Client 3 · Apex Retail Group',
  },
  apex: {
    start: '# Client 3 · Apex Retail Group',
  },
}

export type ParsedMarkdownRow = Record<string, string>

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function readPackJSpec() {
  const filePath = path.join(process.cwd(), 'abarva-pack-realistic-portfolio.md')
  if (!fs.existsSync(filePath)) {
    throw new Error(`Pack J spec not found at ${filePath}`)
  }

  return fs.readFileSync(filePath, 'utf8')
}

export function getPackJClientSection(clientKey: PackJClientKey) {
  const source = readPackJSpec()
  const marker = CLIENT_MARKERS[clientKey]
  const startIndex = source.indexOf(marker.start)
  if (startIndex === -1) {
    throw new Error(`Unable to find Pack J section for ${clientKey}`)
  }

  const endIndex = marker.end ? source.indexOf(marker.end, startIndex + marker.start.length) : -1
  return source.slice(startIndex, endIndex === -1 ? undefined : endIndex).trim()
}

export function extractHeadingBlock(section: string, headingPrefix: string) {
  const lines = section.split('\n')
  const startIndex = lines.findIndex(line => line.startsWith(headingPrefix))
  if (startIndex === -1) {
    throw new Error(`Unable to find heading "${headingPrefix}" in Pack J section`)
  }

  const block: string[] = []
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index]
    if (index > startIndex && (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# '))) {
      break
    }
    block.push(line)
  }

  return block.join('\n').trim()
}

export function parseMarkdownTable(section: string, headingPrefix: string): ParsedMarkdownRow[] {
  const block = extractHeadingBlock(section, headingPrefix)
  const lines = block.split('\n')
  const tableLines = lines.filter(line => line.trim().startsWith('|'))

  if (tableLines.length < 3) {
    throw new Error(`Heading "${headingPrefix}" does not contain a parseable markdown table`)
  }

  const headers = tableLines[0]
    .split('|')
    .map(cell => cell.trim())
    .filter(Boolean)
    .map(normalizeHeader)

  return tableLines
    .slice(2)
    .map(line => line.split('|').map(cell => cell.trim()).filter(Boolean))
    .filter(cells => cells.length === headers.length)
    .map(cells => headers.reduce<ParsedMarkdownRow>((row, header, index) => {
      row[header] = cells[index] || ''
      return row
    }, {}))
}

export function parseLeadingPercent(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)%/)
  return match ? Math.round(Number(match[1])) : undefined
}

export function parseCurrencyToUsd(value: string) {
  if (!value || value.trim() === '—') return undefined

  const matches = Array.from(value.matchAll(/\$([\d.]+)\s*([KMB])?/gi))
  if (!matches.length) return undefined

  return matches.reduce((sum, match) => {
    const numeric = Number(match[1])
    const unit = (match[2] || '').toUpperCase()
    const multiplier = unit === 'M' ? 1_000_000 : unit === 'B' ? 1_000_000_000 : unit === 'K' ? 1_000 : 1
    return sum + (numeric * multiplier)
  }, 0)
}

export function parseBudgetToUsd(value: string) {
  return parseCurrencyToUsd(value) || 0
}

export function parsePercentValue(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)%/)
  return match ? Math.round(Number(match[1])) : 0
}

export function inferPhaseFromPercent(pctComplete: number) {
  if (pctComplete >= 85) return { phase_current: 4, phase_total: 4 }
  if (pctComplete >= 60) return { phase_current: 3, phase_total: 4 }
  if (pctComplete >= 35) return { phase_current: 2, phase_total: 4 }
  return { phase_current: 1, phase_total: 4 }
}

export function parsePhaseDescriptor(value: string) {
  if (!value || /^\d+(?:\.\d+)?%$/.test(value.trim())) {
    return undefined
  }

  const exact = value.match(/(\d+)\s+of\s+(\d+)/i)
  if (exact) {
    return {
      phase_current: Number(exact[1]),
      phase_total: Number(exact[2]),
    }
  }

  if (/ongoing/i.test(value)) return { phase_current: 2, phase_total: 5 }
  if (/fda-style testing/i.test(value)) return { phase_current: 3, phase_total: 5 }
  if (/pilot scale/i.test(value)) return { phase_current: 2, phase_total: 4 }
  if (/evaluation/i.test(value)) return { phase_current: 1, phase_total: 4 }
  if (/discovery complete/i.test(value)) return { phase_current: 2, phase_total: 4 }

  return { phase_current: 1, phase_total: 4 }
}

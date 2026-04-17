// Generate 18 TTS MP3 files for the demo page voice narration
// Run: npm run generate-demo-audio
// Requires: OPENAI_API_KEY in .env.local
// Cost: ~$0.05, takes ~30 seconds

import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const [k, ...v] = line.split('=')
    if (k && v.length) process.env[k.trim()] = v.join('=').trim()
  }
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const VOICE  = 'nova'   // warm, confident, professional — perfect for demo
const OUTPUT_DIR = path.join(process.cwd(), 'public/audio/demo')
fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const SCRIPTS = [
  {
    id: 'screen-01',
    text: `Enterprises spend 800 billion dollars a year on transformation.
    The deliverable is a PowerPoint.
    The knowledge walks out with the partner.
    No baseline. No accountability.
    The same firm comes back next year with the same recommendations.
    AbarVa changes that.`,
  },
  {
    id: 'screen-02',
    text: `AbarVa is not a consulting firm.
    It is an intelligence platform.
    Maestros embed inside the client — not external advisors.
    The fee is zero until outcomes are verified.
    The baseline is locked Day Zero — immutable.
    We cannot move the goalposts. Neither can you.`,
  },
  {
    id: 'screen-03',
    text: `AbarNexus is the brain that never forgets.
    Three dimensions of knowledge:
    340 transformation failure patterns from real engagements,
    your client data processed as embeddings in your environment,
    and emergent intelligence that compounds with every engagement.
    The 50th client benefits from the first 49.
    Permanently.`,
  },
  {
    id: 'screen-04',
    text: `F-zero-zero-seven: CDO vacant at go-live — 79 percent programme failure rate.
    F-zero-one-one: vendor SLA never enforced — 74 percent suboptimal outcome.
    F-zero-zero-three: platform end-of-life unplanned — 82 percent budget overrun.
    These are not estimates.
    They are documented failure modes from real transformations.
    AbarNexus flags them before they happen.`,
  },
  {
    id: 'screen-05',
    text: `AbarNexus is smart at every step — not just at the start.
    Every message triggers a retrieval from the knowledge base.
    HFMA benchmarks. Genome failure patterns. The uploaded Ensemble contract.
    The brain retrieves exactly what's relevant —
    and injects it into every single response.`,
  },
  {
    id: 'screen-06',
    text: `This is the Maestro workspace for Meridian Health System.
    Before the first meeting, the platform already knows:
    denial rate 18.2 percent versus benchmark of 11.4,
    the CDO role is vacant — F-zero-zero-seven active,
    and Epic goes live Q3 2026 — the forcing event.
    No discovery week.
    48 hours from data upload.`,
  },
  {
    id: 'screen-07',
    text: `The Maestro Guide. Five steps from setup to verified outcome.
    This is the operating manual that replaces 40 consultants.
    Setup the client workspace. Review what AbarNexus already knows.
    Run the engagement. Navigate AbarNexus through every phase.
    Capture the verified outcome and earn the fee.`,
  },
  {
    id: 'screen-08',
    text: `Click New Engagement.
    A four-step discovery conversation: the directive, the AI use cases,
    the technology landscape, the executive sponsor.
    AbarVa auto-infers the solution type from what you describe —
    you never pick from a list.
    A McKinsey SOW takes three weeks of scoping meetings.
    This takes three minutes — and arrives knowing more.`,
  },
  {
    id: 'screen-09',
    text: `Phase Zero, Step One.
    AbarNexus opens with three board-level signals at Meridian:
    the denial rate gap, the prior auth automation lag,
    and the Epic go-live window closing.
    Every option is a real CXO stance — not a vague category.
    Option D always opens free text — the user is never trapped.
    The AI Value Brief builds on the right. Every decision locked.`,
  },
  {
    id: 'screen-10',
    text: `18 steps. Five phases. Every outcome locked.
    22.4 million dollars verified — KPMG audited.
    Day Zero baseline never moved.
    Denial rate: 18.2 percent to 16.1 percent, tracking to 12.
    Epic integration on track Q3 2026.
    The board pack is ready. The fee is earned.
    Renewal confirmed.`,
  },
  {
    id: 'screen-11',
    text: `Not every problem needs 18 steps.
    AbarVa has point solutions for specific problems:
    vendor spend optimisation, RCM denial prevention,
    AI portfolio accountability, Epic AI integration.
    Each is a focused workflow with its own steps and deliverables.
    Same AbarNexus intelligence underneath.
    Faster time to value. No engagement manager required.`,
  },
  {
    id: 'screen-12',
    text: `Think about your biggest vendor contract right now.
    Your Bloomberg contract is 8.4 million dollars a year.
    AbarNexus knows 31 comparable asset managers pay 5.1 million.
    It found 1.4 million in unclaimed SLA credits — 18 months unacted.
    Run the Vendor Spend solution. Two weeks.
    CFO-grade negotiation brief.
    No third party. You own the intelligence. You run the RFP.`,
  },
  {
    id: 'screen-13',
    text: `Every phase produces structured deliverables.
    Situation Briefs. Architecture documents. Execution roadmaps.
    Board Packs with verified outcomes.
    All generated by AbarNexus, reviewed by the Maestro,
    stored in your workspace permanently.
    The knowledge stays with you —
    not in a partner's head, walking out the door.`,
  },
  {
    id: 'screen-14',
    text: `Meridian Health System.
    14-hospital IDN. Denial rate 18.2 percent.
    Ensemble SLA invoked Month Two.
    22.4 million dollars verified by Month Three — KPMG audited.
    5.7 times return on the AbarVa fee.
    Epic AI integration on track.
    Renewal confirmed. Meridian is a Phase Two client.`,
  },
  {
    id: 'screen-15',
    text: `Arcturus Financial Group. 200 billion AUM.
    Cost-to-income ratio 71 percent versus 58 percent peer benchmark —
    an 840 million dollar efficiency gap.
    AbarNexus found 94 million in AI spend with zero baselines,
    and 1.4 million in unclaimed Bloomberg SLA credits.
    18.2 million verified Month Four.
    C-I trajectory confirmed structural.`,
  },
  {
    id: 'screen-16',
    text: `Apex Retail Group. 340 stores.
    Azure spend 41 percent above peer benchmark — 39 million recoverable.
    F-zero-zero-three matched: Teradata end-of-life with no migration plan.
    Month One: reserved instance purchase — 14 million Year One, zero risk.
    Month Four: Azure plus Databricks Medallion live.
    47.2 million verified Month Six.`,
  },
  {
    id: 'screen-17',
    text: `Every engagement makes AbarNexus smarter. Permanently.
    At Series A, agents handle Phase Zero autonomously —
    one Maestro runs four to six engagements simultaneously.
    At Series B, the Genome Agent reads industry research continuously —
    AbarNexus self-updates from the world and from every engagement.
    Harvey AI built this structure for legal — eleven billion dollars.
    Our market is 800 billion. Nobody has touched it.`,
  },
  {
    id: 'screen-18',
    text: `When the engagement ends, everything stays with you.
    The Situation Brief. The Architecture. The Board Pack.
    Your data never leaves your environment.
    You run the next RFP yourself.
    You negotiate the next contract.
    AbarVa gave you the intelligence.
    Now act on it.`,
  },
]

async function generate() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY in .env.local')
    process.exit(1)
  }
  console.log(`Generating ${SCRIPTS.length} audio files to ${OUTPUT_DIR}...`)
  for (const script of SCRIPTS) {
    process.stdout.write(`  ${script.id}... `)
    const response = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: VOICE,
      input: script.text.replace(/\n\s+/g, ' ').trim(),
      speed: 0.95,
    })
    const buffer  = Buffer.from(await response.arrayBuffer())
    const outPath = path.join(OUTPUT_DIR, `${script.id}.mp3`)
    fs.writeFileSync(outPath, buffer)
    console.log(`✅ (${(buffer.length / 1024).toFixed(0)}KB)`)
    await new Promise(r => setTimeout(r, 200))
  }
  console.log(`\n✅ Done — ${SCRIPTS.length} files in public/audio/demo/`)
}

generate().catch(console.error)

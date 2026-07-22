# AI spend tracking

Answers one question daily: **what am I spending on AI, and what changed?**

## The two meters

Nexus AI spend runs on two separate meters. They are reported side by side and
**never summed** — adding them produces a number that matches no invoice.

| Meter             | Auth                | Carries                                                                                         | Basis                                             |
| ----------------- | ------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Anthropic API** | `ANTHROPIC_API_KEY` | Nexus runtime inference — Sentinel, Source, Tower, Home pack generation, key-authenticated jobs | **Billed USD**                                    |
| **Claude Code**   | OAuth seat          | Agent development sessions                                                                      | **Notional** at list price — not billed per token |

### Verified against real billing, 2026-07-22

| Meter             | Actual cost                 | Basis                                                                             |
| ----------------- | --------------------------- | --------------------------------------------------------------------------------- |
| **Claude Code**   | **$213.20 / month, flat**   | Max plan subscription (20× Pro). Invoices Jun 19 and Jul 19 both exactly $213.20. |
| **Anthropic API** | **$3,227.89** month to date | console → Cost, all token cost                                                    |

Claude Code's measured token volume is worth **$6,071 at API list price** — but
it costs **$213.20**. That is roughly **28× leverage** from the Max plan seat,
and it is why the notional figure must never be read as money.

**The operational consequence: there is essentially nothing to optimize on the
Claude Code side.** Session length, cache TTL, model choice and runaway agent
loops do not change a flat subscription. The only Claude Code constraint that
costs real money is exceeding Max plan rate limits, which draws down the usage
credit balance (currently $36.51, auto-reload $25 when it drops to $5). Neither
invoice to date shows a credit purchase, so that has not yet happened.

**The entire optimization target is the $3,227.89 API spend** — which is
96.5% Opus-tier (Opus 4.8 + Opus 4.7). Model routing, batching and persistent
caching belong there, on product inference, not on agent development.

Track Claude Code anyway, for two reasons: to catch rate-limit burn before it
starts consuming paid credits, and because notional value is the honest measure
of what the seat is returning.

### Deduplication — read this before trusting any total

Claude Code transcripts are **not disjoint**. Resuming or forking a session
copies prior history into the new session file, so a single API call can appear
in many `.jsonl` files. Measured over this window: **53.8% of assistant records
were duplicates**, with individual messages repeated up to **14 times**.

Counting every copy overstated the total by 2.4× ($14,606 vs the correct
$6,071). The collector now deduplicates on the server-assigned `message.id` and
prints the number of copied-forward records it dropped. **If that dedup line
ever disappears from the output, the totals below it are wrong.**

## Daily process

**Product half — automatic.** `.github/workflows/ai-cost-daily.yml` runs at
11:00 UTC: pulls the Admin API cost + usage reports, commits the snapshot to
`reports/ai-cost/daily/`, emails the digest.

**Development half — workstation.** `~/.claude/projects` does not exist on a CI
runner, so this half is collected locally:

```bash
./scripts/ai-cost/collect-local.sh
```

To schedule it, write `~/Library/LaunchAgents/ai.abarva.aicost.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>ai.abarva.aicost</string>
  <key>ProgramArguments</key>
  <array>
    <string>/Users/anand/Projects/nexus/scripts/ai-cost/collect-local.sh</string>
  </array>
  <key>StartCalendarInterval</key><dict>
    <key>Hour</key><integer>6</integer><key>Minute</key><integer>30</integer>
  </dict>
  <key>StandardErrorPath</key><string>/tmp/ai-cost.err</string>
</dict></plist>
```

```bash
launchctl load ~/Library/LaunchAgents/ai.abarva.aicost.plist
```

## Setup

**1. Mint an Admin API key** — console.anthropic.com → Settings → API keys →
_Admin keys_. Org owner only. A normal `sk-ant-api...` key returns 401 on the
organization endpoints.

**2. Add GitHub Actions secrets** (Settings → Secrets → Actions):

| Secret                | Value                         |
| --------------------- | ----------------------------- |
| `ANTHROPIC_ADMIN_KEY` | `sk-ant-admin...`             |
| `RESEND_API_KEY`      | existing Resend key           |
| `AI_COST_DIGEST_TO`   | recipient(s), comma-separated |
| `AI_COST_DIGEST_FROM` | verified Resend sender        |

**3. Apply the migration** when the collector moves inside the VNet:

```bash
npm run db:migrate
```

`ai_cost_daily` is the durable target. Until then, snapshots live in
`reports/ai-cost/daily/` — the control-plane Postgres is on a private VNet that
a GitHub-hosted runner cannot reach.

## Commands

```bash
# What did Claude Code cost this week, by model / branch / session?
node scripts/ai-cost/claude-code-usage.mjs --days 7

# What did the API actually bill?
node scripts/ai-cost/anthropic-cost-report.mjs --days 30 | head -60

# Admin API returned an unexpected shape? Dump it.
node scripts/ai-cost/anthropic-cost-report.mjs --days 1 --raw

# Render the digest without sending
node scripts/ai-cost/render-digest.mjs \
  --claude-code reports/ai-cost/daily/2026-07-22-claude-code.json \
  --out /tmp/digest.html
```

## Reading the numbers

**Read the API half for money; read the Claude Code half for capacity.**
Claude Code is a flat $213.20/month, so nothing in its section is a cost lever.
Its numbers answer a different question: are we approaching Max plan rate
limits, and is the seat still returning multiples of its price?

**On the API half, output tokens are the expensive side.** Output bills at 5×
input on every model. A workload that reads a large cached prefix and writes a
short answer is cheap; one that generates long documents is not. Home pack
generation, Moves deliverables and Source briefs are the long-output workloads —
they are the Batch API candidates (50% off input and output).

**Model mix is the biggest API lever.** The invoice is currently ~96.5%
Opus-tier. Classification, extraction, follow-up generation, schema repair and
QA triage do not need a frontier model; Haiku 4.5 is roughly a fifth of Opus
per token. Move those first and measure quality, not just price.

**A falling cache-read ratio is the regression signal.** In the 30-day baseline
97.4% of Claude Code's input side was cache reads, worth ~$50.8K notional
against sending the same prefixes uncached. If that ratio drops, a prompt prefix
started varying per request — `shared/prompt-caching.md` lists the usual causes
(a timestamp in the system prompt, non-deterministic JSON key order, a tool set
that varies per call). The same check applies to the API half, where it _does_
cost money.

**Cache writes are not free.** The 1-hour TTL write costs 2× base input; the
5-minute write costs 1.25×. A 1-hour write only pays off after two subsequent
reads. On the API side, prefer the 5-minute TTL unless the same prefix is
genuinely re-read across a long batch run.

**Session concentration is a capacity signal, not a cost one.** The largest
single session in the baseline was $413 notional in a day. On a flat plan that
costs nothing extra — but it is where rate-limit pressure comes from, and it
usually indicates a session that should have been split.

**Attribution is only as good as key separation.** `output_tokens_by_api_key`
showing everything under one key means the API half cannot be split by workload.
Separate keys per lane (`intelligence-runtime`, `tower-runtime`,
`home-pack-generation`, `source-artifact-generation`, `live-qa-pressure-tests`)
are what make the `workload` column in `ai_cost_daily` meaningful — and are the
prerequisite for knowing which Nexus surface is actually driving the invoice.

## Pricing table

`PRICING` in `claude-code-usage.mjs` carries USD per million tokens and must be
kept in sync with platform.claude.com/docs/en/pricing. Note Sonnet 5 is on
introductory pricing ($2/$10) through **2026-08-31**, after which it reverts to
$3/$15 — the notional series will step up ~50% for Sonnet 5 on that date for
reasons that have nothing to do with usage.

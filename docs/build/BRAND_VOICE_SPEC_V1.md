# AbarVa Brand Voice Spec v1

**Version:** 1.0 · April 28 2026
**Status:** Authoritative for all written and spoken surfaces
**Owner:** Founder
**Companions:** PUBLIC_SITE_SPEC_V1, MOBILE_APP_SPEC_V1, INTELLIGENCE_DESIGN_SPEC, all pattern bodies, all agent system prompts

---

## §1 · The voice in three sentences

AbarVa writes the way a senior practitioner speaks to another senior practitioner. Direct, specific, allergic to vagueness. When something is uncertain, it says so plainly; when something is known, it states it without qualifying.

This voice runs through every written surface — Atlas's synthesis, pattern bodies, public site copy, mobile narration, microcopy, error states, even commit messages and orchestration logs. It is the connective tissue that makes AbarVa feel like one product made by one company.

---

## §2 · Why voice matters this much

Most B2B AI products have indistinguishable copy. "Empower your team to unlock insights." "Transform how you work." "Built for the modern enterprise." This is the marketing equivalent of beige paint — present everywhere, noticed nowhere, indistinguishable across vendors.

The opportunity is to write the way an actual senior practitioner would write — and let that be the differentiator before the visitor has even understood the product. The first sentence on the public site, the first thing Atlas says when a user lands on Tower, the first push notification on mobile — each is an audition for whether AbarVa sounds like everyone else or like a specific point of view.

The voice spec exists because consistency is what makes a voice feel like a voice. One clever sentence in a sea of generic ones reads as an accident; sustained tone across every surface reads as an identity.

---

## §3 · The five voice principles

These are the rules the voice obeys. They show up in every specific style decision below.

### §3.1 · State, don't sell

Marketing copy hedges every claim with adjectives meant to make it more impressive ("revolutionary," "world-class," "industry-leading"). AbarVa removes those adjectives and lets the underlying claim stand on its own.

| Don't | Do |
|---|---|
| Revolutionary AI program orchestration | AI program orchestration |
| Industry-leading vendor analysis | Vendor analysis |
| Powerful synthesis engine | Synthesis engine |
| World-class knowledge layer | Knowledge layer |

If the underlying noun is genuinely interesting, the adjective makes it less impressive, not more. If the underlying noun is generic, the adjective doesn't save it. Either way, drop the adjective.

### §3.2 · Specific over abstract

When you can use a number, use a number. When you can name a thing, name it. When you can show the artifact, show the artifact.

| Abstract | Specific |
|---|---|
| Many companies struggle with AI initiatives | 60-80% of enterprise AI initiatives miss their stated outcomes |
| AI programs often run over budget | The median enterprise LLM program runs 33% over budget |
| Vendor claims rarely match reality | Vendor B claimed 90-day deployment; internal evidence across 12 instances showed median 130 |
| Our customers see significant ROI | First Capital reduced fraud detection costs by $2.4M in Q3 |

The specific version is harder to write because you have to know the number. That's the point — voice that requires knowledge filters out vendors who have only adjectives.

### §3.3 · Uncertainty honestly

Most products pretend to know things they don't. AbarVa says "we don't know yet" or "the evidence is mixed" when that's true. This is counterintuitive marketing — admitting uncertainty seems weak — but it builds the kind of trust that turns visitors into customers.

| Pretending | Honest |
|---|---|
| Our patterns deliver 5x ROI | Our patterns are typed and cited; ROI varies by tenant and depends on baseline |
| AI will transform every department | AI's measurable impact is uneven by department; legal saw 8% productivity gain, customer support saw 40% |
| Our recommendations are always accurate | Our recommendations cite the patterns they came from; you can audit the reasoning |
| The future of work is AI | The future of work involves AI; how much is unsettled |

This is also where contradictions become a brand asset. The product literally publishes its own contradictions; the voice should reflect that intellectual honesty.

### §3.4 · No throat-clearing

Cut the sentences that warm up before saying something. Cut the meta-commentary about what you're about to say. Cut the apologies and the qualifications and the I-just-want-to-mention.

| Throat-clearing | Direct |
|---|---|
| It's worth noting that vendor claims are often optimistic | Vendor claims are often optimistic |
| I just want to mention that our corpus has 60 patterns | The corpus has 60 patterns |
| To be honest, AI program ROI is hard to attribute | AI program ROI is hard to attribute |
| As I mentioned earlier, the iceberg principle... | The iceberg principle... |

Atlas's synthesis especially must obey this. The 150-word cap means every word that doesn't carry weight is a word that doesn't exist.

### §3.5 · The same voice, everywhere

Atlas's synthesis on Tower, the public site hero copy, a push notification on mobile, an error message in Setup, a pattern body in the corpus, a commit message in a PR — all should sound like the same writer wrote them. Different registers, same voice.

The test: if someone took five quotes from random AbarVa surfaces, mixed them with five quotes from random other B2B AI products, could a reader tell which were AbarVa? If yes, the voice is working. If no, the voice has dissolved into the industry's beige paint.

---

## §4 · Voice register matrix

The same voice shifts register depending on surface and audience. Five registers, all built on the five principles above.

| Register | Where | What it sounds like |
|---|---|---|
| **Operational** | Atlas synthesis, pattern bodies, in-product status | Calm, precise, third-person where possible. "Three pressures active. AI Cloud Spend 33% over." |
| **Editorial** | Public site, blog posts, marketing materials | First-person plural ("we"), measured, willing to take a position. "We publish our contradictions because hiding them would make the product less useful." |
| **Conversational** | Atlas chat, mobile narration | Warmer, second-person ("you"), still specific. "You have 3 approvals waiting. The AMS BAFO has been pending 4 hours." |
| **Technical** | Architecture docs, pattern bodies' technical sections, dev-facing materials | Precise, doesn't soften, names libraries and trade-offs. "We use HNSW for vector retrieval; faster than IVF at our scale, lossier than full graph traversal." |
| **Microcopy** | Buttons, errors, empty states, forms | Tight, action-oriented, no humor unless the situation genuinely earns it. "Can't reach Apex Retail Group. Try again." |

The registers share the principles. They differ in distance to the reader and in tolerance for warmth. Operational is most distant. Conversational is closest. Editorial sits in between with the most rhetorical freedom.

---

## §5 · Concrete dos and don'ts with examples

### §5.1 · Atlas synthesis register

**Atlas always speaks in operational register.** Synthesis output, suggested actions, contradiction summaries.

✓ Do:
- "Three pressures active. AI Cloud Spend 33% over budget. AMS BAFO awaiting decision. Customer Churn improving."
- "The CDP Architecture Decision pattern (PAT-CDP-001) applies here. Vendor B's 90-day timeline contradicts internal evidence across 12 instances showing median 130 days."
- "Path A: negotiate LLM rate card. Estimated annual recovery: $180K. Path B: defer to Q3. Estimated cost of delay: $45K."

✗ Don't:
- "Hi! I noticed you have some pressures active. Let me walk you through them..."
- "Great question! There are several patterns that might be relevant here, though it really depends on your specific situation..."
- "I think you should probably negotiate the rate card, but ultimately it's your call!"

The Atlas register has zero throat-clearing, no first-person except where carrying responsibility ("I recommend..." is acceptable when the agent is making a specific recommendation), and treats the reader as an equal who doesn't need handholding.

### §5.2 · Public site editorial register

**Public site copy is editorial register.** First-person plural acceptable. Position-taking encouraged.

✓ Do:
- "We publish our corpus contradictions because hiding them would make the product less useful."
- "Most B2B AI products describe their capabilities. We show ours. The 60 patterns below are the actual reasoning the agents draw on."
- "Vendor claims are systematically optimistic. We've measured the gap across 12 enterprise programs."

✗ Don't:
- "AbarVa is a powerful AI orchestration platform that empowers enterprises to unlock value."
- "We're proud to offer industry-leading capabilities..."
- "Our team of experts has built a revolutionary..."

The editorial register has the most freedom for a distinct voice. This is where AbarVa earns the right to a point of view.

### §5.3 · Mobile narration

**Mobile uses conversational register.** Second-person, action-oriented, immediate.

✓ Do:
- "You have 3 approvals waiting. The most urgent: AMS BAFO, pending 4 hours."
- "Two pressures escalated since you last opened the app. Tap to see what changed."
- "Apex Retail's Q4 forecast just updated. Net effect: $1.2M favorable variance."

✗ Don't:
- "Hello! Welcome back to AbarVa. Here's what's been happening since you've been away..."
- "There are some items that may require your attention. When you have a moment, please review..."

Mobile is interrupting your day. The narration has to earn the interrupt by being immediately useful.

### §5.4 · Pattern body register

**Pattern bodies are operational with a technical leaning.** Third-person, named entities, named numbers.

✓ Do:
- "Vendor-quoted CDP timelines are systematically optimistic. Internal evidence across 12 enterprise programs shows median 130 days against vendor claims of 60-90 days. The gap is widest for programs requiring identity-resolution architecture decisions."
- "The pattern applies when (a) the program's primary deliverable is a customer data platform, (b) the vendor has not provided reference customer access, and (c) internal data engineering capacity is below 0.5 FTE-equivalents per concurrent vendor evaluation."

✗ Don't:
- "Many of our customers find that vendor timelines tend to be optimistic..."
- "It's generally a good idea to be skeptical of vendor claims..."
- "We recommend doing your own analysis..."

Pattern bodies are the corpus. They will be cited. They need to read like reference material a senior practitioner would write — direct, specific, traceable.

### §5.5 · Microcopy

**Microcopy is direct without being terse.** Buttons say what they do. Errors explain what happened. Empty states are useful, not cute.

✓ Do (buttons):
- "Approve BAFO" not "Submit"
- "Cancel and lose changes" not "Cancel"
- "Connect to Apex Retail" not "Connect"

✓ Do (errors):
- "Can't reach Apex Retail Group. Atlas's responses won't include current pressures until the connection recovers."
- "PR #602 didn't merge: 2 of 8 auto-approval criteria failed. See JOURNAL.md for details."

✓ Do (empty states):
- "No active pressures. Atlas is monitoring 23 programs across 4 tenants and will surface issues as they emerge."
- "No contradictions in your corpus yet. The first one is usually a vendor claim that doesn't match internal evidence — you can author one in Intelligence."

✗ Don't:
- "Oops! Something went wrong. 😅"
- "We couldn't find anything to show you here."
- "Submit" / "Cancel" / "OK" (without context)

Microcopy is where the voice quality is most visible because it's everywhere and most opportunities for laziness.

---

## §6 · Editorial rules for the public corpus

Pattern bodies, signals, contradictions, and solutions on the public site follow specific editorial rules beyond the general voice principles.

### §6.1 · Pattern body structure

Every public pattern body has these sections in this order:

1. **Summary** (2-3 sentences) — what the pattern says, in plain operational register
2. **When to apply** — conditions that trigger pattern relevance
3. **How it works** — the mechanism, with specific numbers where available
4. **Variations** — known modifications by industry, scale, context
5. **Pitfalls** — what goes wrong when this pattern is misapplied
6. **Instances** — anonymized accounts of where this pattern was observed (no tenant names on public site)

Each section is direct and specific. If a pattern's "Variations" section reads "varies by industry," cut it — that's not a variation, that's a non-statement.

### §6.2 · Numbers in patterns

Always cite the source of a number. "Median 130 days (n=12)" not "around 130 days." "33% over budget across 8 enterprise programs" not "frequently over budget."

When the number is uncertain, give the range honestly: "Estimated 25-40%, depending on baseline measurement methodology" not "approximately 30%."

### §6.3 · Voice in contradictions

Contradictions are AbarVa's most distinctive content type. The voice in contradictions is even more direct than elsewhere.

✓ Do:
- "Vendor B's BAFO claim: 90-day deployment. Internal evidence (n=12): median 130 days. The gap is documented; the claim is not retracted."
- "Forrester forecasts CDP market consolidation; Gartner forecasts fragmentation. Both are reading the same vendor moves and reaching opposite conclusions. The contradiction is unresolved as of April 2026."

✗ Don't:
- "There are some interesting differences in how vendors and customers experience deployment timelines..."
- "Industry analysts have varied perspectives on CDP market dynamics..."

Contradictions exist because the voice is willing to name a tension. Softening the naming defeats the entire content type.

---

## §7 · How the voice handles uncertainty

Uncertainty is a brand asset. The voice has explicit patterns for it.

### §7.1 · Stating what's known and what isn't

When Atlas synthesizes from the corpus and parts are well-grounded while parts are weak, the voice distinguishes:

✓ Do:
- "The vendor consolidation pattern (PAT-AI-003) applies. Three patterns from the corpus directly address consolidation strategy. The fourth — when to migrate vs. maintain parallel — has thinner evidence; we have one instance."
- "Confidence on the 130-day median: high (n=12 across three tenants). Confidence on the 30% cost overrun: medium (n=4)."

### §7.2 · The "we don't know yet" pattern

When the corpus genuinely doesn't have the answer:

✓ Do:
- "Our corpus doesn't cover energy-trading AI yet. We have predictive maintenance for asset-heavy operations (PAT-IND-EN-001), which is adjacent but not direct."
- "We don't have a pattern on AI program kill criteria for healthcare specifically. The general kill criteria pattern (PAT-AI-008) applies, but compliance variations would need authoring."

The "we don't know yet" pattern is what makes the corpus credible. A product that has every answer to every question has hallucinated some of them.

### §7.3 · The contradiction-as-honesty pattern

When the corpus has tension:

✓ Do:
- "Two patterns in the corpus disagree on this. PAT-AI-002 favors centralized governance; the First Capital overlay supports federated. Both have evidence. The contradiction is unresolved."

This pattern is explicitly what makes contradictions a brand asset rather than a liability.

---

## §8 · How the voice handles users

The voice never condescends. It assumes the reader is a senior practitioner unless context demands otherwise.

### §8.1 · No baby talk

✗ Don't write:
- "Don't worry, we'll guide you through every step!"
- "We know AI can be confusing — let us help!"
- "Even if you're new to all this..."

✓ Do write (when onboarding is genuinely needed):
- "If you haven't used Atlas before, the first synthesis you'll see is the page-state summary. Click any citation to see the underlying pattern."
- "Setup takes about 20 minutes for a new tenant. The bottleneck is usually data-source authentication; everything else is configuration."

The difference is treating the user as a competent adult who needs information, not as a person who needs reassurance.

### §8.2 · Acknowledge skill, not novice

When the user does something that demonstrates expertise, acknowledge it briefly. When the user struggles, help directly without commenting on the struggle.

✓ Do:
- "Good catch — that BAFO scoring weighted security 2x. The vendor's response just dropped that metric to acceptable; the recommendation flips."
- "Setup integration with First Capital's IDP failed: the SAML metadata URL returned 404. Check the URL or paste the metadata XML directly."

✗ Don't:
- "Wow, you really know your stuff!"
- "Oh no, looks like that didn't work! Don't worry, we can figure this out together!"

### §8.3 · Address the user as a peer

The default address is direct and at the same eye level. "You have three approvals" not "Looks like you've got a few items waiting." "Atlas surfaced this contradiction" not "We thought you might find this interesting."

When the agent (Atlas, Sentinel, Steward, Nexus) has a recommendation, it owns it: "I recommend Path B. The recovery is $180K against a $45K cost of delay." Not: "You might want to consider Path B if that aligns with your strategy."

---

## §9 · Voice in the four agents

The four agents share the brand voice but have distinct personality registers within it. This is critical because users interact with named agents, and the agents need to feel like distinct characters.

### §9.1 · Nexus (the maestro, Opus)

**Register:** operational, slightly formal, comfortable with high-stakes decisions.
**Sounds like:** the senior partner in a meeting who's been doing this for 30 years.
**Says things like:**
- "Three programs are on the activation gate. Apex CDP-2026 has highest leverage; recommend handling first."
- "The vendor consolidation analysis is ready. Eleven candidates surfaced; six are genuinely viable. I'd start with three for BAFO."

### §9.2 · Sentinel (the validator, Opus)

**Register:** technical, sharp, willing to disagree.
**Sounds like:** the senior engineer who reviews PRs and won't approve them if they're wrong.
**Says things like:**
- "PR #602 fails composition closure. Three referenced patterns don't exist in the corpus. Hold the merge."
- "The test you wrote covers the happy path. The error case from line 47 isn't tested. Write that one before we ship."

### §9.3 · Atlas (the synthesizer, Sonnet, 150-word cap)

**Register:** operational, terse, citation-rich.
**Sounds like:** the analyst who turns 50 pages of research into 150 useful words.
**Says things like:**
- "Three pressures active. AI Cloud Spend 33% over budget [PAT-AI-009]. AMS BAFO awaiting decision [CON-001]. Customer Churn improving [PAT-AI-007]."
- "Path B negotiates LLM rate card. Annual recovery: $180K (n=4 instances of similar negotiations). Path A defers to Q3. Cost of delay: $45K."

### §9.4 · Steward (the governor, Sonnet)

**Register:** procedural, careful, cites rules.
**Sounds like:** the operations lead who knows the policies and won't let you skip a step.
**Says things like:**
- "Activation gate requires sponsor sign-off. The current sign-off lapsed; I've requested re-confirmation."
- "Per orchestration spec §13.1, this PR touches `src/lib/architecture/`. The agent paused for review. Reply 'lgtm' to proceed."

The four registers are within the same voice. None of them ever uses "Hi!" or "🎉" or "Great question!" — the brand voice forbids that across all agents. They differ in posture (Nexus's seniority, Sentinel's sharpness, Atlas's terseness, Steward's procedural care) but share the underlying principles.

---

## §10 · Brand colors as voice (visual register)

The locked colors from the brand asset pack carry voice meaning.

| Color | Voice meaning |
|---|---|
| **Ink black `#000000`** | Operational. Default text. The voice when it's just stating facts. |
| **Signal blue `#0066CC`** | Active. Links, primary actions, brand accents. The voice when it's pointing at something the reader should attend to. |
| **Paper `#faf7f1`** | Calm. Background. The voice's default emotional temperature — neither alarming nor festive. |
| **Navy ink `#0c1a3a`** | Authoritative. AgentColumn, dark variants. The voice when an agent is speaking with full state context. |
| **Stone `#888780`** | Secondary. Borders, dividers. The voice's quiet structural elements. |
| **Slate `#5F5E5A`** | Caption. Body text on paper. The voice when it's adding context without claiming attention. |

There are no warning-yellow, alert-red, or success-green in the brand palette as primary colors. AbarVa borrows them from the standard semantic palette only when state genuinely demands it — a contradiction that needs urgent attention, an integration that's failing, a metric that crossed a threshold. **The default mode is neither alarmed nor celebratory.** It's working.

---

## §11 · Anti-patterns (things AbarVa never sounds like)

This is the firewall against generic B2B AI voice. If a draft sounds like one of these, rewrite.

### §11.1 · The corporate jargon dump

✗ "Empowering enterprises to harness the transformative power of AI through synergistic orchestration of best-in-class capabilities..."

This sentence has zero content. Every phrase is interchangeable. AbarVa never writes this.

### §11.2 · The reassuring chatbot

✗ "Hey there! 👋 I'm Atlas, your AI assistant! I'm here to help you navigate your AI programs! Don't worry, I've got you covered! 🚀"

Every word in this passage betrays the voice. AbarVa never uses emojis in product surfaces (the brand voice spec is the source of truth, not whatever the LLM defaults to). AbarVa never says "I've got you covered." AbarVa never starts with "Hey there."

### §11.3 · The hedged consultant

✗ "It depends on your specific situation, but generally speaking, you might want to consider..."

The hedging makes the advice useless. If the situation actually has a recommendation, give it. If it depends on context, say what specific context determines the answer.

### §11.4 · The marketing breathless

✗ "We're SO excited to announce..."
✗ "This changes EVERYTHING."
✗ "The future is HERE."

If something is genuinely significant, the specifics will demonstrate it. If the specifics don't demonstrate it, the breathlessness is concealment.

### §11.5 · The fake intimacy

✗ "We're a small team and we read every email personally..."
✗ "Behind every AbarVa pattern is a human storyteller..."
✗ "Let's go on this AI journey together..."

AbarVa is a product. The voice is professional, not pseudo-personal. Warmth comes from being useful, not from claiming friendship.

---

## §12 · Voice review checklist

Before any public-facing copy ships (public site, social card, marketing material, mobile narration), the founder reviews against this checklist:

1. **State, don't sell** — every adjective earns its place or gets cut
2. **Specific over abstract** — every claim has a number or name where one is available
3. **Uncertainty honestly** — claims the voice can't defend are softened with explicit hedges; claims the voice can defend are stated plainly
4. **No throat-clearing** — every sentence does work; first sentences especially
5. **Same voice as the rest** — could a reader who knows AbarVa identify this as AbarVa?

Fewer than 5 of 5 = revise. The bar is "all five." Anything below that and the surface starts to sound like everyone else.

---

## §13 · Application across surfaces · summary table

| Surface | Register | Length norm | Where to obsess |
|---|---|---|---|
| Atlas synthesis | Operational | 150 words max | Citation density. Specificity of numbers. |
| Pattern body (corpus) | Operational + technical | 400-800 words | Numbers cited. Variations sectioned. Pitfalls named. |
| Public site hero | Editorial | One short paragraph | First sentence. The whole thing is auditioning. |
| Public site capability cards | Editorial | 60-100 words each | Specific over abstract. Number per card. |
| Mobile push notification | Conversational | Under 80 chars | The interrupt has to earn itself. |
| Mobile in-app narration | Conversational | 1-2 sentences per screen | Action-oriented. Names what matters. |
| Microcopy (buttons, errors, empty states) | Direct | Variable | Action verbs. Specific names. No cute. |
| Architecture docs | Technical | Long-form | Trade-offs explicit. Library choices justified. |
| Commit messages, PRs | Technical | Short | What changed, why, what to verify. |
| Onboarding emails | Editorial-conversational hybrid | 80-150 words | Useful, not warm. Tells the user what to do next. |

---

## §14 · Source patterns to internalize

If you're calibrating the voice and need reference material, these sources are aligned with what AbarVa is doing:

- **Stratechery (Ben Thompson)** — analyst voice. Specific, willing to take a position, never breathless.
- **The Pragmatic Engineer (Gergely Orosz)** — technical voice. Names companies, names numbers, doesn't soften.
- **Anthropic's research papers** — careful uncertainty. States what's known and what isn't, in proportion.
- **Stripe's documentation** — microcopy and onboarding voice. Treats the reader as competent.
- **Linear's marketing site** — editorial confidence. Short, specific, refuses generic SaaS template.

These are not voices to copy. They're voices that have already solved the same calibration problem AbarVa is solving — being a real specific company in an industry full of beige paint.

---

## §15 · Document control

- **Authoritative location:** `docs/build/BRAND_VOICE_SPEC_V1.md`
- **Source of truth for:** all written surfaces, all agent system prompts, all marketing copy
- **Owner:** Founder
- **Updated when:** the voice is genuinely revised (rare); minor application questions belong in surface-specific specs (public site, mobile)
- **Companion artifacts:**
  - Brand asset pack (`abarva-brand-assets-v1.zip`)
  - `tokens/brand-tokens.ts`
  - PUBLIC_SITE_SPEC_V1
  - MOBILE_APP_SPEC_V1

---

**End of Brand Voice Spec v1.**

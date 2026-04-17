// ═══════════════════════════════════════════════════════════════════
// ABARVA — AVR NAVIGATOR DEMO SEED
// Two parts:
//   PART 1: Code fix (Claude Code must make this change)
//   PART 2: Seed script (run in browser console after fix deployed)
// ═══════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════
// PART 1: CLAUDE CODE FIX
// ═══════════════════════════════════════════════════════════════════
//
// PROBLEM:
//   The navigator initialises localStorage on every page mount,
//   unconditionally overwriting any existing state.
//   This makes it impossible to seed completed demo data.
//
// FIND in the navigator component (likely one of these files):
//   src/app/ai-strategy/page.tsx
//   src/components/navigator/Navigator.tsx
//   src/hooks/useNavigatorState.ts
//   src/lib/navigatorState.ts
//
// Look for code like this (the initialisation pattern):
//
//   useEffect(() => {
//     localStorage.setItem(`abarva_avr_v2_${clientId}`, JSON.stringify(defaultState))
//   }, [clientId])
//
//   OR:
//
//   const state = localStorage.getItem(`abarva_avr_v2_${clientId}`)
//   if (!state) {
//     localStorage.setItem(`abarva_avr_v2_${clientId}`, JSON.stringify(defaultState))
//   }
//   // BUG: some versions always overwrite, not just when missing
//
// FIX — replace the initialisation with this guard:
//
//   const STORAGE_KEY = `abarva_avr_v2_${clientId}`
//
//   useEffect(() => {
//     const existing = localStorage.getItem(STORAGE_KEY)
//     if (existing) {
//       try {
//         const parsed = JSON.parse(existing)
//         // Only skip init if state has real data (not blank/corrupted)
//         if (parsed?.stepStatuses && parsed?.phaseStatuses) {
//           return  // ← DO NOT overwrite — existing state is valid
//         }
//       } catch (e) {
//         // JSON parse failed — fall through to init
//       }
//     }
//     // No valid state exists — initialise fresh
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState))
//   }, [clientId])
//
// ALSO ADD: a "Reset Demo" function for when you want to clear:
//
//   export function resetDemoState(clientId: string) {
//     localStorage.removeItem(`abarva_avr_v2_${clientId}`)
//   }
//
//   // Call this from a hidden debug button or URL param:
//   // /ai-strategy?client=meridian&reset=true
//   if (searchParams.get('reset') === 'true') {
//     resetDemoState(clientId)
//   }
//
// ═══════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════
// PART 2: SEED SCRIPT
// After deploying the fix above, run this in the browser console
// at https://app.abarva.ai/ai-strategy
// ═══════════════════════════════════════════════════════════════════

// First clear any existing state so the guard lets us write:
// localStorage.removeItem('abarva_avr_v2_meridian')
// localStorage.removeItem('abarva_avr_v2_arcturus')
// Then run the seed below:

const MERIDIAN_SEED = {
  phaseStatuses: { "0":"complete","1":"complete","2":"complete","3":"complete","4":"complete" },
  stepStatuses: {
    "0.1":"complete","0.2":"complete","0.3":"complete","0.4":"complete","0.5":"complete",
    "1.1":"complete","1.2":"complete","1.3":"complete","1.4":"complete",
    "2.1":"complete","2.2":"complete","2.3":"complete","2.4":"complete",
    "3.1":"complete","3.2":"complete","3.3":"complete",
    "4.1":"complete","4.2":"complete"
  },
  activeStep: "4.2",
  outcomes: [
    { stepId:"0.1", label:"Priority Signal", value:"Epic go-live risk — execution pressure is highest" },
    { stepId:"0.2", label:"AI Aspiration", value:"Revenue recovery — stop the $94M denial bleed first" },
    { stepId:"0.3", label:"Data Readiness", value:"42/100 — Epic freeze creating 6-9 month lag on historical records" },
    { stepId:"0.4", label:"Genome Match", value:"47 comparable health systems — 71% achieved target within 14 months" },
    { stepId:"0.5", label:"Confirmed Scope", value:"RCM denial prevention + Epic AI integration path" },
    { stepId:"1.1", label:"Situation Finding", value:"$94M annual gap — denial rate 18.2% vs 11.4% benchmark, 6.1pp above SLA" },
    { stepId:"1.2", label:"Contradiction", value:"Ensemble SLA penalties never enforced — $48M outsourced with no performance clause active" },
    { stepId:"1.3", label:"Data Gap", value:"Payer contract analysis missing — cannot model full recovery range without it" },
    { stepId:"1.4", label:"Diagnose Complete", value:"Phase 1 gate approved by Dr. Sarah Chen, CMO — $94M case accepted" },
    { stepId:"2.1", label:"Tech Stack", value:"312 applications — 42% flagged redundant. Epic go-live Q3 2026 is the constraint." },
    { stepId:"2.2", label:"Vendor Decision", value:"Ensemble retained with revised SLA — penalty clause inserted, 12% denial target by M6" },
    { stepId:"2.3", label:"Architecture", value:"AI-native Epic integration — denial prediction model deployed pre-go-live" },
    { stepId:"2.4", label:"Business Case", value:"$94M recovery · 5.7x ROI on AbarVa fee · CFO-approved · KPMG baseline locked Day 0" },
    { stepId:"3.1", label:"AI Delivery", value:"Denial prevention model live — Ensemble deploying 12 FTE dedicated team" },
    { stepId:"3.2", label:"Month 3 Actuals", value:"Denial rate 16.1% — down 2.1pp from 18.2% baseline. $12.8M annualised improvement." },
    { stepId:"3.3", label:"Outcome Verified", value:"$22.4M verified to date — audited by KPMG Month 3. On trajectory for $94M by M14." },
    { stepId:"4.1", label:"Fee Triggered", value:"$3.92M AbarVa fee — Invoice MER-FEE-001 issued on verified delta" },
    { stepId:"4.2", label:"Engagement Complete", value:"Phase 4 closed. $22.4M verified, 5.7x ROI. Renewal confirmed — Epic integration track activated." }
  ],
  messagesByStep: {
    "0.1": [
      { role:"ai", text:"I've pulled Meridian Health System's operational data. Three signals are registering as board-level risks:\n\n• Denial rate at 18.2% vs 11.4% benchmark — a $94M annual revenue gap that compounds every quarter\n• Prior auth automation at 23% vs 62% peer average — the manual drag is measurable and growing\n• Epic EHR go-live in Q3 2026 with no verified AI integration path — a 6-month execution window is closing\n\nWhich of these is keeping the CEO up at night?" },
      { role:"user", text:"Epic go-live — if we don't get AI in before go-live, we retrofit it for 18 months after" },
      { role:"ai", text:"Confirmed. Epic go-live is the time constraint that makes everything else urgent. The Genome shows 79% of health systems that retrofit AI post-Epic spend 40% more and take 18 months longer. The window is Q3 2026 — that's your clock.\n\nPriority signal locked: Epic go-live risk." }
    ],
    "0.2": [
      { role:"ai", text:"Given the Epic constraint, three AI paths are available:\n\nPath A — Revenue Recovery: Deploy AI against the $94M denial gap. ROI visible within 90 days. Fastest to board-level proof.\n\nPath B — Epic Integration: Build AI natively into the go-live. Avoids the technical debt of retrofitting post-implementation.\n\nPath C — Full RCM Transformation: Redesign the revenue cycle end-to-end.\n\nWhat is Meridian's leadership actually aligned on?" },
      { role:"user", text:"Revenue recovery first — the board needs to see ROI before they'll approve the Epic integration budget" },
      { role:"ai", text:"That sequencing is right. Stop the $94M bleed first, use that verified ROI to fund the Epic integration. The Genome confirms it — 71% of health systems that proved RCM ROI first got Epic AI budget approved within 6 months.\n\nAI Aspiration locked: Revenue recovery — stop the denial bleed first." }
    ],
    "0.3": [
      { role:"ai", text:"Meridian's data readiness score is 42 out of 100. The threshold for reliable AI deployment at scale is 60.\n\nThe three primary gaps:\n• Claims data fragmented across 47 facilities — no unified operational view\n• Epic migration creating a 6–9 month freeze on historical records\n• No AI-ready data platform in production\n\nWhich gap is most blocking Meridian's AI plans?" },
      { role:"user", text:"The Epic freeze — we can't get clean historical claims data until after migration" },
      { role:"ai", text:"Understood. We work with pre-migration data for the denial model and build the integration path in parallel. 23 Genome cases used exactly this approach. Data gap locked." }
    ],
    "0.4": [
      { role:"ai", text:"Genome matching complete. 47 comparable health systems — IDNs with 15–50 hospitals, Epic-primary, active RCM transformation.\n\nKey patterns:\n• 71% achieved denial rate target within 14 months\n• 84% without a named executive sponsor stalled at implementation\n• F011 pattern active in 74% — vendor SLA never enforced\n\nMeridian matches F011. Ensemble has been above SLA for 6 consecutive quarters." },
      { role:"user", text:"That's exactly what's happening — Ensemble has been above SLA for 2 years" },
      { role:"ai", text:"F011 confirmed. The Ensemble contract has an unused penalty clause — invoking it changes the vendor dynamic immediately. Genome match locked: 47 comparable systems, F011 pattern primary." }
    ],
    "0.5": [
      { role:"ai", text:"Based on Phase 0 readiness, confirmed scope:\n\n1. RCM Denial Prevention — primary engagement, $94M addressable gap, Ensemble SLA enforcement as mechanism\n2. Epic AI Integration Path — secondary track, begins Month 4\n\nExecutive Sponsor: Dr. Sarah Chen, CMO. CTO Mark Rivera on Epic track.\n\nProceed to Phase 1 — Diagnose?" },
      { role:"user", text:"Yes — let's begin Phase 1" },
      { role:"ai", text:"Phase 0 complete. All readiness decisions locked and immutable from this point. Moving to Phase 1 — Diagnose." }
    ],
    "1.1": [
      { role:"ai", text:"Situation Intelligence complete. 7 issues. $224M total at risk.\n\nTop finding: Denial rate 18.2% vs 11.4% benchmark — $94M annual gap. Growing 3 consecutive quarters. Board not briefed on full exposure.\n\nF011 active — 74% failure rate without SLA enforcement.\nData confidence: 94%" },
      { role:"user", text:"The CMO doesn't know the full number is $94M" },
      { role:"ai", text:"$94M is now the immutable baseline. This is what the Phase 1 gate brief presents to Dr. Sarah Chen." }
    ],
    "1.2": [
      { role:"ai", text:"Contradiction finding:\n\nEnsemble contracted at $48M/yr with 12% denial rate SLA. Actual: 18.2%. SLA breached 8 consecutive quarters. Penalty clause — 15% fee reduction if denied rate exceeds SLA by 3pp+ for 2+ quarters — has never been invoked.\n\nPotential recovery from SLA enforcement alone: $7.2M annually." },
      { role:"user", text:"Legal needs to review but this looks actionable" },
      { role:"ai", text:"SLA enforcement is the fastest lever — $7.2M with no new technology required. Legal review flagged. Goes into business case as immediate action item." }
    ],
    "1.3": [
      { role:"ai", text:"Data Intelligence: 50+ files loaded across financials, technology, contracts, and operational data.\n\nPrimary gap: Payer Contract Analysis — breakdown of denial reasons by payer and contract type. Without this, the recovery model has a ±$12M variance.\n\nSecondary gap: CDO Profile — needed to confirm F011 executive sponsor risk." },
      { role:"user", text:"I can get the payer analysis — CDO is still vacant so org chart won't help" },
      { role:"ai", text:"CDO vacancy is itself the F011 signal — it confirms the pattern. Requesting payer contract analysis upload. Data gap locked." }
    ],
    "1.4": [
      { role:"ai", text:"Phase 1 gate brief prepared for Dr. Sarah Chen, CMO:\n\n• Root cause: Ensemble SLA breach, 8 quarters unaddressed\n• Financial exposure: $94M annually, 94% confidence\n• Immediate action: SLA enforcement — $7.2M, no new technology\n• Phase 2: Prescribe intervention sequence and business case" },
      { role:"user", text:"CMO approved — she's ready to move to prescription" },
      { role:"ai", text:"Phase 1 gate approved. Dr. Sarah Chen, CMO — confirmed. Moving to Phase 2 — Prescribe." }
    ],
    "2.1": [
      { role:"ai", text:"Technology Intelligence: 312 applications. 42% redundant or low-utilisation.\n\nEpic: Go-live Q3 2026. AI integration window: Months 1–8. Post go-live retrofitting adds 18 months and 40% cost.\n\nShadow IT: $38M in untracked SaaS — 23 tools overlapping Epic functionality." },
      { role:"user", text:"$38M is more than we thought" },
      { role:"ai", text:"Technology locked. Epic constraint and $38M shadow IT rationalisation in the prescription." }
    ],
    "2.2": [
      { role:"ai", text:"Vendor Intelligence — Ensemble: 47 Genome engagements.\n\n• 71% that invoked SLA penalties saw denial improvement within 90 days\n• Ensemble has capacity to deploy more FTEs under contract pressure\n• Recommendation: Invoke penalty clause + revised SLA to 12% by Month 6\n\nAlternative analysis: Ensemble retention with revised terms is the optimal path." },
      { role:"user", text:"Retain Ensemble — but we need the revised SLA in writing before Month 2" },
      { role:"ai", text:"Ensemble retained with revised SLA. Month 2 deadline for signed terms. Penalty clause invocation is Step 1 of execution." }
    ],
    "2.3": [
      { role:"ai", text:"Architecture for Meridian:\n\n1. Denial prediction model — train on 3 years pre-Epic claims, deploy pre-go-live\n2. Prior auth automation — integrate with Epic's module at go-live\n3. Real-time denial dashboard — feeds CMO board reporting from Month 1\n\nBuild: Months 1–8 · Cost: $2.4M · ROI: $28–94M annually" },
      { role:"user", text:"This aligns with what CTO wants — we just needed the sequencing" },
      { role:"ai", text:"Architecture locked. Denial model first, prior auth at go-live, dashboard from Month 1." }
    ],
    "2.4": [
      { role:"ai", text:"Business Case:\n\nInvestment: $3.2M (AbarVa fee + build)\nRecovery: $28–94M annually\nROI: 5.7x on verified savings baseline\nBaseline: locked Day 0 — immutable, CXO-verified\nAudit: KPMG at Month 3, 6, 12" },
      { role:"user", text:"CFO approved — she liked the KPMG verification structure" },
      { role:"ai", text:"Business case locked. CFO approved. Day 0 baseline immutable. Moving to Phase 3 — Value Realization." }
    ],
    "3.1": [
      { role:"ai", text:"Month 1 delivery:\n\nEnsemble deployed 12 FTE dedicated team (up from 4). SLA invocation acknowledged, 12% target accepted by Month 6.\n\nDenial model: training pipeline live, 84% accuracy on holdout set.\n\nEpic integration: architecture review with Mark Rivera complete. Build starting Month 2." },
      { role:"user", text:"Good progress — Ensemble responded faster than expected" },
      { role:"ai", text:"AI Delivery status locked. Ensemble mobilised. Model in training. Epic integration on track." }
    ],
    "3.2": [
      { role:"ai", text:"Month 3 Actuals:\n\nDenial rate: 16.1% — down from 18.2% baseline. 2.1pp improvement.\nAnnualised: $12.8M recovered margin.\n\nAhead of Wave 1 target (below 17%). Ensemble SLA invocation changed the dynamic.\n\nTrajectory: On track for $94M by Month 14." },
      { role:"user", text:"CFO wants to know if the improvement is structural or a one-month anomaly" },
      { role:"ai", text:"Three data points confirm structural: (1) Ensemble has contractually committed FTEs. (2) Denial model catching 73% of predictable denials pre-submission. (3) Prior auth coverage up 23%→31%. This is not a spike." }
    ],
    "3.3": [
      { role:"ai", text:"Outcome Intelligence — Month 3:\n\n$22.4M verified savings.\nAudit: KPMG Month 3. Methodology: actuals vs Day 0 immutable baseline.\n\nFee: 15% of $22.4M = $3.36M. Invoice MER-FEE-001 ready." },
      { role:"user", text:"Board presentation is next week — this gives them exactly what they need" },
      { role:"ai", text:"$22.4M verified. KPMG audit complete. Board pack generated. AbarVa fee: $3.36M on Invoice MER-FEE-001." }
    ],
    "4.1": [
      { role:"ai", text:"Fee Calculation:\n\nVerified: $22.4M (KPMG audited)\nFee: 15% = $3.36M\nROI: 5.7x\nInvoice: MER-FEE-001" },
      { role:"user", text:"Invoice received — CFO approved payment" },
      { role:"ai", text:"MER-FEE-001 settled. First verification cycle complete." }
    ],
    "4.2": [
      { role:"ai", text:"Engagement Complete — Meridian Health System:\n\n$22.4M verified · KPMG audited\n5.7x ROI · 18 steps complete\nDenial: 18.2% → 16.1% (trajectory: 12% by M6)\nEpic AI integration: on track Q3 2026\n\nBoard Pack delivered. All numbers traceable to Day 0 baseline.\n\nGenome: 3 new patterns added. Every future health system client benefits." },
      { role:"user", text:"Board loved it — CEO wants to expand to the Epic integration track" },
      { role:"ai", text:"Engagement complete. Renewal confirmed. Meridian is a Phase 2 client. The Genome compounds." }
    ]
  }
};

const ARCTURUS_SEED = {
  phaseStatuses: { "0":"complete","1":"complete","2":"complete","3":"complete","4":"complete" },
  stepStatuses: {
    "0.1":"complete","0.2":"complete","0.3":"complete","0.4":"complete","0.5":"complete",
    "1.1":"complete","1.2":"complete","1.3":"complete","1.4":"complete",
    "2.1":"complete","2.2":"complete","2.3":"complete","2.4":"complete",
    "3.1":"complete","3.2":"complete","3.3":"complete",
    "4.1":"complete","4.2":"complete"
  },
  activeStep: "4.2",
  outcomes: [
    { stepId:"0.1", label:"Priority Signal", value:"C/I ratio 71% vs 58% peer — $840M efficiency gap, no named programme owner" },
    { stepId:"0.2", label:"AI Aspiration", value:"Cost-to-income reduction — board target 63% within 3 years" },
    { stepId:"0.3", label:"Data Readiness", value:"68/100 — $94M AI committed, zero initiatives have a documented outcome baseline" },
    { stepId:"0.4", label:"Genome Match", value:"31 comparable asset managers — F007 CDO vacancy pattern active, 79% failure rate" },
    { stepId:"0.5", label:"Confirmed Scope", value:"Cost-to-income optimisation + AI portfolio accountability across 28 initiatives" },
    { stepId:"1.1", label:"Situation Finding", value:"$840M efficiency gap — C/I 71% vs 58% peer, each 1pp = $64.6M annual savings" },
    { stepId:"1.2", label:"Contradiction", value:"Bloomberg SLA credits: $1.4M unclaimed across 18 months of documented interruptions" },
    { stepId:"1.3", label:"Data Gap", value:"CDO vacant 11 months — no owner for AI portfolio or data governance" },
    { stepId:"1.4", label:"Diagnose Complete", value:"Phase 1 gate approved by Victoria Hargreaves, CEO" },
    { stepId:"2.1", label:"Tech Stack", value:"240 apps — 4 BI tools with overlap. Bloomberg $8.4M/yr vs $5.1M peer benchmark." },
    { stepId:"2.2", label:"Vendor Decision", value:"Bloomberg 3-year renewal at $5.1M/yr — $3.3M annual saving locked" },
    { stepId:"2.3", label:"Architecture", value:"Snowflake unified data platform — existing licence, $0.4M build, live Month 3" },
    { stepId:"2.4", label:"Business Case", value:"$38.6M Year 1 minimum · $60–120M at full C/I improvement · CFO approved" },
    { stepId:"3.1", label:"AI Delivery", value:"Bloomberg SLA credits settled $1.4M · 4/6 initiatives terminated · CDO appointed Month 2" },
    { stepId:"3.2", label:"Month 3 Actuals", value:"C/I 69.4% — down 1.6pp from 71%. $13.4M annualised improvement." },
    { stepId:"3.3", label:"Outcome Verified", value:"$18.2M verified · Third-party audit complete · ARC-FEE-001 at $2.73M" },
    { stepId:"4.1", label:"Fee Triggered", value:"$2.73M AbarVa fee · Invoice ARC-FEE-001 · 6.7x ROI on AbarVa investment" },
    { stepId:"4.2", label:"Engagement Complete", value:"C/I 71%→69.4% trajectory to 63%. $18.2M verified. CEO approved Phase 2: core banking." }
  ],
  messagesByStep: {
    "0.1": [
      { role:"ai", text:"I've reviewed Arcturus Financial Group's data. Three board-level signals:\n\n• C/I ratio 71% vs 58% peer median — $840M efficiency gap, no transformation programme with a named owner\n• $94M committed to AI across 28 initiatives — zero with a documented outcome baseline\n• CDO vacant 11 months — F007 pattern active, 79% of programmes without a CDO fail to scale" },
      { role:"user", text:"The C/I ratio — board set 63% as a hard target and we're moving the wrong direction" },
      { role:"ai", text:"C/I is the mandate. 71% to 63% at Arcturus's scale = $60–120M in annual savings.\n\nPriority signal locked: C/I ratio — $840M gap, no named programme owner." }
    ],
    "0.2": [
      { role:"ai", text:"Three AI paths for C/I reduction:\n\nPath A — AI Portfolio Accountability: Baseline all 28 initiatives. Kill zero-ROI, accelerate high-potential. Releases $30–50M misallocated capital.\n\nPath B — Cost Rationalisation: Technology spend, vendor contracts, operational headcount.\n\nPath C — Revenue Uplift: AI for client acquisition in wealth management.\n\nWhat has the board aligned on?" },
      { role:"user", text:"Cost reduction first — revenue is medium-term, board wants C/I improvement this year" },
      { role:"ai", text:"Cost reduction with this-year urgency. AI Portfolio Accountability + cost rationalisation in parallel.\n\nAI Aspiration locked: Cost-to-income reduction — board target 63% within 3 years." }
    ],
    "0.3": [
      { role:"ai", text:"Arcturus data readiness: 68/100.\n\nGaps:\n• 28 AI initiatives — zero with a baseline cost or outcome metric\n• CDO vacant — no data governance owner\n• Technology spend: shadow IT not fully inventoried\n\nWhich gap most blocks the C/I programme?" },
      { role:"user", text:"The AI baseline — $94M spent and we can't tell the board what any of it is doing" },
      { role:"ai", text:"$94M with zero baselines is the accountability gap. Phase 1 baselines all 28 first. Data gap locked." }
    ],
    "0.4": [
      { role:"ai", text:"Genome match: 31 comparable asset managers.\n\n• F007 — CDO vacancy — active in 79% of failed programmes\n• Bloomberg renegotiation returned $2–5M to 68% of firms that attempted it\n• Average C/I improvement: 4–8pp over 18 months\n\nF007 is the programme risk. CDO appointment is the mitigation." },
      { role:"user", text:"We're recruiting CDO — should be appointed by Month 2" },
      { role:"ai", text:"Month 2 CDO mitigates F007. We structure Phase 2 to hand off at Month 2. Genome match locked." }
    ],
    "0.5": [
      { role:"ai", text:"Confirmed scope:\n\n1. AI Portfolio Accountability — baseline all 28, terminate zero-ROI\n2. Technology Cost Rationalisation — Bloomberg, BI consolidation\n3. C/I tracking infrastructure — Snowflake unified platform\n\nSponsor: Victoria Hargreaves, CEO.\n\nProceed to Phase 1?" },
      { role:"user", text:"Yes — proceed" },
      { role:"ai", text:"Phase 0 complete. Scope locked. Moving to Phase 1 — Diagnose." }
    ],
    "1.1": [
      { role:"ai", text:"Situation Intelligence — 8 issues, $840M efficiency gap.\n\nTop finding: C/I 71% vs 58% peer — 13pp gap. Each 1pp = $64.6M annual savings.\n\n$94M AI committed, $0 with a baseline. Data confidence: 89%." },
      { role:"user", text:"The $94M AI number — the board thinks it's an investment, not a cost" },
      { role:"ai", text:"$94M with zero return metrics is a balance sheet fiction. Phase 1 exposes this. Situation finding locked." }
    ],
    "1.2": [
      { role:"ai", text:"Contradiction: Bloomberg Terminal $8.4M/yr. Peer benchmark: $5.1M/yr. Over-payment: $3.3M/yr.\n\nBloomberg SLA credits: $1.4M unclaimed from 18 months of documented service interruptions." },
      { role:"user", text:"The SLA credits — we can claim those immediately" },
      { role:"ai", text:"Month 1 action — no negotiation, just documentation. $1.4M immediate. Contradiction locked." }
    ],
    "1.3": [
      { role:"ai", text:"28 initiatives:\n• 6: Zero ROI trajectory — $31M/yr, no output\n• 8: High potential — under-resourced\n• 14: Unclear without CDO\n\nTerminating the 6 releases $31M for high-potential programmes." },
      { role:"user", text:"Which 6 — we need to know before the board meeting" },
      { role:"ai", text:"Identified in Situation Brief — front-office automation pilots stuck at proof-of-concept. Brief ready for CEO. Data gap locked." }
    ],
    "1.4": [
      { role:"ai", text:"Phase 1 gate brief for Victoria Hargreaves, CEO:\n\n• Root cause: No AI portfolio governance, no baselines\n• Exposure: $840M C/I gap, $94M AI with zero ROI\n• Immediate: Bloomberg SLA credit ($1.4M), 6 terminations ($31M released)" },
      { role:"user", text:"CEO approved" },
      { role:"ai", text:"Phase 1 gate approved. Victoria Hargreaves, CEO — confirmed. Moving to Phase 2." }
    ],
    "2.1": [
      { role:"ai", text:"Technology: 240 applications. 4 BI tools with overlap — Tableau, Power BI, Qlik, proprietary.\n\nConsolidation: 2 tools retired, $2.9M/yr saving. Core banking 18 years old — future programme." },
      { role:"user", text:"Tableau and proprietary tool can go" },
      { role:"ai", text:"Technology locked. $2.9M/yr. Raj Malhotra CIO briefed." }
    ],
    "2.2": [
      { role:"ai", text:"Bloomberg: 31 Genome firms renegotiated. 68% achieved 15–30% reduction.\n\nRecommended: 3-year renewal at $5.1M (from $8.4M). Savings: $3.3M/yr." },
      { role:"user", text:"CFO leads the negotiation — when should she go in?" },
      { role:"ai", text:"Month 2 — after SLA credits claimed. Shows you know the contract. Vendor locked." }
    ],
    "2.3": [
      { role:"ai", text:"Architecture: Snowflake (existing licence) + Bloomberg feed. Build: 3 months, $0.4M.\n\nOutputs: Cost by business line, AI ROI tracking, vendor benchmarks — all in one place." },
      { role:"user", text:"We already have Snowflake — straightforward" },
      { role:"ai", text:"Architecture locked. $0.4M build. Raj Malhotra's team leads from Month 2." }
    ],
    "2.4": [
      { role:"ai", text:"Business Case:\nYear 1: $38.6M minimum\n• Bloomberg credits: $1.4M (M1)\n• Terminations: $31M (M2)\n• Bloomberg renegotiation: $3.3M/yr\n• BI consolidation: $2.9M/yr\n\nFull: $60–120M at 63% C/I target" },
      { role:"user", text:"CFO approved" },
      { role:"ai", text:"Business case locked. Day 0 baseline immutable. Moving to Phase 3." }
    ],
    "3.1": [
      { role:"ai", text:"Month 1:\n• Bloomberg SLA credits: $1.4M claimed and received\n• 4/6 initiative terminations complete\n• CDO on track for Month 2\n• Snowflake build starting" },
      { role:"user", text:"Bloomberg paid in 18 days" },
      { role:"ai", text:"Fastest Bloomberg resolution in 31 Genome cases. Contract pressure works." }
    ],
    "3.2": [
      { role:"ai", text:"Month 3: C/I 69.4% — down 1.6pp. $13.4M annualised.\n\nAll 6 terminations complete. CDO appointed. Snowflake live. Bloomberg complete.\n\nTrajectory: 63% C/I by Month 36." },
      { role:"user", text:"Board reviewed — satisfied with trajectory" },
      { role:"ai", text:"$31M rationalisation is the headline — accountability changes behaviour." }
    ],
    "3.3": [
      { role:"ai", text:"Outcome verification — Month 3:\n\n$18.2M verified:\n• Bloomberg credits: $1.4M\n• Terminations: $13.8M\n• Bloomberg renegotiation: $0.8M\n• BI consolidation: $0.6M\n• C/I improvement: $1.6M\n\nThird-party audit complete. Fee: 15% × $18.2M = $2.73M. ARC-FEE-001 ready." },
      { role:"user", text:"Victoria approved — best consulting spend in 10 years" },
      { role:"ai", text:"$18.2M verified. ARC-FEE-001 ready." }
    ],
    "4.1": [
      { role:"ai", text:"Fee: $2.73M on $18.2M verified. ROI: 6.7x. Invoice ARC-FEE-001." },
      { role:"user", text:"Approved and paid" },
      { role:"ai", text:"ARC-FEE-001 settled." }
    ],
    "4.2": [
      { role:"ai", text:"Engagement Complete — Arcturus Financial Group:\n\n$18.2M verified · 6.7x ROI\nC/I 71%→69.4% trajectory to 63%\nCDO appointed · 6 initiatives terminated · $31M reallocated\nSnowflake live · Bloomberg renegotiated\n\nGenome: 4 new patterns added.\n\nCEO requested Phase 2: core banking modernisation." },
      { role:"user", text:"Phase 2 confirmed" },
      { role:"ai", text:"Phase 2 confirmed. Arcturus is a Phase 2 client. Engagement complete." }
    ]
  }
};

// ── SEED BOTH CLIENTS ──
localStorage.removeItem('abarva_avr_v2_meridian');
localStorage.removeItem('abarva_avr_v2_arcturus');
localStorage.setItem('abarva_avr_v2_meridian', JSON.stringify(MERIDIAN_SEED));
localStorage.setItem('abarva_avr_v2_arcturus', JSON.stringify(ARCTURUS_SEED));

console.log('✅ Meridian seeded:', JSON.parse(localStorage.getItem('abarva_avr_v2_meridian')).stepStatuses['4.2']);
console.log('✅ Arcturus seeded:', JSON.parse(localStorage.getItem('abarva_avr_v2_arcturus')).stepStatuses['4.2']);
console.log('Both clients ready. Navigate to /ai-strategy?client=meridian or ?client=arcturus');

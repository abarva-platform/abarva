export interface DemoWorkstreamMessage {
  role: 'admin' | 'maestro_ai'
  actor_name: string
  content: string
}

export interface DemoWorkstream {
  name: string
  messages: DemoWorkstreamMessage[]
}

export interface PartialDemoPhase {
  phase_number: number
  status: 'in_progress' | 'locked'
  workstreams: DemoWorkstream[]
  output?: undefined
  findings?: Array<{
    title: string
    description: string
    severity: 'critical' | 'high' | 'medium' | 'positive'
    source_files: string[]
    genome_pattern: string | null
  }>
  genome_matches?: Array<{
    code: string
    name: string
    failure_rate: number
    confidence: 'confirmed' | 'probable' | 'possible'
    evidence: string
    source_files: string[]
  }>
}

export interface PartialDemoEngagement {
  engagement_name: string
  engagement_status: 'active'
  current_phase: 1
  phases: PartialDemoPhase[]
}

export const MERIDIAN_TECH_PARTIAL_DEMO: PartialDemoEngagement = {
  engagement_name: 'Meridian Health System × Tech',
  engagement_status: 'active',
  current_phase: 1,
  phases: [
    // ─── PHASE 1: Technology & AI Diagnosis — IN PROGRESS ────────────────────
    {
      phase_number: 1,
      status: 'in_progress',
      workstreams: [
        {
          name: 'Technology Diagnosis',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Opening with the anchor finding from MER-T03. Meridian licenses **22 Epic modules**. The Genome has scored your Epic utilisation at **58/100** — meaning 18 of 22 modules are underutilised against contracted capability. The unrealised value embedded in those 18 modules is **$36.5M per year** at current contract cost and peer utilisation benchmarks. That figure is not the cost of Epic — it's the cost of paying for a capability and not using it. The capability is there. Change management and activation are the gaps, not the platform.\n\nThe most acute item in the utilisation picture: the prior auth module is **23% deployed**. The CMS mandate requiring electronic prior authorisation for Medicare Advantage goes live **January 2027 — 14 months from today**. At the current deployment rate, Meridian will not meet the mandate. That is not a projection; it's arithmetic. Genome pattern **F008 (implementation stall post-procurement)** is confirmed at 79% confidence based on the prior auth deployment trajectory.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Walk me through the top 5 modules by unrealised value.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Top 5 Epic modules by unrealised value, with deployment status and dollar attribution:\n\n**1. Prior Authorisation (Epic Payer Platform) — $12.4M unrealised**\nDeployed: 23% (MER-T03). CMS mandate: January 2027. Engineering work: 60% complete. The $12.4M unrealised value represents the combination of manual prior auth labour cost that automation would eliminate ($7.2M/yr at current staffing) and denial prevention value ($5.2M/yr based on Meridian's 18% prior auth denial rate vs 6% Genome benchmark for fully deployed systems). This is the single highest-value and highest-urgency module in the portfolio.\n\n**2. MyChart Patient Engagement — $8.7M unrealised**\nDeployed: 34% patient adoption (MER-T03). Benchmark for comparable IDNs: 61% adoption. The gap is not technical — MyChart is fully configured. It's activation: 64% of Meridian patients who have had a MyChart account created have never logged in. The $8.7M represents avoided readmission value from engagement features that benchmarks confirm are used at 61% adoption IDNs.\n\n**3. Clinical Documentation (Epic EpicCare) — $6.9M unrealised**\nDeployed: 41% of clinicians trained and actively using structured documentation (MER-T03). The remaining 59% are still using unstructured narrative notes, which creates downstream data quality problems for AI initiatives AI-04 and AI-07. The $6.9M is a blended cost of documentation labour time, coding accuracy drag, and downstream AI model quality penalty.\n\n**4. Population Health Management (Healthy Planet) — $5.8M unrealised**\nDeployed: 29% feature utilisation. The module was activated 2 years ago; care coordination teams were trained once and have not had refresher training since. Registry automation — the feature with the highest value — is configured but not in use for 6 of 9 condition registries.\n\n**5. Revenue Cycle Optimisation (Epic Resolute) — $2.7M unrealised**\nDeployed: 67% feature utilisation. The gap is in automated denial management — a feature set that requires a configuration decision (self-hosted rules engine vs Epic-managed) that has not been made. The $2.7M is within reach in 60 days if the configuration decision is made.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Prior auth — what's the actual technical blocker?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "There is no technical blocker. The engineering work is **60% complete** and has been for 11 months.\n\nHere is the exact picture from MER-P04: the Epic prior auth module was scoped for full deployment across all 12 payers in Meridian's network. The engineering team completed the Epic Payer Platform configuration for the top 3 payers (BCBS, United, Aetna) — these three account for 71% of Meridian's prior auth volume. The remaining 9 payers require a different integration pattern (non-standard FHIR implementation) that the engineering team estimated at an additional 14 weeks of work.\n\nOn Day 1 of the remaining development, the engineering team submitted a decision memo to the CDO recommending a **top-3 payer first** approach: deploy the completed 60% now (covering 71% of volume), meet the CMS mandate for the bulk of prior auth transactions, and complete the remaining 9 payers in a second phase. The CMS mandate does not require 100% payer coverage on day one — it requires deployment for Medicare Advantage, which BCBS, United, and Aetna collectively represent.\n\nThat decision memo was submitted **11 months ago**. The CDO seat was vacant. The CIO deferred to a committee. The committee has not reached a decision. The engineering team is waiting. The 60% complete work is sitting idle.\n\nThis is **Genome pattern F002 (no named executive sponsor)** at 84% confidence. Not a technical failure. A governance failure.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "Cerner migration risk — 2 hospitals, 14 years of data.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Cerner migration risk is the most consequential open item in the technology diagnosis — and it is the item with the least preparation. Two Meridian hospitals (St. Augustin Medical Center and Riverside Community) are still running Cerner Millennium. The planned Epic migration is scheduled for **Q4 2026** — 9 months from now.\n\nHere is what has been completed toward that migration: network infrastructure upgrades (complete), Epic training curriculum designed (complete). Here is what has not been started: **data migration planning**. The 14-year Cerner patient record archive at the two hospitals has not been scoped for migration. The patient record count is unknown — MER-T03 notes 'patient record volume to be confirmed' in the migration planning section, which was last updated 8 months ago. The data migration vendor has not been selected. The Epic go-live date has not been adjusted since it was set 18 months ago.\n\nGenome flags this as **F003 (underestimated data migration complexity) at 68% confidence** — probable, not confirmed, because the full record scope is unknown. The F003 pattern has a 71% historical failure rate for migrations with this profile: 14+ years of source data, no migration planning start at T-9 months, patient record count unconfirmed.\n\nThe reference case that elevates this to probable: the **2016 legacy data migration**, a financial services context but with a structurally identical pattern — multi-year source system archive, no migration planning at T-9, confident go-live date. the reference migration ran 8 months over schedule and cost 2.3x the original estimate. The healthcare equivalent — a failed Epic migration — carries patient safety implications that make the cost of failure substantially higher than the financial overrun.",
            },
          ],
        },
        {
          name: 'AI Readiness',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "AI readiness opening: Meridian has **$22M committed to AI initiatives** across 11 programmes. AI in production: **zero**. This is not an engineering failure — it is a governance failure with a specific, identifiable cause. The Genome has scored Meridian's AI readiness at **F002 confirmed at 81% confidence**: no named executive sponsor. The CDO seat has been vacant for **14 months**. In the absence of a CDO, every AI initiative above the CIO's unilateral threshold requires committee consensus. Committee consensus requires the CIO, CFO, and CMO to agree. In 14 months, that consensus has not been achieved for a single AI initiative deployment decision. The 11 AI initiatives are not stalled because they are not ready. They are stalled because there is no one authorised to say 'deploy.'",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'AI-04 (prior auth) — what specifically is blocking it?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "AI-04 (Prior Auth Decision Support) is the clearest case in the portfolio, and it makes the governance failure impossible to explain away as a technical constraint.\n\nThe engineering status: **United and Aetna integrations are already built, tested, and validated** (MER-P03). BCBS configuration is the only remaining item — estimated at 3 weeks of engineering work. The AI model itself was trained and validated 14 months ago on 3 years of Meridian prior auth decisions. Model accuracy: 91% on the validation set. The clinical informatics team has reviewed and approved the model. Compliance has reviewed and approved the deployment framework.\n\nThe blocker: a single scope decision. The decision memo submitted 11 months ago asked one question: **top-3 payers first, or all-12 simultaneously?** Engineering recommended top-3. The clinical team concurred. Compliance has no objection to either approach. The CDO seat was vacant. The CIO deferred to a committee that includes the CFO (who wants to understand the ROI of each approach before deciding) and the CMO (who wants clinical workflow sign-off on the BCBS-specific implementation).\n\n11 months later: the CFO has not asked for an ROI analysis. The CMO's workflow sign-off is the same workflow already signed off for United and Aetna. The committee has not met specifically to resolve this item in the last 6 months.\n\nThis is the textbook F002 pattern. The work is done. One scope decision unblocks it. That decision requires a CDO to make.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'If we appoint the CDO tomorrow, when is AI-04 in production?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "**58 days** from CDO appointment to AI-04 in production. Here is the day-by-day plan:\n\nDay 1: CDO reviews the 11-month-old decision memo and the MER-P03 engineering status report. Decision made: top-3 payer approach. BCBS configuration begins.\n\nDays 1-21: BCBS configuration (3 weeks as estimated by engineering). BCBS uses a standard FHIR R4 API — this is not a novel integration. The engineering team has done this twice already for United and Aetna.\n\nDays 21-35: Workflow integration for BCBS-specific prior auth cases. Clinical informatics team leads with CMO sign-off. This is the step the CMO wanted workflow review for — it takes 2 weeks, not 11 months.\n\nDays 35-42: Testing. End-to-end integration test with BCBS test environment. One week.\n\nDay 43-58: Staged rollout. Production on Day 43 for the 3 highest-volume prior auth clinical units. Full production on Day 58.\n\nUnited and Aetna activate immediately when the CDO makes the scope decision — their integrations are already in the production environment, waiting for the go signal.\n\n**58 days.** That is the fastest first-production path in the Genome for a health system with Meridian's profile — an IDN with $11B+ revenue, 14+ months CDO vacancy, and a prior auth programme that is 60% complete. The Genome has 9 comparable cases. None reached production faster than 58 days once governance was unblocked. Several took 4-6 months because the engineering work wasn't as far along as Meridian's is.",
            },
          ],
        },
        {
          name: 'Delivery Velocity',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Your delivery velocity data tells a specific story. The prior auth programme (AI-04) moved from approved spec to 60% complete in **6 months** — that is normal velocity. Then it stalled for **18 months** waiting for a single scope decision. Cycle time: 24 months and counting, 60% complete.\n\nAcross your other AI initiatives: the pattern repeats. AI-07 (ambient documentation) vendor contracted, physicians trained, Epic integration complete — stalled 9 months at rollout decision. AI-02 (clinical documentation improvement) — model built, validated, no infrastructure to deploy to.\n\nThis is not an engineering velocity problem. Your engineers are building. The stall is always at the same point: a governance decision that requires a CDO to make.\n\nBefore we map the full delivery velocity picture: how does your CIO account for the 18-month prior auth stall? Is the explanation technical — or governance?",
            },
          ],
        },
      ],
      findings: [
        {
          title: 'Epic optimisation score 58/100 — $36.5M unrealised value',
          description:
            'Meridian licenses 22 Epic modules. 18 are underutilised. The capability is paid for — change management and activation are the gaps. Prior auth module (critical for CMS January 2027 mandate) is 23% deployed.',
          severity: 'critical',
          source_files: ['MER-T03', 'MER-P04'],
          genome_pattern: 'F008',
        },
      ],
      genome_matches: [
        {
          code: 'F002',
          name: 'No named executive sponsor',
          failure_rate: 0.84,
          confidence: 'confirmed',
          evidence:
            'CDO vacant 14 months. Prior auth scope decision pending 11 months without resolution. AI-04 engineering work 60% complete — stalled at governance gap, not technical barrier.',
          source_files: ['MER-P03', 'MER-C02'],
        },
      ],
    },

    // ─── PHASES 2, 3, 4 — LOCKED ─────────────────────────────────────────────
    {
      phase_number: 2,
      status: 'locked',
      workstreams: [],
    },
    {
      phase_number: 3,
      status: 'locked',
      workstreams: [],
    },
    {
      phase_number: 4,
      status: 'locked',
      workstreams: [],
    },
  ],
}

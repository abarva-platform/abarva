export interface DemoWorkstreamMessage {
  role: 'admin' | 'maestro_ai'
  actor_name: string
  content: string
}

export interface DemoWorkstream {
  name: string
  messages: DemoWorkstreamMessage[]
}

export interface DemoPhase {
  phase_number: number
  status: 'approved' | 'complete' | 'in_progress'
  workstreams: DemoWorkstream[]
  output: {
    output_type: string
    title: string
    content: any
    status: 'approved' | 'published'
  }
}

export interface DemoEngagement {
  engagement_name: string
  phases: DemoPhase[]
}

export const MERIDIAN_TECH_DEMO: DemoEngagement = {
  engagement_name:
    'Meridian Health System × Technology Modernization — Completed Demo',
  phases: [
    // ─── PHASE 1: Technology Diagnosis ───────────────────────────────────────
    {
      phase_number: 1,
      status: 'approved',
      workstreams: [
        {
          name: 'Failure Pattern Analysis',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'No prior Cerner → Epic migration failures — but prior auth integration has been stalled **18 months**. That\'s the canary. The prior auth stall is **F002** at **84% failure rate**: no named accountable owner, CDO vacant, no one to make the call when payer integrations hit complexity. The CMS mandate is **14 months away**. The same governance gap that stalled prior auth for 18 months will stall the Cerner migration unless addressed first.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The prior auth stall — what actually happened?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                "Tracing the stall. The prior auth integration was **60% complete** when the previous CDO left (**18 months ago**). The work required a decision: expand scope to all 12 payers simultaneously, or complete the top 3 payers first and phase the remainder. No one made the decision — CDO seat vacant, CIO deferred, payer integration team stalled waiting for direction. That's **F002**: not a technical failure, a governance failure. The integration work is technically straightforward — the team knows what to do. They need a decision-maker.",
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Can we complete the prior auth integration before CDO is hired?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Yes — for the top 3 payers, this is a **60-day sprint**. Decision needed now: scope to top 3 payers (United, Aetna, BCBS), not all 12. The CDO doesn\'t need to make this decision — the CIO can. The CMS mandate compliance path for January 2027 is: top 3 payers by **Day 60**, next 5 payers by **Month 6**, final integration (all payers) by **Month 10**. That gives a **3-month buffer** before the mandate. Is the CIO authorized to make the scope decision?',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'CIO authorized. Approve top 3 payers first.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Decision logged. Prior auth integration scope: **United HealthCare, Aetna, BCBS — Days 1–60**. Integration team notified. This unblocks the 18-month stall in the first week. The broader lesson for the Cerner migration: every decision bottleneck needs a named owner before the programme begins. The CDO hire is still critical — but the prior auth sprint shows what\'s possible when governance unblocks.',
            },
          ],
        },
        {
          name: 'System Assessment',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three systems requiring decisions: **Epic** (optimize vs replace), **Cerner 2 hospitals** (migrate vs extend), **Ensemble Health Partners** (renew vs exit). Epic: optimize scores **86/100** — **$36.5M** unrealized value already licensed. The recommendation is activation, not replacement. Cerner: migrate scores **74/100**, extend scores **28/100** (CMS mandate makes long-term Cerner untenable). Ensemble: exit scores **68/100** (18% KT, contract ending 2026 is an opportunity).',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Why is Epic optimization scoring so high?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three reasons. First: the capability is already licensed — **$36.5M** of value is paid for. Second: Epic has a **62% KT score** (much better than Ensemble or Wipro) — the internal Epic team can govern the modules without vendor dependency once properly trained. Third: prior auth module activation for the CMS mandate is achievable in **90 days** — not a new implementation, just activation of an existing licensed module. The choice between Epic optimization and replacement is not a technology question; it\'s a change management question (**F008**). The technology is fine.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'What about the modules that are genuinely underutilized vs just not trained?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Good distinction. Of the **18 underutilized modules**, **12 require change management only** (training + workflow enablement). **4 require configuration work** plus change management. **2 are genuinely low-value** for Meridian\'s use case (the Lab Genomics module and the Research module — not relevant to a community health system). Those 2 can be deactivated from the licence renewal to reduce cost. The 12 that need change management only are the ones with the highest ROI — they\'re already built, already paid for, just not being used.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Cerner migration — the data migration is the risk.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Correct. **14 years of patient history** at 2 hospitals. **F003 at 68%** is the warning. The 2016 Accenture-led legacy data migration failed because they underestimated data migration complexity — same pattern. For Meridian, the unknowns are: (1) How many of the 14 years of Cerner records are in proprietary format vs standard HL7? (2) What is the patient record count (affects timeline)? (3) Are there any Cerner-specific customisations that don\'t map to Epic? These questions must be answered before the migration begins. The Cerner data dictionary commission is the first action in Phase 3 — before any migration scoping.',
            },
          ],
        },
        {
          name: 'Data Migration Risk',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Cerner data migration risk is the **highest-priority risk** in this programme. **14 years of patient history**, Q4 2026 target, data migration planning **not started**. **F003 at 68%**. For a health system, a failed migration has patient safety implications, not just project risk. Three questions that must be answered in the next **30 days**: (1) What is the patient record count? (2) What percentage of Cerner records are in HL7 vs proprietary format? (3) What are the Cerner contract data portability terms?',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "We don't know the patient record count yet.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'That needs to change immediately. The patient record count is the single most important number for migration planning. It drives the timeline, the team size, and the testing requirements. Without it, any migration plan is fiction. Action: commission Cerner data dictionary and patient record count audit — **4-week turnaround**. Cost: approximately **$80K** (internal team + 1 Cerner specialist contractor). This is non-optional — no migration plan can be approved without it.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Cerner contract — do we know the data portability terms?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'From the uploaded MER-C02 file: Cerner contract expires **December 2026**. Data portability clause exists — all patient data must be provided in **HL7 FHIR R4** format within 90 days of contract termination. This is standard and enforceable. The unknowns are: (1) whether the 14-year historical data is in a format Cerner can readily export in HL7 FHIR, and (2) whether there are custom Cerner extensions that don\'t have Epic equivalents. The data dictionary audit will answer both. Cerner data portability terms: confirmed standard. Recommend notifying Cerner of migration intent by **Month 6** — gives them 6 months to prepare the export (your contract requires 90-day notice).',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "What's the realistic migration timeline once we have the data dictionary?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'With the data dictionary in hand (Month 1–2): Phase 1 assessment **4 weeks**, migration plan **4 weeks**, Epic configuration **8 weeks** — total **16 weeks** to migration start. Active migration with parallel systems: **12 weeks**. Testing and cutover: **8 weeks**. Total: **40 weeks** from data dictionary to go-live. That means starting the dictionary now puts go-live at **Month 11** — within the Q4 2026 target. Any delay beyond Month 2 pushes the migration into Q1 2027, which conflicts with the CMS mandate period. The sequence is tight but achievable.',
            },
          ],
        },
      ],
      output: {
        output_type: 'situation_brief',
        title: 'Phase 1 Output — Situation Brief',
        status: 'approved',
        content: {
          executive_summary:
            'Meridian has $36.5M in Epic capability already paid for and unused. The CMS prior auth mandate is 14 months away and the integration has been stalled for 18 months by the same governance gap (F002) that will stall the Cerner migration unless addressed now. The prescription is: activate Epic prior auth module for top 3 payers in 60 days, commission Cerner data dictionary immediately, and appoint CDO before the Cerner migration programme begins. The technology risk is manageable; the governance risk is not.',
          systems_assessed: [
            {
              system: 'Epic EHR',
              verdict: 'optimize',
              recommendation:
                'Activate 12 underutilized modules. Prior auth activation for CMS mandate. MyChart adoption to 60%.',
              unrealized_value_m: 36.5,
              timeline: '12 months',
            },
            {
              system: 'Cerner (2 hospitals)',
              verdict: 'migrate_to_epic',
              recommendation:
                'Commission data dictionary immediately. Migration programme start Month 3. Go-live target Q4 2026.',
              risk: 'F003 — data migration complexity unknown until dictionary completed',
              timeline: '40 weeks from dictionary',
            },
            {
              system: 'Ensemble Health Partners',
              verdict: 'structured_exit',
              recommendation:
                'Contract ends 2026. 18% KT score. Plan structured KT programme before exit.',
              risk: '18% KT is critically low for revenue cycle',
            },
          ],
          failure_pattern_analysis: {
            prior_auth_stall:
              '18 months stalled — F002 governance failure. CDO vacancy the root cause. Unblocked by CIO scope decision Week 1.',
            f008_diagnosis:
              'Epic underutilization is pure change management. 41% training completion explains 58/100 optimization score.',
            cerner_migration_risk:
              'F003 probable — data migration planning not started. Patient record count unknown. Data dictionary is the critical first action.',
          },
          cms_mandate_path: {
            deadline: 'January 2027',
            top_3_payers_completion: 'Day 60',
            all_payers_completion: 'Month 10',
            buffer_months: 3,
            risk: 'LOW if top-3 scope decision approved now',
          },
          immediate_actions: [
            'Commission Cerner data dictionary and patient record count audit (Month 1, $80K, non-optional)',
            'Prior auth integration: United, Aetna, BCBS — Days 1-60 (CIO scope decision approved)',
            'Accelerate CDO hire — shortlist within 30 days',
            'Epic training programme: 41% → 80% completion target by Month 6',
          ],
        },
      },
    },

    // ─── PHASE 2: Technology Prescription ────────────────────────────────────
    {
      phase_number: 2,
      status: 'approved',
      workstreams: [
        {
          name: 'Options Scoring',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Full options scoring. Epic: Optimize scores **86/100**. The gap from **58/100** current to potential 80+: training (from 41% to 80% completion = **22 points**), prior auth activation (**8 points**), MyChart activation programme (**6 points**), 2 other module activations (**4 points**). This is not technology work — it\'s change management and activation.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'MyChart at 34% vs 60% target — what\'s driving the low adoption?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three root causes from the data. (1) **Patient onboarding**: MyChart invitation email goes to the email on file — **28% of patients have outdated email addresses**. Fix: front desk enrolment at check-in. (2) **Physician messaging**: **67% of Meridian physicians** have not activated MyChart messaging — patients can\'t use it if their doctor doesn\'t. Fix: physician activation campaign with CMO mandate. (3) **Mobile app**: MyChart app not promoted at any Meridian patient touchpoint. Fix: signage, discharge instructions, appointment reminders. These are all within Meridian\'s control and cost under **$200K**.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Ensemble Health Partners — 18% KT score. What\'s the actual risk?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Revenue cycle is the highest-risk vendor dependency in a health system. Ensemble manages prior auth, claims submission, and denial management for Meridian. **18% KT score** means if Ensemble exits (contract ends 2026), Meridian\'s revenue cycle operation has an 18% chance of running without significant disruption. The exposure: **$42M in annual collections** managed by Ensemble. A 6-month disruption would cost **$12–18M** in delayed or lost collections. The structured exit plan (KT programme over 12 months) reduces this risk — but it must begin now, not at contract expiry.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'What does a structured Ensemble exit look like?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**12-month structured exit**. Months 1–4: Ensemble documents every workflow — denial codes, appeal templates, payer contacts, exception handling. Meridian internal team (3 FTE hired) shadows every process. Months 5–8: parallel running — internal team leads, Ensemble advises. Months 9–12: Ensemble advisory only, internal team independent. Exit fee: likely **$800K** (contract exit clause from MER-C02). Cost of 3 internal FTE × 12 months: **$720K**. Total exit cost: **$1.52M**. vs staying with Ensemble at **$14.2M/yr** with 18% KT risk. The business case is unambiguous.',
            },
          ],
        },
        {
          name: 'Vendor Selection',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Vendor selection for two programmes: (1) Cerner migration SI, (2) Epic optimization partner. For Cerner migration: this is a specialised programme — only a subset of SIs have direct Cerner-to-Epic migration experience. Genome scores three: **Tegria** (68/100 — 4 comparable migrations, 3 on time), **Nordic Global** (74/100 — 6 migrations, 5 on time, 1 data quality issue), **Optimum Healthcare IT** (61/100 — 3 migrations, all on time but smaller scale).',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'We have an existing relationship with Nordic Global.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Nordic Global is the right choice given the relationship and the Genome score. Their 6-migration track record is the strongest. One flag from the data: their Month 4 data quality issue on the 2022 Ascension migration was caused by an underestimated proprietary Cerner extension — **directly relevant to your situation**. The mitigation: require Nordic to conduct the Cerner data dictionary audit themselves (rather than delegating to Cerner), so they own the risk discovery. Does that work?',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Yes. Nordic Global as SI with data dictionary ownership. Good.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Nordic Global selected. Data dictionary ownership logged as a contract requirement — **Nordic bears the risk of undiscovered Cerner extensions**. For the Epic optimization programme: this doesn\'t need an SI. Epic\'s own advisory team (**Epic Implementation Services**) has the highest Genome score for module activations (**81/100** — they\'re the only party that has done every Epic module activation). Cost: **$180K** for 6-month advisory engagement covering prior auth, MyChart, and the 12 change-management modules. Combined programme: Nordic for Cerner migration, Epic advisory for optimization. Clean separation.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Ensemble exit — do we need SI support for the KT programme?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'No SI needed for Ensemble KT. The 3 internal FTE we\'re hiring will run it with Ensemble\'s cooperation (contractually required). The risk is Ensemble dragging their feet — their commercial incentive is to stay on contract. Mitigation: build the KT milestone schedule into the contract exit terms. Monthly documentation milestones, measured by Meridian. Ensemble misses 2 milestones → Meridian invokes liquidated damages. The contract clause is standard — legal can insert it.',
            },
          ],
        },
        {
          name: 'Business Case',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Health system tech modernisation business case has 3 value streams: (1) **CMS mandate compliance** (revenue protection, not a saving), (2) **Epic optimization value** (clinical efficiency + revenue cycle improvement), (3) **Ensemble exit** (cost reduction + risk elimination). Total addressable value: **$52–68M** over 3 years.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Break it down for the CFO.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Three value streams. (1) **CMS mandate compliance**: electronic prior auth reduces denial rate from **18.2%** (current, Ensemble) to benchmark **12%**. On $42M managed collections, that\'s **$2.5M/yr** recovered. Non-optional — failure to comply risks Medicare/Medicaid participation. (2) **Epic optimization**: MyChart 34%→60% saves **$1.2M/yr** (reduced call centre volume), prior auth activation saves **$1.8M/yr** (fewer manual prior auth staff hours), module activations reduce redundant system costs by **$3.1M/yr**. Total Epic: **$6.1M/yr by Year 2**. (3) **Ensemble exit**: $14.2M/yr → $8.4M/yr (internal team fully operational by Year 2). Saving: **$5.8M/yr**. Total combined: **$14.4M/yr by Year 3** + $2.5M/yr CMS mandate recovery.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: "What does AbarVa earn on that?",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'AbarVa fee on verified savings: **17.5%** of **$14.4M** = **$2.52M/yr** by Year 3. Fee triggers align with verified delivery — CMS mandate compliance verified at January 2027, Epic optimization savings verified at Month 12, Ensemble exit savings verified at Month 18. Total fee: **$5.8M** over 3 years at base case. CFO sees fee only after cash lands.',
            },
          ],
        },
      ],
      output: {
        output_type: 'solution_design',
        title: 'Phase 2 Output — Solution Design',
        status: 'approved',
        content: {
          programme_components: [
            {
              component: 'Epic Prior Auth Activation (CMS mandate)',
              approach: 'activate existing licensed module — top 3 payers first',
              timeline_days: 60,
              cost_m: 0.18,
              value_stream: 'CMS mandate compliance + $2.5M/yr denial reduction',
            },
            {
              component: 'Epic Module Optimization',
              approach:
                'change management + training (12 modules) + Epic advisory',
              timeline_months: 12,
              cost_m: 0.52,
              value_stream: '$6.1M/yr by Year 2',
            },
            {
              component: 'Cerner Migration (2 hospitals)',
              approach:
                'Nordic Global SI, data dictionary owned by Nordic, parallel systems',
              timeline_months_from_dictionary: 40,
              cost_m: 4.2,
              value_stream:
                'CMS mandate compliance, clinical consistency, $1.4M/yr Cerner licence savings',
            },
            {
              component: 'Ensemble Health Partners exit',
              approach:
                '12-month structured KT programme, 3 internal FTE, milestone-gated',
              timeline_months: 12,
              cost_m: 1.52,
              value_stream: '$5.8M/yr from Year 2',
            },
          ],
          vendor_selection: {
            cerner_migration_si:
              'Nordic Global — Genome score 74/100, data dictionary ownership required',
            epic_optimization: 'Epic Implementation Services — Genome score 81/100',
            ensemble_exit: 'Internal team (3 FTE) — no SI',
          },
          business_case: {
            year1_value_m: 3.2,
            year2_value_m: 9.8,
            year3_value_m: 14.4,
            cms_mandate_annual_recovery_m: 2.5,
            fee_total_3yr_m: 5.8,
            fee_pct: 0.175,
          },
        },
      },
    },

    // ─── PHASE 3: Execution Roadmap & Baseline ────────────────────────────────
    {
      phase_number: 3,
      status: 'complete',
      workstreams: [
        {
          name: 'Baseline Lock',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '5 baseline metrics. **Epic optimization score: 58/100** (source: MER-T03). **Prior auth denial rate: 18.2%** (source: Ensemble monthly report, MER-M01). **MyChart adoption: 34%** (source: Epic user analytics). **Annual vendor spend (Ensemble + Wipro): $19.8M**. **Cerner annual licence: $4.2M**. All five locked?',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'All five confirmed. Lock them.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Baseline locked. **Five metrics, Day 0**. Every month we measure actual vs baseline. Epic score improvement, denial rate reduction, MyChart adoption growth, vendor spend reduction, Cerner licence termination. Baseline document signed by CEO Dr. Maria Santos and CFO Michael Torres. CMS mandate compliance path: documented as mandatory track. No fee is earned on CMS compliance track — it\'s a regulatory obligation, not a saving. Fee on the value streams only.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'CDO hire status?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'CDO **Dr. Jennifer Kim** offered and accepted — **Day 34**. Background: former VP of Digital Health at a comparable US health system, 8 years of Epic implementation experience, directly managed a Cerner-to-Epic migration. She has the exact profile for this programme. Start date: **Day 45**. She has reviewed the Phase 0 and Phase 1 briefings. Her first action: the prior auth integration with United HealthCare (top 3 payer, Day 60 deadline — already in progress).',
            },
          ],
        },
        {
          name: 'Governance Model',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Governance for health tech modernisation requires **clinical and operational buy-in**, not just IT governance. Proposed structure: CDO chairs a **Technology Modernisation Council** (monthly) including CMO, CIO, CFO, and 2 physician champions. Cerner migration has a separate **Programme Board** (CDO, Nordic Global PM, Cerner account lead, Meridian Epic team lead).',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                "The CMO is skeptical of the Cerner migration — she's worried about clinical disruption.",
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'CMO skepticism is legitimate and important. Cerner → Epic migration is a **clinical change**, not just a technology change. The mitigation that works: (1) **Physician champions as co-owners** of the migration plan — 2 physicians from each Cerner hospital on the Programme Board. (2) **Clinical workflow validation sessions** before and during migration — every clinical workflow is mapped and signed off by the responsible physician before go-live. (3) **Super-user programme**: 1 clinical super-user per department trained before go-live. CMO\'s concern becomes CMO\'s influence — she designs the clinical governance, we provide the framework.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'CMO agreed with that framing. She wants to chair the clinical governance sub-group.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                '**CMO chairs clinical governance sub-group**. This is the right structure. CMO ownership of clinical governance reduces resistance and increases accountability — she becomes a programme champion rather than a sceptic. Adding CMO as co-chair of Technology Modernisation Council (alongside CDO). **Clinical sign-off gate** added to Cerner migration programme: no go-live without CMO approval. Governance model complete.',
            },
          ],
        },
      ],
      output: {
        output_type: 'execution_roadmap',
        title: 'Phase 3 Output — Execution Roadmap',
        status: 'approved',
        content: {
          baseline_metrics: [
            {
              metric: 'Epic optimization score',
              baseline: '58/100',
              source: 'MER-T03',
              target_month12: '78/100',
            },
            {
              metric: 'Prior auth denial rate',
              baseline: '18.2%',
              source: 'MER-M01',
              target_month12: '12.5%',
            },
            {
              metric: 'MyChart adoption',
              baseline: '34%',
              source: 'Epic analytics',
              target_month12: '60%',
            },
            {
              metric: 'Annual vendor spend (Ensemble + Wipro)',
              baseline_m: 19.8,
              source: 'MER-C02',
              target_month18_m: 9.4,
            },
            {
              metric: 'Cerner annual licence',
              baseline_m: 4.2,
              source: 'MER-C02',
              target: 'Terminated Q4 2026',
            },
          ],
          wave_plan: [
            {
              wave: 1,
              months: '1-6',
              theme: 'Compliance & Foundation',
              milestones: [
                'Prior auth — United, Aetna, BCBS activated (Day 60)',
                'CDO Dr. Jennifer Kim started (Day 45)',
                'Cerner data dictionary commissioned (Month 1)',
                'Nordic Global engaged (Month 2)',
                'Epic training programme launched (Month 2)',
                'Ensemble KT programme initiated (Month 3)',
              ],
              gate: 'CMS mandate top-3 payers compliant, Cerner data dictionary delivered',
            },
            {
              wave: 2,
              months: '7-15',
              theme: 'Migration & Optimization',
              milestones: [
                'Cerner data migration begins (Month 7)',
                'Prior auth all 12 payers (Month 10)',
                'MyChart adoption 60% (Month 9)',
                'Epic optimization score 75/100 (Month 10)',
                'Ensemble parallel running (Months 7-12)',
              ],
              gate: 'Cerner migration 50% complete, Epic score > 70/100, Ensemble parallel running',
            },
            {
              wave: 3,
              months: '16-24',
              theme: 'Completion & Savings',
              milestones: [
                'Cerner migration complete — Q4 2026 go-live',
                'Ensemble fully exited (Month 18)',
                'Cerner licence terminated',
                'Full Epic optimization verified',
                'Year-end board review',
              ],
              gate: 'All Cerner patients on Epic, Ensemble internal team independent',
            },
          ],
          fee_schedule: [
            {
              trigger:
                'Month 6 — top 3 payer prior auth live, denial rate < 16%',
              fee_m: 0.44,
              invoice: 'MER-T-FEE-001',
            },
            {
              trigger: 'Month 12 — Epic optimization score > 75/100',
              fee_m: 1.07,
              invoice: 'MER-T-FEE-002',
            },
            {
              trigger: 'Month 18 — Ensemble exit complete, savings verified',
              fee_m: 1.02,
              invoice: 'MER-T-FEE-003',
            },
            {
              trigger:
                'Month 24 — Cerner migration complete, all savings verified',
              fee_m: 3.27,
              invoice: 'MER-T-FEE-004',
            },
          ],
        },
      },
    },

    // ─── PHASE 4: Execution & Modernisation Tracking ─────────────────────────
    {
      phase_number: 4,
      status: 'in_progress',
      workstreams: [
        {
          name: 'Milestone Tracking',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Month 3 milestone check. Prior auth — United, Aetna, BCBS: **COMPLETE** — Day 58, 2 days ahead of schedule. Denial rate for these 3 payers: moved from **18.2% to 13.4%** in the first billing cycle. CMS mandate path for top 3 payers: **GREEN**. CDO Dr. Jennifer Kim: in seat Day 45, now leading monthly Technology Modernisation Council. Cerner data dictionary: commissioned Month 1, delivered Month 2. **2.1 million patient records** at the 2 Cerner hospitals. Nordic Global engaged Month 2.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: '2.1 million records — is that within the migration plan?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Yes — **2.1 million records** is at the high end of what Nordic Global has managed (their largest prior migration was 2.4 million). Migration timeline estimate with 2.1 million records: **14 weeks** active migration (vs 12 estimated in the plan). **2-week extension** to the timeline — go-live moves from Week 38 to Week 40. Still within Q4 2026. The additional 2 weeks is for data validation — Nordic\'s standard process for migrations > 2 million records requires an additional validation pass. On track.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Ensemble KT programme — status?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Ensemble KT programme initiated Month 3. Three internal FTE hired (revenue cycle specialists, start date Month 3). Month 3 KT activity: Ensemble has documented **34 of 87 workflows (39%)**. Ahead of Month 3 plan (30%). Denial management workflows — the highest risk — are **60% documented**. The liquidated damages clause is in the contract — Ensemble has commercial incentive to cooperate. Projected KT completion: **Month 10** (ahead of Month 12 plan).',
            },
          ],
        },
        {
          name: 'Cost Tracking',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Month 3 cost tracking. Annual vendor spend: **$19.4M** (from $19.8M baseline). Reduction: **$400K annualised** — primarily from Wipro Salesforce Health Cloud scope reduction (2 modules decommissioned that were never used). No Ensemble savings yet (KT programme in progress). Cerner licence: unchanged — termination at Q4 2026 go-live.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'The CFO wants to see the projected savings schedule.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Projected savings schedule: **Month 6** — denial rate savings begin (**$2.5M/yr** annualised, first billing cycle). **Month 12** — Epic optimization savings begin (**$6.1M/yr**, verified at 12-month Epic score measurement). **Month 18** — Ensemble exit complete (**$5.8M/yr** from Month 18). **Month 24** — Cerner licence terminated (**$4.2M/yr**). Total by Year 3: **$18.6M/yr annualised**, plus $2.5M CMS mandate recovery = **$21.1M**. AbarVa fee at Year 3: **$3.27M** (Month 24 trigger). Prior triggers total **$2.53M**. Total fee 3 years: **$5.8M**.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Epic training — any progress?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Epic training: **41% → 56%** completion in Month 3. **15 percentage points** in 3 months — ahead of the 80% Month 12 target (currently on 62% by Month 12 trajectory). Driver: mandatory training incorporated into monthly staff meetings by CMO directive. The CMO\'s involvement has been transformative — physician training completion moved from **18% to 44%** in Month 3. **F008 pattern being actively broken**.',
            },
          ],
        },
        {
          name: 'Capability Tracking',
          messages: [
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Internal capability building — three tracks. **Revenue cycle**: 3 FTE hired, Ensemble KT at 39% documentation, internal team capable of running 2 of 87 workflows independently. **Epic**: 12 FTE Epic team now leading prior auth activation without Epic advisory support (Day 58, completed independently). **Cerner**: Nordic embedded 4 Meridian engineers in migration planning team.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content:
                'The Epic team completing prior auth independently is significant.',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'It is. Prior auth activation — previously the integration team was waiting 18 months for a governance decision. The same team, with a clear decision and CDO in seat, completed the activation in **58 days**. The capability was always there. The change management gap (**F008**) was blocking it. CDO Dr. Kim\'s first governance action — a scope decision the previous team had been waiting 18 months for — shows the **F002/F008 link**: governance creates the conditions for capability to express itself.',
            },
            {
              role: 'admin',
              actor_name: 'Anand Sundaram',
              content: 'Month 4 outlook?',
            },
            {
              role: 'maestro_ai',
              actor_name: 'AbarVa AI',
              content:
                'Month 4 priorities: (1) **Prior auth** — expand to next 4 payers (Cigna, Humana, Anthem, WellCare). Target: all 7 by end of Month 4. (2) **Epic training**: 56% → 65% completion. (3) **Cerner data migration plan**: Nordic delivers migration sequencing plan. (4) **Ensemble KT**: 39% → 60% documentation. (5) **MyChart**: front desk enrolment campaign launches — target 40% by Month 4. All four on track.',
            },
          ],
        },
      ],
      output: {
        output_type: 'monthly_modernisation_report',
        title: 'Phase 4 Output — Monthly Modernisation Report (Month 3)',
        status: 'published',
        content: {
          month: 3,
          rag_status: 'GREEN',
          vendor_spend: {
            baseline_m: 19.8,
            current_m: 19.4,
            reduction_m: 0.4,
          },
          milestone_status: [
            {
              milestone: 'Prior auth — United, Aetna, BCBS',
              status: 'COMPLETE',
              actual_day: 58,
              rag: 'GREEN',
            },
            {
              milestone: 'CDO Dr. Jennifer Kim in seat',
              status: 'COMPLETE',
              actual_day: 45,
              rag: 'GREEN',
            },
            {
              milestone: 'Cerner data dictionary',
              status: 'COMPLETE',
              records: 2100000,
              rag: 'GREEN',
            },
            {
              milestone: 'Nordic Global engaged',
              status: 'COMPLETE',
              actual_month: 2,
              rag: 'GREEN',
            },
            {
              milestone: 'Epic training 80% by Month 12',
              status: 'IN_PROGRESS',
              current_pct: 56,
              trajectory_pct: 62,
              rag: 'GREEN',
            },
            {
              milestone: 'Ensemble KT programme',
              status: 'IN_PROGRESS',
              documentation_pct: 39,
              rag: 'GREEN',
            },
            {
              milestone: 'MyChart 60% by Month 9',
              status: 'IN_PROGRESS',
              current_pct: 34,
              rag: 'AMBER',
            },
          ],
          cms_compliance: {
            top_3_payers: 'COMPLETE',
            denial_rate_change: '18.2% → 13.4% for United, Aetna, BCBS',
            annualised_recovery_m: 2.5,
            mandate_deadline: 'January 2027',
            buffer_months: 14,
          },
          capability_metrics: {
            epic_training_pct: 56,
            physician_training_pct: 44,
            ensemble_kt_documented_pct: 39,
            internal_revenue_cycle_ftes: 3,
            nordic_embedded_engineers: 4,
          },
          fee_status: {
            month6_trigger:
              'Prior auth denial rate < 16% — currently 13.4% for top 3 payers. On track.',
            projected_month6_fee_m: 0.44,
            invoice: 'pending Month 6 verification',
          },
          board_notes: [
            'Month 3 overall RAG: GREEN. All critical milestones on or ahead of schedule.',
            'Prior auth top 3 payers live Day 58 — denial rate 18.2% → 13.4%. $2.5M annualised recovery confirmed.',
            'CDO Dr. Jennifer Kim in seat Day 45. Technology Modernisation Council first session held.',
            'Cerner data dictionary: 2.1M records. Migration timeline extended 2 weeks (40 weeks total). Q4 2026 still achievable.',
            'Epic training 56% completion — physician completion 44% (CMO mandatory training driving acceleration).',
            'Ensemble KT 39% documented — ahead of plan. Denial management workflows 60% complete.',
            'MyChart AMBER — no improvement yet. Front desk enrolment campaign launches Month 4.',
            'Month 6 fee trigger ($440K) on track — denial rate already below threshold.',
          ],
        },
      },
    },
  ],
}

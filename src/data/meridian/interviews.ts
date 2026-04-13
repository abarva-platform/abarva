interface Contradiction {
  claim: string
  data: string
  gap: string
  severity: 'Critical' | 'High' | 'Medium'
  owner: string
}

interface ExecutiveInterview {
  name: string
  title: string
  tenure: string
  transcript: string
  contradictions: Contradiction[]
}

interface MeridianInterviewsData {
  executives: ExecutiveInterview[]
}

export const meridianInterviews: MeridianInterviewsData = {
  executives: [
    {
      name: "Marcus Webb",
      title: "Chief Information Officer",
      tenure: "8 months",
      transcript: "I'll be direct — I inherited a portfolio I did not fully understand until about six weeks in. We have 23 hospitals, we have 3 EHR systems technically running in parallel if you count the Blue Ridge transition state, and we have 847 active SaaS contracts that nobody owns. When I asked for an authoritative list of our applications, I got four different spreadsheets from four different people. None of them matched. The board wants a transformation roadmap in 90 days and I'm telling them I need an accurate asset inventory first. My Epic optimization score on paper is 71 out of 100. That number came from a self-assessment our team ran in 2022. I ran my own assessment last month. We have 34% of clinical documentation happening outside Epic in some form — Word docs, paper printouts, 14 department-level Excel trackers. The real score is probably closer to 45. The CDO vacancy is killing us. I'm carrying two executive jobs and I'm eight months in. Something has to give.",
      contradictions: [
        {
          claim: "Epic optimization score reported as 71/100 in board materials",
          data: "34% of clinical documentation occurs outside Epic in workarounds; 14 active department-level Excel trackers identified in field assessment; only 12 of 47 Cogito dashboards deployed",
          gap: "Real score estimated 44-47/100 — a 24-27 point overstatement",
          severity: "High",
          owner: "Marcus Webb / Dr. Sarah Okonkwo",
        },
        {
          claim: "CIO states IT has 'full visibility into our vendor landscape'",
          data: "847 active SaaS subscriptions identified; no authoritative application inventory exists; four conflicting spreadsheets submitted when inventory was requested",
          gap: "$38M in shadow IT spend untracked; 23 department-level tools ungoverned",
          severity: "Critical",
          owner: "Marcus Webb",
        },
      ],
    },
    {
      name: "Robert Chen",
      title: "Chief Financial Officer",
      tenure: "5 years",
      transcript: "I know this business. I've been here through the Blue Ridge merger, through COVID, through the labor crisis. The number that keeps me up is $94M. That's our denial write-off for 2023. Ensemble promised 12% denial rate by end of year and they delivered 18.2%. Our contract has SLA provisions — they owe us money. Have we collected any of it? No. That's on me. I've been trying to renegotiate the entire contract rather than trigger the penalty clause because the termination fee is $14M and I don't have board appetite for that fight right now. On the revenue cycle side, our VP of Revenue Cycle tells me our net collection rate is 94.2%. I signed off on that number in the Q3 board pack. I want you to verify it because frankly I'm not sure our methodology is consistent with HFMA standards. Our cash collections relative to net patient service revenue tell a different story. I want that reconciled before the next board cycle.",
      contradictions: [
        {
          claim: "Net collection rate reported as 94.2% in Q3 board materials (per VP Revenue Cycle)",
          data: "Cash collections of $9.8B against net patient service revenue of $11.2B yields actual net collection rate of 87.1% using HFMA-standard methodology",
          gap: "$31M annual revenue gap between reported and actual collection performance",
          severity: "Critical",
          owner: "Robert Chen / VP Revenue Cycle",
        },
        {
          claim: "CFO states 'we know our denial write-off is $94M'",
          data: "Total economic impact of denials including $94M write-off plus $33M in rework labor, rebilling costs, and secondary write-offs from aged appeals = $127M total",
          gap: "$33M in denial-related costs not captured in the headline figure",
          severity: "High",
          owner: "Robert Chen",
        },
      ],
    },
    {
      name: "Dr. Sarah Okonkwo",
      title: "Chief Medical Informatics Officer",
      tenure: "3 years",
      transcript: "Epic is not the problem. I want to be very clear about that. We bought a Ferrari and we're using it as a golf cart. The problem is we went live, we called it done, and optimization was never resourced. I have a list of 47 Cogito dashboards we purchased — 12 are live. I have BPA alert configurations that were set in the original implementation and never tuned. Our alert fatigue scores are in the 90th percentile for Epic customers, meaning our physicians are drowning in alerts. The clinical documentation AI pilot we ran in the ED had 94% physician satisfaction scores. That was 10 months ago. We have not scaled it. I do not have a project team. I do not have a budget. I have a PowerPoint that shows it works and a medical staff that is slowly burning out. I need a CDO and I need a budget. Without those two things I am rearranging deck chairs.",
      contradictions: [
        {
          claim: "CMIO reports physician EHR burden is 'being addressed through optimization work'",
          data: "No Epic optimization project team exists; $18M optimization budget has $6M spent with project status 'Behind'; 34% workaround rate persists; physician burnout attributable to EHR at 68%",
          gap: "12M in unspent optimization budget with no active project team — work not actually in progress",
          severity: "High",
          owner: "Dr. Sarah Okonkwo / Marcus Webb",
        },
        {
          claim: "Clinical documentation AI described as 'in pilot stage'",
          data: "Pilot completed 10 months ago with 94% satisfaction; no scale decision made; no budget allocated; project effectively abandoned despite proven results",
          gap: "$42M annual productivity opportunity unrealized; 10 months of delay with no decision",
          severity: "Medium",
          owner: "Dr. Sarah Okonkwo",
        },
      ],
    },
    {
      name: "James Whitfield",
      title: "Chief Operating Officer",
      tenure: "11 years",
      transcript: "Eleven years here. I've seen a lot. And I'll tell you what I know: the nurses trust me and I will not let technology vendors blow up their workflows for a demo that looks good in a boardroom. I'm spending $142M a year on travel nurses. That number makes me sick every time I see the invoice. I've got 756 travel nurses active right now — that's not sustainable. I told the board we need a scheduling AI and I believe that. What I need to see is that it works before I deploy it to 23 hospitals and 8,000 nurses. The sepsis pilot at Carolinas East and Blue Ridge Memorial is real. Those are my two best hospitals running it. But scaling it to 21 more hospitals with different workflows, different staff cultures, different IT maturity? That's an 18-month project minimum, not 6 months like the CMIO keeps saying. I'm not opposed to AI. I'm opposed to AI that creates more work for nurses who are already at 100%.",
      contradictions: [
        {
          claim: "COO states travel nurse spend is '$142M'",
          data: "Verified contract spend with primary agencies is $142M; shadow agency spend through department-level purchase orders (bypassing procurement) adds $6M for actual total of $148M",
          gap: "$6M in shadow agency spend not tracked in operations dashboard",
          severity: "High",
          owner: "James Whitfield",
        },
        {
          claim: "COO states sepsis scaling timeline is '18 months minimum'",
          data: "Technical scaling from 2 to 23 hospitals estimated at 4-6 months per CMIO and IT; primary constraint is physician adoption program, not technical deployment",
          gap: "12-month timeline overestimate conflating technical deployment with organizational change — delaying $24M annual savings",
          severity: "Medium",
          owner: "James Whitfield / Dr. Sarah Okonkwo",
        },
      ],
    },
    {
      name: "Linda Reyes",
      title: "Chief Nursing Officer",
      tenure: "2 years",
      transcript: "I came from Providence where we reduced travel nurse dependency by 40% in 18 months using predictive scheduling. I know it can be done. What I didn't expect at Meridian was how fractured our staffing data would be. We have Kronos in 14 hospitals, a legacy system in 6, and paper-based scheduling in 3 Blue Ridge facilities that haven't migrated yet. I cannot run a unified scheduling model on fragmented data. The 24% nurse turnover number — I want to be honest, that's an undercount. That's voluntary turnover reported to HR. If you include travelers who don't renew and per-diem staff who go inactive, I think our effective workforce instability rate is closer to 31%. The other thing nobody talks about is that our float pool is 180 nurses short of where it needs to be to buffer against travel dependency. We've been trying to build it for 18 months. We keep losing recruits to systems paying $6-8/hour more.",
      contradictions: [
        {
          claim: "Nurse turnover reported at 24% in board materials",
          data: "Voluntary turnover (HR definition) is 24%; effective workforce instability including non-renewed travelers and inactive per-diem staff estimated at 31% by CNO",
          gap: "7 percentage point undercount; actual workforce instability significantly higher than reported",
          severity: "Medium",
          owner: "Linda Reyes / HR",
        },
        {
          claim: "Travel nurse spend reduction program 'on track' per operations dashboard",
          data: "Float pool is 180 nurses short of target; 3 Blue Ridge facilities on paper scheduling making ML scheduling impossible; actual spend $148M vs tracked $142M",
          gap: "Float pool deficit alone represents $6M in unavoidable travel nurse spend before any AI intervention",
          severity: "High",
          owner: "Linda Reyes / James Whitfield",
        },
      ],
    },
    {
      name: "[Vacant — Search In Progress]",
      title: "Chief Data Officer",
      tenure: "0 months — role vacant since January 2024",
      transcript: "Role approved by the board in January 2024 following the Blue Ridge merger close. Search launched in February. Two finalist candidates declined offers — one cited the Azure Synapse implementation state as 'pre-maturity for a CDO-level scope,' the second declined after learning the CIO was carrying both roles and the CDO would effectively inherit a support function rather than a strategic seat. Third search round underway. Estimated time to fill: 4-6 more months. In the interim, Marcus Webb (CIO) is accountable for data strategy. The Azure Synapse platform — central to the AI roadmap — has no data architecture owner. Three value-based care analytics projects are stalled waiting for CDO decisions on data governance and payer data access.",
      contradictions: [
        {
          claim: "Board materials describe CDO search as 'progressing on schedule'",
          data: "Two finalist candidates declined; third search round underway; 15+ months since role approval with no hire; CIO estimated 4-6 additional months to fill",
          gap: "CDO vacancy is directly blocking $120M+ in Wave 2 AI value creation per AbarVa roadmap",
          severity: "Critical",
          owner: "Dr. Patricia Holloway / Board",
        },
      ],
    },
    {
      name: "Diane Kowalski",
      title: "VP Revenue Cycle",
      tenure: "18 months",
      transcript: "I took this role knowing RCM was a mess and I've made progress — denial rate came down from 21% when I started to 18.2% today, which doesn't sound like much but represents roughly $16M in recovered revenue. The challenge I face is that Ensemble owns the operational layer and I own the contract. When I push them on SLA performance, they show me their dashboards. When I pull our source data, the numbers don't match. Prior auth approval time — they tell me 3.1 days average. My team pulled the Epic data and got 4.2 days. The SLA is 1.8 days. That $2.1M SLA credit has been in dispute for six months. Robert — the CFO — asked me to hold off on triggering the credit clause while he renegotiates. I'll also be transparent about the collection rate number. I reported 94.2% to the CFO based on our internal methodology. I've since learned that the HFMA standard calculation is different. I want that reconciled. It may not be a good number.",
      contradictions: [
        {
          claim: "Ensemble Health Partners reports prior auth average approval time of 3.1 days",
          data: "Epic scheduling and authorization records show average prior auth approval time of 4.2 days; SLA threshold is 1.8 days",
          gap: "2.4-day SLA breach; $2.1M in SLA credits available and unclaimed; Ensemble's own dashboard uses different methodology",
          severity: "Critical",
          owner: "Diane Kowalski / Ensemble Health Partners",
        },
        {
          claim: "Net collection rate reported as 94.2% using internal methodology",
          data: "HFMA-standard net collection calculation yields 87.1%",
          gap: "$31M annual gap; VP Revenue Cycle acknowledges the reconciliation is needed",
          severity: "Critical",
          owner: "Diane Kowalski",
        },
      ],
    },
    {
      name: "Dr. Marcus Thompson",
      title: "VP Population Health",
      tenure: "3 years",
      transcript: "We have 187,000 covered lives and a 3.5 Medicare Advantage star rating. The math is brutal — every 0.5-star improvement in MA is worth somewhere between $17M and $34M in quality bonuses. We are 0.5 stars away from a $34M swing. The frustrating part is I can see exactly where we're losing stars: diabetes management at 62 percentile, medication adherence at 68, mental health access at 58. We know the gaps. What we cannot do is close them at scale because we don't have the data infrastructure to do automated outreach and we don't have a CDO to build it. I built a care gap model in Python on Azure that works for our top 10,000 highest-risk patients. I cannot run it for 187,000 lives without a proper MLOps environment. Azure Synapse has been 'six months away' for 14 months. My other concern is the HEDIS measurement methodology. Some of our low scores are genuinely poor performance. But two of our lowest measures — mental health access and medication adherence — have attribution issues that inflate the gap against benchmark. Nobody has formally challenged those with the plan.",
      contradictions: [
        {
          claim: "MA Stars improvement described as 'on the roadmap' in Q3 board materials",
          data: "No funded initiative exists; Azure Synapse prerequisite 14 months overdue; care gap model built but cannot scale without MLOps; CDO vacancy blocks data infrastructure decisions",
          gap: "$34M quality bonus at risk with no funded path to closing the gap before next measurement period",
          severity: "Critical",
          owner: "Dr. Marcus Thompson / Marcus Webb",
        },
        {
          claim: "HEDIS mental health access and medication adherence scores reflect clinical performance",
          data: "VP Population Health believes 2 of lowest HEDIS measures have attribution methodology issues that have not been formally challenged with the health plan",
          gap: "Unknown — potential to improve 2 HEDIS measures through plan-level challenge without clinical intervention",
          severity: "Medium",
          owner: "Dr. Marcus Thompson",
        },
      ],
    },
  ],
}

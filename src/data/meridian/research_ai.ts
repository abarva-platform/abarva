export const meridianResearchAI = {
  posture: {
    canonicalLine:
      "Meridian research AI is local-first today: Palantir plus a legacy NVIDIA/private GPU stack and Hadoop research lake, with cloud AI under CIO evaluation but blocked by PHI, IRB, data-egress, and security controls.",
    currentState: "local_first_research_ai",
    targetState: "governed_hybrid_research_ai",
    cloudGenAIStatus: "evaluating_not_adopted",
    activeResearchClaudeUsage: false,
    activeResearchOpenAIUsage: false,
    activeResearchBedrockUsage: false,
    activeResearchAzureFoundryUsage: false,
    currentResearchRuntime: ["Palantir Foundry", "on-prem NVIDIA GPU cluster", "Hadoop research lake", "locally hosted open-weight LLMs"],
    cioDirection:
      "New CIO is pushing toward governed cloud AI and studying Stanford/Mayo-style cloud research patterns, but research workloads have not moved to Claude on Bedrock, Azure Foundry, or external OpenAI/Anthropic endpoints.",
    researchTeamView:
      "Research leaders agree cloud is directionally necessary for scale, collaboration, and digital-twin work, but they are not willing to move PHI-heavy research workflows until privacy, IRB, data-egress, and security controls are enforceable.",
    contradictionGuardrails: [
      "Azure Synapse is the enterprise analytics modernization path, not the current research GenAI runtime.",
      "Azure ML and AWS experiments are exploratory or enterprise-facing, not the active research LLM hosting layer.",
      "Anthropic, OpenAI, Bedrock, and Azure Foundry are CIO target-state/vendor-evaluation topics, not deployed research-team platforms.",
      "Palantir is the strongest current research data control plane; Hadoop and NVIDIA private GPU remain important legacy anchors.",
      "Digital twins are research exploration only and must not be described as clinical decision support.",
    ],
  },

  researchInstitute: {
    name: "Meridian Institute for Translational Research",
    scale:
      "Research-heavy IDN institute with oncology, population health, imaging, genomics, and value-based-care research programs.",
    annualExternalFunding: 180,
    activeGrants: 240,
    activeClinicalTrials: 186,
    researchFTE: 920,
    principalInvestigators: 148,
    annualPublications: 620,
    priorityDomains: [
      "oncology pathway research",
      "population health risk modeling",
      "clinical trial matching",
      "imaging AI research",
      "genomics and biomarker discovery",
      "care delivery digital twins",
      "real-world evidence generation",
    ],
    executiveOwner: "Dr. Marcus Reid, Chief Physician Executive (research orientation)",
    operatingTension:
      "Research sees itself as an academic-style innovation engine, while enterprise IT sees unmanaged research infrastructure as a security and data-governance risk.",
  },

  palantir: {
    product: "Palantir Foundry",
    status: "active_research_control_plane",
    adoption: "strong_in_research_moderate_in_operations",
    primaryUsers: ["research analytics", "oncology research", "population health research", "clinical trial operations"],
    ontologyObjects: [
      "patient",
      "encounter",
      "condition",
      "tumor",
      "specimen",
      "genomic_variant",
      "imaging_study",
      "trial",
      "protocol",
      "cohort",
      "intervention",
      "outcome_measure",
    ],
    connectedSources: [
      "Epic Clarity research extracts",
      "Hadoop research lake",
      "tumor registry",
      "biobank inventory",
      "clinical trial management system",
      "imaging metadata catalog",
      "de-identified claims extracts",
    ],
    knownGaps: [
      "Foundry ontology is research-rich but not fully reconciled to enterprise master data.",
      "Clinical operations teams do not consistently trust Palantir-derived cohorts for operational decisions.",
      "Cost allocation between research, IT, and service lines is unresolved.",
      "Lineage from Hadoop jobs into Foundry objects is incomplete for older genomics pipelines.",
    ],
    recommendedNextMove:
      "Use Palantir as the near-term research ontology while forcing explicit lineage, PHI classification, and model-evaluation gates before any clinical workflow use.",
  },

  legacyResearchLake: {
    platform: "Hadoop research lake",
    status: "large_legacy_research_data_gravity",
    ageYears: 9,
    storagePB: 5.8,
    activeUsers: 220,
    monthlyJobs: 7400,
    primaryWorkloads: [
      "genomics variant processing",
      "imaging metadata feature extraction",
      "retrospective cohort construction",
      "clinical trial feasibility analytics",
      "de-identified claims linkage",
      "research publication datasets",
    ],
    issues: [
      "Hadoop security model is not granular enough for the next phase of PHI-sensitive AI research.",
      "Spark and Hive jobs are poorly documented; many pipelines depend on two senior research engineers.",
      "Dataset freshness varies by domain; Epic-derived extracts are often T+7 for research use.",
      "Migration path to cloud lakehouse is politically blocked by privacy, egress, and cost concerns.",
    ],
    decisionNeeded:
      "Decide whether Hadoop is retired into a governed cloud research lakehouse, wrapped by Palantir, or kept as a cold archive while new digital-twin workloads land elsewhere.",
  },

  privateGpuCloud: {
    name: "Meridian Research GPU Cloud",
    status: "active_but_aging",
    location: "research data center enclave",
    vendorStack: ["NVIDIA", "Dell PowerEdge", "NetApp", "Slurm", "Kubernetes research namespace"],
    gpuInventory: [
      { type: "NVIDIA A100", count: 32, primaryUse: "deep learning, imaging AI, local LLM inference" },
      { type: "NVIDIA V100", count: 48, primaryUse: "legacy imaging and genomics workloads" },
      { type: "NVIDIA T4", count: 24, primaryUse: "batch inference and researcher sandboxes" },
    ],
    utilization: {
      averageGpuUtilizationPercent: 71,
      peakGpuUtilizationPercent: 94,
      medianQueueWaitHours: 11,
      storageUtilizationPercent: 83,
    },
    locallyHostedModels: [
      {
        family: "open-weight clinical summarization model",
        status: "research_only",
        approvedData: "de-identified notes and IRB-approved limited datasets",
      },
      {
        family: "open-weight literature review assistant",
        status: "research_only",
        approvedData: "public literature and non-PHI protocol drafts",
      },
      {
        family: "imaging feature extraction model",
        status: "research_validated_not_clinical",
        approvedData: "radiology research image sets with IRB approval",
      },
    ],
    risks: [
      "GPU cluster is trusted by researchers but lacks enterprise-grade model registry, policy-as-code, and audit logging.",
      "Capacity is insufficient for multimodal digital-twin training at research scale.",
      "Local hosting protects PHI but slows collaboration with external research partners.",
      "Enterprise security cannot yet prove all model prompts, outputs, and datasets are logged end-to-end.",
    ],
  },

  digitalTwinExploration: {
    status: "exploration",
    boundary: "research_only_not_clinical_decision_support",
    candidateUseCases: [
      {
        name: "oncology treatment pathway twin",
        purpose: "simulate care pathway variations and research hypotheses for selected cancer cohorts",
        maturity: "concept",
        requiredDatasets: ["tumor registry", "genomics", "treatment plans", "outcomes", "imaging metadata", "trial history"],
      },
      {
        name: "clinical trial eligibility twin",
        purpose: "simulate eligibility criteria and recruitment yield before trial launch",
        maturity: "pilot candidate",
        requiredDatasets: ["Epic cohorts", "trial protocols", "lab history", "diagnosis history", "medication history"],
      },
      {
        name: "population health intervention twin",
        purpose: "model intervention timing and care-management load for value-based cohorts",
        maturity: "adjacent to existing population health analytics",
        requiredDatasets: ["claims", "care gaps", "social determinants", "utilization", "outreach history"],
      },
      {
        name: "research operations twin",
        purpose: "simulate protocol startup, IRB cycle time, and coordinator capacity",
        maturity: "low-risk first pilot",
        requiredDatasets: ["IRB submissions", "trial startup milestones", "staffing", "grant budgets", "enrollment history"],
      },
    ],
    minimumGateCriteria: [
      "IRB-approved research boundary and consent posture documented",
      "PHI classification and de-identification path approved by privacy office",
      "Model registry and reproducibility controls live",
      "Data lineage from source to simulation output visible",
      "Security review of compute environment complete",
      "Human review board for any publication or clinical translation claim",
    ],
  },

  privacySecurityGates: [
    {
      gate: "PHI boundary",
      requirement: "Classify every dataset as identified PHI, limited dataset, de-identified, synthetic, or public before model use.",
      owner: "Chief Privacy Officer",
    },
    {
      gate: "IRB approval",
      requirement: "Map each model workflow to an IRB protocol or exemption before use on research datasets.",
      owner: "IRB chair and research compliance",
    },
    {
      gate: "External model review",
      requirement: "No Claude, OpenAI, Bedrock, Azure Foundry, or GCP hosted model use for research PHI until BAA, egress, prompt logging, and retention rules are approved.",
      owner: "CIO, CISO, Privacy",
    },
    {
      gate: "Model validation",
      requirement: "Require reproducibility package, bias assessment, drift plan, and human review before any publication or operational recommendation.",
      owner: "Research AI governance council",
    },
    {
      gate: "Cloud enclave decision",
      requirement: "Evaluate GCP healthcare research enclave, Azure enterprise alignment, and AWS isolated research VPC against privacy, cost, and data-gravity criteria.",
      owner: "CIO and President, Meridian Institute",
    },
  ],

  requiredDatasetsToAddNext: [
    "research grant portfolio",
    "clinical trial management system extract",
    "IRB submission and cycle-time history",
    "tumor registry and disease registry metadata",
    "biobank and specimen inventory",
    "genomics variant pipeline inventory",
    "imaging research archive and annotation catalog",
    "Palantir ontology object catalog",
    "Hadoop dataset and job inventory",
    "GPU utilization and queue telemetry",
    "local model registry and evaluation results",
    "research data-sharing agreements and external collaboration rules",
  ],
}

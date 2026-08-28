import type { VendorPlatformProfile } from "../types";

export const MEDEANALYTICS_PROFILE_V1: VendorPlatformProfile = {
  vendorId: "medeanalytics",
  vendorName: "MedeAnalytics",
  platformFamily: "Health Fabric / managed healthcare analytics",
  profileVersion: "2026-08-27.v1",
  validAsOf: "2026-08-27",
  platformArchetype: "MANAGED_ANALYTICS_PLATFORM",
  reviewStatus: "draft",
  sourceRefs: [
    {
      refId: "mede-data-fabric",
      title: "MedeAnalytics Data Fabric",
      url: "https://medeanalytics.com/data-fabric/",
      publisher: "MedeAnalytics",
      retrievedAt: "2026-08-27",
    },
    {
      refId: "mede-health-fabric-snowflake-2025",
      title: "MedeAnalytics Launches Health Fabric on Snowflake AI Data Cloud",
      url: "https://medeanalytics.com/company/newsroom/press-releases/health-fabric-snowflake/",
      publisher: "MedeAnalytics",
      retrievedAt: "2026-08-27",
    },
  ],
  capabilityFamilies: [
    {
      capabilityId: "platform_foundation",
      name: "Health Fabric platform foundation",
      publicDescription:
        "Public materials describe a healthcare data foundation and Health Fabric platform; the 2025 Snowflake announcement must be treated as version-specific public context, not proof of any client deployment.",
      sourceClass: "vendor_published",
      commonInputs: [
        "clinical data",
        "claims data",
        "financial data",
        "social data",
      ],
      commonProcessing: [
        "data unification",
        "data collaboration",
        "interoperability",
      ],
      commonOutputs: ["analytics-ready healthcare data foundation"],
      discoveryQuestions: [
        "Which platform family and version is deployed for this client?",
        "Where is it hosted and which data-platform components are client-visible?",
      ],
      evidenceRequests: [
        "Order form or SOW listing deployed platform/modules",
        "Current implementation architecture or hosting statement",
      ],
      repatriationRisks: [
        "Assuming a current public architecture applies to an older client deployment",
      ],
      confidence: "medium",
      sourceRefIds: ["mede-data-fabric", "mede-health-fabric-snowflake-2025"],
    },
    {
      capabilityId: "data_orchestration_enrichment",
      name: "Data orchestration, enrichment, cataloging, and quality",
      publicDescription:
        "Public materials describe MedeEnrich with data lake, master person index, enrichment, cataloging, and quality assurance capabilities.",
      sourceClass: "vendor_published",
      commonInputs: [
        "ad hoc data",
        "non-standard data sources",
        "healthcare source data",
      ],
      commonProcessing: [
        "master person indexing",
        "enrichment",
        "cataloging",
        "quality assurance",
      ],
      commonOutputs: ["analytical source of truth", "curated data products"],
      discoveryQuestions: [
        "Which orchestration, identity, enrichment, catalog, and quality functions are actually used?",
        "Can mappings, crosswalks, quality rules, and rejected-record handling be exported?",
      ],
      evidenceRequests: [
        "Data mapping and transformation specifications",
        "Identity/crosswalk documentation",
        "Data-quality and reject reports",
      ],
      repatriationRisks: [
        "Hidden identity/conformance rules prevent output parity after repatriation",
      ],
      confidence: "high",
      sourceRefIds: ["mede-data-fabric"],
    },
    {
      capabilityId: "analytics_benchmarking",
      name: "Analytics, visualization, drill-down, and benchmarking",
      publicDescription:
        "Public materials describe MedeWorks with visualization, benchmarking, drill-down, security/provisioning, and 200+ pre-built customizable analytics views.",
      sourceClass: "vendor_published",
      commonInputs: [
        "curated healthcare data",
        "industry data sets",
        "proprietary data sets",
      ],
      commonProcessing: [
        "benchmarking",
        "drill-down",
        "visualization",
        "comparative analytics",
      ],
      commonOutputs: [
        "dashboards",
        "analytics views",
        "benchmark comparisons",
        "alerts",
      ],
      discoveryQuestions: [
        "Which analytics views, benchmarks, alerts, and drill paths are licensed, customized, and business-critical?",
        "Which benchmark sources are used and can they be licensed or reproduced independently?",
      ],
      evidenceRequests: [
        "Report/dashboard inventory with usage and owners",
        "Benchmark source and licensing documentation",
        "Custom measure definitions",
      ],
      repatriationRisks: [
        "Benchmark or proprietary data cannot be reproduced internally without separate rights",
      ],
      confidence: "high",
      sourceRefIds: ["mede-data-fabric"],
    },
    {
      capabilityId: "predictive_augmented_analytics",
      name: "Predictive and augmented analytics",
      publicDescription:
        "Public materials describe MedeElevate capabilities including predictive analytics, guided analysis, machine learning, narratives, predictive search, and rules engine support.",
      sourceClass: "vendor_published",
      commonInputs: ["curated data", "rules", "model features"],
      commonProcessing: [
        "predictive analytics",
        "machine learning",
        "rules engine",
        "guided analysis",
      ],
      commonOutputs: [
        "narratives",
        "trend insights",
        "outlier/root-cause analysis",
        "predictions",
      ],
      discoveryQuestions: [
        "Which predictive models, rules, narratives, thresholds, and versions are in production?",
        "Are model features, training data, configurations, rules, and explainability artifacts client-accessible?",
      ],
      evidenceRequests: [
        "Model/rule inventory",
        "Feature, threshold, and version documentation",
        "Validation and monitoring reports",
      ],
      repatriationRisks: [
        "Proprietary model or rule logic cannot be rebuilt from client evidence",
      ],
      confidence: "high",
      sourceRefIds: ["mede-data-fabric"],
    },
    {
      capabilityId: "action_performance_management",
      name: "Action and performance management",
      publicDescription:
        "Public materials describe action plans and reporting dashboards used to track financial and operational improvement efforts.",
      sourceClass: "vendor_published",
      commonInputs: [
        "performance opportunities",
        "improvement initiatives",
        "dashboard signals",
      ],
      commonProcessing: ["action tracking", "performance reporting"],
      commonOutputs: [
        "action plans",
        "status dashboards",
        "performance-management views",
      ],
      discoveryQuestions: [
        "Are action plans and workflows executed inside the platform, outside it, or both?",
        "Which improvement workflows must continue during coexistence and cutover?",
      ],
      evidenceRequests: [
        "Action-plan inventory",
        "Workflow ownership and usage logs",
        "Operational runbook",
      ],
      repatriationRisks: [
        "Recreating reports without the action workflow breaks business adoption",
      ],
      confidence: "medium",
      sourceRefIds: ["mede-data-fabric"],
    },
    {
      capabilityId: "adoption_enablement",
      name: "Adoption, usage analytics, onboarding, and training",
      publicDescription:
        "Public materials describe usage analytics, onboarding/training materials, and in-app messaging integrated with MedeAnalytics solutions.",
      sourceClass: "vendor_published",
      commonInputs: ["user activity", "training content", "product telemetry"],
      commonProcessing: ["usage analytics", "onboarding", "in-app messaging"],
      commonOutputs: [
        "adoption insights",
        "training materials",
        "enablement messages",
      ],
      discoveryQuestions: [
        "What usage analytics, training, onboarding, and support functions would need replacement?",
        "Which user groups depend on vendor-provided enablement or advisory support?",
      ],
      evidenceRequests: [
        "Usage analytics export",
        "Training/onboarding inventory",
        "Support and adoption services description",
      ],
      repatriationRisks: [
        "Capability migration succeeds technically but loses adoption support",
      ],
      confidence: "medium",
      sourceRefIds: ["mede-data-fabric"],
    },
    {
      capabilityId: "managed_services_advisory",
      name: "Managed service and advisory support",
      publicDescription:
        "Public materials describe advisory and performance-improvement services alongside the software platform.",
      sourceClass: "vendor_published",
      commonInputs: [
        "client goals",
        "analytics outputs",
        "performance initiatives",
      ],
      commonProcessing: [
        "consultative advisory",
        "performance improvement support",
      ],
      commonOutputs: [
        "recommendations",
        "advisory support",
        "improvement plans",
      ],
      discoveryQuestions: [
        "Which work is software-delivered versus people/process support from the provider?",
        "Which operating activities must the client staff, replace, or retain during exit?",
      ],
      evidenceRequests: [
        "SOW and service descriptions",
        "Named operating activities and support cadence",
        "Transition-assistance clauses",
      ],
      repatriationRisks: [
        "Software-only rebuild misses provider labor and advisory work embedded in the current service",
      ],
      confidence: "medium",
      sourceRefIds: ["mede-data-fabric", "mede-health-fabric-snowflake-2025"],
    },
  ],
  typicalInputs: [
    {
      patternId: "healthcare_operational_data",
      label: "Healthcare source data",
      examples: ["claims", "clinical", "financial", "social determinants"],
    },
    {
      patternId: "non_standard_enrichment_data",
      label: "Non-standard or enrichment data",
      examples: [
        "productivity data",
        "ad hoc data",
        "industry/proprietary data sets",
      ],
    },
  ],
  typicalOutputs: [
    {
      patternId: "analytics_views",
      label: "Analytics views and dashboards",
      examples: [
        "prebuilt views",
        "custom dashboards",
        "benchmark comparisons",
        "alerts",
      ],
    },
    {
      patternId: "action_workflows",
      label: "Action and performance-management outputs",
      examples: ["action plans", "guided analysis", "usage/adoption reporting"],
    },
  ],
  typicalOperatingModel: [
    {
      patternId: "platform_plus_services",
      label: "Platform plus managed/advisory services",
      questions: [
        "Which responsibilities are software functions, managed services, advisory work, or client work?",
        "Which functions need replacement, retention, or transition support?",
      ],
    },
  ],
  commonHiddenDependencies: [
    {
      patternId: "identity_conformance_rules",
      label: "Identity, conformance, and quality logic",
      risk: "Provider crosswalks, quality rules, and conformed definitions may be necessary for parity but unavailable in client-owned form.",
    },
    {
      patternId: "benchmark_external_data_rights",
      label: "Benchmark and external-data rights",
      risk: "Benchmark comparisons may depend on proprietary or separately licensed data.",
    },
  ],
  contractAndExitRisks: [
    {
      patternId: "data_return_and_transition_assistance",
      label: "Data return and transition assistance",
      questions: [
        "What data, configuration, documentation, history, and support must the provider return?",
        "Which termination-assistance obligations and fees apply?",
      ],
    },
    {
      patternId: "ip_and_logic_portability",
      label: "IP and logic portability",
      questions: [
        "Which transformation, metric, model, benchmark, and workflow logic is client-owned, licensable, or proprietary?",
      ],
    },
  ],
  p2DiscoveryTriggers: [
    {
      triggerId: "mede_identity_resolution",
      capabilityId: "data_orchestration_enrichment",
      questionSetId: "mede_identity_resolution",
      condition:
        "Vendor-published identity/conformance capability exists and client identity/conformance evidence is unknown or missing.",
      questions: [
        "Does this deployment use member, patient, provider, employer, contract, or facility identity resolution?",
        "Which crosswalks, survivorship rules, and master indexes are client-accessible?",
      ],
      evidenceRequests: [
        "Identity/crosswalk documentation",
        "Conformance and data-quality rules",
      ],
    },
    {
      triggerId: "mede_benchmark_portability",
      capabilityId: "analytics_benchmarking",
      questionSetId: "mede_benchmark_portability",
      condition:
        "Vendor-published benchmarking capability exists and client benchmark source evidence is not confirmed.",
      questions: [
        "Which benchmark sources and peer groups are used in current analytics outputs?",
        "Can benchmark data or methodology be licensed, exported, or reproduced independently?",
      ],
      evidenceRequests: [
        "Benchmark methodology/source documentation",
        "Licensed benchmark modules or contract terms",
      ],
    },
    {
      triggerId: "vendor_operating_model_dependency",
      capabilityId: "managed_services_advisory",
      questionSetId: "vendor_operating_model_dependency",
      condition:
        "Contract or scope suggests managed services and manual operating activities are unknown.",
      questions: [
        "Which recurring work is performed by provider staff rather than software?",
        "Which activities must be retained, staffed internally, replaced, or exited?",
      ],
      evidenceRequests: [
        "SOW/service descriptions",
        "Operating cadence, support roster, and transition-assistance terms",
      ],
    },
    {
      triggerId: "predictive_logic_portability",
      capabilityId: "predictive_augmented_analytics",
      questionSetId: "predictive_logic_portability",
      condition:
        "Vendor-published predictive/augmented analytics exists and model/rule implementation evidence is unknown.",
      questions: [
        "Which models, rules, narratives, thresholds, and versions are used in production?",
        "What features, validation results, monitoring, and explainability artifacts are available?",
      ],
      evidenceRequests: [
        "Model/rule inventory",
        "Validation, monitoring, and feature documentation",
      ],
    },
  ],
};

import type {
  ClientVendorDeploymentProfile,
  ResolvedVendorCapabilityState,
  VendorCapability,
  VendorDiscoveryPlan,
  VendorDiscoveryQuestionSet,
  VendorDiscoveryWorkbookTab,
  VendorIntelligenceState,
  VendorPlatformProfile,
} from "./types";

function includes(value: readonly string[], target: string): boolean {
  return value.some((entry) => entry.toLowerCase() === target.toLowerCase());
}

function isCapabilityInScope(
  capability: VendorCapability,
  overlay: ClientVendorDeploymentProfile,
  scopedCapabilityIds?: readonly string[],
): boolean {
  if (scopedCapabilityIds?.length) {
    return includes(scopedCapabilityIds, capability.capabilityId);
  }
  return (
    includes(overlay.implementedCapabilities, capability.capabilityId) ||
    includes(overlay.licensedModules, capability.capabilityId) ||
    overlay.contractRefs.length > 0 ||
    overlay.unknowns.some((gap) => gap.capabilityId === capability.capabilityId)
  );
}

function capabilityState(
  capability: VendorCapability,
  overlay: ClientVendorDeploymentProfile,
): ResolvedVendorCapabilityState {
  const implementationConfirmed = includes(
    overlay.implementedCapabilities,
    capability.capabilityId,
  );
  const contractConfirmed = includes(
    overlay.licensedModules,
    capability.capabilityId,
  );
  const clientObserved =
    overlay.outputs.some(
      (output) =>
        output.capabilityId === capability.capabilityId &&
        output.status === "client_observed",
    ) ||
    overlay.workflows.some(
      (workflow) =>
        workflow.capabilityId === capability.capabilityId &&
        workflow.status === "client_observed",
    );

  let state: VendorIntelligenceState = "vendor_published";
  if (contractConfirmed) state = "contract_confirmed";
  if (implementationConfirmed) state = "implementation_confirmed";
  if (clientObserved) state = "client_observed";

  return {
    capabilityId: capability.capabilityId,
    capabilityName: capability.name,
    vendorPublished: capability.sourceClass === "vendor_published",
    contractConfirmed,
    implementationConfirmed,
    clientObserved,
    state,
  };
}

function hasUnknown(
  overlay: ClientVendorDeploymentProfile,
  capabilityId: string,
  tokens: readonly RegExp[],
): boolean {
  return overlay.unknowns.some(
    (gap) =>
      (!gap.capabilityId || gap.capabilityId === capabilityId) &&
      tokens.some((token) => token.test(gap.label.toLowerCase())),
  );
}

function hasObservedBenchmarkOutput(
  overlay: ClientVendorDeploymentProfile,
): boolean {
  return overlay.outputs.some(
    (output) =>
      /benchmark/.test(output.label.toLowerCase()) &&
      output.status === "client_observed",
  );
}

function hasKnownManualOperatingActivity(
  overlay: ClientVendorDeploymentProfile,
): boolean {
  return (
    overlay.supportModel?.status === "client_observed" ||
    overlay.workflows.some(
      (workflow) =>
        workflow.status === "client_observed" &&
        /support|advisory|operat|manual|training|enablement/.test(
          workflow.label.toLowerCase(),
        ),
    )
  );
}

function triggered(
  profile: VendorPlatformProfile,
  overlay: ClientVendorDeploymentProfile,
  capability: VendorCapability,
  state: VendorIntelligenceState,
): VendorDiscoveryQuestionSet[] {
  const sets: VendorDiscoveryQuestionSet[] = [];
  const add = (questionSetId: string, reason: string) => {
    const trigger = profile.p2DiscoveryTriggers.find(
      (entry) => entry.questionSetId === questionSetId,
    );
    if (!trigger) return;
    sets.push({
      questionSetId,
      capabilityId: capability.capabilityId,
      title: capability.name,
      reason,
      questions: trigger.questions,
      evidenceRequests: trigger.evidenceRequests,
      state,
    });
  };

  if (
    capability.capabilityId === "data_orchestration_enrichment" &&
    hasUnknown(overlay, capability.capabilityId, [
      /identity/,
      /mpi/,
      /crosswalk/,
      /conformance/,
      /quality/,
    ])
  ) {
    add(
      "mede_identity_resolution",
      "Vendor-published identity/conformance capability intersects with unknown client deployment evidence.",
    );
  }

  if (
    capability.capabilityId === "analytics_benchmarking" &&
    !hasObservedBenchmarkOutput(overlay)
  ) {
    add(
      "mede_benchmark_portability",
      "Vendor-published benchmarking capability is potentially relevant, but benchmark use/source evidence is not confirmed.",
    );
  }

  if (
    capability.capabilityId === "managed_services_advisory" &&
    (overlay.licensedModules.some((module) =>
      /managed|service|advisory|support/.test(module.toLowerCase()),
    ) ||
      overlay.contractRefs.length > 0) &&
    !hasKnownManualOperatingActivity(overlay)
  ) {
    add(
      "vendor_operating_model_dependency",
      "Managed-service/advisory support may be contracted, but manual operating activities are not evidenced.",
    );
  }

  if (
    capability.capabilityId === "predictive_augmented_analytics" &&
    hasUnknown(overlay, capability.capabilityId, [
      /model/,
      /rule/,
      /threshold/,
      /feature/,
      /predict/,
      /logic/,
    ])
  ) {
    add(
      "predictive_logic_portability",
      "Predictive/rules capability may be in scope, but model and rule portability evidence is missing.",
    );
  }

  return sets;
}

function tabForQuestionSet(
  questionSet: VendorDiscoveryQuestionSet,
): VendorDiscoveryWorkbookTab {
  if (questionSet.questionSetId === "mede_identity_resolution") {
    return {
      tabKey: "mede_processing",
      title: "Mede Processing",
      purpose:
        "Establish transformations, mappings, identity resolution, quality rules, enrichment, and unknown logic.",
      capabilityIds: questionSet.capabilityId ? [questionSet.capabilityId] : [],
      questionSetIds: [questionSet.questionSetId],
      questions: questionSet.questions,
      evidenceRequests: questionSet.evidenceRequests,
    };
  }
  if (questionSet.questionSetId === "mede_benchmark_portability") {
    return {
      tabKey: "measures_analytics_benchmarks",
      title: "Measures, Analytics & Benchmarks",
      purpose:
        "Establish measure definitions, custom rules, models, benchmarks, ownership, and portability.",
      capabilityIds: questionSet.capabilityId ? [questionSet.capabilityId] : [],
      questionSetIds: [questionSet.questionSetId],
      questions: questionSet.questions,
      evidenceRequests: questionSet.evidenceRequests,
    };
  }
  if (questionSet.questionSetId === "vendor_operating_model_dependency") {
    return {
      tabKey: "operations_support",
      title: "Operations & Support",
      purpose:
        "Establish SLAs, incidents, manual work, release cadence, training, support, and provider personnel.",
      capabilityIds: questionSet.capabilityId ? [questionSet.capabilityId] : [],
      questionSetIds: [questionSet.questionSetId],
      questions: questionSet.questions,
      evidenceRequests: questionSet.evidenceRequests,
    };
  }
  if (questionSet.questionSetId === "predictive_logic_portability") {
    return {
      tabKey: "measures_analytics_benchmarks",
      title: "Measures, Analytics & Benchmarks",
      purpose:
        "Establish measure definitions, custom rules, models, benchmarks, ownership, and portability.",
      capabilityIds: questionSet.capabilityId ? [questionSet.capabilityId] : [],
      questionSetIds: [questionSet.questionSetId],
      questions: questionSet.questions,
      evidenceRequests: questionSet.evidenceRequests,
    };
  }
  return {
    tabKey: questionSet.questionSetId,
    title: questionSet.title,
    purpose: questionSet.reason,
    capabilityIds: questionSet.capabilityId ? [questionSet.capabilityId] : [],
    questionSetIds: [questionSet.questionSetId],
    questions: questionSet.questions,
    evidenceRequests: questionSet.evidenceRequests,
  };
}

function mergeWorkbookTabs(
  questionSets: VendorDiscoveryQuestionSet[],
): VendorDiscoveryWorkbookTab[] {
  const byKey = new Map<string, VendorDiscoveryWorkbookTab>();
  for (const questionSet of questionSets) {
    const next = tabForQuestionSet(questionSet);
    const existing = byKey.get(next.tabKey);
    if (!existing) {
      byKey.set(next.tabKey, next);
      continue;
    }
    byKey.set(next.tabKey, {
      ...existing,
      capabilityIds: Array.from(
        new Set([...existing.capabilityIds, ...next.capabilityIds]),
      ),
      questionSetIds: Array.from(
        new Set([...existing.questionSetIds, ...next.questionSetIds]),
      ),
      questions: Array.from(
        new Set([...existing.questions, ...next.questions]),
      ),
      evidenceRequests: Array.from(
        new Set([...existing.evidenceRequests, ...next.evidenceRequests]),
      ),
    });
  }
  return Array.from(byKey.values());
}

export function resolveVendorDiscoveryPlan(args: {
  profile: VendorPlatformProfile;
  overlay: ClientVendorDeploymentProfile;
  scopedCapabilityIds?: readonly string[];
}): VendorDiscoveryPlan {
  const relevant = args.profile.capabilityFamilies.filter((capability) =>
    isCapabilityInScope(capability, args.overlay, args.scopedCapabilityIds),
  );
  const capabilityStates = relevant.map((capability) =>
    capabilityState(capability, args.overlay),
  );
  const stateByCapability = new Map(
    capabilityStates.map((state) => [state.capabilityId, state.state]),
  );
  const requiredQuestionSets = relevant.flatMap((capability) =>
    triggered(
      args.profile,
      args.overlay,
      capability,
      stateByCapability.get(capability.capabilityId) ?? "vendor_published",
    ),
  );
  const workbookTabs = mergeWorkbookTabs(requiredQuestionSets);

  return {
    vendorId: args.profile.vendorId,
    tenantKey: args.overlay.tenantKey,
    platformArchetype: args.profile.platformArchetype,
    summary: {
      capabilitiesPotentiallyRelevant: relevant.length,
      confirmedFromContract: capabilityStates.filter(
        (state) =>
          state.contractConfirmed ||
          state.implementationConfirmed ||
          state.clientObserved,
      ).length,
      confirmedInCurrentUse: capabilityStates.filter(
        (state) => state.clientObserved,
      ).length,
      needConfirmation: requiredQuestionSets.length,
      evidenceGaps:
        args.overlay.unknowns.length + args.overlay.conflicts.length,
    },
    capabilityStates,
    requiredQuestionSets,
    workbookTabs,
  };
}

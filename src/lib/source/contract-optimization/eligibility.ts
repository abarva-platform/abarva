const CONTRACT_OPTIMIZATION_TERMS =
  /\b(contract|agreement|msa|sow|incumbent|renewal|renegotiat(?:e|ion)|reprice|optimi[sz](?:e|ation)|commercial baseline|rate card|service credit|auto[- ]?renew|notice window)\b/i;

export function isContractOptimizationEvent(args: {
  activeClientKey?: string | null;
  eventCode: string;
  eventName: string;
}): boolean {
  void args.activeClientKey;
  const text = `${args.eventCode} ${args.eventName}`;
  return CONTRACT_OPTIMIZATION_TERMS.test(text);
}

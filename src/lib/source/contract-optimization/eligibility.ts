export function isSkyHarborContractOptimizationEvent(args: {
  activeClientKey?: string | null;
  eventCode: string;
  eventName: string;
}): boolean {
  const clientKey = args.activeClientKey?.trim().toLowerCase();
  if (clientKey !== "skyharbor" && clientKey !== "skyharbor-air") {
    return false;
  }

  const text = `${args.eventCode} ${args.eventName}`.toLowerCase();
  return (
    text.includes("ams") ||
    text.includes("application managed") ||
    text.includes("contract") ||
    text.includes("outsourcing") ||
    text.includes("renewal")
  );
}

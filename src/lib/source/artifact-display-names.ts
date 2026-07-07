import type {
  SourceEventArtifactState,
  SourceEventArtifactStatus,
} from "./canvas-substrate";

export const SOURCE_ARTIFACT_FALLBACK_NAME = "Source document";

export function artifactDisplayName(
  artifactCode: string,
  canonicalName?: string | null,
): string {
  if (canonicalName?.trim()) return canonicalName;

  const withoutPrefix = artifactCode.replace(/^d\d+[a-z]?_?/, "");
  const words = withoutPrefix
    .split("_")
    .map((part) => part.trim())
    .filter(Boolean);

  if (words.length === 0) return SOURCE_ARTIFACT_FALLBACK_NAME;

  return words
    .map((word) => {
      const upper = word.toUpperCase();
      if (upper === "RFP" || upper === "RFI" || upper === "BAFO") {
        return upper;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function artifactStatusDisplayName(
  artifact: Pick<SourceEventArtifactState, "status" | "body">,
): string {
  const hasBody = Boolean(artifact.body?.trim());

  switch (artifact.status) {
    case "not_started":
      return hasBody ? "Draft" : "Awaiting draft";
    case "drafting":
      return hasBody ? "Draft" : "Drafting";
    case "needs_review":
      return "Needs review";
    case "approved":
      return "Approved";
    case "locked":
      return "Locked";
    case "superseded":
      return "Superseded";
    default:
      return statusFallback(artifact.status);
  }
}

function statusFallback(status: SourceEventArtifactStatus): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

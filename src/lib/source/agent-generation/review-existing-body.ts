export interface SourceArtifactGenerationInput {
  reviewExistingBody: boolean;
  body: string;
  error: "artifact_body_required" | null;
}

export function resolveSourceArtifactGenerationInput(args: {
  requestedReview: unknown;
  existingBody: string | null | undefined;
}): SourceArtifactGenerationInput {
  const reviewExistingBody = args.requestedReview === true;
  const existingBody = args.existingBody?.trim() ?? "";

  return {
    reviewExistingBody,
    body: reviewExistingBody ? existingBody : "",
    error:
      reviewExistingBody && existingBody.length === 0
        ? "artifact_body_required"
        : null,
  };
}

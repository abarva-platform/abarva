'use server';

// Server action for the Moves Expert Review Console.
//
// One action: persist an expert's verdict on the kernel business case as an
// append-only `expert_reviews` row, through the data-plane write seam. The
// console re-reads the accumulated reviews and re-runs the calibration engine
// on the next render.
//
// The action is CASE-AWARE: the form carries a `caseId`, resolved through the
// `expert-review-cases` registry, so the review persists against whichever of
// the three kernel-anchored tenants (Apex / Meridian / First Capital) was
// reviewed. The `expert_reviews` table is already keyed on
// `tenant_client_key` + `move_ref`, so no migration change is needed.

import { revalidatePath } from 'next/cache';
import type {
  ExpertReviewerRole,
  ExpertReviewVerdict,
} from '@/lib/programs/expert-kernel';
import { resolveExpertReviewCase } from '@/lib/programs/expert-kernel';
import { validateReviewSubmission } from '@/lib/programs/expert-kernel';
import { selectExpertReviewsWriteAdapter } from '@/lib/data-plane/write-adapters/expertReviewsWriteAdapter';
import { getCurrentUser } from '@/lib/auth/current-user';

const ROUTE = '/programs/expert-kernel/expert-review';

const ROLES: readonly ExpertReviewerRole[] = [
  'cfo',
  'transformation_partner',
  'sourcing_vp',
  'delivery_lead',
  'domain_operator',
  'risk_compliance',
];
const VERDICTS: readonly ExpertReviewVerdict[] = [
  'credible',
  'credible_with_conditions',
  'weak',
  'wrong',
];

/** Parse a comma/newline-separated textarea into a trimmed, deduped list. */
function parseList(raw: string): string[] {
  return [...new Set(
    raw
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean),
  )];
}

/**
 * Persist one expert review of a kernel-anchored business case. The `caseId`
 * field selects which of the three tenants (Apex / Meridian / First Capital)
 * the review belongs to; an unknown id falls back to the default Apex case.
 * Validates against that case's known assumption keys before the write so a
 * reviewer cannot orphan a note onto an unknown assumption.
 */
export async function recordExpertReviewAction(formData: FormData): Promise<void> {
  const reviewerId = String(formData.get('reviewerId') ?? '').trim();
  const roleRaw = String(formData.get('role') ?? '');
  const verdictRaw = String(formData.get('verdict') ?? '');
  const note = String(formData.get('note') ?? '').trim();
  const assumptionKeys = parseList(String(formData.get('assumptionKeys') ?? ''));
  const requiredActions = parseList(String(formData.get('requiredActions') ?? ''));
  const caseId = String(formData.get('caseId') ?? '');

  const role = ROLES.includes(roleRaw as ExpertReviewerRole)
    ? (roleRaw as ExpertReviewerRole)
    : null;
  const verdict = VERDICTS.includes(verdictRaw as ExpertReviewVerdict)
    ? (verdictRaw as ExpertReviewVerdict)
    : null;
  if (!role || !verdict) return;

  // Resolve the tenant case and validate against ITS live assumption keys.
  const reviewCase = resolveExpertReviewCase(caseId);
  const { skeleton } = reviewCase.buildCase();
  const knownKeys = new Set(skeleton.assumptions.assumptions.map((a) => a.key));
  const review = { reviewerId, role, verdict, note, assumptionKeys, requiredActions };
  const validation = validateReviewSubmission(review, knownKeys);
  if (!validation.ok) return;

  const user = await getCurrentUser();
  await selectExpertReviewsWriteAdapter().recordReview({
    ...review,
    tenantClientKey: reviewCase.tenantKey,
    moveRef: reviewCase.moveRef,
    moveName: skeleton.moveName,
    createdBy: user?.personId ?? user?.clerkUserId ?? null,
  });

  revalidatePath(ROUTE);
}

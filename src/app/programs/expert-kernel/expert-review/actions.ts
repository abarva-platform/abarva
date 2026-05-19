'use server';

// Server action for the Moves Expert Review Console.
//
// One action: persist an expert's verdict on the kernel business case as an
// append-only `expert_reviews` row, through the data-plane write seam. The
// console re-reads the accumulated reviews and re-runs the calibration engine
// on the next render.

import { revalidatePath } from 'next/cache';
import {
  APEX_CONTACT_CENTER_MOVE_REF,
  APEX_CONTACT_CENTER_TENANT_KEY,
} from '@/lib/programs/expert-kernel';
import type {
  ExpertReviewerRole,
  ExpertReviewVerdict,
} from '@/lib/programs/expert-kernel';
import { buildApexContactCenterCase } from '@/lib/programs/expert-kernel';
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
 * Persist one expert review of the Apex Contact Center AI Routing business
 * case. Validates against the kernel's known assumption keys before the write
 * so a reviewer cannot orphan a note onto an unknown assumption.
 */
export async function recordExpertReviewAction(formData: FormData): Promise<void> {
  const reviewerId = String(formData.get('reviewerId') ?? '').trim();
  const roleRaw = String(formData.get('role') ?? '');
  const verdictRaw = String(formData.get('verdict') ?? '');
  const note = String(formData.get('note') ?? '').trim();
  const assumptionKeys = parseList(String(formData.get('assumptionKeys') ?? ''));
  const requiredActions = parseList(String(formData.get('requiredActions') ?? ''));

  const role = ROLES.includes(roleRaw as ExpertReviewerRole)
    ? (roleRaw as ExpertReviewerRole)
    : null;
  const verdict = VERDICTS.includes(verdictRaw as ExpertReviewVerdict)
    ? (verdictRaw as ExpertReviewVerdict)
    : null;
  if (!role || !verdict) return;

  // Validate against the live kernel assumption keys.
  const { skeleton } = buildApexContactCenterCase();
  const knownKeys = new Set(skeleton.assumptions.assumptions.map((a) => a.key));
  const review = { reviewerId, role, verdict, note, assumptionKeys, requiredActions };
  const validation = validateReviewSubmission(review, knownKeys);
  if (!validation.ok) return;

  const user = await getCurrentUser();
  await selectExpertReviewsWriteAdapter().recordReview({
    ...review,
    tenantClientKey: APEX_CONTACT_CENTER_TENANT_KEY,
    moveRef: APEX_CONTACT_CENTER_MOVE_REF,
    moveName: skeleton.moveName,
    createdBy: user?.personId ?? user?.clerkUserId ?? null,
  });

  revalidatePath(ROUTE);
}

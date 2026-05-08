// /home/ai-initiatives/[initiativeId] · canonical Home detail page.
// Re-exports /admin/ai-initiatives/[initiativeId].
export {
  default,
  generateMetadata,
} from '../../../admin/ai-initiatives/[initiativeId]/page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

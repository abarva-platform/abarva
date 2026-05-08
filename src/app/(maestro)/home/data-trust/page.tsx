// /home/data-trust · canonical Home panel.
// Re-exports the existing /admin/data-trust implementation per PR-H2
// route migration. The /admin route stays accessible but 301-redirects
// to /home (see proxy.ts).
export { default, metadata } from '../../admin/data-trust/page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

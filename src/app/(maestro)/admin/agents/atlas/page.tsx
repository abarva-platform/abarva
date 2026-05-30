/**
 * /admin/agents/atlas · DEPRECATED · redirects to /admin/cross-program-signals
 *
 * Per `feedback_workflow_first_agents_hidden.md` — primary navigation is
 * workflow-anchored. Agent-named admin surfaces are deprecated in favor
 * of workflow-named routes. The Atlas-flavored cross-program signal
 * synthesis lives at /admin/cross-program-signals.
 */

import { redirect } from 'next/navigation';

export default function AdminAtlasPageRedirect(): never {
  redirect('/admin/cross-program-signals');
}

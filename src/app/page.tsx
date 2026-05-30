import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { LoggedOutLandingPage } from '@/components/marketing/LoggedOutLandingPage'
import { resolvePostSignInPath, resolveSessionRole, resolveSessionClientKey } from '@/lib/auth/access-routing'
import { getActiveClientRow } from '@/lib/active-client'
import { selectTowerPageReadAdapter } from '@/lib/data-plane/read-adapters/towerPageReadAdapter'

export const dynamic = 'force-dynamic'

// Tower-as-landing detection (Tower audit §5.1): probe whether the signed-in
// user's tenant has a non-empty Tower portfolio. We use the same read adapter
// the Tower page uses, so the signal is consistent with what they'd see.
// Failure is treated as "no portfolio" — never redirect users into an empty
// Tower because of a substrate read error.
async function detectTowerPortfolio(input: {
  clientId?: string | null
  defaultClientId?: string | null
  email?: string | null
}): Promise<boolean> {
  try {
    const clientKey = resolveSessionClientKey({
      clientId: input.clientId ?? null,
      defaultClientId: input.defaultClientId ?? null,
      email: input.email ?? null,
    })
    const activeClient = await getActiveClientRow(clientKey).catch(() => null)
    if (!activeClient) return false
    const count = await selectTowerPageReadAdapter()
      .countClientInitiatives(activeClient.id)
      .catch(() => 0)
    return count > 0
  } catch {
    return false
  }
}

export default async function HomePage() {
  const user = await currentUser().catch(() => null)
  const email = user?.primaryEmailAddress?.emailAddress
    ?? user?.emailAddresses?.[0]?.emailAddress
    ?? null
  const role = resolveSessionRole(user?.publicMetadata?.role as string | undefined, email)

  if (user && role !== 'external') {
    const clientId = user.publicMetadata?.clientId as string | undefined
    const defaultClientId = user.publicMetadata?.defaultClientId as string | undefined
    const hasTowerPortfolio = await detectTowerPortfolio({
      clientId,
      defaultClientId,
      email,
    })
    redirect(resolvePostSignInPath(role, {
      clientId,
      defaultClientId,
      email,
      hasTowerPortfolio,
    }))
  }

  return <LoggedOutLandingPage />
}

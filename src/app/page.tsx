import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { LoggedOutLandingPage } from '@/components/marketing/LoggedOutLandingPage'
import { resolvePostSignInPath, resolveSessionRole } from '@/lib/auth/access-routing'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await currentUser().catch(() => null)
  const email = user?.primaryEmailAddress?.emailAddress
    ?? user?.emailAddresses?.[0]?.emailAddress
    ?? null
  const role = resolveSessionRole(user?.publicMetadata?.role as string | undefined, email)

  if (user && role !== 'external') {
    redirect(resolvePostSignInPath(role, {
      clientId: user.publicMetadata?.clientId as string | undefined,
      defaultClientId: user.publicMetadata?.defaultClientId as string | undefined,
      email,
    }))
  }

  return <LoggedOutLandingPage />
}

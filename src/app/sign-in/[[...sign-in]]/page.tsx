import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { SignInShell } from '@/components/auth/SignInShell'

export const dynamic = 'force-dynamic'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const [params, user] = await Promise.all([
    searchParams,
    currentUser().catch(() => null),
  ])

  if (user) {
    redirect(params.redirect || '/auth-redirect')
  }

  return <SignInShell redirectUrl={params.redirect || '/auth-redirect'} />
}

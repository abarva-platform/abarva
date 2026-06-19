import { redirect } from 'next/navigation'
import { SignIn } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>
}) {
  const [params, user] = await Promise.all([
    searchParams,
    currentUser().catch(() => null),
  ])
  const redirectUrl = firstParam(params.redirect) || '/auth-redirect'

  if (user) {
    redirect(redirectUrl)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F8F7F4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'grid',
          justifyItems: 'center',
          gap: 16,
        }}
      >
        <SignIn
          routing="path"
          path="/sign-in"
          forceRedirectUrl={redirectUrl}
          fallbackRedirectUrl="/auth-redirect"
          signUpUrl="/sign-in"
        />
        <div
          style={{
            maxWidth: 460,
            color: '#5D6572',
            fontSize: 11.5,
            lineHeight: 1.55,
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '-0.005em',
          }}
        >
          AbarVa · AI Success Platform · Access is restricted to invited client identities.
        </div>
      </div>
    </main>
  )
}

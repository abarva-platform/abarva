import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

const DEMO_USERS = [
  {
    email: 'anand.sundaram@thesundaram.com',
    metadata: {
      role: 'client',
      clientId: 'meridian',
      clientName: 'Meridian Health System',
      defaultClientId: 'meridian',
      clientLocked: true,
      accountType: 'founder_pinned',
    },
  },
  {
    email: 'demo-apexretail+clerk_test@abarva.com',
    metadata: {
      role: 'client',
      clientId: 'apexretail',
      clientName: 'Apex Retail Group',
      defaultClientId: 'apexretail',
      clientLocked: true,
      accountType: 'demo_existing',
    },
  },
  {
    email: 'demo-meridian+clerk_test@abarva.com',
    metadata: {
      role: 'client',
      clientId: 'meridian',
      clientName: 'Meridian Health System',
      defaultClientId: 'meridian',
      clientLocked: true,
      accountType: 'demo_existing',
    },
  },
]

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clerk = await clerkClient()

    // Verify caller is either a platform admin or the founder account.
    const caller = await clerk.users.getUser(userId)
    const callerEmail = caller.emailAddresses.find((email) => email.id === caller.primaryEmailAddressId)?.emailAddress
      ?? caller.emailAddresses[0]?.emailAddress
      ?? null
    const isFounder = callerEmail?.toLowerCase() === 'anand.sundaram@thesundaram.com'
    if (caller.publicMetadata?.role !== 'admin' && !isFounder) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const results: { email: string; status: string; userId?: string }[] = []

    for (const demo of DEMO_USERS) {
      try {
        const list = await clerk.users.getUserList({ emailAddress: [demo.email] })
        const user = list.data[0]

        if (!user) {
          results.push({ email: demo.email, status: 'not_found' })
          continue
        }

        await clerk.users.updateUser(user.id, { publicMetadata: demo.metadata })
        results.push({ email: demo.email, status: 'updated', userId: user.id })
      } catch (err: any) {
        results.push({ email: demo.email, status: `error: ${err.message}` })
      }
    }

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

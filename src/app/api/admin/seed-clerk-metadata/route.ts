import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

const DEMO_USERS = [
  {
    email: 'af+clerk_test@abarva.com',
    metadata: {
      role: 'client',
      clientId: 'arcturus',
      clientName: 'Arcturus Financial Group',
      preferredSolution: 'margin',
    },
  },
  {
    email: 'mh+clerk_test@abarva.com',
    metadata: {
      role: 'client',
      clientId: 'meridian',
      clientName: 'Meridian Health System',
      preferredSolution: 'tech',
    },
  },
  {
    email: 'investor+clerk_test@abarva.com',
    metadata: {
      role: 'investor',
    },
  },
  {
    email: 'anand+clerk_test@abarva.com',
    metadata: {
      role: 'admin',
    },
  },
]

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clerk = await clerkClient()

    // Verify caller is admin
    const caller = await clerk.users.getUser(userId)
    if (caller.publicMetadata?.role !== 'admin') {
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

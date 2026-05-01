import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getServerSupabase } from '@/lib/supabase-server'

const DEMO_PASSWORD = 'Demo2026!'

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
  {
    email: 'demo-firstcapital+clerk_test@abarva.com',
    metadata: {
      role: 'client',
      clientId: 'arcturus',
      clientName: 'First Capital',
      defaultClientId: 'arcturus',
      clientLocked: true,
      accountType: 'demo_existing',
    },
  },
  {
    email: 'demo-apexretail-programs+clerk_test@abarva.com',
    personGraphNodeId: 'person_demo_apexretail_programs',
    metadata: {
      role: 'client',
      clientId: 'apexretail',
      clientName: 'Apex Retail Group',
      defaultClientId: 'apexretail',
      clientLocked: true,
      accountType: 'demo_program_user',
      moduleAccess: ['programs'],
      programScope: 'assigned_programs_only',
      canCreatePrograms: true,
    },
  },
  {
    email: 'demo-meridian-programs+clerk_test@abarva.com',
    personGraphNodeId: 'person_demo_meridian_programs',
    metadata: {
      role: 'client',
      clientId: 'meridian',
      clientName: 'Meridian Health System',
      defaultClientId: 'meridian',
      clientLocked: true,
      accountType: 'demo_program_user',
      moduleAccess: ['programs'],
      programScope: 'assigned_programs_only',
      canCreatePrograms: true,
    },
  },
  {
    email: 'demo-firstcapital-programs+clerk_test@abarva.com',
    personGraphNodeId: 'person_demo_firstcapital_programs',
    metadata: {
      role: 'client',
      clientId: 'arcturus',
      clientName: 'First Capital',
      defaultClientId: 'arcturus',
      clientLocked: true,
      accountType: 'demo_program_user',
      moduleAccess: ['programs'],
      programScope: 'assigned_programs_only',
      canCreatePrograms: true,
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

    const sb = getServerSupabase()
    const results: { email: string; status: string; userId?: string; personId?: string | null }[] = []

    for (const demo of DEMO_USERS) {
      try {
        let personId: string | null = null
        if ('personGraphNodeId' in demo && demo.personGraphNodeId) {
          const { data: person } = await sb
            .from('persons')
            .select('id')
            .eq('graph_node_id', demo.personGraphNodeId)
            .maybeSingle()
          personId = (person as { id?: string } | null)?.id ?? null
        }
        const publicMetadata = personId
          ? { ...demo.metadata, person_id: personId }
          : demo.metadata

        const list = await clerk.users.getUserList({ emailAddress: [demo.email] })
        let user = list.data[0]

        if (!user) {
          user = await clerk.users.createUser({
            emailAddress: [demo.email],
            password: DEMO_PASSWORD,
            publicMetadata,
          })
          results.push({ email: demo.email, status: 'created', userId: user.id, personId })
          continue
        }

        await clerk.users.updateUser(user.id, { publicMetadata })
        results.push({ email: demo.email, status: 'updated', userId: user.id, personId })
      } catch (err: any) {
        results.push({ email: demo.email, status: `error: ${err.message}` })
      }
    }

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

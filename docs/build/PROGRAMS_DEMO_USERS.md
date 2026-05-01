# Programs Demo Users

Date: 2026-05-01

Status: app-control-plane seed for Programs-only demo users.

## Login Matrix

All accounts use password `Demo2026!` when created by the admin seed route and demo code `424242` on `/sign-in`.

| Client | Programs User | Role | Existing Program Visibility | Can Create New Programs | Financial Values |
| --- | --- | --- | --- | --- | --- |
| Apex Retail | `demo-apexretail-programs+clerk_test@abarva.com` | Programs Operator | Assigned Apex programs only | Yes | No |
| Meridian Health | `demo-meridian-programs+clerk_test@abarva.com` | Programs Operator | Assigned Meridian programs only | Yes | No |
| First Capital | `demo-firstcapital-programs+clerk_test@abarva.com` | Programs Operator | Assigned First Capital programs only | Yes | No |

## Mapping Behavior

Migration `054_program_demo_users.sql` creates one `persons` row per Programs Operator, one `person_client_memberships` row per client, and one `engagement_participants` row for each existing program in that same client.

The user is a `program_member`, not a `client_admin`.

The user can create new programs because `person_client_memberships.can_create_programs = true`.

The user cannot administer users, approve phase gates, publish deliverables, or view exact financial values by default.

## Clerk Seed Behavior

`/api/admin/seed-clerk-metadata` now includes these three Programs Operator accounts. When called by the founder/admin account it:

1. Looks up the seeded `persons.graph_node_id`.
2. Adds `publicMetadata.person_id` to the Clerk user.
3. Creates the Clerk user if missing.
4. Sets `moduleAccess: ["programs"]`.
5. Sets `programScope: "assigned_programs_only"`.
6. Sets `canCreatePrograms: true`.

This keeps the browser session, DB person row, client membership, and program participant mapping aligned.

## Negative Test

A Meridian Programs Operator asking to create or view an Apex program must be refused. The account is client-locked to Meridian and has no Apex membership or participant rows.

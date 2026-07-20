-- Seed the global Strategy-stage guidebook.
--
-- The Strategy stage's gate is the P0 event-intake approval: the sponsor
-- reviews the five captured facts (why now, decision owner, scope boundary,
-- value target, approval route) before the working canvas unlocks. This
-- guidebook is the facilitator's walk-through for that conversation --
-- content grounded in the actual approval workspace fields
-- (src/app/(maestro)/source/events/[eventId]/approval), not generic filler.

INSERT INTO source_stage_guidebooks (
  stage_key, client_key, title, purpose, duration_minutes, status, sections, version
)
VALUES (
  'strategy',
  NULL,
  'Strategy Gate Review',
  'Get a clean sponsor decision on whether this event goes to market -- the why-now, the decision owner, the scope boundary, and the value target all need to hold up before scope work starts.',
  20,
  'published',
  jsonb_build_array(
    jsonb_build_object(
      'type', 'purpose',
      'title', 'What this session is for',
      'body', 'The Strategy gate is a sponsor decision, not a status update. Before the event unlocks Scope, the sponsor has to be able to say yes to five specific things: why this is happening now, who owns the decision, what is explicitly in and out, what value is at stake, and who else has to sign off. If any of the five is soft, the event should not advance -- send it back rather than let an ambiguous mandate carry through eleven stages.',
      'timeBoxMinutes', null
    ),
    jsonb_build_object(
      'type', 'agenda',
      'title', 'Agenda (20 min)',
      'body', E'1. Why now / trigger -- confirm it is a real forcing event, not a preference (5 min)\n2. Decision owner + approval route -- confirm who must say yes, and whether anyone else needs to be looped in before this is final (5 min)\n3. Scope boundary -- read back the in/out line in plain language; ask the sponsor to poke holes in it (5 min)\n4. Value or savings target -- confirm the number is a real target the sponsor will be measured against, not a placeholder (3 min)\n5. Decision: approve, send back with specific gaps, or hold (2 min)',
      'timeBoxMinutes', 20
    ),
    jsonb_build_object(
      'type', 'facilitator_brief',
      'title', 'Facilitator talking points',
      'body', E'- Open with the trigger, not the process: "Here is why this is on the table now" -- read the captured why-now/trigger fact back verbatim and ask the sponsor to confirm or correct it.\n- On decision owner: do not accept "the team" as an answer. One name, one role. If a co-approver is required, name them and get a date by which they will weigh in.\n- On scope boundary: read the in-scope and out-of-scope lines back exactly as captured. Ask "what would surprise you if it turned out to be in scope?" -- that question surfaces boundary gaps faster than asking "does this look right?"\n- On value target: ask how the number was built (benchmark, prior deal, top-down mandate). A target with no basis is a value hypothesis, not a target -- flag it for the Value Target Brief (d02) to firm up in Strategy, not to be discovered at BAFO.\n- Self-approval flag: if the person approving is also the event creator, say so out loud before asking for the decision. The audit log will show it either way; naming it in the room is more honest than letting it pass silently.',
      'timeBoxMinutes', null
    ),
    jsonb_build_object(
      'type', 'decision_capture',
      'title', 'Decision to record',
      'body', E'Record exactly one of:\n- Approved -- event unlocks Scope.\n- Sent back -- name which of the five facts needs rework and who owns fixing it.\n- Held -- name the blocking dependency and the date to revisit.\n\nDo not record "approved with reservations" -- a reservation that matters is a send-back; a reservation that does not matter is not worth recording.',
      'timeBoxMinutes', null
    ),
    jsonb_build_object(
      'type', 'pre_mortem',
      'title', 'Failure modes to watch for',
      'body', E'- A vague why-now ("cost pressure") that will not survive a BAFO negotiation where the vendor asks "why now, specifically?"\n- A decision owner named by title, not person -- causes a real delay three stages later when nobody knows who to route the RFP sign-off to.\n- A scope boundary the sponsor has not actually read closely -- catches most out-of-scope disputes before they cost a change order later.\n- A value target with no stated basis -- gets challenged at Executive Decision when finance asks where the number came from.',
      'timeBoxMinutes', null
    )
  ),
  1
)
ON CONFLICT DO NOTHING;

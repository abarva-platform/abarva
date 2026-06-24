import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(file: string): string {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

const migration = read('supabase/migrations/20260524184500_intelligence_ask_session_memory.sql');
assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.intelligence_ask_sessions/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.intelligence_ask_turns/);
assert.match(migration, /UNIQUE \(tenant_id, user_id, tab_id\)/);
assert.match(migration, /linked_move_id UUID REFERENCES public\.engagements/);
assert.match(migration, /originating_intelligence_session_id UUID/);
assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
assert.match(migration, /authenticated_select_own_intelligence_ask_sessions/);

const sessionMemory = read('src/lib/intelligence/ask/session-memory.ts');
assert.match(sessionMemory, /prepareAskSessionMemory/);
assert.match(sessionMemory, /appendAskSessionTurn/);
assert.match(sessionMemory, /RECENT_TURN_LIMIT = 10/);
assert.match(sessionMemory, /\[middle omitted\]/);
assert.match(sessionMemory, /linkAskSessionToMove/);
assert.match(sessionMemory, /getAskSessionForMove/);

const synthesizer = read('src/lib/intelligence/ask/synthesizer.ts');
assert.match(synthesizer, /SESSION CONTINUITY RULE/);
assert.match(synthesizer, /repeat, recap, continue/);

const askRoute = read('src/app/api/intelligence/ask/route.ts');
assert.match(askRoute, /prepareAskSessionMemory/);
assert.match(askRoute, /type:\s*["']session["']/);
assert.match(askRoute, /appendAskSessionTurn/);
assert.match(askRoute, /conversationContextBlock: memory\?\.contextBlock/);
assert.match(askRoute, /ai-ask-tab-id/);

const tabCookie = read('src/app/intelligence/ask/IntelligenceAskTabCookie.tsx');
assert.match(tabCookie, /ai-ask-tab-id/);
assert.match(tabCookie, /sessionStorage/);
assert.match(tabCookie, /document\.cookie/);

const avaCards = read('src/app/(maestro)/intelligence/ask/AvaReasoningCards.tsx');
assert.match(avaCards, /ensureIntelligenceAskTabId/);
assert.match(avaCards, /sessionId/);
assert.match(avaCards, /\/programs\/new\?fromIntelligence=1/);

const programsNew = read('src/app/programs/new/page.tsx');
assert.match(programsNew, /originatingIntelligenceSessionId/);
assert.match(programsNew, /fromIntelligence/);

const originationSubmit = read('src/lib/programs/origination-submit.ts');
assert.match(originationSubmit, /linkAskSessionToMove/);
assert.match(originationSubmit, /originatingIntelligenceSessionId/);

const commitProgram = read('src/lib/agent/tools/program/commitProgram.ts');
assert.match(commitProgram, /originatingIntelligenceSessionIdFromContext/);
assert.match(commitProgram, /linkAskSessionToMove/);

const moveDetailPage = read('src/app/(maestro)/strategic-moves/[moveId]/page.tsx');
assert.match(moveDetailPage, /getAskSessionForMove/);
assert.match(moveDetailPage, /originatingIntelligenceSessionId/);

const moveDetailClient = read('src/components/strategic-moves/StrategicMoveDetailClient.tsx');
assert.match(moveDetailClient, /originatingIntelligenceSessionId/);
assert.match(moveDetailClient, /pre-mortem and pronoun questions/);

const agentRoute = read('src/app/api/chat/agent/route.ts');
assert.match(agentRoute, /getAskSessionContextById/);
assert.match(agentRoute, /Originating Intelligence Ask session/);
assert.match(agentRoute, /Move-detail pronoun rule/);

console.log('FOUNDATION-FIX-2 session memory smoke passed');

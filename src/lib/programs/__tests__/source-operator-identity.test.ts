jest.mock("server-only",()=>({}));
import { sourceOperatorVerifier } from "@/scripts/moves-source-operator-identity";
import type { ExactSourceCohort } from "../evidence-readiness/exact-source-preparation";
const cohort={operatorPersonId:"00000000-0000-4000-8000-000000000001",operatorClerkId:"user_fixture"} as ExactSourceCohort;
const originalFetch=global.fetch,originalSecret=process.env.CLERK_SECRET_KEY;
beforeEach(()=>{process.env.CLERK_SECRET_KEY="test-only-placeholder";});
afterEach(()=>{global.fetch=originalFetch;if(originalSecret===undefined)delete process.env.CLERK_SECRET_KEY;else process.env.CLERK_SECRET_KEY=originalSecret;});
it.each(["verified-email","declared-person","unverified-email","wrong-person","wrong-user","dedicated-unbound"])("binds a native operator to authoritative identity: %s",async kind=>{
  const user={id:kind==="wrong-user"?"user_other":cohort.operatorClerkId,public_metadata:kind==="declared-person"?{person_id:cohort.operatorPersonId}:kind==="dedicated-unbound"?{accountType:"synthetic_e2e_operator"}:{},email_addresses:[{email_address:"operator@example.test",verification:{status:kind==="unverified-email"?"unverified":"verified"}}]};
  global.fetch=jest.fn(async()=>new Response(JSON.stringify(user),{status:200}));
  if(kind==="wrong-user") {await expect(sourceOperatorVerifier(cohort)).rejects.toThrow("source_actor_unbound");return;}
  const verify=await sourceOperatorVerifier(cohort);
  expect(await verify({id:kind==="wrong-person"?"other":cohort.operatorPersonId,email:"operator@example.test",graph_node_id:"legacy-person"})).toBe(["verified-email","declared-person"].includes(kind));
});
it("refuses identity authority outages",async()=>{
  global.fetch=jest.fn(async()=>new Response("",{status:503}));
  await expect(sourceOperatorVerifier(cohort)).rejects.toThrow("source_actor_authority_unavailable");
});

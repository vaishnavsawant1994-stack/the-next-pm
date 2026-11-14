#!/usr/bin/env node
// Run ONLY against disposable PostgreSQL test DBs. Synthetic announcement dates below are not real.
import assert from "node:assert/strict";
import pg from "pg";
import { execFileSync } from "node:child_process";

const url=process.env.DATABASE_URL;
if(!url)throw new Error("DATABASE_URL is required");
const dbName=decodeURIComponent(new URL(url).pathname.slice(1));
if(!dbName.endsWith("_test") && !dbName.endsWith("_ci")) {
  throw new Error("Refusing to run integration smoke test outside *_test / *_ci DB");
}
const pool=new pg.Pool({connectionString:url,max:2});
const env={...process.env,EDITORIAL_OPERATOR_ENABLED:"true",EDITORIAL_STAFF_BOOTSTRAP:"true"};
function cli(...args) {
  const out=execFileSync(process.execPath,["scripts/editorial.mjs",...args],{
    cwd:process.cwd(),encoding:"utf8",env
  }).trim();
  // CLI prints a Node object, so extract standard UUID from its output.
  const id=out.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
  assert.ok(id,"Editorial command must return a UUID: "+out);
  return id;
}
try {
  const base=await pool.query("SELECT count(*)::int AS n,sum(assembly_seat_count)::int AS seats FROM state_regions");
  assert.equal(base.rows[0].n,7);
  assert.equal(base.rows[0].seats,940);
  const cycles=await pool.query("SELECT status,official_poll_date FROM election_cycles WHERE election_year=2027");
  assert.equal(cycles.rowCount,7);
  assert.ok(cycles.rows.every(x=>x.status==="expected" && x.official_poll_date===null));

  const operator=cli("staff:add","ci-operator@the-next-pm.invalid","CI Operator","operator");
  const reviewer=cli("staff:add","ci-reviewer@the-next-pm.invalid","CI Reviewer","reviewer");
  const publisher=cli("staff:add","ci-publisher@the-next-pm.invalid","CI Publisher","publisher");
  const sourceId=(await pool.query(
    "SELECT id FROM source_documents WHERE source_url=$1",
    ["https://www.eci.gov.in/term-of-the-houses/"]
  )).rows[0].id;
  cli("source:verify",sourceId,reviewer,"verified","CI synthetic fixture: not actual ECI verification");
  // In this test database ONLY, the date simulates a reviewed official announcement.
  const request=cli("calendar:propose","goa","2027-03-01",sourceId,operator);
  cli("calendar:review",request,reviewer,"approved","CI fixture only");
  cli("calendar:publish",request,publisher);

  const goa=await pool.query("SELECT status,official_poll_date FROM election_cycles WHERE region_slug='goa' AND election_year=2027");
  assert.equal(goa.rows[0].status,"announced");
  assert.equal(goa.rows[0].official_poll_date.toISOString().slice(0,10),"2027-03-01");

  const audit=await pool.query("SELECT id FROM editorial_audit LIMIT 1");
  assert.ok(audit.rowCount>0);
  await assert.rejects(()=>pool.query("UPDATE editorial_audit SET event_type='mutated' WHERE id=$1",[audit.rows[0].id]));
  console.log("PASS: 7 planning states, 940 seats, verified source, 3-person review/publish, immutable audit.");
} finally {
  await pool.end();
}

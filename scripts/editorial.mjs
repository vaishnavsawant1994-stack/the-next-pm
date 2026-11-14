#!/usr/bin/env node
// Trusted operator command tool. This is NOT a production login or web CMS.
import pg from "pg";
import { assertOfficialEciUrl, assertPublishableAnnouncement, requireIndependentReviewer, requireRole, validatePollDate } from "../lib/editorial/policy.mjs";

if(!process.env.DATABASE_URL||process.env.EDITORIAL_OPERATOR_ENABLED!=="true"){
  console.error("Operator CLI is disabled. A dedicated DATABASE_URL and EDITORIAL_OPERATOR_ENABLED=true are required.");
  process.exit(1);
}
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2});
const [action,...args]=process.argv.slice(2);

async function transaction(fn){
  const c=await pool.connect();
  try {await c.query("BEGIN");const result=await fn(c);await c.query("COMMIT");return result;}
  catch(e){await c.query("ROLLBACK");throw e;}
  finally {c.release();}
}
async function one(c,sql,params){
  const row=(await c.query(sql,params)).rows[0];
  if(!row)throw new Error("Record not found");
  return row;
}
async function staff(c,id,roles){
  const row=await one(c,"SELECT * FROM staff_members WHERE id=$1 FOR UPDATE",[id]);
  requireRole(row,roles);return row;
}
async function audit(c,actor,event,entity,id,details={}){
  await c.query("INSERT INTO editorial_audit(actor_id,event_type,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5::jsonb)",
    [actor,event,entity,String(id),JSON.stringify(details)]);
}
async function main(){
  if(action==="staff:add"){
    if(process.env.EDITORIAL_STAFF_BOOTSTRAP!=="true")throw new Error("Staff provisioning needs EDITORIAL_STAFF_BOOTSTRAP=true on a trusted operator machine");
    const [email,name,role]=args;
    if(!email||!name||!["admin","operator","reviewer","publisher"].includes(role))throw new Error("Usage: staff:add email name admin|operator|reviewer|publisher");
    const result=await pool.query("INSERT INTO staff_members(email,display_name,role) VALUES($1,$2,$3) RETURNING id,email,role",[email.toLowerCase(),name,role]);
    console.log(result.rows[0]);return;
  }
  if(action==="source:add"){
    const [url,title,publisher,operator]=args;
    if(!url||!title||!publisher||!operator)throw new Error("Usage: source:add official_url title publisher operator_uuid");
    assertOfficialEciUrl(url);
    const r=await transaction(async c=>{
      await staff(c,operator,["admin","operator"]);
      const row=await c.query("INSERT INTO source_documents(source_url,title,publisher,type,created_by) VALUES($1,$2,$3,'official',$4) RETURNING id",[url,title,publisher,operator]);
      await audit(c,operator,"source_added","source_documents",row.rows[0].id,{url});
      return row.rows[0];
    });
    console.log(r);return;
  }
  if(action==="source:verify"){
    const [id,reviewer,decision,notes=""]=args;
    if(!id||!reviewer||!["verified","rejected"].includes(decision))throw new Error("Usage: source:verify source_uuid reviewer_uuid verified|rejected [notes]");
    const r=await transaction(async c=>{
      await staff(c,reviewer,["admin","reviewer"]);
      const source=await one(c,"SELECT * FROM source_documents WHERE id=$1 FOR UPDATE",[id]);
      if(source.review_status!=="pending")throw new Error("Only pending sources may be reviewed");
      if(source.created_by)requireIndependentReviewer(source.created_by,reviewer);
      assertOfficialEciUrl(source.source_url);
      const row=await c.query(
        "UPDATE source_documents SET review_status=$2,verified_by=$3,verified_at=CASE WHEN $2='verified' THEN now() ELSE NULL END,review_notes=$4 WHERE id=$1 RETURNING id,review_status",
        [id,decision,reviewer,notes]);
      await audit(c,reviewer,"source_reviewed","source_documents",id,{decision,notes});
      return row.rows[0];
    });
    console.log(r);return;
  }
  if(action==="calendar:propose"){
    const [slug,date,sourceId,operator]=args;
    if(!slug||!date||!sourceId||!operator)throw new Error("Usage: calendar:propose state_slug YYYY-MM-DD source_uuid operator_uuid");
    validatePollDate(date);
    const r=await transaction(async c=>{
      await staff(c,operator,["admin","operator"]);
      const election=await one(c,"SELECT * FROM election_cycles WHERE region_slug=$1 AND election_year=2027 AND chamber='assembly' FOR UPDATE",[slug]);
      if(election.status!=="expected")throw new Error("Election must currently be expected");
      const source=await one(c,"SELECT * FROM source_documents WHERE id=$1",[sourceId]);
      if(source.review_status!=="verified")throw new Error("Only independently verified sources may support announcements");
      assertOfficialEciUrl(source.source_url);
      const row=await c.query(
        "INSERT INTO editorial_changes(kind,region_slug,payload,source_id,submitted_by) VALUES('calendar_announcement',$1,$2::jsonb,$3,$4) RETURNING id,status",
        [slug,JSON.stringify({pollDate:date}),sourceId,operator]);
      await audit(c,operator,"calendar_proposed","editorial_changes",row.rows[0].id,{slug,date,sourceId});
      return row.rows[0];
    });
    console.log(r);return;
  }
  if(action==="calendar:review"){
    const [requestId,reviewer,decision,notes=""]=args;
    if(!requestId||!reviewer||!["approved","rejected"].includes(decision))throw new Error("Usage: calendar:review request_uuid reviewer_uuid approved|rejected [notes]");
    const r=await transaction(async c=>{
      await staff(c,reviewer,["admin","reviewer"]);
      const change=await one(c,"SELECT * FROM editorial_changes WHERE id=$1 FOR UPDATE",[requestId]);
      if(change.status!=="pending"||change.kind!=="calendar_announcement")throw new Error("Only pending calendar changes may be reviewed");
      requireIndependentReviewer(change.submitted_by,reviewer);
      const source=await one(c,"SELECT * FROM source_documents WHERE id=$1",[change.source_id]);
      if(source.review_status!=="verified")throw new Error("Source is not verified");
      assertOfficialEciUrl(source.source_url);validatePollDate(change.payload.pollDate);
      const row=await c.query("UPDATE editorial_changes SET status=$2,reviewed_by=$3,reviewed_at=now(),review_notes=$4 WHERE id=$1 RETURNING id,status",
        [requestId,decision,reviewer,notes]);
      await audit(c,reviewer,"calendar_reviewed","editorial_changes",requestId,{decision,notes});
      return row.rows[0];
    });
    console.log(r);return;
  }
  if(action==="calendar:publish"){
    const [requestId,publisher]=args;
    if(!requestId||!publisher)throw new Error("Usage: calendar:publish approved_request_uuid publisher_uuid");
    const r=await transaction(async c=>{
      await staff(c,publisher,["admin","publisher"]);
      const change=await one(c,"SELECT * FROM editorial_changes WHERE id=$1 FOR UPDATE",[requestId]);
      requireIndependentReviewer(change.submitted_by,publisher);
      requireIndependentReviewer(change.reviewed_by,publisher);
      const source=await one(c,"SELECT * FROM source_documents WHERE id=$1 FOR SHARE",[change.source_id]);
      const date=assertPublishableAnnouncement(change,source);
      const updated=await c.query(
        "UPDATE election_cycles SET status='announced',official_poll_date=$2::date,announcement_source_id=$3,published_at=now(),updated_at=now() WHERE region_slug=$1 AND election_year=2027 AND chamber='assembly' AND status='expected' RETURNING id,region_slug,status,official_poll_date",
        [change.region_slug,date,change.source_id]);
      if(!updated.rowCount)throw new Error("Election was updated by another editor; refused");
      await c.query("UPDATE editorial_changes SET status='published',published_by=$2,published_at=now() WHERE id=$1",[requestId,publisher]);
      await audit(c,publisher,"calendar_published","election_cycles",updated.rows[0].id,{requestId,date,sourceId:change.source_id});
      return updated.rows[0];
    });
    console.log(r);return;
  }
  throw new Error("Usage: staff:add | source:add | source:verify | calendar:propose | calendar:review | calendar:publish");
}
try{await main();}
catch(e){console.error(e.message);process.exitCode=1;}
finally{await pool.end();}

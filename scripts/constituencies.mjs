#!/usr/bin/env node
// Source-gated, operator-only importer. The default command only validates CSV.
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import pg from "pg";
import { validateConstituencyCsv } from "../lib/import/constituencies.mjs";
import { assertOfficialEciUrl, requireIndependentReviewer, requireRole } from "../lib/editorial/policy.mjs";

const [action,...args]=process.argv.slice(2);

async function getData(path) {
  const text=await readFile(path,"utf8");
  const states=JSON.parse(await readFile(new URL("../data/states-2027.json",import.meta.url),"utf8"));
  const capacities=Object.fromEntries(states.map(s=>[s.slug,s.seats]));
  const data=validateConstituencyCsv(text,capacities);
  return {...data,fileHash:createHash("sha256").update(text).digest("hex")};
}

async function main() {
  if(action==="validate") {
    if(!args[0])throw new Error("Usage: validate file.csv");
    const data=await getData(args[0]);
    console.log(JSON.stringify({region:data.regionSlug,rows:data.rows.length,sha256:data.fileHash,sample:data.rows.slice(0,3)},null,2));
    return;
  }
  if(!process.env.DATABASE_URL||process.env.EDITORIAL_OPERATOR_ENABLED!=="true"){
    throw new Error("Import/review/publish requires dedicated DATABASE_URL and EDITORIAL_OPERATOR_ENABLED=true in a trusted operator shell");
  }
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2});
  async function transaction(fn) {
    const c=await pool.connect();
    try {await c.query("BEGIN");const r=await fn(c);await c.query("COMMIT");return r;}
    catch(e){await c.query("ROLLBACK");throw e;}
    finally{c.release();}
  }
  async function one(c,sql,values) {
    const result=await c.query(sql,values);
    if(!result.rows[0])throw new Error("Required record not found");
    return result.rows[0];
  }
  async function staff(c,id,roles) {
    const row=await one(c,"SELECT * FROM staff_members WHERE id=$1 FOR UPDATE",[id]);
    requireRole(row,roles);return row;
  }
  async function audit(c,actor,event,kind,id,detail={}) {
    await c.query("INSERT INTO editorial_audit(actor_id,event_type,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5::jsonb)",
      [actor,event,kind,id,JSON.stringify(detail)]);
  }
  try {
    if(action==="submit") {
      const [path,sourceId,operatorId]=args;
      if(!path||!sourceId||!operatorId)throw new Error("Usage: submit file.csv verified_source_uuid operator_uuid");
      const data=await getData(path);
      const result=await transaction(async c=>{
        await staff(c,operatorId,["operator","admin"]);
        await one(c,"SELECT * FROM state_regions WHERE slug=$1 FOR UPDATE",[data.regionSlug]);
        const source=await one(c,"SELECT * FROM source_documents WHERE id=$1 FOR SHARE",[sourceId]);
        if(source.review_status!=="verified")throw new Error("Import source has not been independently verified");
        assertOfficialEciUrl(source.source_url);
        const batch=await c.query(
          "INSERT INTO constituency_import_batches(region_slug,source_id,original_file_sha256,row_count,submitted_by) VALUES($1,$2,$3,$4,$5) RETURNING id",
          [data.regionSlug,sourceId,data.fileHash,data.rows.length,operatorId]);
        const batchId=batch.rows[0].id;
        for(const row of data.rows) {
          await c.query(
            "INSERT INTO constituencies(region_slug,chamber,official_number,official_name,boundary_version,source_id,publication_status,import_batch_id) VALUES($1,'assembly',$2,$3,$4,$5,'draft',$6)",
            [row.regionSlug,row.number,row.name,row.boundaryVersion,sourceId,batchId]);
        }
        await audit(c,operatorId,"constituency_batch_submitted","constituency_import_batches",batchId,
          {region:data.regionSlug,rowCount:data.rows.length,sha256:data.fileHash});
        return {batchId,region:data.regionSlug,rows:data.rows.length,status:"pending"};
      });
      console.log(result);return;
    }
    if(action==="review") {
      const [batchId,reviewerId,decision,notes]=args;
      if(!batchId||!reviewerId||!["approved","rejected"].includes(decision)||!notes||notes.trim().length<20){
        throw new Error("Usage: review batch_uuid reviewer_uuid approved|rejected explanation_at_least_20_characters");
      }
      const result=await transaction(async c=>{
        await staff(c,reviewerId,["reviewer","admin"]);
        const batch=await one(c,"SELECT * FROM constituency_import_batches WHERE id=$1 FOR UPDATE",[batchId]);
        if(batch.status!=="pending")throw new Error("Only pending batches may be reviewed");
        requireIndependentReviewer(batch.submitted_by,reviewerId);
        const source=await one(c,"SELECT * FROM source_documents WHERE id=$1 FOR SHARE",[batch.source_id]);
        if(source.review_status!=="verified")throw new Error("Source not verified");
        assertOfficialEciUrl(source.source_url);
        const count=await c.query("SELECT count(*)::int AS count FROM constituencies WHERE import_batch_id=$1 AND publication_status='draft'",[batchId]);
        if(count.rows[0].count!==batch.row_count)throw new Error("Row-count mismatch; review refused");
        await c.query("UPDATE constituency_import_batches SET status=$2,reviewed_by=$3,reviewed_at=now(),review_notes=$4 WHERE id=$1",
          [batchId,decision,reviewerId,notes.trim()]);
        if(decision==="rejected"){
          // Draft-only rows; discarded records remain represented in the batch audit.
          await c.query("DELETE FROM constituencies WHERE import_batch_id=$1 AND publication_status='draft'",[batchId]);
        }
        await audit(c,reviewerId,"constituency_batch_reviewed","constituency_import_batches",batchId,{decision,notes:notes.trim()});
        return {batchId,status:decision};
      });
      console.log(result);return;
    }
    if(action==="publish") {
      const [batchId,publisherId]=args;
      if(!batchId||!publisherId)throw new Error("Usage: publish approved_batch_uuid publisher_uuid");
      const result=await transaction(async c=>{
        await staff(c,publisherId,["publisher","admin"]);
        const batch=await one(c,"SELECT * FROM constituency_import_batches WHERE id=$1 FOR UPDATE",[batchId]);
        if(batch.status!=="approved")throw new Error("Only approved batches may be published");
        requireIndependentReviewer(batch.submitted_by,publisherId);
        requireIndependentReviewer(batch.reviewed_by,publisherId);
        const source=await one(c,"SELECT * FROM source_documents WHERE id=$1 FOR SHARE",[batch.source_id]);
        if(source.review_status!=="verified")throw new Error("Source not verified");
        assertOfficialEciUrl(source.source_url);
        const published=await c.query("UPDATE constituencies SET publication_status='published' WHERE import_batch_id=$1 AND publication_status='draft' RETURNING id",[batchId]);
        if(published.rowCount!==batch.row_count)throw new Error("Incomplete draft batch, publication rolled back");
        await c.query("UPDATE constituency_import_batches SET status='published',published_by=$2,published_at=now() WHERE id=$1",[batchId,publisherId]);
        await audit(c,publisherId,"constituency_batch_published","constituency_import_batches",batchId,{rowCount:published.rowCount,sourceId:batch.source_id});
        return {batchId,status:"published",records:published.rowCount};
      });
      console.log(result);return;
    }
    throw new Error("Usage: validate | submit | review | publish");
  } finally {await pool.end();}
}
try{await main();}
catch(error){console.error(error.message);process.exitCode=1;}

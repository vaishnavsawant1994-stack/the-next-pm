#!/usr/bin/env node
// Use only with a dedicated The Next PM PostgreSQL database.
import pg from "pg";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const command=process.argv[2];
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. No database operation attempted.");
  process.exit(1);
}
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2});

async function migrate() {
  const client=await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(43717202)");
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (file_name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
    const files=(await readdir(new URL("../db/migrations/",import.meta.url))).filter(x=>x.endsWith(".sql")).sort();
    for(const file of files) {
      const sql=await readFile(new URL("../db/migrations/"+file,import.meta.url),"utf8");
      const sha=createHash("sha256").update(sql).digest("hex");
      const old=await client.query("SELECT sha256 FROM schema_migrations WHERE file_name=$1",[file]);
      if(old.rowCount) {
        if(old.rows[0].sha256!==sha) throw new Error("Previously applied migration changed: "+file);
        console.log("Already applied:",file);
        continue;
      }
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(file_name,sha256) VALUES($1,$2)",[file,sha]);
        await client.query("COMMIT");
        console.log("Applied:",file);
      } catch(e) {
        await client.query("ROLLBACK");
        throw e;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(43717202)").catch(()=>{});
    client.release();
  }
}

async function seed() {
  const states=JSON.parse(await readFile(new URL("../data/states-2027.json",import.meta.url),"utf8"));
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    const source=await client.query(
      "INSERT INTO source_documents(title,publisher,source_url,type,review_status,reuse_status) VALUES($1,$2,$3,'official','pending','link_only') ON CONFLICT(source_url) DO UPDATE SET title=EXCLUDED.title RETURNING id",
      ["Terms of the Houses","Election Commission of India","https://www.eci.gov.in/term-of-the-houses/"]
    );
    for(const state of states) {
      await client.query(
        "INSERT INTO state_regions(slug,name,assembly_seat_count,baseline_source_id) VALUES($1,$2,$3,$4) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,assembly_seat_count=EXCLUDED.assembly_seat_count,baseline_source_id=EXCLUDED.baseline_source_id,updated_at=now()",
        [state.slug,state.name,state.seats,source.rows[0].id]
      );
      await client.query(
        "INSERT INTO election_cycles(region_slug,election_year,chamber,expected_window,status) VALUES($1,2027,'assembly',$2,'expected') ON CONFLICT(region_slug,election_year,chamber) DO UPDATE SET expected_window=EXCLUDED.expected_window,updated_at=now()",
        [state.slug,state.wave]
      );
    }
    await client.query("COMMIT");
    console.log("Seeded 2027 planning states. ECI source remains pending independent human verification.");
  } catch(e) { await client.query("ROLLBACK");throw e; }
  finally {client.release();}
}

async function status() {
  const states=await pool.query("SELECT count(*)::int AS regions,coalesce(sum(assembly_seat_count),0)::int AS seats FROM state_regions");
  const cycles=await pool.query("SELECT status,count(*)::int AS total FROM election_cycles GROUP BY status ORDER BY status");
  const sources=await pool.query("SELECT review_status,count(*)::int AS total FROM source_documents GROUP BY review_status ORDER BY review_status");
  console.log(JSON.stringify({states:states.rows[0],cycles:cycles.rows,sources:sources.rows},null,2));
}

try {
  if(command==="migrate")await migrate();
  else if(command==="seed")await seed();
  else if(command==="status")await status();
  else throw new Error("Usage: node scripts/db.mjs migrate|seed|status");
} catch(e) {console.error(e.message);process.exitCode=1;}
finally {await pool.end();}

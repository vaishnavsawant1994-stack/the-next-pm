import { getDatabasePool } from "@/lib/server/db";
import {
  getStaffForHeaders, requireStaffRole, StaffAccessError, type StaffIdentity,
} from "@/lib/server/staff-access";
import {
  assertOfficialEciUrl, validatePollDate,
  requireIndependentReviewer, assertPublishableAnnouncement,
} from "@/lib/editorial/policy.mjs";
import type { PoolClient } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Input = Record<string, unknown>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slug = /^[a-z]+(?:-[a-z]+)*$/;
function str(body: Input, key: string, max = 400): string {
  const value = body[key];
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error("Invalid field: " + key);
  return value.trim();
}
function id(body: Input, key: string): string {
  const value = str(body, key, 36);
  if (!uuid.test(value)) throw new Error("Invalid record identifier");
  return value;
}
async function getRow(client: PoolClient, sql: string, params: unknown[]) {
  const result = await client.query(sql, params);
  if (!result.rows[0]) throw new Error("Requested record does not exist");
  return result.rows[0];
}
async function audit(client: PoolClient, actor: string, event: string, kind: string, value: string, details: Input) {
  await client.query(
    "INSERT INTO editorial_audit(actor_id,event_type,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5::jsonb)",
    [actor,event,kind,value,JSON.stringify(details)]
  );
}
async function execute(client: PoolClient, staff: StaffIdentity, body: Input) {
  const action = str(body,"action",40);

  if (action === "source:add") {
    requireStaffRole(staff,["operator","admin"]);
    const sourceUrl = assertOfficialEciUrl(str(body,"url",2048));
    const title = str(body,"title",300);
    const publisher = str(body,"publisher",200);
    const result = await client.query(
      "INSERT INTO source_documents(source_url,title,publisher,type,created_by,review_status) VALUES($1,$2,$3,'official',$4,'pending') RETURNING id",
      [sourceUrl,title,publisher,staff.id]
    );
    const newId = result.rows[0].id as string;
    await audit(client,staff.id,"source_proposed","source_documents",newId,{url:sourceUrl});
    return { id:newId, status:"pending" };
  }

  if (action === "source:review") {
    requireStaffRole(staff,["reviewer","admin"]);
    const sourceId = id(body,"id");
    const decision = str(body,"decision",10);
    const notes = str(body,"notes",1000);
    if (!["verified","rejected"].includes(decision) || notes.length < 20) throw new Error("A decision and explanation of at least 20 characters are required");
    const source = await getRow(client,"SELECT * FROM source_documents WHERE id=$1 FOR UPDATE",[sourceId]);
    if (source.review_status !== "pending") throw new Error("Source already reviewed");
    if (source.created_by) requireIndependentReviewer(source.created_by,staff.id);
    assertOfficialEciUrl(source.source_url);
    await client.query(
      "UPDATE source_documents SET review_status=$2,verified_by=$3,verified_at=CASE WHEN $2='verified' THEN now() ELSE NULL END,review_notes=$4 WHERE id=$1",
      [sourceId,decision,staff.id,notes]
    );
    await audit(client,staff.id,"source_reviewed","source_documents",sourceId,{decision,notes});
    return {id:sourceId,status:decision};
  }

  if (action === "calendar:propose") {
    requireStaffRole(staff,["operator","admin"]);
    const region = str(body,"region",80);
    if (!slug.test(region)) throw new Error("Invalid region identifier");
    const date = validatePollDate(str(body,"pollDate",10));
    const sourceId = id(body,"sourceId");
    const cycle = await getRow(client,
      "SELECT * FROM election_cycles WHERE region_slug=$1 AND election_year=2027 AND chamber='assembly' FOR UPDATE",
      [region]);
    if (cycle.status !== "expected") throw new Error("Election is no longer in expected state");
    const source = await getRow(client,"SELECT * FROM source_documents WHERE id=$1 FOR SHARE",[sourceId]);
    if (source.review_status !== "verified") throw new Error("Source is not independently verified");
    assertOfficialEciUrl(source.source_url);
    const result = await client.query(
      "INSERT INTO editorial_changes(kind,region_slug,payload,source_id,submitted_by) VALUES('calendar_announcement',$1,$2::jsonb,$3,$4) RETURNING id",
      [region,JSON.stringify({pollDate:date}),sourceId,staff.id]
    );
    const changeId = result.rows[0].id as string;
    await audit(client,staff.id,"calendar_proposed","editorial_changes",changeId,{region,pollDate:date,sourceId});
    return { id:changeId,status:"pending" };
  }

  if (action === "calendar:review") {
    requireStaffRole(staff,["reviewer","admin"]);
    const requestId = id(body,"id");
    const decision = str(body,"decision",10);
    const notes = str(body,"notes",1000);
    if (!["approved","rejected"].includes(decision) || notes.length < 20) throw new Error("A review decision and at least 20 characters of explanation are required");
    const change = await getRow(client,"SELECT * FROM editorial_changes WHERE id=$1 FOR UPDATE",[requestId]);
    if (change.kind !== "calendar_announcement" || change.status !== "pending") throw new Error("Only pending calendar changes can be reviewed");
    requireIndependentReviewer(change.submitted_by,staff.id);
    const source = await getRow(client,"SELECT * FROM source_documents WHERE id=$1 FOR SHARE",[change.source_id]);
    if (source.review_status !== "verified") throw new Error("The source was not verified");
    assertOfficialEciUrl(source.source_url);
    validatePollDate(change.payload.pollDate);
    await client.query(
      "UPDATE editorial_changes SET status=$2,reviewed_by=$3,reviewed_at=now(),review_notes=$4 WHERE id=$1",
      [requestId,decision,staff.id,notes]
    );
    await audit(client,staff.id,"calendar_reviewed","editorial_changes",requestId,{decision,notes});
    return {id:requestId,status:decision};
  }

  if (action === "calendar:publish") {
    requireStaffRole(staff,["publisher","admin"]);
    const requestId = id(body,"id");
    const change = await getRow(client,"SELECT * FROM editorial_changes WHERE id=$1 FOR UPDATE",[requestId]);
    requireIndependentReviewer(change.submitted_by,staff.id);
    requireIndependentReviewer(change.reviewed_by,staff.id);
    const source = await getRow(client,"SELECT * FROM source_documents WHERE id=$1 FOR SHARE",[change.source_id]);
    const pollDate = assertPublishableAnnouncement(change,source);
    const updated = await client.query(
      "UPDATE election_cycles SET status='announced',official_poll_date=$2::date,announcement_source_id=$3,published_at=now(),updated_at=now() WHERE region_slug=$1 AND election_year=2027 AND chamber='assembly' AND status='expected' RETURNING id",
      [change.region_slug,pollDate,change.source_id]
    );
    if (!updated.rowCount) throw new Error("The election is no longer in the expected state");
    await client.query(
      "UPDATE editorial_changes SET status='published',published_by=$2,published_at=now() WHERE id=$1",
      [requestId,staff.id]
    );
    await audit(client,staff.id,"calendar_published","election_cycles",updated.rows[0].id,{requestId,pollDate,sourceId:change.source_id});
    return {id:requestId,status:"published"};
  }

  throw new Error("Unsupported action");
}

export async function POST(request: Request) {
  const expected = process.env.BETTER_AUTH_URL;
  if (!expected || request.headers.get("origin") !== new URL(expected).origin) {
    return Response.json({error:"Invalid request origin"},{status:403,headers:{"Cache-Control":"no-store"}});
  }
  const length = Number(request.headers.get("content-length") || "0");
  if (length > 12_000 || !request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({error:"Invalid request payload"},{status:400});
  }
  let payload: Input;
  try {
    const text = await request.text();
    if (text.length > 12_000) throw new Error("Payload too large");
    const parsed: unknown = JSON.parse(text);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("Payload must be an object");
    payload = parsed as Input;
  } catch { return Response.json({error:"Invalid JSON payload"},{status:400}); }

  try {
    const {staff} = await getStaffForHeaders(request.headers);
    const pool = getDatabasePool();
    if (!pool) throw new StaffAccessError(503,"Database unavailable");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await execute(client,staff,payload);
      await client.query("COMMIT");
      return Response.json({ok:true,result},{headers:{"Cache-Control":"no-store"}});
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {client.release();}
  } catch (error) {
    if (error instanceof StaffAccessError) return Response.json({error:error.message},{status:error.status});
    if (error instanceof Error && /^(Invalid|Only|Source|The source|Election|A review|A decision|Unsupported|Insufficient|The election|Requested|Change|A different|An? )/.test(error.message)) {
      return Response.json({error:error.message},{status:400});
    }
    console.error("Editorial transaction failed");
    return Response.json({error:"Unable to process editorial change"},{status:500});
  }
}

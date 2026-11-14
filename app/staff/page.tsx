import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EditorialConsole, type SourceRecord, type ChangeRecord, type RegionRecord } from "@/components/staff/EditorialConsole";
import { getDatabasePool } from "@/lib/server/db";
import { getStaffForHeaders, StaffAccessError, isAuthConfigured } from "@/lib/server/staff-access";

export const metadata={title:"Editorial administration | The Next PM"};
export const dynamic="force-dynamic";

export default async function StaffDashboard() {
  if (!isAuthConfigured()) {
    return <div className="container page-shell readable">
      <span className="section-kicker">EDITORIAL SERVICE UNAVAILABLE</span>
      <h1 className="page-title">Staff administration is not configured</h1>
      <p>This service requires a dedicated database and securely provisioned authentication credentials.</p>
    </div>;
  }
  let staff;
  try {
    const result=await getStaffForHeaders(await headers());
    staff=result.staff;
  } catch(error) {
    if(error instanceof StaffAccessError) {
      if(error.status===401) redirect("/staff/sign-in");
      if(error.status===428) redirect("/staff/2fa");
      if(error.status===403) redirect("/staff/forbidden");
    }
    throw error;
  }
  const db=getDatabasePool();
  if(!db)throw new Error("Database unavailable");
  const [src,changes,regions]=await Promise.all([
    db.query(
      "SELECT id,title,publisher,source_url,review_status,captured_at::text,review_notes " +
      "FROM source_documents ORDER BY captured_at DESC LIMIT 100"
    ),
    db.query(
      "SELECT c.id,c.region_slug,c.status,c.payload->>'pollDate' AS proposed_poll_date," +
      "c.submitted_at::text,s.source_url,c.review_notes FROM editorial_changes c " +
      "JOIN source_documents s ON s.id=c.source_id ORDER BY c.submitted_at DESC LIMIT 100"
    ),
    db.query("SELECT r.slug,r.name,e.status FROM state_regions r JOIN election_cycles e ON e.region_slug=r.slug WHERE e.election_year=2027 ORDER BY r.name")
  ]);
  return <div className="container page-shell">
    <EditorialConsole
      name={staff.displayName}
      role={staff.role}
      sources={src.rows as SourceRecord[]}
      changes={changes.rows as ChangeRecord[]}
      regions={regions.rows as RegionRecord[]}
    />
  </div>;
}

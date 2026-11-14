import { getDatabasePool } from "./db";
import { states2027, type ElectionState } from "@/lib/elections";

export type StateCatalog = {
  states: ElectionState[];
  mode: "planning-fixture" | "postgresql";
};

export async function load2027StateCatalog(): Promise<StateCatalog> {
  const db = getDatabasePool();
  if (!db) return { states: states2027, mode: "planning-fixture" };

  // A data-entry mistake cannot turn an unverified source into an announced date.
  const result = await db.query(
    "SELECT r.slug,r.name,r.assembly_seat_count AS seats,e.expected_window AS wave, " +
      "CASE WHEN e.status='announced' AND src.review_status='verified' THEN 'announced' " +
      "WHEN e.status='completed' AND src.review_status='verified' THEN 'completed' " +
      "WHEN e.status='cancelled' THEN 'cancelled' ELSE 'expected' END AS status, " +
      "CASE WHEN e.status IN ('announced','completed') AND src.review_status='verified' " +
      "THEN e.official_poll_date::text ELSE NULL END AS \"pollDate\", " +
      "CASE WHEN src.review_status='verified' THEN src.source_url ELSE NULL END AS \"announcementSourceUrl\" " +
      "FROM election_cycles e JOIN state_regions r ON r.slug=e.region_slug " +
      "LEFT JOIN source_documents src ON src.id=e.announcement_source_id " +
      "WHERE e.election_year=2027 AND e.chamber='assembly' " +
      "ORDER BY CASE e.expected_window WHEN 'early-2027' THEN 0 ELSE 1 END,r.name"
  );
  const states: ElectionState[] = result.rows.map((row: {
    slug: string; name: string; seats: number; wave: string;
    status: ElectionState["status"]; pollDate: string | null;
    announcementSourceUrl: string | null;
  }) => ({
    slug: row.slug,
    name: row.name,
    seats: row.seats,
    wave: row.wave,
    status: row.status,
    pollDate: row.pollDate?.slice(0, 10) ?? null,
    announcementSourceUrl: row.announcementSourceUrl ?? null,
  }));

  // If DB is configured but unreachable or unseeded, return an explicit error
  // or empty-state rather than silently invent a live fallback.
  return { states, mode: "postgresql" };
}

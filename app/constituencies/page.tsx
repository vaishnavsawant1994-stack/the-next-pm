import Link from "next/link";
import type { Metadata } from "next";
import { getDatabasePool } from "@/lib/server/db";
import { states2027 } from "@/lib/elections";

export const metadata: Metadata={title:"Assembly constituency directory"};
export const dynamic="force-dynamic";
type Seat = {id:string;region_slug:string;state_name:string;official_number:number;official_name:string;source_url:string};

export default async function ConstituencyDirectory({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const query = await searchParams;
  const region = states2027.find(x=>x.slug===query.state)?.slug || null;
  const db = getDatabasePool();
  let seats: Seat[]=[];
  let total=0;
  if(db){
    const [rows,count]=await Promise.all([
      db.query(
        "SELECT c.id,c.region_slug,r.name AS state_name,c.official_number,c.official_name,s.source_url " +
        "FROM constituencies c JOIN state_regions r ON r.slug=c.region_slug " +
        "JOIN source_documents s ON s.id=c.source_id " +
        "WHERE c.publication_status='published' AND s.review_status='verified' " +
        "AND c.chamber='assembly' AND ($1::text IS NULL OR c.region_slug=$1) " +
        "ORDER BY r.name,c.official_number LIMIT 150",
        [region]
      ),
      db.query(
        "SELECT count(*)::int AS total FROM constituencies c JOIN source_documents s ON s.id=c.source_id " +
        "WHERE c.publication_status='published' AND s.review_status='verified' " +
        "AND c.chamber='assembly' AND ($1::text IS NULL OR c.region_slug=$1)",
        [region]
      ),
    ]);
    seats=rows.rows as Seat[];
    total=count.rows[0]?.total||0;
  }
  return <div className="container page-shell">
    <span className="section-kicker">SOURCE-VERIFIED DIRECTORY</span>
    <h1 className="page-title">Assembly constituencies</h1>
    <p className="page-intro">This directory shows only constituency records supported by a verified source and independently approved for publication. Unreviewed CSV imports remain private.</p>
    <form method="get" className="staff-form">
      <label htmlFor="filter-state">Filter by state</label>
      <select id="filter-state" name="state" defaultValue={region||""}>
        <option value="">All published states</option>
        {states2027.map(s=><option value={s.slug} key={s.slug}>{s.name}</option>)}
      </select>
      <button className="button button-outline" type="submit">Apply filter</button>
    </form>
    <div className="notice">
      {db ? total + " approved records available" : "Live database not configured. No verified constituency records are shown."}
      {total>seats.length ? " · Displaying the first 150, select a state to narrow the list." : ""}
    </div>
    {seats.length>0 ? <div className="card-grid">{seats.map(s=><article className="election-card" key={s.id}>
      <span className="section-kicker">{s.state_name} · Seat {s.official_number}</span>
      <h3><Link href={"/constituencies/"+s.region_slug+"/"+s.official_number}>{s.official_name}</Link></h3>
      <a href={s.source_url} className="text-link" target="_blank" rel="noopener noreferrer">Review original source ↗</a>
    </article>)}</div> : <p className="page-intro">No independently published constituency records are currently available. We do not display invented or provisional seat names.</p>}
  </div>;
}

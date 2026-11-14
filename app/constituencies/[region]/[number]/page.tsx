import { notFound } from "next/navigation";
import Link from "next/link";
import { getDatabasePool } from "@/lib/server/db";
import { states2027 } from "@/lib/elections";

export const dynamic="force-dynamic";
type Props={ params: Promise<{region:string;number:string}> };

async function fetchSeat(region:string,number:string) {
  if(!states2027.some(x=>x.slug===region)||!/^[1-9]\d{0,3}$/.test(number))return null;
  const db=getDatabasePool();
  if(!db)return null;
  const result=await db.query(
    "SELECT r.name AS state_name,c.official_name,c.official_number,c.boundary_version,s.source_url,s.title " +
    "FROM constituencies c JOIN state_regions r ON r.slug=c.region_slug JOIN source_documents s ON s.id=c.source_id " +
    "WHERE c.region_slug=$1 AND c.official_number=$2 AND c.chamber='assembly' AND c.publication_status='published' AND s.review_status='verified' " +
    "ORDER BY c.boundary_version DESC LIMIT 1",
    [region,Number(number)]
  );
  return result.rows[0]||null;
}

export async function generateMetadata({params}:Props){
  const {region,number}=await params;
  const seat=await fetchSeat(region,number);
  return {title:seat ? seat.official_name+" · Assembly constituency" : "Constituency not found"};
}
export default async function ConstituencyPage({params}:Props) {
  const {region,number}=await params;
  const seat=await fetchSeat(region,number);
  if(!seat)notFound();
  return <div className="container page-shell readable">
    <Link className="text-link" href={"/constituencies?state="+region}>← State constituency directory</Link>
    <span className="section-kicker">APPROVED ASSEMBLY CONSTITUENCY RECORD</span>
    <h1 className="page-title">{seat.official_name}</h1>
    <div className="detail-grid">
      <article className="info-panel"><span className="panel-kicker">STATE</span><h2>{seat.state_name}</h2></article>
      <article className="info-panel"><span className="panel-kicker">SEAT NUMBER</span><h2>{seat.official_number}</h2></article>
      <article className="info-panel"><span className="panel-kicker">BOUNDARY VERSION</span><h2>{seat.boundary_version}</h2></article>
    </div>
    <h2>Source and verification</h2>
    <p>Published from a reviewed source record: {seat.title}</p>
    <p><a href={seat.source_url} target="_blank" rel="noopener noreferrer">Open original source ↗</a></p>
    <div className="notice">Candidate nominations and election results are not published on this page until separately verified and approved. An official seat record does not imply candidate registration or a confirmed election date.</div>
  </div>;
}

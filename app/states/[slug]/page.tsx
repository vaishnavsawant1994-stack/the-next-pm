import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateBySlug, states2027 } from "@/lib/elections";

export function generateStaticParams() {
  return states2027.map((state) => ({ slug: state.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  return { title: state ? state.name + " 2027 Election" : "State not found" };
}

export default async function StateDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();
  const period = state.wave === "early-2027" ? "Early 2027" : "Late 2027";
  return (
    <div className="container page-shell">
      <Link href="/states" className="text-link">← Back to states</Link>
      <div className="detail-header">
        <div><span className="section-kicker">STATE ASSEMBLY ELECTION / EXPECTED</span><h1 className="page-title">{state.name}</h1><p className="page-intro">State election planning page. Official dates, finalized nominations and results will be added only after verification from original sources.</p></div>
        <div className="detail-number"><strong>{state.seats}</strong><span>Assembly constituencies</span></div>
      </div>
      <div className="detail-grid">
        <article className="info-panel"><span className="panel-kicker">PLANNING WINDOW</span><h2>{period}</h2><p>Expected election period. This is not an Election Commission polling notification.</p></article>
        <article className="info-panel"><span className="panel-kicker">OFFICIAL POLLING DATE</span><h2>Not verified here</h2><p>Refer to official Election Commission notices once released.</p></article>
        <article className="info-panel"><span className="panel-kicker">CANDIDATE RECORDS</span><h2>Awaiting sourced records</h2><p>Only officially documented nominations will be added, with dates and source links.</p></article>
      </div>
      <div className="notice detail-notice">This starter contains state-level planning data only. It does not yet contain a verified seat-by-seat candidate directory, official polling schedule, or results feed.</div>
      <h2>Authoritative references</h2>
      <ul className="resource-list">
        <li><a href="https://www.eci.gov.in/term-of-the-houses/" target="_blank" rel="noopener noreferrer">ECI — Terms of the Houses ↗</a></li>
        <li><a href="https://www.eci.gov.in/" target="_blank" rel="noopener noreferrer">Election Commission of India ↗</a></li>
        <li><Link href="/voter-guide">How to use official voter services →</Link></li>
      </ul>
    </div>
  );
}

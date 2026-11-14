import Link from "next/link";
import { ElectionCard } from "@/components/ElectionCard";
import { seatTotal2027, states2027 } from "@/lib/elections";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-halo" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow"><span className="pulse-dot" /> INDEPENDENT ELECTION INFORMATION</span>
            <h1>Understand democracy.<br /><span>Explore India's future.</span></h1>
            <p className="hero-lede">Election schedules, constituency information, public records and voter guidance — explained clearly and linked to their sources.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/elections">Explore 2027 elections <span aria-hidden="true">↗</span></Link>
              <Link className="button button-outline" href="/voter-guide">Voter information <span aria-hidden="true">→</span></Link>
            </div>
            <p className="hero-note">Independent platform · No candidate endorsements · Official dates are always distinguished from expected windows</p>
          </div>
          <aside className="hero-panel" aria-label="2027 election planning overview">
            <div className="panel-header"><span className="panel-kicker">ELECTION WATCH</span><span className="status-chip">Planning</span></div>
            <div className="panel-year">2027<span className="panel-year-caption">State Assembly Elections</span></div>
            <div className="panel-divider" />
            <div className="panel-stats">
              <div><strong>07</strong><span>Expected state cycles</span></div>
              <div><strong>{seatTotal2027}</strong><span>Assembly constituencies</span></div>
            </div>
            <div className="panel-divider" />
            <p className="panel-footnote">Polling dates have not been confirmed here. Check Election Commission notices for current official schedules.</p>
            <Link className="panel-link" href="/elections">View election directory <span aria-hidden="true">↗</span></Link>
          </aside>
        </div>
      </section>

      <section className="section section-divider">
        <div className="container">
          <div className="section-heading"><div><span className="section-kicker">ELECTION CALENDAR</span><h2>The road to 2027</h2><p>Browse expected state-election cycles. Detailed schedules will be updated only from official notices.</p></div><Link className="text-link" href="/states">All seven states ↗</Link></div>
          <div className="card-grid">{states2027.slice(0, 6).map((state) => <ElectionCard key={state.slug} state={state} />)}</div>
          <p className="source-note">Planning reference: <a href="https://www.eci.gov.in/term-of-the-houses/" target="_blank" rel="noopener noreferrer">ECI Terms of the Houses ↗</a>. The seven-state total includes Himachal Pradesh, whose Assembly term extends to January 2028.</p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-heading"><div><span className="section-kicker">OUR PRINCIPLES</span><h2>Information citizens can inspect</h2></div></div>
          <div className="feature-grid">
            <article className="feature"><span className="feature-index">01 /</span><h3>Evidence before headlines</h3><p>Original sources, dates, and corrections are part of the information — not hidden in footnotes.</p></article>
            <article className="feature"><span className="feature-index">02 /</span><h3>Clarity over prediction</h3><p>We distinguish an expected election window, an official announcement, a counting trend and a final result.</p></article>
            <article className="feature"><span className="feature-index">03 /</span><h3>Independent by design</h3><p>No endorsements, candidate rankings, simulated official voting or claimed government affiliation.</p></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container callout">
          <div><span className="section-kicker">VOTER EDUCATION</span><h2>Get information from the right source.</h2><p>Learn how to find official voter services, understand Assembly elections and follow ECI announcements.</p></div>
          <Link className="button button-primary" href="/voter-guide">Open the voter guide ↗</Link>
        </div>
      </section>
    </>
  );
}

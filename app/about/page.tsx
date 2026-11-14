import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container page-shell readable">
      <span className="section-kicker">OUR PURPOSE</span>
      <h1 className="page-title">About The Next PM</h1>
      <p className="page-intro">The Next PM is a planned independent Indian election and democracy information ecosystem, beginning with source-first coverage of expected 2027 Assembly elections.</p>
      <h2>Our commitments</h2>
      <div className="feature-grid">
        <article className="feature"><h3>Independent</h3><p>We are not the Election Commission, a government body or a political party.</p></article>
        <article className="feature"><h3>Factual</h3><p>We link to original sources and distinguish planning assumptions from confirmed events.</p></article>
        <article className="feature"><h3>Neutral</h3><p>We do not endorse candidates, publish arbitrary leader scores or tell people how to vote.</p></article>
      </div>
      <div className="notice">This is an early project foundation. The complete candidate directory, results operations, legal/policy pages and community features are future milestones, not claims of existing service.</div>
      <Link className="button button-outline" href="/sources">Read our source methodology →</Link>
    </div>
  );
}

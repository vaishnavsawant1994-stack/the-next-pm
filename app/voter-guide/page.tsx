import type { Metadata } from "next";

export const metadata: Metadata = { title: "Voter Guide" };

const resources = [
  { title: "Voter registration and services", detail: "Use the ECI Voters' Services Portal to check available voter services and official instructions.", url: "https://voters.eci.gov.in/" },
  { title: "Election schedules and notifications", detail: "Follow the Election Commission of India for official announcements and elections.", url: "https://www.eci.gov.in/" },
  { title: "Official counting and results", detail: "Use the ECI results site for published election results and check final documents when available.", url: "https://results.eci.gov.in/" },
];

export default function VoterGuidePage() {
  return (
    <div className="container page-shell readable">
      <span className="section-kicker">CIVIC EDUCATION</span>
      <h1 className="page-title">Voter guide</h1>
      <p className="page-intro">The Next PM explains election information, but does not register voters, check private electoral records, operate polling stations or conduct elections.</p>
      <div className="notice">For your own voter details, polling location, eligibility and official applications, rely on the Election Commission's services. Do not enter personal identification information on this site.</div>
      <div className="resource-grid">{resources.map((resource) => (
        <article className="info-panel" key={resource.url}>
          <h2>{resource.title}</h2><p>{resource.detail}</p><a className="text-link" href={resource.url} target="_blank" rel="noopener noreferrer">Open official service ↗</a>
        </article>
      ))}</div>
      <h2>How is the Prime Minister selected?</h2>
      <p>Voters elect Members of Parliament to the Lok Sabha. The President appoints the Prime Minister, generally the leader who can command the confidence of the Lok Sabha. An online poll on an independent website does not elect a Prime Minister.</p>
    </div>
  );
}

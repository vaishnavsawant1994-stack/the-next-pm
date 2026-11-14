import type { Metadata } from "next";
import { officialReferences } from "@/lib/elections";

export const metadata: Metadata = { title: "Sources and Methodology" };

export default function SourcesPage() {
  return (
    <div className="container page-shell readable">
      <span className="section-kicker">TRANSPARENCY</span>
      <h1 className="page-title">Sources & methodology</h1>
      <p className="page-intro">The Next PM prioritizes official records and transparent sourcing. This first version contains a curated, limited planning dataset; it is not a live Election Commission feed.</p>
      <h2>Primary references</h2>
      <ul className="resource-list">{officialReferences.map((ref) => <li key={ref.href}><a href={ref.href} rel="noopener noreferrer" target="_blank">{ref.label} ↗</a></li>)}</ul>
      <h2>What our labels mean</h2>
      <div className="label-list">
        <div><span className="status-chip">Expected</span><p>Projected election period based on legislative terms or ordinary electoral cycle. Not a confirmed polling date.</p></div>
        <div><span className="status-chip">Officially announced</span><p>Requires a dated official election notice and source link. This label is not yet used for 2027 in the starter dataset.</p></div>
        <div><span className="status-chip">Provisional</span><p>Counting trend that may change. Must not be shown as a final official result.</p></div>
        <div><span className="status-chip">Final</span><p>Requires the appropriate published official final record and a revision history.</p></div>
      </div>
      <h2>Corrections</h2>
      <p>Public factual records must include dates and sources. Editorial review, corrections, source-rights verification, and results ingestion are planned back-office workflows — they are not yet operational in this starter.</p>
    </div>
  );
}

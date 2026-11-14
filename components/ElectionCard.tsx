import Link from "next/link";
import type { ElectionState } from "@/lib/elections";

export function ElectionCard({ state }: { state: ElectionState }) {
  const wave = state.wave === "early-2027" ? "Early 2027" : "Late 2027";
  const published = (state.status === "announced" || state.status === "completed") && Boolean(state.pollDate && state.announcementSourceUrl);
  const statusLabel = published ? "Official announcement" : state.status === "cancelled" ? "Cancelled" : "Expected · not announced";
  const dateLabel = published ? "Polling: " + state.pollDate : wave + " window";
  return (
    <Link href={"/states/" + state.slug} className="election-card">
      <div className="card-top"><span className="status-chip">{statusLabel}</span><span aria-hidden="true" className="card-arrow">↗</span></div>
      <h3>{state.name}</h3>
      <div className="card-meta"><span>{state.seats} Assembly seats</span><span>{dateLabel}</span></div>
      <div className="card-foot">Explore state <span aria-hidden="true">→</span></div>
    </Link>
  );
}

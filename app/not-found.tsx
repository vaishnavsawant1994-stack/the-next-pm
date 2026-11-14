import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="container page-shell readable">
      <span className="section-kicker">404 / NOT FOUND</span>
      <h1 className="page-title">We could not find that page.</h1>
      <p className="page-intro">The Next PM is being built in stages. Try the election directory or return to the homepage.</p>
      <Link className="button button-primary" href="/elections">Browse elections →</Link>
    </div>
  );
}

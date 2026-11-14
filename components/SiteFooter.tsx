import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div><div className="footer-brand">THE NEXT PM</div><p>Independent, source-first information about India's elections and democratic institutions.</p></div>
        <div className="footer-links"><Link href="/elections">Elections</Link><Link href="/states">States</Link><Link href="/voter-guide">Voter guide</Link><Link href="/sources">Sources</Link></div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} The Next PM · thenextpm.in</span>
        <span>Not affiliated with the Election Commission of India or any political party. Not an official voting service.</span>
      </div>
    </footer>
  );
}

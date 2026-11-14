import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/elections", label: "Elections" },
  { href: "/states", label: "States" },
  { href: "/voter-guide", label: "Voter guide" },
  { href: "/sources", label: "Sources" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="The Next PM homepage">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span className="brand-word"><strong>THE NEXT PM</strong><small>India's Democracy Platform</small></span>
        </Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";
import { ReferenceFooter } from "@/components/reference-sections";
import { Assistant } from "@/components/assistant";
import "@/app/editorial.css";
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="editorial-nav">
        <Link className="contact-brand" href="/">
          SANCTUM <span>AI</span>
        </Link>
        <nav aria-label="Insights navigation">
          <Link href="/#services">Solutions</Link>
          <Link href="/#capabilities">AI &amp; ML</Link>
          <Link href="/blog">Insights</Link>
          <Link href="/contact">Let’s talk ↗</Link>
        </nav>
      </header>
      {children}
      <ReferenceFooter publicLinks />
      <Assistant />
    </>
  );
}

import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
export const metadata = {
  title: "Contact | Sanctum AI",
  description:
    "Discuss an automation project, request a demo or enquire about Sanctum AI services.",
};
export default async function Contact({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  return (
    <main className="contact-page">
      <Link href="/" className="contact-brand">
        SANCTUM AI
      </Link>
      <p className="eyebrow">INTELLIGENT BUSINESS SYSTEMS</p>
      <h1>Let’s talk about your business</h1>
      <p>
        Tell us what takes too much time. Request a meeting, demo or automation
        audit and the team will follow up.
      </p>
      <ContactForm service={typeof service === "string" ? service.slice(0, 200) : ""} />
      <p>
        <a href="mailto:hello@sanctum.ai">hello@sanctum.ai</a>
      </p>
      <Link href="/">← Back to website</Link>
    </main>
  );
}

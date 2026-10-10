"use client";
import { useState, useRef, useEffect } from "react";
import Script from "next/script";
type TurnstileWindow = Window & {
  turnstile?: {
    render: (
      element: HTMLElement,
      options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback": () => void;
      },
    ) => string;
    remove: (id: string) => void;
  };
};
function BotCheck({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const api = (window as TurnstileWindow).turnstile;
    const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (ready && api && ref.current && key) {
      widget.current = api.render(ref.current, {
        sitekey: key,
        callback: onToken,
        "expired-callback": () => onToken(""),
      });
      return () => {
        if (widget.current) api.remove(widget.current);
      };
    }
  }, [ready, onToken]);
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
      />
      <div ref={ref} />
    </>
  );
}
export function ContactForm({
  service = "",
  onClose,
}: {
  service?: string;
  onClose?: () => void;
}) {
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false),
    [token, setToken] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = event.currentTarget;
    try {
      const payload = Object.fromEntries(new FormData(form));
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, turnstile_token: token }),
      });
      const data = await response.json();
      if (!response.ok)
        setError(data.error ?? "Unable to submit. Please try again.");
      else {
        setMessage(data.message);
        form.reset();
      }
    } catch {
      setError(
        "Unable to connect. Please use the website email link or try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="enquiry-form" onSubmit={submit}>
      <div className="enquiry-grid">
        <label>
          Name *
          <input name="name" autoComplete="name" required maxLength={200} />
        </label>
        <label>
          Email *
          <input
            name="email"
            autoComplete="email"
            type="email"
            required
            maxLength={254}
          />
        </label>
        <label>
          Phone
          <input name="phone" autoComplete="tel" type="tel" maxLength={50} />
        </label>
        <label>
          Company
          <input name="company" autoComplete="organization" maxLength={200} />
        </label>
        <label>
          Website
          <input
            name="website"
            type="url"
            placeholder="https://"
            maxLength={200}
          />
        </label>
        <label>
          Estimated budget (NZD)
          <input
            name="estimated_budget"
            type="number"
            min="0"
            max="1000000000000"
            step="0.01"
          />
        </label>
        <label className="enquiry-wide">
          Requested service
          <input
            name="requested_service"
            defaultValue={service}
            maxLength={200}
          />
        </label>
        <label className="enquiry-wide">
          Tell us about your business task *
          <textarea
            name="message"
            minLength={10}
            maxLength={5000}
            required
            rows={4}
          />
        </label>
      </div>
      <label className="enquiry-honeypot" aria-hidden="true">
        Leave this blank
        <input name="website_confirm" tabIndex={-1} autoComplete="off" />
      </label>
      <p className="enquiry-note">
        Your details are sent to the Sanctum AI team to respond to this enquiry.
        Please avoid including sensitive customer data.
      </p>
      <BotCheck onToken={setToken} />
      {error && (
        <p className="enquiry-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="enquiry-success" role="status">
          {message}
        </p>
      )}
      <div className="enquiry-actions">
        <button
          className="lime-button"
          type="submit"
          disabled={pending || !!message}
        >
          {pending ? "Sending…" : "Send enquiry"}
        </button>
        {onClose && (
          <button type="button" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </form>
  );
}
export function ContactDialog({
  service,
  onClose,
}: {
  service: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="enquiry-dialog"
      aria-labelledby="enquiry-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <p className="eyebrow">SANCTUM AI / LET’S TALK</p>
      <h2 id="enquiry-title">Start a conversation</h2>
      <p>
        Request a demo, an automation audit or a meeting. We’ll review your
        enquiry and follow up; this form does not book a calendar slot.
      </p>
      <ContactForm
        service={service}
        onClose={() => {
          ref.current?.close();
          onClose();
        }}
      />
    </dialog>
  );
}

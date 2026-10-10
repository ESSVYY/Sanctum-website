"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";
export function Mfa({ enroll = false }: { enroll?: boolean }) {
  const router = useRouter();
  const [factor, setFactor] = useState(""),
    [qr, setQr] = useState(""),
    [code, setCode] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function begin() {
    setBusy(true);
    setMessage("");
    try {
      const db = browserClient();
      if (enroll) {
        const { data: factors } = await db.auth.mfa.listFactors();
        for (const pending of factors?.all.filter(
          (f) => f.status === "unverified",
        ) ?? [])
          await db.auth.mfa.unenroll({ factorId: pending.id });
        const { data, error } = await db.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Sanctum staff authenticator",
        });
        if (error || !data) throw new Error();
        setFactor(data.id);
        setQr(data.totp.qr_code);
      } else {
        const { data, error } = await db.auth.mfa.listFactors();
        const verified = data?.totp.find((f) => f.status === "verified");
        if (error || !verified) throw new Error();
        setFactor(verified.id);
      }
    } catch {
      setMessage(
        "Unable to prepare MFA. Sign in again or contact your administrator.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { error } = await browserClient().auth.mfa.challengeAndVerify({
        factorId: factor,
        code,
      });
      if (error) throw new Error();
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setMessage(
        "Invalid or expired code. Try the current code from your authenticator.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="crm-panel">
      <h2>{enroll ? "Add authenticator protection" : "Verify your session"}</h2>
      <p>
        {enroll
          ? "Scan the QR code with your authenticator app, then enter its six-digit code."
          : "Use the authenticator linked to your staff account."}
      </p>
      {!factor ? (
        <button className="crm-primary" onClick={begin} disabled={busy}>
          {enroll ? "Set up MFA" : "Continue with MFA"}
        </button>
      ) : (
        <form className="crm-form" onSubmit={verify}>
          {qr && (
            <Image
              src={qr}
              alt="Authenticator enrolment QR code"
              width={200}
              height={200}
              unoptimized
            />
          )}
          <label>
            Authentication code
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              pattern="[0-9]{6}"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
            />
          </label>
          <button className="crm-primary" disabled={busy}>
            Verify code
          </button>
        </form>
      )}
      {message && (
        <p role="alert" className="crm-error">
          {message}
        </p>
      )}
    </section>
  );
}

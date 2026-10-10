"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="crm-content">
      <h1>Workspace temporarily unavailable</h1>
      <p role="alert">
        Check the Supabase connection and migration setup, then retry. Your
        records have not been replaced with sample data.
      </p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}

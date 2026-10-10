"use client";
export default function BlogError({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="insights-page">
      <div className="editorial-container">
        <h1>Insights are temporarily unavailable</h1>
        <p>Please try again in a moment.</p>
        <button className="editorial-button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}

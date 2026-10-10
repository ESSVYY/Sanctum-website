export default function Loading() {
  return (
    <main
      className="crm-content"
      aria-label="Loading workspace"
      aria-busy="true"
    >
      <p>Loading your workspace…</p>
      <div className="crm-kpis">
        {[1, 2, 3, 4].map((i) => (
          <div className="crm-skeleton" key={i} />
        ))}
      </div>
    </main>
  );
}

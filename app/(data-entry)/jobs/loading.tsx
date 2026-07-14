export default function JobsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading jobs"
      className="grid min-h-0 flex-1 animate-pulse grid-cols-1 overflow-hidden lg:grid-cols-[310px_minmax(0,1fr)]"
    >
      <aside className="border-r bg-card/40 p-4">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="mt-4 h-11 rounded-lg bg-muted" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-xl border bg-card p-4">
              <div className="h-5 w-3/5 rounded bg-muted" />
              <div className="mt-3 h-4 w-4/5 rounded bg-muted" />
              <div className="mt-3 h-4 w-2/5 rounded bg-muted" />
            </div>
          ))}
        </div>
      </aside>

      <main className="hidden min-w-0 p-6 lg:block">
        <div className="ml-auto h-11 w-52 rounded-lg bg-muted" />
        <div className="mt-6 grid min-h-96 place-items-center rounded-xl border border-dashed bg-card/50">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-7 w-56 rounded bg-muted" />
            <div className="mx-auto h-4 w-80 max-w-full rounded bg-muted" />
          </div>
        </div>
      </main>
      <span className="sr-only">Loading jobs</span>
    </div>
  );
}

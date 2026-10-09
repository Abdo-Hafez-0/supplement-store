export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-page flex-1 flex-col gap-6 px-gutter py-section">
      <h1 className="text-3xl font-semibold">Supplement Store</h1>
      <p className="max-w-prose text-muted">
        Phase 1 prototype. The storefront arrives in milestone M2.
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-success px-3 py-1 text-white">success</span>
        <span className="rounded-full bg-warning px-3 py-1 text-black">warning</span>
        <span className="rounded-full bg-danger px-3 py-1 text-white">danger</span>
        <span className="rounded-md bg-accent px-3 py-1 text-accent-foreground">accent</span>
        <span className="rounded-lg border border-border bg-surface px-3 py-1">surface</span>
      </div>
    </main>
  );
}

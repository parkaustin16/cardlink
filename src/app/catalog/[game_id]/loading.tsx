export default function GameSetsLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col gap-8">
          <div className="space-y-3">
            <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-10 w-80 max-w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-6 w-72 max-w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
              >
                <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="mt-3 h-7 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

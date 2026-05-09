export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110f] text-white">
      <div className="w-full max-w-5xl space-y-6 p-6">
        <div className="h-10 w-64 animate-pulse rounded bg-white/10" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-lg bg-white/10" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-white/10" />
      </div>
    </main>
  );
}

"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110f] px-6 text-white">
      <div className="max-w-md rounded-lg border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-semibold">Something needs attention</h1>
        <p className="mt-3 text-sm text-white/70">
          The platform could not finish that request. Please retry, and the app
          will keep the error details out of the browser.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-semibold text-[#07110f]"
        >
          Retry
        </button>
      </div>
    </main>
  );
}

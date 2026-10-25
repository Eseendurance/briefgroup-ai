"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
      <div className="max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
        <h1 className="text-2xl font-semibold">Something needs attention</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The platform could not finish that request. Please retry, and the app
          will keep the error details out of the browser.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          Retry
        </button>
      </div>
    </main>
  );
}

"use client";

import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (loginError) {
      if (
        loginError instanceof FirebaseError &&
        ["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"].includes(
          loginError.code,
        )
      ) {
        setError("Those sign-in details don't match an account. Please try again.");
      } else {
        setError("We couldn't sign you in just now. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf8] px-5 py-10 text-slate-800">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Brief Group
        </Link>
        <section className="rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/brief-group-logo.svg"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 rounded-xl"
            />
            <span className="font-semibold text-slate-900">Brief Group</span>
          </Link>

          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-950">
            Good to have you back.
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sign in to pick up where your team left off.
          </p>

          <form className="mt-7 space-y-4" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 p-3 text-sm leading-5 text-rose-800"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing you in..." : "Sign in"}
              {!isLoading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2 text-xs leading-5 text-slate-500">
            <LockKeyhole
              className="h-4 w-4 shrink-0 text-emerald-700"
              aria-hidden="true"
            />
            Your account is protected by Firebase Authentication.
          </div>
          <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
            New to Brief Group?{" "}
            <Link
              href="/register"
              className="font-semibold text-emerald-800 hover:text-emerald-900"
            >
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

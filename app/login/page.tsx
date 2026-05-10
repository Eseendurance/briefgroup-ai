"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110f] px-5 py-10 text-white">
      <div className="grid w-full max-w-5xl gap-5 md:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.22em] text-emerald-200/70">
            Welcome back
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Login</h1>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Access your Brief Group AI dashboard, reports, inspections, and
            analytics.
          </p>

          <input
            type="email"
            placeholder="Email"
            className="mt-8 w-full rounded-lg border border-white/10 bg-black/30 p-4 outline-none transition focus:border-emerald-300"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="mt-4 w-full rounded-lg border border-white/10 bg-black/30 p-4 outline-none transition focus:border-emerald-300"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-emerald-400 p-4 font-semibold text-[#07110f] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait" : "Login"}
          </button>
        </section>

        <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] p-8 shadow-2xl backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.22em] text-emerald-200/70">
            New account
          </p>
          <h2 className="mt-3 text-4xl font-semibold">Sign Up</h2>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Create a real Firebase user account and go straight into the
            protected SaaS dashboard.
          </p>

          <input
            type="email"
            placeholder="Email"
            className="mt-8 w-full rounded-lg border border-white/10 bg-black/30 p-4 outline-none transition focus:border-emerald-300"
            onChange={(e) => setSignupEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="mt-4 w-full rounded-lg border border-white/10 bg-black/30 p-4 outline-none transition focus:border-emerald-300"
            onChange={(e) => setSignupPassword(e.target.value)}
          />

          <button
            onClick={handleSignup}
            disabled={loading}
            className="mt-6 w-full rounded-lg border border-emerald-300/50 p-4 font-semibold text-emerald-100 transition hover:bg-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait" : "Create Account"}
          </button>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Signed in");
    } catch (error) {
      console.error(error);
      alert("Login failed");
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="bg-white/5 border border-white/10 p-10 rounded-3xl w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8 text-center">Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-4 rounded-xl bg-black border border-white/10 mb-4"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 rounded-xl bg-black border border-white/10 mb-6"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 p-4 rounded-xl"
        >
          Login
        </button>
      </div>
    </main>
  );
}

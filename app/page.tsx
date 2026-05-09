"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">

          <h1 className="text-2xl font-bold tracking-wide">
            BRIEF GROUP
          </h1>

          <div className="hidden md:flex items-center gap-8 text-gray-300">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>

            <a href="#about" className="hover:text-white transition">
              About
            </a>

            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-40">

        <div className="absolute w-[500px] h-[500px] bg-blue-500/20 blur-3xl rounded-full top-10"></div>

        <motion.h1
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-6xl md:text-8xl font-bold leading-tight z-10"
        >
          AI Infrastructure
          <br />
          For The Future
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="mt-6 max-w-3xl text-lg md:text-2xl text-gray-300 z-10"
        >
          Smart Energy Monitoring, Farm Intelligence,
          Machine Fault Prediction & AI Inspection Systems.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex gap-6 mt-10 z-10"
        >
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 transition px-8 py-4 rounded-xl text-lg font-semibold"
          >
            Launch Dashboard
          </Link>

          <button className="border border-gray-500 hover:border-white transition px-8 py-4 rounded-xl text-lg">
            View Technology
          </button>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="px-6 md:px-20 py-24"
      >
        <h2 className="text-4xl font-bold text-center mb-16">
          Intelligent Infrastructure Platform
        </h2>

        <div className="grid md:grid-cols-3 gap-8">

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl"
          >
            <h3 className="text-2xl font-bold mb-4">
              Smart Energy AI
            </h3>

            <p className="text-gray-400">
              Real-time monitoring and prediction of
              high or low energy usage patterns.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl"
          >
            <h3 className="text-2xl font-bold mb-4">
              Smart Farm Prediction
            </h3>

            <p className="text-gray-400">
              AI climate intelligence for predicting
              planting season success and farm performance.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl"
          >
            <h3 className="text-2xl font-bold mb-4">
              Machine Fault Detection
            </h3>

            <p className="text-gray-400">
              Predict equipment failures before they happen
              using intelligent AI diagnostics.
            </p>
          </motion.div>

        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="px-6 md:px-20 py-24"
      >
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-xl">

          <h2 className="text-4xl font-bold mb-6">
            About BRIEF GROUP
          </h2>

          <p className="text-gray-300 text-lg leading-8">
            BRIEF GROUP is building next-generation AI infrastructure
            systems for smart energy management, intelligent agriculture,
            machine inspection and predictive industrial analytics.
            Our platform combines real-time monitoring,
            machine learning and scalable cloud systems to help
            organizations operate more efficiently and sustainably.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-10 text-center text-gray-500">
        © 2026 BRIEF GROUP. AI Infrastructure Platform.
      </footer>
    </main>
  );
}
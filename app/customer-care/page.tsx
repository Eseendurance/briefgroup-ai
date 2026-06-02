"use client";

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Mail,
  MessageCircle,
  Phone,
  Send,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

const quickQuestions = [
  "What does Brief Group do?",
  "How does Energy Monitoring work?",
  "Tell me about Smart Farm Prediction",
  "Can I upload inspection images?",
  "How do I contact customer care?",
  "Is Digital Marketplace available?",
];

const knowledgeBase = [
  {
    keywords: ["energy", "monitoring", "power", "electricity", "meter"],
    answer:
      "Brief Group Energy Monitoring helps teams track power usage, verify consumption, compare sites, and identify abnormal energy patterns from the dashboard.",
  },
  {
    keywords: ["farm", "farming", "crop", "soil", "irrigation", "weather"],
    answer:
      "Smart Farm Prediction combines weather, crop-health, soil-moisture, irrigation, and yield-risk signals so farm operators can make better planting and field decisions.",
  },
  {
    keywords: ["fault", "machine", "maintenance", "failure", "risk"],
    answer:
      "AI Fault Detection ranks machine and infrastructure risks before downtime happens. It gives teams confidence scores and practical maintenance actions.",
  },
  {
    keywords: ["report", "reports", "automated", "pdf", "summary"],
    answer:
      "Automated Reports turn energy, farm, fault, and inspection signals into readable summaries for managers, operators, and pilot customers.",
  },
  {
    keywords: ["inspection", "vision", "image", "camera", "upload", "photo"],
    answer:
      "Computer Vision Inspection lets users upload images or PDFs, queue evidence for inspection, and attach findings to operational records.",
  },
  {
    keywords: ["marketplace", "shop", "equipment", "buy", "sell"],
    answer:
      "The Digital Marketplace is marked Coming Soon. It is planned for trusted energy equipment, smart farm tools, services, and partner listings after the pilot phase.",
  },
  {
    keywords: ["contact", "email", "phone", "call", "support", "customer care"],
    answer:
      "You can contact Brief Group by email at briefgroup1@gmail.com or by phone/WhatsApp on +2348152158339.",
  },
  {
    keywords: ["login", "account", "sign up", "signup", "dashboard"],
    answer:
      "Users can create an account from the Login page, then access the protected dashboard to use Brief Group pilot tools.",
  },
];

function answerQuestion(question: string) {
  const normalized = question.toLowerCase();
  const match = knowledgeBase.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );

  if (match) return match.answer;

  return "I can help with Brief Group services, Energy Monitoring, Smart Farm Prediction, AI Fault Detection, Automated Reports, Computer Vision Inspection, Digital Marketplace, dashboard access, and contact details. For direct help, email briefgroup1@gmail.com or call +2348152158339.";
}

export default function CustomerCarePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hello, I am the Brief Group customer care assistant. Ask me about our platform, pilot program, dashboard, services, or how to contact the team.",
    },
  ]);
  const [input, setInput] = useState("");

  const latestTopic = useMemo(() => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    return lastUserMessage?.text || "Brief Group support";
  }, [messages]);

  function sendMessage(message = input) {
    const question = message.trim();
    if (!question) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: question },
      { role: "assistant", text: answerQuestion(question) },
    ]);
    setInput("");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f7fdff_0%,#e9fff4_38%,#edf4ff_68%,#fff8e8_100%)] text-[#102027]">
      <nav className="border-b border-white/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <Image
              src="/brief-group-logo.svg"
              alt="Brief Group logo"
              width={48}
              height={48}
              className="h-12 w-12 rounded-lg object-cover"
            />
            Brief Group
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-[#102027] px-5 py-3 text-sm font-semibold text-white"
          >
            Launch Dashboard
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-white bg-white/70 p-6 shadow-2xl shadow-emerald-100/70 backdrop-blur-xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
            <Bot className="h-4 w-4" />
            AI customer care
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
            Ask Brief Group anything.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            Get instant answers about Energy Monitoring, Smart Farm Prediction,
            AI Fault Detection, Automated Reports, Computer Vision Inspection,
            Digital Marketplace, and pilot onboarding.
          </p>

          <div className="mt-8 grid gap-3">
            <a
              href="mailto:briefgroup1@gmail.com"
              className="flex items-center gap-3 rounded-lg border border-white bg-white/75 p-4 shadow-sm"
            >
              <Mail className="h-5 w-5 text-emerald-700" />
              <span>briefgroup1@gmail.com</span>
            </a>
            <a
              href="tel:+2348152158339"
              className="flex items-center gap-3 rounded-lg border border-white bg-white/75 p-4 shadow-sm"
            >
              <Phone className="h-5 w-5 text-blue-700" />
              <span>+2348152158339</span>
            </a>
          </div>

          <div className="mt-8 rounded-lg bg-[#102027] p-5 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">
              Current topic
            </p>
            <p className="mt-3 text-lg font-semibold">{latestTopic}</p>
          </div>
        </motion.aside>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="overflow-hidden rounded-lg border border-white bg-white/75 shadow-2xl shadow-blue-100/70 backdrop-blur-xl"
          aria-label="Brief Group customer care chatbot"
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-white/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Brief Group Assistant</h2>
                <p className="text-sm text-slate-500">Online now</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Pilot support
            </span>
          </div>

          <div className="h-[520px] space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" ? (
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Bot className="h-4 w-4" />
                  </span>
                ) : null}
                <div
                  className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-[#102027] text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {message.text}
                </div>
                {message.role === "user" ? (
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                    <UserRound className="h-4 w-4" />
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 bg-white/80 p-5">
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800"
                >
                  {question}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                aria-label="Ask Brief Group customer care a question"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendMessage();
                }}
                placeholder="Type your question here..."
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400"
              />
              <button
                onClick={() => sendMessage()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
        </motion.section>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Fast product answers",
            "Pilot onboarding guidance",
            "Direct human contact",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-lg border border-white bg-white/70 p-5 shadow-lg shadow-slate-200/60 backdrop-blur-xl"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">{item}</span>
            </div>
          ))}
        </div>

        <Link
          href="/contact"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#102027] px-5 py-3 font-semibold text-white"
        >
          Go to Contact page
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}

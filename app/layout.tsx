import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Brief Group AI",
    template: "%s | Brief Group AI",
  },
  description:
    "Brief Group is a premium global SaaS platform for energy monitoring, smart farm prediction, AI fault detection, automated reports, and computer vision inspection.",
  keywords: [
    "Brief Group",
    "AI infrastructure",
    "energy monitoring",
    "smart farm prediction",
    "farm intelligence",
    "automated reports",
    "computer vision inspection",
    "customer care chatbot",
    "machine inspection",
    "predictive analytics",
  ],
  openGraph: {
    title: "Brief Group AI",
    description:
      "Premium SaaS for energy monitoring, smart farm prediction, AI fault detection, automated reports, computer vision inspection, and AI customer care.",
    type: "website",
  },
  icons: {
    icon: "/brief-group-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

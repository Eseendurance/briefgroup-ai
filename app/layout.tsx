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
    "Brief Group AI builds intelligent energy, farm, machine inspection, and infrastructure analytics systems.",
  keywords: [
    "Brief Group",
    "AI infrastructure",
    "energy monitoring",
    "farm intelligence",
    "machine inspection",
    "predictive analytics",
  ],
  openGraph: {
    title: "Brief Group AI",
    description:
      "AI infrastructure for energy monitoring, farm intelligence, inspection systems, and automated reporting.",
    type: "website",
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

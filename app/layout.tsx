import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Brief Group | Practical tools for people doing important work",
    template: "%s | Brief Group",
  },
  description:
    "Brief Group helps farming and industrial teams make sense of operations, act on useful signals, and keep people in the loop.",
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
    title: "Brief Group",
    description:
      "Practical tools for people doing important work in farming and industry.",
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
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

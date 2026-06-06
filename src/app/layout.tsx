import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { PageTransition } from "@/components/shared/PageTransition";

export const metadata: Metadata = {
  title: "agentlearn.fun",
  description: "Build AI agents from first principles using local LLMs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      </head>
      <body>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentParse — AI Resume Scraper & Parser",
  description: "Transform unstructured PDF resumes into structured, searchable candidate profiles in seconds. AI-powered parsing for recruiters.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f8f9fc] text-slate-900 antialiased">{children}</body>
    </html>
  );
}

import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polylogue — Story Design",
  description: "Co-design v5 stories with the orchestrator.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-full antialiased text-slate-900 bg-slate-50">{children}</body>
    </html>
  );
}

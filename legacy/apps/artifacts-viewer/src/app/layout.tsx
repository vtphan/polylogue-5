import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artifacts Viewer",
  description: "Read-only browser for Polylogue v2 story artifacts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}

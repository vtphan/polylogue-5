import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lens v1",
  description: "Shared-device discussion analysis for Polylogue Lens v1.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

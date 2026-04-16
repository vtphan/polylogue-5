import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lens v1.1",
  description: "Redesigned Lens student runtime",
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

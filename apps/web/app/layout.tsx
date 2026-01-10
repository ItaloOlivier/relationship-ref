import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relationship Referee - Shared Report",
  description: "View shared relationship coaching session reports and personality profiles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

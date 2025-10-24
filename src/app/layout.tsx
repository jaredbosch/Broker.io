import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MHC AI MVP",
  description: "Multifamily housing intelligence assistant"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <main className="min-h-screen mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}

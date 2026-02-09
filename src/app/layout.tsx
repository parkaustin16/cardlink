import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CardMart - Trading Card Marketplace",
  description: "Buy and sell trading cards from various games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Suspense
          fallback={
            <div className="bg-white border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-16" />
              </div>
            </div>
          }
        >
          <Navbar />
        </Suspense>
        <Suspense
          fallback={
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  );
}

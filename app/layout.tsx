import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { GameProvider } from "@/contexts/GameContext";
import Header from "@/components/ui/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scripture Memory Game - Memorize Bible Verses",
  description: "A fun, competitive Bible verse memorization game with flashcards, matching, and fill-in-the-blanks modes. Track your progress and master God's Word!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        <AuthProvider>
          <GameProvider>
            <div className="min-h-screen bg-gradient-to-b from-stone-50 to-orange-50/30">
              <Header />
              <main className="pb-12">{children}</main>
              <footer className="border-t border-gray-100 bg-white/50 py-6 text-center text-sm text-gray-400">
                <p>Scripture Memory Game &mdash; Memorize God&apos;s Word with joy</p>
              </footer>
            </div>
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

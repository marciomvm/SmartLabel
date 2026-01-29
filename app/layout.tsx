import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mushroom MVP",
  description: "Mushroom Factory Production System",
  manifest: "/manifest.json", // Prepare for PWA
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} font-outfit antialiased min-h-screen mesh-gradient`}
      >
        <Header />
        <main className="container max-w-lg mx-auto md:max-w-4xl p-6 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}

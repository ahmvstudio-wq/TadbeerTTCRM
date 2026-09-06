import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tadbeer CRM | Business Development Operating System",
  description: "Internal Business Development and CRM Operating System for Tadbeer TT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${inter.className} h-full antialiased font-sans`}>
      <body className={`${inter.className} min-h-full font-sans`}>{children}</body>
    </html>
  );
}

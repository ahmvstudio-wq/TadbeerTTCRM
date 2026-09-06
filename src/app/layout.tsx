import type { Metadata } from "next";
import { Poppins, Geist } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["200", "300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
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
    <html lang="en" className={`${poppins.variable} ${geist.variable} h-full antialiased`}>
      <body className="min-h-full font-sans antialiased text-[#0c0d0f] bg-[#fbfbfd]">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Manajemen Kebersihan Kantor",
  description: "Sistem monitoring kebersihan kantor terintegrasi untuk manajemen pegawai dan jadwal inspeksi",
  keywords: ["kebersihan", "kantor", "manajemen", "monitoring", "inspeksi", "pegawai"],
  authors: [{ name: "Cleaning Management Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Manajemen Kebersihan Kantor",
    description: "Sistem monitoring kebersihan kantor terintegrasi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Manajemen Kebersihan Kantor",
    description: "Sistem monitoring kebersihan kantor terintegrasi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

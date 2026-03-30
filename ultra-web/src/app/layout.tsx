import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MobileShell } from "@/features/navigation/components/MobileShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ultra",
  description: "Predictable, affordable rides",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col items-center bg-background">
        <div className="w-full max-w-[430px] min-h-screen flex flex-col shadow-lg bg-card">
          <MobileShell>{children}</MobileShell>
        </div>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DropLet | Connect Privately",
  description: "Anonymous social network for university students.",
  icons: {
    icon: "/android/android-launchericon-192-192.png",
    apple: "/ios/180.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Droplet",
  },
};

export const viewport: Viewport = {
  themeColor: "#f0f2f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="fixed inset-0 -z-10 bg-[#f0f2f5]">
        </div>
        <Navbar />
        {children}
      </body>
    </html>
  );
}

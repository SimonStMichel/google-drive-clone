import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";


import { AuthProvider } from "@/lib/auth/auth-context";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StoreIt - file storage & sharing",
  description:
    "A Google Drive-style file manager built with Next.js and Supabase: upload, preview, share and manage files with per-user access control.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-poppins antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

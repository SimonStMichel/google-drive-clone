import type { Metadata } from "next";
// import { Poppins } from "next/font/google";
import "./globals.css";


import { AuthProvider } from "@/lib/auth/auth-context";

// const poppins = Poppins({
//   subsets: ["latin"],
//   weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
//   variable: "--font-poppins"
// });

export const metadata: Metadata = {
  title: "Google drive clone",
  description: "Storage app personal project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={" font-poppins antialiased"}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

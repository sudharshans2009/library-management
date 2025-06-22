import React from "react";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme";
import "./globals.css";
import Navbar from "@/components/navbar";
import { QueryProvider } from "@/components/providers/query";
import { Toaster } from "@/components/ui/sonner";
import Footer from "@/components/footer";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  description: "A blank template using Payload in a Next.js app.",
  title: "Payload Blank Template",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(poppins.className, "antialiased")}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            <Navbar />
            {children}
            <Footer />
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

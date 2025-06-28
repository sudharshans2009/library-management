import React, { Suspense } from "react";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme";
import "./globals.css";
import Navbar from "@/components/navbar";
import { QueryProvider } from "@/components/providers/query";
import { Toaster } from "@/components/ui/sonner";
import Footer from "@/components/footer";
import LoadingPage from "./loading";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  description:
    "Advanced Library Management System with user authentication and book borrowing.",
  title: "SS.Library - Library Management System",
};

export default async function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(poppins.className, "antialiased")}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Suspense fallback={<LoadingPage />}>
          <QueryProvider>
            <ThemeProvider>
              <Navbar />
              {children}
              {modal}
              <Footer />
              <Toaster position="bottom-right" richColors />
            </ThemeProvider>
          </QueryProvider>
        </Suspense>
      </body>
    </html>
  );
}

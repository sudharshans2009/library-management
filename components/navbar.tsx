// components/navbar.tsx
import React, { Suspense } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import { db } from "@/database/drizzle";
import { config } from "@/database/schema";
import { eq } from "drizzle-orm";
import { User } from "lucide-react";
import UserDropdown from "./user-dropdown";
import { ThemeSwitcher } from "./theme-switcher";

async function NavbarContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let userConfig = null;
  if (session?.user) {
    try {
      const [dbConfig] = await db
        .select()
        .from(config)
        .where(eq(config.userId, session.user.id))
        .limit(1);
      userConfig = dbConfig;
    } catch (error) {
      console.error("Error fetching user config:", error);
    }
  }

  const isAdmin =
    userConfig?.role === "ADMIN" || userConfig?.role === "MODERATOR";

  return (
    <nav className="bg-background/80 backdrop-blur-md border-b border-border/40 fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">SS</span>
              </div>
              <span className="font-bold text-xl">Library</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/books"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Books
            </Link>
            {session?.user && (
              <>
                <Link
                  href="/dashboard"
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/requests"
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  Requests
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-foreground/80 hover:text-foreground transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <ThemeSwitcher />
            {session?.user ? (
              <UserDropdown
                user={session.user}
                config={{ role: userConfig?.role }}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <nav className="bg-background/80 backdrop-blur-md border-b border-border/40 fixed top-0 w-full z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary rounded-lg"></div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </nav>
      }
    >
      <NavbarContent />
    </Suspense>
  );
}

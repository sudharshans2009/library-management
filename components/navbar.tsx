"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Button } from "./ui/button";
import {
  BookOpen,
  Home,
  LayoutDashboard,
  List,
  UserCircle,
  X,
  Shield,
} from "lucide-react";
import { ThemeSwitcher } from "./theme-switcher";
import { authClient } from "@/lib/auth/client";
import { siteLinks, adminLinks } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { getUserWithConfig } from "@/actions/account";

const { useSession } = authClient;

export default function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const session = useSession();

  // Fetch user config to check role
  const { data: userWithConfig } = useQuery({
    queryKey: ["userWithConfig"],
    queryFn: getUserWithConfig,
    enabled: !!session.data?.user, // Only fetch if user is logged in
  });

  const isAdmin = userWithConfig?.config?.role === "ADMIN";

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 w-screen px-5 py-6 z-50 transition-all duration-500",
        scrolled ? "bg-primary/10 backdrop-blur-md shadow-lg" : "bg-primary/0"
      )}
    >
      <div className="w-full h-full flex items-center justify-between max-w-7xl xl:mx-auto">
        <Link className="text-2xl font-bold text-primary" href="/">
          SS.library
        </Link>
        <div className="flex items-center gap-4 h-9">
          <div className="hidden sm:flex items-center gap-4">
            {session.data?.user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="h-9">
                    <Button variant="outline" size="sm" className="h-9">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard/account" className="h-9">
                  <Button variant="outline" size="sm" className="h-9">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Account
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2 h-9">
                <Link href="/sign-in" className="h-9">
                  <Button variant="outline" size="sm" className="h-9">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" className="h-9">
                  <Button size="sm" className="h-9">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <ThemeSwitcher />
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <List className="w-4 h-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="z-60 !w-full sm:w-80 h-full overflow-y-scroll overflow-x-hidden">
              <DrawerClose className="absolute top-5 right-5" asChild>
                <Button variant="outline" size="icon">
                  <X className="w-12 h-12" />
                </Button>
              </DrawerClose>
              <div className="flex flex-col gap-8 p-8">
                <DrawerHeader className="flex flex-col gap-5 p-0">
                  <DrawerTitle asChild>
                    <h2 className="text-2xl text-primary font-bold">
                      Welcome to SS.library
                    </h2>
                  </DrawerTitle>
                  <DrawerDescription asChild>
                    <p className="text-muted !text-base">
                      Explore the sections of the library.
                    </p>
                  </DrawerDescription>
                </DrawerHeader>

                {/* Main Navigation Links */}
                <div className="flex flex-col gap-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <List className="w-5 h-5" />
                      Navigation
                    </h3>
                  {siteLinks.map((item) => (
                    <DrawerClose key={item.label} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                        )}
                      >
                        <item.icon className="inline-block mr-2 w-5 h-5" />
                        {item.label}
                      </Link>
                    </DrawerClose>
                  ))}
                </div>

                {/* Admin Links - Only show if user is admin */}
                {session.data?.user && isAdmin && (
                  <div className="flex flex-col gap-6">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Admin Panel
                    </h3>
                    {adminLinks.map((item) => (
                      <DrawerClose key={item.label} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                          )}
                        >
                          <item.icon className="inline-block mr-2 w-5 h-5" />
                          {item.label}
                        </Link>
                      </DrawerClose>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-5 mt-8">
                  {session.data?.user ? (
                    <>
                      <DrawerClose asChild>
                        <Link href="/dashboard">
                          <Button size="lg" className="w-full">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Dashboard
                          </Button>
                        </Link>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Link href="/dashboard/account">
                          <Button
                            variant="secondary"
                            size="lg"
                            className="w-full"
                          >
                            <UserCircle className="w-4 h-4 mr-2" />
                            Account
                          </Button>
                        </Link>
                      </DrawerClose>
                      {isAdmin && (
                        <DrawerClose asChild>
                          <Link href="/admin">
                            <Button
                              variant="outline"
                              size="lg"
                              className="w-full"
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Admin Panel
                            </Button>
                          </Link>
                        </DrawerClose>
                      )}
                    </>
                  ) : (
                    <>
                      <DrawerClose asChild>
                        <Link href="/sign-up">
                          <Button size="lg" className="w-full">
                            Sign Up
                          </Button>
                        </Link>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Link href="/sign-in">
                          <Button
                            variant="secondary"
                            size="lg"
                            className="w-full"
                          >
                            Sign In
                          </Button>
                        </Link>
                      </DrawerClose>
                    </>
                  )}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </nav>
  );
}

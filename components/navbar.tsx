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
} from "lucide-react";
import { ThemeSwitcher } from "./theme-switcher";
import { authClient } from "@/lib/auth/client";
const { useSession } = authClient;

export default function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const session = useSession();

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 w-full px-5 py-6 z-50 transition-all duration-500",
        scrolled ? "bg-primary/10 backdrop-blur-md shadow-lg" : "bg-primary/0"
      )}
    >
      <div className="w-full h-full flex items-center justify-between max-w-7xl xl:mx-auto">
        <Link className="text-2xl font-bold text-primary" href="/">
          SS.library
        </Link>
        <div className="flex items-center gap-4 h-9">
          {session.data?.user ? (
            <Link href="/account" className="h-9">
              <Button variant="outline" size="sm" className="h-9">
                <UserCircle className="w-4 h-4 mr-2" />
                Account
              </Button>
            </Link>
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
          <ThemeSwitcher />
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <List className="w-12 h-12" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="z-60 !w-full sm:w-80 h-full">
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
                <div className="flex flex-col gap-6">
                  {[
                    {
                      label: "Home",
                      href: "/",
                      icon: Home,
                    },
                    {
                      label: "Dashboard",
                      href: "/dashboard",
                      icon: LayoutDashboard,
                    },
                    {
                      label: "Books",
                      href: "/books",
                      icon: BookOpen,
                    },
                    {
                      label: "About",
                      href: "/about",
                      icon: UserCircle,
                    },
                  ].map((item) => (
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
                <div className="flex flex-col gap-5 mt-8">
                  {session.data?.user ? (
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
                  ) : (
                    <>
                      <DrawerClose asChild>
                        <Link href="/dashboard">
                          <Button size="lg" className="w-full">
                            Dashboard
                          </Button>
                        </Link>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Link href="/account">
                          <Button
                            variant="secondary"
                            size="lg"
                            className="w-full"
                          >
                            Account
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

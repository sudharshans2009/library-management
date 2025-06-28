import React from "react";
import Link from "next/link";
import {
  Book,
  Mail,
  MapPin,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Github,
  FileText,
  MessageSquare,
} from "lucide-react";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "GitHub", icon: Github, href: "https://github.com" },
];

const quickLinks = [
  { name: "Books", href: "/books", icon: Book },
  { name: "Dashboard", href: "/dashboard", icon: FileText },
  { name: "Requests", href: "/requests", icon: MessageSquare },
];

const supportLinks = [
  { name: "Contact Us", href: "/contact", icon: Mail },
  { name: "Library Rules", href: "/rules", icon: FileText },
  { name: "FAQ", href: "/faq", icon: MessageSquare },
];

export default async function Footer() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <footer className="bg-muted/50 border-t border-border/40 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">SS</span>
              </div>
              <span className="font-bold text-xl">Library</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your comprehensive library management system. Discover, borrow,
              and manage books with ease.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={link.name}
                >
                  <link.icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Quick Links
            </h3>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={session?.user ? link.href : "/sign-in"}
                    className="flex gap-2 items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <link.icon className="w-4 h-4 text-primary" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Support
            </h3>
            <ul className="space-y-4">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={session?.user ? link.href : "/sign-in"}
                    className="flex gap-2 items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <link.icon className="w-4 h-4 text-primary" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Get in Touch
            </h3>
            <div className="space-y-4">
              <p className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-5 h-5 text-primary" />
                contact@sslibrary.com
              </p>
              <p className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-5 h-5 text-primary" />
                +1 (555) 123-4567
              </p>
              <p className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                123 Library St.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border/40 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SS.Library. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

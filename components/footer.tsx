import React from "react";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { Background } from "@/components/background";
import { infoLinks, siteLinks, socialLinks } from "@/constants";

export default async function Footer() {
  return (
    <main className="relative w-full h-full px-5 py-4 z-10">
      <div className="flex flex-col items-center max-w-7xl mx-auto">
        <footer
          id="footer"
          className="relative w-full h-full flex flex-col items-center justify-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 py-16">
            <div className="space-y-6">
              <Link href="/" className="inline-block">
                <span className="text-2xl font-bold text-primary">
                  SS.library
                </span>
              </Link>
              <p className="text-gray-300 max-w-sm">
                Creating digital experiences that combine creativity with
                technical excellence.
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.url}
                    aria-label={social.name}
                    className="p-2 rounded-lg bg-primary/10 text-primary transition-colors"
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-6">
                Quick Links
              </h3>
              <ul className="space-y-4">
                {siteLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="flex gap-2 items-center text-gray-400 hover:text-primary transition-colors"
                    >
                      <link.icon className="w-5 h-5 text-primary" />{" "}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-6">
                Information
              </h3>
              <ul className="space-y-4">
                {infoLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="flex gap-2 items-center text-gray-400 hover:text-primary transition-colors"
                    >
                      <link.icon className="w-5 h-5 text-primary" />{" "}
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-6">
                Get in Touch
              </h3>
              <div className="space-y-4">
                <p className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-5 h-5 text-primary" />
                  contact@sudharshans.me
                </p>
                <p className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-5 h-5 text-primary" />
                  TN, India
                </p>
              </div>
            </div>
          </div>
          <div className="border-t w-full border-gray-800 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-gray-300 text-sm">
                © {new Date().getFullYear()} Sudharshan S. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

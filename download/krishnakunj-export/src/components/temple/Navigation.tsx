"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/temple-config";

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-warm-white/90 backdrop-blur-md border-b border-light-beige">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <a
            href="/"
            className="text-elegant-orange font-bold text-lg sm:text-xl tracking-tight leading-tight"
          >
            कृष्णकुंज माँ कर्मा धाम
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-muted-brown hover:text-elegant-orange rounded-lg hover:bg-warm-ivory transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/donate"
              className="ml-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-elegant-orange hover:bg-soft-saffron text-white text-sm font-semibold rounded-full transition-colors"
            >
              🙏 अभी दान करें
            </a>
          </div>

          {/* Mobile: Donation CTA + Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <a
              href="/donate"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-elegant-orange hover:bg-soft-saffron text-white text-xs font-semibold rounded-full transition-colors"
            >
              🙏 दान करें
            </a>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-muted-brown hover:text-elegant-orange hover:bg-warm-ivory rounded-lg transition-colors"
              aria-label={mobileOpen ? "मेनू बंद करें" : "मेनू खोलें"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-light-beige bg-warm-white pb-4 pt-2">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-muted-brown hover:text-elegant-orange hover:bg-warm-ivory rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/donate"
                onClick={() => setMobileOpen(false)}
                className="mx-4 mt-2 inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-elegant-orange hover:bg-soft-saffron text-white text-sm font-semibold rounded-full transition-colors"
              >
                🙏 अभी दान करें
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

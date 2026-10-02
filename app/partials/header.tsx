"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredSession } from "@/lib/session";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    if (session && session.user) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-md border-b border-white/10 transition-colors">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/landingpage" className="flex items-center gap-2.5 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Sentinel Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span className="text-2xl font-bold tracking-tight text-[#54f4fc] group-hover:brightness-110 transition-all">
            Sentinel
          </span>
        </Link>


        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-300">
          <Link
            href="#pricing"
            className="hover:text-[#54f4fc] transition-colors"
          >
            Pricing
          </Link>

          <div className="relative group flex items-center cursor-pointer hover:text-[#54f4fc] transition-colors">
            <span>Features</span>
            <svg
              className="w-3.5 h-3.5 ml-1 transition-transform group-hover:rotate-180 text-gray-400 group-hover:text-[#54f4fc]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <div className="absolute top-full left-0 mt-2 w-48 bg-[#090d14] border border-cyan-900/50 rounded-lg p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <Link
                href="#services"
                className="block px-3 py-2 text-xs text-gray-300 hover:text-[#54f4fc] hover:bg-cyan-950/40 rounded"
              >
                IAM Services
              </Link>
              <Link
                href="#services"
                className="block px-3 py-2 text-xs text-gray-300 hover:text-[#54f4fc] hover:bg-cyan-950/40 rounded"
              >
                Device Management
              </Link>
              <Link
                href="#services"
                className="block px-3 py-2 text-xs text-gray-300 hover:text-[#54f4fc] hover:bg-cyan-950/40 rounded"
              >
                MFA & Audit
              </Link>
              <Link
                href="/docs"
                className="block px-3 py-2 text-xs text-gray-300 hover:text-[#54f4fc] hover:bg-cyan-950/40 rounded"
              >
                Developer API & Docs
              </Link>
            </div>
          </div>

          <Link
            href="#developers"
            className="hover:text-[#54f4fc] transition-colors"
          >
            API Integration
          </Link>
          <Link
            href="/docs"
            className="hover:text-[#54f4fc] transition-colors"
          >
            Docs
          </Link>
          <Link
            href="#faq"
            className="hover:text-[#54f4fc] transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="#services"
            className="hover:text-[#54f4fc] transition-colors"
          >
            Services
          </Link>
          <Link
            href="/dw"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#54f4fc] transition-colors"
          >
            Mobile App
          </Link>
        </nav>

        {/* Right Action */}
        <div className="hidden md:flex items-center space-x-6">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="text-xs font-bold tracking-widest text-[#54f4fc] uppercase hover:text-white transition-colors"
            >
              DASHBOARD
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-bold tracking-widest text-gray-300 uppercase hover:text-[#54f4fc] transition-colors"
              >
                SIGN IN
              </Link>
              <Link
                href="/register"
                className="text-xs font-bold tracking-widest text-[#54f4fc] uppercase hover:text-white transition-colors"
              >
                GET STARTED
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-300 hover:text-[#54f4fc] p-2 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#05080e] border-b border-white/10 px-4 pt-2 pb-6 space-y-3">
          <Link
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-300 hover:text-[#54f4fc] py-1 text-base font-medium"
          >
            Pricing
          </Link>
          <Link
            href="#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-300 hover:text-[#54f4fc] py-1 text-base font-medium"
          >
            Features
          </Link>
          <Link
            href="/docs"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-300 hover:text-[#54f4fc] py-1 text-base font-medium"
          >
            Developer API & Docs
          </Link>
          <Link
            href="#support"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-300 hover:text-[#54f4fc] py-1 text-base font-medium"
          >
            Support
          </Link>
          <Link
            href="#blog"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-300 hover:text-[#54f4fc] py-1 text-base font-medium"
          >
            Blog
          </Link>
          <Link
            href="#partners"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-300 hover:text-[#54f4fc] py-1 text-base font-medium"
          >
            Partners
          </Link>
          <div className="pt-4 border-t border-white/10">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-block text-sm font-bold tracking-widest text-[#54f4fc] uppercase hover:text-white"
              >
                DASHBOARD
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-bold tracking-widest text-gray-300 uppercase hover:text-[#54f4fc]"
                >
                  SIGN IN
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-block text-sm font-bold tracking-widest text-[#54f4fc] uppercase hover:text-white"
                >
                  GET STARTED
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

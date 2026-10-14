import React from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/app/partials/header";
import Footer from "@/app/partials/footer";
import InteractiveIntegration from "./interactive-integration";
import IntegrationFaq from "./integration-faq";

export const metadata = {
  title: "Sentinel Security | Identity, Device & Access Management",
  description:
    "Comprehensive access security strategies for an integrated future. Unifying IAM, MDM, MFA, and real-time audit governance.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* 1. Header Partial */}
      <Header />

      <main className="w-full">
        {/* =========================================================
            SECTION 1: HERO (From Landing Page 1)
        ========================================================= */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7">
              {/* Bracketed Hero Text */}
              <div className="relative pl-6 sm:pl-8 border-l-2 border-cyan-500/70">
                {/* Top horizontal tick of bracket */}
                <div className="absolute top-0 left-0 w-5 h-[2px] bg-cyan-400" />
                {/* Bottom horizontal tick of bracket */}
                <div className="absolute bottom-0 left-0 w-5 h-[2px] bg-cyan-400" />

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold tracking-tight text-white leading-[1.16]">
                  Identity, Device, and<br />
                  <span className="text-cyan-400">Access Security</span> for an<br />
                  Integrated Future
                </h1>

                <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed mt-6 max-w-xl">
                  Unlock your business&apos;s full potential with our comprehensive
                  access security strategies. Safeguard your growth and resilience
                  in the digital age.
                </p>
              </div>

              {/* CTA Action Buttons */}
              <div className="mt-9 pl-6 sm:pl-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/services"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wider uppercase px-7 py-3.5 rounded-xl transition-all shadow-sm"
                >
                  LEARN MORE
                </Link>
                <Link
                  href="/faq#contact"
                  className="border border-white/15 hover:border-cyan-400/50 text-slate-200 hover:text-white hover:bg-white/5 font-semibold text-xs sm:text-sm tracking-wider uppercase px-7 py-3.5 rounded-xl transition-all"
                >
                  TALK WITH US
                </Link>
              </div>
            </div>

            {/* Right Hero Visual: Sentinel Shield Logo with Brackets */}
            <div className="lg:col-span-5 flex items-center justify-center relative">
              {/* Subtle ambient cyan glow behind shield */}
              <div className="absolute w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative w-full max-w-[360px] sm:max-w-[420px] aspect-square flex items-center justify-center p-4">
                <Image
                  src="/images/logo.png"
                  alt="Sentinel Security Shield Logo"
                  width={500}
                  height={460}
                  priority
                  className="w-full h-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 2: TRUSTED PLATFORMS (From Landing Page 1)
        ========================================================= */}
        <section className="py-12 border-t border-white/5 max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
          <p className="text-center text-xs sm:text-sm text-gray-400 font-medium tracking-wide mb-10">
            Compatible with The World&apos;s Most Trusted Platforms
          </p>

          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-14 md:gap-20 text-gray-300 opacity-80">
            {/* Google */}
            <div className="flex items-center justify-center hover:opacity-100 hover:text-white transition-opacity" title="Google">
              <svg className="h-7 w-auto fill-current" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
            </div>

            {/* Apple */}
            <div className="flex items-center justify-center hover:opacity-100 hover:text-white transition-opacity" title="Apple">
              <svg className="h-8 w-auto fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.64-7.83-11.83-14.36-6.19-9.68-10.9-20.93-14.13-33.75-3.23-12.82-4.85-24.31-4.85-34.48 0-14.99 3.82-27.42 11.46-37.3 7.64-9.88 17.2-14.93 28.69-15.15 4.35 0 9.29 1.19 14.81 3.57 5.53 2.38 9.38 3.58 11.56 3.58 1.95 0 5.86-1.25 11.72-3.76 5.86-2.51 11.04-3.67 15.54-3.48 11.46.65 20.89 4.88 28.29 12.69-10.01 6.09-14.9 14.57-14.68 25.43.22 8.48 3.59 15.54 10.11 21.19 6.52 5.65 14.12 8.8 22.8 9.45-2.61 7.82-5.98 15.75-10.11 23.77zM119.22 31.84c0-7.39 2.61-14.24 7.83-20.54 5.22-6.31 11.63-10.55 19.24-12.72.44 2.17.65 4.35.65 6.52 0 7.39-2.72 14.45-8.15 21.19-5.43 6.74-12.06 10.87-19.89 12.39.22-2.17.32-4.45.32-6.84z" />
              </svg>
            </div>

            {/* BBC */}
            <div className="flex items-center justify-center hover:opacity-100 hover:text-white transition-opacity" title="BBC">
              <svg className="h-6 w-auto" viewBox="0 0 115 32">
                <rect width="32" height="32" rx="3" fill="#ffffff" />
                <text x="16" y="23" fontSize="19" fontWeight="900" fill="#000000" textAnchor="middle" fontFamily="sans-serif">B</text>
                <rect x="41" width="32" height="32" rx="3" fill="#ffffff" />
                <text x="57" y="23" fontSize="19" fontWeight="900" fill="#000000" textAnchor="middle" fontFamily="sans-serif">B</text>
                <rect x="82" width="32" height="32" rx="3" fill="#ffffff" />
                <text x="98" y="23" fontSize="19" fontWeight="900" fill="#000000" textAnchor="middle" fontFamily="sans-serif">C</text>
              </svg>
            </div>

            {/* Slack */}
            <div className="flex items-center justify-center hover:opacity-100 hover:text-white transition-opacity" title="Slack">
              <svg className="h-7 w-auto fill-current" viewBox="0 0 127 127">
                <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80zM47 27.2c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.7 39.7.8 47 .8c7.3 0 13.2 5.9 13.2 13.2v13.2H47zm0 6.6c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H14C6.7 60.2.8 54.3.8 47c0-7.3 5.9-13.2 13.2-13.2H47zm52.8 13.2c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2h-13.2V47zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V14c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33zM80 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2v-13.2H80zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80z" />
              </svg>
            </div>

            {/* Zoom */}
            <div className="flex items-center justify-center hover:opacity-100 hover:text-white transition-opacity" title="Zoom">
              <span className="text-2xl sm:text-3xl font-black tracking-tight lowercase">zoom</span>
            </div>

            {/* Adobe */}
            <div className="flex items-center justify-center hover:opacity-100 hover:text-white transition-opacity" title="Adobe">
              <svg className="h-7 w-auto fill-current" viewBox="0 0 30 26">
                <path d="M19.3 0h10.7v26zm-8.6 0H0v26zm4.3 10.6l5.7 15.4h-4.3l-2.1-5.7H10.1l3.5-9.7z" />
              </svg>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 3: MISSION STATEMENT (From Landing Page 1)
        ========================================================= */}
        <section className="py-20 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <p className="text-slate-300 text-sm sm:text-base md:text-lg lg:text-[20px] leading-relaxed">
            At <span className="text-cyan-400 font-semibold">Sentinel</span>, we are dedicated
            to redefining how modern organizations protect their digital infrastructure,
            unifying identity, device management, and real-time security into a seamless
            defense system. We build high-performance tools that empower enterprises to enforce
            zero-trust access control, continuously monitor endpoint compliance, and safeguard
            critical data across desktop and mobile environments without sacrificing usability.
          </p>
        </section>

        {/* =========================================================
            SECTION 4: STATS BANNER (From Landing Page 1)
        ========================================================= */}
        <section className="py-10 max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="bg-[#0c1424]/85 border border-white/15 rounded-3xl py-10 px-6 sm:px-12 backdrop-blur-xl shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="pt-2 md:pt-0">
                <div className="text-4xl sm:text-5xl font-black text-cyan-400 tracking-tight">
                  10+
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1.5">
                  Years of Security Experience
                </div>
              </div>

              <div className="pt-6 md:pt-0">
                <div className="text-4xl sm:text-5xl font-black text-cyan-400 tracking-tight">
                  900+
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1.5">
                  Enterprise Deployments
                </div>
              </div>

              <div className="pt-6 md:pt-0">
                <div className="text-4xl sm:text-5xl font-black text-cyan-400 tracking-tight">
                  99.9%
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1.5">
                  Zero-Trust Uptime Guarantee
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 5: SERVICES WE OFFER (From Landing Page 2)
        ========================================================= */}
        <section id="services" className="py-24 max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-white mb-16 tracking-tight">
            Services we offer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Card 1: IAM */}
            <div className="bg-[#0c1424]/70 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-200 hover:bg-[#0c1424] group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                {/* Padlock Icon */}
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg sm:text-xl mt-6 mb-3 group-hover:text-cyan-300 transition-colors">
                Identity & Access Management (IAM)
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
                Centralize user identity lifecycles with granular Role-Based
                Access Control (RBAC), directory services, and Single Sign-On
                (SSO) for enterprise applications.
              </p>
            </div>

            {/* Card 2: MDM */}
            <div className="bg-[#0c1424]/70 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-200 hover:bg-[#0c1424] group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                {/* Globe with Lock Icon */}
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-1.19-.22-2.33-.61-3.39l-2.02 1.16c.4 1.29.63 2.7.63 4.23 0 4.41-3.59 8-8 8s-8-3.59-8-8c0-3.9 2.76-7.15 6.44-7.86l.67 1.86c-2.48.64-4.35 2.72-4.87 5.33l2.87 1.66c.21-.77.58-1.48 1.09-2.08V12h3.5v-2h-2.11c-.34-.96-.92-1.78-1.67-2.39L10.3 3.6c.55-.07 1.12-.1 1.7-.1 1.48 0 2.87.36 4.1.99l1.62-.94C16.14 2.58 14.14 2 12 2z" />
                  <path d="M19 1.5c-1.38 0-2.5 1.12-2.5 2.5v1.5h-.5c-.55 0-1 .45-1 1v5.5c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V6.5c0-.55-.45-1-1-1h-.5V4c0-1.38-1.12-2.5-2.5-2.5zm1 4h-2V4c0-.55.45-1 1-1s1 .45 1 1v1.5z" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg sm:text-xl mt-6 mb-3 group-hover:text-cyan-300 transition-colors">
                Unified Device Management (MDM)
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
                Maintain cross-platform endpoint compliance through a lightweight
                desktop agent that enables real-time device health tracking and
                remote administration.
              </p>
            </div>

            {/* Card 3: MFA */}
            <div className="bg-[#0c1424]/70 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-200 hover:bg-[#0c1424] group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                {/* Diagonal Key Icon */}
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path
                    d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
                    transform="rotate(-45 12 12)"
                  />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg sm:text-xl mt-6 mb-3 group-hover:text-cyan-300 transition-colors">
                Multi-Factor Authentication (MFA)
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
                Protect accounts from unauthorized access with adaptive MFA,
                customizable authentication policies, and instant push
                notifications via our mobile app.
              </p>
            </div>

            {/* Card 4: Session Governance */}
            <div className="bg-[#0c1424]/70 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-200 hover:bg-[#0c1424] group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                {/* Session Target Reticle / Shield user */}
                <svg
                  className="w-6 h-6 stroke-current fill-none"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="10" r="3" fill="currentColor" stroke="none" />
                  <path d="M8 17c0-2.2 1.8-4 4-4s4 1.8 4 4" />
                  <path d="M4 8a8 8 0 0 1 3-5" />
                  <path d="M17 3a8 8 0 0 1 3 5" />
                  <path d="M20 16a8 8 0 0 1-3 5" />
                  <path d="M7 21a8 8 0 0 1-3-5" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg sm:text-xl mt-6 mb-3 group-hover:text-cyan-300 transition-colors">
                Session & Security Policy Governance
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
                Enforce organization-wide security baselines, monitor active login
                sessions, and manage automated access revocation policies from a
                single dashboard.
              </p>
            </div>

            {/* Card 5: Real-Time Audit (Centered below) */}
            <div className="md:col-span-2 md:w-[calc(50%-1rem)] md:mx-auto bg-[#0c1424]/70 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-200 hover:bg-[#0c1424] group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                {/* Refresh loop with central beacon */}
                <svg
                  className="w-6 h-6 stroke-current fill-none"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M21.5 2v6h-6" />
                  <path d="M21.34 15.57a10 10 0 0 1-18.06-2.57" />
                  <path d="M2.5 22v-6h6" />
                  <path d="M2.66 8.43a10 10 0 0 1 18.06 2.57" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg sm:text-xl mt-6 mb-3 group-hover:text-cyan-300 transition-colors">
                Real-Time Audit & Event Monitoring
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
                Track user and device activity continuously with centralized audit
                logging, real-time threat reporting, and instant security event alerts.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 6: INTERACTIVE DEVELOPER INTEGRATION GUIDE
        ========================================================= */}
        <div id="developers">
          <InteractiveIntegration />
        </div>

        {/* =========================================================
            SECTION 7: COMPANY API & INTEGRATION FAQ
        ========================================================= */}
        <div id="faq">
          <IntegrationFaq />
        </div>

        {/* =========================================================
            SECTION 8: QUOTE & TESTIMONIAL (From Landing Page 3)
        ========================================================= */}
        <section className="py-24 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <blockquote className="text-2xl sm:text-3xl md:text-4xl lg:text-[38px] font-light text-slate-200 leading-relaxed tracking-tight max-w-4xl mx-auto italic">
            &ldquo;As for the future, your task is not to foresee it, but to enable it..&rdquo;
          </blockquote>

          {/* Author Photo */}
          <div className="mt-10 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-white/20 p-0.5 bg-neutral-900">
              <Image
                src="/images/antoine.png"
                alt="Antoine de Saint Exupéry"
                width={80}
                height={80}
                className="w-full h-full object-cover rounded-full filter grayscale brightness-110 contrast-110"
              />
            </div>

            <h4 className="text-white font-bold text-base sm:text-lg mt-4">
              Antoine de Saint Exupéry
            </h4>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Chevalier de la L&eacute;gion d&apos;honneur
            </p>

            {/* Carousel Dots */}
            <div className="flex items-center space-x-2.5 mt-6">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 9: CTA BANNER (From Landing Page 3)
        ========================================================= */}
        <section id="contact" className="py-16 max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="relative overflow-hidden bg-[#0c1424]/90 border border-white/15 rounded-3xl p-8 sm:p-14 lg:p-16 backdrop-blur-xl shadow-xl">
            {/* Ambient inner subtle highlight */}
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Title */}
              <div className="lg:col-span-6 xl:col-span-7">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.15] tracking-tight">
                  How to choose<br />
                  cybersecurity<br />
                  solution
                </h2>
              </div>

              {/* Right Questions & Actions */}
              <div className="lg:col-span-6 xl:col-span-5 lg:pl-6 space-y-6">
                <p className="text-slate-200 text-base sm:text-lg md:text-xl font-medium">
                  Having difficulties choosing the right solution for your business?
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/register"
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wider uppercase px-7 py-3.5 rounded-xl transition-all shadow-sm"
                  >
                    BOOK AN APPOINTMENT
                  </Link>
                  <Link
                    href="/faq#contact"
                    className="border border-white/15 hover:border-cyan-400/50 text-slate-200 hover:text-white hover:bg-white/5 font-semibold text-xs sm:text-sm tracking-wider uppercase px-7 py-3.5 rounded-xl transition-all"
                  >
                    TALK WITH US
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Footer Partial */}
      <Footer />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/app/partials/header";
import Footer from "@/app/partials/footer";

export default function TermsPage() {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 selection:text-white font-sans antialiased overflow-x-hidden flex flex-col justify-between">
      <Header />

      <main className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-12 flex-1">
        {/* Breadcrumb & Navigation Action */}
        <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/landingpage" className="hover:text-cyan-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white">Legal &amp; Compliance</span>
          </div>

          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-white transition-colors"
          >
            <span>Back to Registration</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="relative pl-6 sm:pl-8 border-l-2 border-cyan-500/70 mb-12">
          <div className="absolute top-0 left-0 w-5 h-[2px] bg-cyan-400" />
          <div className="absolute bottom-0 left-0 w-5 h-[2px] bg-cyan-400" />

          <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
            Sentinel Security Governance
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mt-2 mb-4">
            Terms of Service &amp; Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
            Enterprise Identity and Access Management policies, multi-tenant workspace boundaries,
            cryptographic assurance standards, and data governance practices.
          </p>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <span>Effective Date: October 2, 2026</span>
            <span>•</span>
            <span>Version: 2.1 (Multi-Tenant Architecture)</span>
          </div>
        </div>

        {/* Interactive Tab Switcher */}
        <div className="flex items-center gap-3 mb-10 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${
              activeTab === "terms"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            Terms of Service
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${
              activeTab === "privacy"
                ? "bg-cyan-500 text-slate-950 shadow-sm"
                : "bg-slate-900/80 text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            Privacy &amp; Data Protection Policy
          </button>
        </div>

        {/* Document Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Document Body */}
          <div className="lg:col-span-8 space-y-10">
            {activeTab === "terms" ? (
              /* TERMS OF SERVICE CLAUSES */
              <div className="space-y-8">
                {/* Clause 1 */}
                <section id="terms-acceptance" className="p-6 rounded-2xl bg-[#090d14] border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                      SECTION 01
                    </span>
                    Acceptance of Platform Terms
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                    By creating an account, accessing the Sentinel IAM Portal, or enrolling a mobile authenticator
                    device, you agree to comply with and be bound by these Terms of Service. These terms constitute
                    a binding agreement between the user, their organization, and Sentinel Security.
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    If you are registering on behalf of an enterprise or company, you represent that you possess
                    the necessary authorization to bind that entity to these provisions.
                  </p>
                </section>

                {/* Clause 2 */}
                <section id="terms-multitenancy" className="p-6 rounded-2xl bg-[#090d14] border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                      SECTION 02
                    </span>
                    Tenant Workspaces &amp; Company Boundaries
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                    Sentinel enforces strict multi-tenant logical partitioning across all organizations. Each company
                    workspace constitutes an isolated administrative and directory domain:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                    <li>
                      <strong className="text-white">Administrative Scope:</strong> Company Administrators possess
                      governance rights strictly over accounts, single sign-on services, and credentials within their
                      assigned company workspace.
                    </li>
                    <li>
                      <strong className="text-white">Zero Cross-Tenant Access:</strong> Administrators and users are
                      technically prohibited from accessing, viewing, modifying, or querying directory records belonging
                      to other company workspaces.
                    </li>
                    <li>
                      <strong className="text-white">Domain Association:</strong> Accounts provisioned under a workspace
                      remain bound to that company identity until formal de-provisioning or offboarding.
                    </li>
                  </ul>
                </section>

                {/* Clause 3 */}
                <section id="terms-authentication" className="p-6 rounded-2xl bg-[#090d14] border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                      SECTION 03
                    </span>
                    Authentication Factors &amp; Credential Governance
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                    Sentinel implements multi-factor authentication incorporating knowledge factors (passwords) and
                    possession factors (RFC 6238 Time-Based One-Time Password tokens via mobile devices).
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                    <li>Users are responsible for safeguarding login credentials and enrolled secondary devices.</li>
                    <li>
                      Sharing security verification codes, exporting secret keys without authorization, or delegating
                      tokens to third parties is strictly prohibited.
                    </li>
                    <li>
                      Users must immediately notify their company administrator upon device loss, theft, or suspected
                      compromise to revoke the associated authenticator key.
                    </li>
                  </ul>
                </section>

                {/* Clause 4 */}
                <section id="terms-rbac" className="p-6 rounded-2xl bg-[#090d14] border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                      SECTION 04
                    </span>
                    Role-Based Access Control &amp; Application Provisioning
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                    Access to integrated enterprise systems, catalog services, and APIs is governed exclusively by
                    Role-Based Access Control (RBAC).
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Company Administrators determine service eligibility, assign or revoke applications, and regulate
                    entitlements. Provisioning changes take effect immediately across all active user sessions.
                  </p>
                </section>

                {/* Clause 5 */}
                <section id="terms-prohibited" className="p-6 rounded-2xl bg-[#090d14] border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                      SECTION 05
                    </span>
                    Acceptable Use &amp; Security Prohibitions
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                    Users and organizations agree not to misuse or attempt to compromise the integrity of Sentinel
                    infrastructure. Prohibited activities include:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                    <li>Executing automated credential stuffing, brute-force attacks, or denial-of-service attempts.</li>
                    <li>Attempting to bypass tenant isolation boundaries or perform unauthorized privilege escalation.</li>
                    <li>Reverse-engineering API tokens, encryption handshakes, or mobile verification mechanisms.</li>
                    <li>Using the platform to distribute malicious artifacts or facilitate unauthorized access.</li>
                  </ul>
                </section>

                {/* Clause 6 */}
                <section id="terms-termination" className="p-6 rounded-2xl bg-[#090d14] border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                      SECTION 06
                    </span>
                    Offboarding &amp; Account Termination
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                    Company Administrators reserve the right to suspend, revoke, or delete member accounts at their
                    discretion during organizational offboarding or upon detecting policy violations.
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Upon account deletion, all active session tokens, authenticator keys, and service assignments are
                    permanently invalidated.
                  </p>
                </section>
              </div>
            ) : (
              /* PRIVACY POLICY CLAUSES */
              <div className="space-y-8">
                {/* Privacy Clause 1 */}
                <section id="privacy-collection" className="p-6 rounded-2xl bg-[#090d14] border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                      PRIVACY 01
                    </span>
                    Information Collected Under Least Privilege
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                    Sentinel collects only the minimal data strictly required to facilitate enterprise authentication,
                    identity verification, and session governance:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                    <li>
                      <strong className="text-white">Identity Attributes:</strong> Full name, organizational email
                      address, assigned company workspace, and system role.
                    </li>
                    <li>
                      <strong className="text-white">Security Credentials:</strong> One-way cryptographic password
                      hashes and encrypted Base32 MFA device tokens.
                    </li>
                    <li>
                      <strong className="text-white">Session Telemetry:</strong> Timestamp of authentication,
                      verification status, and MFA enrollment state.
                    </li>
                  </ul>
                </section>

                {/* Privacy Clause 2 */}
                <section id="privacy-encryption" className="p-6 rounded-2xl bg-[#090d14] border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                      PRIVACY 02
                    </span>
                    Zero Plaintext Credential Storage
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                    Sentinel enforces an uncompromising cryptographic standard across all data persistence layers:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                    <li>
                      <strong className="text-white">Password Hashing:</strong> User passwords are never stored in
                      plaintext. All passwords are processed using BCrypt with randomized cryptographic salts.
                    </li>
                    <li>
                      <strong className="text-white">In-Transit Security:</strong> All API and database communications
                      utilize TLS 1.3 encryption with mandatory SSL verification over PostgreSQL session poolers.
                    </li>
                    <li>
                      <strong className="text-white">RFC 6238 TOTP Validation:</strong> One-time passcode validation
                      occurs on the central backend; raw secret keys are never exposed in client browser storage.
                    </li>
                  </ul>
                </section>

                {/* Privacy Clause 3 */}
                <section id="privacy-isolation" className="p-6 rounded-2xl bg-[#090d14] border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                      PRIVACY 03
                    </span>
                    Multi-Tenant Data Confidentiality
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                    Organizational data remains completely segregated at the database query level:
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed mb-3">
                    We maintain a strict zero-monetization policy. Sentinel does not sell, license, rent, or share
                    organizational directory data with third-party advertisers, brokers, or external entities.
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Data belongs exclusively to the subscribing enterprise workspace.
                  </p>
                </section>

                {/* Privacy Clause 4 */}
                <section id="privacy-audit" className="p-6 rounded-2xl bg-[#090d14] border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                      PRIVACY 04
                    </span>
                    Audit Logs &amp; Forensics Compliance
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                    To maintain regulatory compliance and defend against credential abuse, Sentinel captures immutable
                    audit event timestamps for:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                    <li>Account registration and profile name updates.</li>
                    <li>Authentication attempts (success and failure records).</li>
                    <li>MFA enrollment, device pairing, and deactivation events.</li>
                    <li>Administrative service grants and revocations.</li>
                  </ul>
                </section>

                {/* Privacy Clause 5 */}
                <section id="privacy-rights" className="p-6 rounded-2xl bg-[#090d14] border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                      PRIVACY 05
                    </span>
                    Data Portability &amp; Tenant Rights
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                    Organizations maintain full ownership over their user registry:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                    <li>
                      <strong className="text-white">Export Right:</strong> Administrators can export their company
                      directory roster in standardized CSV format at any time.
                    </li>
                    <li>
                      <strong className="text-white">Erasure:</strong> Upon verified request or account termination,
                      associated directory records are purged in accordance with data retention schedules.
                    </li>
                  </ul>
                </section>
              </div>
            )}
          </div>

          {/* Sticky Quick-Navigation Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 p-6 rounded-2xl bg-[#090d14] border border-white/10 space-y-6">
              <div>
                <h3 className="text-xs font-bold tracking-wider text-cyan-400 uppercase mb-1">
                  Governance Quick Links
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select a section to jump directly to specific provisions.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {activeTab === "terms" ? (
                  <>
                    <a href="#terms-acceptance" className="block text-slate-300 hover:text-cyan-400 transition-colors py-1">
                      01. Acceptance of Terms
                    </a>
                    <a href="#terms-multitenancy" className="block text-slate-300 hover:text-cyan-400 transition-colors py-1">
                      02. Tenant Workspace Isolation
                    </a>
                    <a href="#terms-authentication" className="block text-slate-300 hover:text-cyan-400 transition-colors py-1">
                      03. Authentication &amp; TOTP Factors
                    </a>
                    <a href="#terms-rbac" className="block text-slate-300 hover:text-cyan-400 transition-colors py-1">
                      04. Role-Based Access Control
                    </a>
                    <a href="#terms-prohibited" className="block text-slate-300 hover:text-cyan-400 transition-colors py-1">
                      05. Security Prohibitions
                    </a>
                    <a href="#terms-termination" className="block text-slate-300 hover:text-cyan-400 transition-colors py-1">
                      06. Offboarding &amp; Termination
                    </a>
                  </>
                ) : (
                  <>
                    <a href="#privacy-collection" className="block text-slate-300 hover:text-cyan-400 transition-colors py-1">
                      01. Least Privilege Collection
                    </a>
                    <a href="#privacy-encryption" className="block text-slate-300 hover:text-cyan-400 transition-colors py-1">
                      02. Cryptographic Assurance
                    </a>
                    <a href="#privacy-isolation" className="block text-slate-300 hover:text-cyan-400 transition-colors py-1">
                      03. Multi-Tenant Confidentiality
                    </a>
                    <a href="#privacy-audit" className="block text-slate-300 hover:text-cyan-400 transition-colors py-1">
                      04. Audit &amp; Forensics
                    </a>
                    <a href="#privacy-rights" className="block text-slate-300 hover:text-cyan-400 transition-colors py-1">
                      05. Data Portability &amp; Rights
                    </a>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 text-[11px] text-slate-400 space-y-2">
                  <p className="font-semibold text-white">Compliance Inquiries</p>
                  <p>For questions regarding enterprise data processing or security audits, contact your workspace administrator.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

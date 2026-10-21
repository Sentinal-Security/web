"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/app/partials/header";
import Footer from "@/app/partials/footer";
import { getStoredSession, updateStoredUser } from "@/lib/session";
import { User } from "@/types/auth";
import {
  fetchBillingTier,
  createPaypalOrder,
  capturePaypalOrder,
  recordAuditEvent,
} from "@/lib/api";

type PlanKey = "COMMUNITY" | "PROFESSIONAL" | "ENTERPRISE";

interface PlanTier {
  id: PlanKey;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  cadence: string;
  badge: string;
  highlighted: boolean;
  features: string[];
}

export default function PricingPage() {
  const router = useRouter();
  const [annualBilling, setAnnualBilling] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentTier, setCurrentTier] = useState<PlanKey>("COMMUNITY");
  const [companyName, setCompanyName] = useState<string>("default");
  const [loadingTier, setLoadingTier] = useState(true);

  // PayPal Sandbox Checkout State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"review" | "processing" | "success" | "error">("review");
  const [paypalOrderId, setPaypalOrderId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [receiptDetails, setReceiptDetails] = useState<{
    orderId: string;
    tier: string;
    amount: number;
    billingCycle: string;
    company: string;
    timestamp: string;
  } | null>(null);

  // Non-admin notice modal
  const [nonAdminModalOpen, setNonAdminModalOpen] = useState(false);

  // Load user session and current organization tier
  const loadUserAndTier = useCallback(async () => {
    const session = getStoredSession();
    if (session?.user) {
      setUser(session.user);
      const userComp = session.user.company || "default";
      setCompanyName(userComp);

      const storedTier = (session.user.subscriptionTier as PlanKey) || "COMMUNITY";
      setCurrentTier(storedTier);

      try {
        const tierRes = await fetchBillingTier(session.user.userId, userComp);
        if (tierRes.success && tierRes.data?.tier) {
          const fetchedTier = tierRes.data.tier.toUpperCase() as PlanKey;
          setCurrentTier(fetchedTier);
          if (fetchedTier !== storedTier) {
            updateStoredUser({ subscriptionTier: fetchedTier });
          }
        }
      } catch {
        // Fall back to session stored tier
      }
    }
    setLoadingTier(false);
  }, []);

  useEffect(() => {
    loadUserAndTier();
  }, [loadUserAndTier]);

  const isAdmin = user?.role === "ADMIN";

  const tiers: PlanTier[] = [
    {
      id: "COMMUNITY",
      name: "Community / Evaluation",
      description: "Designed for coursework evaluation, students, and independent identity testing.",
      monthlyPrice: 0,
      annualPrice: 0,
      cadence: "forever free",
      badge: "Coursework Standard",
      highlighted: false,
      features: [
        "Up to 5 Connected SSO Applications",
        "RFC 6238 TOTP Multi-Factor Authentication",
        "Supabase PostgreSQL Session Pooler over IPv4",
        "Mobile Authenticator Android APK Access (/dw)",
        "Standard BCrypt Credential Hashing",
        "Public REST API Gateway & Documentation",
      ],
    },
    {
      id: "PROFESSIONAL",
      name: "Professional Team",
      description: "Enterprise access governance and push authorization for engineering teams.",
      monthlyPrice: 18,
      annualPrice: 14,
      cadence: "per member / month",
      badge: "Most Popular",
      highlighted: true,
      features: [
        "Unlimited Connected Enterprise SSO Applications",
        "Dual-Factor Push Authorization (2-Digit Match Code)",
        "Central IAM Admin User Roster & Batch Provisioning",
        "Multi-Tenant Workspace & Company Isolation",
        "Render Keep-Alive Inactivity Sleep Mitigation",
        "Dynamic Client Token Handoff & Session Validation",
        "Priority Coursework Demonstration Support",
      ],
    },
    {
      id: "ENTERPRISE",
      name: "Enterprise Zero-Trust",
      description: "Dedicated infrastructure, custom protocol mapping, and compliance controls.",
      monthlyPrice: 79,
      annualPrice: 69,
      cadence: "per tenant / month",
      badge: "Maximum Security",
      highlighted: false,
      features: [
        "Dedicated Supabase PostgreSQL Connection Pooler",
        "Custom OAuth 2.0, SAML 2.0 & Webhook Integration",
        "Custom Match Code Algorithm & Expiry Policies",
        "Role-Based Access Control (RBAC) Hierarchy",
        "99.95% API Availability Guarantee",
        "Full Audit Log Export to SIEM (JSON / CSV)",
        "Direct IAM Technical Engineering Guidance",
      ],
    },
  ];

  const handleSelectTier = (tier: PlanTier) => {
    // If not logged in, prompt user to sign in
    if (!user) {
      router.push("/login?redirect=/pricing");
      return;
    }

    // If current plan, nothing to do
    if (currentTier === tier.id) {
      return;
    }

    // If not company admin, open permission warning modal
    if (!isAdmin) {
      setNonAdminModalOpen(true);
      return;
    }

    // Free community plan downgrade
    if (tier.id === "COMMUNITY") {
      executeDowngrade();
      return;
    }

    // Open PayPal Sandbox Checkout Modal
    setSelectedPlan(tier);
    setCheckoutStep("review");
    setErrorMessage("");
    setCheckoutModalOpen(true);
  };

  const executeDowngrade = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      `Are you sure you want to reset ${companyName}'s subscription to the Community / Evaluation tier?`
    );
    if (!confirmed) return;

    try {
      const res = await capturePaypalOrder(user.userId, "DOWNGRADE-COMMUNITY", "COMMUNITY", "NONE");
      if (res.success) {
        setCurrentTier("COMMUNITY");
        updateStoredUser({ subscriptionTier: "COMMUNITY" });
        recordAuditEvent({
          userId: user.userId,
          userEmail: user.email,
          company: companyName,
          category: "BILLING",
          actionType: "TIER_RESET_COMMUNITY",
          severity: "WARN",
          targetResource: `Company Plan: ${companyName}`,
          details: `Admin ${user.email} reset subscription to Community Free tier.`,
        });
        alert(`Successfully reset ${companyName} to Community Free tier.`);
      } else {
        alert(res.message || "Failed to reset subscription tier.");
      }
    } catch {
      alert("Network error updating subscription.");
    }
  };

  const handleExecutePaypalSandboxPayment = async () => {
    if (!user || !selectedPlan) return;
    setCheckoutStep("processing");
    setErrorMessage("");

    const billingCycle = annualBilling ? "ANNUAL" : "MONTHLY";

    try {
      // 1. Create simulated PayPal order on Central IAM Backend
      const orderRes = await createPaypalOrder(user.userId, selectedPlan.id, billingCycle);
      if (!orderRes.success || !orderRes.data?.orderId) {
        setErrorMessage(orderRes.message || "Failed to initiate PayPal Sandbox order.");
        setCheckoutStep("error");
        return;
      }

      const generatedOrderId = orderRes.data.orderId;
      setPaypalOrderId(generatedOrderId);

      // 2. Simulate authentic PayPal Sandbox authorization handshake (1.2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // 3. Capture order on backend, updating company tier in Supabase PostgreSQL
      const captureRes = await capturePaypalOrder(
        user.userId,
        generatedOrderId,
        selectedPlan.id,
        billingCycle
      );

      if (!captureRes.success) {
        setErrorMessage(captureRes.message || "PayPal Sandbox capture was declined by security engine.");
        setCheckoutStep("error");
        return;
      }

      // 4. Update local session state
      setCurrentTier(selectedPlan.id);
      updateStoredUser({ subscriptionTier: selectedPlan.id });

      const amountCharged = annualBilling
        ? selectedPlan.id === "PROFESSIONAL" ? 168.00 : 828.00
        : selectedPlan.id === "PROFESSIONAL" ? 18.00 : 79.00;

      setReceiptDetails({
        orderId: generatedOrderId,
        tier: selectedPlan.name,
        amount: amountCharged,
        billingCycle: annualBilling ? "Annual (Billed upfront)" : "Monthly (Recurring)",
        company: companyName,
        timestamp: new Date().toLocaleString(),
      });

      setCheckoutStep("success");

      recordAuditEvent({
        userId: user.userId,
        userEmail: user.email,
        company: companyName,
        category: "BILLING",
        actionType: "PAYPAL_SANDBOX_PURCHASE",
        severity: "INFO",
        targetResource: `Company Tier: ${companyName}`,
        details: `Company upgraded to ${selectedPlan.name} via PayPal Sandbox Order ${generatedOrderId}. Amount: $${amountCharged.toFixed(2)} USD.`,
      });
    } catch {
      setErrorMessage("Network connection timed out while processing PayPal Sandbox authorization.");
      setCheckoutStep("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-white selection:bg-cyan-500/30 selection:text-white font-sans antialiased overflow-x-hidden">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-12 pb-24">
        {/* Organization Status & Role Permission Banner */}
        <div className="mb-10 max-w-4xl mx-auto">
          {user ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-mono text-slate-400">ORGANIZATION:</span>
                    <span className="text-sm font-bold text-white uppercase tracking-tight">{companyName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      PLAN: {currentTier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Signed in as <span className="text-slate-200 font-medium">{user.fullName || user.email}</span> ({user.email})
                  </p>
                </div>
              </div>

              <div>
                {isAdmin ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span>COMPANY ADMIN (BILLING ACCESS GRANTED)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span>MEMBER ROLE (READ-ONLY BILLING)</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <span className="text-xs text-slate-300">
                  Evaluating Sentinal Security? Sign in to unlock PayPal Sandbox checkout and upgrade your company workspace.
                </span>
              </div>
              <Link
                href="/login?redirect=/pricing"
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
              >
                Sign In to Manage
              </Link>
            </div>
          )}
        </div>

        {/* Page Title & Subtitle */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Predictable Enterprise Access Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Transparent Plans for Every Identity Milestone
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            From coursework simulation and evaluation to enterprise multi-tenant access governance. Complete MFA, SSO federation, and database encryption included.
          </p>

          {/* Billing Toggle Switch */}
          <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-xl bg-slate-900 border border-white/10">
            <button
              type="button"
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                !annualBilling ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                annualBilling ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950/40 text-slate-950 font-mono font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch mb-20">
          {tiers.map((tier) => {
            const isCurrent = currentTier === tier.id;
            const priceDisplay = tier.monthlyPrice === 0
              ? "$0"
              : annualBilling
              ? `$${tier.annualPrice}`
              : `$${tier.monthlyPrice}`;

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl flex flex-col justify-between p-6 sm:p-8 transition-all ${
                  isCurrent
                    ? "bg-slate-900/80 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                    : tier.highlighted
                    ? "bg-slate-900/60 border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/10"
                    : "bg-slate-900/30 border border-white/10 hover:border-white/20"
                }`}
              >
                {/* Active Plan or Highlight Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  {tier.badge && (
                    <div
                      className={`inline-block w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCurrent
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : tier.highlighted
                          ? "bg-cyan-500 text-slate-950"
                          : "bg-white/5 border border-white/10 text-slate-300"
                      }`}
                    >
                      {tier.badge}
                    </div>
                  )}

                  {isCurrent && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider">
                      ACTIVE TIER
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{tier.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{tier.description}</p>

                  <div className="mt-6 mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-white tracking-tight">{priceDisplay}</span>
                      <span className="text-xs text-slate-400">{tier.cadence}</span>
                    </div>
                    {tier.monthlyPrice > 0 && annualBilling && (
                      <p className="text-[11px] text-cyan-400/80 font-mono mt-1">
                        Billed annually (${tier.id === "PROFESSIONAL" ? "168" : "828"} / year)
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 mb-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Included Features:</p>
                    <ul className="space-y-2.5">
                      {tier.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div>
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 rounded-xl text-xs font-bold text-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>CURRENT ACTIVE TIER</span>
                    </button>
                  ) : !user ? (
                    <Link
                      href="/login?redirect=/pricing"
                      className="w-full py-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer block bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                    >
                      Sign In to Select Plan
                    </Link>
                  ) : !isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setNonAdminModalOpen(true)}
                      className="w-full py-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 flex items-center justify-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-8a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>Admin Approval Required</span>
                    </button>
                  ) : tier.id === "COMMUNITY" ? (
                    <button
                      type="button"
                      onClick={() => handleSelectTier(tier)}
                      className="w-full py-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                    >
                      Downgrade to Community Free
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectTier(tier)}
                      className={`w-full py-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        tier.highlighted
                          ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 font-extrabold"
                          : "bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
                      }`}
                    >
                      {/* PayPal Sandbox Pill Accent */}
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#003087] text-white">
                        PayPal
                      </span>
                      <span>Pay with PayPal Sandbox</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="border border-white/10 rounded-2xl bg-slate-900/20 p-6 sm:p-10 mb-16 overflow-x-auto">
          <div className="max-w-xl mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Detailed Capabilities Comparison</h2>
            <p className="text-xs text-slate-400 mt-1">
              Direct breakdown of technical limits and authentication capabilities across Sentinal Security tiers.
            </p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Capability</th>
                <th className="py-3 px-4 font-semibold">Community</th>
                <th className="py-3 px-4 font-semibold text-cyan-300">Professional</th>
                <th className="py-3 px-4 font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-medium text-white">Central Identity Storage</td>
                <td className="py-3 px-4 font-mono">Supabase PostgreSQL</td>
                <td className="py-3 px-4 font-mono">Supabase PostgreSQL</td>
                <td className="py-3 px-4 font-mono">Dedicated Supabase Cluster</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Password Cryptography</td>
                <td className="py-3 px-4 font-mono">BCrypt (Cost 10)</td>
                <td className="py-3 px-4 font-mono">BCrypt (Cost 12)</td>
                <td className="py-3 px-4 font-mono">BCrypt + Argon2id Support</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">MFA Engine (TOTP)</td>
                <td className="py-3 px-4 text-emerald-400">Included (RFC 6238)</td>
                <td className="py-3 px-4 text-emerald-400">Included (RFC 6238)</td>
                <td className="py-3 px-4 text-emerald-400">Included (RFC 6238)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Out-of-band Push Challenge</td>
                <td className="py-3 px-4 text-slate-500">Not Included</td>
                <td className="py-3 px-4 text-emerald-400">Included (2-Digit Match)</td>
                <td className="py-3 px-4 text-emerald-400">Included (Biometric Match)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Max Client SSO Applications</td>
                <td className="py-3 px-4 font-mono">5 Applications</td>
                <td className="py-3 px-4 font-mono">Unlimited</td>
                <td className="py-3 px-4 font-mono">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Tenant Isolation</td>
                <td className="py-3 px-4 text-slate-500">Shared Workspace</td>
                <td className="py-3 px-4 text-emerald-400">Company Workspace Isolation</td>
                <td className="py-3 px-4 text-emerald-400">Strict Schema Partitioning</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom CTA Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-[#071328] border border-cyan-500/20 p-8 sm:p-12 text-center max-w-3xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Ready to secure your application ecosystem?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Create an identity in seconds and explore out-of-band push authorization, mobile authenticator pairing, and instant client SSO.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-colors"
            >
              Open IAM Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* PAYPAL SANDBOX CHECKOUT MODAL                                            */}
      {/* ========================================================================= */}
      {checkoutModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#0b1322] border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#003087]/20 border border-[#003087]/40 flex items-center justify-center">
                  <span className="font-extrabold text-[#0079C1] text-sm tracking-tight">PP</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">PayPal Sandbox Checkout</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">TESTING ENVIRONMENT</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step: Review & Authorize */}
            {checkoutStep === "review" && (
              <div className="mt-5 space-y-5">
                {/* Order Summary Box */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Target Plan:</span>
                    <span className="font-bold text-white">{selectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Organization:</span>
                    <span className="font-mono text-cyan-300 uppercase font-semibold">{companyName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Billed To (Admin):</span>
                    <span className="text-slate-200">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Cadence:</span>
                    <span className="text-slate-200">{annualBilling ? "Annual (Save 20%)" : "Monthly"}</span>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Total Due Today:</span>
                    <span className="text-xl font-extrabold text-white">
                      ${annualBilling
                        ? selectedPlan.id === "PROFESSIONAL" ? "168.00" : "828.00"
                        : selectedPlan.id === "PROFESSIONAL" ? "18.00" : "79.00"}{" "}
                      <span className="text-xs font-normal text-slate-400">USD</span>
                    </span>
                  </div>
                </div>

                {/* Sandbox Info Alert */}
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[11px] text-cyan-200 leading-relaxed">
                    This order executes against the official PayPal Sandbox simulation gateway. No actual monetary funds will be deducted. All members of <strong>{companyName}</strong> will immediately inherit <strong>{selectedPlan.name}</strong> access.
                  </p>
                </div>

                {/* Pre-filled Sandbox Test Buyer Credentials */}
                <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">PayPal Sandbox Buyer Profile:</div>
                  <div className="text-slate-300">Account: sb-buyer@sentinel.security</div>
                  <div className="text-slate-300">Method: Simulated PayPal Balance (USD)</div>
                </div>

                {/* Authentic PayPal Sandbox Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleExecutePaypalSandboxPayment}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-extrabold text-sm transition-transform active:scale-[0.99] cursor-pointer shadow-lg shadow-[#FFC439]/10 flex items-center justify-center gap-2"
                  >
                    <span className="font-black italic text-base">PayPal</span>
                    <span className="text-xs font-semibold text-slate-900">Checkout with Sandbox</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecutePaypalSandboxPayment}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer border border-white/10"
                  >
                    Debit or Credit Card (Simulated)
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-mono">
                    SENTINEL PAYPAL SANDBOX GATEWAY - ZERO TRUST VERIFICATION
                  </p>
                </div>
              </div>
            )}

            {/* Step: Processing */}
            {checkoutStep === "processing" && (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto" />
                <h4 className="text-base font-bold text-white tracking-tight">
                  Processing PayPal Sandbox Authorization...
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Communicating with Central IAM API gateway and recording company subscription tier...
                </p>
              </div>
            )}

            {/* Step: Success Receipt */}
            {checkoutStep === "success" && receiptDetails && (
              <div className="mt-5 space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-emerald-300">
                    Payment Successful via PayPal Sandbox
                  </h4>
                  <p className="text-xs text-slate-300">
                    {companyName} has been successfully upgraded to the <strong>{receiptDetails.tier}</strong> plan.
                  </p>
                </div>

                {/* Receipt Card */}
                <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order ID:</span>
                    <span className="text-cyan-300 font-bold">{receiptDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plan:</span>
                    <span className="text-white">{receiptDetails.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Charged:</span>
                    <span className="text-emerald-400 font-bold">${receiptDetails.amount.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Billing Cycle:</span>
                    <span className="text-slate-200">{receiptDetails.billingCycle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Company:</span>
                    <span className="text-white uppercase">{receiptDetails.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="text-slate-400">{receiptDetails.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <Link
                    href="/dashboard"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs text-center transition-colors cursor-pointer"
                  >
                    View in Dashboard
                  </Link>
                </div>
              </div>
            )}

            {/* Step: Error */}
            {checkoutStep === "error" && (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
                  <p className="font-bold mb-1">Transaction Failed</p>
                  <p>{errorMessage || "Failed to process PayPal Sandbox order."}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("review")}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NON-ADMIN ACCESS RESTRICTION MODAL                                       */}
      {/* ========================================================================= */}
      {nonAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#0b1322] border border-amber-500/40 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Organization Administrator Privileges Required
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Only verified administrators of <strong>{companyName}</strong> possess authority to modify company subscription plans and authorize PayPal payments.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1 text-xs font-mono text-slate-400">
              <div>Your Account: <span className="text-slate-200">{user?.email}</span></div>
              <div>Assigned Role: <span className="text-amber-300 font-bold">{user?.role || "USER"}</span></div>
              <div>Company: <span className="text-slate-200 uppercase">{companyName}</span></div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setNonAdminModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { isLang, type Lang, t } from "../../../../lib/i18n";
import { api } from "../../../../lib/api";
import type { BillingInterval, PlanId } from "../../../../lib/plans";
import { PLANS, displayPrice, formatPrice, regularPrice, yearlySavings } from "../../../../lib/plans";

type Draft = {
  tenantName: string;
  email: string;
  password: string;
  lang: Lang;
  planId: PlanId;
  billingInterval: BillingInterval;
  planCode: string;
};

const PLAN_NAME_KEYS: Record<PlanId, string> = {
  starter: "plan_starter_name",
  pro: "plan_pro_name",
  max: "plan_max_name",
};

export default function RegisterDetails({ params }: { params: { lang: string } }) {
  const lang = isLang(params.lang) ? (params.lang as Lang) : ("en" as Lang);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [billingFullName, setBillingFullName] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingHouseNo, setBillingHouseNo] = useState("");
  const [billingApartmentNo, setBillingApartmentNo] = useState("");
  const [billingPostcode, setBillingPostcode] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingRegion, setBillingRegion] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [billingTaxId, setBillingTaxId] = useState("");

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletterSubscribe, setNewsletterSubscribe] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("registerDraft");
    if (!raw) {
      window.location.href = `/${lang}/register`;
      return;
    }
    try {
      const parsed: Draft = JSON.parse(raw);
      setDraft(parsed);
      setTenantName(parsed.tenantName || "");
      setEmail(parsed.email || "");
      setPassword(parsed.password || "");
    } catch {
      sessionStorage.removeItem("registerDraft");
      window.location.href = `/${lang}/register`;
    }
  }, [lang]);

  const plan = PLANS.find((p) => p.id === draft?.planId) || PLANS[1];
  const currentDisplay = displayPrice(plan, draft?.billingInterval || "month", lang);
  const currentRegular = regularPrice(plan, draft?.billingInterval || "month", lang);
  const currentPrice = formatPrice(lang, currentDisplay);
  const regularPriceFormatted = formatPrice(lang, currentRegular);
  const savings = draft?.billingInterval === "year" ? yearlySavings(plan, lang) : 0;
  const monthlySavings = (draft?.billingInterval === "month" && currentDisplay !== currentRegular) ? (currentRegular - currentDisplay) : 0;
  const currentSavings = draft?.billingInterval === "year" ? savings : monthlySavings;
  const savingsKey = draft?.billingInterval === "year" ? "plan_save_yearly" : "plan_save_monthly";
  const savingsLabel = currentSavings > 0 ? t(lang, savingsKey).replace("{amount}", formatPrice(lang, currentSavings)) : "";
  const periodLabel = draft?.billingInterval === "month" ? t(lang, "plan_per_month") : t(lang, "plan_per_year");
  const hasPromo = currentDisplay !== currentRegular;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{t(lang, "register_details_title")}</h1>
          <p className="mt-3 text-lg text-gray-600">{t(lang, "register_details_note")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">{t(lang, "billing_details_title")}</h2>
            <p className="text-gray-600 mb-6">{t(lang, "billing_details_note")}</p>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">{t(lang, "company_name")} *</label>
                <input 
                  required
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={tenantName} 
                  onChange={(e)=>setTenantName(e.target.value)} 
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">{t(lang, "owner_email")} *</label>
                <input 
                  required
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={email} 
                  onChange={(e)=>setEmail(e.target.value)} 
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">{t(lang, "owner_password")} *</label>
                <input 
                  required
                  type="password" 
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={password} 
                  onChange={(e)=>setPassword(e.target.value)} 
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t(lang, "billing_details_title")}</h3>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_full_name")} *</label>
                <input 
                  required
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={billingFullName} 
                  onChange={(e)=>setBillingFullName(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_street")} *</label>
                <input 
                  required
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={billingStreet} 
                  onChange={(e)=>setBillingStreet(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_house_no")} *</label>
                <input 
                  required
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={billingHouseNo} 
                  onChange={(e)=>setBillingHouseNo(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_apartment_no")}</label>
                <input 
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={billingApartmentNo} 
                  onChange={(e)=>setBillingApartmentNo(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_postcode")} *</label>
                <input 
                  required
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={billingPostcode} 
                  onChange={(e)=>setBillingPostcode(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_city")} *</label>
                <input 
                  required
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={billingCity} 
                  onChange={(e)=>setBillingCity(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_region")} *</label>
                <input 
                  required
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={billingRegion} 
                  onChange={(e)=>setBillingRegion(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_country")} *</label>
                <input 
                  required
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={billingCountry} 
                  onChange={(e)=>setBillingCountry(e.target.value)} 
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_tax_id")}</label>
                <input 
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={billingTaxId} 
                  onChange={(e)=>setBillingTaxId(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-white to-purple-50 p-8 glow-card border border-purple-100">
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 shadow-xl mb-6">
              <div className="text-sm font-semibold text-blue-100">{t(lang, "plan_label")}</div>
              <div className="mt-1 text-2xl font-bold text-white">{t(lang, PLAN_NAME_KEYS[plan.id])}</div>
              <div className="mt-3 flex items-baseline gap-2">
                {hasPromo && (
                  <span className="text-lg line-through text-white opacity-60">
                    {regularPriceFormatted}
                  </span>
                )}
                <span className="text-3xl font-bold text-white">{currentPrice}</span>
                <span className="text-sm text-white opacity-90">{periodLabel}</span>
              </div>
              {savingsLabel && <div className="mt-2 text-sm font-semibold text-yellow-300">{savingsLabel}</div>}
            </div>

            {/* Checkboxy */}
            <div className="space-y-4 mb-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-blue-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                />
                <span 
                  className="text-sm text-gray-700 group-hover:text-gray-900"
                  dangerouslySetInnerHTML={{ __html: t(lang, "accept_terms").replace("{lang}", lang) }}
                />
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={newsletterSubscribe}
                  onChange={(e) => setNewsletterSubscribe(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-blue-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {t(lang, "subscribe_newsletter")}
                </span>
              </label>
            </div>

            {err && (
              <div className="mb-6 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 p-4 text-sm text-red-700 shadow-md">
                {err}
              </div>
            )}

            <button
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!draft || loading}
              onClick={async () => {
                setErr(null);
                if (!draft) return;
                
                if (!acceptTerms) {
                  setErr(t(lang, "terms_required"));
                  return;
                }
                
                if (!tenantName.trim() || !email.trim() || !password.trim() || 
                    !billingFullName.trim() || !billingStreet.trim() || !billingHouseNo.trim() ||
                    !billingPostcode.trim() || !billingCity.trim() || !billingRegion.trim() || !billingCountry.trim()) {
                  setErr(t(lang, "register_details_required"));
                  return;
                }
                setLoading(true);
                try {
                  const res = await api<{ payment_token: string }>("/auth/register-tenant", {
                    method: "POST",
                    body: JSON.stringify({
                      tenant_name: tenantName.trim(),
                      owner_email: email.trim(),
                      owner_password: password,
                      lang: draft.lang,
                      plan_code: draft.planCode,
                      billing_full_name: billingFullName.trim() || null,
                      billing_street: billingStreet.trim() || null,
                      billing_house_no: billingHouseNo.trim() || null,
                      billing_apartment_no: billingApartmentNo.trim() || null,
                      billing_postcode: billingPostcode.trim() || null,
                      billing_city: billingCity.trim() || null,
                      billing_region: billingRegion.trim() || null,
                      billing_country: billingCountry.trim() || null,
                      billing_tax_id: billingTaxId.trim() || null,
                      newsletter_subscribed: newsletterSubscribe,
                    }),
                  });
                  sessionStorage.removeItem("registerDraft");
                  window.location.href = `/${lang}/payment-required?token=${encodeURIComponent(res.payment_token)}`;
                } catch (e: any) {
                  setErr(e.message);
                } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? t(lang, "loading") : t(lang, "continue_to_payment")}
          </button>
        </div>
      </div>
    </div>
    </main>
  );
}

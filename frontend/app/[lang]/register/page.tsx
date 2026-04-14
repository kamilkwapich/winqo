'use client';
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../../../lib/api";
import { isLang, type Lang, t } from "../../../lib/i18n";
import { BillingInterval, LANGUAGE_OPTIONS, PlanId, PLANS, displayPrice, formatPrice, perQuotePrice, planCode, regularPrice, yearlySavings } from "../../../lib/plans";

const PLAN_NAME_KEYS: Record<PlanId, string> = {
  starter: "plan_starter_name",
  pro: "plan_pro_name",
  max: "plan_max_name",
};

const PLAN_DESC_KEYS: Record<PlanId, string> = {
  starter: "plan_starter_desc",
  pro: "plan_pro_desc",
  max: "plan_max_desc",
};

export default function Register({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const searchParams = useSearchParams();
  const normalizedLang = (lang === "en" ? "en-us" : lang) as Lang;
  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [planId, setPlanId] = useState<PlanId>("pro");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [selectedLang, setSelectedLang] = useState<Lang>(
    LANGUAGE_OPTIONS.some((option) => option.value === normalizedLang) ? normalizedLang : "pl"
  );
  const [err, setErr] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    const plan = searchParams?.get("plan");
    const interval = searchParams?.get("interval");
    if (plan === "starter" || plan === "pro" || plan === "max") {
      setPlanId(plan as PlanId);
    }
    if (interval === "month" || interval === "year") {
      setBillingInterval(interval as BillingInterval);
    }
  }, [searchParams]);

  const plan = useMemo(() => PLANS.find((p) => p.id === planId) || PLANS[1], [planId]);
  const displayPriceValue = displayPrice(plan, billingInterval, lang);
  const regularMonthly = regularPrice(plan, "month", lang);
  const regularYearly = regularPrice(plan, "year", lang);
  const currentRegular = regularPrice(plan, billingInterval, lang);
  const price = formatPrice(lang, displayPriceValue);
  const regularPriceFormatted = formatPrice(lang, currentRegular);
  const savings = yearlySavings(plan, lang);
  const monthlySavings = billingInterval === "month" && displayPriceValue !== currentRegular ? currentRegular - displayPriceValue : 0;
  const currentSavings = billingInterval === "year" ? savings : monthlySavings;
  const savingsKey = billingInterval === "year" ? "plan_save_yearly" : "plan_save_monthly";
  const savingsLabel = currentSavings > 0 ? t(lang, savingsKey).replace("{amount}", formatPrice(lang, currentSavings)) : "";
  const perQuote = perQuotePrice(plan, billingInterval, lang);
  const perQuoteLabel = perQuote ? t(lang, "plan_quote_price").replace("{amount}", formatPrice(lang, perQuote)) : "";
  const planCodeValue = planCode(planId, billingInterval);
  const periodLabel = billingInterval === "month" ? t(lang, "plan_per_month") : t(lang, "plan_per_year");
  const hasPromo = displayPriceValue !== currentRegular;

  if (verificationSent) {
    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 px-4 py-14 flex items-center justify-center">
             <div className="max-w-xl w-full rounded-3xl bg-white p-10 shadow-xl border border-blue-100 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-600">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{t(lang, "verify_email_sent_title")}</h1>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                    {t(lang, "verify_email_sent_message")}
                </p>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-500">
                    {email}
                </div>
             </div>
        </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{t(lang, "create_tenant_title")}</h1>
          <p className="mt-3 text-lg text-gray-600">{t(lang, "create_tenant_note")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
            {/* Wybór języka - WYRÓŻNIONY NA GÓRZE */}
            <div className="mb-8 rounded-2xl bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-2 border-orange-300 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div>
                  <label className="text-lg font-bold text-gray-900">{t(lang, "plan_language_label")}</label>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {plan.languageMode === "single" ? t(lang, "plan_language_hint_single") : t(lang, "plan_language_hint_all")}
                  </p>
                </div>
              </div>
              <select
                className="w-full rounded-xl border-2 border-orange-300 bg-white px-4 py-3 text-base font-semibold focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all shadow-sm"
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as Lang)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "plan_select_title")}</h2>
            <p className="mt-2 text-gray-600">{t(lang, "plan_select_subtitle")}</p>

            {/* Przełącznik miesięczny/roczny */}
            <div className="mt-6 inline-flex items-center rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 p-1.5 shadow-lg">
              <button
                onClick={() => setBillingInterval("month")}
                type="button"
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                  billingInterval === "month"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t(lang, "plan_billing_toggle_monthly")}
              </button>
              <button
                onClick={() => setBillingInterval("year")}
                type="button"
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                  billingInterval === "year"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t(lang, "plan_billing_toggle_yearly")}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => {
                const selected = p.id === planId;
                const limitKey = p.monthlyLimit
                  ? p.monthlyLimit === 35
                    ? "plan_feature_limit_35"
                    : "plan_feature_limit_150"
                  : "plan_feature_unlimited_quotes";
                const langKey = p.languageMode === "single" ? "plan_feature_single_lang" : "plan_feature_all_langs";
                const cardDisplay = displayPrice(p, billingInterval, lang);
                const cardRegular = regularPrice(p, billingInterval, lang);
                const cardPrice = formatPrice(lang, cardDisplay);
                const cardRegularFormatted = formatPrice(lang, cardRegular);
                const cardPerQuote = perQuotePrice(p, billingInterval, lang);
                const cardRegularPerQuote = cardRegular / (p.monthlyLimit || 1);
                const cardPerQuoteLabel = cardPerQuote ? t(lang, "plan_quote_price").replace("{amount}", formatPrice(lang, cardPerQuote)) : "";
                const cardSavings = billingInterval === "year" ? yearlySavings(p, lang) : (cardDisplay !== cardRegular ? cardRegular - cardDisplay : 0);
                const cardSavingsKey = billingInterval === "year" ? "plan_save_yearly" : "plan_save_monthly";
                const cardSavingsLabel = cardSavings > 0 ? t(lang, cardSavingsKey).replace("{amount}", formatPrice(lang, cardSavings)) : "";
                const logoKey = p.logoAllowed ? "plan_feature_logo_yes" : "plan_feature_logo_no";
                const brandingKey = p.showBranding ? "plan_feature_branding_footer" : "plan_feature_branding_none";
                const hasCardPromo = cardDisplay !== cardRegular;
                const hasPerQuoteDiscount = p.monthlyLimit && cardPerQuote !== cardRegularPerQuote;
                const emphasized = p.recommended;
                
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={`rounded-3xl p-6 text-left transition-all duration-300 ${
                      selected
                        ? emphasized
                          ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl shadow-purple-500/50 border-4 border-white scale-105"
                          : "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/30 border-2 border-white"
                        : emphasized
                          ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl shadow-purple-500/50 md:-mt-2 md:scale-105 border-4 border-white"
                          : "bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 border-blue-200 hover:border-purple-300 hover:shadow-xl shadow-lg"
                    } ${p.recommended ? "md:-mt-2 md:scale-105" : ""}`}
                  >
                    {p.recommended && (
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {t(lang, "plan_most_popular")}
                      </div>
                    )}
                    <div className={`text-lg font-bold ${
                      selected || emphasized ? "text-white" : "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                    }`}>{t(lang, PLAN_NAME_KEYS[p.id])}</div>
                    <div className={`mt-1 text-xs ${
                      selected || emphasized ? "text-white opacity-90" : "text-gray-600"
                    }`}>{t(lang, PLAN_DESC_KEYS[p.id])}</div>
                    
                    <div className="mt-4">
                      {hasCardPromo && (
                        <div className={`text-sm line-through mb-1 ${
                          selected || emphasized ? "text-white opacity-60" : "text-gray-400"
                        }`}>
                          {cardRegularFormatted}
                        </div>
                      )}
                      <div className={`text-2xl font-bold ${
                        selected || emphasized ? "text-white" : "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                      }`}>{cardPrice}</div>
                      <div className={`text-xs ${
                        selected || emphasized ? "text-white opacity-90" : "text-gray-500"
                      }`}>
                        {billingInterval === "year" ? t(lang, "plan_per_year") : t(lang, "plan_per_month")}
                      </div>
                      {cardSavingsLabel && (
                        <div className={`mt-1 text-xs font-semibold ${
                          selected || emphasized ? "text-yellow-300" : "text-green-600"
                        }`}>{cardSavingsLabel}</div>
                      )}
                    </div>
                    
                    <ul className={`mt-3 space-y-1.5 text-xs ${selected || emphasized ? "text-white" : "text-gray-700"}`}>
                      <li className="flex items-start gap-1.5">
                        <PlanCheck />
                        <span>{t(lang, limitKey)}</span>
                      </li>
                      {cardPerQuoteLabel && (
                        <li className="flex items-start gap-1.5">
                          <PlanCheck />
                          <span>
                            {hasPerQuoteDiscount && (
                              <span className={`line-through mr-1 ${selected || emphasized ? "opacity-60" : "text-gray-400"}`}>
                                {formatPrice(lang, cardRegularPerQuote)}
                              </span>
                            )}
                            {cardPerQuoteLabel}
                          </span>
                        </li>
                      )}
                        <li className="flex items-start gap-1.5">
                          <PlanCheck />
                          <span>{(p as any).languagesIncluded ? t(lang, "plan_feature_languages_count").replace("{count}", String((p as any).languagesIncluded)) : t(lang, langKey)}</span>
                        </li>
                      <li className="flex items-start gap-1.5">
                        <PlanCheck />
                        <span>{t(lang, logoKey)}</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <PlanCheck />
                        <span>{t(lang, brandingKey)}</span>
                      </li>
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-white to-purple-50 p-8 glow-card border border-purple-100">
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 shadow-xl">
              <div className="text-sm font-semibold text-blue-100">{t(lang, "plan_label")}</div>
              <div className="mt-1 text-2xl font-bold text-white">{t(lang, PLAN_NAME_KEYS[planId])}</div>
              <div className="mt-3 flex items-baseline gap-2">
                {hasPromo && (
                  <span className="text-lg line-through text-white opacity-60">
                    {regularPriceFormatted}
                  </span>
                )}
                <span className="text-3xl font-bold text-white">{price}</span>
                <span className="text-sm text-white opacity-90">{periodLabel}</span>
              </div>
              {savingsLabel && <div className="mt-2 text-sm font-semibold text-yellow-300">{savingsLabel}</div>}
              {perQuoteLabel && <div className="mt-2 text-sm text-white opacity-90">{perQuoteLabel}</div>}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">{t(lang, "company_name")}</label>
                <input 
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={tenantName} 
                  onChange={e=>setTenantName(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t(lang, "owner_email")}</label>
                <input 
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t(lang, "owner_password")}</label>
                <input 
                  type="password" 
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t(lang, "owner_password_repeat")}</label>
                <input 
                  type="password" 
                  className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                  value={passwordRepeat} 
                  onChange={e=>setPasswordRepeat(e.target.value)} 
                />
              </div>
            </div>

            {err && (
              <div className="mt-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 p-4 text-sm text-red-700 shadow-md">
                {err}
              </div>
            )}

            <button
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              onClick={async () => {
                setErr(null);
                if (!tenantName.trim()) {
                  setErr(t(lang, "company_name_required"));
                  return;
                }
                if (!email.trim()) {
                  setErr(t(lang, "email_required"));
                  return;
                }
                if (!password || password !== passwordRepeat) {
                  setErr(t(lang, "password_mismatch"));
                  return;
                }
                const metadata = {
                  tenantName: tenantName.trim(),
                  planId,
                  billingInterval,
                  planCode: planCodeValue,
                };
                
                try {
                  await api("/auth/register-init", {
                    method: "POST",
                    body: JSON.stringify({
                      email: email.trim(),
                      password,
                      lang: selectedLang,
                      metadata
                    })
                  });
                  setVerificationSent(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } catch (e: any) {
                  setErr(e.message || String(e));
                }
              }}
            >
              {t(lang, "continue")}
            </button>

            <a 
              className="mt-4 block text-center text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium" 
              href={`/${lang}/login`}
            >
              {t(lang, "back_to_login")}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

function PlanCheck() {
  return (
    <span
      aria-hidden
      className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 text-white text-base font-bold shadow-md shadow-green-300/50 ring-2 ring-white/70"
    >
      ✓
    </span>
  );
}

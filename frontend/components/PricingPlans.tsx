"use client";
import React, { useState } from "react";
import { type Lang, t } from "../lib/i18n";
import { PLANS, displayPrice, formatPrice, perQuotePrice, regularPrice, yearlySavings } from "../lib/plans";

const PLAN_NAME_KEYS: Record<string, string> = {
  starter: "plan_starter_name",
  pro: "plan_pro_name",
  max: "plan_max_name",
};

const PLAN_DESC_KEYS: Record<string, string> = {
  starter: "plan_starter_desc",
  pro: "plan_pro_desc",
  max: "plan_max_desc",
};

export default function PricingPlans({ lang, showHeader = true }: { lang: Lang; showHeader?: boolean }) {
  const [billingPeriod, setBillingPeriod] = useState<"month" | "year">("month");
  const withAmount = (key: string, amount: string) => t(lang, key).replace("{amount}", amount);
  
  return (
    <section className="mt-14">
      {showHeader && (
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{t(lang, "plans_title")}</h2>
          <p className="mt-3 text-lg text-gray-600 mb-8">{t(lang, "plans_subtitle")}</p>
          
          {/* Przełącznik miesięczny/roczny */}
          <div className="inline-flex items-center rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 p-1.5 shadow-lg">
            <button
              onClick={() => setBillingPeriod("month")}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                billingPeriod === "month"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t(lang, "plan_billing_toggle_monthly")}
            </button>
            <button
              onClick={() => setBillingPeriod("year")}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                billingPeriod === "year"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t(lang, "plan_billing_toggle_yearly")}
            </button>
          </div>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const currentDisplay = displayPrice(plan, billingPeriod, lang);
          const currentRegular = regularPrice(plan, billingPeriod, lang);
          const currentPrice = formatPrice(lang, currentDisplay);
          const regularPriceFormatted = formatPrice(lang, currentRegular);
          const perQuote = perQuotePrice(plan, billingPeriod, lang);
          const regularPerQuote = currentRegular / (plan.monthlyLimit || 1);
          const savings = yearlySavings(plan, lang);
          
          // Oblicz oszczędności również dla miesięcznych planów (jeśli są promocje)
          const monthlySavings = billingPeriod === "month" && currentDisplay !== currentRegular 
            ? currentRegular - currentDisplay 
            : 0;
          const currentSavings = billingPeriod === "year" ? savings : monthlySavings;
          const savingsKey = billingPeriod === "year" ? "plan_save_yearly" : "plan_save_monthly";
          const savingsLabel = currentSavings > 0 ? withAmount(savingsKey, formatPrice(lang, currentSavings)) : "";
          
          const limitKey = plan.monthlyLimit
            ? plan.monthlyLimit === 35
              ? "plan_feature_limit_35"
              : "plan_feature_limit_150"
            : "plan_feature_unlimited_quotes";
          const langKey = plan.languagesIncluded
            ? null
            : (plan.languageMode === "single" ? "plan_feature_single_lang" : "plan_feature_all_langs");
          const languagesCount = (plan as any).languagesIncluded as number | undefined;
          const logoKey = plan.logoAllowed ? "plan_feature_logo_yes" : "plan_feature_logo_no";
          const brandingKey = plan.showBranding ? "plan_feature_branding_footer" : "plan_feature_branding_none";
          const periodLabel = billingPeriod === "month" ? t(lang, "plan_per_month") : t(lang, "plan_per_year");
          const perQuoteLabel = perQuote ? withAmount("plan_quote_price", formatPrice(lang, perQuote)) : "";
          const emphasized = plan.recommended;
          const hasPromo = currentDisplay !== currentRegular;
          const hasPerQuoteDiscount = plan.monthlyLimit && perQuote !== regularPerQuote;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] ${
                emphasized 
                  ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl shadow-purple-500/50 md:-mt-6 md:scale-110 border-4 border-white glow-card" 
                  : "bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 border-blue-200 hover:border-purple-300 hover:shadow-2xl shadow-lg shadow-blue-200/50 hover:shadow-purple-300/50"
              }`}
            >
              {plan.recommended && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {t(lang, "plan_most_popular")}
                </div>
              )}
              <h3 className={`text-2xl font-bold ${
                emphasized ? "text-white" : "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              }`}>{t(lang, PLAN_NAME_KEYS[plan.id])}</h3>
              <p className={`mt-2 text-sm ${
                emphasized ? "text-white opacity-90" : "text-gray-600"
              }`}>{t(lang, PLAN_DESC_KEYS[plan.id])}</p>
              
              <div className="mt-6">
                {hasPromo && (
                  <div className={`text-lg line-through mb-1 ${
                    emphasized ? "text-white opacity-60" : "text-gray-400"
                  }`}>
                    {regularPriceFormatted}
                  </div>
                )}
                <div className={`text-4xl font-bold ${
                  emphasized ? "text-white" : "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                }`}>
                  {currentPrice} <span className={`text-base font-normal ${
                    emphasized ? "text-white opacity-90" : "text-gray-500"
                  }`}>{periodLabel}</span>
                </div>
                {savingsLabel && (
                  <div className={`mt-2 text-sm font-semibold ${
                    emphasized ? "text-yellow-300" : "text-green-600"
                  }`}>{savingsLabel}</div>
                )}
              </div>
              
              <ul className={`mt-6 space-y-3 text-sm ${emphasized ? "text-white" : "text-gray-700"}`}>
                <li className="flex items-start gap-2">
                  <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${emphasized ? "text-green-300" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t(lang, limitKey)}</span>
                </li>
                {perQuoteLabel && (
                  <li className="flex items-start gap-2">
                    <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${emphasized ? "text-green-300" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {hasPerQuoteDiscount && (
                        <span className={`line-through mr-2 ${emphasized ? "opacity-60" : "text-gray-400"}`}>
                          {formatPrice(lang, regularPerQuote)}
                        </span>
                      )}
                      {perQuoteLabel}
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${emphasized ? "text-green-300" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{languagesCount ? t(lang, "plan_feature_languages_count").replace("{count}", String(languagesCount)) : t(lang, langKey!)}</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${emphasized ? "text-green-300" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t(lang, logoKey)}</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${emphasized ? "text-green-300" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t(lang, brandingKey)}</span>
                </li>
              </ul>
              
              <a
                className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                  emphasized 
                    ? "bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl hover:scale-105" 
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg hover:scale-105"
                }`}
                href={`/${lang}/register?plan=${plan.id}&interval=${billingPeriod}`}
              >
                {t(lang, "plan_cta")}
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import type { Lang } from "./i18n";

export type BillingInterval = "month" | "year";
export type PlanId = "starter" | "pro" | "max";

export type Plan = {
  id: PlanId;
  monthlyPriceEur: number;
  yearlyPriceEur: number;
  promoMonthlyPriceEur?: number;
  promoYearlyPriceEur?: number;
  monthlyLimit: number | null;
  languagesIncluded?: number;
  languageMode: "single" | "all";
  logoAllowed: boolean;
  showBranding: boolean;
  recommended?: boolean;
  monthlyCode: string;
  yearlyCode: string;
};

const FX_RATES = {
  EUR: 1,
  PLN: safeRate(process.env.NEXT_PUBLIC_FX_RATE_PLN, 4.3),
  USD: safeRate(process.env.NEXT_PUBLIC_FX_RATE_USD, 1.1),
  GBP: safeRate(process.env.NEXT_PUBLIC_FX_RATE_GBP, 0.86),
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    monthlyPriceEur: 8.99,
    yearlyPriceEur: 89.99,
    monthlyLimit: 35,
    languageMode: "single",
    logoAllowed: false,
    showBranding: true,
    monthlyCode: "STARTER_M",
    yearlyCode: "STARTER_Y",
  },
  {
    id: "pro",
    monthlyPriceEur: 21.99,
    yearlyPriceEur: 219.99,
    promoMonthlyPriceEur: 14.99,
    monthlyLimit: 150,
    languageMode: "single",
    logoAllowed: true,
    showBranding: true,
    recommended: true,
    monthlyCode: "PRO_M_TRIAL",
    yearlyCode: "PRO_Y_PROMO",
  },
  {
    id: "max",
    monthlyPriceEur: 39.99,
    yearlyPriceEur: 399.99,
    monthlyLimit: null,
    languagesIncluded: 6,
    languageMode: "all",
    logoAllowed: true,
    showBranding: false,
    monthlyCode: "MAX_M",
    yearlyCode: "MAX_Y",
  },
];

export function planCode(planId: PlanId, interval: BillingInterval): string {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return "PRO_M_TRIAL";
  return interval === "year" ? plan.yearlyCode : plan.monthlyCode;
}

export function planCodeStandard(planId: PlanId, interval: BillingInterval): string {
  if (planId === "starter") return interval === "year" ? "STARTER_Y" : "STARTER_M";
  if (planId === "pro") return interval === "year" ? "PRO_Y" : "PRO_M";
  return interval === "year" ? "MAX_Y" : "MAX_M";
}

export function currencyForLang(lang: Lang): "EUR" | "PLN" | "USD" | "GBP" {
  if (lang === "pl") return "PLN";
  if (lang === "en-uk") return "GBP";
  if (lang === "en-us" || lang === "en") return "USD";
  return "EUR";
}

export function formatPrice(lang: Lang, amount: number, currency?: "EUR" | "PLN" | "USD" | "GBP"): string {
  const localeMap: Record<string, string> = {
    pl: "pl-PL",
    "en-us": "en-US",
    "en-uk": "en-GB",
    en: "en-US",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    es: "es-ES",
  };
  const locale = localeMap[lang] || "en-US";
  const curr = currency || currencyForLang(lang);
  return new Intl.NumberFormat(locale, { style: "currency", currency: curr, minimumFractionDigits: 2 }).format(amount);
}

export function displayPrice(plan: Plan, interval: BillingInterval, lang: Lang): number {
  const amountEur = interval === "year"
    ? plan.promoYearlyPriceEur ?? plan.yearlyPriceEur
    : plan.promoMonthlyPriceEur ?? plan.monthlyPriceEur;
  return convertFromEur(amountEur, lang);
}

export function regularPrice(plan: Plan, interval: BillingInterval, lang: Lang): number {
  const amountEur = interval === "year" ? plan.yearlyPriceEur : plan.monthlyPriceEur;
  return convertFromEur(amountEur, lang);
}

export function yearlySavings(plan: Plan, lang: Lang): number {
  const yearlyDisplayEur = plan.promoYearlyPriceEur ?? plan.yearlyPriceEur;
  const savingsEur = plan.monthlyPriceEur * 12 - yearlyDisplayEur;
  return convertFromEur(savingsEur, lang);
}

export function perQuotePrice(plan: Plan, interval: BillingInterval, lang: Lang): number | null {
  if (!plan.monthlyLimit) return null;
  const amountEur = interval === "year"
    ? (plan.promoYearlyPriceEur ?? plan.yearlyPriceEur) / 12
    : plan.promoMonthlyPriceEur ?? plan.monthlyPriceEur;
  return convertFromEur(amountEur / plan.monthlyLimit, lang);
}

export const LANGUAGE_OPTIONS: { value: Lang; label: string }[] = [
  { value: "pl", label: "PL" },
  { value: "en-us", label: "EN (US)" },
  { value: "en-uk", label: "EN (UK)" },
  { value: "fr", label: "FR" },
  { value: "de", label: "DE" },
  { value: "it", label: "IT" },
  { value: "es", label: "ES" },
];

function convertFromEur(amountEur: number, lang: Lang): number {
  const currency = currencyForLang(lang);
  const rate = FX_RATES[currency] || 1;
  return amountEur * rate;
}

function safeRate(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

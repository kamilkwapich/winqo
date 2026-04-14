'use client';
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
  const langToDefaultCountry: Record<string, string> = {
    pl: "PL",
    it: "IT",
    de: "DE",
    fr: "FR",
    es: "ES",
    "en-uk": "GB",
    "en-us": "US",
    en: "GB",
  };
  const [billingCountry, setBillingCountry] = useState(() => langToDefaultCountry[lang] || "PL");
  const [billingTaxId, setBillingTaxId] = useState("");
  const [viesValid, setViesValid] = useState<boolean | null>(null);
  const [viesData, setViesData] = useState<any | null>(null);
  const [viesAutoFilled, setViesAutoFilled] = useState(false);
  const [viesFilled, setViesFilled] = useState<Record<string, boolean>>({
    name: false,
    tenant: false,
    street: false,
    house: false,
    apt: false,
    postcode: false,
    city: false,
    region: false,
    tax: false,
  });
  const [isVerifyingVat, setIsVerifyingVat] = useState(false);
  const [wasViesVerificationAttempted, setWasViesVerificationAttempted] = useState(false);
  const [viesSuccessMsg, setViesSuccessMsg] = useState<string | null>(null);
  const [companyPhone, setCompanyPhone] = useState("");

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptEarlyAccess, setAcceptEarlyAccess] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<any | null>(null);
  const [discountErr, setDiscountErr] = useState<string | null>(null);
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const [viesRequiredError, setViesRequiredError] = useState<string | null>(null);

  const handleInvalid = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.setCustomValidity(t(lang, "field_required"));
  };
  const handleInput = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.setCustomValidity("");
  };

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

  if (!draft) {
    return <div>Loading...</div>;
  }

  const plan = PLANS.find((p) => p.id === draft.planId) || PLANS[1];
  const currentDisplay = displayPrice(plan, draft.billingInterval || "month", lang);
  const currentRegular = regularPrice(plan, draft.billingInterval || "month", lang);
  const currentPrice = formatPrice(lang, discountInfo ? discountInfo.final_amount : currentDisplay, (discountInfo?.currency as any) || undefined);
  const regularPriceFormatted = formatPrice(lang, discountInfo ? discountInfo.base_amount : currentRegular, (discountInfo?.currency as any) || undefined);
  const savings = draft.billingInterval === "year" ? yearlySavings(plan, lang) : 0;
  const monthlySavings = (draft.billingInterval === "month" && currentDisplay !== currentRegular) ? (currentRegular - currentDisplay) : 0;
  const currentSavings = draft.billingInterval === "year" ? savings : monthlySavings;
  const savingsKey = draft.billingInterval === "year" ? "plan_save_yearly" : "plan_save_monthly";
  const savingsLabel = currentSavings > 0 ? t(lang, savingsKey).replace("{amount}", formatPrice(lang, currentSavings)) : "";
  const periodLabel = draft.billingInterval === "month" ? t(lang, "plan_per_month") : t(lang, "plan_per_year");
  const hasPromo = currentDisplay !== currentRegular;

  // VAT / country-aware display adjustments
  const EU_COUNTRIES = new Set([
    "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PT","RO","SK","SI","ES","SE","PL",
  ]);
  function isEU(country: string) {
    return EU_COUNTRIES.has((country || "").toUpperCase());
  }

  // list of countries shown in the dropdown (codes)
  const COUNTRIES = [
    "PL","AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PT","RO","SK","SI","ES","SE","GB","US","CA",
  ];

  function getCountryName(code: string) {
    try {
      // use Intl.DisplayNames on the client to get localized country name
      // `lang` is e.g. 'pl', 'en', 'de'
      // This file is client-only ("use client") so Intl is available in browser.
      // Fallback to code if Intl not available.
      // Some environments may expect BCP-47 locale like 'en-GB' — using `lang` should be acceptable.
      // @ts-ignore
      if (typeof Intl !== "undefined" && (Intl as any).DisplayNames) {
        // @ts-ignore
        const dn = new (Intl as any).DisplayNames([lang], { type: "region" });
        return dn.of(code) || code;
      }
    } catch (e) {
      // ignore and fallback
    }
    return code;
  }

  let effectiveDisplay = currentDisplay;
  let priceSuffix = periodLabel;
  let vatNote: string | null = null;
  // If UI language is Polish -> display gross (+23%) and label as 'brutto'
  if (lang === "pl") {
    effectiveDisplay = Math.round(currentDisplay * 1.23 * 100) / 100;
    priceSuffix = t(lang, "plan_brutto_label") || priceSuffix;
  } else if (isEU(billingCountry) && billingCountry !== "PL") {
    // EU non-PL: if VAT provided and verified -> show net; if not verified -> show price with 23% added and note
    // Only add VAT after an explicit verification attempt that failed
    if (billingTaxId && viesValid === false) {
      effectiveDisplay = Math.round(currentDisplay * 1.23 * 100) / 100;
      vatNote = t(lang, "vat_not_active_added") || null;
    }
  }
  const effectivePriceFormatted = formatPrice(lang, effectiveDisplay, undefined as any);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!acceptTerms) {
      setErr(t(lang, "terms_required"));
      return;
    }
    if (!acceptEarlyAccess) {
      setErr(t(lang, "early_access_required"));
      return;
    }
    const requiredValues = [
      tenantName,
      email,
      password,
      billingFullName,
      billingStreet,
      billingHouseNo,
      billingPostcode,
      billingCity,
      billingCountry,
      companyPhone,
    ];
    if (requiredValues.some((v) => !v.trim())) {
      setErr(t(lang, "register_details_required"));
      return;
    }
    
    // Check if verification was attempted for EU (except PL)
    if (isEU(billingCountry) && billingCountry !== "PL" && !wasViesVerificationAttempted) {
      setViesRequiredError(t(lang, "vies_verification_required_action"));
      // Scroll to the error (basic attempt, though browser usually handles focus if input is invalid)
      // Since we don't have ref efficiently here, we just show the error.
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api<{ payment_token: string }>("/auth/register-tenant", {
        method: "POST",
        body: JSON.stringify({
          tenant_name: tenantName.trim(),
          owner_email: email.trim(),
          owner_password: password,
          lang,
          plan_code: draft.planCode,
          discount_code: discountInfo?.code || (discountCode.trim() ? discountCode.trim() : null),
          billing_full_name: billingFullName.trim() || null,
          billing_street: billingStreet.trim() || null,
          billing_house_no: billingHouseNo.trim() || null,
          billing_apartment_no: billingApartmentNo.trim() || null,
          billing_postcode: billingPostcode.trim() || null,
          billing_city: billingCity.trim() || null,
          billing_region: billingRegion.trim() || null,
          billing_country: billingCountry.trim() || null,
          billing_tax_id: billingTaxId.trim() || null,
                billing_auto_filled: viesAutoFilled || false,
          company_phone: companyPhone.trim() || null,
          newsletter_subscribed: subscribeNewsletter,
        }),
      });
      sessionStorage.removeItem("registerDraft");
      window.location.href = `/${lang}/payment-required?token=${encodeURIComponent(res.payment_token)}`;
    } catch (error) {
      setErr(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 px-4 py-14">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{t(lang, "register_details_title")}</h1>
          <p className="mt-3 text-lg text-gray-600">{t(lang, "register_details_note")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">{t(lang, "billing_details_title")}</h2>
            <p className="text-gray-600 mb-6">{t(lang, "register_details_required")}</p>

            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "company_name")}</label>
                  <div className="relative">
                    <input
                      required
                      onInvalid={handleInvalid}
                      onInput={handleInput}
                      className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      value={tenantName}
                      onChange={(e) => { setTenantName(e.target.value); setViesFilled({ ...viesFilled, tenant: false }); setViesAutoFilled(false); setViesValid(null); }}
                      readOnly={viesFilled.tenant === true}
                    />
                    {viesFilled.tenant === true && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" title={t(lang, "autofilled_from_vies")}>🔒</span>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "owner_email")}</label>
                  <input
                    required
                    onInvalid={handleInvalid}
                    onInput={handleInput}
                    type="email"
                    className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "owner_password")}</label>
                  <input
                    required
                    onInvalid={handleInvalid}
                    onInput={handleInput}
                    type="password"
                    className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2 mt-2">
                  <h3 className="text-lg font-semibold text-gray-800">{t(lang, "billing_details_title")}</h3>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_full_name")}</label>
                  <div className="relative">
                    <input
                      required
                      onInvalid={handleInvalid}
                      onInput={handleInput}
                      className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      value={billingFullName}
                      onChange={(e) => { setBillingFullName(e.target.value); setViesFilled({ ...viesFilled, name: false }); setViesAutoFilled(false); setViesValid(null); }}
                      readOnly={viesFilled.name === true}
                    />
                    {viesFilled.name === true && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" title={t(lang, "autofilled_from_vies")}>🔒</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_street")}</label>
                  <div className="relative">
                    <input
                      required
                      onInvalid={handleInvalid}
                      onInput={handleInput}
                      className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      value={billingStreet}
                      onChange={(e) => { setBillingStreet(e.target.value); setViesFilled({ ...viesFilled, street: false }); setViesAutoFilled(false); setViesValid(null); }}
                      readOnly={viesFilled.street === true}
                    />
                    {viesFilled.street === true && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" title={t(lang, "autofilled_from_vies")}>🔒</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_house_no")}</label>
                  <div className="relative">
                    <input
                      required
                      onInvalid={handleInvalid}
                      onInput={handleInput}
                      className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      value={billingHouseNo}
                      onChange={(e) => { setBillingHouseNo(e.target.value); setViesFilled({ ...viesFilled, house: false }); setViesAutoFilled(false); setViesValid(null); }}
                      readOnly={viesFilled.house === true}
                    />
                    {viesFilled.house === true && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" title={t(lang, "autofilled_from_vies")}>🔒</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_apartment_no")}</label>
                  <div className="relative">
                    <input
                      className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      value={billingApartmentNo}
                      onChange={(e) => { setBillingApartmentNo(e.target.value); setViesFilled({ ...viesFilled, apt: false }); setViesAutoFilled(false); setViesValid(null); }}
                      readOnly={viesFilled.apt === true}
                    />
                    {viesFilled.apt === true && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" title={t(lang, "autofilled_from_vies")}>🔒</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_postcode")}</label>
                  <div className="relative">
                    <input
                      required
                      onInvalid={handleInvalid}
                      onInput={handleInput}
                      className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      value={billingPostcode}
                      onChange={(e) => { setBillingPostcode(e.target.value); setViesFilled({ ...viesFilled, postcode: false }); setViesAutoFilled(false); setViesValid(null); }}
                      readOnly={viesFilled.postcode === true}
                    />
                    {viesFilled.postcode === true && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" title={t(lang, "autofilled_from_vies")}>🔒</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_city")}</label>
                  <div className="relative">
                    <input
                      required
                      onInvalid={handleInvalid}
                      onInput={handleInput}
                      className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      value={billingCity}
                      onChange={(e) => { setBillingCity(e.target.value); setViesFilled({ ...viesFilled, city: false }); setViesAutoFilled(false); setViesValid(null); }}
                      readOnly={viesFilled.city === true}
                    />
                    {viesFilled.city === true && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" title={t(lang, "autofilled_from_vies")}>🔒</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_region")}</label>
                  <div className="relative">
                    <input
                      className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      value={billingRegion}
                      onChange={(e) => { setBillingRegion(e.target.value); setViesFilled({ ...viesFilled, region: false }); setViesAutoFilled(false); setViesValid(null); }}
                      readOnly={viesFilled.region === true}
                    />
                    {viesFilled.region === true && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" title={t(lang, "autofilled_from_vies")}>🔒</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_country")}</label>
                  <select
                    required
                    onInvalid={handleInvalid}
                    onInput={handleInput}
                    value={billingCountry}
                    onChange={(e) => { setBillingCountry(e.target.value); setViesValid(null); setViesData(null); setWasViesVerificationAttempted(false); setViesSuccessMsg(null); setViesRequiredError(null); }}
                    className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{getCountryName(c)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "billing_tax_id")}</label>
                  <div className="flex gap-2">
                    <input
                      className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      value={billingTaxId}
                      onChange={(e) => { setBillingTaxId(e.target.value); setViesValid(null); setViesData(null); setWasViesVerificationAttempted(false); setViesSuccessMsg(null); setViesRequiredError(null); }}
                      readOnly={viesValid === true}
                      placeholder={(() => {
                        if (isCheckingDiscount) return "";
                        if (lang === "pl") return "1234567890";
                        if (lang === "en-us") return "";
                        const countryPrefix = langToDefaultCountry[lang] || "PL";
                        return `${countryPrefix.toUpperCase()}1234567890`;
                      })()}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setViesValid(null);
                        setViesRequiredError(null);
                        setViesData(null);
                        setErr(null);
                        const rawVat = (billingTaxId || "").trim();
                        const rawCountry = (billingCountry || "").trim().toUpperCase();
                        if (!rawVat || !rawCountry) {
                          setErr(t(lang, "vat_required"));
                          return;
                        }
                        // Normalize vat number: remove country prefix if user included it
                        let normalizedVat = rawVat.replace(/\s+/g, "").toUpperCase();
                        if (normalizedVat.startsWith(rawCountry)) {
                          normalizedVat = normalizedVat.slice(rawCountry.length);
                        }
                        setIsVerifyingVat(true);
                        setWasViesVerificationAttempted(true);
                        setViesSuccessMsg(null);
                        try {
                          const res = await api<any>("/billing/verify-vat", { method: "POST", body: JSON.stringify({ country: rawCountry, vat_number: normalizedVat }) });
                          setViesValid(!!res.valid);
                          setViesData(res);
                          if (res.valid) {
                             setViesSuccessMsg(t(lang, "vies_verification_success"));
                          // Build local values first, then set states only if non-empty.
                          const filled: Record<string, boolean> = { name: false, tenant: false, street: false, house: false, apt: false, postcode: false, city: false, region: false, tax: false };
                          let newName = billingFullName || "";
                          let newStreet = billingStreet || "";
                          let newHouse = billingHouseNo || "";
                          let newApt = billingApartmentNo || "";
                          let newPostcode = billingPostcode || "";
                          let newCity = billingCity || "";
                          let newRegion = billingRegion || "";
                          let newTax = billingTaxId || "";

                          if (res.name && String(res.name || "").trim()) {
                            // Only update tenant/company name, keep billingFullName personal (user can change if needed)
                            newName = String(res.name).trim();
                            filled.tenant = true;
                          }
                          
                          if (res.address && String(res.address || "").trim()) {
                            const addr = String(res.address || "");
                            const lines = addr.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
                            if (lines.length > 0) {
                              const first = lines[0];
                              const m = first.match(/^(.*?\D)\s+(\d+[A-Za-z0-9\/-]*)$/);
                              if (m) {
                                newStreet = m[1].trim();
                                filled.street = !!newStreet;
                                const housePart = m[2].trim();
                                if (housePart.includes('/')) {
                                  const [h, a] = housePart.split('/');
                                  newHouse = h.trim();
                                  newApt = (a || "").trim();
                                  filled.house = !!newHouse;
                                  filled.apt = !!newApt;
                                } else {
                                  const ha = housePart.match(/^(\d+)([A-Za-z].*)?$/);
                                  if (ha) {
                                    newHouse = ha[1];
                                    newApt = (ha[2] || "").trim();
                                    filled.house = !!newHouse;
                                    filled.apt = !!newApt;
                                  } else {
                                    newHouse = housePart;
                                    filled.house = !!newHouse;
                                  }
                                }
                              } else {
                                newStreet = first;
                                filled.street = !!newStreet;
                              }
                            }
                            if (lines.length > 1) {
                              const last = lines[lines.length - 1];
                              const m2 = last.match(/(\d{2,5}[- ]?\d{0,5})\s*(.*)/);
                              if (m2) {
                                newPostcode = m2[1].trim();
                                newCity = (m2[2] || "").trim() || newCity;
                                filled.postcode = !!newPostcode;
                                filled.city = !!newCity;
                              } else {
                                newCity = last;
                                filled.city = !!newCity;
                              }
                            }
                          }

                          // normalized VAT with country prefix
                          const prefixCountry = (billingCountry || langToDefaultCountry[lang] || rawCountry).toUpperCase();
                          newTax = prefixCountry + normalizedVat;
                          filled.tax = !!(normalizedVat && normalizedVat.trim());

                          // Apply only non-empty values to state and then mark filled flags
                          // Move VIES name to Tenant/Company Name only
                          if (filled.tenant) {
                             setTenantName(newName);
                          }

                          // Do NOT overwrite billingFullName with VIES name
                          // if (filled.name) setBillingFullName(newName); 

                          if (filled.street) setBillingStreet(newStreet);
                          if (filled.house) setBillingHouseNo(newHouse);
                          if (filled.apt) setBillingApartmentNo(newApt);
                          if (filled.postcode) setBillingPostcode(newPostcode);
                          if (filled.city) setBillingCity(newCity);
                          if (newRegion && String(newRegion).trim()) { setBillingRegion(newRegion); filled.region = true; }
                          if (filled.tax) setBillingTaxId(newTax);

                          setViesFilled(filled);
                          setViesAutoFilled(Object.values(filled).some(Boolean));
                          }
                        } catch (e: any) {
                          setErr(e?.message || String(e));
                        } finally {
                          setIsVerifyingVat(false);
                        }
                      }}
                      className="mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95"
                    >
                      {isVerifyingVat ? t(lang, "loading") : t(lang, "verify_vat")}
                    </button>
                  </div>
                  {viesRequiredError && (
                    <div className="mt-2 text-sm text-red-600 font-bold animate-pulse px-2 py-1 bg-red-50 border border-red-200 rounded">
                       {viesRequiredError}
                    </div>
                  )}
                  {viesSuccessMsg && (
                    <div className="mt-2 text-sm text-green-600">
                      {viesSuccessMsg}
                    </div>
                  )}
                  {viesValid === false && isEU(billingCountry) && billingCountry !== "PL" && (
                    <div className="mt-2 text-sm text-red-600">
                      {t(lang, "vat_not_active_added")}
                    </div>
                  )}
                      {viesFilled.tax === true && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600" title={t(lang, "autofilled_from_vies")}>🔒</span>
                      )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "company_phone")}</label>
                  <input
                    required
                    onInvalid={handleInvalid}
                    onInput={handleInput}
                    className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    onInvalid={handleInvalid}
                    onInput={handleInput}
                    id="acceptTerms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="acceptTerms" className="ml-3 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: t(lang, "accept_terms").replace("{lang}", lang) }} />
                </div>
                <div className="flex items-start">
                  <input
                    onInvalid={handleInvalid}
                    onInput={handleInput}
                    id="acceptEarlyAccess"
                    type="checkbox"
                    checked={acceptEarlyAccess}
                    onChange={(e) => setAcceptEarlyAccess(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="acceptEarlyAccess" className="ml-3 text-sm text-slate-700">
                    {t(lang, "early_access_ack")}
                  </label>
                </div>
                <div className="flex items-start">
                  <input
                    id="subscribeNewsletter"
                    type="checkbox"
                    checked={subscribeNewsletter}
                    onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="subscribeNewsletter" className="ml-3 text-sm text-slate-700">
                    {t(lang, "subscribe_newsletter")}
                  </label>
                </div>
              </div>

              {err && (
                <div className="rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 p-4 text-sm text-red-700 shadow-md">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t(lang, "loading") : t(lang, "payment_required_pay")}
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-white/70 backdrop-blur border border-blue-100 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">{t(lang, PLAN_NAME_KEYS[plan.id])}</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold text-slate-900">{effectivePriceFormatted}</span>
              <span className="ml-2 text-slate-600">{priceSuffix}</span>
            </div>
            {vatNote && (
              <div className="mt-2 text-sm text-red-600">{vatNote}</div>
            )}
            {(hasPromo || discountInfo) && (
              <div className="mt-2">
                <span className="text-sm text-slate-500 line-through">{regularPriceFormatted}</span>
                {discountInfo ? (
                  <span className="ml-2 text-sm font-medium text-green-600">{t(lang, "discount_applied")}</span>
                ) : (
                  <span className="ml-2 text-sm font-medium text-green-600">{savingsLabel}</span>
                )}
              </div>
            )}

            <div className="mt-6 space-y-3 rounded-2xl border border-blue-100 bg-white/70 p-4">
              <label className="text-sm font-semibold text-slate-800">{t(lang, "discount_code")}</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="WINQO10"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setDiscountErr(null);
                    setDiscountInfo(null);
                    if (!discountCode.trim()) {
                      setDiscountErr(t(lang, "discount_required"));
                      return;
                    }
                    setIsCheckingDiscount(true);
                    try {
                      const res = await api<any>("/billing/discount-codes/preview", {
                        method: "POST",
                        body: JSON.stringify({ code: discountCode.trim(), plan_code: draft.planCode, lang }),
                      });
                      setDiscountInfo(res);
                    } catch (e: any) {
                      setDiscountErr(e?.message || String(e));
                    } finally {
                      setIsCheckingDiscount(false);
                    }
                  }}
                  disabled={isCheckingDiscount}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50"
                >
                  {isCheckingDiscount ? t(lang, "loading") : t(lang, "apply")}
                </button>
              </div>
              {discountInfo && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <div className="font-semibold">{t(lang, "discount_applied")}</div>
                  <div>{t(lang, "discount_value").replace("{amount}", formatPrice(lang, discountInfo.discount_amount, discountInfo.currency as any))}</div>
                </div>
              )}
              {discountErr && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{discountErr}</div>
              )}
            </div>
            <div className="mt-6 space-y-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span>{t(lang, "billing_details_note")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span>{t(lang, "register_details_note")}</span>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white shadow-md shadow-blue-500/30">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.5 12.2 11.3 14l3.2-4.2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/90">{t(lang, "secure_payments_title")}</p>
                  <p className="text-sm leading-relaxed text-white/90">{t(lang, "secure_payments_body")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

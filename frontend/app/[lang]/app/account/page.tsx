'use client';
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isLang, type Lang, t } from "../../../../lib/i18n";
import { getToken } from "../../../../lib/auth";
import { apiAuth } from "../../../../lib/api";
import { BillingInterval, PlanId, PLANS, displayPrice, formatPrice, planCode, planCodeStandard, regularPrice } from "../../../../lib/plans";

type Sub = {
  id: string;
  provider: string;
  status: string;
  plan_code: string;
  plan_tier?: string;
  interval?: string;
  monthly_quote_limit?: number | null;
  language_mode?: string;
  price_amount: number;
  currency: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  pending_plan_code?: string | null;
  pending_change_at?: string | null;
};

type Me = {
  email?: string | null;
};

const PLAN_NAME_KEYS: Record<PlanId, string> = {
  starter: "plan_starter_name",
  pro: "plan_pro_name",
  max: "plan_max_name",
};

export default function AccountPage({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const token = getToken()!;
  const searchParams = useSearchParams();
  const billingStatus = searchParams?.get("billing") || "";
  const sessionId = searchParams?.get("session_id") || "";
  const [me, setMe] = useState<any>(null);
  const [tab, setTab] = useState<"profile" | "company" | "billing">("profile");

  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCurrency, setCompanyCurrency] = useState("EUR");
  const [logoData, setLogoData] = useState<string | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);

  const [sub, setSub] = useState<Sub | null>(null);
  const [hasTenant, setHasTenant] = useState<boolean>(true);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [entitlements, setEntitlements] = useState<any>(null);
  const [providers, setProviders] = useState<{ stripe: boolean; paypal: boolean; autopay: boolean }>({
    stripe: false,
    paypal: false,
    autopay: false,
  });
  const [checkoutPlanId, setCheckoutPlanId] = useState<PlanId>("pro");
  const [checkoutInterval, setCheckoutInterval] = useState<BillingInterval>("month");
  const [checkoutProvider, setCheckoutProvider] = useState<"stripe" | "paypal">("stripe");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);
  const [changePlanId, setChangePlanId] = useState<PlanId>("pro");
  const [changeInterval, setChangeInterval] = useState<BillingInterval>("month");
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeMsg, setChangeMsg] = useState<string | null>(null);
  const [changeErr, setChangeErr] = useState<string | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const m = await apiAuth<Me>("/auth/me", token);
    setMe(m);
    setEmail(m.email || "");
    await loadCompany();
    await loadBilling();
  }

  async function loadCompany() {
    try {
      const tenant = await apiAuth<any>("/tenants/me", token);
      setCompanyName(tenant.name || "");
      setCompanyEmail(tenant.company_email || "");
      setCompanyPhone(tenant.company_phone || "");
      setCompanyWebsite(tenant.company_website || "");
      setCompanyAddress(tenant.company_address || "");
      setCompanyCurrency(tenant.default_currency || "EUR");
      setLogoData(tenant.logo_data || null);
    } catch (e) {
      // ignore if tenant not available
    }
  }

  async function loadBilling() {
    setLoadingBilling(true);
    try {
      const s = await apiAuth<{ has_tenant: boolean; subscription: Sub | null }>("/billing/subscription", token);
      setHasTenant(!!s.has_tenant);
      setSub(s.subscription);
      if (s.subscription?.plan_code) {
        setChangePlanId(planIdFromCode(s.subscription.plan_code));
        setChangeInterval(intervalFromCode(s.subscription.plan_code));
      }
      const e = await apiAuth<any>("/billing/entitlements", token);
      setEntitlements(e?.entitlements || null);
      const p = await apiAuth<any>("/billing/providers", token);
      setProviders(p);
      if (!p.stripe && p.paypal) {
        setCheckoutProvider("paypal");
      }
      const h = await apiAuth<any[]>("/billing/history?limit=50", token);
      setHistory(h);
    } finally {
      setLoadingBilling(false);
    }
  }

  useEffect(() => {
    load().catch((e) => setErr(String(e?.message || e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionId || billingStatus !== "success") return;
    apiAuth("/billing/stripe/sync-session", token, {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(() => {
        loadBilling();
      })
      .catch((e: any) => {
        setErr(String(e?.message || e));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, billingStatus]);

  async function saveEmail() {
    setSavingProfile(true);
    setMsg(null); setErr(null);
    try {
      const res = await apiAuth("/users/me", token, { method: "PUT", body: JSON.stringify({ email }) });
      setMe(res);
      setMsg(t(lang,"saved"));
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    setSavingPass(true);
    setMsg(null); setErr(null);
    try {
      await apiAuth("/users/me/password", token, { method: "PUT", body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
      setCurrentPassword(""); setNewPassword("");
      setMsg(t(lang,"password_changed"));
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setSavingPass(false);
    }
  }

  async function saveCompany() {
    setSavingCompany(true);
    setMsg(null); setErr(null);
    try {
      const payload: any = {
        name: companyName,
        company_email: companyEmail,
        company_phone: companyPhone,
        company_website: companyWebsite,
        company_address: companyAddress,
        default_currency: companyCurrency,
      };
      if (logoAllowed) {
        payload.logo_data = logoData;
      }
      await apiAuth("/tenants/me", token, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setMsg(t(lang,"saved"));
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setSavingCompany(false);
    }
  }

  async function openPortal() {
    setErr(null);
    try {
      const returnUrl = window.location.href;
      const res = await apiAuth<{ url: string }>("/billing/portal", token, { method: "POST", body: JSON.stringify({ return_url: returnUrl }) });
      window.location.href = res.url;
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  async function requestPlanChange() {
    setChangeErr(null);
    setChangeMsg(null);
    setChangeLoading(true);
    try {
      const code = planCodeStandard(changePlanId, changeInterval);
      const res = await apiAuth<{ timing: string; kind: string }>("/billing/change-plan", token, {
        method: "POST",
        body: JSON.stringify({ plan_code: code }),
      });
      const msgKey = res.timing === "period_end" ? "billing_change_scheduled" : "billing_change_immediate";
      setChangeMsg(t(lang, msgKey));
      await loadBilling();
    } catch (e: any) {
      setChangeErr(String(e?.message || e));
    } finally {
      setChangeLoading(false);
    }
  }

  async function startCheckout() {
    setCheckoutErr(null);
    setCheckoutLoading(true);
    try {
      const code = planCode(checkoutPlanId, checkoutInterval);
      const res = await apiAuth<{ url: string }>("/billing/checkout", token, {
        method: "POST",
        body: JSON.stringify({ plan_code: code, provider: checkoutProvider }),
      });
      window.location.href = res.url;
    } catch (e: any) {
      setCheckoutErr(String(e?.message || e));
    } finally {
      setCheckoutLoading(false);
    }
  }

  const price = sub ? `${(sub.price_amount / 100).toFixed(2)} ${sub.currency}` : "";

  let planName = "";
  if (entitlements?.plan_tier) {
    planName = t(lang, PLAN_NAME_KEYS[entitlements.plan_tier as PlanId]);
  } else if (sub?.plan_tier) {
    planName = t(lang, PLAN_NAME_KEYS[sub.plan_tier as PlanId]);
  } else if (sub?.plan_code) {
    planName = sub.plan_code;
  }

  let intervalLabel = "";
  if (entitlements?.interval) {
    intervalLabel = t(lang, entitlements.interval === "year" ? "plan_interval_year" : "plan_interval_month");
  } else if (sub?.interval) {
    intervalLabel = t(lang, sub.interval === "year" ? "plan_interval_year" : "plan_interval_month");
  }

  let languageAccessLabel = "";
  if (entitlements?.language_mode) {
    languageAccessLabel = t(lang, entitlements.language_mode === "all" ? "plan_language_access_all" : "plan_language_access_single");
  }

  let quoteLimitLabel = "";
  if (entitlements) {
    quoteLimitLabel = entitlements.monthly_quote_limit
      ? `${entitlements.monthly_quote_count}/${entitlements.monthly_quote_limit}`
      : t(lang, "quote_limit_unlimited");
  }

  const logoAllowed = entitlements ? !!entitlements.logo_allowed : true;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t(lang,"account")}</h1>
              <p className="mt-2 text-sm text-slate-600">{t(lang,"account_subtitle")}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
                {planName && <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">{planName}</span>}
                {intervalLabel && <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">{intervalLabel}</span>}
              </div>
            </div>
            {sub && (
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm">
                <div className="font-semibold text-slate-900">{t(lang,"plan")}: {sub.plan_code}</div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                  <span>{t(lang,"status")}: {sub.status}</span>
                  {sub.provider && <span>{t(lang,"provider")}: {sub.provider}</span>}
                  {sub.current_period_end && <span>{t(lang,"next_renewal")}: {sub.current_period_end}</span>}
                </div>
              </div>
            )}
          </div>
          {msg && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{msg}</div>}
          {err && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-lg backdrop-blur">
          <div className="flex flex-wrap gap-2">
            <TabButton active={tab === "profile"} onClick={()=>setTab("profile")}>{t(lang,"profile")}</TabButton>
            <TabButton active={tab === "company"} onClick={()=>setTab("company")}>{t(lang,"company_data")}</TabButton>
            <TabButton active={tab === "billing"} onClick={()=>setTab("billing")}>{t(lang,"billing")}</TabButton>
          </div>
        </div>

      {tab === "profile" && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-lg backdrop-blur">
          <h2 className="text-lg font-semibold">{t(lang,"profile")}</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm text-gray-700">{t(lang,"email")}</label>
              <input
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 p-2 shadow-inner focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="name@company.com"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                disabled={savingProfile}
                onClick={saveEmail}
              >
                {savingProfile ? t(lang,"saving") : t(lang,"save")}
              </button>
            </div>
          </div>

          <hr className="my-6" />

          <h3 className="text-base font-semibold">{t(lang,"change_password")}</h3>
          <div className="mt-3 grid gap-3">
            <div>
              <label className="text-sm text-gray-700">{t(lang,"current_password")}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e)=>setCurrentPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 p-2 shadow-inner focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">{t(lang,"new_password")}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e)=>setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 p-2 shadow-inner focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="min. 8 chars"
              />
            </div>
            <button
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              disabled={savingPass || !currentPassword || !newPassword}
              onClick={changePassword}
            >
              {savingPass ? t(lang,"saving") : t(lang,"update_password")}
            </button>
          </div>
        </div>
      )}

      {tab === "company" && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-lg backdrop-blur">
          <h2 className="text-lg font-semibold">{t(lang,"company_data")}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-700">{t(lang,"company_name")}</label>
              <input
                value={companyName}
                onChange={(e)=>setCompanyName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 p-2 shadow-inner focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">{t(lang,"company_email")}</label>
              <input
                value={companyEmail}
                onChange={(e)=>setCompanyEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 p-2 shadow-inner focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">{t(lang,"company_phone")}</label>
              <input
                value={companyPhone}
                onChange={(e)=>setCompanyPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 p-2 shadow-inner focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">{t(lang,"company_website")}</label>
              <input
                value={companyWebsite}
                onChange={(e)=>setCompanyWebsite(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 p-2 shadow-inner focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">{t(lang,"default_currency")}</label>
              <select
                value={companyCurrency}
                onChange={(e)=>setCompanyCurrency(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 p-2 shadow-inner focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="EUR">EUR</option>
                <option value="PLN">PLN</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-700">{t(lang,"company_address")}</label>
              <textarea
                value={companyAddress}
                onChange={(e)=>setCompanyAddress(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 p-2 shadow-inner focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-700">{t(lang,"company_logo")}</label>
              {logoAllowed ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e)=>{
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setLogoData(String(reader.result || ""));
                      reader.readAsDataURL(file);
                    }}
                  />
                  {logoData && (
                    <>
                      <img src={logoData} alt={t(lang,"company_logo")} className="h-12 w-auto rounded border border-slate-200" />
                      <button
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-800 transition hover:bg-slate-50"
                        onClick={()=>setLogoData(null)}
                      >
                        {t(lang,"remove_logo")}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-500">{t(lang,"company_logo_unavailable_plan")}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <button
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                disabled={savingCompany}
                onClick={saveCompany}
              >
                {savingCompany ? t(lang,"saving") : t(lang,"save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "billing" && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-lg backdrop-blur">
          <h2 className="text-lg font-semibold">{t(lang,"billing")}</h2>

          {!hasTenant && (
            <p className="mt-3 text-sm text-gray-600">{t(lang,"no_tenant_billing")}</p>
          )}

          {hasTenant && (
            <>
              {entitlements && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Info label={t(lang,"plan_label")} value={planName} />
                  <Info label={t(lang,"plan_interval_label")} value={intervalLabel} />
                  <Info label={t(lang,"plan_language_access_label")} value={languageAccessLabel} />
                  <Info label={t(lang,"quote_limit_label")} value={quoteLimitLabel} />
                </div>
              )}
              <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
                <div className="grid gap-2 md:grid-cols-2">
                  <Info label={t(lang,"plan")} value={sub ? sub.plan_code : t(lang,"none")} />
                  <Info label={t(lang,"price")} value={sub ? price : ""} />
                  <Info label={t(lang,"provider")} value={sub ? sub.provider : ""} />
                  <Info label={t(lang,"status")} value={sub ? sub.status : t(lang,"none")} />
                  <Info label={t(lang,"next_renewal")} value={sub?.current_period_end || "-"} />
                  <Info label={t(lang,"cancel_at_period_end")} value={sub ? String(!!sub.cancel_at_period_end) : "-"} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                    onClick={openPortal}
                    disabled={!sub || loadingBilling}
                  >
                    {t(lang,"manage_subscription")}
                  </button>
                  <button
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
                    onClick={loadBilling}
                    disabled={loadingBilling}
                  >
                    {loadingBilling ? t(lang,"loading") : t(lang,"refresh")}
                  </button>
                </div>
                {!sub && <p className="mt-3 text-sm text-gray-600">{t(lang,"no_subscription_yet")}</p>}
              </div>

              {sub && (
                <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
                  <div className="text-base font-semibold">{t(lang,"billing_change_title")}</div>
                  <p className="mt-1 text-sm text-gray-600">{t(lang,"billing_change_note")}</p>
                  {sub.pending_plan_code && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      {t(lang,"billing_change_pending").replace("{plan}", sub.pending_plan_code || "").replace("{date}", sub.pending_change_at || "")}
                    </div>
                  )}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm">{t(lang,"plan_label")}</label>
                      <select
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={changePlanId}
                        onChange={(e)=>setChangePlanId(e.target.value as PlanId)}
                      >
                        {PLANS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {t(lang, PLAN_NAME_KEYS[p.id])}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm">{t(lang,"plan_interval_label")}</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`rounded-xl px-4 py-2 text-sm ${changeInterval === "month" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow" : "border border-slate-200 text-slate-800"}`}
                          onClick={() => setChangeInterval("month")}
                        >
                          {t(lang,"plan_interval_month")}
                        </button>
                        <button
                          type="button"
                          className={`rounded-xl px-4 py-2 text-sm ${changeInterval === "year" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow" : "border border-slate-200 text-slate-800"}`}
                          onClick={() => setChangeInterval("year")}
                        >
                          {t(lang,"plan_interval_year")}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      {formatPrice(lang, regularPrice(PLANS.find((p)=>p.id===changePlanId) || PLANS[1], changeInterval, lang))}{" "}
                      {changeInterval === "year" ? t(lang,"plan_per_year") : t(lang,"plan_per_month")}
                    </div>
                    <button
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                      onClick={requestPlanChange}
                      disabled={changeLoading}
                    >
                      {changeLoading ? t(lang,"loading") : t(lang,"billing_change_action")}
                    </button>
                  </div>
                  {changeErr && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {changeErr}
                    </div>
                  )}
                  {changeMsg && (
                    <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                      {changeMsg}
                    </div>
                  )}
                </div>
              )}

              {(!sub || sub.status === "inactive" || sub.status === "canceled") && (
                <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
                  <div className="text-base font-semibold">{t(lang,"billing_subscribe_title")}</div>
                  <p className="mt-1 text-sm text-gray-600">{t(lang,"billing_subscribe_note")}</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm">{t(lang,"plan_label")}</label>
                      <select
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={checkoutPlanId}
                        onChange={(e)=>setCheckoutPlanId(e.target.value as PlanId)}
                      >
                        {PLANS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {t(lang, PLAN_NAME_KEYS[p.id])}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm">{t(lang,"plan_interval_label")}</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`rounded-xl px-4 py-2 text-sm ${checkoutInterval === "month" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow" : "border border-slate-200 text-slate-800"}`}
                          onClick={() => setCheckoutInterval("month")}
                        >
                          {t(lang,"plan_interval_month")}
                        </button>
                        <button
                          type="button"
                          className={`rounded-xl px-4 py-2 text-sm ${checkoutInterval === "year" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow" : "border border-slate-200 text-slate-800"}`}
                          onClick={() => setCheckoutInterval("year")}
                        >
                          {t(lang,"plan_interval_year")}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm">{t(lang,"billing_provider_label")}</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {providers.stripe && (
                        <button
                          type="button"
                          className={`rounded-xl px-4 py-2 text-sm ${checkoutProvider === "stripe" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow" : "border border-slate-200 text-slate-800"}`}
                          onClick={() => setCheckoutProvider("stripe")}
                        >
                          {t(lang,"billing_provider_stripe")}
                        </button>
                      )}
                      {providers.paypal && (
                        <button
                          type="button"
                          className={`rounded-xl px-4 py-2 text-sm ${checkoutProvider === "paypal" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow" : "border border-slate-200 text-slate-800"}`}
                          onClick={() => setCheckoutProvider("paypal")}
                        >
                          {t(lang,"billing_provider_paypal")}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      {formatPrice(lang, displayPrice(PLANS.find((p)=>p.id===checkoutPlanId) || PLANS[1], checkoutInterval, lang))}{" "}
                      {checkoutInterval === "year" ? t(lang,"plan_per_year") : t(lang,"plan_per_month")}
                    </div>
                    <button
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                      onClick={startCheckout}
                      disabled={checkoutLoading || (!providers.stripe && !providers.paypal)}
                    >
                      {checkoutLoading ? t(lang,"loading") : t(lang,"billing_start_subscription")}
                    </button>
                  </div>
                  {checkoutErr && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {checkoutErr}
                    </div>
                  )}
                </div>
              )}

              <h3 className="mt-6 text-base font-semibold">{t(lang,"payment_history")}</h3>
              <div className="mt-3 overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="p-3">{t(lang,"date")}</th>
                      <th className="p-3">{t(lang,"provider")}</th>
                      <th className="p-3">{t(lang,"event")}</th>
                      <th className="p-3">{t(lang,"ok")}</th>
                      <th className="p-3">{t(lang,"error")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td className="p-3 text-gray-500" colSpan={5}>{t(lang,"no_history")}</td></tr>
                    ) : history.map((r:any)=> (
                      <tr key={r.id} className="border-t">
                        <td className="p-3">{r.received_at}</td>
                        <td className="p-3">{r.provider}</td>
                        <td className="p-3">{r.event_type}</td>
                        <td className="p-3">{String(!!r.processed_ok)}</td>
                        <td className="p-3 text-gray-600">{r.error || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-gray-500">{t(lang,"history_note")}</p>
            </>
          )}
        </div>
      )}
    </div>
  </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm transition ${active ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow" : "border border-slate-200 bg-white/70 text-slate-800 hover:border-slate-300"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function planIdFromCode(planCode: string): PlanId {
  if (planCode.startsWith("STARTER")) return "starter";
  if (planCode.startsWith("PRO")) return "pro";
  return "max";
}

function intervalFromCode(planCode: string): BillingInterval {
  return planCode.includes("_Y") ? "year" : "month";
}

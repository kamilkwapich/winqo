'use client';
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getToken } from "../../../../lib/auth";
import { apiAuth } from "../../../../lib/api";
import { isLang, type Lang, t } from "../../../../lib/i18n";

const parseError = (err: any): string => {
  const raw = String(err?.message || err || "");
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.detail) {
      return typeof parsed.detail === "string" ? parsed.detail : JSON.stringify(parsed.detail);
    }
  } catch (_) {}
  return raw;
};

export default function AdminPage({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const token = getToken()!;
  
  // Navigation Links
  const navLinks = (
      <div className="flex gap-4 mb-6 border-b pb-4">
          <span className="font-bold text-gray-700">Dashboard</span>
          <Link href={`/${lang}/app/admin/users`} className="text-blue-600 hover:underline">All Users & Tenants</Link>
          <Link href={`/${lang}/app/admin/logs`} className="text-blue-600 hover:underline">Payment Logs (Failures)</Link>
      </div>
  );

  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>(null);
  const [discountCodes, setDiscountCodes] = useState<any[]>([]);
  const [newDiscount, setNewDiscount] = useState<any>({ code: "", type: "percent", percent_value: 10, amount_cents: null, currency: "EUR", expires_at: "", active: true });
  const [emailSettings, setEmailSettings] = useState<any>(null);
  const [emailTestAddress, setEmailTestAddress] = useState("");
  const [emailTestResult, setEmailTestResult] = useState<any>(null);
  const [newUser, setNewUser] = useState<{ email: string; password: string; tenant_id: string; role: string; is_active: boolean }>({ email: "", password: "", tenant_id: "", role: "TENANT_USER", is_active: true });
  const [creatingUser, setCreatingUser] = useState(false);
  const [newTenant, setNewTenant] = useState<{ name: string; default_lang: string; default_currency: string }>({ name: "", default_lang: "pl", default_currency: "EUR" });
  const [creatingTenant, setCreatingTenant] = useState(false);
  const [newSub, setNewSub] = useState<{ tenant_id: string; plan_code: string; provider: string; currency: string; price_amount: string; status: string }>({ tenant_id: "", plan_code: "PRO_M", provider: "stripe", currency: "EUR", price_amount: "", status: "active" });
  const [creatingSub, setCreatingSub] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [planUpdates, setPlanUpdates] = useState<Record<string, string>>({});
  const planOptions = useMemo(() => ["DEMO","STARTER_M","STARTER_Y","PRO_M","PRO_Y","MAX_M","MAX_Y"], []);
  const roleOptions = useMemo(() => ["TENANT_USER", "TENANT_OWNER", "SUPER_ADMIN"], []);
  const normalizePlanCode = (code: string) => {
    if (code === "PRO_M_TRIAL") return "PRO_M";
    if (code === "PRO_Y_PROMO") return "PRO_Y";
    return code;
  };

  async function load() {
    setErr(null);
    setMsg(null);
    try {
      const [t, u, s, b, d] = await Promise.all([
        apiAuth<any[]>("/admin/tenants", token),
        apiAuth<any[]>("/admin/users", token),
        apiAuth<any[]>("/admin/subscriptions", token),
        apiAuth<any>("/billing/settings", token),
        apiAuth<any[]>("/admin/discount-codes", token),
      ]);
      const es = await apiAuth<any>("/admin/email-settings", token);
      setTenants(t); setUsers(u); setSubs(s); setBilling(b); setDiscountCodes(d);
      setEmailSettings(es);
    } catch (e:any) { setErr(e.message); }
  }

  useEffect(()=>{ load(); }, []);

  async function createUser() {
    setErr(null);
    setMsg(null);
    setCreatingUser(true);
    try {
      await apiAuth("/admin/users", token, {
        method: "POST",
        body: JSON.stringify({
          email: newUser.email.trim(),
          password: newUser.password,
          tenant_id: newUser.tenant_id || null,
          role: newUser.role || "TENANT_USER",
          is_active: !!newUser.is_active,
        }),
      });
      setNewUser({ email: "", password: "", tenant_id: "", role: "TENANT_USER", is_active: true });
      await load();
      setMsg(t(lang, "saved"));
    } catch (e:any) {
      setErr(parseError(e));
    } finally {
      setCreatingUser(false);
    }
  }

  const tenantNameById = useMemo(() => {
    const map: Record<string, string> = {};
    tenants.forEach((tenant) => {
      if (tenant?.id) {
        map[String(tenant.id)] = String(tenant.name || "");
      }
    });
    return map;
  }, [tenants]);

  return (
    <div className="space-y-6">
      {navLinks}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{t(lang,"admin")}</h1>
        <p className="mt-1 text-sm text-gray-600">{t(lang,"admin_subtitle")}</p>
        {err && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
        {msg && <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{msg}</div>}
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t(lang,"billing_settings")}</h2>
        {billing && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Toggle label={t(lang,"stripe_enabled")} value={billing.stripe_enabled} onChange={(v)=>setBilling({ ...billing, stripe_enabled: v })} />
            <Toggle label={t(lang,"paypal_enabled")} value={billing.paypal_enabled} onChange={(v)=>setBilling({ ...billing, paypal_enabled: v })} />
            <Toggle label={t(lang,"autopay_enabled")} value={billing.autopay_enabled} onChange={(v)=>setBilling({ ...billing, autopay_enabled: v })} />
            <div>
              <label className="text-sm">{t(lang,"mode")}</label>
              <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={billing.mode} onChange={(e)=>setBilling({ ...billing, mode: e.target.value })}>
                <option value="sandbox">{t(lang,"sandbox")}</option>
                <option value="live">{t(lang,"live")}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">{t(lang,"exchange_rates")}</label>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <RateInput label={t(lang,"rate_pln")} value={billing.fx_rates?.PLN || ""} onChange={(v)=>setBilling({ ...billing, fx_rates: { ...billing.fx_rates, PLN: v } })} />
                <RateInput label={t(lang,"rate_usd")} value={billing.fx_rates?.USD || ""} onChange={(v)=>setBilling({ ...billing, fx_rates: { ...billing.fx_rates, USD: v } })} />
                <RateInput label={t(lang,"rate_gbp")} value={billing.fx_rates?.GBP || ""} onChange={(v)=>setBilling({ ...billing, fx_rates: { ...billing.fx_rates, GBP: v } })} />
              </div>
              <button
                className="mt-3 rounded-xl border px-3 py-2 text-xs hover:bg-gray-50 disabled:opacity-50"
                disabled={ratesLoading}
                onClick={async () => {
                  if (!billing) return;
                  setRatesLoading(true);
                  setErr(null);
                  try {
                    const data = await apiAuth<{ rates: Record<string, number> }>("/billing/fx-rates/nbp", token);
                    const nextBilling = {
                      ...billing,
                      fx_rates: { ...billing.fx_rates, ...data.rates },
                    };
                    setBilling(nextBilling);
                    await apiAuth("/billing/settings", token, { method:"PUT", body: JSON.stringify(nextBilling) });
                    setMsg(t(lang,"saved"));
                  } catch (e:any) {
                    setErr(String(e?.message || e));
                  } finally {
                    setRatesLoading(false);
                  }
                }}
              >
                {t(lang,"fetch_rates_nbp")}
              </button>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">{t(lang,"dashboard_banner")}</label>
              <p className="mt-1 text-xs text-gray-500">{t(lang,"dashboard_banner_hint")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setBilling({ ...billing, dashboard_banner_data: String(reader.result || "") });
                    reader.readAsDataURL(file);
                  }}
                />
                {billing.dashboard_banner_data && (
                  <button
                    className="rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50"
                    onClick={() => setBilling({ ...billing, dashboard_banner_data: null })}
                    type="button"
                  >
                    {t(lang,"remove_banner")}
                  </button>
                )}
              </div>
              {billing.dashboard_banner_data ? (
                <img
                  src={billing.dashboard_banner_data}
                  alt={t(lang,"dashboard_banner")}
                  className="mt-3 w-full max-w-3xl rounded-xl border object-cover"
                  style={{ aspectRatio: "3 / 1" }}
                />
              ) : (
                <div className="mt-3 flex h-32 w-full max-w-3xl items-center justify-center rounded-xl border border-dashed text-xs text-gray-400">
                  {t(lang,"stats_banner_empty")}
                </div>
              )}
            </div>
            <div className="flex items-end">
              <button
                className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                onClick={async ()=> {
                  try {
                    await apiAuth("/billing/settings", token, { method:"PUT", body: JSON.stringify(billing) });
                    setMsg(t(lang,"saved"));
                    await load();
                  } catch (e:any) {
                    setErr(String(e?.message || e));
                  }
                }}
              >
                {t(lang,"save")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t(lang,"email_settings")}</h2>
        {emailSettings && (
          <>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm">{t(lang,"smtp_host")}</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={emailSettings.smtp_host || ""} onChange={(e)=>setEmailSettings({ ...emailSettings, smtp_host: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">{t(lang,"smtp_port")}</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={emailSettings.smtp_port || ""} onChange={(e)=>setEmailSettings({ ...emailSettings, smtp_port: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">{t(lang,"smtp_user")}</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={emailSettings.smtp_user || ""} onChange={(e)=>setEmailSettings({ ...emailSettings, smtp_user: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">{t(lang,"smtp_password")}</label>
              <input type="password" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={emailSettings.smtp_password || ""} onChange={(e)=>setEmailSettings({ ...emailSettings, smtp_password: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">{t(lang,"smtp_from")}</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={emailSettings.smtp_from || ""} onChange={(e)=>setEmailSettings({ ...emailSettings, smtp_from: e.target.value })} />
            </div>
            <Toggle label={t(lang,"smtp_tls")} value={!!emailSettings.smtp_tls} onChange={(v)=>setEmailSettings({ ...emailSettings, smtp_tls: v })} />

            <div>
              <label className="text-sm">{t(lang,"imap_host")}</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={emailSettings.imap_host || ""} onChange={(e)=>setEmailSettings({ ...emailSettings, imap_host: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">{t(lang,"imap_port")}</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={emailSettings.imap_port || ""} onChange={(e)=>setEmailSettings({ ...emailSettings, imap_port: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">{t(lang,"imap_user")}</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={emailSettings.imap_user || ""} onChange={(e)=>setEmailSettings({ ...emailSettings, imap_user: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">{t(lang,"imap_password")}</label>
              <input type="password" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={emailSettings.imap_password || ""} onChange={(e)=>setEmailSettings({ ...emailSettings, imap_password: e.target.value })} />
            </div>
            <Toggle label={t(lang,"imap_tls")} value={!!emailSettings.imap_tls} onChange={(v)=>setEmailSettings({ ...emailSettings, imap_tls: v })} />

            <div className="md:col-span-2">
              <label className="text-sm">{t(lang,"email_test_address")}</label>
              <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={emailTestAddress} onChange={(e)=>setEmailTestAddress(e.target.value)} />
            </div>

            <div className="flex items-end gap-2">
              <button
                className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                onClick={async ()=> {
                  try {
                    await apiAuth("/admin/email-settings", token, { method:"PUT", body: JSON.stringify(emailSettings) });
                    setMsg(t(lang,"saved"));
                  } catch (e:any) {
                    setErr(String(e?.message || e));
                  }
                }}
              >
                {t(lang,"save")}
              </button>
              <button
                className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={async ()=> {
                  try {
                    const res = await apiAuth("/admin/email-settings/test", token, { method:"POST", body: JSON.stringify({ test_email: emailTestAddress }) });
                    setEmailTestResult(res);
                    setMsg(t(lang,"email_test_sent"));
                  } catch (e:any) {
                    setErr(String(e?.message || e));
                  }
                }}
              >
                {t(lang,"test_connection")}
              </button>
            </div>
          </div>

          <Section title={t(lang,"discount_codes")}>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">{t(lang,"discount_code")}</label>
                  <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={newDiscount.code} onChange={(e)=>setNewDiscount({ ...newDiscount, code: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">{t(lang,"discount_type")}</label>
                    <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={newDiscount.type} onChange={(e)=>setNewDiscount({ ...newDiscount, type: e.target.value })}>
                      <option value="percent">{t(lang,"discount_type_percent")}</option>
                      <option value="amount">{t(lang,"discount_type_amount")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">{t(lang,"discount_currency")}</label>
                    <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={newDiscount.currency || ""} onChange={(e)=>setNewDiscount({ ...newDiscount, currency: e.target.value.toUpperCase() })} />
                  </div>
                </div>
                {newDiscount.type === "percent" ? (
                  <div>
                    <label className="text-sm font-medium text-gray-700">{t(lang,"discount_percent")}</label>
                    <input type="number" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={newDiscount.percent_value || ""} onChange={(e)=>setNewDiscount({ ...newDiscount, percent_value: Number(e.target.value), amount_cents: null })} />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-gray-700">{t(lang,"discount_amount")}</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="9.00"
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                      value={newDiscount.amount_cents ?? ""}
                      onChange={(e)=>setNewDiscount({ ...newDiscount, amount_cents: e.target.value, percent_value: null })}
                    />
                    <p className="mt-1 text-xs text-gray-500">{t(lang,"discount_amount")} in currency units (e.g. 9 = 9 EUR)</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">{t(lang,"discount_expires_at")}</label>
                  <input type="datetime-local" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={newDiscount.expires_at || ""} onChange={(e)=>setNewDiscount({ ...newDiscount, expires_at: e.target.value })} />
                </div>
                <Toggle label={t(lang,"discount_active") + '?'} value={!!newDiscount.active} onChange={(v)=>setNewDiscount({ ...newDiscount, active: v })} />
                <button
                  className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                  onClick={async ()=>{
                    const amountNumber = Number(String(newDiscount.amount_cents ?? "").replace(",", "."));
                    const payload = {
                      code: (newDiscount.code || "").trim().toUpperCase(),
                      type: newDiscount.type || "percent",
                      percent_value: newDiscount.type === "percent" ? Number(newDiscount.percent_value ?? 0) : null,
                      amount_cents: newDiscount.type === "amount" ? Math.round((amountNumber || 0) * 100) : null,
                      currency: newDiscount.currency ? newDiscount.currency.trim().toUpperCase() : null,
                      expires_at: newDiscount.expires_at || null,
                      active: !!newDiscount.active,
                    };
                    if (!payload.code) {
                      setErr(t(lang,"discount_code") + " is required");
                      return;
                    }
                    if (payload.type === "percent" && (payload.percent_value === null || Number.isNaN(payload.percent_value))) {
                      setErr(t(lang,"discount_percent") + " is required");
                      return;
                    }
                    if (payload.type === "amount" && (payload.amount_cents === null || Number.isNaN(payload.amount_cents))) {
                      setErr(t(lang,"discount_amount") + " is required");
                      return;
                    }
                    try {
                      await apiAuth("/admin/discount-codes", token, { method:"POST", body: JSON.stringify(payload) });
                      setMsg(t(lang,"saved"));
                      setNewDiscount({ code: "", type: newDiscount.type, percent_value: newDiscount.type === "percent" ? newDiscount.percent_value : 10, amount_cents: null, currency: newDiscount.currency, expires_at: "", active: true });
                      await load();
                    } catch (e:any) {
                      setErr(parseError(e));
                    }
                  }}
                >
                  {t(lang,"create_discount_code")}
                </button>
              </div>

              <div className="overflow-auto rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-3 py-2">{t(lang,"discount_code")}</th>
                      <th className="px-3 py-2">{t(lang,"discount_type")}</th>
                      <th className="px-3 py-2">{t(lang,"discount_value")}</th>
                      <th className="px-3 py-2">{t(lang,"active")}</th>
                      <th className="px-3 py-2">{t(lang,"actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountCodes.map((c:any)=> (
                      <tr key={c.id} className="border-t">
                        <td className="px-3 py-2 font-semibold">{c.code}</td>
                        <td className="px-3 py-2">{c.type === "percent" ? t(lang,"discount_type_percent") : t(lang,"discount_type_amount")}</td>
                        <td className="px-3 py-2">{c.type === "percent" ? `${c.percent_value}%` : `${(Number(c.amount_cents || 0) / 100).toFixed(2)} ${c.currency || ""}`}</td>
                        <td className="px-3 py-2">{c.active ? "✓" : "✗"}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                              onClick={async ()=>{
                                try {
                                  await apiAuth(`/admin/discount-codes/${c.code}`, token, { method:"PUT", body: JSON.stringify({ active: !c.active }) });
                                  await load();
                                } catch (e:any) { setErr(String(e?.message || e)); }
                              }}
                            >
                              {c.active ? t(lang,"disable") : t(lang,"enable")}
                            </button>
                            <button
                              className="rounded-lg border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                              onClick={async ()=>{
                                if (!confirm(t(lang,"confirm_delete"))) return;
                                try {
                                  await apiAuth(`/admin/discount-codes/${c.code}`, token, { method:"DELETE" });
                                  await load();
                                } catch (e:any) { setErr(String(e?.message || e)); }
                              }}
                            >
                              {t(lang,"delete")}
                            </button>
                          </div>
                          {c.expires_at && <div className="mt-1 text-xs text-gray-500">{t(lang,"discount_expires_at")}: {c.expires_at}</div>}
                        </td>
                      </tr>
                    ))}
                    {discountCodes.length === 0 && <tr><td className="px-3 py-4 text-gray-500" colSpan={5}>{t(lang,"no_data")}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>
          </>
        )}
        {emailTestResult && (
          <div className="mt-4 text-sm text-gray-600">
            SMTP: {String(!!emailTestResult.smtp_ok)}{emailTestResult.smtp_error ? ` (${emailTestResult.smtp_error})` : ""}<br/>
            IMAP: {String(!!emailTestResult.imap_ok)}{emailTestResult.imap_error ? ` (${emailTestResult.imap_error})` : ""}
          </div>
        )}
      </div>

      <Section title={t(lang,"tenants")}>
        <div className="mb-4 rounded-xl border bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-800">{t(lang, "create_tenant")}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-gray-600">{t(lang, "name")}</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={newTenant.name}
                onChange={(e)=>setNewTenant({ ...newTenant, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t(lang, "lang")}</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={newTenant.default_lang}
                onChange={(e)=>setNewTenant({ ...newTenant, default_lang: e.target.value })}
              >
                {["pl","en","en-us","en-uk","de","es","it","fr"].map((l)=> (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t(lang, "default_currency")}</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={newTenant.default_currency}
                onChange={(e)=>setNewTenant({ ...newTenant, default_currency: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <button
                className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                disabled={creatingTenant}
                onClick={async ()=> {
                  setErr(null); setMsg(null); setCreatingTenant(true);
                  try {
                    await apiAuth("/admin/tenants", token, { method: "POST", body: JSON.stringify({
                      name: newTenant.name,
                      default_lang: newTenant.default_lang,
                      default_currency: newTenant.default_currency,
                    }) });
                    setNewTenant({ name: "", default_lang: "pl", default_currency: "EUR" });
                    await load();
                    setMsg(t(lang, "saved"));
                  } catch (e:any) {
                    setErr(parseError(e));
                  } finally {
                    setCreatingTenant(false);
                  }
                }}
              >
                {creatingTenant ? t(lang,"saving") : t(lang,"create_tenant")}
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">{t(lang,"name")}</th>
                <th className="py-2">{t(lang,"lang")}</th>
                <th className="py-2">{t(lang,"newsletter")}</th>
                <th className="py-2">{t(lang,"id")}</th>
                <th className="py-2">{t(lang,"actions")}</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant:any)=> (
                <tr key={tenant.id} className="border-t">
                  <td className="py-2 pr-6">{tenant.name}</td>
                  <td className="py-2 pr-6">{tenant.default_lang}</td>
                  <td className="py-2 pr-6">{tenant.newsletter_subscribed ? "✓" : "✗"}</td>
                  <td className="py-2 pr-6">{tenant.id}</td>
                  <td className="py-2">
                    <button
                      className="rounded-lg border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={async ()=> {
                        if (!confirm(t(lang,"confirm_delete"))) return;
                        try {
                          await apiAuth(`/admin/tenants/${tenant.id}`, token, { method: "DELETE" });
                          await load();
                        } catch (e:any) {
                          setErr(String(e?.message || e));
                        }
                      }}
                    >
                      {t(lang, "delete")}
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && <tr><td className="py-6 text-gray-500" colSpan={5}>{t(lang,"no_data")}</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={t(lang,"users")}>
        <div className="mb-4 rounded-xl border bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-800">{t(lang, "create_user")}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-gray-600">{t(lang, "email")}</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={newUser.email}
                onChange={(e)=>setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t(lang, "password")}</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={newUser.password}
                onChange={(e)=>setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t(lang, "role")}</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={newUser.role}
                onChange={(e)=>setNewUser({ ...newUser, role: e.target.value })}
              >
                {roleOptions.map((r)=> (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t(lang, "tenant")}</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={newUser.tenant_id}
                onChange={(e)=>setNewUser({ ...newUser, tenant_id: e.target.value })}
              >
                <option value="">{t(lang, "none")}</option>
                {tenants.map((tenant:any)=> (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:col-span-2 lg:col-span-4">
              <Toggle label={t(lang, "active") || "Active"} value={!!newUser.is_active} onChange={(v:boolean)=>setNewUser({ ...newUser, is_active: v })} />
              <button
                className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                onClick={createUser}
                disabled={creatingUser}
              >
                {creatingUser ? t(lang, "saving") : t(lang, "create_user")}
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">{t(lang,"email")}</th>
                <th className="py-2">{t(lang,"role")}</th>
                <th className="py-2">{t(lang,"tenant")}</th>
                <th className="py-2">{t(lang,"active")}</th>
                <th className="py-2">{t(lang,"actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u:any)=> (
                <tr key={u.id} className="border-t">
                  <td className="py-2 pr-6">{u.email}</td>
                  <td className="py-2 pr-6">{String(u.role)}</td>
                  <td className="py-2 pr-6">{u.tenant_id ? (tenantNameById[u.tenant_id] || u.tenant_id) : ""}</td>
                  <td className="py-2 pr-6">{String(!!u.is_active)}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={async () => {
                          try {
                            await apiAuth(`/admin/users/${u.id}`, token, { method:"PUT", body: JSON.stringify({ is_active: !u.is_active }) });
                            await load();
                          } catch (e:any) { setErr(String(e?.message || e)); }
                        }}
                      >
                        {u.is_active ? t(lang,"block_user") : t(lang,"unblock_user")}
                      </button>
                      <button
                        className="rounded-lg border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          if (!confirm(t(lang,"confirm_delete"))) return;
                          try {
                            await apiAuth(`/admin/users/${u.id}`, token, { method:"DELETE" });
                            await load();
                          } catch (e:any) { setErr(String(e?.message || e)); }
                        }}
                      >
                        {t(lang,"delete_user")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td className="py-6 text-gray-500" colSpan={5}>{t(lang,"no_data")}</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={t(lang,"subscriptions")}>
        <div className="mb-4 rounded-xl border bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-800">{t(lang, "create_subscription")}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-gray-600">{t(lang, "tenant")}</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={newSub.tenant_id}
                onChange={(e)=>setNewSub({ ...newSub, tenant_id: e.target.value })}
              >
                <option value="">{t(lang, "none")}</option>
                {tenants.map((tenant:any)=> (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t(lang, "plan")}</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={newSub.plan_code}
                onChange={(e)=>setNewSub({ ...newSub, plan_code: e.target.value })}
              >
                {planOptions.map((code)=> <option key={code} value={code}>{code}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t(lang, "provider")}</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={newSub.provider}
                onChange={(e)=>setNewSub({ ...newSub, provider: e.target.value })}
              >
                {["stripe","paypal","autopay"].map((p)=> <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t(lang, "currency")}</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={newSub.currency}
                onChange={(e)=>setNewSub({ ...newSub, currency: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t(lang, "status")}</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={newSub.status}
                onChange={(e)=>setNewSub({ ...newSub, status: e.target.value })}
              >
                {["active","trialing","inactive","past_due","canceled"].map((s)=> <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">{t(lang, "price")}</label>
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder={t(lang,"price")}
                value={newSub.price_amount}
                onChange={(e)=>setNewSub({ ...newSub, price_amount: e.target.value })}
              />
              <p className="mt-1 text-[11px] text-gray-500">{t(lang,"price")}: {t(lang,"unit_price_cents")}</p>
            </div>
            <div className="lg:col-span-6 flex items-end">
              <button
                className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                disabled={creatingSub}
                onClick={async ()=> {
                  if (!newSub.tenant_id) { setErr(t(lang, "tenant") + " required"); return; }
                  setErr(null); setMsg(null); setCreatingSub(true);
                  try {
                    const payload: any = {
                      tenant_id: newSub.tenant_id,
                      plan_code: newSub.plan_code,
                      provider: newSub.provider,
                      currency: newSub.currency,
                      status: newSub.status,
                    };
                    if (newSub.price_amount) {
                      payload.price_amount = Math.round(Number(newSub.price_amount));
                    }
                    await apiAuth("/admin/subscriptions", token, { method: "POST", body: JSON.stringify(payload) });
                    setNewSub({ tenant_id: "", plan_code: "PRO_M", provider: "stripe", currency: "EUR", price_amount: "", status: "active" });
                    await load();
                    setMsg(t(lang, "saved"));
                  } catch (e:any) {
                    setErr(parseError(e));
                  } finally {
                    setCreatingSub(false);
                  }
                }}
              >
                {creatingSub ? t(lang,"saving") : t(lang,"create_subscription")}
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">{t(lang,"tenant")}</th>
                <th className="py-2">{t(lang,"provider")}</th>
                <th className="py-2">{t(lang,"status")}</th>
                <th className="py-2">{t(lang,"plan")}</th>
                <th className="py-2">{t(lang,"currency")}</th>
                <th className="py-2">{t(lang,"actions")}</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s:any)=> (
                <tr key={s.id} className="border-t">
                  <td className="py-2 pr-6">{tenantNameById[s.tenant_id] || s.tenant_id}</td>
                  <td className="py-2 pr-6">{s.provider}</td>
                  <td className="py-2 pr-6">{s.status}</td>
                  <td className="py-2 pr-6">
                    <div>{s.plan_code}</div>
                    {s.pending_plan_code && <div className="text-xs text-amber-600">{t(lang,"pending")}: {s.pending_plan_code}</div>}
                  </td>
                  <td className="py-2 pr-6">{s.currency}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="rounded-lg border px-2 py-1 text-xs"
                        value={planUpdates[s.id] || normalizePlanCode(s.plan_code)}
                        onChange={(e)=>setPlanUpdates({ ...planUpdates, [s.id]: e.target.value })}
                      >
                        {planOptions.map((code) => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                      <button
                        className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={async () => {
                          try {
                            await apiAuth(`/admin/subscriptions/${s.id}/change-plan`, token, { method:"POST", body: JSON.stringify({ plan_code: planUpdates[s.id] || s.plan_code }) });
                            await load();
                          } catch (e:any) { setErr(String(e?.message || e)); }
                        }}
                      >
                        {t(lang,"apply")}
                      </button>
                      <button
                        className="rounded-lg border px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
                        onClick={async () => {
                          if (!confirm(t(lang,"confirm_force_plan"))) return;
                          try {
                            await apiAuth(`/admin/subscriptions/${s.id}/force-plan`, token, { method:"POST", body: JSON.stringify({ plan_code: planUpdates[s.id] || s.plan_code }) });
                            await load();
                          } catch (e:any) { setErr(String(e?.message || e)); }
                        }}
                      >
                        {t(lang,"force_apply")}
                      </button>
                      <button
                        className="rounded-lg border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          if (!confirm(t(lang, "confirm_delete"))) return;
                          try {
                            await apiAuth(`/admin/subscriptions/${s.id}`, token, { method:"DELETE" });
                            await load();
                          } catch (e:any) { setErr(String(e?.message || e)); }
                        }}
                      >
                        {t(lang, "delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subs.length === 0 && <tr><td className="py-6 text-gray-500" colSpan={6}>{t(lang,"no_data")}</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border p-3">
      <span className="text-sm">{label}</span>
      <input type="checkbox" checked={value} onChange={(e)=>onChange(e.target.checked)} />
    </label>
  );
}

function RateInput({ label, value, onChange }: { label: string; value: number | string; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border p-2 text-sm">
      <span>{label}</span>
      <input
        type="number"
        step="0.0001"
        className="w-28 rounded-lg border px-2 py-1 text-right text-sm"
        value={value}
        onChange={(e)=>onChange(Number(e.target.value))}
      />
    </label>
  );
}

function SimpleTable({ rows, cols, lang }: any) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            {cols.map((c:any)=> <th key={c.key} className="py-2">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r:any, idx:number)=> (
            <tr key={idx} className="border-t">
              {cols.map((c:any)=> <td key={c.key} className="py-2 pr-6">{String(r[c.key] ?? "")}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="py-6 text-gray-500" colSpan={cols.length}>{t(lang,"no_data")}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

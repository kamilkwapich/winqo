"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isLang, type Lang, t } from "../../../lib/i18n";
import { api, getApiBase } from "../../../lib/api";
import { setToken } from "../../../lib/auth";

type Providers = { stripe: boolean; paypal: boolean; autopay: boolean };

const stripeLogo =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxODAgNjQnPjxyZWN0IHdpZHRoPScxODAnIGhlaWdodD0nNjQnIHJ4PScxMicgZmlsbD0nd2hpdGUnLz48dGV4dCB4PScyNCcgeT0nNDInIGZvbnQtZmFtaWx5PSdBcmlhbCwgc2Fucy1zZXJpZicgZm9udC1zaXplPSczNCcgZm9udC13ZWlnaHQ9JzcwMCcgZmlsbD0nIzYzNWJmZic+c3RyaXBlPC90ZXh0Pjwvc3ZnPg==";

const paypalLogo =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxODAgNjQnPjxyZWN0IHdpZHRoPScxODAnIGhlaWdodD0nNjQnIHJ4PScxMicgZmlsbD0nd2hpdGUnLz48dGV4dCB4PScyMCcgeT0nNDInIGZvbnQtZmFtaWx5PSdBcmlhbCwgc2Fucy1zZXJpZicgZm9udC1zaXplPSczMicgZm9udC13ZWlnaHQ9JzcwMCcgZmlsbD0nIzAwMzA4Nyc+UGF5UGFsPC90ZXh0Pjwvc3ZnPg==";

export default function PaymentRequired({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";
  const status = searchParams?.get("status") || "";
  const sessionId = searchParams?.get("session_id") || "";
  const apiBase = getApiBase();

  const [providers, setProviders] = useState<Providers>({ stripe: false, paypal: false, autopay: false });
  const [provider, setProvider] = useState<"stripe" | "paypal">("stripe");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [autoLoginLoading, setAutoLoginLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${apiBase}/billing/providers-public`)
      .then((res) => res.json())
      .then((data) => {
        setProviders(data);
        if (data.stripe) setProvider("stripe");
        else if (data.paypal) setProvider("paypal");
      })
      .catch(() => {
        setProviders({ stripe: false, paypal: false, autopay: false });
      });
  }, [token]);

  useEffect(() => {
    if (!token || status !== "success" || syncing) return;
    if (!sessionId) {
      setSyncDone(true);
      return;
    }
    setSyncing(true);
    fetch(`${apiBase}/billing/stripe/sync-session-public`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, session_id: sessionId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `HTTP ${res.status}`);
        }
        setSyncDone(true);
      })
      .catch((e) => {
        setErr(String(e?.message || e));
      })
      .finally(() => setSyncing(false));
  }, [token, sessionId, status, syncing]);

  useEffect(() => {
    if (!token || status !== "success" || !syncDone || autoLoginAttempted) return;
    setAutoLoginAttempted(true);
    setAutoLoginLoading(true);
    api<{ access_token: string }>("/auth/login-from-payment", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setToken(res.access_token);
        window.location.href = `/${lang}/app`;
      })
      .catch((e: any) => {
        setErr(String(e?.message || e));
        setAutoLoginLoading(false);
      });
  }, [token, status, syncDone, autoLoginAttempted, lang]);

  async function startPayment() {
    if (!token) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/billing/checkout-public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, provider }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = await res.json();
      window.location.href = data.url;
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 px-4 py-14">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{t(lang, "payment_required_title")}</h1>
          <p className="mt-3 text-lg text-gray-600">{t(lang, "payment_required_note")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-white/80 backdrop-blur border border-blue-100 p-8 shadow-lg">
            {!token && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">{t(lang, "payment_required_no_token")}</p>
                <a className="inline-flex text-sm font-semibold text-blue-600 hover:text-purple-600" href={`/${lang}/login`}>
                  {t(lang, "payment_required_login")}
                </a>
              </div>
            )}

            {token && (
              <div className="space-y-6">
                {status === "success" && (
                  <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-3 text-sm text-green-700">
                    <div>{t(lang, "payment_required_status_success")}</div>
                    {(syncing || autoLoginLoading) && (
                      <div className="mt-1 inline-flex items-center gap-2 text-xs text-green-700">
                        <span className="h-3 w-3 animate-spin rounded-full border border-green-400 border-t-transparent" />
                        {t(lang, "payment_required_auto_login")}
                      </div>
                    )}
                  </div>
                )}
                {status === "cancel" && (
                  <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3 text-sm text-amber-700">
                    {t(lang, "payment_required_status_cancel")}
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "payment_required_provider")}</label>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {providers.stripe && (
                      <button
                        type="button"
                        className={`inline-flex min-w-[180px] items-center justify-center gap-3 rounded-2xl px-5 py-3 text-base font-semibold transition-all bg-white text-slate-800 ${provider === "stripe" ? "border-2 border-[#635bff] ring-4 ring-[#635bff]/35 shadow-[0_0_0_8px_rgba(99,91,255,0.14)]" : "border border-slate-200 hover:border-slate-300"}`}
                        onClick={() => setProvider("stripe")}
                        aria-label="Stripe"
                      >
                        <span className="sr-only">Stripe</span>
                        <span className="text-[#635bff]">Stripe</span>
                      </button>
                    )}
                    {providers.paypal && (
                      <button
                        type="button"
                        className={`inline-flex min-w-[180px] items-center justify-center gap-3 rounded-2xl px-5 py-3 text-base font-semibold transition-all bg-white text-slate-800 ${provider === "paypal" ? "border-2 border-[#003087] ring-4 ring-[#003087]/35 shadow-[0_0_0_8px_rgba(0,48,135,0.14)]" : "border border-slate-200 hover:border-slate-300"}`}
                        onClick={() => setProvider("paypal")}
                        aria-label="PayPal"
                      >
                        <span className="sr-only">PayPal</span>
                        <span className="text-[#003087]">PayPal</span>
                      </button>
                    )}
                  </div>
                  {(providers.stripe || providers.paypal) && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-wrap items-center gap-3">
                      <p className="text-sm font-semibold text-slate-800">{t(lang, "payment_supported_by")}</p>
                    </div>
                  )}
                </div>

                {err && (
                  <div className="rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 p-4 text-sm text-red-700 shadow-md">
                    {err}
                  </div>
                )}

                <button
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || (!providers.stripe && !providers.paypal)}
                  onClick={startPayment}
                >
                  {loading ? t(lang, "loading") : t(lang, "payment_required_pay")}
                </button>

                <a className="block text-center text-sm font-medium text-blue-600 hover:text-purple-600" href={`/${lang}/login`}>
                  {t(lang, "payment_required_login")}
                </a>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-purple-600/90 p-8 text-white shadow-2xl">
            <h3 className="text-2xl font-bold">{t(lang, "payment_security_title")}</h3>
            <div className="mt-4 flex gap-4 items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.5 0 4.5 2 4.5 4.5V10a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5V7.5C7.5 5 9.5 3 12 3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 10h12v5.5a3.5 3.5 0 0 1-3.5 3.5h-5A3.5 3.5 0 0 1 6 15.5V10Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
                </svg>
              </div>
              <div className="space-y-2 text-sm leading-relaxed text-blue-50">
                <p className="font-semibold text-white">{t(lang, "payment_security_body")}</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t(lang, "payment_security_point_encryption")}</li>
                  <li>{t(lang, "payment_security_point_providers")}</li>
                  <li>{t(lang, "payment_security_point_privacy")}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

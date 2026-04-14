'use client';
import React, { useState } from "react";
import { isLang, type Lang, t } from "../../../lib/i18n";
import { setToken } from "../../../lib/auth";
import { getApiBase } from "../../../lib/api";

export default function LoginPage({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang,"login")}</h1>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
          <label className="text-sm font-semibold text-gray-700">{t(lang,"email")}</label>
          <input 
            className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
          />
          <label className="mt-5 block text-sm font-semibold text-gray-700">{t(lang,"password")}</label>
          <input 
            type="password" 
            className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
          />
          <div className="mt-2 text-right">
             <a href={`/${lang}/forgot-password`} className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors">
               {t(lang, "forgot_password_link")}
             </a>
          </div>

          {err && <div className="mt-4 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4 text-sm text-red-700 shadow-md">{err}</div>}

          <button
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
          onClick={async () => {
            setErr(null);
            try {
              const res = await fetch(`${getApiBase()}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              });
              if (res.ok) {
                const data = await res.json();
                setToken(data.access_token);
                window.location.href = `/${lang}/app`;
                return;
              }
              if (res.status === 402) {
                const data = await res.json();
                const token = data?.detail?.payment_token;
                if (token) {
                  window.location.href = `/${lang}/payment-required?token=${encodeURIComponent(token)}`;
                  return;
                }
              }
              const txt = await res.text();
              setErr(txt || `HTTP ${res.status}`);
            } catch (e:any) {
              console.error("Login error:", e);
              setErr(e.message);
            }
          }}
        >
          {t(lang,"sign_in")}
        </button>

        <a className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-purple-600 transition-colors" href={`/${lang}/register`}>{t(lang,"create_tenant_link")}</a>
      </div>
      </div>
    </main>
  );
}

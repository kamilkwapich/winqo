'use client';
import React, { useEffect, useState } from "react";
import { isLang, type Lang, t } from "../../../lib/i18n";
import { getToken, clearToken } from "../../../lib/auth";
import { apiAuth } from "../../../lib/api";

export default function AppLayout({ children, params }: { children: React.ReactNode; params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const [me, setMe] = useState<any>(null);
  const [entitlements, setEntitlements] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = `/${lang}/login`;
      return;
    }
    apiAuth("/auth/me", token).then(setMe).catch(() => {
      clearToken();
      window.location.href = `/${lang}/login`;
    });
    apiAuth("/billing/entitlements", token).then((res:any) => {
      const ent = res?.entitlements;
      setEntitlements(ent || null);
      // Language validation removed - users can freely switch languages via switcher
    }).catch(() => {
      // ignore entitlements fetch errors for now
    });
  }, [lang]);

  useEffect(() => {
    const planCode = (entitlements?.plan_code || "").toUpperCase();
    if (planCode === "DEMO") {
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      const quotesBase = `/${lang}/app/quotes`;
      if (path && !path.startsWith(quotesBase)) {
        window.location.href = quotesBase;
      }
    }
  }, [entitlements, lang]);

  const isDemoPlan = (entitlements?.plan_code || "").toUpperCase() === "DEMO";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="bg-white/80 backdrop-blur-xl border-b border-blue-100 shadow-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            {!isDemoPlan && (
              <a 
                href={`/${lang}/app`} 
                className="group flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden md:inline">{t(lang,"dashboard")}</span>
              </a>
            )}
            <a 
              href={`/${lang}/app/quotes`} 
              className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden md:inline">{t(lang,"quotes")}</span>
            </a>
            {!isDemoPlan && (
              <>
                <a 
                  href={`/${lang}/app/clients`} 
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 8.5a3.5 3.5 0 11-3-3.44" />
                  </svg>
                  <span className="hidden md:inline">{t(lang,"clients")}</span>
                </a>
                <a 
                  href={`/${lang}/app/account`} 
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden md:inline">{t(lang,"account")}</span>
                </a>
                {me?.role === "SUPER_ADMIN" && (
                  <a 
                    href={`/${lang}/app/admin`} 
                    className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span className="hidden md:inline">{t(lang,"admin")}</span>
                  </a>
                )}
                <a 
                  href={`/${lang}/app/settings`} 
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hidden md:inline">{t(lang,"nav_settings")}</span>
                </a>
              </>
            )}
          </div>
          <button
            className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-5 py-2 text-sm font-medium text-white shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40 transition-all duration-300 hover:scale-105"
            onClick={() => { clearToken(); window.location.href = `/${lang}`; }}
          >
            {t(lang,"logout")}
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}

function normalizeLang(value: string): string {
  if (value === "en") return "en-us";
  return value;
}

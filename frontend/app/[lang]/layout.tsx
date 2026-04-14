'use client';
import React from "react";
import { isLang, type Lang, t } from "../../lib/i18n";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import CookieBanner from "../../components/CookieBanner";
import { clearToken, getToken, setToken } from "../../lib/auth";
import { apiAuth, getApiBase } from "../../lib/api";

export default function LangLayout({ children, params }: { children: React.ReactNode; params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [demoLoading, setDemoLoading] = React.useState(false);

  React.useEffect(() => {
    const token = getToken();
    if (token) {
      apiAuth("/auth/me", token)
        .then(setUser)
        .catch(() => {
          clearToken();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a href={`/${lang}`} className="flex items-center gap-2 text-sm font-semibold">
            <img src="/winqo.png" alt={t(lang,"app_name")} className="h-6 w-auto" />
            <span>{t(lang,"tagline")}</span>
          </a>
          <nav className="flex items-center gap-3 text-sm">
            <a className="hover:underline" href={`/${lang}/pricing`}>{t(lang,"pricing")}</a>
            {!loading && (
              user ? (
                <a className="flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-gray-50 font-medium" href={`/${lang}/app`}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden md:inline">{user.email}</span>
                </a>
              ) : (
                <>
                  <a className="flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-gray-50" href={`/${lang}/login`}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden md:inline">{t(lang,"login")}</span>
                  </a>
                  <button
                    type="button"
                    id="demo-cta"
                    disabled={demoLoading}
                    onClick={async () => {
                      if (demoLoading) return;
                      setDemoLoading(true);
                      try {
                        const res = await fetch(`${getApiBase()}/auth/login`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: "owner@demo.local", password: "Owner123!" }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setToken(data.access_token);
                          window.location.href = `/${lang}/app/quotes`;
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
                        console.error("Demo login failed:", txt || res.status);
                      } catch (e: any) {
                        console.error("Demo login error:", e?.message || e);
                      } finally {
                        setDemoLoading(false);
                      }
                    }}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition disabled:opacity-60"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7Z" />
                    </svg>
                    <span className="hidden md:inline">{demoLoading ? t(lang, "loading") : t(lang, "demo_quick_cta")}</span>
                  </button>
                </>
              )
            )}
            <LanguageSwitcher lang={lang} />
          </nav>
        </div>
      </header>
      {children}
      <footer className="mx-auto max-w-5xl px-4 py-12 text-sm text-gray-500">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-2 text-gray-700">
            <div className="text-base font-semibold text-gray-900">{t(lang,"app_name")}</div>
            <div>{t(lang, "footer_tax")}</div>
            <a className="text-blue-600 hover:text-purple-600 transition-colors" href="mailto:winqo@winqo.online">{t(lang, "footer_contact")}</a>
            <div className="text-xs text-gray-500">© 2026 {t(lang,"app_name")}. Camillo Kamil Kwapich</div>
            <div className="pt-2">
              <img src="/camillo_logo.png" alt="Camillo logo" className="h-10 w-auto" />
            </div>
          </div>
          <div className="space-y-3 text-gray-700">
            <div className="text-sm font-semibold text-gray-900">Linki</div>
            <div className="flex flex-col gap-2 text-sm">
              <a className="text-blue-600 hover:text-purple-600 transition-colors" href={`/${lang}/terms`}>{t(lang,"terms_title")}</a>
              <a className="text-blue-600 hover:text-purple-600 transition-colors" href={`/${lang}/privacy`}>{t(lang,"privacy_title")}</a>
              <a className="text-blue-600 hover:text-purple-600 transition-colors" href={`/${lang}/cookies`}>{t(lang,"cookies")}</a>
              <a className="text-blue-600 hover:text-purple-600 transition-colors" href={`/${lang}/returns`}>{t(lang,"returns")}</a>
            </div>
          </div>
            <div className="space-y-3 text-gray-700 md:text-right">
            <div className="text-sm font-semibold text-gray-900">Social</div>
            <div className="flex flex-wrap gap-0.5 md:justify-end">
              {socialLink("FB", "https://facebook.com/winqo.online/", "/fb.png")}
              {socialLink("IG", "https://instagram.com", "/ig.png")}
              {socialLink("TT", "https://www.tiktok.com", "/tt.png")}
              {socialLink("IN", "https://www.linkedin.com", "/in.png")}
            </div>
          </div>
        </div>
      </footer>
      <CookieBanner lang={lang} />
    </div>
  );
}

function socialLink(label: string, href: string, iconSrc: string) {
  return (
    <a
      key={label}
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center h-14 w-14 hover:opacity-80 transition"
    >
      <span className="sr-only">{label}</span>
      <img src={iconSrc} alt={label} className="h-7 w-7" />
    </a>
  );
}

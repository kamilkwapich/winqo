"use client";

import { useEffect, useState } from "react";
import { t, type Lang } from "../lib/i18n";

type Prefs = {
  analytics: boolean;
  external: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "winqo-cookie-consent";
const WINDOW_KEY = "__winqoCookieBannerOpen";

function announceVisibility(open: boolean) {
  if (typeof window === "undefined") return;
  (window as any)[WINDOW_KEY] = open;
  window.dispatchEvent(new CustomEvent("winqo-cookie-banner", { detail: { open } }));
}

export default function CookieBanner({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ analytics: true, external: true, marketing: true });

  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Prefs;
        setPrefs({
          analytics: !!parsed.analytics,
          external: !!parsed.external,
          marketing: !!parsed.marketing,
        });
        setOpen(false);
        announceVisibility(false);
        return;
      } catch {
        // ignore parse errors and show banner
      }
    }
    setOpen(true);
    announceVisibility(true);
  }, []);

  const persist = (next: Prefs) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPrefs(next);
    setOpen(false);
    announceVisibility(false);
    window.dispatchEvent(new Event("winqo-cookie-consent"));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-2xl shadow-blue-200/60">
        <div className="grid gap-6 md:grid-cols-[1.2fr,0.8fr] p-6 md:p-8">
          <div className="space-y-4 text-gray-900">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Consent
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold leading-snug">{t(lang, "cookie_title")}</h3>
              <p className="text-base text-gray-700">{t(lang, "cookie_body")}</p>
              <p className="text-sm font-semibold text-gray-800">{t(lang, "cookie_full_stats")}</p>
              <div className="flex flex-wrap gap-3 text-sm text-blue-700">
                <a className="hover:underline" href={`/${lang}/privacy`}>{t(lang, "privacy_title")}</a>
                <span>•</span>
                <a className="hover:underline" href={`/${lang}/cookies`}>{t(lang, "cookies")}</a>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <button
                className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition"
                onClick={() => persist({ analytics: true, external: true, marketing: true })}
              >
                {t(lang, "cookie_accept_all")}
              </button>
              <button
                className="flex-1 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-center text-sm font-semibold text-gray-800 hover:bg-white"
                onClick={() => persist({ analytics: false, external: false, marketing: false })}
              >
                {t(lang, "cookie_reject_extra")}
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ConsentCard
                title={t(lang, "cookie_cat_essential")}
                description={t(lang, "cookie_cat_essential_desc")}
                locked
                alwaysLabel={t(lang, "cookie_always_on")}
                value
                onChange={() => undefined}
              />
              <ConsentCard
                title={t(lang, "cookie_cat_analytics")}
                description={t(lang, "cookie_cat_analytics_desc")}
                value={prefs.analytics}
                onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
              />
              <ConsentCard
                title={t(lang, "cookie_cat_external")}
                description={t(lang, "cookie_cat_external_desc")}
                value={prefs.external}
                onChange={(v) => setPrefs((p) => ({ ...p, external: v }))}
              />
              <ConsentCard
                title={t(lang, "cookie_cat_marketing")}
                description={t(lang, "cookie_cat_marketing_desc")}
                value={prefs.marketing}
                onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
              />
            </div>
            <div className="flex justify-end">
              <button
                className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-600"
                onClick={() => persist(prefs)}
              >
                {t(lang, "cookie_save")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentCard({
  title,
  description,
  value,
  onChange,
  locked = false,
  alwaysLabel,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
  alwaysLabel?: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm font-semibold text-gray-800">
        {locked ? <span className="text-emerald-600">{alwaysLabel || "Always on"}</span> : <span />}
        <Toggle checked={value} onChange={locked ? undefined : onChange} disabled={locked} />
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
        disabled
          ? "cursor-not-allowed bg-slate-200"
          : checked
            ? "bg-gradient-to-r from-blue-500 to-purple-500 shadow-inner"
            : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

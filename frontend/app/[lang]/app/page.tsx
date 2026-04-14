'use client';
import React, { useEffect, useState } from "react";
import { isLang, type Lang, t } from "../../../lib/i18n";
import { getToken } from "../../../lib/auth";
import { apiAuth } from "../../../lib/api";
import { formatPrice } from "../../../lib/plans";

type Stats = {
  total_quotes: number;
  monthly_quote_count: number;
  monthly_quote_limit: number | null;
  total_amount_cents: number;
  average_amount_cents: number;
  currency: string;
};

export default function AppHome({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const [stats, setStats] = useState<Stats | null>(null);
  const [bannerData, setBannerData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setErr(null);
    Promise.all([
      apiAuth<Stats>("/quotes/stats", token),
      apiAuth<{ dashboard_banner_data: string | null }>("/billing/banner", token),
    ])
      .then(([statsRes, bannerRes]) => {
        setStats(statsRes);
        setBannerData(bannerRes.dashboard_banner_data || null);
      })
      .catch((e: any) => setErr(String(e?.message || e)))
      .finally(() => setLoading(false));
  }, []);

  const quoteLimitValue = stats?.monthly_quote_limit
    ? `${stats.monthly_quote_count}/${stats.monthly_quote_limit}`
    : stats
      ? t(lang, "quote_limit_unlimited")
      : "-";
  const totalValue = stats
    ? formatPrice(lang, (stats.total_amount_cents || 0) / 100, stats.currency as any)
    : "-";
  const avgValue = stats
    ? formatPrice(lang, (stats.average_amount_cents || 0) / 100, stats.currency as any)
    : "-";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang,"dashboard")}</h1>
          <p className="mt-3 text-gray-600">{t(lang,"dashboard_hint")}</p>
        </div>
      </div>

      {err && <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4 text-sm text-red-700 shadow-lg shadow-red-500/20">{err}</div>}

      <div className="rounded-3xl bg-gradient-to-br from-white to-purple-50 p-8 glow-card border border-purple-100">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang,"stats_title")}</h2>
        {loading && <div className="mt-3 text-sm text-gray-500">{t(lang,"loading")}</div>}
        {!loading && stats && (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t(lang,"stats_total_quotes")} value={String(stats.total_quotes)} />
            <StatCard label={t(lang,"stats_monthly_usage")} value={quoteLimitValue} />
            <StatCard label={t(lang,"stats_total_value")} value={totalValue} />
            <StatCard label={t(lang,"stats_avg_value")} value={avgValue} />
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t(lang,"stats_banner_title")}</h2>
          <span className="text-xs text-gray-500">{t(lang,"stats_banner_hint")}</span>
        </div>
        <div className="mt-4">
          {bannerData ? (
            <img
              src={bannerData}
              alt={t(lang,"stats_banner_title")}
              className="w-full rounded-3xl border-2 border-blue-200 object-cover shadow-lg"
              style={{ aspectRatio: "3 / 1" }}
            />
          ) : (
            <div className="flex h-32 w-full items-center justify-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50 text-sm text-gray-400">
              {t(lang,"stats_banner_empty")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-white to-blue-50 border border-blue-100 p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
      <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold">{label}</div>
      <div className="mt-3 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{value}</div>
    </div>
  );
}

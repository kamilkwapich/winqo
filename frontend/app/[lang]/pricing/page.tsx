import { isLang, type Lang, t } from "../../../lib/i18n";
import PricingPlans from "../../../components/PricingPlans";

export default function Pricing({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{t(lang,"pricing")}</h1>
          <p className="mt-4 text-xl text-gray-700">{t(lang,"plans_subtitle")}</p>
        </div>

        <div className="mt-10 space-y-6">
        <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 shadow-2xl shadow-purple-200/50">
          <div className="absolute -top-10 -left-8 h-32 w-32 rounded-full bg-blue-500/15 blur-3xl" aria-hidden />
          <div className="absolute -bottom-12 -right-10 h-36 w-36 rounded-full bg-pink-500/15 blur-3xl" aria-hidden />
          <div className="relative rounded-[22px] bg-white/90 backdrop-blur border border-white/60 p-6 md:p-8">
            <h2 className="text-xl font-semibold bg-clip-text text-transparent" style={{ background: "linear-gradient(90deg,#2563eb,#8b5cf6,#ec4899)", WebkitBackgroundClip: "text" }}>
              {t(lang, "pricing_lead_question")}
            </h2>
            <p className="mt-2 text-gray-700">{t(lang, "pricing_lead_statement")}</p>
            <div className="mt-5 grid gap-3">
              {[t(lang, "home_benefit_1"), t(lang, "home_benefit_2"), t(lang, "home_benefit_3"), t(lang, "home_benefit_4")].map((label, idx) => (
                <div
                  key={idx}
                  className="group relative flex items-start gap-3 rounded-xl border border-blue-50/60 bg-gradient-to-r from-white via-blue-50/60 to-purple-50/50 px-4 py-3 shadow-sm transition duration-300 hover:-translate-y-[2px] hover:shadow-lg hover:shadow-blue-200/50"
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 text-white text-base font-bold shadow-md shadow-green-300/50 ring-2 ring-white/70">
                    ✓
                  </span>
                  <span className="text-gray-800 font-semibold leading-snug">{label}</span>
                  <span className="absolute -right-1 -top-1 h-10 w-10 rounded-full bg-white/20 blur-xl opacity-0 transition duration-300 group-hover:opacity-100" aria-hidden />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 shadow-2xl shadow-purple-200/50">
          <div className="absolute -top-10 -left-8 h-32 w-32 rounded-full bg-blue-500/15 blur-3xl" aria-hidden />
          <div className="absolute -bottom-12 -right-10 h-36 w-36 rounded-full bg-pink-500/15 blur-3xl" aria-hidden />
          <div className="relative rounded-[22px] bg-white/90 backdrop-blur border border-white/60 px-6 py-8 grid gap-8 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl border border-blue-100/80 bg-gradient-to-br from-white via-blue-50/50 to-purple-50/40 p-6 shadow-xl shadow-blue-100/60">
              <div className="absolute -top-8 -right-6 h-16 w-16 rounded-full bg-blue-400/10 blur-2xl" aria-hidden />
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg shadow-blue-400/50">1</span>
                <h3 className="text-lg font-semibold text-gray-900">{t(lang, "pricing_how_title")}</h3>
              </div>
              <p className="mt-3 text-gray-700 leading-relaxed">{t(lang, "pricing_how_intro")}</p>
              <ol className="mt-4 space-y-2 text-gray-800 text-sm leading-relaxed list-decimal list-inside">
                <li>{t(lang, "pricing_how_step_1")}</li>
                <li>{t(lang, "pricing_how_step_2")}</li>
                <li>{t(lang, "pricing_how_step_3")}</li>
                <li>{t(lang, "pricing_how_step_4")}</li>
                <li>{t(lang, "pricing_how_step_5")}</li>
                <li>{t(lang, "pricing_how_step_6")}</li>
              </ol>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-purple-100/80 bg-gradient-to-br from-white via-purple-50/40 to-pink-50/40 p-6 shadow-xl shadow-purple-100/60">
              <div className="absolute -top-10 -left-6 h-16 w-16 rounded-full bg-purple-400/15 blur-2xl" aria-hidden />
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white font-bold shadow-lg shadow-pink-300/50">2</span>
                <h3 className="text-lg font-semibold text-gray-900">{t(lang, "pricing_why_title")}</h3>
              </div>
              <p className="mt-3 text-gray-700 leading-relaxed">{t(lang, "pricing_why_body")}</p>
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <a href={`/${lang}/pricing#plans`} className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-400/30 hover:shadow-xl transition-all">{t(lang, "pricing_cta_generate")}</a>
                <a href={`/${lang}/how-it-works`} className="rounded-xl border border-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 bg-white/80 hover:bg-white shadow-sm transition-all">{t(lang, "pricing_cta_see_how")}</a>
                <a href={`/${lang}/pricing#plans`} className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all">{t(lang, "pricing_cta_buy")}</a>
              </div>
            </div>
          </div>
        </div>
      </div>

        <PricingPlans lang={lang} showHeader={false} />

        <div className="mt-10 relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 shadow-2xl shadow-purple-200/50">
        <div className="absolute -top-10 -left-8 h-32 w-32 rounded-full bg-blue-500/15 blur-3xl" aria-hidden />
        <div className="absolute -bottom-12 -right-10 h-36 w-36 rounded-full bg-pink-500/15 blur-3xl" aria-hidden />
        <div className="relative rounded-[22px] bg-white/90 backdrop-blur border border-white/60 p-6 md:p-8">
          <h2 className="text-lg font-semibold text-gray-900">{t(lang,"pricing_what_you_get")}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[t(lang,"pricing_feature_unlimited_quotes"), t(lang,"pricing_feature_pdf"), t(lang,"pricing_feature_multilang"), t(lang,"pricing_feature_branding")].map((label, idx) => (
              <div
                key={idx}
                className="group relative flex items-start gap-3 rounded-xl border border-blue-50/60 bg-gradient-to-r from-white via-blue-50/60 to-purple-50/50 px-4 py-3 shadow-sm transition duration-300 hover:-translate-y-[2px] hover:shadow-lg hover:shadow-blue-200/50"
              >
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base font-bold shadow-md shadow-blue-300/50 ring-2 ring-white/70">
                  ✓
                </span>
                <span className="text-gray-800 font-semibold leading-snug">{label}</span>
                <span className="absolute -right-1 -top-1 h-10 w-10 rounded-full bg-white/20 blur-xl opacity-0 transition duration-300 group-hover:opacity-100" aria-hidden />
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}

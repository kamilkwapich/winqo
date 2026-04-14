import { isLang, type Lang, t } from "../../lib/i18n";
import PricingPlans from "../../components/PricingPlans";
import DemoBanner from "../../components/DemoBanner";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const title = `${t(lang, "app_name")} - ${t(lang, "tagline")}`;
  const description = t(lang, "home_benefit_1") + ", " + t(lang, "home_benefit_2"); // Fallback description using benefits
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: lang,
    },
    alternates: {
      canonical: `/${lang}`,
      languages: {
        pl: '/pl',
        en: '/en',
        'en-US': '/en-us',
        'en-GB': '/en-uk',
        it: '/it',
        de: '/de',
        es: '/es',
        fr: '/fr',
      },
    },
  };
}

export default function Page({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <DemoBanner lang={lang} />
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{t(lang,"app_name")}</h1>
            <p className="mt-4 text-xl text-gray-700">{t(lang,"tagline")}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105" href={`/${lang}/pricing`}>{t(lang,"buy")}</a>
              <a className="rounded-xl border-2 border-blue-300 px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50 transition-all duration-300" href={`/${lang}/login`}>{t(lang,"login")}</a>
            </div>
          <div className="relative mt-10">
            <div className="absolute -top-6 -left-8 h-28 w-28 rounded-full bg-blue-500/15 blur-3xl" aria-hidden />
            <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-purple-500/15 blur-3xl" aria-hidden />
            <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-xl shadow-blue-200/60 ring-1 ring-blue-100/70">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" aria-hidden />
              <div className="grid gap-3 p-5">
                {[t(lang,"home_benefit_1"), t(lang,"home_benefit_2"), t(lang,"home_benefit_3"), t(lang,"home_benefit_4")].map((label, idx) => (
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
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50 to-purple-50 p-8 border border-blue-100 shadow-2xl shadow-blue-200/60">
          <div className="text-sm font-semibold text-blue-600">{t(lang,"preview")}</div>
          <div className="relative mt-4 flex justify-center group">
            <div className="absolute -top-14 -left-20 h-56 w-56 rounded-full bg-blue-400/25 blur-3xl" aria-hidden />
            <div className="absolute -bottom-16 -right-16 h-60 w-60 rounded-full bg-purple-400/25 blur-3xl" aria-hidden />
            <div className="absolute inset-10 rounded-full bg-white/30 blur-2xl" aria-hidden />
            <div className="overflow-hidden rounded-2xl border border-white/50 shadow-2xl shadow-purple-200/60 backdrop-blur-sm bg-transparent transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:translate-x-1">
              <img
                src="/winqo_pc_mob.png"
                alt="Winqo app preview"
                className="max-h-80 w-auto object-contain drop-shadow-xl transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* New: pricing lead block under hero grid (lead + two-column how/why) */}
      <div className="mx-auto max-w-5xl px-4 mt-8">
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">{t(lang, "pricing_lead_question")}</h2>
          <p className="mt-2 text-gray-700">{t(lang, "pricing_lead_statement")}</p>
        </div>

        <div className="mt-6 relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 shadow-2xl shadow-purple-200/50">
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

      {/* Gradient-highlighted lead container — decorative blobs matching Winqo colors */}
      <div className="mx-auto max-w-5xl px-4 mt-8">
        <div className="relative overflow-hidden rounded-3xl p-px bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          <div className="absolute -top-12 -left-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" aria-hidden />
          <div className="absolute -bottom-14 -right-12 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" aria-hidden />
          <div className="absolute top-8 right-20 h-32 w-32 rounded-full bg-pink-500/20 blur-2xl" aria-hidden />
          <div className="relative rounded-2xl bg-white p-6">
            <h2 className="text-xl font-semibold bg-clip-text text-transparent" style={{ background: 'linear-gradient(90deg,#2563eb,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text' }}>{t(lang, "pricing_lead_question")}</h2>
            <p className="mt-2 text-gray-700">{t(lang, "pricing_lead_statement")}</p>
          </div>
        </div>
      </div>

      <PricingPlans lang={lang} />
      <section className="mx-auto max-w-5xl px-4 mt-12">
        <div className="rounded-3xl border border-blue-100 bg-white/70 backdrop-blur shadow-lg shadow-blue-100/50 px-8 py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">{t(lang,"secure_payments_title")}</div>
            <p className="mt-2 text-gray-700 text-base">{t(lang,"secure_payments_body")}</p>
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 border border-blue-100 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Stripe
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-50 to-blue-50 px-3 py-2 border border-slate-100 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-green-500" /> PayPal
            </span>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 mt-12 space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">{t(lang,"for_who_title")}</div>
          <h2 className="text-3xl font-bold text-gray-900">{t(lang,"for_who_heading")}</h2>
          <p className="text-gray-700 text-lg">{t(lang,"for_who_intro")}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white/60 backdrop-blur p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 text-blue-800">
              <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 drop-shadow" />
              <span className="text-lg font-black tracking-tight uppercase">{t(lang,"for_who_label_dealers")}</span>
            </div>
            <p className="mt-2 text-gray-700">{t(lang,"for_who_dealers_intro")}</p>
            <ul className="mt-4 space-y-2 text-gray-800 text-sm leading-relaxed">
              <li>• {t(lang,"for_who_dealers_benefit_1")}</li>
              <li>• {t(lang,"for_who_dealers_benefit_2")}</li>
              <li>• {t(lang,"for_who_dealers_benefit_3")}</li>
              <li>• {t(lang,"for_who_dealers_benefit_4")}</li>
            </ul>
            <p className="mt-4 text-sm font-semibold text-gray-900">{t(lang,"for_who_dealers_cta")}</p>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-white/60 backdrop-blur p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 text-purple-800">
              <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-purple-500 via-pink-500 to-orange-400 drop-shadow" />
              <span className="text-lg font-black tracking-tight uppercase">{t(lang,"for_who_label_installers")}</span>
            </div>
            <p className="mt-2 text-gray-700">{t(lang,"for_who_installers_intro")}</p>
            <ul className="mt-4 space-y-2 text-gray-800 text-sm leading-relaxed">
              <li>• {t(lang,"for_who_installers_benefit_1")}</li>
              <li>• {t(lang,"for_who_installers_benefit_2")}</li>
              <li>• {t(lang,"for_who_installers_benefit_3")}</li>
              <li>• {t(lang,"for_who_installers_benefit_4")}</li>
            </ul>
            <p className="mt-4 text-sm font-semibold text-gray-900">{t(lang,"for_who_installers_cta")}</p>
          </div>
          <div className="rounded-2xl border border-pink-100 bg-white/60 backdrop-blur p-6 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 text-pink-800">
              <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-pink-500 via-red-500 to-amber-400 drop-shadow" />
              <span className="text-lg font-black tracking-tight uppercase">{t(lang,"for_who_label_sellers")}</span>
            </div>
            <p className="mt-2 text-gray-700">{t(lang,"for_who_sellers_intro")}</p>
            <ul className="mt-4 space-y-2 text-gray-800 text-sm leading-relaxed">
              <li>• {t(lang,"for_who_sellers_benefit_1")}</li>
              <li>• {t(lang,"for_who_sellers_benefit_2")}</li>
              <li>• {t(lang,"for_who_sellers_benefit_3")}</li>
              <li>• {t(lang,"for_who_sellers_benefit_4")}</li>
            </ul>
            <p className="mt-4 text-sm font-semibold text-gray-900">{t(lang,"for_who_sellers_cta")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-blue-50/70 p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">{t(lang,"for_who_summary_lead")}</div>
          <p className="mt-2 text-gray-700">{t(lang,"for_who_summary_body")}</p>
          <div className="mt-4 space-y-2 text-sm font-semibold text-gray-900">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
              <span>{t(lang,"for_who_summary_line_1")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
              <span>{t(lang,"for_who_summary_line_2")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-pink-500" />
              <span>{t(lang,"for_who_summary_line_3")}</span>
            </div>
          </div>
        </div>
      </section>
      </div>
      
    </main>
  );
}

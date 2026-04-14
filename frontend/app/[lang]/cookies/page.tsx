import { isLang, type Lang, t } from "../../../lib/i18n";

const sections = ["cookie_policy_what", "cookie_policy_types", "cookie_policy_manage", "cookie_policy_contact"] as const;

export default function CookiesPage({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-8 text-gray-900">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">{t(lang, "cookies")}</p>
        <h1 className="text-3xl font-bold">{t(lang, "cookie_policy_title")}</h1>
        <p className="text-lg text-gray-700">{t(lang, "cookie_policy_intro")}</p>
      </header>

      <div className="space-y-6">
        {sections.map((key) => (
          <article key={key} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">{t(lang, `${key}_title`)}</h2>
            <p className="mt-2 text-gray-700 leading-relaxed">{t(lang, `${key}_body`)}</p>
          </article>
        ))}
      </div>
    </main>
  );
}

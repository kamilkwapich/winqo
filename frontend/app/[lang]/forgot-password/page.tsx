'use client';
import { useState } from "react";
import { isLang, type Lang, t } from "../../../lib/i18n";
import { api } from "../../../lib/api";

export default function ForgotPassword({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setIsSubmitting(true);
    
    try {
      await api("/auth/request-password-reset", {
        method: "POST",
        body: JSON.stringify({ email, lang })
      });
      setSuccess(true);
    } catch (e: any) {
        // If user asked to show "User not found", we show it.
        // Usually API is responsible, but if API returns 404, we catch it here
        if (e.message && e.message.includes("404")) {
             setErr(t(lang, "forgot_password_user_not_found"));
        } else {
             setErr(e.message || String(e));
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  if (success) {
      return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center px-4 py-14">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 glow-card border border-blue-100 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{t(lang, "forgot_password_success_title")}</h1>
                <p className="text-gray-600 mb-6">{t(lang, "forgot_password_success_msg")}</p>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-medium text-gray-700 mb-6">
                    {email}
                </div>
                <a href={`/${lang}/login`} className="block w-full rounded-xl bg-gray-100 hover:bg-gray-200 py-3 text-gray-800 font-semibold transition-colors">
                     {t(lang, "login")}
                </a>
            </div>
        </main>
      );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "forgot_password_title")}</h1>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
          <form onSubmit={handleSubmit}>
              <label className="text-sm font-semibold text-gray-700">{t(lang, "forgot_password_email_label")}</label>
              <input 
                required
                type="email"
                className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
              />
              
              {err && <div className="mt-4 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4 text-sm text-red-700 shadow-md">{err}</div>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                  {isSubmitting ? t(lang, "loading") : t(lang, "forgot_password_submit")}
              </button>
          </form>
           <div className="mt-4 text-center">
             <a href={`/${lang}/login`} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
               {t(lang, "back_to_login") || "Back to Login"}
             </a>
          </div>
        </div>
      </div>
    </main>
  );
}

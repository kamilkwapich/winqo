'use client';
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { isLang, type Lang, t } from "../../../lib/i18n";
import { api } from "../../../lib/api";

export default function ResetPassword({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!token) {
      return (
         <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
             <div className="w-full max-w-md rounded-3xl bg-white p-8 border border-red-200 text-center">
                 <h2 className="text-xl font-bold text-red-600 mb-2">{t(lang, "verify_email_error")}</h2>
                 <p className="text-gray-600 mb-4">{t(lang, "reset_password_error")}</p>
                 <a href={`/${lang}/`} className="text-blue-600 font-medium hover:underline">{t(lang, "back_to_home")}</a>
             </div>
         </main>
      )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    
    if (password !== repeatPassword) {
        setErr(t(lang, "passwords_no_match"));
        return;
    }
    
    setIsSubmitting(true);
    
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password })
      });
      setSuccess(true);
    } catch (e: any) {
        setErr(t(lang, "reset_password_error")); // Generic error for safety, or e.message if preferred
    } finally {
        setIsSubmitting(false);
    }
  };

  if (success) {
      return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center px-4 py-14">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 glow-card border border-blue-100 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{t(lang, "reset_password_success")}</h1>
                <a href={`/${lang}/login`} className="block w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all">
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "reset_password_title")}</h1>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
          <form onSubmit={handleSubmit}>
              <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "reset_password_new_label")}</label>
                  <input 
                    required
                    type="password"
                    className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all font-sans" 
                    value={password} 
                    onChange={e=>setPassword(e.target.value)} 
                  />
              </div>
              <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-700">{t(lang, "reset_password_repeat_label")}</label>
                  <input 
                    required
                    type="password"
                    className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all font-sans" 
                    value={repeatPassword} 
                    onChange={e=>setRepeatPassword(e.target.value)} 
                  />
              </div>
              
              {err && <div className="mt-4 mb-4 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4 text-sm text-red-700 shadow-md">{err}</div>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                  {isSubmitting ? t(lang, "loading") : t(lang, "reset_password_submit")}
              </button>
          </form>
        </div>
      </div>
    </main>
  );
}

'use client';
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../../../lib/api";
import { t, isLang, type Lang } from "../../../lib/i18n";

export default function VerifyEmail({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorDetails, setErrorDetails] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorDetails("Missing token");
      return;
    }

    api<any>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token })
    })
    .then((res) => {
      // Reconstruct the register draft in session storage
      if (res.metadata) {
          const draft = { ...res.metadata, email: res.email };
          sessionStorage.setItem("registerDraft", JSON.stringify(draft));
      }
      setStatus("success");
      setTimeout(() => {
        window.location.href = `/${lang}/register/details`;
      }, 2000);
    })
    .catch((err) => {
        setStatus("error");
        setErrorDetails(err.message || String(err));
    });
  }, [token, lang]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl bg-white p-8 shadow-xl border border-blue-100 text-center">
        {status === "loading" && (
           <div className="flex flex-col items-center">
             <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
             <h2 className="text-xl font-semibold text-gray-800">{t(lang, "loading")}</h2>
           </div>
        )}
        
        {status === "success" && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t(lang, "verify_email_success")}</h2>
                <p className="text-gray-600">{t(lang, "verify_email_redirecting")}</p>
            </div>
        )}

        {status === "error" && (
            <div className="flex flex-col items-center">
                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t(lang, "verify_email_error")}</h2>
                <p className="text-gray-600 mb-6">{errorDetails}</p>
                <a href={`/${lang}/`} className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-colors">
                    {t(lang, "back_to_home")}
                </a>
            </div>
        )}
      </div>
    </main>
  );
}

'use client';
import React, { useEffect, useState } from "react";
import { getToken } from "../../../../lib/auth";
import { apiAuth } from "../../../../lib/api";
import { isLang, type Lang, t } from "../../../../lib/i18n";

export default function QuotesPage({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const token = getToken()!;
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [quoteName, setQuoteName] = useState("");
  const [quoteCurrency, setQuoteCurrency] = useState("EUR");
  const [err, setErr] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<any>(null);
  const clientSectionId = "add-client-section";
  const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString() : "-";

  async function load() {
    setErr(null);
    try {
      const [q, c, tenant, ent] = await Promise.all([
        apiAuth<any[]>("/quotes", token),
        apiAuth<any[]>("/quotes/clients", token),
        apiAuth<any>("/tenants/me", token),
        apiAuth<any>("/billing/entitlements", token),
      ]);
      setQuotes(q); setClients(c);
      setQuoteCurrency(tenant?.default_currency || "EUR");
      setEntitlements(ent?.entitlements || null);
    } catch (e:any) {
      setErr(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-white to-purple-50 p-8 glow-card border border-purple-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang,"quotes")}</h1>
            {entitlements && (
              <div className="mt-2 text-sm text-gray-600">
                {t(lang,"quote_limit_label")}: {entitlements.monthly_quote_limit ? `${entitlements.monthly_quote_count}/${entitlements.monthly_quote_limit}` : t(lang,"quote_limit_unlimited")}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="rounded-xl border-2 border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder={t(lang, "quote_name")}
              value={quoteName}
              onChange={(e)=>setQuoteName(e.target.value)}
            />
            <select className="rounded-xl border-2 border-purple-200 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none transition-all" value={clientId} onChange={(e)=>setClientId(e.target.value)}>
              <option value="">{t(lang,"client")}: —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              onClick={() => {
                const el = document.getElementById(clientSectionId);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            >
              {t(lang, "add_client")}
            </button>
            <select className="rounded-xl border-2 border-purple-200 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none transition-all" value={quoteCurrency} onChange={(e)=>setQuoteCurrency(e.target.value)}>
              <option value="EUR">EUR</option>
              <option value="PLN">PLN</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
            <button
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              onClick={async () => {
                try {
                  if (!quoteName.trim()) {
                    setErr(t(lang, "quote_name_required"));
                    return;
                  }
                  const q = await apiAuth<any>("/quotes", token, {
                    method:"POST",
                    body: JSON.stringify({ name: quoteName.trim(), client_id: clientId || null, lang, currency: quoteCurrency })
                  });
                  setQuoteName("");
                  window.location.href = `/${lang}/app/quotes/${q.id}`;
                } catch (e:any) { setErr(e.message); }
              }}
            >
              {t(lang,"new_quote")}
            </button>
          </div>
        </div>

        {err && <div className="mt-4 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4 text-sm text-red-700 shadow-md">{err}</div>}

        <div className="mt-6 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 font-semibold">
                <th className="py-3">{t(lang, "quote_name")}</th>
                <th className="py-3">{t(lang, "quote_number")}</th>
                <th className="py-3">{t(lang, "status")}</th>
                <th className="py-3">{t(lang, "lang")}</th>
                <th className="py-3">{t(lang, "currency")}</th>
                <th className="py-3">{t(lang, "created_at")}</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => (
                <tr key={q.id} className="border-t border-blue-100 hover:bg-blue-50/50 transition-colors">
                  <td className="py-3 font-semibold text-gray-800">{q.name}</td>
                  <td className="py-3 text-gray-600">{q.number}</td>
                  <td className="py-3">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700">{q.status}</span>
                  </td>
                  <td className="py-3 text-gray-600">{q.lang}</td>
                  <td className="py-3 text-gray-600">{q.currency}</td>
                  <td className="py-3 text-gray-600">{formatDate(q.created_at)}</td>
                  <td className="py-3 text-right flex flex-wrap gap-2 justify-end">
                    <a className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 inline-block" href={`/${lang}/app/quotes/${q.id}`}>{t(lang, "open")}</a>
                    <button
                      className="rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 inline-block"
                      onClick={async () => {
                        if (!window.confirm(t(lang, "confirm_delete"))) return;
                        try {
                          await apiAuth(`/quotes/${q.id}`, token, { method: "DELETE" });
                          setQuotes(prev => prev.filter(item => item.id !== q.id));
                        } catch (e:any) { setErr(e.message); }
                      }}
                    >
                      {t(lang, "delete")}
                    </button>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr><td className="py-6 text-gray-500" colSpan={7}>{t(lang, "no_quotes_yet")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientCreator lang={lang} token={token} onCreated={load} sectionId={clientSectionId} />
    </div>
  );
}

function ClientCreator({ lang, token, onCreated, sectionId }: { lang: Lang; token: string; onCreated: ()=>void; sectionId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState<string|null>(null);
  const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString() : "-";

  useEffect(() => {
    (async () => {
      try {
        const list = await apiAuth<any[]>("/quotes/clients", token);
        setClients(list);
      } catch (e:any) {
        // ignore
      }
    })();
  }, [token]);

  const resetForm = () => {
    setName(""); setEmail(""); setPhone(""); setAddress(""); setEditingId(null);
  };

  const upsertClient = async () => {
    setErr(null);
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
    };
    try {
      if (editingId) {
        await apiAuth(`/quotes/clients/${editingId}`, token, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiAuth("/quotes/clients", token, { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      const list = await apiAuth<any[]>("/quotes/clients", token);
      setClients(list);
      onCreated();
    } catch (e:any) { setErr(e.message); }
  };
  return (
    <div id={sectionId} className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
      <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "add_client")}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input className="rounded-xl border-2 border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" placeholder={t(lang, "client_name")} value={name} onChange={e=>setName(e.target.value)} />
        <input className="rounded-xl border-2 border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" placeholder={t(lang, "client_email")} value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="rounded-xl border-2 border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" placeholder={t(lang, "client_phone")} value={phone} onChange={e=>setPhone(e.target.value)} />
        <input className="rounded-xl border-2 border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" placeholder={t(lang, "client_address")} value={address} onChange={e=>setAddress(e.target.value)} />
        <div className="flex gap-3 md:col-span-2">
          <button
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
            onClick={upsertClient}
          >
            {editingId ? t(lang, "save") : t(lang, "add")}
          </button>
          {editingId && (
            <button
              className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 bg-white hover:bg-blue-50 transition-all"
              onClick={resetForm}
            >
              {t(lang, "cancel")}
            </button>
          )}
        </div>
      </div>
      {err && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="mt-6 overflow-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{t(lang, "clients_list")}</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 font-semibold">
              <th className="py-2">{t(lang, "client_name")}</th>
              <th className="py-2">{t(lang, "client_email")}</th>
              <th className="py-2">{t(lang, "client_phone")}</th>
              <th className="py-2">{t(lang, "created_at")}</th>
              <th className="py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-t border-blue-100">
                <td className="py-2 text-gray-800 font-medium">{c.name}</td>
                <td className="py-2 text-gray-600">{c.email || "—"}</td>
                <td className="py-2 text-gray-600">{c.phone || "—"}</td>
                <td className="py-2 text-gray-600">{formatDate(c.created_at)}</td>
                <td className="py-2 text-right flex flex-wrap gap-2 justify-end">
                  <button
                    className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 text-xs font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                    onClick={() => {
                      setEditingId(c.id);
                      setName(c.name || "");
                      setEmail(c.email || "");
                      setPhone(c.phone || "");
                      setAddress(c.address || "");
                    }}
                  >
                    {t(lang, "edit")}
                  </button>
                  <button
                    className="rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-1 text-xs font-semibold hover:shadow-lg hover:shadow-red-500/30 transition-all"
                    onClick={async () => {
                      if (!window.confirm(t(lang, "confirm_delete"))) return;
                      try {
                        await apiAuth(`/quotes/clients/${c.id}`, token, { method: "DELETE" });
                        setClients(prev => prev.filter(x => x.id !== c.id));
                        onCreated();
                        if (editingId === c.id) resetForm();
                      } catch (e:any) { setErr(e.message); }
                    }}
                  >
                    {t(lang, "delete")}
                  </button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td className="py-3 text-gray-500" colSpan={5}>{t(lang, "none")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';
import React, { useEffect, useState } from "react";
import { isLang, type Lang, t } from "../../../../lib/i18n";
import { getToken } from "../../../../lib/auth";
import { apiAuth } from "../../../../lib/api";

export default function ClientsPage({ params }: { params: { lang: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const token = getToken()!;
  const [clients, setClients] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
    const [taxId, setTaxId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString() : "-";

  async function loadClients() {
    setLoading(true);
    setErr(null);
    try {
      const list = await apiAuth<any[]>("/quotes/clients", token);
      setClients(list);
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadClients(); }, []);

  const resetForm = () => {
    setName(""); setEmail(""); setPhone(""); setAddress(""); setTaxId(""); setEditingId(null);
  };

  const upsertClient = async () => {
    setErr(null);
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      tax_id: taxId.trim() || null,
    };
    try {
      if (editingId) {
        await apiAuth(`/quotes/clients/${editingId}`, token, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiAuth(`/quotes/clients`, token, { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      await loadClients();
    } catch (e:any) { setErr(e.message); }
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setName(c.name || "");
    setEmail(c.email || "");
    setPhone(c.phone || "");
    setAddress(c.address || "");
    setTaxId(c.tax_id || "");
  };

  const deleteClient = async (id: string) => {
    if (!window.confirm(t(lang, "confirm_delete"))) return;
    try {
      await apiAuth(`/quotes/clients/${id}`, token, { method: "DELETE" });
      setClients(prev => prev.filter(c => c.id !== id));
      if (editingId === id) resetForm();
    } catch (e:any) { setErr(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-white to-purple-50 p-8 glow-card border border-purple-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "clients")}</h1>
            <p className="mt-2 text-gray-600">{t(lang, "clients_subtitle") ?? t(lang, "clients_list")}</p>
          </div>
          <a
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
            href={`/${lang}/app/quotes`}
          >
            {t(lang, "quotes")}
          </a>
        </div>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>}

      <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">{editingId ? t(lang, "edit") : t(lang, "add_client")}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="rounded-xl border-2 border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" placeholder={t(lang, "client_name")} value={name} onChange={e=>setName(e.target.value)} />
          <input className="rounded-xl border-2 border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" placeholder={t(lang, "client_email")} value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="rounded-xl border-2 border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" placeholder={t(lang, "client_phone")} value={phone} onChange={e=>setPhone(e.target.value)} />
          <input className="rounded-xl border-2 border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" placeholder={t(lang, "client_address")} value={address} onChange={e=>setAddress(e.target.value)} />
          <input className="rounded-xl border-2 border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" placeholder={t(lang, "client_tax_id") ?? "Tax ID"} value={taxId} onChange={e=>setTaxId(e.target.value)} />
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
      </div>

      <div className="rounded-3xl bg-white border border-blue-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">{t(lang, "clients_list")}</h3>
          {loading && <span className="text-sm text-gray-500">{t(lang, "loading")}</span>}
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 font-semibold">
                <th className="py-2">{t(lang, "client_name")}</th>
                <th className="py-2">{t(lang, "client_email")}</th>
                <th className="py-2">{t(lang, "client_phone")}</th>
                <th className="py-2">{t(lang, "client_tax_id") ?? "Tax ID"}</th>
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
                  <td className="py-2 text-gray-600">{c.tax_id || "—"}</td>
                  <td className="py-2 text-gray-600">{formatDate(c.created_at)}</td>
                  <td className="py-2 text-right flex flex-wrap gap-2 justify-end">
                    <button
                      className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 text-xs font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                      onClick={() => startEdit(c)}
                    >
                      {t(lang, "edit")}
                    </button>
                    <button
                      className="rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-1 text-xs font-semibold hover:shadow-lg hover:shadow-red-500/30 transition-all"
                      onClick={() => deleteClient(c.id)}
                    >
                      {t(lang, "delete")}
                    </button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td className="py-4 text-gray-500" colSpan={6}>{t(lang, "none")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

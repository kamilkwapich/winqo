'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../../../../lib/auth';
import { apiAuth } from '../../../../lib/api';
import { isLang, type Lang, t } from '../../../../lib/i18n';

const colorTranslations: Record<string, { pl: string; en: string; "en-us": string; "en-uk": string; fr: string; de: string; es: string; it: string }> = {
  "biały": { pl: "Biały", en: "White", "en-us": "White", "en-uk": "White", fr: "Blanc", de: "Weiß", es: "Blanco", it: "Bianco" },
  "srebrny": { pl: "Srebrny", en: "Silver", "en-us": "Silver", "en-uk": "Silver", fr: "Argent", de: "Silber", es: "Plateado", it: "Argento" },
  "brązowy": { pl: "Brązowy", en: "Brown", "en-us": "Brown", "en-uk": "Brown", fr: "Marron", de: "Braun", es: "Marrón", it: "Marrone" },
  "antracyt": { pl: "Antracyt", en: "Anthracite", "en-us": "Anthracite", "en-uk": "Anthracite", fr: "Anthracite", de: "Anthrazit", es: "Antracita", it: "Antracite" },
  "złoty dąb": { pl: "Złoty dąb", en: "Golden Oak", "en-us": "Golden Oak", "en-uk": "Golden Oak", fr: "Chêne doré", de: "Goldene Eiche", es: "Roble Dorado", it: "Rovere dorato" },
  "winchester": { pl: "Winchester", en: "Winchester", "en-us": "Winchester", "en-uk": "Winchester", fr: "Winchester", de: "Winchester", es: "Winchester", it: "Winchester" },
  "zielony": { pl: "Zielony", en: "Green", "en-us": "Green", "en-uk": "Green", fr: "Vert", de: "Grün", es: "Verde", it: "Verde" },
  "złoty połysk": { pl: "Złoty połysk", en: "Polished gold", "en-us": "Polished gold", "en-uk": "Polished gold", fr: "Or brillant", de: "Glanzgold", es: "Oro brillo", it: "Oro lucido" },
  "stare złoto": { pl: "Stare złoto", en: "Antique gold", "en-us": "Antique gold", "en-uk": "Antique gold", fr: "Or ancien", de: "Antikgold", es: "Oro envejecido", it: "Oro antico" }
};

const glassTranslations: Record<string, { pl: string; en: string; "en-us": string; "en-uk": string; fr: string; de: string; es: string; it: string }> = {
  "4/16/4 float": { pl: "4/16/4 Float", en: "4/16/4 Float", "en-us": "4/16/4 Float", "en-uk": "4/16/4 Float", fr: "4/16/4 Float", de: "4/16/4 Float", es: "4/16/4 Float", it: "4/16/4 Float" },
  "4/16/4 low-e": { pl: "4/16/4 Low-E", en: "4/16/4 Low-E", "en-us": "4/16/4 Low-E", "en-uk": "4/16/4 Low-E", fr: "4/16/4 Low-E", de: "4/16/4 Low-E", es: "4/16/4 Low-E", it: "4/16/4 Low-E" },
  "4/16/4/16/4 triple": { pl: "4/16/4/16/4 Triple", en: "4/16/4/16/4 Triple", "en-us": "4/16/4/16/4 Triple", "en-uk": "4/16/4/16/4 Triple", fr: "4/16/4/16/4 Triple", de: "4/16/4/16/4 Dreifach", es: "4/16/4/16/4 Triple", it: "4/16/4/16/4 Triplo" },
  "33.1/16/4 bezpieczne": { pl: "33.1/16/4 Bezpieczne", en: "33.1/16/4 Safety", "en-us": "33.1/16/4 Safety", "en-uk": "33.1/16/4 Safety", fr: "33.1/16/4 Sécurité", de: "33.1/16/4 Sicherheit", es: "33.1/16/4 Seguridad", it: "33.1/16/4 Sicurezza" }
};

const translateColorName = (color: string, lang: Lang): string => {
  // Extract the Polish name if it contains " - " (e.g., "Biały - Weiß" -> "Biały")
  const polishName = color.includes(' - ') ? color.split(' - ')[0].trim() : color.trim();
  const entry = colorTranslations[polishName.toLowerCase()];
  return entry?.[lang] || polishName;
};

const translateGlassType = (glass: string, lang: Lang): string => {
  // Extract the Polish name if it contains " - " (e.g., "4/16/4 Float - Float" -> "4/16/4 Float")
  const polishName = glass.includes(' - ') ? glass.split(' - ')[0].trim() : glass.trim();
  const entry = glassTranslations[polishName.toLowerCase()];
  return entry?.[lang] || polishName;
};

export default function SettingsPage({
  params,
}: {
  params: { lang: string };
}) {
  const lang = (isLang(params.lang) ? params.lang : "pl") as Lang;
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [systems, setSystems] = useState<string[]>([]);
  const [glassTypes, setGlassTypes] = useState<string[]>([]);
  const [profileColors, setProfileColors] = useState<string[]>([]);
  const [handleColors, setHandleColors] = useState<string[]>([]);
  const [newSystem, setNewSystem] = useState('');
  const [newGlass, setNewGlass] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newHandleColor, setNewHandleColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const localizedGlassTypes = glassTypes.map((glass) => ({
    value: glass,
    label: translateGlassType(glass, lang)
  }));

  const localizedProfileColors = profileColors.map((color) => ({
    value: color,
    label: translateColorName(color, lang)
  }));

  const localizedHandleColors = handleColors.map((color) => {
    console.log('Handle color:', color, 'type:', typeof color);
    return {
      value: typeof color === 'string' ? color : String(color),
      label: translateColorName(typeof color === 'string' ? color : String(color), lang)
    };
  });

  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.push(`/${lang}/login`);
      return;
    }
    setToken(t);
    loadSettings(t);
  }, [router, lang]);

  async function loadSettings(authToken: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await apiAuth<{
        systems: string[];
        glass_types: string[];
        profile_colors: string[];
        handle_colors: string[];
      }>('/settings', authToken);
      setSystems(data.systems || []);
      setGlassTypes(data.glass_types || []);
      setProfileColors(data.profile_colors || []);
      setHandleColors(data.handle_colors || []);
    } catch (e: any) {
      setError(e.message);
      setSystems(["Gealan Linear MD", "Aluron ASH 80", "Aluron AS70", "Aluprof MB-79", "Salamander BE 82 MD", "Rehau Synego", "Veka Softline 82", "Aluplast Ideal 8000"]);
      setGlassTypes(["4/16/4 Float", "4/16/4 Low-E", "4/16/4/16/4 Triple", "33.1/16/4 Bezpieczne"]);
      setProfileColors(["Biały", "Brązowy", "Antracyt", "Złoty dąb", "Winchester", "Srebrny", "Zielony"]);
      setHandleColors(["Biały", "Srebrny", "Złoty połysk", "Stare złoto", "Brązowy", "Antracyt"]);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiAuth('/settings', token, {
        method: 'PUT',
        body: JSON.stringify({
          systems,
          glass_types: glassTypes,
          profile_colors: profileColors,
          handle_colors: handleColors
        })
      });
      setSuccess(t(lang, "settings_saved"));
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function addSystem() {
    if (newSystem.trim() && !systems.includes(newSystem.trim())) {
      setSystems([...systems, newSystem.trim()]);
      setNewSystem('');
    }
  }

  function removeSystem(index: number) {
    setSystems(systems.filter((_, i) => i !== index));
  }

  function addGlass() {
    if (newGlass.trim() && !glassTypes.includes(newGlass.trim())) {
      setGlassTypes([...glassTypes, newGlass.trim()]);
      setNewGlass('');
    }
  }

  function removeGlass(index: number) {
    setGlassTypes(glassTypes.filter((_, i) => i !== index));
  }

  function addColor() {
    if (newColor.trim() && !profileColors.includes(newColor.trim())) {
      setProfileColors([...profileColors, newColor.trim()]);
      setNewColor('');
    }
  }

  function removeColor(index: number) {
    setProfileColors(profileColors.filter((_, i) => i !== index));
  }

  function addHandleColor() {
    if (newHandleColor.trim() && !handleColors.includes(newHandleColor.trim())) {
      setHandleColors([...handleColors, newHandleColor.trim()]);
      setNewHandleColor('');
    }
  }

  function removeHandleColor(index: number) {
    setHandleColors(handleColors.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "settings")}</h1>
          <button
            onClick={() => router.push(`/${lang}/app`)}
            className="rounded-xl border-2 border-blue-300 bg-white px-5 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-all duration-300"
          >
            {t(lang, "back_to_dashboard")}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl bg-green-50 p-4 text-green-700">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Systems */}
          <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
            <h2 className="mb-6 text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "window_systems")}</h2>
            <div className="mb-6 flex gap-3">
              <input
                type="text"
                value={newSystem}
                onChange={(e) => setNewSystem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSystem()}
                placeholder={t(lang, "add_new_system")}
                className="flex-1 rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <button
                onClick={addSystem}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              >
                {t(lang, "add")}
              </button>
            </div>
            <div className="space-y-3">
              {systems.map((system, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 px-5 py-3 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-sm font-medium text-gray-800">{system}</span>
                  <button
                    onClick={() => removeSystem(index)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-300 hover:scale-110"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {systems.length === 0 && (
                <p className="text-sm text-center py-6 text-gray-500">{t(lang, "no_systems_added")}</p>
              )}
            </div>
          </div>

          {/* Glass Types */}
          <div className="rounded-3xl bg-gradient-to-br from-white to-purple-50 p-8 glow-card border border-purple-100">
            <h2 className="mb-6 text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "glass_types")}</h2>
            <div className="mb-6 flex gap-3">
              <input
                type="text"
                value={newGlass}
                onChange={(e) => setNewGlass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGlass()}
                placeholder={t(lang, "add_new_glass")}
                list="glass-options"
                className="flex-1 rounded-xl border-2 border-purple-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              />
              <datalist id="glass-options">
                {localizedGlassTypes.map((glass) => (
                  <option key={glass.value} value={glass.value} label={glass.label} />
                ))}
              </datalist>
              <button
                onClick={addGlass}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
              >
                {t(lang, "add")}
              </button>
            </div>
            <div className="space-y-3">
              {glassTypes.map((glass, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 px-5 py-3 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-sm font-medium text-gray-800">{translateGlassType(glass, lang)}</span>
                  <button
                    onClick={() => removeGlass(index)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-300 hover:scale-110"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {glassTypes.length === 0 && (
                <p className="text-sm text-center py-6 text-gray-500">{t(lang, "no_glass_types_added")}</p>
              )}
            </div>
          </div>

          {/* Profile Colors */}
          <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
            <h2 className="mb-6 text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "profile_colors")}</h2>
            <div className="mb-6 flex gap-3">
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addColor()}
                placeholder={t(lang, "add_new_color")}
                list="profile-color-options"
                className="flex-1 rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <datalist id="profile-color-options">
                {localizedProfileColors.map((colorObj) => (
                  <option key={colorObj.value} value={colorObj.value}>
                    {colorObj.label}
                  </option>
                ))}
              </datalist>
              <button
                onClick={addColor}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              >
                {t(lang, "add")}
              </button>
            </div>
            <div className="space-y-3">
              {profileColors.map((color, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 px-5 py-3 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-sm font-medium text-gray-800">{translateColorName(color, lang)}</span>
                  <button
                    onClick={() => removeColor(index)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-300 hover:scale-110"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {profileColors.length === 0 && (
                <p className="text-sm text-center py-6 text-gray-500">{t(lang, "no_colors_added")}</p>
              )}
            </div>
          </div>

          {/* Handle Colors */}
          <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-8 glow-card border border-blue-100">
            <h2 className="mb-6 text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "handle_colors")}</h2>
            <div className="mb-6 flex gap-3">
              <input
                type="text"
                value={newHandleColor}
                onChange={(e) => setNewHandleColor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addHandleColor()}
                placeholder={t(lang, "add_new_handle_color")}
                list="handle-color-options"
                className="flex-1 rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <datalist id="handle-color-options">
                {localizedHandleColors.map((colorObj) => (
                  <option key={colorObj.value} value={colorObj.value}>
                    {colorObj.label}
                  </option>
                ))}
              </datalist>
              <button
                onClick={addHandleColor}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              >
                {t(lang, "add")}
              </button>
            </div>
            <div className="space-y-3">
              {handleColors.map((color, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 px-5 py-3 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-sm font-medium text-gray-800">{translateColorName(color, lang)}</span>
                  <button
                    onClick={() => removeHandleColor(index)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-300 hover:scale-110"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {handleColors.length === 0 && (
                <p className="text-sm text-center py-6 text-gray-500">{t(lang, "no_handle_colors_added")}</p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {saving ? t(lang, "saving") : t(lang, "save_settings")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

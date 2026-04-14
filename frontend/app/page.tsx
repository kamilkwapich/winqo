import { headers } from "next/headers";
import { redirect } from "next/navigation";

const SUPPORTED_LANGS = ["pl","en-us","en-uk","fr","de","it","es"];

const COUNTRY_TO_LANG: Record<string, string> = {
  PL: "pl",
  DE: "de",
  AT: "de",
  CH: "de",
  FR: "fr",
  BE: "fr",
  CA: "fr",
  IT: "it",
  ES: "es",
  GB: "en-uk",
  IE: "en-uk",
  US: "en-us",
};

export default function Home() {
  const h = headers();
  const country = (h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || h.get("x-country") || "").toUpperCase();
  
  // Try IP-based country detection first (works in production with CDN)
  const mapped = COUNTRY_TO_LANG[country];
  if (mapped && SUPPORTED_LANGS.includes(mapped)) {
    redirect(`/${mapped}`);
  }

  // Fallback to Accept-Language header (works everywhere including localhost)
  const accept = h.get("accept-language") || "";
  const byAccept = detectByAcceptLanguage(accept);
  const target = byAccept || "pl"; // Changed default to Polish
  redirect(`/${target}`);
}

function detectByAcceptLanguage(value: string): string | null {
  if (!value) return null;
  
  const parts = value.split(",").map((lang) => lang.trim().toLowerCase());
  for (const entry of parts) {
    const code = entry.split(";")[0].trim();
    // More precise matching
    if (code === "pl" || code.startsWith("pl-")) return "pl";
    if (code === "de" || code.startsWith("de-")) return "de";
    if (code === "fr" || code.startsWith("fr-")) return "fr";
    if (code === "it" || code.startsWith("it-")) return "it";
    if (code === "es" || code.startsWith("es-")) return "es";
    if (code === "en-gb" || code === "en-ie") return "en-uk";
    if (code === "en-us" || code === "en" || code.startsWith("en-")) return "en-us";
  }
  return null;
}

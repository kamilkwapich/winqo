import pl from "../i18n/pl.json";
import en from "../i18n/en.json";
import enUs from "../i18n/en-us.json";
import enUk from "../i18n/en-uk.json";
import it from "../i18n/it.json";
import de from "../i18n/de.json";
import es from "../i18n/es.json";
import fr from "../i18n/fr.json";

export type Lang = "pl" | "en" | "en-us" | "en-uk" | "it" | "de" | "es" | "fr";

const DICTS: Record<Lang, any> = { pl, en, "en-us": enUs, "en-uk": enUk, it, de, es, fr };

export function t(lang: Lang, key: string): string {
  return (DICTS[lang] && DICTS[lang][key]) || DICTS["en"][key] || key;
}

export function isLang(x: string): x is Lang {
  return ["pl","en","en-us","en-uk","it","de","es","fr"].includes(x);
}

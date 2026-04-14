'use client';
import React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { isLang, type Lang } from "../lib/i18n";

const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: "pl", label: "PL", flag: "/flags/flag-de.png" },
  { value: "en-us", label: "EN (US)", flag: "/flags/flag-en-us.png" },
  { value: "en-uk", label: "EN (UK)", flag: "/flags/flag-en-uk.png" },
  { value: "fr", label: "FR", flag: "/flags/flag-fr.png" },
  { value: "de", label: "DE", flag: "/flags/flag-it.png" },
  { value: "it", label: "IT", flag: "/flags/flag-pl.png" },
  { value: "es", label: "ES", flag: "/flags/flag-es.png" },
];

export default function LanguageSwitcher({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  const pathParts = (pathname || "/").split("/").filter(Boolean);
  const currentFromPath = pathParts.length ? pathParts[0] : null;

  const normalize = (value: string | null | undefined): Lang => {
    if (!value) return "en-us";
    const lower = value.toLowerCase();
    if (lower === "en") return "en-us";
    if (isLang(lower)) return lower as Lang;
    return "en-us";
  };

  const normalizedLang = normalize(lang);
  const current = normalize(currentFromPath) || normalizedLang;
  const currentOpt = LANG_OPTIONS.find((opt) => opt.value === current) || LANG_OPTIONS[0];

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    if (!open) return;
    const updatePos = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setPos({ top: rect.bottom + 8, left: rect.left });
      }
    };
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const switchTo = React.useCallback((next: Lang) => {
    const parts = (pathname || "/").split("/").filter(Boolean);
    const target = normalize(next);
    const nextPath = parts.length > 1 ? `/${[target, ...parts.slice(1)].join("/")}` : `/${target}`;
    window.location.href = nextPath;
  }, [pathname]);

  const handleOptionClick = React.useCallback((optValue: Lang) => {
    setOpen(false);
    if (optValue !== current) {
      switchTo(optValue);
    }
  }, [current, switchTo]);

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className="flex items-center gap-2 rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <img src={currentOpt.flag} alt="" className="h-5 w-5 rounded" />
        <span>{currentOpt.label}</span>
        <span className="text-gray-400">▾</span>
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed z-[9999] max-h-80 overflow-auto rounded-xl border bg-white shadow-2xl min-w-[208px]"
          style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
        >
          <ul role="listbox" className="py-1 text-sm">
            {LANG_OPTIONS.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 ${opt.value === current ? "bg-gray-100 font-semibold" : ""}`}
                  onClick={() => handleOptionClick(opt.value as Lang)}
                  role="option"
                  aria-selected={opt.value === current}
                >
                  <img src={opt.flag} alt="" className="h-5 w-5 rounded" />
                  <span>{opt.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
}

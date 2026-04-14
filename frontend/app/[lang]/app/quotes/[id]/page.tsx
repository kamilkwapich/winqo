'use client';
import React, { useEffect, useMemo, useState } from "react";
import { getToken } from "../../../../../lib/auth";
import { apiAuth } from "../../../../../lib/api";
import WindowPreview, { renderWindowSvg, type WindowPaneSpec, type WindowSpec } from "../../../../../components/WindowPreview";
import { isLang, type Lang, t } from "../../../../../lib/i18n";

type ItemType = "window" | "shutter" | "door" | "okiennica" | "text";
type PdfPriceMode = "full" | "total-only" | "none";

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
  "33.1/16/4 bezpieczne": { pl: "33.1/16/4 Bezpieczne", en: "33.1/16/4 Safety", "en-us": "33.1/16/4 Safety", "en-uk": "33.1/16/4 Safety", fr: "33.1/16/4 Securite", de: "33.1/16/4 Sicherheit", es: "33.1/16/4 Seguridad", it: "33.1/16/4 Sicurezza" }
};

const LANG_LABELS: Record<Lang, string> = {
  pl: "Polski",
  en: "English",
  "en-us": "English (US)",
  "en-uk": "English (UK)",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  fr: "Français",
};

const translateColorName = (color: string, lang: Lang): string => {
  // Extract the Polish name if it contains " - " (e.g., "Biały - Weiß" -> "Biały")
  const polishName = color.includes(' - ') ? color.split(' - ')[0].trim() : color.trim();
  const key = polishName.toLowerCase();
  const entry = colorTranslations[key];
  if (!entry) return polishName;
  return entry[lang] || polishName;
};

const translateGlassType = (glass: string, lang: Lang): string => {
  // Extract the Polish name if it contains " - " (e.g., "4/16/4 Float - Float" -> "4/16/4 Float")
  const polishName = glass.includes(' - ') ? glass.split(' - ')[0].trim() : glass.trim();
  const key = polishName.toLowerCase();
  const entry = glassTranslations[key];
  if (!entry) return polishName;
  return entry[lang] || polishName;
};

// Reverse translation: from display language back to Polish for storage
const translateColorToPolish = (translatedColor: string, lang: Lang): string => {
  if (lang === 'pl') return translatedColor;
  for (const [polishKey, translations] of Object.entries(colorTranslations)) {
    if (translations[lang]?.toLowerCase() === translatedColor.toLowerCase()) {
      return translations.pl;
    }
  }
  return translatedColor; // fallback if not found
};

const translateGlassToPolish = (translatedGlass: string, lang: Lang): string => {
  if (lang === 'pl') return translatedGlass;
  for (const [polishKey, translations] of Object.entries(glassTranslations)) {
    if (translations[lang]?.toLowerCase() === translatedGlass.toLowerCase()) {
      return translations.pl;
    }
  }
  return translatedGlass; // fallback if not found
};

const colorHexMap: Record<string, string> = {
  "biały": "#f8fafc",
  "srebrny": "#d1d5db",
  "brązowy": "#8b5a2b",
  "antracyt": "#374151",
  "złoty dąb": "#caa472",
  "winchester": "#9c6b4a",
  "zielony": "#16a34a",
  "złoty połysk": "#d4a017",
  "stare złoto": "#b68d40"
};

const resolveColor = (value: string | undefined, lang: Lang, fallback: string): string => {
  if (!value) return fallback;
  const polish = translateColorToPolish(value, lang).toLowerCase();
  return colorHexMap[polish] || value;
};

const defaultWindowSpec = (): WindowSpec => ({
  width: 1200,
  height: 1400,
  shape: "rect",
  hardware: 'Standard',
  frameBars: { horizontal: [], verticalPerRow: [[]], movable: [], movableHandleSide: [] },
  panes: [{ type: "rozwierno-uchylne", handleSide: "prawe", handleColor: "" }],
  sashBars: {}
});

const renderShutterSvg = (
  width: number,
  height: number,
  opts?: { controlSide?: 'lewe' | 'prawe'; boxHeight?: number }
): string => {
  const safeWidth = Math.max(200, width || 0);
  const safeHeight = Math.max(260, height || 0);
  const maxW = 220;
  const maxH = 280;
  const scale = Math.min(maxW / safeWidth, maxH / safeHeight);
  const w = Math.round(safeWidth * scale);
  const h = Math.round(safeHeight * scale);

  const palette = {
    frameStroke: '#0c6b1a',
    frameFill: '#ecfdf3',
    boxFill: '#d1fae5',
    guideFill: '#16a34a',
    slatStroke: '#16a34a'
  };

  const boxHeightMm = Math.max(80, Math.min(opts?.boxHeight ?? 180, safeHeight - 80));
  const boxH = Math.round(boxHeightMm * scale);
  const bodyHeight = Math.max(40, h - boxH - 12);
  const guideW = Math.max(8, Math.round(w * 0.06));
  const margin = 44;
  const outerX = margin;
  const outerY = margin;
  const innerX = outerX + 8;
  const innerY = outerY + 8;
  const innerW = w - 4;
  const svgWidth = w + 12 + margin * 2;
  const svgHeight = h + 12 + margin * 2;

  const slatSpacing = 10;
  const slatCount = Math.max(8, Math.floor(bodyHeight / slatSpacing));
  const slatStartY = innerY + boxH + 4;
  const slatStartX = innerX + guideW;
  const slatWidth = innerW - guideW * 2;

  const slats = Array.from({ length: slatCount }, (_, idx) => {
    const y = slatStartY + idx * slatSpacing;
    return `<line x1="${slatStartX}" x2="${slatStartX + slatWidth}" y1="${y}" y2="${y}" stroke="${palette.slatStroke}" stroke-width="2" />`;
  }).join("");

  const controlSide = opts?.controlSide === 'prawe' ? 'prawe' : 'lewe';
  const controlCx = controlSide === 'lewe' ? innerX - 4 : innerX + innerW + 6;
  const controlCy = innerY + boxH / 2;

  // Dimensions (mm values)
  const dimTextSize = 11;
  const widthDimY = outerY - 12; // above the outer box edge
  const heightDimX = outerX + (w + 12) + 18; // base line just right of total height
  const detailDimX = heightDimX + 14; // shared line for box and curtain heights
  const totalHeightTextY = outerY + (h + 12) / 2;
  const boxDimY = innerY + boxH / 2;
  const curtainDimY = innerY + boxH + bodyHeight / 2;

  return `
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#111" />
        </marker>
      </defs>
      <rect x="${outerX}" y="${outerY}" width="${w + 12}" height="${h + 12}" fill="#ffffff" stroke="${palette.frameStroke}" stroke-width="1.5" />
      <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${boxH}" fill="${palette.boxFill}" stroke="${palette.frameStroke}" stroke-width="1.2" />
      <rect x="${innerX}" y="${innerY + boxH}" width="${innerW}" height="${bodyHeight}" fill="#ffffff" stroke="${palette.frameStroke}" stroke-width="1.2" />
      <rect x="${innerX}" y="${innerY + boxH}" width="${guideW}" height="${bodyHeight}" fill="${palette.guideFill}" stroke="${palette.frameStroke}" stroke-width="1" />
      <rect x="${innerX + innerW - guideW}" y="${innerY + boxH}" width="${guideW}" height="${bodyHeight}" fill="${palette.guideFill}" stroke="${palette.frameStroke}" stroke-width="1" />
      ${slats}
      <circle cx="${controlCx}" cy="${controlCy}" r="4" fill="#ef4444" stroke="#7f1d1d" stroke-width="1" />
      <!-- Width dimension (clickable, 10px above outer box) -->
      <line data-dim="width" x1="${outerX}" y1="${widthDimY}" x2="${outerX + w + 12}" y2="${widthDimY}" stroke="#111" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)" style="cursor:pointer" />
      <text data-dim="width" x="${outerX + (w + 12) / 2}" y="${widthDimY - 4}" text-anchor="middle" font-family="Arial" font-size="${dimTextSize}" fill="#111" style="cursor:pointer">${Math.round(safeWidth)} mm</text>
      <!-- Total height dimension (outside, vertical text) -->
      <line x1="${heightDimX}" y1="${outerY}" x2="${heightDimX}" y2="${outerY + h + 12}" stroke="#111" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)" />
      <text x="${heightDimX + 8}" y="${totalHeightTextY}" text-anchor="middle" font-family="Arial" font-size="${dimTextSize}" fill="#111" transform="rotate(-90 ${heightDimX + 8} ${totalHeightTextY})">${Math.round(safeHeight)} mm</text>
      <!-- Box height dimension (clickable, aligned outside) -->
      <line data-dim="box" x1="${detailDimX}" y1="${innerY}" x2="${detailDimX}" y2="${innerY + boxH}" stroke="#111" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)" style="cursor:pointer" />
      <text data-dim="box" x="${detailDimX + 8}" y="${boxDimY}" text-anchor="middle" font-family="Arial" font-size="${dimTextSize}" fill="#111" transform="rotate(-90 ${detailDimX + 8} ${boxDimY})" style="cursor:pointer">${Math.round(boxHeightMm)} mm</text>
      <!-- Curtain height dimension (clickable, aligned outside) -->
      <line data-dim="curtain" x1="${detailDimX}" y1="${innerY + boxH}" x2="${detailDimX}" y2="${innerY + boxH + bodyHeight}" stroke="#111" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)" style="cursor:pointer" />
      <text data-dim="curtain" x="${detailDimX + 8}" y="${curtainDimY}" text-anchor="middle" font-family="Arial" font-size="${dimTextSize}" fill="#111" transform="rotate(-90 ${detailDimX + 8} ${curtainDimY})" style="cursor:pointer">${Math.round(safeHeight - boxHeightMm)} mm</text>
    </svg>
  `;
};

const renderDoorSvg = (
  width: number,
  height: number,
  opts?: { openingSide?: 'lewe' | 'prawe'; doorColor?: string; handleColor?: string }
): string => {
  const safeWidth = Math.max(400, width || 0);
  const safeHeight = Math.max(1600, height || 0);
  const maxW = 240;
  const maxH = 340;
  const scale = Math.min(maxW / safeWidth, maxH / safeHeight);
  const w = Math.round(safeWidth * scale);
  const h = Math.round(safeHeight * scale);
  const margin = 36;
  const svgWidth = w + margin * 2;
  const svgHeight = h + margin * 2;
  const x = margin;
  const y = margin;
  const frame = Math.max(4, Math.round(Math.min(w, h) * 0.04));
  const palette = {
    frameStroke: "#0c6b1a",
    frameFill: "#20c33b",
    markStroke: "#0c6b1a",
    dimStroke: "#0c6b1a",
    dimText: "#0c6b1a",
  };
  const doorFill = opts?.doorColor || palette.frameFill;
  const handleFill = opts?.handleColor || palette.frameStroke;
  const openingSide = opts?.openingSide === 'lewe' ? 'lewe' : 'prawe';
  const handleSide = openingSide;
  const handleWidth = Math.max(16, Math.round(w * 0.12));
  const handleHeight = Math.max(4, Math.round(h * 0.015));
  const handleBaseW = Math.max(6, Math.round(handleHeight * 1.2));
  const handleBaseH = Math.max(8, Math.round(handleHeight * 2));
  const handleY = y + Math.round(h * 0.45);
  const handleX = handleSide === 'prawe'
    ? x + w - frame - handleWidth - 8
    : x + frame + 8;
  const insetX = Math.max(6, Math.round(w * 0.08));
  const insetY = Math.max(8, Math.round(h * 0.08));
  const tipX = openingSide === 'prawe' ? x + w - insetX : x + insetX;
  const baseX = openingSide === 'prawe' ? x + insetX : x + w - insetX;
  const tipY = y + h / 2;
  const topY = y + insetY;
  const bottomY = y + h - insetY;
  const widthDimY = y - 12;
  const heightDimX = x + w + 14;
  const dimTextSize = 11;

  return `
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="door-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${palette.dimStroke}" />
        </marker>
      </defs>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${palette.frameFill}" stroke="${palette.frameStroke}" stroke-width="${frame}" />
      <rect x="${x + frame}" y="${y + frame}" width="${w - frame * 2}" height="${h - frame * 2}" fill="${doorFill}" stroke="${palette.frameStroke}" stroke-width="1" />
      <rect x="${handleX - handleBaseW}" y="${handleY - handleBaseH / 2}" width="${handleBaseW}" height="${handleBaseH}" fill="${handleFill}" rx="1" />
      <rect x="${handleX}" y="${handleY - handleHeight / 2}" width="${handleWidth}" height="${handleHeight}" fill="${handleFill}" rx="2" />
      <circle cx="${handleX}" cy="${handleY}" r="${Math.max(3, Math.round(handleHeight * 0.7))}" fill="${handleFill}" />
      <line x1="${baseX}" y1="${topY}" x2="${tipX}" y2="${tipY}" stroke="${palette.markStroke}" stroke-width="1.6" stroke-dasharray="6 4" />
      <line x1="${baseX}" y1="${bottomY}" x2="${tipX}" y2="${tipY}" stroke="${palette.markStroke}" stroke-width="1.6" stroke-dasharray="6 4" />
      <line x1="${x}" y1="${widthDimY}" x2="${x + w}" y2="${widthDimY}" stroke="${palette.dimStroke}" stroke-width="1" marker-start="url(#door-arrow)" marker-end="url(#door-arrow)" />
      <text x="${x + w / 2}" y="${widthDimY - 4}" text-anchor="middle" font-family="Arial" font-size="${dimTextSize}" fill="${palette.dimText}">${Math.round(safeWidth)} mm</text>
      <line x1="${heightDimX}" y1="${y}" x2="${heightDimX}" y2="${y + h}" stroke="${palette.dimStroke}" stroke-width="1" marker-start="url(#door-arrow)" marker-end="url(#door-arrow)" />
      <text x="${heightDimX + 8}" y="${y + h / 2}" text-anchor="middle" font-family="Arial" font-size="${dimTextSize}" fill="${palette.dimText}" transform="rotate(-90 ${heightDimX + 8} ${y + h / 2})">${Math.round(safeHeight)} mm</text>
    </svg>
  `;
};

const renderOkiennicaSvg = (
  width: number,
  height: number,
  opts?: {
    profileColor?: string;
    handleColor?: string;
    lamellaType?: 'stale' | 'ruchome';
    openingType?: 'single' | 'double' | 'sliding-single' | 'sliding-double';
    openingSide?: 'lewe' | 'prawe';
    lamellaLabel?: string;
    horizontalBars?: number[];
  }
): string => {
  const safeWidth = Math.max(300, width || 0);
  const safeHeight = Math.max(500, height || 0);
  const maxW = 260;
  const maxH = 360;
  const scale = Math.min(maxW / safeWidth, maxH / safeHeight);
  const w = Math.round(safeWidth * scale);
  const h = Math.round(safeHeight * scale);
  const margin = 46;

  const svgWidth = w + margin * 2;
  const svgHeight = h + margin * 2;
  const x = margin;
  const y = margin;

  const frameMm = 75;
  const frame = Math.max(10, Math.round(frameMm * scale));
  const innerX = x + frame;
  const innerY = y + frame;
  const innerW = Math.max(20, w - frame * 2);
  const innerH = Math.max(20, h - frame * 2);

  const profileFill = opts?.profileColor || '#3f2a12';
  const handleFill = opts?.handleColor || '#111827';
  const lamellaType = opts?.lamellaType === 'ruchome' ? 'ruchome' : 'stale';
  const openingType = opts?.openingType || 'single';
  const openingSide = opts?.openingSide === 'lewe' ? 'lewe' : 'prawe';
  const lamellaLabel = opts?.lamellaLabel || (lamellaType === 'ruchome' ? 'Lamella movable' : 'Lamella fixed');
  const sashCount = openingType.includes('double') ? 2 : 1;
  const isSliding = openingType.startsWith('sliding');

  // Środkowy słupek dla 2 skrzydeł: min. 2x grubszy niż wcześniej
  const mullionW = sashCount === 2 ? Math.max(6, Math.round(frame * 0.44)) : 0;
  const sashGap = mullionW;
  const sashW = sashCount === 2 ? Math.max(12, Math.round((innerW - sashGap) / 2)) : innerW;
  const sashRects = Array.from({ length: sashCount }, (_, idx) => {
    const sx = idx === 0 ? innerX : innerX + sashW + sashGap;
    return { x: sx, y: innerY, w: sashW, h: innerH };
  });

  const openingMarks: string[] = [];
  const handles: string[] = [];

  const drawSwing = (rect: { x: number; y: number; w: number; h: number }, hinge: 'left' | 'right') => {
    const insetX = Math.max(6, Math.round(rect.w * 0.08));
    const insetY = Math.max(6, Math.round(rect.h * 0.08));
    const tipX = hinge === 'right' ? rect.x + rect.w - insetX : rect.x + insetX;
    const baseX = hinge === 'right' ? rect.x + insetX : rect.x + rect.w - insetX;
    const tipY = rect.y + rect.h / 2;
    openingMarks.push(`<line x1="${baseX}" y1="${rect.y + insetY}" x2="${tipX}" y2="${tipY}" stroke="#111" stroke-width="1.5" stroke-dasharray="6 4" />`);
    openingMarks.push(`<line x1="${baseX}" y1="${rect.y + rect.h - insetY}" x2="${tipX}" y2="${tipY}" stroke="#111" stroke-width="1.5" stroke-dasharray="6 4" />`);
  };

  const drawSliding = (rect: { x: number; y: number; w: number; h: number }, dir: 'left' | 'right') => {
    const yMid = rect.y + rect.h / 2;
    const len = rect.w * 0.62;
    const head = Math.min(10, rect.w * 0.14);
    const startX = rect.x + (rect.w - len) / 2;
    const endX = startX + len;
    if (dir === 'right') {
      openingMarks.push(`<line x1="${startX}" y1="${yMid}" x2="${endX}" y2="${yMid}" stroke="#111" stroke-width="1.8" />`);
      openingMarks.push(`<line x1="${endX}" y1="${yMid}" x2="${endX - head}" y2="${yMid - head / 2}" stroke="#111" stroke-width="1.8" />`);
      openingMarks.push(`<line x1="${endX}" y1="${yMid}" x2="${endX - head}" y2="${yMid + head / 2}" stroke="#111" stroke-width="1.8" />`);
    } else {
      openingMarks.push(`<line x1="${endX}" y1="${yMid}" x2="${startX}" y2="${yMid}" stroke="#111" stroke-width="1.8" />`);
      openingMarks.push(`<line x1="${startX}" y1="${yMid}" x2="${startX + head}" y2="${yMid - head / 2}" stroke="#111" stroke-width="1.8" />`);
      openingMarks.push(`<line x1="${startX}" y1="${yMid}" x2="${startX + head}" y2="${yMid + head / 2}" stroke="#111" stroke-width="1.8" />`);
    }
  };

  const slatSpacing = Math.max(8, Math.round(innerH / 24));
  const slatStart = innerY + 8;
  const slatEnd = innerY + innerH - 8;
  const slats: string[] = [];
  for (let yy = slatStart; yy <= slatEnd; yy += slatSpacing) {
    slats.push(`<line x1="${innerX + 4}" y1="${yy}" x2="${innerX + innerW - 4}" y2="${yy}" stroke="#9a9a9a" stroke-width="1.6" opacity="0.9" />`);
  }

  const bars = (opts?.horizontalBars || [])
    .filter(pos => Number.isFinite(pos) && pos > 0 && pos < safeHeight)
    .sort((a, b) => a - b)
    .map(posMm => {
      const yy = y + Math.round((posMm / safeHeight) * h);
      return `<line x1="${x + 2}" y1="${yy}" x2="${x + w - 2}" y2="${yy}" stroke="${profileFill}" stroke-width="6" opacity="0.9" />`;
    })
    .join('');

  const handleY = y + Math.round(h * 0.5);
  if (isSliding) {
    if (sashCount === 1) {
      const r = sashRects[0];
      const hx = openingSide === 'lewe' ? r.x + Math.max(5, Math.round(r.w * 0.1)) : r.x + r.w - 11;
      handles.push(`<rect x="${hx}" y="${handleY - 14}" width="7" height="28" rx="3" fill="${handleFill}" />`);
    } else {
      const left = sashRects[0];
      const right = sashRects[1];
      handles.push(`<rect x="${left.x + left.w - 10}" y="${handleY - 12}" width="6" height="24" rx="3" fill="${handleFill}" />`);
      handles.push(`<rect x="${right.x + 4}" y="${handleY - 12}" width="6" height="24" rx="3" fill="${handleFill}" />`);
    }
  } else {
    if (sashCount === 1) {
      const r = sashRects[0];
      const hx = openingSide === 'lewe' ? r.x + 4 : r.x + r.w - 11;
      handles.push(`<rect x="${hx}" y="${handleY - 14}" width="7" height="28" rx="3" fill="${handleFill}" />`);
    } else {
      const left = sashRects[0];
      const right = sashRects[1];
      handles.push(`<rect x="${left.x + left.w - 10}" y="${handleY - 12}" width="6" height="24" rx="3" fill="${handleFill}" />`);
      handles.push(`<rect x="${right.x + 4}" y="${handleY - 12}" width="6" height="24" rx="3" fill="${handleFill}" />`);
    }
  }

  if (isSliding) {
    if (sashCount === 1) {
      drawSliding(sashRects[0], openingSide === 'lewe' ? 'left' : 'right');
    } else {
      drawSliding(sashRects[0], 'right');
      drawSliding(sashRects[1], 'left');
    }
  } else {
    if (sashCount === 1) {
      drawSwing(sashRects[0], openingSide === 'lewe' ? 'left' : 'right');
    } else {
      drawSwing(sashRects[0], 'right');
      drawSwing(sashRects[1], 'left');
    }
  }
  const topDimY = y - 16;
  const rightDimX = x + w + 18;
  const dimTextSize = 11;
  const innerWmm = Math.max(1, Math.round(safeWidth - 2 * frameMm));
  const innerHmm = Math.max(1, Math.round(safeHeight - 2 * frameMm));

  return `
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="okiennica-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#111" />
        </marker>
      </defs>

      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${profileFill}" stroke="#d9d9d9" stroke-width="1.2" />
      <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" fill="#85745f" stroke="#d0d0d0" stroke-width="1" />
      ${sashCount === 2 ? `<rect x="${innerX + sashW}" y="${innerY}" width="${mullionW}" height="${innerH}" fill="${profileFill}" opacity="0.95" />` : ''}
      ${sashRects.map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none" stroke="#b8b8b8" stroke-width="1" />`).join('')}
      ${slats.join('')}
      ${bars}
      ${openingMarks.join('')}
      ${handles.join('')}

      <line x1="${x}" y1="${topDimY}" x2="${x + w}" y2="${topDimY}" stroke="#111" stroke-width="1" marker-start="url(#okiennica-arrow)" marker-end="url(#okiennica-arrow)" />
      <text x="${x + w / 2}" y="${topDimY - 4}" text-anchor="middle" font-family="Arial" font-size="${dimTextSize}" fill="#111">${Math.round(safeWidth)}</text>

      <line x1="${rightDimX}" y1="${y}" x2="${rightDimX}" y2="${y + h}" stroke="#111" stroke-width="1" marker-start="url(#okiennica-arrow)" marker-end="url(#okiennica-arrow)" />
      <text x="${rightDimX + 9}" y="${y + h / 2}" text-anchor="middle" font-family="Arial" font-size="${dimTextSize}" fill="#111" transform="rotate(-90 ${rightDimX + 9} ${y + h / 2})">${Math.round(safeHeight)}</text>

      <text x="${x + w / 2}" y="${y + h - 12}" text-anchor="middle" font-family="Arial" font-size="10" fill="#111">${innerWmm} x ${innerHmm}</text>
      <text x="${x + w / 2}" y="${y + h / 2 - 12}" text-anchor="middle" font-family="Arial" font-size="11" fill="#111">1.01</text>
      <text x="${x + w / 2}" y="${y + h / 2 + 12}" text-anchor="middle" font-family="Arial" font-size="10" fill="#ef4444">${lamellaLabel}</text>
    </svg>
  `;
};

const getPaneCount = (spec: WindowSpec): number => {
  // Support both old and new structures during migration
  if (spec.frameBars?.verticalPerRow) {
    const rows = (spec.frameBars?.horizontal?.length || 0) + 1;
    let total = 0;
    for (let r = 0; r < rows; r++) {
      const vertBarsInRow = spec.frameBars.verticalPerRow[r] || [];
      total += vertBarsInRow.length + 1;
    }
    return total;
  }
  // Old structure fallback
  const cols = (((spec.frameBars as { vertical?: number[] } | undefined)?.vertical?.length) || 0) + 1;
  const rows = (spec.frameBars?.horizontal?.length || 0) + 1;
  return cols * rows;
};

const defaultPaneForIndex = (idx: number, cols: number): WindowPaneSpec => {
  const col = idx % cols;
  const handleSide = col < cols / 2 ? "prawe" : "lewe";
  return { type: "rozwierno-uchylne", handleSide };
};

const normalizePanes = (spec: WindowSpec): WindowSpec => {
  const count = getPaneCount(spec);
  
  // Migrate old structure to new if needed
  const frameBars = spec.frameBars ?? { horizontal: [], verticalPerRow: [] };
  const legacyVertical = (frameBars as { vertical?: number[] }).vertical;
  if (legacyVertical && !frameBars.verticalPerRow) {
    const rows = (frameBars.horizontal?.length || 0) + 1;
    const verticalPerRow: number[][] = [];
    for (let r = 0; r < rows; r++) {
      verticalPerRow.push([...(legacyVertical || [])]);
    }
    spec = {
      ...spec,
      frameBars: {
        horizontal: frameBars.horizontal || [],
        verticalPerRow,
        movable: frameBars.movable,
        movableHandleSide: frameBars.movableHandleSide
      }
    };
  }
  
  const panes = Array.from({ length: count }, (_, idx) => {
    const pane = spec.panes?.[idx];
    // Calculate default handle side based on position
    let panesSoFar = 0;
    let rowForPane = 0;
    let colForPane = 0;
    const rows = (spec.frameBars?.horizontal?.length || 0) + 1;
    const verticalPerRow = spec.frameBars?.verticalPerRow || [];
    
    for (let r = 0; r < rows; r++) {
      const vertBarsInRow = verticalPerRow[r] || [];
      const cols = vertBarsInRow.length + 1;
      if (idx < panesSoFar + cols) {
        rowForPane = r;
        colForPane = idx - panesSoFar;
        break;
      }
      panesSoFar += cols;
    }
    
    const cols = (verticalPerRow[rowForPane] || []).length + 1;
    const defaultHandleSide = colForPane < cols / 2 ? "prawe" : "lewe";
    
    // Default type logic
    // For classic 2-sash layout (without movable mullion):
    // left = casement, right = tilt-turn (matches requested default drawing)
    let defaultType: 'fix' | 'rozwierne' | 'rozwierno-uchylne' = "rozwierne";
    const movableBars = spec.frameBars?.movable || [];
    const movableHandleSides = spec.frameBars?.movableHandleSide || [];

    if (cols === 2 && movableBars.length === 0) {
      defaultType = colForPane === 0 ? "rozwierne" : "rozwierno-uchylne";
    }
    
    if (movableBars.length > 0) {
      // Calculate global bar index offset for this row
      let globalBarOffset = 0;
      for (let r = 0; r < rowForPane; r++) {
        globalBarOffset += (verticalPerRow[r] || []).length;
      }
      
      // Check left border (bar at colForPane - 1)
      if (colForPane > 0) {
        const globalBarIdx = globalBarOffset + (colForPane - 1);
        if (movableBars.includes(globalBarIdx)) {
          const movableHandleSide = movableHandleSides[globalBarIdx];
          // If movable bar's handle is on left, this pane (right side) gets rozwierne only
          // If movable bar's handle is on right, this pane (left side) gets rozwierno-uchylne
          defaultType = movableHandleSide === 'prawe' ? "rozwierno-uchylne" : "rozwierne";
        }
      }
      
      // Check right border (bar at colForPane)
      if (colForPane < cols - 1) {
        const globalBarIdx = globalBarOffset + colForPane;
        if (movableBars.includes(globalBarIdx)) {
          const movableHandleSide = movableHandleSides[globalBarIdx];
          // If movable bar's handle is on left, this pane (left side) gets rozwierno-uchylne
          // If movable bar's handle is on right, this pane (right side) gets rozwierne only
          defaultType = movableHandleSide === 'lewe' ? "rozwierno-uchylne" : "rozwierne";
        }
      }
    }
    
    return {
      type: pane?.type || defaultType,
      handleSide: pane?.handleSide || defaultHandleSide,
      slideDirection: pane?.slideDirection,
      hasHandle: pane?.hasHandle,
      handleColor: pane?.handleColor
    };
  });
  return { ...spec, panes };
};

export default function QuoteDetail({ params }: { params: { lang: string; id: string } }) {
  const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
  const normalizedRouteLang = (lang === "en" ? "en-us" : lang) as Lang;
  const token = getToken()!;
  const quoteId = params.id;

  const [quote, setQuote] = useState<any | null>(null);
  const [quoteName, setQuoteName] = useState("");
  const [quoteCurrency, setQuoteCurrency] = useState("EUR");
  const [vatRate, setVatRate] = useState<string>("");
  const [transportCost, setTransportCost] = useState<string>("");
  const [installationCost, setInstallationCost] = useState<string>("");
  const [extraCosts, setExtraCosts] = useState<string>("");
  const [savingQuote, setSavingQuote] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [itemType, setItemType] = useState<ItemType>("window");
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState("99.00");
  const [spec, setSpec] = useState<WindowSpec>(() => defaultWindowSpec());
  const [selectedPane, setSelectedPane] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoModalTitle, setDemoModalTitle] = useState<string | null>(null);
  const [demoModalMessage, setDemoModalMessage] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [systems, setSystems] = useState<string[]>([]);
  const [glassTypes, setGlassTypes] = useState<string[]>([]);
  const [profileColors, setProfileColors] = useState<string[]>([]);
  const [handleColors, setHandleColors] = useState<string[]>([]);
  const [stickyDefaults, setStickyDefaults] = useState<{ system?: string; glass?: string; profileColor?: string; thermalTransmittance?: any; hardware?: string; handleColor?: string }>({});
  const [discountMode, setDiscountMode] = useState<'none' | 'percent' | 'amount'>('none');
  const [discountValue, setDiscountValue] = useState<string>("0");
  const [entitlements, setEntitlements] = useState<any | null>(null);
  const [pdfLang, setPdfLang] = useState<Lang>(normalizedRouteLang);
  const [pdfOptionsOpen, setPdfOptionsOpen] = useState(false);
  const [pdfPriceMode, setPdfPriceMode] = useState<PdfPriceMode>("full");
  const [shutterWidth, setShutterWidth] = useState(1200);
  const [shutterHeight, setShutterHeight] = useState(1400);
  const [shutterSide, setShutterSide] = useState<'lewe' | 'prawe'>('lewe');
  const [shutterBoxHeight, setShutterBoxHeight] = useState(180);
  const [shutterColor, setShutterColor] = useState('');
  const [shutterDrive, setShutterDrive] = useState<'manual' | 'motor'>('manual');
  const [tempShutterWidth, setTempShutterWidth] = useState(shutterWidth);
  const [tempShutterHeight, setTempShutterHeight] = useState(shutterHeight);
  const [tempShutterBoxHeight, setTempShutterBoxHeight] = useState(shutterBoxHeight);
  const [doorWidth, setDoorWidth] = useState(880);
  const [doorHeight, setDoorHeight] = useState(2140);
  const [doorOpeningSide, setDoorOpeningSide] = useState<'lewe' | 'prawe'>('prawe');
  const [doorColor, setDoorColor] = useState('');
  const [doorHandleColor, setDoorHandleColor] = useState('');
  const [okiennicaWidth, setOkiennicaWidth] = useState(880);
  const [okiennicaHeight, setOkiennicaHeight] = useState(1340);
  const [okiennicaProfileColor, setOkiennicaProfileColor] = useState('');
  const [okiennicaHandleColor, setOkiennicaHandleColor] = useState('');
  const [okiennicaLamellaType, setOkiennicaLamellaType] = useState<'stale' | 'ruchome'>('ruchome');
  const [okiennicaOpeningType, setOkiennicaOpeningType] = useState<'single' | 'double' | 'sliding-single' | 'sliding-double'>('single');
  const [okiennicaOpeningSide, setOkiennicaOpeningSide] = useState<'lewe' | 'prawe'>('prawe');
  const [okiennicaHorizontalBars, setOkiennicaHorizontalBars] = useState<number[]>([]);
  const [tempOkiennicaWidth, setTempOkiennicaWidth] = useState(880);
  const [tempOkiennicaHeight, setTempOkiennicaHeight] = useState(1340);
  const localizedColors = useMemo(() => profileColors.map(c => {
    const translated = translateColorName(c, lang);
    return { value: translated, label: translated };
  }), [profileColors, lang]);
  const localizedHandleColors = useMemo(() => handleColors.map(c => {
    const translated = translateColorName(c, lang);
    return { value: translated, label: translated };
  }), [handleColors, lang]);
  const localizedGlass = useMemo(() => glassTypes.map(g => {
    const translated = translateGlassType(g, lang);
    return { value: translated, label: translated };
  }), [glassTypes, lang]);
  
  // Temporary dimensions for form inputs (not applied until confirmed)
  const [tempWidth, setTempWidth] = useState(spec.width);
  const [tempHeight, setTempHeight] = useState(spec.height);
  const [notes, setNotes] = useState("");
  const [showShapeOptions, setShowShapeOptions] = useState(true);
  
  // UI state for compact interface
  const [activeTab, setActiveTab] = useState<'basic' | 'frame' | 'pane'>('basic');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    dimensions: true,
    specs: true,
    hardware: false
  });

  async function loadQuote() {
    setErr(null);
    try {
      const q = await apiAuth<any>(`/quotes/${quoteId}`, token);
      setQuote(q);
      setQuoteName(q.name || "");
      setQuoteCurrency(q.currency || "EUR");
      setVatRate(q.vat_rate ? String(q.vat_rate) : "");
      setTransportCost(q.transport_cost ? String(q.transport_cost) : "");
      setInstallationCost(q.installation_cost ? String(q.installation_cost) : "");
      setExtraCosts(q.extra_costs ? String(q.extra_costs) : "");
      if (q.discount_pct && q.discount_pct > 0) {
        setDiscountMode('percent');
        setDiscountValue(String(q.discount_pct));
      } else {
        setDiscountMode('none');
        setDiscountValue("0");
      }
    } catch (e:any) { setErr(e.message); }
  }

  async function loadItems() {
    setErr(null);
    try {
      const it = await apiAuth<any[]>(`/quotes/${quoteId}/items`, token);
      setItems(it);
    } catch (e:any) { setErr(e.message); }
  }

  async function loadSettings() {
    try {
      const data = await apiAuth<{
        systems: string[];
        glass_types: string[];
        profile_colors: string[];
        handle_colors: string[];
      }>('/settings', token);
      setSystems(data.systems || []);
      setGlassTypes(data.glass_types || []);
      setProfileColors(data.profile_colors || []);
      setHandleColors(data.handle_colors || []);
    } catch (e:any) {
      // If settings don't exist, use defaults
      setSystems(["Gealan Linear MD", "Aluron ASH 80", "Aluron AS70", "Aluprof MB-79", "Salamander BE 82 MD", "Rehau Synego", "Veka Softline 82", "Aluplast Ideal 8000"]);
      setGlassTypes(["4/16/4 Float", "4/16/4 Low-E", "4/16/4/16/4 Triple", "33.1/16/4 Bezpieczne"]);
      setProfileColors(["Biały", "Brązowy", "Antracyt", "Złoty dąb", "Winchester", "Srebrny", "Zielony"]);
      setHandleColors(["Biały", "Srebrny", "Złoty połysk", "Stare złoto", "Brązowy", "Antracyt"]);
    }
  }

  async function loadEntitlements() {
    try {
      const res = await apiAuth<any>('/billing/entitlements', token);
      setEntitlements(res?.entitlements || null);
    } catch (e:any) {
      // non-blocking
    }
  }

  function resetItemForm() {
    setErr(null);
    setSuccessMessage(null);
    const baseSpec = defaultWindowSpec();
    const mergedSpec = normalizePanes({
      ...baseSpec,
      system: stickyDefaults.system || baseSpec.system,
      glass: stickyDefaults.glass || baseSpec.glass,
      profileColor: stickyDefaults.profileColor || baseSpec.profileColor,
      thermalTransmittance: stickyDefaults.thermalTransmittance ?? baseSpec.thermalTransmittance,
      hardware: stickyDefaults.hardware || baseSpec.hardware,
      panes: (baseSpec.panes || []).map(p => ({ ...p, handleColor: stickyDefaults.handleColor || p.handleColor }))
    });
    setItemType("window");
    setSpec(mergedSpec);
    setTempWidth(mergedSpec.width);
    setTempHeight(mergedSpec.height);
    setSelectedPane(0);
    setName("");
    setQty(1);
    setUnitPrice("99.00");
    setNotes("");
    setEditingItemId(null);
    setShutterWidth(1200);
    setShutterHeight(1400);
    setShutterSide('lewe');
    setShutterBoxHeight(180);
    setShutterColor('');
    setShutterDrive('manual');
    setTempShutterWidth(1200);
    setTempShutterHeight(1400);
    setTempShutterBoxHeight(180);
    setDoorWidth(880);
    setDoorHeight(2140);
    setDoorOpeningSide('prawe');
    setDoorColor('');
    setDoorHandleColor('');
    setOkiennicaWidth(880);
    setOkiennicaHeight(1340);
    setOkiennicaProfileColor('');
    setOkiennicaHandleColor('');
    setOkiennicaLamellaType('ruchome');
    setOkiennicaOpeningType('single');
    setOkiennicaOpeningSide('prawe');
    setOkiennicaHorizontalBars([]);
    setTempOkiennicaWidth(880);
    setTempOkiennicaHeight(1340);
    setActiveTab('basic');
  }

  function startEditingItem(item: any) {
    setErr(null);
    setSuccessMessage(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const kind = (item?.window_spec as any)?.kind || 'window';
    setEditingItemId(item.id);
    setItemType(kind === 'shutter' ? 'shutter' : kind === 'door' ? 'door' : kind === 'okiennica' ? 'okiennica' : kind === 'text' ? 'text' : 'window');
    setName(item.name || "");
    setQty(item.qty || 1);
    const priceVal = Number.isFinite(item.unit_price)
      ? Number(item.unit_price)
      : Number.isFinite(item.unit_price_cents)
        ? (item.unit_price_cents || 0) / 100
        : 0;
    setUnitPrice(priceVal.toFixed(2));
    setNotes(item.notes || "");
    setActiveTab('basic');

    if (kind === 'window') {
      const rawSpec = { ...defaultWindowSpec(), ...(item.window_spec || {}) } as WindowSpec;
      // Convert Polish values from storage to current language for display
      const translatedSpec = {
        ...rawSpec,
        glass: rawSpec.glass ? translateGlassType(rawSpec.glass, lang) : rawSpec.glass,
        profileColor: rawSpec.profileColor ? translateColorName(rawSpec.profileColor, lang) : rawSpec.profileColor,
        panes: rawSpec.panes?.map(p => ({
          ...p,
          handleColor: p.handleColor ? translateColorName(p.handleColor, lang) : p.handleColor
        }))
      };
      const normalized = normalizePanes(translatedSpec);
      setSpec(normalized);
      setTempWidth(normalized.width);
      setTempHeight(normalized.height);
      setSelectedPane(0);
    } else if (kind === 'shutter') {
      const sh = item.window_spec || {};
      const width = sh.width || 1200;
      const height = sh.height || 1400;
      const boxHeight = sh.box_height || 180;
      setShutterWidth(width);
      setShutterHeight(height);
      setShutterSide(sh.control_side === 'prawe' ? 'prawe' : 'lewe');
      setShutterBoxHeight(boxHeight);
      setShutterColor(sh.color_text || '');
      setShutterDrive(sh.drive === 'motor' ? 'motor' : 'manual');
      setTempShutterWidth(width);
      setTempShutterHeight(height);
      setTempShutterBoxHeight(boxHeight);
    } else if (kind === 'door') {
      const doorSpec = item.window_spec || {};
      const width = doorSpec.width || 880;
      const height = doorSpec.height || 2140;
      setDoorWidth(width);
      setDoorHeight(height);
      setDoorOpeningSide(doorSpec.opening_side === 'lewe' ? 'lewe' : 'prawe');
      setDoorColor(doorSpec.door_color ? translateColorName(doorSpec.door_color, lang) : "");
      setDoorHandleColor(doorSpec.handle_color ? translateColorName(doorSpec.handle_color, lang) : "");
    } else if (kind === 'okiennica') {
      const panelSpec = item.window_spec || {};
      const width = panelSpec.width || 880;
      const height = panelSpec.height || 1340;
      setOkiennicaWidth(width);
      setOkiennicaHeight(height);
      setTempOkiennicaWidth(width);
      setTempOkiennicaHeight(height);
      setOkiennicaProfileColor(panelSpec.profile_color ? translateColorName(panelSpec.profile_color, lang) : "");
      setOkiennicaHandleColor(panelSpec.handle_color ? translateColorName(panelSpec.handle_color, lang) : "");
      setOkiennicaLamellaType(panelSpec.lamella_type === 'stale' ? 'stale' : 'ruchome');
      setOkiennicaOpeningType(
        panelSpec.opening_type === 'double' || panelSpec.opening_type === 'sliding-single' || panelSpec.opening_type === 'sliding-double'
          ? panelSpec.opening_type
          : 'single'
      );
      setOkiennicaOpeningSide(panelSpec.opening_side === 'lewe' ? 'lewe' : 'prawe');
      setOkiennicaHorizontalBars(Array.isArray(panelSpec.horizontal_bars) ? panelSpec.horizontal_bars : []);
    } else {
      const baseSpec = defaultWindowSpec();
      setSpec(baseSpec);
      setTempWidth(baseSpec.width);
      setTempHeight(baseSpec.height);
      setSelectedPane(0);
    }
  }
  
  useEffect(()=>{ loadQuote(); loadItems(); loadSettings(); loadEntitlements(); }, []);

  // No automatic handle color; user picks explicitly

  const subtotal = useMemo(()=> items.reduce((s, it)=> s + (it.qty * (it.unit_price ?? (it.unit_price_cents || 0) / 100)), 0), [items]);
  const discountAmount = useMemo(() => {
    const parsed = Number.parseFloat((discountValue || "0").replace(",", "."));
    const val = Number.isFinite(parsed) ? parsed : 0;
    if (discountMode === 'percent') {
      return Math.max(0, Math.min(100, val)) / 100 * subtotal;
    }
    if (discountMode === 'amount') {
      return Math.max(0, Math.min(val, subtotal));
    }
    return 0;
  }, [discountMode, discountValue, subtotal]);
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const normalizedQuoteLang = useMemo(() => {
    const base = quote?.lang ? (quote.lang === "en" ? "en-us" : quote.lang) : normalizedRouteLang;
    return base as Lang;
  }, [quote?.lang, normalizedRouteLang]);
  const allowedPdfLangs = entitlements?.allowed_languages || [];
  const isMaxPlan = entitlements?.plan_tier === "max" || (entitlements?.plan_code || "").toUpperCase?.().startsWith?.("MAX");
  const isDemo = (entitlements?.plan_code || "").toUpperCase?.() === "DEMO" || (entitlements?.plan_tier || "").toLowerCase?.() === "demo";
  const showPdfLangSelect = isMaxPlan || isDemo;
  const pdfLangOptions = allowedPdfLangs.length ? allowedPdfLangs : [normalizedQuoteLang];
  const normalizedSpec = normalizePanes(spec);
  const paneCount = getPaneCount(normalizedSpec);
  const activePane = normalizedSpec.panes?.[selectedPane] || normalizedSpec.panes?.[0];
  const shutterPreviewSvg = useMemo(
    () => renderShutterSvg(shutterWidth, shutterHeight, { controlSide: shutterSide, boxHeight: shutterBoxHeight }),
    [shutterWidth, shutterHeight, shutterSide, shutterBoxHeight]
  );
  const doorPreviewSvg = useMemo(() => {
    const doorFill = resolveColor(doorColor, lang, "#20c33b");
    const handleFill = resolveColor(doorHandleColor, lang, "#0c6b1a");
    return renderDoorSvg(doorWidth, doorHeight, { openingSide: doorOpeningSide, doorColor: doorFill, handleColor: handleFill });
  }, [doorWidth, doorHeight, doorOpeningSide, doorColor, doorHandleColor, lang]);
  const okiennicaPreviewSvg = useMemo(() => {
    const profileFill = resolveColor(okiennicaProfileColor, lang, "#3f2a12");
    const handleFill = resolveColor(okiennicaHandleColor, lang, "#111827");
    return renderOkiennicaSvg(okiennicaWidth, okiennicaHeight, {
      profileColor: profileFill,
      handleColor: handleFill,
      lamellaType: okiennicaLamellaType,
      openingType: okiennicaOpeningType,
      openingSide: okiennicaOpeningSide,
      lamellaLabel: t(lang, okiennicaLamellaType === 'ruchome' ? 'okiennica_lamella_movable' : 'okiennica_lamella_fixed'),
      horizontalBars: okiennicaHorizontalBars,
    });
  }, [okiennicaWidth, okiennicaHeight, okiennicaProfileColor, okiennicaHandleColor, okiennicaLamellaType, okiennicaOpeningType, okiennicaOpeningSide, okiennicaHorizontalBars, lang]);

  function handleShutterSvgClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    const dim = target?.dataset?.dim;
    if (!dim) return;
    let currentVal = 0;
    let label = '';
    if (dim === 'width') { currentVal = tempShutterWidth; label = t(lang, 'width_mm'); }
    if (dim === 'box') { currentVal = tempShutterBoxHeight; label = t(lang, 'shutter_box_height'); }
    if (dim === 'curtain') { currentVal = tempShutterHeight - tempShutterBoxHeight; label = t(lang, 'height_mm'); }
    const next = window.prompt(label, String(Math.max(0, Math.round(currentVal))));
    if (next === null) return;
    const val = parseInt(next, 10);
    if (!Number.isFinite(val) || val <= 0) return;
    if (dim === 'width') setTempShutterWidth(val);
    if (dim === 'box') setTempShutterBoxHeight(val);
    if (dim === 'curtain') setTempShutterHeight(val + tempShutterBoxHeight);
  }

  useEffect(() => {
    if (selectedPane >= paneCount) {
      setSelectedPane(Math.max(0, paneCount - 1));
    }
  }, [paneCount, selectedPane]);
  
  // Sync temp dimensions with spec when spec changes externally
  useEffect(() => {
    setTempWidth(spec.width);
    setTempHeight(spec.height);
  }, [spec.width, spec.height]);

  // Sync temp shutter dimensions when applied
  useEffect(() => {
    setTempShutterWidth(shutterWidth);
    setTempShutterHeight(shutterHeight);
    setTempShutterBoxHeight(shutterBoxHeight);
  }, [shutterWidth, shutterHeight, shutterBoxHeight]);

  useEffect(() => {
    setTempOkiennicaWidth(okiennicaWidth);
    setTempOkiennicaHeight(okiennicaHeight);
  }, [okiennicaWidth, okiennicaHeight]);

  const showDemoBlockModal = (title?: string, message?: string) => {
    setDemoModalTitle(title || t(lang, "demo_action_block_title"));
    setDemoModalMessage(message || t(lang, "demo_action_block"));
    setDemoModalOpen(true);
  };

  useEffect(() => {
    const allowed = allowedPdfLangs;
    const preferred = normalizedQuoteLang;
    if (allowed.length) {
      const next = allowed.includes(pdfLang) ? pdfLang : (allowed.includes(preferred) ? preferred : allowed[0]);
      if (next && next !== pdfLang) {
        setPdfLang(next as Lang);
      }
    } else if (preferred && preferred !== pdfLang) {
      setPdfLang(preferred as Lang);
    }
  }, [allowedPdfLangs, normalizedQuoteLang, pdfLang]);

  const handleGeneratePdf = async (priceMode: PdfPriceMode) => {
    if (isDemo) {
      showDemoBlockModal();
      return;
    }
    setIsPdfLoading(true);
    try {
      const params = new URLSearchParams();
      if (pdfLang) {
        params.set("lang", pdfLang);
      }
      params.set("price_mode", priceMode);
      const query = params.toString();
      const res = await fetch(`/api/pdf/quote/${quoteId}${query ? `?${query}` : ""}`, {
        headers: { Authorization: `Bearer ${token}`, "X-Lang": pdfLang },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const money = (value: number) => `${value.toFixed(2)} ${quoteCurrency}`;
  const applyShutterDims = () => {
    setShutterWidth(tempShutterWidth);
    setShutterHeight(tempShutterHeight);
    setShutterBoxHeight(Math.max(80, Math.min(tempShutterBoxHeight, Math.max(80, tempShutterHeight - 80))))
  };
  const applyOkiennicaDims = () => {
    const nextW = Math.max(300, tempOkiennicaWidth || 0);
    const nextH = Math.max(500, tempOkiennicaHeight || 0);
    const ratio = okiennicaHeight > 0 ? nextH / okiennicaHeight : 1;
    setOkiennicaWidth(nextW);
    setOkiennicaHeight(nextH);
    if (ratio !== 1) {
      setOkiennicaHorizontalBars(prev => prev
        .map(pos => Math.round(pos * ratio))
        .filter(pos => pos > 20 && pos < nextH - 20));
    }
  };
  const shutterDimensionsChanged =
    tempShutterWidth !== shutterWidth ||
    tempShutterHeight !== shutterHeight ||
    tempShutterBoxHeight !== shutterBoxHeight;
  const okiennicaDimensionsChanged = tempOkiennicaWidth !== okiennicaWidth || tempOkiennicaHeight !== okiennicaHeight;

  // Handle window size changes with proportional bar scaling
  function handleWidthChange(newWidth: number) {
    const oldWidth = spec.width;
    if (oldWidth === newWidth || oldWidth === 0) {
      setSpec({ ...spec, width: newWidth });
      return;
    }
    
    const ratio = newWidth / oldWidth;
    // Scale and clamp vertical bars to ensure they stay within valid bounds
    const verticalPerRow = spec.frameBars?.verticalPerRow?.map(row =>
      row.map(pos => {
        const scaled = Math.round(pos * ratio);
        // Ensure bars are at least 10mm from edges and not beyond bounds
        return Math.max(10, Math.min(newWidth - 10, scaled));
      }).filter(pos => pos > 0 && pos < newWidth) // Remove any bars at or beyond boundaries
    ) || [];
    
    // Scale sash bars too
    const newSashBars = spec.sashBars ? { ...spec.sashBars } : undefined;
    if (newSashBars) {
      Object.keys(newSashBars).forEach(key => {
        const paneIdx = parseInt(key);
        if (newSashBars[paneIdx]?.vertical) {
          newSashBars[paneIdx].vertical = newSashBars[paneIdx].vertical.map(pos => {
            const scaled = Math.round(pos * ratio);
            return Math.max(5, Math.min(newWidth - 5, scaled));
          });
        }
      });
    }
    
    setSpec({
      ...spec,
      width: newWidth,
      frameBars: {
        ...spec.frameBars,
        horizontal: spec.frameBars?.horizontal || [],
        verticalPerRow
      },
      sashBars: newSashBars
    });
  }

  function handleHeightChange(newHeight: number) {
    const oldHeight = spec.height;
    if (oldHeight === newHeight || oldHeight === 0) {
      setSpec({ ...spec, height: newHeight });
      return;
    }
    
    const ratio = newHeight / oldHeight;
    // Scale and clamp horizontal bars to ensure they stay within valid bounds
    const horizontal = spec.frameBars?.horizontal?.map(pos => {
      const scaled = Math.round(pos * ratio);
      // Ensure bars are at least 10mm from edges and not beyond bounds
      return Math.max(10, Math.min(newHeight - 10, scaled));
    }).filter(pos => pos > 0 && pos < newHeight) || []; // Remove any bars at or beyond boundaries
    
    // Scale sash bars too
    const newSashBars = spec.sashBars ? { ...spec.sashBars } : undefined;
    if (newSashBars) {
      Object.keys(newSashBars).forEach(key => {
        const paneIdx = parseInt(key);
        if (newSashBars[paneIdx]?.horizontal) {
          newSashBars[paneIdx].horizontal = newSashBars[paneIdx].horizontal.map(pos => {
            const scaled = Math.round(pos * ratio);
            return Math.max(5, Math.min(newHeight - 5, scaled));
          });
        }
      });
    }
    
    setSpec({
      ...spec,
      height: newHeight,
      frameBars: {
        ...spec.frameBars,
        horizontal,
        verticalPerRow: spec.frameBars?.verticalPerRow || [[]]
      },
      sashBars: newSashBars
    });
  }
  
  // Apply dimension changes (called when user clicks confirm button)
  function applyDimensionChanges() {
    if (tempWidth !== spec.width) {
      handleWidthChange(tempWidth);
    }
    if (tempHeight !== spec.height) {
      handleHeightChange(tempHeight);
    }
  }
  
  // Check if dimensions have changed
  const dimensionsChanged = tempWidth !== spec.width || tempHeight !== spec.height;

  // Handle bar position changes from clicking on dimensions
  function handleBarPositionChange(barType: string, index: number | string, newPosition: number) {
    if (barType === 'frame-v') {
      // Handle vertical frame bars per row
      const [rowStr, idxStr] = String(index).split(',');
      const row = parseInt(rowStr, 10);
      const idx = parseInt(idxStr, 10);
      
      if (isNaN(row) || isNaN(idx)) return;
      
      const verticalPerRow = [...(spec.frameBars?.verticalPerRow || [[]])];
      if (!verticalPerRow[row]) verticalPerRow[row] = [];
      verticalPerRow[row] = [...verticalPerRow[row]];
      verticalPerRow[row][idx] = Math.max(10, Math.min(spec.width - 10, newPosition));
      
      setSpec({
        ...spec,
        frameBars: {
          ...spec.frameBars,
          horizontal: spec.frameBars?.horizontal || [],
          verticalPerRow
        }
      });
    } else if (barType === 'frame-h') {
      const idx = typeof index === 'number' ? index : parseInt(String(index), 10);
      if (isNaN(idx)) return;
      
      const horizontal = [...(spec.frameBars?.horizontal || [])];
      horizontal[idx] = Math.max(10, Math.min(spec.height - 10, newPosition));
      
      setSpec({
        ...spec,
        frameBars: {
          ...spec.frameBars,
          horizontal,
          verticalPerRow: spec.frameBars?.verticalPerRow || [[]]
        }
      });
    } else if (barType === 'sash-v' && selectedPane !== undefined) {
      const idx = typeof index === 'number' ? index : parseInt(String(index), 10);
      if (isNaN(idx)) return;
      
      const sashBars = { ...(spec.sashBars || {}) };
      if (!sashBars[selectedPane]) sashBars[selectedPane] = { vertical: [], horizontal: [] };
      const vertical = [...(sashBars[selectedPane].vertical || [])];
      vertical[idx] = newPosition;
      sashBars[selectedPane] = { ...sashBars[selectedPane], vertical };
      
      setSpec({ ...spec, sashBars });
    } else if (barType === 'sash-h' && selectedPane !== undefined) {
      const idx = typeof index === 'number' ? index : parseInt(String(index), 10);
      if (isNaN(idx)) return;
      
      const sashBars = { ...(spec.sashBars || {}) };
      if (!sashBars[selectedPane]) sashBars[selectedPane] = { vertical: [], horizontal: [] };
      const horizontal = [...(sashBars[selectedPane].horizontal || [])];
      horizontal[idx] = newPosition;
      sashBars[selectedPane] = { ...sashBars[selectedPane], horizontal };
      
      setSpec({ ...spec, sashBars });
    }
  }

  async function saveQuoteMeta() {
    if (isDemo) {
      showDemoBlockModal();
      return;
    }
    setSavingQuote(true);
    setErr(null);
    try {
      if (!quoteName.trim()) {
        setErr(t(lang, "quote_name_required"));
        return;
      }
      const toNumber = (value: string) => {
        const parsed = Number.parseFloat((value || "0").replace(",", "."));
        return Number.isFinite(parsed) ? parsed : 0;
      };
      const discountPct = (() => {
        if (discountMode === 'percent') return toNumber(discountValue);
        if (discountMode === 'amount') {
          const amount = toNumber(discountValue);
          if (amount <= 0 || subtotal <= 0) return 0;
          return Math.min(100, (amount / subtotal) * 100);
        }
        return 0;
      })();
      const res = await apiAuth<any>(`/quotes/${quoteId}`, token, {
        method: "PUT",
        body: JSON.stringify({
          name: quoteName.trim(),
          currency: quoteCurrency,
          vat_rate: toNumber(vatRate),
          transport_cost: toNumber(transportCost),
          installation_cost: toNumber(installationCost),
          extra_costs: toNumber(extraCosts),
          discount_pct: discountPct,
        })
      });
      setQuote(res);
      setQuoteName(res.name || "");
      setQuoteCurrency(res.currency || quoteCurrency);
      setVatRate(res.vat_rate ? String(res.vat_rate) : "");
      setTransportCost(res.transport_cost ? String(res.transport_cost) : "");
      setInstallationCost(res.installation_cost ? String(res.installation_cost) : "");
      setExtraCosts(res.extra_costs ? String(res.extra_costs) : "");
      setDiscountMode(res.discount_pct && res.discount_pct > 0 ? 'percent' : 'none');
      setDiscountValue(res.discount_pct ? String(res.discount_pct) : "0");
    } catch (e:any) { setErr(e.message); }
    finally { setSavingQuote(false); }
  }

  return (
    <div className="space-y-6">
      <datalist id="colors-list">
        {localizedColors.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </datalist>
      <datalist id="handle-colors-list">
        {localizedHandleColors.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </datalist>
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="max-w-md w-full rounded-2xl bg-white shadow-2xl border border-purple-100 p-6">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{demoModalTitle || t(lang, "demo_action_block_title")}</h3>
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">{demoModalMessage || t(lang, "demo_action_block")}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all"
                onClick={() => { setDemoModalOpen(false); setDemoModalTitle(null); setDemoModalMessage(null); }}
              >
                {t(lang, "close") || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
      {pdfOptionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="max-w-lg w-full rounded-2xl bg-white shadow-2xl border border-purple-100 p-6">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{t(lang, "pdf_price_mode_title")}</h3>
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">{t(lang, "pdf_price_mode_hint")}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {([
                ["full", "pdf_price_mode_full"],
                ["total-only", "pdf_price_mode_total_only"],
                ["none", "pdf_price_mode_none"],
              ] as Array<[PdfPriceMode, string]>).map(([value, labelKey]) => {
                const active = pdfPriceMode === value;
                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-all ${active ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}
                  >
                    <input
                      type="radio"
                      name="pdf-price-mode"
                      className="h-4 w-4 text-blue-600"
                      checked={active}
                      onChange={() => setPdfPriceMode(value)}
                    />
                    <span className="text-sm font-medium text-gray-800">{t(lang, labelKey)}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                onClick={() => setPdfOptionsOpen(false)}
                disabled={isPdfLoading}
              >
                {t(lang, "cancel")}
              </button>
              <button
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:cursor-not-allowed disabled:opacity-70"
                onClick={async () => {
                  setPdfOptionsOpen(false);
                  await handleGeneratePdf(pdfPriceMode);
                }}
                disabled={isPdfLoading}
              >
                {isPdfLoading ? `${t(lang, "generate_pdf")}...` : t(lang, "generate_pdf")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success notification */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-white shadow-xl shadow-green-500/50 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">{successMessage}</span>
          </div>
        </div>
      )}
      
      <div className="rounded-3xl bg-gradient-to-br from-white to-purple-50 p-8 glow-card border border-purple-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "quotation_title")}</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_auto_auto_auto] md:items-end">
          <div>
            <label className="text-sm font-semibold text-gray-700">{t(lang, "quote_name")}</label>
            <input
              className="mt-2 w-full rounded-xl border-2 border-blue-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              value={quoteName}
              onChange={e=>setQuoteName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">{t(lang, "currency")}</label>
            <select
              className="mt-2 w-full rounded-xl border-2 border-purple-200 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none transition-all"
              value={quoteCurrency}
              onChange={e=>setQuoteCurrency(e.target.value)}
            >
              <option value="EUR">EUR</option>
              <option value="PLN">PLN</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div className="text-xs text-gray-500 self-center pb-2">
            {t(lang, "quote_number")}: <span className="font-semibold text-gray-800">{quote?.number || "-"}</span>
          </div>
          <button
            className={`rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 ${isDemo ? "bg-gray-400" : "bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/30 hover:shadow-green-500/40"}`}
            disabled={!isDemo && savingQuote}
            onClick={() => {
              if (isDemo) {
                showDemoBlockModal();
                return;
              }
              saveQuoteMeta();
            }}
          >
            {savingQuote && !isDemo ? t(lang, "saving") : t(lang, "save")}
          </button>
          <div className="flex flex-col gap-2">
            {showPdfLangSelect && (
              <div>
                <label className="text-xs font-semibold text-gray-700">{t(lang, "pdf_language")}</label>
                <select
                  className="mt-1 w-full rounded-xl border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-all"
                  value={pdfLang}
                  onChange={e => setPdfLang((e.target.value || normalizedQuoteLang) as Lang)}
                >
                  {pdfLangOptions.map((code: string) => (
                    <option key={code} value={code}>{LANG_LABELS[code as Lang] || (code || '').toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              className={`rounded-xl px-5 py-2 text-sm font-semibold shadow-lg transition-all duration-300 ${isDemo ? "bg-gray-400 text-white cursor-not-allowed shadow-none" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105"}`}
              onClick={() => {
                if (isDemo) {
                  showDemoBlockModal(t(lang, "pdf_demo_block_title"), t(lang, "pdf_demo_block_message"));
                  return;
                }
                setPdfOptionsOpen(true);
              }}
              disabled={isPdfLoading}
            >
              {isDemo ? t(lang, "pdf_demo_disabled") : isPdfLoading ? `${t(lang,"generate_pdf")}...` : t(lang,"generate_pdf")}
            </button>
          </div>
        </div>

        {err && <div className="mt-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4 text-sm text-red-700 shadow-md">{err}</div>}

        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(300px,400px)_1fr]">
          <div>
            <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "add_item")}</h2>
            
            {/* Item name and price - always visible */}
            <div className="space-y-3 mb-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl shadow-sm">
              <div>
                <label className="text-xs font-semibold text-gray-700">{t(lang, "item_type")}</label>
                <select
                  className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  value={itemType}
                  onChange={e => {
                    const next = e.target.value as ItemType;
                    setItemType(next);
                    setActiveTab('basic');
                  }}
                >
                  <option value="window">{t(lang, "item_type_window")}</option>
                  <option value="shutter">{t(lang, "item_type_shutter")}</option>
                  <option value="door">{t(lang, "item_type_door")}</option>
                  <option value="okiennica">{t(lang, "item_type_okiennica")}</option>
                  <option value="text">{t(lang, "item_type_text")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">{t(lang, "name")}</label>
                <input className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">{t(lang, "qty")}</label>
                  <input type="number" className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" value={qty} onChange={e=>setQty(parseInt(e.target.value||"1"))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">{t(lang, "unit_price")}</label>
                  <input type="number" step="0.01" className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all" value={unitPrice} onChange={e=>setUnitPrice(e.target.value)} />
                </div>
              </div>
            </div>

            {itemType === 'window' && (
              <>
                {/* Tabs for different sections */}
                <div className="border-b-2 border-blue-200 mb-4">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveTab('basic')}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${
                        activeTab === 'basic' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50'
                      }`}
                    >
                      {t(lang, "tab_basic")}
                    </button>
                    <button
                      onClick={() => setActiveTab('frame')}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${
                        activeTab === 'frame' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50'
                      }`}
                    >
                      {t(lang, "tab_frame")}
                    </button>
                    <button
                      onClick={() => setActiveTab('pane')}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${
                        activeTab === 'pane' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50'
                      }`}
                    >
                      {t(lang, "tab_sash")}
                    </button>
                  </div>
                </div>

                {/* Tab content */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  
                  {/* BASIC TAB */}
                  {activeTab === 'basic' && (
                    <>
                      <div className="p-4 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl shadow-sm">
                        <label className="text-sm font-bold text-gray-800 block mb-3">{t(lang, "step_window_type")}</label>
                        <select
                          className="w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                          value={(() => {
                            const count = (spec.frameBars?.verticalPerRow?.[0]?.length || 0) + 1;
                            return count <= 1 ? "1" : count === 2 ? "2" : "3";
                          })()}
                          onChange={e => {
                            const selected = e.target.value;
                            const cols = selected === "1" ? 1 : selected === "2" ? 2 : 3;
                            const rows = (spec.frameBars?.horizontal?.length || 0) + 1;
                            const positions: number[] = [];
                            for (let i = 1; i < cols; i++) {
                              positions.push(Math.round((spec.width * i) / cols));
                            }
                            const verticalPerRow: number[][] = Array.from({ length: rows }, () => [...positions]);
                            setSpec(prev => normalizePanes({
                              ...prev,
                              frameBars: {
                                horizontal: prev.frameBars?.horizontal || [],
                                verticalPerRow,
                                movable: [],
                                movableHandleSide: []
                              }
                            }));
                          }}
                        >
                          <option value="1">{t(lang, "window_type_1")}</option>
                          <option value="2">{t(lang, "window_type_2")}</option>
                          <option value="3">{t(lang, "window_type_3")}</option>
                        </select>
                      </div>

                      {/* Dimensions */}
                      <div className="p-4 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl shadow-sm">
                        <label className="text-sm font-bold text-gray-800 block mb-3">{t(lang, "window_dimensions")}</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">{t(lang, "width_mm")}</label>
                          <input type="number" className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                            value={tempWidth} onChange={e=>setTempWidth(parseInt(e.target.value||"0"))} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">{t(lang, "height_mm")}</label>
                          <input type="number" className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                            value={tempHeight} onChange={e=>setTempHeight(parseInt(e.target.value||"0"))} />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-900"
                        onClick={() => setShowShapeOptions((prev) => !prev)}
                      >
                        {showShapeOptions ? t(lang, "collapse_options") : t(lang, "expand_options")}
                      </button>
                      {showShapeOptions && (
                        <div className="mt-3">
                          <label className="text-xs font-semibold text-gray-600">{t(lang, "window_shape")}</label>
                          <select
                            className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                            value={spec.shape || "rect"}
                            onChange={(e) => setSpec(prev => ({ ...prev, shape: e.target.value as WindowSpec["shape"] }))}
                          >
                            <option value="rect">{t(lang, "window_shape_rect")}</option>
                            <option value="round">{t(lang, "window_shape_round")}</option>
                            <option value="arch">{t(lang, "window_shape_arch")}</option>
                            <option value="trapezoid">{t(lang, "window_shape_trapezoid")}</option>
                          </select>
                        </div>
                      )}
                      {dimensionsChanged && (
                        <button onClick={applyDimensionChanges} className="mt-2 w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                          {t(lang, "confirm_dimensions")}
                        </button>
                      )}
                      </div>

                      {/* System, glass, color */}
                      <div className="p-3 bg-white border rounded-xl">
                        <label className="text-sm font-semibold text-gray-800 block mb-2">{t(lang, "specifications")}</label>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-600">{t(lang, "system")}</label>
                            <input type="text" list="systems-list" className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                              value={spec.system || ""} onChange={e=>setSpec({ ...spec, system: e.target.value })} placeholder={t(lang, "select_placeholder")} />
                            <datalist id="systems-list">{systems.map(s => <option key={s} value={s} label={s} />)}</datalist>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">{t(lang, "glass")}</label>
                            <input type="text" list="glass-list" className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                              value={spec.glass || ""} onChange={e=>setSpec({ ...spec, glass: e.target.value })} placeholder={t(lang, "select_placeholder")} />
                            <datalist id="glass-list">{localizedGlass.map(g => <option key={g.value} value={g.value} label={g.label} />)}</datalist>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">{t(lang, "profile_color")}</label>
                            <input type="text" list="colors-list" className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                              value={spec.profileColor || ""}
                              onChange={e=>setSpec({ ...spec, profileColor: e.target.value })}
                              placeholder={t(lang, "select_placeholder")} />
                            <datalist id="colors-list">{localizedColors.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</datalist>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">{t(lang, "thermal_transmittance")}</label>
                            <div className="mt-1 flex rounded-lg border px-2 py-1.5 text-sm items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full focus:outline-none"
                                value={spec.thermalTransmittance ?? ""}
                                onChange={e=>setSpec({ ...spec, thermalTransmittance: e.target.value })}
                                placeholder=""
                              />
                              <span className="text-xs text-gray-500">Uw</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">{t(lang, "hardware")}</label>
                            <select className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                              value={spec.hardware || ''} onChange={e=>setSpec({ ...spec, hardware: e.target.value })}>
                              <option value="">{t(lang, "select_placeholder")}</option>
                              <option value="Standard">Standard</option>
                              <option value="Roto NT">Roto NT</option>
                              <option value="Winkhaus">Winkhaus</option>
                              <option value="Maco Multi-Matic">Maco Multi-Matic</option>
                              <option value="Siegenia Titan">Siegenia Titan</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* FRAME TAB */}
                  {activeTab === 'frame' && (
                    <div className="p-3 bg-white border rounded-xl">
                      <label className="text-sm font-semibold text-gray-800 block mb-3">{t(lang, "frame_bars")}</label>
                      
                      <div className="mb-3">
                        <label className="text-xs text-gray-600 font-medium">{t(lang, "horizontal_bars")}</label>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                          value={spec.frameBars?.horizontal?.length || 0}
                          onChange={e => {
                            const count = Math.max(0, Math.min(5, parseInt(e.target.value || "0")));
                            const positions: number[] = [];
                            for (let i = 0; i < count; i++) {
                              positions.push(Math.round(spec.height * (i + 1) / (count + 1)));
                            }
                            const rows = count + 1;
                            const verticalCount = Math.max(0, Math.min(5, spec.frameBars?.verticalPerRow?.[0]?.length || 0));
                            const verticalPerRow: number[][] = Array.from({ length: rows }, () => {
                              const v: number[] = [];
                              for (let i = 0; i < verticalCount; i++) {
                                v.push(Math.round(spec.width * (i + 1) / (verticalCount + 1)));
                              }
                              return v;
                            });
                            setSpec(prev => normalizePanes({
                              ...prev,
                              frameBars: { horizontal: positions, verticalPerRow, movable: [], movableHandleSide: [] }
                            }));
                          }}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="text-xs text-gray-600 font-medium">{t(lang, "vertical_bars_per_row")}</label>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                          value={spec.frameBars?.verticalPerRow?.[0]?.length || 0}
                          onChange={e => {
                            const count = Math.max(0, Math.min(5, parseInt(e.target.value || "0")));
                            const positions: number[] = [];
                            for (let i = 0; i < count; i++) {
                              positions.push(Math.round(spec.width * (i + 1) / (count + 1)));
                            }
                            const rows = (spec.frameBars?.horizontal?.length || 0) + 1;
                            const verticalPerRow: number[][] = Array.from({ length: rows }, () => [...positions]);
                            setSpec(prev => normalizePanes({
                              ...prev,
                              frameBars: { horizontal: prev.frameBars?.horizontal ?? [], verticalPerRow, movable: [], movableHandleSide: [] }
                            }));
                          }}
                        />
                      </div>
                  </div>
                )}

                  {/* PANE TAB */}
                  {activeTab === 'pane' && (
                    <>
                      <div className="p-3 bg-white border rounded-xl">
                        <div className="mb-2 text-xs text-gray-600">
                          {t(lang, "sash_label")}: {Math.min(selectedPane + 1, paneCount)} / {paneCount}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-600">{t(lang, "pane_type")}</label>
                            <select className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                              value={activePane?.type || "rozwierne"}
                              onChange={e=>{
                                const value = e.target.value as WindowPaneSpec["type"];
                                setSpec(prev => {
                                  const normalized = normalizePanes(prev);
                                  const panes = normalized.panes?.map((pane, idx) =>
                                    idx === selectedPane ? { ...pane, type: value } : pane
                                  );
                                  return { ...normalized, panes };
                                });
                              }}
                            >
                              <option value="fix">{t(lang, "pane_type_fix")}</option>
                              <option value="rozwierne">{t(lang, "pane_type_casement")}</option>
                              <option value="rozwierno-uchylne">{t(lang, "pane_type_tilt_turn")}</option>
                              <option value="uchylne">{t(lang, "pane_type_tilt")}</option>
                              <option value="przesuwne">{t(lang, "pane_type_sliding")}</option>
                            </select>
                          </div>

                          {activePane?.type !== 'fix' && (
                            <>
                              {activePane?.type === 'przesuwne' ? (
                                <div>
                                  <label className="text-xs text-gray-600">{t(lang, "slide_direction")}</label>
                                  <select className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                                    value={activePane?.slideDirection || "prawe"}
                                    onChange={e=>{
                                      const value = e.target.value as 'lewe' | 'prawe';
                                      setSpec(prev => {
                                        const normalized = normalizePanes(prev);
                                        const panes = normalized.panes?.map((pane, idx) =>
                                          idx === selectedPane ? { ...pane, slideDirection: value } : pane
                                        );
                                        return { ...normalized, panes };
                                      });
                                    }}
                                  >
                                    <option value="prawe">W prawo →</option>
                                    <option value="lewe">W lewo ←</option>
                                  </select>
                                </div>
                              ) : (
                                <div>
                                  <label className="text-xs text-gray-600">{t(lang, "handle_side")}</label>
                                  <select className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                                    value={activePane?.handleSide || "prawe"}
                                    onChange={e=>{
                                      const value = e.target.value as WindowPaneSpec["handleSide"];
                                      setSpec(prev => {
                                        const normalized = normalizePanes(prev);
                                        const panes = normalized.panes?.map((pane, idx) =>
                                          idx === selectedPane ? { ...pane, handleSide: value } : pane
                                        );
                                        return { ...normalized, panes };
                                      });
                                    }}
                                  >
                                    <option value="lewe">{t(lang, "handle_left")}</option>
                                    <option value="prawe">{t(lang, "handle_right")}</option>
                                  </select>
                                </div>
                              )}
                              <div>
                                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                  <input type="checkbox" className="rounded"
                                    checked={activePane?.hasHandle !== false}
                                    onChange={e => {
                                      const value = e.target.checked;
                                      setSpec(prev => {
                                        const normalized = normalizePanes(prev);
                                        const panes = normalized.panes?.map((pane, idx) =>
                                          idx === selectedPane ? { ...pane, hasHandle: value } : pane
                                        );
                                        return { ...normalized, panes };
                                      });
                                    }}
                                  />
                                  {t(lang, "has_handle")}
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-white border rounded-xl">
                              {activePane?.hasHandle !== false && (
                                <div>
                                  <label className="text-xs text-gray-600">{t(lang, "handle_color")}</label>
                                  <input
                                    type="text"
                                    list="handle-colors-list"
                                    className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                                    value={activePane?.handleColor ?? ""}
                                    onChange={e => {
                                      const value = e.target.value;
                                      setSpec(prev => {
                                        const normalized = normalizePanes(prev);
                                        const panes = normalized.panes?.map((pane, idx) =>
                                          idx === selectedPane ? { ...pane, handleColor: value } : pane
                                        );
                                        return { ...normalized, panes };
                                      });
                                    }}
                                    placeholder={t(lang, "select_placeholder")}
                                  />
                                  <datalist id="handle-colors-list">{localizedHandleColors.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</datalist>
                                </div>
                              )}
                        <label className="text-sm font-semibold text-gray-800 block mb-2">{t(lang, "crossbars_in_sash")} #{selectedPane + 1}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600">{t(lang, "vertical")}</label>
                            <input type="number" min="0" max="5" className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                              value={spec.sashBars?.[selectedPane]?.vertical?.length || 0}
                          onChange={e => {
                            const count = Math.max(0, Math.min(5, parseInt(e.target.value || "0")));
                            let panesSoFar = 0, rowForPane = 0, colForPane = 0;
                            const rows = (spec.frameBars?.horizontal?.length || 0) + 1;
                            const verticalPerRow = spec.frameBars?.verticalPerRow || [];
                            for (let r = 0; r < rows; r++) {
                              const vertBarsInRow = verticalPerRow[r] || [];
                              const cols = vertBarsInRow.length + 1;
                              if (selectedPane < panesSoFar + cols) {
                                rowForPane = r; colForPane = selectedPane - panesSoFar; break;
                              }
                              panesSoFar += cols;
                            }
                            let paneWidth = spec.width;
                            const vertBarsInRow = verticalPerRow[rowForPane] || [];
                            if (vertBarsInRow.length > 0) {
                              let prevX = 0;
                              for (let c = 0; c <= colForPane; c++) {
                                const nextX = c < vertBarsInRow.length ? vertBarsInRow[c] : spec.width;
                                if (c === colForPane) { paneWidth = nextX - prevX; break; }
                                prevX = nextX;
                              }
                            }
                            const positions: number[] = [];
                            for (let i = 0; i < count; i++) {
                              positions.push(Math.round(paneWidth * (i + 1) / (count + 1)));
                            }
                            setSpec(prev => ({
                              ...prev, sashBars: {
                                ...prev.sashBars,
                                [selectedPane]: { vertical: positions, horizontal: prev.sashBars?.[selectedPane]?.horizontal || [] }
                              }
                            }));
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">{t(lang, "horizontal")}</label>
                        <input type="number" min="0" max="5" className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                          value={spec.sashBars?.[selectedPane]?.horizontal?.length || 0}
                          onChange={e => {
                            const count = Math.max(0, Math.min(5, parseInt(e.target.value || "0")));
                            let panesSoFar = 0, rowForPane = 0, colForPane = 0;
                            const rows = (spec.frameBars?.horizontal?.length || 0) + 1;
                            const verticalPerRow = spec.frameBars?.verticalPerRow || [];
                            for (let r = 0; r < rows; r++) {
                              const vertBarsInRow = verticalPerRow[r] || [];
                              const cols = vertBarsInRow.length + 1;
                              if (selectedPane < panesSoFar + cols) {
                                rowForPane = r; colForPane = selectedPane - panesSoFar; break;
                              }
                              panesSoFar += cols;
                            }
                            let paneHeight = spec.height;
                            const horizBars = spec.frameBars?.horizontal || [];
                            if (horizBars.length > 0) {
                              let prevY = 0;
                              for (let r = 0; r <= rowForPane; r++) {
                                const nextY = r < horizBars.length ? horizBars[r] : spec.height;
                                if (r === rowForPane) { paneHeight = nextY - prevY; break; }
                                prevY = nextY;
                              }
                            }
                            const positions: number[] = [];
                            for (let i = 0; i < count; i++) {
                              positions.push(Math.round(paneHeight * (i + 1) / (count + 1)));
                            }
                            setSpec(prev => ({
                              ...prev, sashBars: {
                                ...prev.sashBars,
                                [selectedPane]: { vertical: prev.sashBars?.[selectedPane]?.vertical || [], horizontal: positions }
                              }
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                    </>
                  )}
                </div>
              </>
            )}

            {itemType === 'shutter' && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                <div className="p-4 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl shadow-sm">
                  <label className="text-sm font-bold text-gray-800 block mb-3">{t(lang, "window_dimensions")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "width_mm")}</label>
                      <input type="number" className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={tempShutterWidth} onChange={e=>setTempShutterWidth(parseInt(e.target.value||"0"))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "height_mm")}</label>
                      <input type="number" className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={tempShutterHeight} onChange={e=>setTempShutterHeight(parseInt(e.target.value||"0"))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "shutter_control_side")}</label>
                      <select
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={shutterSide}
                        onChange={e => setShutterSide(e.target.value as 'lewe' | 'prawe')}
                      >
                        <option value="lewe">{t(lang, "left")}</option>
                        <option value="prawe">{t(lang, "right")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "shutter_box_height")}</label>
                      <input
                        type="number"
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={tempShutterBoxHeight}
                        onChange={e => setTempShutterBoxHeight(parseInt(e.target.value || "0"))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "shutter_color")}</label>
                      <input
                        type="text"
                        list="colors-list"
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={shutterColor}
                        onChange={e => setShutterColor(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "shutter_drive")}</label>
                      <select
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={shutterDrive}
                        onChange={e => setShutterDrive(e.target.value as 'manual' | 'motor')}
                      >
                        <option value="manual">{t(lang, "shutter_drive_manual")}</option>
                        <option value="motor">{t(lang, "shutter_drive_motor")}</option>
                      </select>
                    </div>
                  </div>
                  {shutterDimensionsChanged && (
                    <button
                      onClick={applyShutterDims}
                      className="mt-3 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      {t(lang, "confirm_dimensions")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {itemType === 'door' && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                <div className="p-4 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl shadow-sm">
                  <label className="text-sm font-bold text-gray-800 block mb-3">{t(lang, "door_dimensions")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "width_mm")}</label>
                      <input
                        type="number"
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={doorWidth}
                        onChange={e => setDoorWidth(parseInt(e.target.value || "0"))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "height_mm")}</label>
                      <input
                        type="number"
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={doorHeight}
                        onChange={e => setDoorHeight(parseInt(e.target.value || "0"))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "door_opening_side")}</label>
                      <select
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={doorOpeningSide}
                        onChange={e => setDoorOpeningSide(e.target.value as 'lewe' | 'prawe')}
                      >
                        <option value="lewe">{t(lang, "left_side")}</option>
                        <option value="prawe">{t(lang, "right_side")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "door_color")}</label>
                      <input
                        type="text"
                        list="door-colors-list"
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={doorColor}
                        onChange={e => setDoorColor(e.target.value)}
                        placeholder={t(lang, "select_placeholder")}
                      />
                      <datalist id="door-colors-list">{localizedColors.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</datalist>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "handle_color")}</label>
                      <input
                        type="text"
                        list="door-handle-colors-list"
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={doorHandleColor}
                        onChange={e => setDoorHandleColor(e.target.value)}
                        placeholder={t(lang, "select_placeholder")}
                      />
                      <datalist id="door-handle-colors-list">{localizedHandleColors.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</datalist>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {itemType === 'okiennica' && (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                <div className="p-4 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl shadow-sm">
                  <label className="text-sm font-bold text-gray-800 block mb-3">{t(lang, "okiennica_dimensions")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "width_mm")}</label>
                      <input
                        type="number"
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={tempOkiennicaWidth}
                        onChange={e => setTempOkiennicaWidth(parseInt(e.target.value || "0"))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "height_mm")}</label>
                      <input
                        type="number"
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={tempOkiennicaHeight}
                        onChange={e => setTempOkiennicaHeight(parseInt(e.target.value || "0"))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "profile_color")}</label>
                      <input
                        type="text"
                        list="colors-list"
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={okiennicaProfileColor}
                        onChange={e => setOkiennicaProfileColor(e.target.value)}
                        placeholder={t(lang, "select_placeholder")}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "handle_color")}</label>
                      <input
                        type="text"
                        list="handle-colors-list"
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={okiennicaHandleColor}
                        onChange={e => setOkiennicaHandleColor(e.target.value)}
                        placeholder={t(lang, "select_placeholder")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "okiennica_lamella_type")}</label>
                      <select
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={okiennicaLamellaType}
                        onChange={e => setOkiennicaLamellaType(e.target.value as 'stale' | 'ruchome')}
                      >
                        <option value="stale">{t(lang, "okiennica_lamella_fixed")}</option>
                        <option value="ruchome">{t(lang, "okiennica_lamella_movable")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "okiennica_opening_type")}</label>
                      <select
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={okiennicaOpeningType}
                        onChange={e => setOkiennicaOpeningType(e.target.value as 'single' | 'double' | 'sliding-single' | 'sliding-double')}
                      >
                        <option value="single">{t(lang, "okiennica_opening_single")}</option>
                        <option value="double">{t(lang, "okiennica_opening_double")}</option>
                        <option value="sliding-single">{t(lang, "okiennica_opening_sliding_single")}</option>
                        <option value="sliding-double">{t(lang, "okiennica_opening_sliding_double")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "okiennica_opening_side")}</label>
                      <select
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={okiennicaOpeningSide}
                        onChange={e => setOkiennicaOpeningSide(e.target.value as 'lewe' | 'prawe')}
                      >
                        <option value="lewe">{t(lang, "okiennica_side_left")}</option>
                        <option value="prawe">{t(lang, "okiennica_side_right")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">{t(lang, "okiennica_horizontal_bars")}</label>
                      <input
                        type="number"
                        min="0"
                        max="6"
                        className="mt-1.5 w-full rounded-lg border-2 border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        value={okiennicaHorizontalBars.length}
                        onChange={e => {
                          const count = Math.max(0, Math.min(6, parseInt(e.target.value || "0")));
                          const safeH = Math.max(500, okiennicaHeight || 0);
                          setOkiennicaHorizontalBars(prev => {
                            if (count === prev.length) return prev;
                            if (count < prev.length) return prev.slice(0, count);
                            const next = [...prev];
                            for (let i = prev.length; i < count; i++) {
                              next.push(Math.round(safeH * (i + 1) / (count + 1)));
                            }
                            return next;
                          });
                        }}
                      />
                    </div>
                  </div>

                  {okiennicaHorizontalBars.length > 0 && (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-white p-3">
                      <div className="text-xs font-semibold text-gray-700 mb-2">{t(lang, "okiennica_horizontal_bars")} (mm)</div>
                      <div className="grid grid-cols-2 gap-2">
                        {okiennicaHorizontalBars.map((pos, idx) => (
                          <div key={idx}>
                            <label className="text-[11px] text-gray-600">{t(lang, "horizontal")} #{idx + 1}</label>
                            <input
                              type="number"
                              min="20"
                              max={Math.max(40, okiennicaHeight - 20)}
                              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                              value={pos}
                              onChange={e => {
                                const raw = parseInt(e.target.value || "0", 10);
                                const clamped = Math.max(20, Math.min(Math.max(40, okiennicaHeight - 20), Number.isFinite(raw) ? raw : 20));
                                setOkiennicaHorizontalBars(prev => prev.map((v, i) => i === idx ? clamped : v));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {okiennicaDimensionsChanged && (
                    <button
                      onClick={applyOkiennicaDims}
                      className="mt-3 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      {t(lang, "confirm_dimensions")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {itemType === 'text' && (
              <div className="p-4 bg-white border rounded-2xl shadow-sm text-sm text-gray-700">
                {t(lang, "no_drawing")}
              </div>
            )}

            {/* Add Item Button */}
            <button
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-base font-bold text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 hover:scale-105"
              onClick={async () => {
                setErr(null);
                setSuccessMessage(null);
                try {
                  const unitPriceValue = Number.parseFloat((unitPrice || "0").replace(",", "."));
                  const payload: any = {
                    name,
                    qty,
                    unit_price: Number.isFinite(unitPriceValue) ? unitPriceValue : 0,
                    notes: notes.trim() || null
                  };

                  if (itemType === 'window') {
                    const finalSpec = normalizePanes(spec);
                    // Convert translated values back to Polish for storage
                    const specForStorage = {
                      ...finalSpec,
                      kind: 'window',
                      glass: finalSpec.glass ? translateGlassToPolish(finalSpec.glass, lang) : finalSpec.glass,
                      profileColor: finalSpec.profileColor ? translateColorToPolish(finalSpec.profileColor, lang) : finalSpec.profileColor,
                      panes: finalSpec.panes?.map(p => ({
                        ...p,
                        handleColor: p.handleColor ? translateColorToPolish(p.handleColor, lang) : p.handleColor
                      }))
                    };
                    payload.window_spec = specForStorage;
                    payload.svg = renderWindowSvg(finalSpec);
                    const firstHandle = finalSpec.panes?.find(p => p.handleColor)?.handleColor;
                    setStickyDefaults({
                      system: finalSpec.system || '',
                      glass: finalSpec.glass || '',
                      profileColor: finalSpec.profileColor || '',
                      thermalTransmittance: finalSpec.thermalTransmittance,
                      hardware: finalSpec.hardware || '',
                      handleColor: firstHandle || stickyDefaults.handleColor || ''
                    });
                  } else if (itemType === 'shutter') {
                    const safeWidth = Math.max(100, shutterWidth || 0);
                    const safeHeight = Math.max(100, shutterHeight || 0);
                    const safeBoxHeight = Math.max(80, Math.min(shutterBoxHeight || 0, safeHeight - 80));
                      payload.window_spec = { kind: 'shutter', width: safeWidth, height: safeHeight, control_side: shutterSide, box_height: safeBoxHeight, color_text: shutterColor, drive: shutterDrive };
                      payload.svg = renderShutterSvg(safeWidth, safeHeight, { controlSide: shutterSide, boxHeight: safeBoxHeight });
                  } else if (itemType === 'door') {
                    const safeWidth = Math.max(200, doorWidth || 0);
                    const safeHeight = Math.max(600, doorHeight || 0);
                    const doorColorValue = doorColor ? translateColorToPolish(doorColor, lang) : "";
                    const handleColorValue = doorHandleColor ? translateColorToPolish(doorHandleColor, lang) : "";
                    const doorFill = resolveColor(doorColor, lang, "#20c33b");
                    const handleFill = resolveColor(doorHandleColor, lang, "#0c6b1a");
                    payload.window_spec = {
                      kind: 'door',
                      width: safeWidth,
                      height: safeHeight,
                      opening_side: doorOpeningSide,
                      door_color: doorColorValue,
                      handle_color: handleColorValue
                    };
                    payload.svg = renderDoorSvg(safeWidth, safeHeight, { openingSide: doorOpeningSide, doorColor: doorFill, handleColor: handleFill });
                  } else if (itemType === 'okiennica') {
                    const safeWidth = Math.max(300, okiennicaWidth || 0);
                    const safeHeight = Math.max(500, okiennicaHeight || 0);
                    const profileColorValue = okiennicaProfileColor ? translateColorToPolish(okiennicaProfileColor, lang) : "";
                    const handleColorValue = okiennicaHandleColor ? translateColorToPolish(okiennicaHandleColor, lang) : "";
                    const bars = (okiennicaHorizontalBars || [])
                      .filter(pos => Number.isFinite(pos) && pos > 0 && pos < safeHeight)
                      .map(pos => Math.round(pos))
                      .sort((a, b) => a - b);
                    const profileFill = resolveColor(okiennicaProfileColor, lang, "#3f2a12");
                    const handleFill = resolveColor(okiennicaHandleColor, lang, "#111827");
                    payload.window_spec = {
                      kind: 'okiennica',
                      width: safeWidth,
                      height: safeHeight,
                      horizontal_bars: bars,
                      profile_color: profileColorValue,
                      lamella_type: okiennicaLamellaType,
                      opening_type: okiennicaOpeningType,
                      opening_side: okiennicaOpeningSide,
                      handle_color: handleColorValue,
                    };
                    payload.svg = renderOkiennicaSvg(safeWidth, safeHeight, {
                      profileColor: profileFill,
                      handleColor: handleFill,
                      lamellaType: okiennicaLamellaType,
                      openingType: okiennicaOpeningType,
                      openingSide: okiennicaOpeningSide,
                      lamellaLabel: t(lang, okiennicaLamellaType === 'ruchome' ? 'okiennica_lamella_movable' : 'okiennica_lamella_fixed'),
                      horizontalBars: bars,
                    });
                  } else {
                    payload.window_spec = { kind: 'text' };
                    payload.svg = null;
                  }

                  const isEditing = Boolean(editingItemId);
                  const endpoint = isEditing ? `/quotes/items/${editingItemId}` : `/quotes/${quoteId}/items`;
                  await apiAuth(endpoint, token, {
                    method: isEditing ? "PUT" : "POST",
                    body: JSON.stringify(payload)
                  });
                  await loadItems();
                  if (isEditing) {
                    setSuccessMessage(t(lang, "item_updated"));
                    resetItemForm();
                  } else {
                    setNotes("");
                    setSuccessMessage(t(lang, "item_added"));
                  }
                  setTimeout(() => setSuccessMessage(null), 3000);
                } catch (e:any) { setErr(e.message); }
              }}
            >
              {editingItemId ? t(lang, "update_item") : t(lang, "add_item")}
            </button>

            {editingItemId && (
              <button
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                onClick={() => resetItemForm()}
              >
                {t(lang, "cancel_edit")}
              </button>
            )}
          </div>

          {/* Preview section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "preview")}</h2>
            <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-3xl p-4 shadow-lg">
              {itemType === 'window' && (
                <WindowPreview 
                  spec={normalizedSpec} 
                  lang={lang}
                  selectedPane={selectedPane} 
                  onSelectPane={setSelectedPane}
                  onDimensionChange={(dimension, value) => {
                    if (dimension === 'width') {
                      handleWidthChange(value);
                    } else if (dimension === 'height') {
                      handleHeightChange(value);
                    } else {
                      setSpec(prev => ({ ...prev, [dimension]: value }));
                    }
                  }}
                  onBarPositionChange={handleBarPositionChange}
                />
              )}
              {itemType === 'shutter' && (
                <div className="flex flex-col items-center gap-2" onClick={handleShutterSvgClick}>
                  <div className="bg-white border rounded-2xl p-3" dangerouslySetInnerHTML={{ __html: shutterPreviewSvg }} />
                  <div className="text-xs text-gray-600">{shutterWidth}×{shutterHeight} mm</div>
                </div>
              )}
              {itemType === 'door' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-white border rounded-2xl p-3" dangerouslySetInnerHTML={{ __html: doorPreviewSvg }} />
                  <div className="text-xs text-gray-600">{doorWidth}×{doorHeight} mm</div>
                </div>
              )}
              {itemType === 'okiennica' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-white border rounded-2xl p-3" dangerouslySetInnerHTML={{ __html: okiennicaPreviewSvg }} />
                  <div className="text-xs text-gray-600">{okiennicaWidth}×{okiennicaHeight} mm</div>
                </div>
              )}
              {itemType === 'text' && (
                <div className="text-sm text-gray-600 italic">{t(lang, "no_drawing")}</div>
              )}
            </div>
            
            {/* Notes field */}
            <div className="mt-4">
              <label className="text-sm font-bold text-gray-800 block mb-2">{t(lang, "notes")}</label>
              <textarea
                className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                rows={3}
                value={notes}
                onChange={e=>setNotes(e.target.value)}
                placeholder={t(lang, "notes_placeholder")}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 shadow-xl">
          <div className="text-sm font-semibold text-blue-100 flex items-center justify-between">
            <span>{t(lang, "subtotal")}</span>
            {discountAmount > 0 && <span className="text-xs text-blue-100/80">{t(lang, "after_discount")}</span>}
          </div>
          <div className="text-4xl font-bold text-white mt-2">{money(totalAfterDiscount)}</div>
          {discountAmount > 0 && (
            <div className="mt-1 text-sm text-blue-100/80">
              <span className="line-through decoration-white/60 decoration-2 mr-2">{money(subtotal)}</span>
              <span>-{money(discountAmount)} ({Math.round((discountAmount / subtotal) * 1000) / 10}%)</span>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr] items-start">
          <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-6 border border-blue-100 shadow-sm">
            <div className="text-lg font-semibold text-gray-800 mb-4">{t(lang, "additional_costs")}</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-600">{t(lang, "vat_rate")}</label>
                <input
                  type="number"
                  step="0.1"
                  className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm"
                  value={vatRate}
                  onChange={e => setVatRate(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t(lang, "transport_cost")}</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm"
                  value={transportCost}
                  onChange={e => setTransportCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t(lang, "installation_cost")}</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm"
                  value={installationCost}
                  onChange={e => setInstallationCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t(lang, "extra_costs")}</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm"
                  value={extraCosts}
                  onChange={e => setExtraCosts(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-white to-blue-50 p-6 border border-blue-100 shadow-sm">
            <div className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
              <span>{t(lang, "discounts")}</span>
              {discountAmount > 0 && (
                <span className="text-xs font-semibold text-blue-600">-{money(discountAmount)}</span>
              )}
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-100 bg-white shadow-sm cursor-pointer">
                  <input type="radio" name="discount-mode" checked={discountMode === 'none'} onChange={() => { setDiscountMode('none'); setDiscountValue("0"); }} />
                  <span>{t(lang, "no_discount")}</span>
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-100 bg-white shadow-sm cursor-pointer">
                  <input type="radio" name="discount-mode" checked={discountMode === 'percent'} onChange={() => setDiscountMode('percent')} />
                  <span>{t(lang, "percent_discount")}</span>
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-100 bg-white shadow-sm cursor-pointer">
                  <input type="radio" name="discount-mode" checked={discountMode === 'amount'} onChange={() => setDiscountMode('amount')} />
                  <span>{t(lang, "amount_discount")}</span>
                </label>
              </div>

              {discountMode === 'percent' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">{t(lang, "percent_discount")}</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      placeholder="0"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
              )}

              {discountMode === 'amount' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">{t(lang, "amount_discount")}</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      placeholder="0.00"
                    />
                    <span className="text-gray-500">{quoteCurrency}</span>
                  </div>
                  {subtotal > 0 && discountAmount > 0 && (
                    <div className="text-xs text-gray-500">≈ {Math.round((discountAmount / subtotal) * 1000) / 10}%</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-white to-purple-50 p-8 glow-card border border-purple-100">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t(lang, "current_items")}</h2>
        <div className="mt-6 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 font-semibold">
                <th className="py-3">{t(lang, "position")}</th>
                <th className="py-3">{t(lang, "name")}</th>
                <th className="py-3">{t(lang, "qty")}</th>
                <th className="py-3">{t(lang, "unit")}</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id} className="border-t border-blue-100 hover:bg-blue-50/50 transition-colors">
                  <td className="py-4 font-semibold text-gray-800">{it.position || idx + 1}</td>
                  <td className="py-4">
                    {(() => {
                      const kind = (it.window_spec as any)?.kind || 'window';
                      const kindLabel = kind === 'shutter'
                        ? t(lang, "item_type_shutter")
                        : kind === 'door'
                          ? t(lang, "item_type_door")
                          : kind === 'okiennica'
                            ? t(lang, "item_type_okiennica")
                          : kind === 'text'
                            ? t(lang, "item_type_text")
                            : t(lang, "item_type_window");
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-900">{it.name}</div>
                            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[11px] font-semibold">{kindLabel}</span>
                          </div>
                          {kind === 'text' ? (
                            <div className="text-xs text-gray-500 italic mt-2">{t(lang, "no_drawing")}</div>
                          ) : (
                            <div className="mt-2 max-w-xs" dangerouslySetInnerHTML={{ __html: it.svg || "" }} />
                          )}
                        </>
                      );
                    })()}
                  </td>
                  <td className="py-4 text-gray-700">{it.qty}</td>
                  <td className="py-4 font-semibold text-gray-800">{money(it.unit_price ?? (it.unit_price_cents || 0) / 100)}</td>
                  <td className="py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 text-sm font-medium shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all hover:scale-105"
                        onClick={() => startEditingItem(it)}
                      >
                        {t(lang, "edit")}
                      </button>
                      <button
                        className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 text-sm font-medium shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40 transition-all hover:scale-105"
                        onClick={async () => {
                          await apiAuth(`/quotes/items/${it.id}`, token, { method:"DELETE" });
                          await loadItems();
                        }}
                      >
                        {t(lang, "remove")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td className="py-8 text-center text-gray-500 italic" colSpan={5}>{t(lang, "no_items_yet")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

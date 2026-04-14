"use client";

import { useEffect, useRef, useState } from "react";
import { t, type Lang } from "../lib/i18n";

const WINDOW_KEY = "__winqoCookieBannerOpen";

type TextPos = {
  x: number;
  y: number;
  maxWidth: number;
};

function arrowHeadPath(endX: number, endY: number, angle: number, size = 14) {
  const leftX = endX - size * Math.cos(angle - 0.4);
  const leftY = endY - size * Math.sin(angle - 0.4);
  const rightX = endX - size * Math.cos(angle + 0.4);
  const rightY = endY - size * Math.sin(angle + 0.4);
  return `M ${leftX} ${leftY} L ${endX} ${endY} L ${rightX} ${rightY}`;
}

function nearestEdgePoint(startX: number, startY: number, rect: DOMRect) {
  const leftDist = Math.abs(startX - rect.left);
  const rightDist = Math.abs(startX - rect.right);
  const topDist = Math.abs(startY - rect.top);
  const bottomDist = Math.abs(startY - rect.bottom);
  const min = Math.min(leftDist, rightDist, topDist, bottomDist);
  if (min === leftDist) {
    return {
      x: rect.left,
      y: Math.max(rect.top, Math.min(startY, rect.bottom)),
      edge: "left",
    };
  }
  if (min === rightDist) {
    return {
      x: rect.right,
      y: Math.max(rect.top, Math.min(startY, rect.bottom)),
      edge: "right",
    };
  }
  if (min === topDist) {
    return {
      x: Math.max(rect.left, Math.min(startX, rect.right)),
      y: rect.top,
      edge: "top",
    };
  }
  return {
    x: Math.max(rect.left, Math.min(startX, rect.right)),
    y: rect.bottom,
    edge: "bottom",
  };
}

export default function DemoBanner({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const openRef = useRef(false);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mainTextPos, setMainTextPos] = useState<TextPos | null>(null);
  const [closeTextPos, setCloseTextPos] = useState<TextPos | null>(null);
  const [textRect, setTextRect] = useState<DOMRect | null>(null);
  const [hintRect, setHintRect] = useState<DOMRect | null>(null);
  const [closeRect, setCloseRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer: number | undefined;
    let fallbackTimer: number | undefined;
    const evaluate = (cookieVisible: boolean | null) => {
      const token = window.localStorage.getItem("token");
      const shouldOpen = cookieVisible === false && !token && !dismissed;
      if (shouldOpen && !openRef.current) {
        if (showTimerRef.current) return;
        showTimerRef.current = window.setTimeout(() => {
          setOpen(true);
          timer = window.setTimeout(() => setRevealed(true), 200);
          showTimerRef.current = null;
        }, 5000);
      } else if (!shouldOpen) {
        if (showTimerRef.current) {
          window.clearTimeout(showTimerRef.current);
          showTimerRef.current = null;
        }
        if (openRef.current) {
          setRevealed(false);
          timer = window.setTimeout(() => setOpen(false), 300);
        }
      }
    };
    const initialCookieOpen = typeof (window as any)[WINDOW_KEY] === "boolean" ? Boolean((window as any)[WINDOW_KEY]) : null;
    evaluate(initialCookieOpen);
    fallbackTimer = window.setTimeout(() => {
      const visible = typeof (window as any)[WINDOW_KEY] === "boolean" ? Boolean((window as any)[WINDOW_KEY]) : null;
      evaluate(visible);
    }, 300);
    const onSignal = (event?: Event) => {
      let visible: boolean | null = null;
      if (event && "detail" in event) {
        const detail = (event as CustomEvent).detail as { open?: boolean } | undefined;
        if (typeof detail?.open === "boolean") {
          visible = detail.open;
        }
      }
      if (typeof visible !== "boolean") {
        visible = typeof (window as any)[WINDOW_KEY] === "boolean" ? Boolean((window as any)[WINDOW_KEY]) : null;
      }
      evaluate(visible as boolean | null);
    };
    window.addEventListener("storage", onSignal);
    window.addEventListener("winqo-cookie-banner", onSignal as EventListener);
    window.addEventListener("winqo-auth", onSignal as EventListener);
    return () => {
      window.removeEventListener("storage", onSignal);
      window.removeEventListener("winqo-cookie-banner", onSignal as EventListener);
      window.removeEventListener("winqo-auth", onSignal as EventListener);
      if (timer) window.clearTimeout(timer);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [dismissed]);

  useEffect(() => {
    if (typeof window === "undefined" || !open) return;
    let frame = 0;
    const update = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      const target = document.getElementById("demo-cta");
      if (!target) {
        setTargetRect(null);
        setMainTextPos(null);
        setCloseTextPos(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      const mainWidth = isMobile ? 220 : 300;
      const closeWidth = isMobile ? 220 : 280;
      let mainX = rect.right + 32;
      if (mainX + mainWidth > window.innerWidth - 16) {
        mainX = Math.max(16, window.innerWidth - mainWidth - 16);
      }
      let mainY = rect.top - (isMobile ? 90 : 140);
      if (mainY < 24) {
        mainY = rect.bottom + 24;
      }
      let closeX = 56;
      let closeY = Math.max(140, mainY + 140);
      if (closeY + 80 > window.innerHeight - 24) {
        closeY = Math.max(140, window.innerHeight - 120);
      }
      setTargetRect(rect);
      setMainTextPos({ x: mainX, y: mainY, maxWidth: mainWidth });
      setCloseTextPos({ x: closeX, y: closeY, maxWidth: closeWidth });
    };
    const schedule = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !mainTextPos || !closeTextPos) return;
    let frame = 0;
    const measure = () => {
      if (textRef.current) {
        setTextRect(textRef.current.getBoundingClientRect());
      }
      if (hintRef.current) {
        setHintRect(hintRef.current.getBoundingClientRect());
      }
      if (closeBtnRef.current) {
        setCloseRect(closeBtnRef.current.getBoundingClientRect());
      }
    };
    frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [open, mainTextPos?.x, mainTextPos?.y, closeTextPos?.x, closeTextPos?.y]);

  const close = () => {
    setDismissed(true);
    setRevealed(false);
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => setOpen(false), 300);
  };

  if (!open) return null;

  let mainArrowPath = "";
  let mainArrowShadow = "";
  let mainArrowHead = "";
  let closeArrowPath = "";
  let closeArrowHead = "";
  if (targetRect && textRect) {
    const startX = textRect.left;
    const startY = textRect.bottom;
    const endX = targetRect.left;
    const endY = Math.max(targetRect.top + 6, Math.min(startY, targetRect.bottom - 6));
    const controlX = Math.min(startX, endX) - 80;
    const controlY = startY + Math.max(40, Math.abs(startY - endY) * 0.4);
    mainArrowPath = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
    mainArrowShadow = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
    const angle = Math.atan2(endY - controlY, endX - controlX);
    mainArrowHead = arrowHeadPath(endX, endY, angle, 16);
  }
  if (hintRect && closeRect) {
    const closeStartX = hintRect.right;
    const closeStartY = hintRect.top + 4;
    const closeEndX = closeRect.right;
    const closeEndY = closeRect.top + closeRect.height * 0.55;
    const closeControlX = Math.max(closeStartX, closeEndX) + 40;
    const closeControlY = Math.min(closeStartY, closeEndY) - 40;
    closeArrowPath = `M ${closeStartX} ${closeStartY} Q ${closeControlX} ${closeControlY} ${closeEndX} ${closeEndY}`;
    const closeAngle = Math.atan2(closeEndY - closeControlY, closeEndX - closeControlX);
    closeArrowHead = arrowHeadPath(closeEndX, closeEndY, closeAngle, 12);
  }

  return (
    <div
      className={`fixed inset-0 z-40 transition-opacity duration-500 pointer-events-none ${
        revealed ? "opacity-100" : "opacity-0"
      }`}
    >
      <svg className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden>
        <defs>
          <mask id="demo-cutout" maskUnits="userSpaceOnUse">
            <rect width={viewport.width} height={viewport.height} fill="white" />
            {targetRect && (
              <rect
                x={Math.max(0, targetRect.left - 16)}
                y={Math.max(0, targetRect.top - 14)}
                width={targetRect.width + 32}
                height={targetRect.height + 28}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width={viewport.width} height={viewport.height} fill="rgba(2,6,23,0.65)" mask="url(#demo-cutout)" />
      </svg>
      {targetRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: targetRect.left - 10,
            top: targetRect.top - 10,
            width: targetRect.width + 20,
            height: targetRect.height + 20,
          }}
        >
          <div className="absolute inset-0 rounded-xl border-2 border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.45)]" />
          <div className="absolute inset-1 rounded-xl border border-white/50 rotate-1" />
        </div>
      )}
      <svg className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden>
        {mainArrowShadow && (
          <path
            d={mainArrowShadow}
            className="demo-draw-outline"
            stroke="rgba(15,23,42,0.65)"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {mainArrowPath && (
          <path
            d={mainArrowPath}
            className="demo-draw"
            stroke="#facc15"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {mainArrowHead && (
          <>
            <path
              d={mainArrowHead}
              className="demo-draw-outline"
              stroke="rgba(15,23,42,0.65)"
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={mainArrowHead}
              className="demo-draw"
              stroke="#facc15"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
        {closeArrowPath && (
          <>
            <path
              d={closeArrowPath}
              className="demo-draw-outline"
              stroke="rgba(15,23,42,0.65)"
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={closeArrowPath}
              className="demo-draw-secondary"
              stroke="#fde047"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
        {closeArrowHead && (
          <>
            <path
              d={closeArrowHead}
              className="demo-draw-outline"
              stroke="rgba(15,23,42,0.65)"
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={closeArrowHead}
              className="demo-draw-secondary"
              stroke="#fde047"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
      <button
        type="button"
        onClick={close}
        ref={closeBtnRef}
        className={`absolute left-4 top-4 pointer-events-auto rounded-full border border-white/70 bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 shadow-sm shadow-white/20 hover:bg-white/25 transition ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
      >
        {t(lang, "demo_banner_close")}
      </button>
      {mainTextPos && (
        <div
          ref={textRef}
          className={`absolute pointer-events-none transition-all duration-500 ${
            revealed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
          style={{ left: mainTextPos.x, top: mainTextPos.y, maxWidth: mainTextPos.maxWidth }}
        >
          <div className="text-white drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]">
            <div className="font-hand text-2xl md:text-3xl leading-tight">
              {t(lang, "demo_overlay_text")}
            </div>
          </div>
        </div>
      )}
      {closeTextPos && (
        <div
          ref={hintRef}
          className={`absolute pointer-events-none transition-all duration-500 ${
            revealed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
          style={{ left: closeTextPos.x, top: closeTextPos.y, maxWidth: closeTextPos.maxWidth }}
        >
          <div className="text-white drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]">
            <div className="font-hand text-2xl md:text-3xl leading-tight text-white/95">
              {t(lang, "demo_overlay_close_hint")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

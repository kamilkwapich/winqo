'use client';
import React from "react";
import { t, type Lang } from "../lib/i18n";

export type WindowSpec = {
  width: number;   // mm
  height: number;  // mm
  shape?: 'rect' | 'round' | 'arch' | 'trapezoid';
  hardware?: string;  // typ okucia
  frameBars?: {
    horizontal: number[]; // pozycje poprzeczek poziomych w ramie (mm od góry) - zawsze pełna szerokość
    verticalPerRow: number[][]; // array of arrays - jeden array na każdy wiersz z pozycjami poprzeczek (mm od lewej)
    movable?: number[];   // indeksy poprzeczek pionowych które są ruchome (tylko dla 2 skrzydeł obok siebie)
    movableHandleSide?: ('lewe' | 'prawe')[];  // strona klamki dla każdej ruchomej poprzeczki
  };
  panes?: WindowPaneSpec[];  // length = total panes based on grid
  sashBars?: {
    [paneIndex: number]: {
      vertical: number[];   // pozycje poprzeczek pionowych w skrzydle (mm od lewej krawędzi skrzydła)
      horizontal: number[]; // pozycje poprzeczek poziomych w skrzydle (mm od górnej krawędzi skrzydła)
    };
  };
  frame?: number;  // frame thickness in mm (visual only)
  system?: string;
  glass?: string;
  profileColor?: string;
  thermalTransmittance?: string;
};

export type WindowPaneSpec = {
  type: 'fix' | 'rozwierne' | 'rozwierno-uchylne' | 'uchylne' | 'przesuwne';
  handleSide: 'lewe' | 'prawe';
  slideDirection?: 'lewe' | 'prawe';  // For przesuwne type - which direction it slides
  hasHandle?: boolean;  // Whether this pane has a handle (default true for non-fix types)
  handleColor?: string;
};

export function renderWindowSvg(
  spec: WindowSpec,
  options?: { selectedPane?: number; interactive?: boolean; showBarDimensions?: boolean }
): string {
  const widthMm = Math.max(1, spec.width || 1000);
  const heightMm = Math.max(1, spec.height || 1200);
  const shape = spec.shape || "rect";
  
  const horizontalFrameBars = spec.frameBars?.horizontal || [];
  const verticalPerRow = spec.frameBars?.verticalPerRow || [];
  const rows = horizontalFrameBars.length + 1;
  
  // Calculate total panes and column counts per row
  const colsPerRow: number[] = [];
  let totalPanes = 0;
  for (let r = 0; r < rows; r++) {
    const vertBarsInRow = verticalPerRow[r] || [];
    const cols = vertBarsInRow.length + 1;
    colsPerRow.push(cols);
    totalPanes += cols;
  }
  
  const selectedPane = options?.selectedPane ?? -1;
  const interactive = Boolean(options?.interactive);

  const margin = 50;  // Increased from 40
  const maxSvgW = 450;  // Increased from 400
  const maxSvgH = 450;  // Increased from 400
  const availableW = Math.max(1, maxSvgW - margin * 2);
  const availableH = Math.max(1, maxSvgH - margin * 2);
  const scale = Math.min(availableW / widthMm, availableH / heightMm);

  const w = Math.max(1, Math.round(widthMm * scale));
  const h = Math.max(1, Math.round(heightMm * scale));
  const outerX = margin;
  const outerY = margin;

  const frameThickness = Math.max(8, Math.round(Math.min(w, h) * 0.06));
  const sashThickness = Math.max(6, Math.round(frameThickness * 0.7));
  const innerX = outerX + frameThickness;
  const innerY = outerY + frameThickness;
  const innerW = w - frameThickness * 2;
  const innerH = h - frameThickness * 2;

  const shapeElement = (shapeType: string, x: number, y: number, wVal: number, hVal: number, extra: string) => {
    if (shapeType === "round") {
      const cx = x + wVal / 2;
      const cy = y + hVal / 2;
      const rx = wVal / 2;
      const ry = hVal / 2;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${extra} />`;
    }
    if (shapeType === "arch") {
      const r = Math.max(1, Math.min(wVal / 2, hVal));
      const arcY = y + r;
      const path = `M ${x} ${arcY} A ${r} ${r} 0 0 1 ${x + wVal} ${arcY} L ${x + wVal} ${y + hVal} L ${x} ${y + hVal} Z`;
      return `<path d="${path}" ${extra} />`;
    }
    if (shapeType === "trapezoid") {
      const inset = Math.min(wVal * 0.18, wVal * 0.45);
      const points = [
        `${x + inset},${y}`,
        `${x + wVal - inset},${y}`,
        `${x + wVal},${y + hVal}`,
        `${x},${y + hVal}`,
      ].join(" ");
      return `<polygon points="${points}" ${extra} />`;
    }
    return `<rect x="${x}" y="${y}" width="${wVal}" height="${hVal}" ${extra} />`;
  };

  // Calculate row heights based on horizontal frameBars
  const rowHeightsMm: number[] = [];
  let prevY = 0;
  for (let i = 0; i < rows; i++) {
    const nextY = i < horizontalFrameBars.length ? horizontalFrameBars[i] : heightMm;
    rowHeightsMm.push(nextY - prevY);
    prevY = nextY;
  }
  const rowHeights = rowHeightsMm.map(hmm => (hmm / heightMm) * innerH);

  // Calculate column widths per row based on verticalPerRow
  const colWidthsPerRow: number[][] = [];
  const colWidthsMmPerRow: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const vertBarsInRow = verticalPerRow[r] || [];
    const cols = vertBarsInRow.length + 1;
    const widthsMm: number[] = [];
    let prevX = 0;
    for (let i = 0; i < cols; i++) {
      const nextX = i < vertBarsInRow.length ? vertBarsInRow[i] : widthMm;
      widthsMm.push(nextX - prevX);
      prevX = nextX;
    }
    colWidthsMmPerRow.push(widthsMm);
    colWidthsPerRow.push(widthsMm.map(wmm => (wmm / widthMm) * innerW));
  }

  const panes: string[] = [];
  const glass: string[] = [];
  const openingMarks: string[] = [];
  const handles: string[] = [];
  const selection: string[] = [];
  const clickTargets: string[] = [];
  const sashBarsDrawing: string[] = [];
  const glassClips: string[] = [];

  const paneSpecs: WindowPaneSpec[] = Array.from({ length: totalPanes }, (_, idx) => {
    const pane = spec.panes?.[idx];
    // Calculate which row this pane is in
    let panesSoFar = 0;
    let rowForPane = 0;
    let colForPane = 0;
    for (let r = 0; r < rows; r++) {
      if (idx < panesSoFar + colsPerRow[r]) {
        rowForPane = r;
        colForPane = idx - panesSoFar;
        break;
      }
      panesSoFar += colsPerRow[r];
    }
    const defaultHandleSide = colForPane < colsPerRow[rowForPane] / 2 ? 'prawe' : 'lewe';
    return {
      type: pane?.type || 'rozwierne',
      handleSide: pane?.handleSide || defaultHandleSide,
      slideDirection: pane?.slideDirection,
      hasHandle: pane?.hasHandle,
      handleColor: pane?.handleColor
    };
  });

  const useShape = shape !== "rect";
  const glassShapeX = innerX + sashThickness;
  const glassShapeY = innerY + sashThickness;
  const glassShapeW = innerW - sashThickness * 2;
  const glassShapeH = innerH - sashThickness * 2;

  let paneIdx = 0;
  let currentY = innerY;
  for (let r = 0; r < rows; r++) {
    const paneH = rowHeights[r];
    const cols = colsPerRow[r];
    const colWidths = colWidthsPerRow[r];
    let currentX = innerX;
    
    for (let c = 0; c < cols; c++) {
      const paneW = colWidths[c];
      const paneSpec = paneSpecs[paneIdx];

      const glassX = currentX + sashThickness;
      const glassY = currentY + sashThickness;
      const glassW = paneW - sashThickness * 2;
      const glassH = paneH - sashThickness * 2;

      if (useShape) {
        glassClips.push(
          `<clipPath id="glass-clip-${paneIdx}" clipPathUnits="userSpaceOnUse"><rect x="${glassX}" y="${glassY}" width="${glassW}" height="${glassH}" /></clipPath>`
        );
      }
      panes.push(
        `<rect x="${currentX}" y="${currentY}" width="${paneW}" height="${paneH}" fill="#20c33b" stroke="#0c6b1a" stroke-width="2"/>`
      );

      if (useShape) {
        glass.push(
          `<g clip-path="url(#glass-clip-${paneIdx})">${shapeElement(shape, glassShapeX, glassShapeY, glassShapeW, glassShapeH, 'fill="#47dbff" stroke="#0c6b1a" stroke-width="1"')}</g>`
        );
      } else {
        glass.push(
          `<rect x="${glassX}" y="${glassY}" width="${glassW}" height="${glassH}" fill="#47dbff" stroke="#0c6b1a" stroke-width="1"/>`
        );
      }

      // Draw sash bars for this pane
      const sashBar = spec.sashBars?.[paneIdx];
      if (sashBar) {
        const paneWidthMm = colWidthsMmPerRow[r][c];
        const paneHeightMm = rowHeightsMm[r];
        
        // Vertical sash bars
        sashBar.vertical?.forEach(posMm => {
          const posX = glassX + (posMm / paneWidthMm) * glassW;
          sashBarsDrawing.push(
            `<rect x="${posX - sashThickness / 2}" y="${glassY}" width="${sashThickness}" height="${glassH}" fill="#20c33b" stroke="#0c6b1a" stroke-width="1"/>`
          );
        });
        
        // Horizontal sash bars
        sashBar.horizontal?.forEach(posMm => {
          const posY = glassY + (posMm / paneHeightMm) * glassH;
          sashBarsDrawing.push(
            `<rect x="${glassX}" y="${posY - sashThickness / 2}" width="${glassW}" height="${sashThickness}" fill="#20c33b" stroke="#0c6b1a" stroke-width="1"/>`
          );
        });
      }

      const markStroke = "#111";
      const markDash = "8 5";
      const markWidth = 1.4;
      const insetX = Math.max(6, Math.round(glassW * 0.06));
      const insetY = Math.max(6, Math.round(glassH * 0.06));

      if (paneSpec.type === 'fix') {
        const size = Math.min(glassW, glassH) * 0.7;
        const cx = glassX + glassW / 2;
        const cy = glassY + glassH / 2;
        const half = size / 2;
        openingMarks.push(
          `<line x1="${cx - half}" y1="${cy - half}" x2="${cx + half}" y2="${cy + half}" stroke="${markStroke}" stroke-width="${markWidth}" stroke-dasharray="${markDash}"/>`
        );
        openingMarks.push(
          `<line x1="${cx - half}" y1="${cy + half}" x2="${cx + half}" y2="${cy - half}" stroke="${markStroke}" stroke-width="${markWidth}" stroke-dasharray="${markDash}"/>`
        );
      } else if (paneSpec.type === 'uchylne') {
        // Only tilt mark (no side opening)
        const caretW = glassW;
        const caretCx = glassX + glassW / 2;
        const caretTop = glassY + insetY;
        const caretBottom = glassY + glassH - insetY;
        openingMarks.push(
          `<line x1="${caretCx - caretW / 2}" y1="${caretBottom}" x2="${caretCx}" y2="${caretTop}" stroke="${markStroke}" stroke-width="${markWidth}" stroke-dasharray="${markDash}"/>`
        );
        openingMarks.push(
          `<line x1="${caretCx + caretW / 2}" y1="${caretBottom}" x2="${caretCx}" y2="${caretTop}" stroke="${markStroke}" stroke-width="${markWidth}" stroke-dasharray="${markDash}"/>`
        );
      } else if (paneSpec.type === 'przesuwne') {
        // Sliding arrow --->
        const slideDir = paneSpec.slideDirection || 'prawe';
        const arrowY = glassY + glassH / 2;
        const arrowLength = glassW * 0.6;
        const arrowHeadSize = Math.min(12, glassW * 0.1);
        
        if (slideDir === 'prawe') {
          // Arrow pointing right --->
          const startX = glassX + (glassW - arrowLength) / 2;
          const endX = startX + arrowLength;
          openingMarks.push(
            `<line x1="${startX}" y1="${arrowY}" x2="${endX}" y2="${arrowY}" stroke="${markStroke}" stroke-width="${markWidth * 1.2}" stroke-dasharray="none"/>`
          );
          // Arrow head >
          openingMarks.push(
            `<line x1="${endX}" y1="${arrowY}" x2="${endX - arrowHeadSize}" y2="${arrowY - arrowHeadSize / 2}" stroke="${markStroke}" stroke-width="${markWidth * 1.2}"/>`
          );
          openingMarks.push(
            `<line x1="${endX}" y1="${arrowY}" x2="${endX - arrowHeadSize}" y2="${arrowY + arrowHeadSize / 2}" stroke="${markStroke}" stroke-width="${markWidth * 1.2}"/>`
          );
        } else {
          // Arrow pointing left <---
          const startX = glassX + glassW - (glassW - arrowLength) / 2;
          const endX = startX - arrowLength;
          openingMarks.push(
            `<line x1="${startX}" y1="${arrowY}" x2="${endX}" y2="${arrowY}" stroke="${markStroke}" stroke-width="${markWidth * 1.2}" stroke-dasharray="none"/>`
          );
          // Arrow head <
          openingMarks.push(
            `<line x1="${endX}" y1="${arrowY}" x2="${endX + arrowHeadSize}" y2="${arrowY - arrowHeadSize / 2}" stroke="${markStroke}" stroke-width="${markWidth * 1.2}"/>`
          );
          openingMarks.push(
            `<line x1="${endX}" y1="${arrowY}" x2="${endX + arrowHeadSize}" y2="${arrowY + arrowHeadSize / 2}" stroke="${markStroke}" stroke-width="${markWidth * 1.2}"/>`
          );
        }
      } else {
        // rozwierne or rozwierno-uchylne
        // Check if this pane is adjacent to a movable frame bar
        let forcedHandleSide: 'lewe' | 'prawe' | null = null;
        const movableBars = spec.frameBars?.movable || [];
        const handleSides = spec.frameBars?.movableHandleSide || [];
        
        // Calculate global bar index for this row
        let globalBarOffset = 0;
        for (let prevR = 0; prevR < r; prevR++) {
          globalBarOffset += (verticalPerRow[prevR] || []).length;
        }
        
        // Check if left border is a movable bar (local column index c-1)
        if (c > 0) {
          const globalBarIdx = globalBarOffset + (c - 1);
          if (movableBars.includes(globalBarIdx)) {
            forcedHandleSide = handleSides[globalBarIdx] === 'lewe' ? null : 'lewe';
          }
        }
        // Check if right border is a movable bar (local column index c)
        if (c < cols - 1) {
          const globalBarIdx = globalBarOffset + c;
          if (movableBars.includes(globalBarIdx)) {
            forcedHandleSide = handleSides[globalBarIdx] === 'prawe' ? null : 'prawe';
          }
        }
        
        const actualHandleSide = forcedHandleSide || paneSpec.handleSide || 'prawe';
        
        const tipX = actualHandleSide === 'prawe' ? glassX + glassW - insetX : glassX + insetX;
        const baseX = actualHandleSide === 'prawe' ? glassX + insetX : glassX + glassW - insetX;
        const tipY = glassY + glassH / 2;
        const topY = glassY + insetY;
        const bottomY = glassY + glassH - insetY;
        openingMarks.push(
          `<line x1="${baseX}" y1="${topY}" x2="${tipX}" y2="${tipY}" stroke="${markStroke}" stroke-width="${markWidth}" stroke-dasharray="${markDash}"/>`
        );
        openingMarks.push(
          `<line x1="${baseX}" y1="${bottomY}" x2="${tipX}" y2="${tipY}" stroke="${markStroke}" stroke-width="${markWidth}" stroke-dasharray="${markDash}"/>`
        );

        if (paneSpec.type === 'rozwierno-uchylne') {
          const caretW = glassW;
          const caretCx = glassX + glassW / 2;
          const caretTop = glassY + insetY;
          const caretBottom = glassY + glassH - insetY;
          openingMarks.push(
            `<line x1="${caretCx - caretW / 2}" y1="${caretBottom}" x2="${caretCx}" y2="${caretTop}" stroke="${markStroke}" stroke-width="${markWidth}" stroke-dasharray="${markDash}"/>`
          );
          openingMarks.push(
            `<line x1="${caretCx + caretW / 2}" y1="${caretBottom}" x2="${caretCx}" y2="${caretTop}" stroke="${markStroke}" stroke-width="${markWidth}" stroke-dasharray="${markDash}"/>`
          );
        }
      }

      // Handle rendering for non-fix types
      const shouldRenderHandle = paneSpec.type !== 'fix' && (paneSpec.hasHandle !== false);
      if (shouldRenderHandle) {
        // Check if this pane is adjacent to a movable frame bar
        let forcedHandleSide: 'lewe' | 'prawe' | null = null;
        const movableBars = spec.frameBars?.movable || [];
        const handleSides = spec.frameBars?.movableHandleSide || [];
        
        // Calculate global bar index for this row
        let globalBarOffset = 0;
        for (let prevR = 0; prevR < r; prevR++) {
          globalBarOffset += (verticalPerRow[prevR] || []).length;
        }
        
        // Check if left border is a movable bar (local column index c-1)
        if (c > 0) {
          const globalBarIdx = globalBarOffset + (c - 1);
          if (movableBars.includes(globalBarIdx)) {
            forcedHandleSide = handleSides[globalBarIdx] === 'lewe' ? null : 'lewe';
          }
        }
        // Check if right border is a movable bar (local column index c)
        if (c < cols - 1) {
          const globalBarIdx = globalBarOffset + c;
          if (movableBars.includes(globalBarIdx)) {
            forcedHandleSide = handleSides[globalBarIdx] === 'prawe' ? null : 'prawe';
          }
        }
        
        let actualHandleSide = forcedHandleSide || paneSpec.handleSide || 'prawe';
        
        // For przesuwne type, handle is on opposite side of slide direction
        if (paneSpec.type === 'przesuwne') {
          const slideDir = paneSpec.slideDirection || 'prawe';
          actualHandleSide = slideDir === 'prawe' ? 'lewe' : 'prawe';
        }
        
        const handleH = Math.round(paneH * 0.12);
        const handleW = Math.max(4, Math.round(handleH * 0.2));
        
        // For 'uchylne' type, place handle at the top center
        if (paneSpec.type === 'uchylne') {
          const handleX = currentX + paneW / 2 - handleW / 2;
          const handleY = glassY + 4;
          handles.push(`<rect x="${handleX}" y="${handleY}" width="${handleW}" height="${handleH}" rx="2" fill="#222"/>`);
        } else {
          // For rozwierne, rozwierno-uchylne, and przesuwne - place handle on the side
          const handleY = currentY + paneH / 2 - handleH / 2;
          const handleX = actualHandleSide === 'prawe'
            ? glassX + glassW - handleW - 4
            : glassX + 4;
          handles.push(`<rect x="${handleX}" y="${handleY}" width="${handleW}" height="${handleH}" rx="2" fill="#222"/>`);
        }
      }

      if (selectedPane === paneIdx) {
        if (useShape) {
          selection.push(
            `<g clip-path="url(#glass-clip-${paneIdx})">${shapeElement(shape, glassShapeX, glassShapeY, glassShapeW, glassShapeH, 'fill="none" stroke="#ff7a00" stroke-width="2"')}</g>`
          );
        } else {
          selection.push(
            `<rect x="${glassX - 2}" y="${glassY - 2}" width="${glassW + 4}" height="${glassH + 4}" fill="none" stroke="#ff7a00" stroke-width="2"/>`
          );
        }
      }
      if (interactive) {
        clickTargets.push(
          `<rect x="${currentX}" y="${currentY}" width="${paneW}" height="${paneH}" fill="transparent" data-pane="${paneIdx}" cursor="pointer"/>`
        );
      }

      paneIdx++;
      currentX += paneW;
    }
    currentY += paneH;
  }

  const dimColor = "#000";
  const dimOffset = 20;  // Increased from 18
  const dimTextSize = 14;  // Larger for better readability
  const topDimY = outerY - dimOffset;
  const bottomDimY = outerY + h + dimOffset;
  const leftDimX = outerX - dimOffset;
  const rightDimX = outerX + w + dimOffset;

  const dims: string[] = [];
  
  // Top dimension - total width
  dims.push(`<line x1="${outerX}" y1="${outerY}" x2="${outerX}" y2="${topDimY}" stroke="${dimColor}" stroke-width="1"/>`);
  dims.push(`<line x1="${outerX + w}" y1="${outerY}" x2="${outerX + w}" y2="${topDimY}" stroke="${dimColor}" stroke-width="1"/>`);
  dims.push(`<line x1="${outerX}" y1="${topDimY}" x2="${outerX + w}" y2="${topDimY}" stroke="${dimColor}" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`);
  dims.push(`<text x="${outerX + w / 2}" y="${topDimY - 4}" text-anchor="middle" font-family="Arial" font-size="${dimTextSize}" fill="${dimColor}">${Math.round(widthMm)} mm</text>`);

  // Left dimension - total height
  dims.push(`<line x1="${outerX}" y1="${outerY}" x2="${leftDimX}" y2="${outerY}" stroke="${dimColor}" stroke-width="1"/>`);
  dims.push(`<line x1="${outerX}" y1="${outerY + h}" x2="${leftDimX}" y2="${outerY + h}" stroke="${dimColor}" stroke-width="1"/>`);
  dims.push(`<line x1="${leftDimX}" y1="${outerY}" x2="${leftDimX}" y2="${outerY + h}" stroke="${dimColor}" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`);
  dims.push(`<text x="${leftDimX - 6}" y="${outerY + h / 2}" text-anchor="middle" font-family="Arial" font-size="${dimTextSize}" fill="${dimColor}" transform="rotate(-90 ${leftDimX - 6} ${outerY + h / 2})">${Math.round(heightMm)} mm</text>`);

  // Right dimension - total height
  dims.push(`<line x1="${outerX + w}" y1="${outerY}" x2="${rightDimX}" y2="${outerY}" stroke="${dimColor}" stroke-width="1"/>`);
  dims.push(`<line x1="${outerX + w}" y1="${outerY + h}" x2="${rightDimX}" y2="${outerY + h}" stroke="${dimColor}" stroke-width="1"/>`);
  dims.push(`<line x1="${rightDimX}" y1="${outerY}" x2="${rightDimX}" y2="${outerY + h}" stroke="${dimColor}" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`);
  dims.push(`<text x="${rightDimX + 6}" y="${outerY + h / 2}" text-anchor="middle" font-family="Arial" font-size="${dimTextSize}" fill="${dimColor}" transform="rotate(90 ${rightDimX + 6} ${outerY + h / 2})">${Math.round(heightMm)} mm</text>`);

  // Frame bar dimensions - show positions of vertical bars per row (from left and from right)
  const barDimColor = "#d00";
  const barDimTextSize = 9;  // Reduced from 10
  if (options?.showBarDimensions && verticalPerRow.some(arr => arr.length > 0)) {
    let barDimYOffset = 28;  // Increased from 24 for better spacing
    for (let r = 0; r < rows; r++) {
      const vertBarsInRow = verticalPerRow[r] || [];
      if (vertBarsInRow.length === 0) continue;
      
      // Calculate Y position for this row's dimensions
      let rowY = innerY;
      for (let i = 0; i < r; i++) {
        rowY += rowHeights[i];
      }
      const rowH = rowHeights[r];
      
      const barDimYTop = bottomDimY + barDimYOffset;
      const barDimYBottom = bottomDimY + barDimYOffset + 14;  // Increased from 12
      barDimYOffset += 28;  // Increased from 24
      
      for (let i = 0; i < vertBarsInRow.length; i++) {
        const barPosMm = vertBarsInRow[i];
        const barPosFromRight = widthMm - barPosMm;
        const barPosX = innerX + (barPosMm / widthMm) * innerW;
        
        // From left
        dims.push(`<line x1="${innerX}" y1="${barDimYTop}" x2="${barPosX}" y2="${barDimYTop}" stroke="${barDimColor}" stroke-width="1" marker-start="url(#arrow-red)" marker-end="url(#arrow-red)"/>`);
        dims.push(`<text x="${(innerX + barPosX) / 2}" y="${barDimYTop - 3}" text-anchor="middle" font-family="Arial" font-size="${barDimTextSize}" fill="${barDimColor}" data-dim-type="frame-bar-v-left" data-dim-index="${r},${i}">←${Math.round(barPosMm)} (R${r+1})</text>`);
        
        // From right
        dims.push(`<line x1="${barPosX}" y1="${barDimYBottom}" x2="${innerX + innerW}" y2="${barDimYBottom}" stroke="${barDimColor}" stroke-width="1" marker-start="url(#arrow-red)" marker-end="url(#arrow-red)"/>`);
        dims.push(`<text x="${(barPosX + innerX + innerW) / 2}" y="${barDimYBottom - 3}" text-anchor="middle" font-family="Arial" font-size="${barDimTextSize}" fill="${barDimColor}" data-dim-type="frame-bar-v-right" data-dim-index="${r},${i}">${Math.round(barPosFromRight)}→ (R${r+1})</text>`);
      }
    }
  }

  // Frame bar dimensions - show positions of horizontal bars (from top and from bottom)
  if (options?.showBarDimensions && horizontalFrameBars.length > 0) {
    const barDimXLeft = rightDimX + 16;  // Increased from 12
    const barDimXRight = rightDimX + 30;  // Increased from 24
    for (let i = 0; i < horizontalFrameBars.length; i++) {
      const barPosMm = horizontalFrameBars[i];
      const barPosFromBottom = heightMm - barPosMm;
      const barPosY = innerY + (barPosMm / heightMm) * innerH;
      
      // From top
      dims.push(`<line x1="${barDimXLeft}" y1="${innerY}" x2="${barDimXLeft}" y2="${barPosY}" stroke="${barDimColor}" stroke-width="1" marker-start="url(#arrow-red)" marker-end="url(#arrow-red)"/>`);
      dims.push(`<text x="${barDimXLeft + 6}" y="${(innerY + barPosY) / 2}" text-anchor="middle" font-family="Arial" font-size="${barDimTextSize}" fill="${barDimColor}" transform="rotate(90 ${barDimXLeft + 6} ${(innerY + barPosY) / 2})" data-dim-type="frame-bar-h-top" data-dim-index="${i}">↑${Math.round(barPosMm)}</text>`);
      
      // From bottom
      dims.push(`<line x1="${barDimXRight}" y1="${barPosY}" x2="${barDimXRight}" y2="${innerY + innerH}" stroke="${barDimColor}" stroke-width="1" marker-start="url(#arrow-red)" marker-end="url(#arrow-red)"/>`);
      dims.push(`<text x="${barDimXRight + 6}" y="${(barPosY + innerY + innerH) / 2}" text-anchor="middle" font-family="Arial" font-size="${barDimTextSize}" fill="${barDimColor}" transform="rotate(90 ${barDimXRight + 6} ${(barPosY + innerY + innerH) / 2})" data-dim-type="frame-bar-h-bottom" data-dim-index="${i}">${Math.round(barPosFromBottom)}↓</text>`);
    }
  }

  // Sash bar dimensions for selected pane (placed outside the window)
  if (options?.showBarDimensions && selectedPane >= 0 && selectedPane < totalPanes) {
    const sashBar = spec.sashBars?.[selectedPane];
    if (sashBar) {
      // Find which row and col the selected pane is in
      let panesSoFar = 0;
      let rowForPane = 0;
      let colForPane = 0;
      for (let r = 0; r < rows; r++) {
        if (selectedPane < panesSoFar + colsPerRow[r]) {
          rowForPane = r;
          colForPane = selectedPane - panesSoFar;
          break;
        }
        panesSoFar += colsPerRow[r];
      }
      
      // Find pane position and size
      let paneX = innerX;
      const colWidths = colWidthsPerRow[rowForPane];
      for (let c = 0; c < colForPane; c++) {
        paneX += colWidths[c];
      }
      let paneY = innerY;
      for (let r = 0; r < rowForPane; r++) {
        paneY += rowHeights[r];
      }
      const paneW = colWidths[colForPane];
      const paneH = rowHeights[rowForPane];
      const paneWidthMm = colWidthsMmPerRow[rowForPane][colForPane];
      const paneHeightMm = rowHeightsMm[rowForPane];
      
      const glassX = paneX + sashThickness;
      const glassY = paneY + sashThickness;
      const glassW = paneW - sashThickness * 2;
      const glassH = paneH - sashThickness * 2;
      
      // Vertical sash bars (below pane, outside window) - calculate dynamic offset
      if (sashBar.vertical && sashBar.vertical.length > 0) {
        // Calculate total vertical offset needed for all frame bars
        let totalFrameBarOffset = 0;
        for (let r = 0; r < rows; r++) {
          const vertBarsInRow = verticalPerRow[r] || [];
          if (vertBarsInRow.length > 0) {
            totalFrameBarOffset += 28; // 28px per row with bars
          }
        }
        
        const sashBarDimYTop = bottomDimY + totalFrameBarOffset + 8;
        const sashBarDimYBottom = bottomDimY + totalFrameBarOffset + 22;
        for (let i = 0; i < sashBar.vertical.length; i++) {
          const barPosMm = sashBar.vertical[i];
          const barPosFromRight = paneWidthMm - barPosMm;
          const barPosX = glassX + (barPosMm / paneWidthMm) * glassW;
          
          // From left
          dims.push(`<line x1="${glassX}" y1="${sashBarDimYTop}" x2="${barPosX}" y2="${sashBarDimYTop}" stroke="#00a" stroke-width="1" marker-start="url(#arrow-blue)" marker-end="url(#arrow-blue)"/>`);
          dims.push(`<text x="${(glassX + barPosX) / 2}" y="${sashBarDimYTop - 2}" text-anchor="middle" font-family="Arial" font-size="${barDimTextSize}" fill="#00a" data-dim-type="sash-bar-v-left" data-dim-index="${i}">←${Math.round(barPosMm)}</text>`);
          
          // From right
          dims.push(`<line x1="${barPosX}" y1="${sashBarDimYBottom}" x2="${glassX + glassW}" y2="${sashBarDimYBottom}" stroke="#00a" stroke-width="1" marker-start="url(#arrow-blue)" marker-end="url(#arrow-blue)"/>`);
          dims.push(`<text x="${(barPosX + glassX + glassW) / 2}" y="${sashBarDimYBottom - 2}" text-anchor="middle" font-family="Arial" font-size="${barDimTextSize}" fill="#00a" data-dim-type="sash-bar-v-right" data-dim-index="${i}">${Math.round(barPosFromRight)}→</text>`);
        }
      }
      
      // Horizontal sash bars (to the right of pane, outside window) - far right
      if (sashBar.horizontal && sashBar.horizontal.length > 0) {
        const sashBarDimXLeft = rightDimX + 48;  // Far to the right, after horizontal frame bars
        const sashBarDimXRight = rightDimX + 62;
        for (let i = 0; i < sashBar.horizontal.length; i++) {
          const barPosMm = sashBar.horizontal[i];
          const barPosFromBottom = paneHeightMm - barPosMm;
          const barPosY = glassY + (barPosMm / paneHeightMm) * glassH;
          
          // From top
          dims.push(`<line x1="${sashBarDimXLeft}" y1="${glassY}" x2="${sashBarDimXLeft}" y2="${barPosY}" stroke="#00a" stroke-width="1" marker-start="url(#arrow-blue)" marker-end="url(#arrow-blue)"/>`);
          dims.push(`<text x="${sashBarDimXLeft + 5}" y="${(glassY + barPosY) / 2}" text-anchor="middle" font-family="Arial" font-size="${barDimTextSize}" fill="#00a" transform="rotate(90 ${sashBarDimXLeft + 5} ${(glassY + barPosY) / 2})" data-dim-type="sash-bar-h-top" data-dim-index="${i}">↑${Math.round(barPosMm)}</text>`);
          
          // From bottom
          dims.push(`<line x1="${sashBarDimXRight}" y1="${barPosY}" x2="${sashBarDimXRight}" y2="${glassY + glassH}" stroke="#00a" stroke-width="1" marker-start="url(#arrow-blue)" marker-end="url(#arrow-blue)"/>`);
          dims.push(`<text x="${sashBarDimXRight + 5}" y="${(barPosY + glassY + glassH) / 2}" text-anchor="middle" font-family="Arial" font-size="${barDimTextSize}" fill="#00a" transform="rotate(90 ${sashBarDimXRight + 5} ${(barPosY + glassY + glassH) / 2})" data-dim-type="sash-bar-h-bottom" data-dim-index="${i}">${Math.round(barPosFromBottom)}↓</text>`);
        }
      }
    }
  }

  // Calculate dynamic SVG size based on content
  let extraWidth = 70;  // Base extra for basic dimensions
  let extraHeight = 40;  // Base extra for basic dimensions
  
  if (options?.showBarDimensions) {
    // Add space for horizontal frame bars
    if (horizontalFrameBars.length > 0) {
      extraWidth += 70;  // Space for horizontal bar dimensions on right
    }
    
    // Add space for vertical frame bars (per row)
    let verticalBarRows = 0;
    for (let r = 0; r < rows; r++) {
      const vertBarsInRow = verticalPerRow[r] || [];
      if (vertBarsInRow.length > 0) {
        verticalBarRows++;
      }
    }
    extraHeight += verticalBarRows * 28;  // 28px per row with vertical bars
    
    // Add space for sash bars if selected pane has them
    if (selectedPane >= 0 && selectedPane < totalPanes) {
      const sashBar = spec.sashBars?.[selectedPane];
      if (sashBar?.vertical && sashBar.vertical.length > 0) {
        extraHeight += 40;  // Space for sash bar dimensions below
      }
      if (sashBar?.horizontal && sashBar.horizontal.length > 0) {
        extraWidth += 70;  // Additional space for horizontal sash bars on far right
      }
    }
  }

  const svgW = w + margin * 2 + extraWidth;
  const svgH = h + margin * 2 + extraHeight;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet" style="width:100%; height:auto; max-width:${svgW}px; display:block;">
  <defs>
    <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
      <path d="M0,0 L6,3 L0,6 Z" fill="${dimColor}" />
    </marker>
    <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
      <path d="M0,0 L6,3 L0,6 Z" fill="${barDimColor}" />
    </marker>
    <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
      <path d="M0,0 L6,3 L0,6 Z" fill="#00a" />
    </marker>
    <clipPath id="shape-clip" clipPathUnits="userSpaceOnUse">
      ${shapeElement(shape, innerX, innerY, innerW, innerH, 'fill="white"')}
    </clipPath>
    ${glassClips.join("\n")}
  </defs>
  ${shapeElement(shape, outerX, outerY, w, h, 'fill="#21b533" stroke="#1c2fb3" stroke-width="3"')}
  <g clip-path="url(#shape-clip)">
    ${panes.join("\n")}
    ${glass.join("\n")}
    ${sashBarsDrawing.join("\n")}
    ${openingMarks.join("\n")}
    ${handles.join("\n")}
    ${selection.join("\n")}
  </g>
  ${clickTargets.join("\n")}
  ${dims.join("\n")}
</svg>`.trim();
}

export default function WindowPreview({
  spec,
  lang,
  selectedPane,
  onSelectPane,
  onDimensionChange,
  onBarPositionChange
}: {
  spec: WindowSpec;
  lang: Lang;
  selectedPane?: number;
  onSelectPane?: (idx: number) => void;
  onDimensionChange?: (dimension: 'width' | 'height', value: number) => void;
  onBarPositionChange?: (type: 'frame-v' | 'frame-h' | 'sash-v' | 'sash-h', index: number | string, position: number) => void;
}) {
  const [editingDimension, setEditingDimension] = React.useState<'width' | 'height' | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const [editingBar, setEditingBar] = React.useState<{ type: string; index: number | string } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const svg = renderWindowSvg(spec, { 
    selectedPane, 
    interactive: Boolean(onSelectPane),
    showBarDimensions: Boolean(onBarPositionChange)
  });

  React.useEffect(() => {
    if (editingDimension || editingBar) {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setEditingDimension(null);
          setEditingBar(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editingDimension, editingBar]);

  const handleDimensionClick = (dimension: 'width' | 'height', currentValue: number, event: React.MouseEvent) => {
    if (!onDimensionChange) return;
    event.stopPropagation();
    setEditingDimension(dimension);
    setEditValue(String(currentValue));
  };

  const handleDimensionSubmit = () => {
    if (!onDimensionChange || !editingDimension) return;
    const value = parseInt(editValue, 10);
    if (!isNaN(value) && value > 0) {
      onDimensionChange(editingDimension, value);
    }
    setEditingDimension(null);
  };

  const handleBarClick = (event: React.MouseEvent) => {
    if (!onBarPositionChange) return;
    const target = event.target as Element;
    const dimType = target.getAttribute('data-dim-type');
    const dimIndex = target.getAttribute('data-dim-index');
    
    if (!dimType || dimIndex === null) return;
    
    event.stopPropagation();
    
    // Calculate grid structure for finding pane dimensions
    const horizontalFrameBars = spec.frameBars?.horizontal || [];
    const verticalPerRow = spec.frameBars?.verticalPerRow || [];
    const rows = horizontalFrameBars.length + 1;
    
    const colsPerRow: number[] = [];
    for (let r = 0; r < rows; r++) {
      const vertBarsInRow = verticalPerRow[r] || [];
      const cols = vertBarsInRow.length + 1;
      colsPerRow.push(cols);
    }
    
    // Calculate row heights in mm
    const rowHeightsMm: number[] = [];
    let prevY = 0;
    for (let i = 0; i < rows; i++) {
      const nextY = i < horizontalFrameBars.length ? horizontalFrameBars[i] : spec.height;
      rowHeightsMm.push(nextY - prevY);
      prevY = nextY;
    }
    
    // Calculate column widths per row in mm
    const colWidthsMmPerRow: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const vertBarsInRow = verticalPerRow[r] || [];
      const cols = vertBarsInRow.length + 1;
      const widthsMm: number[] = [];
      let prevX = 0;
      for (let i = 0; i < cols; i++) {
        const nextX = i < vertBarsInRow.length ? vertBarsInRow[i] : spec.width;
        widthsMm.push(nextX - prevX);
        prevX = nextX;
      }
      colWidthsMmPerRow.push(widthsMm);
    }
    
    let currentValue = 0;
    // Frame bars - vertical (now per-row)
    if (dimType === 'frame-bar-v-left') {
      const [rowStr, idxStr] = dimIndex.split(',');
      const row = parseInt(rowStr, 10);
      const idx = parseInt(idxStr, 10);
      if (isNaN(row) || isNaN(idx)) return;
      currentValue = spec.frameBars?.verticalPerRow?.[row]?.[idx] || 0;
    } else if (dimType === 'frame-bar-v-right') {
      const [rowStr, idxStr] = dimIndex.split(',');
      const row = parseInt(rowStr, 10);
      const idx = parseInt(idxStr, 10);
      if (isNaN(row) || isNaN(idx)) return;
      const barPos = spec.frameBars?.verticalPerRow?.[row]?.[idx] || 0;
      currentValue = spec.width - barPos;
    }
    // Frame bars - horizontal
    else if (dimType === 'frame-bar-h-top') {
      const index = parseInt(dimIndex, 10);
      if (isNaN(index)) return;
      currentValue = spec.frameBars?.horizontal?.[index] || 0;
    } else if (dimType === 'frame-bar-h-bottom') {
      const index = parseInt(dimIndex, 10);
      if (isNaN(index)) return;
      const barPos = spec.frameBars?.horizontal?.[index] || 0;
      currentValue = spec.height - barPos;
    }
    // Sash bars - vertical
    else if (dimType === 'sash-bar-v-left' && selectedPane !== undefined) {
      const index = parseInt(dimIndex, 10);
      if (isNaN(index)) return;
      currentValue = spec.sashBars?.[selectedPane]?.vertical?.[index] || 0;
    } else if (dimType === 'sash-bar-v-right' && selectedPane !== undefined) {
      const index = parseInt(dimIndex, 10);
      if (isNaN(index)) return;
      
      // Find pane width
      let panesSoFar = 0;
      let rowForPane = 0;
      let colForPane = 0;
      for (let r = 0; r < rows; r++) {
        if (selectedPane < panesSoFar + colsPerRow[r]) {
          rowForPane = r;
          colForPane = selectedPane - panesSoFar;
          break;
        }
        panesSoFar += colsPerRow[r];
      }
      const paneWidthMm = colWidthsMmPerRow[rowForPane][colForPane];
      const barPos = spec.sashBars?.[selectedPane]?.vertical?.[index] || 0;
      currentValue = paneWidthMm - barPos;
    }
    // Sash bars - horizontal
    else if (dimType === 'sash-bar-h-top' && selectedPane !== undefined) {
      const index = parseInt(dimIndex, 10);
      if (isNaN(index)) return;
      currentValue = spec.sashBars?.[selectedPane]?.horizontal?.[index] || 0;
    } else if (dimType === 'sash-bar-h-bottom' && selectedPane !== undefined) {
      const index = parseInt(dimIndex, 10);
      if (isNaN(index)) return;
      
      // Find pane height
      let panesSoFar = 0;
      let rowForPane = 0;
      for (let r = 0; r < rows; r++) {
        if (selectedPane < panesSoFar + colsPerRow[r]) {
          rowForPane = r;
          break;
        }
        panesSoFar += colsPerRow[r];
      }
      const paneHeightMm = rowHeightsMm[rowForPane];
      const barPos = spec.sashBars?.[selectedPane]?.horizontal?.[index] || 0;
      currentValue = paneHeightMm - barPos;
    }
    
    setEditingBar({ type: dimType, index: dimIndex });
    setEditValue(String(Math.round(currentValue)));
  };

  const handleBarSubmit = () => {
    if (!onBarPositionChange || !editingBar) return;
    const value = parseInt(editValue, 10);
    if (!isNaN(value) && value > 0) {
      const { type, index } = editingBar;
      
      // Calculate grid structure for finding pane dimensions (same as handleBarClick)
      const horizontalFrameBars = spec.frameBars?.horizontal || [];
      const verticalPerRow = spec.frameBars?.verticalPerRow || [];
      const rows = horizontalFrameBars.length + 1;
      
      const colsPerRow: number[] = [];
      for (let r = 0; r < rows; r++) {
        const vertBarsInRow = verticalPerRow[r] || [];
        const cols = vertBarsInRow.length + 1;
        colsPerRow.push(cols);
      }
      
      // Calculate row heights in mm
      const rowHeightsMm: number[] = [];
      let prevY = 0;
      for (let i = 0; i < rows; i++) {
        const nextY = i < horizontalFrameBars.length ? horizontalFrameBars[i] : spec.height;
        rowHeightsMm.push(nextY - prevY);
        prevY = nextY;
      }
      
      // Calculate column widths per row in mm
      const colWidthsMmPerRow: number[][] = [];
      for (let r = 0; r < rows; r++) {
        const vertBarsInRow = verticalPerRow[r] || [];
        const cols = vertBarsInRow.length + 1;
        const widthsMm: number[] = [];
        let prevX = 0;
        for (let i = 0; i < cols; i++) {
          const nextX = i < vertBarsInRow.length ? vertBarsInRow[i] : spec.width;
          widthsMm.push(nextX - prevX);
          prevX = nextX;
        }
        colWidthsMmPerRow.push(widthsMm);
      }
      
      // Convert from-right/from-bottom to from-left/from-top
      let actualPosition = value;
      
      if (type === 'frame-bar-v-left' || type === 'frame-bar-v-right') {
        if (type === 'frame-bar-v-right') {
          actualPosition = spec.width - value;
        }
        // index is already in "row,idx" format - pass as-is
        onBarPositionChange('frame-v', index, actualPosition);
      } else if (type === 'frame-bar-h-top' || type === 'frame-bar-h-bottom') {
        if (type === 'frame-bar-h-bottom') {
          actualPosition = spec.height - value;
        }
        // Convert string index to number for horizontal bars
        const numIndex = typeof index === 'string' ? parseInt(index, 10) : index;
        onBarPositionChange('frame-h', numIndex, actualPosition);
      } else if (type === 'sash-bar-v-left' || type === 'sash-bar-v-right') {
        if (type === 'sash-bar-v-right' && selectedPane !== undefined) {
          // Find pane width
          let panesSoFar = 0;
          let rowForPane = 0;
          let colForPane = 0;
          for (let r = 0; r < rows; r++) {
            if (selectedPane < panesSoFar + colsPerRow[r]) {
              rowForPane = r;
              colForPane = selectedPane - panesSoFar;
              break;
            }
            panesSoFar += colsPerRow[r];
          }
          const paneWidthMm = colWidthsMmPerRow[rowForPane][colForPane];
          actualPosition = paneWidthMm - value;
        }
        // Convert string index to number for sash bars
        const numIndex = typeof index === 'string' ? parseInt(index, 10) : index;
        onBarPositionChange('sash-v', numIndex, actualPosition);
      } else if (type === 'sash-bar-h-top' || type === 'sash-bar-h-bottom') {
        if (type === 'sash-bar-h-bottom' && selectedPane !== undefined) {
          // Find pane height
          let panesSoFar = 0;
          let rowForPane = 0;
          for (let r = 0; r < rows; r++) {
            if (selectedPane < panesSoFar + colsPerRow[r]) {
              rowForPane = r;
              break;
            }
            panesSoFar += colsPerRow[r];
          }
          const paneHeightMm = rowHeightsMm[rowForPane];
          actualPosition = paneHeightMm - value;
        }
        // Convert string index to number for sash bars
        const numIndex = typeof index === 'string' ? parseInt(index, 10) : index;
        onBarPositionChange('sash-h', numIndex, actualPosition);
      }
    }
    setEditingBar(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingDimension) handleDimensionSubmit();
      if (editingBar) handleBarSubmit();
    } else if (e.key === 'Escape') {
      setEditingDimension(null);
      setEditingBar(null);
    }
  };

  const barIndexLabel = editingBar
    ? (typeof editingBar.index === "number" ? editingBar.index + 1 : editingBar.index)
    : "";

  const formatLabel = (template: string, vars: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`w-full rounded-xl border bg-white p-2 overflow-hidden ${onSelectPane ? "cursor-pointer" : ""}`}
        onClick={(event) => {
          if (!onSelectPane) return;
          const target = event.target as Element | null;
          if (!target) return;
          
          // Check if clicked on bar dimension
          if (target.getAttribute('data-dim-type')?.includes('bar')) {
            handleBarClick(event);
            return;
          }
          
          const paneEl = target.closest("[data-pane]");
          if (!paneEl) return;
          const idx = Number(paneEl.getAttribute("data-pane"));
          if (!Number.isNaN(idx)) onSelectPane(idx);
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {onDimensionChange && (
        <>
          {/* Width dimension click area */}
          <div
            className="absolute cursor-pointer hover:bg-yellow-200 hover:bg-opacity-30 transition-colors"
            style={{
              left: '40px',
              top: '4px',
              width: 'calc(100% - 80px)',
              height: '30px'
            }}
            onClick={(e) => handleDimensionClick('width', spec.width, e)}
            title={t(lang, "edit_dimension_width_title")}
          />
          {/* Height dimension click areas (left and right) */}
          <div
            className="absolute cursor-pointer hover:bg-yellow-200 hover:bg-opacity-30 transition-colors"
            style={{
              left: '4px',
              top: '40px',
              width: '30px',
              height: 'calc(100% - 80px)'
            }}
            onClick={(e) => handleDimensionClick('height', spec.height, e)}
            title={t(lang, "edit_dimension_height_title")}
          />
          <div
            className="absolute cursor-pointer hover:bg-yellow-200 hover:bg-opacity-30 transition-colors"
            style={{
              right: '4px',
              top: '40px',
              width: '30px',
              height: 'calc(100% - 80px)'
            }}
            onClick={(e) => handleDimensionClick('height', spec.height, e)}
            title={t(lang, "edit_dimension_height_title")}
          />
        </>
      )}
      {(editingDimension || editingBar) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-xl">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <label className="block mb-2 font-semibold">
              {editingDimension 
                ? (editingDimension === 'width' ? t(lang, "edit_dimension_width_label") : t(lang, "edit_dimension_height_label"))
                : editingBar?.type === 'frame-bar-v' ? formatLabel(t(lang, "edit_bar_frame_v_label"), { index: barIndexLabel })
                : editingBar?.type === 'frame-bar-h' ? formatLabel(t(lang, "edit_bar_frame_h_label"), { index: barIndexLabel })
                : editingBar?.type === 'sash-bar-v' ? formatLabel(t(lang, "edit_bar_sash_v_label"), { index: barIndexLabel })
                : formatLabel(t(lang, "edit_bar_sash_h_label"), { index: barIndexLabel })
              }
            </label>
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border rounded px-3 py-2 w-40 mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (editingDimension) handleDimensionSubmit();
                  if (editingBar) handleBarSubmit();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {t(lang, "ok") || "OK"}
              </button>
              <button
                onClick={() => {
                  setEditingDimension(null);
                  setEditingBar(null);
                }}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                {t(lang, "cancel") || "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

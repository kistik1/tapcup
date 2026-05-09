import { useRef, useCallback, useEffect } from "react";
import CoffeeCupSvg from "./CoffeeCupSvg";
import { LAYER_DEFS, LAYER_ORDER, VESSEL_DEFS, SIZE_DEFS } from "./cup-constants.jsx";

const CX = 100;

/**
 * Interactive drag editor wrapping CoffeeCupSvg.
 * Adds draggable dividers and ±5% layer controls on top of the static cup.
 */
export default function CupDragEditor({ layers, setLayers, vessel = "mug", size = "large", temp, clipId }) {
  const svgRef  = useRef(null);
  const dragging = useRef(null);

  const vesselDef = VESSEL_DEFS.find(v => v.value === vessel) || VESSEL_DEFS[0];
  const sizeDef   = SIZE_DEFS.find(s => s.value === size)     || SIZE_DEFS[1];
  const TOP_W = vesselDef.topW;
  const BOT_W = vesselDef.botW;
  const cupH  = sizeDef.cupH;

  function xAtY(y) {
    const t = 1 - y / cupH;
    return BOT_W / 2 + (TOP_W / 2 - BOT_W / 2) * t;
  }

  // Build stacked layers and compute divider positions
  const stacked = (() => {
    let cum = 0;
    return LAYER_ORDER.map(key => {
      const startPct = cum;
      cum += layers[key] || 0;
      return { key, pct: layers[key] || 0, startPct };
    });
  })();

  const dividers = stacked.slice(0, -1).map(({ key, startPct, pct }) => {
    const cum = startPct + pct;
    if (cum <= 0 || cum >= 100) return null;
    const y  = cupH - (cum / 100) * cupH;
    const xH = xAtY(y);
    return { key, y, x1: CX - xH, x2: CX + xH, cumPct: cum };
  }).filter(Boolean);

  const onDividerDown = useCallback((e, key) => {
    e.preventDefault();
    dragging.current = key;
  }, []);

  const onMove = useCallback((e) => {
    if (!dragging.current || !svgRef.current) return;
    const rect    = svgRef.current.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    // Map from screen coords to viewBox coords (viewBox is 200px wide, cupH tall)
    const scaleY  = cupH / rect.height;
    const svgY    = (clientY - rect.top) * scaleY;
    const newCum  = Math.round(((cupH - svgY) / cupH) * 100);
    const key     = dragging.current;
    const idx     = LAYER_ORDER.indexOf(key);
    const nextKey = LAYER_ORDER[idx + 1];
    if (!nextKey) return;
    if (key === "coffee") return; // coffee amount is locked

    setLayers(prev => {
      let cumBelow = 0;
      for (let i = 0; i <= idx; i++) cumBelow += prev[LAYER_ORDER[i]] || 0;
      const delta      = newCum - cumBelow;
      const newCurrent = Math.max(0, (prev[key] || 0) + delta);
      const newNext    = Math.max(0, (prev[nextKey] || 0) - delta);
      if (newCurrent + newNext > (prev[key] || 0) + (prev[nextKey] || 0) + 0.5) return prev;
      return { ...prev, [key]: Math.round(newCurrent), [nextKey]: Math.round(newNext) };
    });
  }, [setLayers, cupH]);

  const onUp = useCallback(() => { dragging.current = null; }, []);

  useEffect(() => {
    window.addEventListener("mousemove",  onMove);
    window.addEventListener("mouseup",    onUp);
    window.addEventListener("touchmove",  onMove, { passive: false });
    window.addEventListener("touchend",   onUp);
    return () => {
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("mouseup",    onUp);
      window.removeEventListener("touchmove",  onMove);
      window.removeEventListener("touchend",   onUp);
    };
  }, [onMove, onUp]);

  function adjust(layerKey, delta) {
    setLayers(prev => {
      const idx   = LAYER_ORDER.indexOf(layerKey);
      const candidates = LAYER_ORDER.filter((_, i) => i !== idx);
      let donor = null;
      if (delta > 0) {
        for (let i = candidates.length - 1; i >= 0; i--) {
          if ((prev[candidates[i]] || 0) >= delta) { donor = candidates[i]; break; }
        }
      } else {
        if ((prev[layerKey] || 0) + delta < 0) return prev;
        donor = candidates[candidates.length - 1];
      }
      if (!donor) return prev;
      const newVal   = Math.max(0, (prev[layerKey] || 0) + delta);
      const realDelta = newVal - (prev[layerKey] || 0);
      return { ...prev, [layerKey]: newVal, [donor]: Math.max(0, (prev[donor] || 0) - realDelta) };
    });
  }

  // The dividers are drawn as an SVG overlay on top of CoffeeCupSvg
  const svgW = 200;
  const svgH = cupH + 20;
  const displayW = 200;

  return (
    <div className="flex flex-col items-center">
      <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
        Drag lines to adjust amounts
      </p>
      <div className="relative" style={{ width: displayW, height: svgH }}>
        {/* Static cup rendering */}
        <CoffeeCupSvg
          layers={layers} vessel={vessel} size={size} temp={temp}
          width={displayW} showLabels={true}
          clipId={clipId || "cup-drag-clip"}
        />

        {/* Drag overlay — same viewBox as CoffeeCupSvg */}
        <svg
          ref={svgRef}
          width={displayW} height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ position: "absolute", top: 0, left: 0, touchAction: "none" }}
        >
          {dividers.map(({ key, y, x1, x2 }) => {
            const ld  = LAYER_DEFS.find(l => l.key === key);
            const midX = (x1 + x2) / 2;
            return (
              <g key={key}>
                {/* Wide invisible touch/click area */}
                <line x1={x1 - 10} y1={y} x2={x2 + 10} y2={y}
                  stroke="transparent" strokeWidth={32} style={{ cursor: "ns-resize" }}
                  onMouseDown={e => onDividerDown(e, key)}
                  onTouchStart={e => onDividerDown(e, key)}
                />
                {/* Visible divider line */}
                <line x1={x1} y1={y} x2={x2} y2={y}
                  stroke="white" strokeWidth={2.5} strokeOpacity={0.85}
                  style={{ pointerEvents: "none" }}
                />
                {/* Center drag pill */}
                <rect x={midX - 18} y={y - 9} width={36} height={18} rx={9}
                  fill={ld.dark} style={{ pointerEvents: "none" }} />
                <text x={midX} y={y + 4.5}
                  textAnchor="middle" fontSize={10} fill="white" fontWeight="700"
                  style={{ pointerEvents: "none", userSelect: "none" }}>
                  ⇅
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ±5% layer controls */}
      <div className="w-full mt-3 space-y-1.5" style={{ maxWidth: displayW }}>
        {LAYER_DEFS.map(ld => {
          const pct = layers[ld.key] || 0;
          const locked = ld.key === "coffee";
          return (
            <div key={ld.key} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: ld.color, border: `1.5px solid ${ld.dark}` }} />
              <span className="text-[11px] text-muted-foreground w-10 font-medium">{ld.label}</span>
              <div className="flex items-center gap-1 flex-1">
                <button type="button" onClick={() => adjust(ld.key, -5)} disabled={locked}
                  className="w-6 h-6 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted text-xs font-bold leading-none flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">
                  −
                </button>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ld.dark }} />
                </div>
                <button type="button" onClick={() => adjust(ld.key, 5)} disabled={locked}
                  className="w-6 h-6 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted text-xs font-bold leading-none flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">
                  +
                </button>
                <span className="text-[11px] font-mono text-muted-foreground w-7 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

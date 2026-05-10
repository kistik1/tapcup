import { useState, useRef, useEffect, useCallback } from "react";
import CoffeeCupSvg from "./CoffeeCupSvg";
import { LAYER_DEFS, LAYER_ORDER, MILK_TYPES } from "./cup-constants";

const MIN_DRAG = 5; // minimum % when dragging handles

// Scale all layers so they sum exactly to 100
function normalize(raw) {
  const vals = LAYER_ORDER.map(k => Math.max(0, raw[k] || 0));
  const total = vals.reduce((s, v) => s + v, 0);
  if (total === 0) return { coffee: 50, water: 0, milk: 30, foam: 20 };
  let result = {};
  LAYER_ORDER.forEach((k, i) => { result[k] = Math.round(vals[i] * 100 / total); });
  // Fix integer rounding drift
  const diff = 100 - LAYER_ORDER.reduce((s, k) => s + result[k], 0);
  if (diff !== 0) {
    const anchor = LAYER_ORDER.reduce((a, b) => result[a] >= result[b] ? a : b);
    result[anchor] = Math.max(0, result[anchor] + diff);
  }
  return result;
}

export default function LayerComposer({
  layers,
  onChange,
  vessel = "mug",
  size = "large",
  temp = "Hot",
  milk = "None",
  onMilkChange,
}) {
  const [selected, setSelected] = useState(null);
  const stripRef = useRef(null);
  const drag = useRef(null);
  const layersRef = useRef(layers);
  useEffect(() => { layersRef.current = layers; });

  // Normalize on mount if existing data doesn't sum to 100
  useEffect(() => {
    const total = LAYER_ORDER.reduce((s, k) => s + (layers[k] || 0), 0);
    if (Math.abs(total - 100) > 1) onChange(normalize(layers));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build cumulative left positions for rendering
  const segments = LAYER_ORDER.reduce((acc, key, i) => {
    const left = i === 0 ? 0 : acc[i - 1].right;
    const pct = Math.max(0, layers[key] || 0);
    acc.push({ key, pct, left, right: left + pct });
    return acc;
  }, []);

  // ── Drag handle logic (pointer capture, no SVG) ──────────────────────
  const onHandlePointerDown = useCallback((e, i) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = {
      index: i,
      startX: e.clientX,
      startLeft: segments[i].pct,
      startRight: segments[i + 1].pct,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [segments]);

  const onHandlePointerMove = useCallback((e) => {
    if (!drag.current || !stripRef.current) return;
    const { index, startX, startLeft, startRight } = drag.current;
    const stripW = stripRef.current.getBoundingClientRect().width;
    const deltaPct = ((e.clientX - startX) / stripW) * 100;
    const combined = startLeft + startRight;
    const newLeft = Math.max(MIN_DRAG, Math.min(combined - MIN_DRAG, Math.round(startLeft + deltaPct)));
    const newRight = combined - newLeft;
    const leftKey = LAYER_ORDER[index];
    const rightKey = LAYER_ORDER[index + 1];
    onChange({ ...layersRef.current, [leftKey]: newLeft, [rightKey]: newRight });
  }, [onChange]);

  const onHandlePointerUp = useCallback(() => {
    if (!drag.current) return;
    drag.current = null;
    onChange(normalize(layersRef.current));
  }, [onChange]);

  // ── Fine-tune +/- ────────────────────────────────────────────────────
  function adjust(key, delta) {
    const cur = layersRef.current;
    const next = { ...cur };
    if (delta > 0) {
      // Steal from the largest available layer
      const donor = LAYER_ORDER
        .filter(k => k !== key)
        .reduce((a, b) => next[a] > next[b] ? a : b);
      const take = Math.min(delta, Math.max(0, next[donor]));
      if (take === 0) return;
      next[key] += take;
      next[donor] -= take;
    } else {
      if (next[key] + delta < 0) return;
      const receiver = LAYER_ORDER
        .filter(k => k !== key)
        .reduce((a, b) => next[a] > next[b] ? a : b);
      next[key] += delta;
      next[receiver] -= delta;
    }
    onChange(normalize(next));
  }

  const selDef = LAYER_DEFS.find(l => l.key === selected);

  return (
    <div className="space-y-4">

      {/* ── Live cup preview ─────────────────────────────────────────── */}
      <div className="flex justify-center pt-1">
        <CoffeeCupSvg
          layers={layers}
          vessel={vessel}
          size={size}
          temp={temp}
          width={160}
          clipId="lc-cup"
          showLabels
        />
      </div>

      {/* ── Horizontal layer strip ───────────────────────────────────── */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-2 text-center uppercase tracking-wider font-semibold">
          Drag to adjust · tap to select
        </p>

        <div
          ref={stripRef}
          className="relative h-14 rounded-2xl overflow-hidden select-none"
          style={{ touchAction: "none" }}
        >
          {/* Segments */}
          {segments.map(({ key, pct, left }) => {
            const def = LAYER_DEFS.find(l => l.key === key);
            const isSel = selected === key;
            return (
              <div
                key={key}
                className="absolute top-0 h-full flex items-center justify-center cursor-pointer transition-[box-shadow] duration-150"
                style={{
                  left: `${left}%`,
                  width: `${pct}%`,
                  background: def.color,
                  boxShadow: isSel ? "inset 0 0 0 2.5px rgba(255,255,255,0.85)" : undefined,
                }}
                onClick={() => setSelected(k => k === key ? null : key)}
              >
                {pct >= 13 && (
                  <div className="text-center pointer-events-none leading-none">
                    <p className="text-[10px] font-bold" style={{ color: def.dark }}>{def.label}</p>
                    <p className="text-[9px] font-mono mt-0.5" style={{ color: def.dark }}>{pct}%</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Drag handles — one between each adjacent pair that are both > 0 */}
          {LAYER_ORDER.slice(0, -1).map((_, i) => {
            const boundary = segments[i].right;
            if (segments[i].pct === 0 || segments[i + 1].pct === 0) return null;
            return (
              <div
                key={i}
                className="absolute top-0 h-full z-10 flex items-center justify-center"
                style={{ left: `calc(${boundary}% - 10px)`, width: 20, cursor: "ew-resize" }}
                onPointerDown={e => onHandlePointerDown(e, i)}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                onPointerCancel={onHandlePointerUp}
              >
                <div
                  className="w-0.5 h-8 rounded-full pointer-events-none"
                  style={{ background: "rgba(255,255,255,0.80)", boxShadow: "0 0 0 1px rgba(0,0,0,0.10)" }}
                />
              </div>
            );
          })}
        </div>

        {/* Percentage summary below strip */}
        <div className="flex mt-1.5">
          {segments.map(({ key, pct, left }) => {
            const def = LAYER_DEFS.find(l => l.key === key);
            return (
              <div
                key={key}
                className="flex-shrink-0 flex justify-center"
                style={{ width: `${pct}%`, minWidth: pct > 0 ? 0 : undefined }}
              >
                {pct >= 10 && (
                  <span className="text-[9px] font-mono" style={{ color: def.dark }}>
                    {pct}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Selected layer control panel ─────────────────────────────── */}
      {selected && selDef && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          {/* Header: layer name + fine-tune */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: selDef.color, border: `1.5px solid ${selDef.dark}` }}
              />
              <span className="text-sm font-semibold">{selDef.label}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjust(selected, -5)}
                className="w-8 h-8 rounded-full border border-border bg-muted hover:bg-border text-sm font-bold flex items-center justify-center transition-colors"
              >
                −
              </button>
              <span className="text-sm font-mono w-9 text-center font-semibold tabular-nums">
                {layers[selected] ?? 0}%
              </span>
              <button
                type="button"
                onClick={() => adjust(selected, 5)}
                className="w-8 h-8 rounded-full border border-border bg-muted hover:bg-border text-sm font-bold flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Milk type selector */}
          {selected === "milk" && (
            <div className="flex flex-wrap gap-1.5">
              {MILK_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    onMilkChange?.(type);
                    if (type === "None") {
                      onChange(normalize({ ...layersRef.current, milk: 0 }));
                    } else if ((layersRef.current.milk || 0) === 0) {
                      const cur = layersRef.current;
                      const donor = ["coffee", "water", "foam"]
                        .reduce((a, b) => (cur[a] || 0) >= (cur[b] || 0) ? a : b);
                      const take = Math.min(20, Math.max(0, cur[donor] || 0));
                      if (take > 0) onChange(normalize({ ...cur, milk: take, [donor]: cur[donor] - take }));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    milk === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {/* Dismiss hint */}
          <p className="text-[10px] text-muted-foreground/60 text-center">
            Tap the segment again to dismiss
          </p>
        </div>
      )}
    </div>
  );
}

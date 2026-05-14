import { useRef, useEffect, useCallback } from "react";
import CoffeeCupSvg from "./CoffeeCupSvg";
import { LAYER_DEFS, LAYER_ORDER, MILK_TYPES } from "./cup-constants";

const MIN_DRAG = 5;

function normalize(raw) {
  const vals = LAYER_ORDER.map(k => Math.max(0, raw[k] || 0));
  const total = vals.reduce((s, v) => s + v, 0);
  if (total === 0) return { coffee: 50, water: 0, milk: 30, foam: 20 };
  let result = {};
  LAYER_ORDER.forEach((k, i) => { result[k] = Math.round(vals[i] * 100 / total); });
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
  const stripRef = useRef(null);
  const drag = useRef(null);
  const layersRef = useRef(layers);
  useEffect(() => { layersRef.current = layers; });

  useEffect(() => {
    const total = LAYER_ORDER.reduce((s, k) => s + (layers[k] || 0), 0);
    if (Math.abs(total - 100) > 1) onChange(normalize(layers));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const segments = LAYER_ORDER.reduce((acc, key, i) => {
    const left = i === 0 ? 0 : acc[i - 1].right;
    const pct = Math.max(0, layers[key] || 0);
    acc.push({ key, pct, left, right: left + pct });
    return acc;
  }, []);

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
    onChange({ ...layersRef.current, [LAYER_ORDER[index]]: newLeft, [LAYER_ORDER[index + 1]]: newRight });
  }, [onChange]);

  const onHandlePointerUp = useCallback(() => {
    if (!drag.current) return;
    drag.current = null;
    onChange(normalize(layersRef.current));
  }, [onChange]);

  function adjust(key, delta) {
    const cur = layersRef.current;
    const next = { ...cur };
    if (delta > 0) {
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

  return (
    <div className="space-y-4">

      {/* Live cup preview */}
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

      {/* Horizontal drag strip */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-2 text-center uppercase tracking-wider font-semibold">
          Drag to adjust
        </p>

        <div
          ref={stripRef}
          className="relative h-14 rounded-2xl overflow-hidden select-none"
          style={{ touchAction: "none" }}
        >
          {segments.map(({ key, pct, left }) => {
            const def = LAYER_DEFS.find(l => l.key === key);
            return (
              <div
                key={key}
                className="absolute top-0 h-full flex items-center justify-center"
                style={{ left: `${left}%`, width: `${pct}%`, background: def.color }}
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
      </div>

      {/* Always-visible per-layer controls */}
      <div className="space-y-2">
        {LAYER_DEFS.map(def => {
          const pct = layers[def.key] || 0;
          const canDecrement = pct > 0;
          const canIncrement = LAYER_ORDER.filter(k => k !== def.key).some(k => (layers[k] || 0) > 0);
          return (
            <div key={def.key}>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: def.color, border: `1.5px solid ${def.dark}` }}
                />
                <span className="text-xs font-medium w-11 flex-shrink-0">{def.label}</span>
                <button
                  type="button"
                  onClick={() => adjust(def.key, -5)}
                  disabled={!canDecrement}
                  className="w-7 h-7 rounded-full border border-border bg-muted hover:bg-border text-sm font-bold flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                >
                  −
                </button>
                <span className="text-xs font-mono w-8 text-center tabular-nums flex-shrink-0">
                  {pct}%
                </span>
                <button
                  type="button"
                  onClick={() => adjust(def.key, 5)}
                  disabled={!canIncrement}
                  className="w-7 h-7 rounded-full border border-border bg-muted hover:bg-border text-sm font-bold flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                >
                  +
                </button>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{ width: `${pct}%`, background: def.dark }}
                  />
                </div>
              </div>

              {/* Milk type pills — auto-shown when milk > 0 */}
              {def.key === "milk" && pct > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 pl-[84px]">
                  {MILK_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        onMilkChange?.(type);
                        if (type === "None") {
                          onChange(normalize({ ...layersRef.current, milk: 0 }));
                        }
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all border ${
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

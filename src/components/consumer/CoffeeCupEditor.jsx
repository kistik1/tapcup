import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check, Droplets, Coffee, Layers, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Layer definitions: key, label, color, icon
const LAYERS = [
  { key: "water",  label: "Water",  color: "#a8d5f5", dark: "#5ba8e0", icon: Droplets },
  { key: "milk",   label: "Milk",   color: "#f5e6c8", dark: "#d4b483", icon: Layers },
  { key: "coffee", label: "Coffee", color: "#6b3a1f", dark: "#3d1f08", icon: Coffee },
  { key: "foam",   label: "Foam",   color: "#f0ede8", dark: "#c8bfb2", icon: Wind },
];

const MILK_TYPES = ["None", "Whole", "Skim", "Oat", "Almond", "Soy", "Coconut"];
const STRENGTHS = ["Light", "Regular", "Strong", "Extra Strong"];
const TEMPS = ["Hot", "Warm", "Iced"];

const CUP_HEIGHT = 340;
const CUP_TOP_WIDTH = 180;
const CUP_BOTTOM_WIDTH = 110;
const CUP_PADDING_TOP = 30;

function trapezoidX(y, height, topW, bottomW) {
  const t = y / height;
  return bottomW + (topW - bottomW) * t;
}

export default function CoffeeCupEditor({ initial = {}, onSave, onClose }) {
  // Percentages for each layer (0–100), sum should be <= 100
  const [layers, setLayers] = useState({
    water:  initial.water_pct  ?? 0,
    milk:   initial.milk_pct   ?? 20,
    coffee: initial.coffee_pct ?? 60,
    foam:   initial.foam_pct   ?? 20,
  });

  const [name, setName]         = useState(initial.name || "");
  const [coffeeType, setCoffeeType] = useState(initial.coffee_type || "Latte");
  const [strength, setStrength] = useState(initial.strength || "Regular");
  const [milkType, setMilkType] = useState(initial.milk || "Whole");
  const [temp, setTemp]         = useState(initial.temperature || "Hot");
  const [notes, setNotes]       = useState(initial.notes || "");
  const [activeLayer, setActiveLayer] = useState(null);

  const svgRef = useRef(null);
  const dragging = useRef(null);

  // Total used percentage
  const total = Object.values(layers).reduce((s, v) => s + v, 0);

  // Build stacked layer rects from bottom up: water → milk → coffee → foam
  const order = ["water", "milk", "coffee", "foam"];
  const stackedLayers = (() => {
    let cumulative = 0;
    return order.map(key => {
      const pct = layers[key];
      const startPct = cumulative;
      cumulative += pct;
      return { key, pct, startPct };
    });
  })();

  // Convert % to SVG y coordinates (bottom of cup = 100%)
  function pctToY(pct) {
    return CUP_HEIGHT - (pct / 100) * CUP_HEIGHT;
  }

  // Convert SVG y to percentage
  function yToPct(y) {
    const clamped = Math.max(0, Math.min(CUP_HEIGHT, y));
    return ((CUP_HEIGHT - clamped) / CUP_HEIGHT) * 100;
  }

  // Handle drag on divider line
  const handleDividerMouseDown = useCallback((e, key) => {
    e.preventDefault();
    dragging.current = key;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const svgY = clientY - rect.top - CUP_PADDING_TOP;
    const newPct = Math.round(yToPct(svgY));

    const key = dragging.current;
    const idx = order.indexOf(key);

    setLayers(prev => {
      const newLayers = { ...prev };
      // The divider between layer[idx] and layer[idx+1]
      // The divider Y represents cumulative bottom of layers[0..idx]
      let belowSum = 0;
      for (let i = 0; i <= idx; i++) belowSum += newLayers[order[i]];

      const delta = newPct - belowSum;
      const next = order[idx + 1];
      if (!next) return prev;

      const newCurrent = Math.max(0, newLayers[key] + delta);
      const newNext = Math.max(0, newLayers[next] - delta);

      // Don't exceed 100 total
      if (newCurrent + newNext > newLayers[key] + newLayers[next] + 0.5) return prev;

      return { ...newLayers, [key]: Math.round(newCurrent), [next]: Math.round(newNext) };
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragging.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // SVG path for trapezoid cup outline
  const cupPath = () => {
    const tw = CUP_TOP_WIDTH / 2;
    const bw = CUP_BOTTOM_WIDTH / 2;
    const h = CUP_HEIGHT;
    const cx = 120;
    return `M ${cx - tw} 0 L ${cx + tw} 0 L ${cx + bw} ${h} L ${cx - bw} ${h} Z`;
  };

  // Clip path for cup shape
  const clipId = "cup-clip";

  // Build polygon for a layer
  function layerPolygon(startPct, pct) {
    if (pct <= 0) return null;
    const cx = 120;
    const tw = CUP_TOP_WIDTH / 2;
    const bw = CUP_BOTTOM_WIDTH / 2;
    const h = CUP_HEIGHT;

    const yBottom = pctToY(startPct);
    const yTop = pctToY(startPct + pct);

    const xBL = cx - (bw + (tw - bw) * (1 - yBottom / h));
    const xBR = cx + (bw + (tw - bw) * (1 - yBottom / h));
    const xTL = cx - (bw + (tw - bw) * (1 - yTop / h));
    const xTR = cx + (bw + (tw - bw) * (1 - yTop / h));

    return `${xBL},${yBottom} ${xBR},${yBottom} ${xTR},${yTop} ${xTL},${yTop}`;
  }

  // Divider lines (between stacked layers except very top and bottom)
  const dividers = stackedLayers.slice(0, -1).map((layer, idx) => {
    const cumPct = layer.startPct + layer.pct;
    if (cumPct <= 0 || cumPct >= 100) return null;
    const y = pctToY(cumPct);
    const cx = 120;
    const tw = CUP_TOP_WIDTH / 2;
    const bw = CUP_BOTTOM_WIDTH / 2;
    const xW = bw + (tw - bw) * (1 - y / CUP_HEIGHT);
    return { key: layer.key, y, x1: cx - xW, x2: cx + xW, cumPct };
  }).filter(Boolean);

  function handleSave() {
    const milkValue = layers.milk > 0 ? milkType : "None";
    onSave({
      name,
      coffee_type: coffeeType,
      strength,
      milk: milkValue,
      temperature: temp,
      notes,
      // store percentages as metadata in notes if needed
      water_pct: layers.water,
      milk_pct: layers.milk,
      coffee_pct: layers.coffee,
      foam_pct: layers.foam,
    });
  }

  const svgHeight = CUP_HEIGHT + CUP_PADDING_TOP + 20;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[96vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur px-5 py-4 flex items-center justify-between border-b border-border z-10">
          <h3 className="font-semibold text-lg">Visual Coffee Editor</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col md:flex-row gap-6">
          {/* Cup SVG */}
          <div className="flex flex-col items-center gap-4 md:w-64 flex-shrink-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Drag the lines to adjust</p>

            <div className="relative select-none">
              <svg
                ref={svgRef}
                width={240}
                height={svgHeight}
                style={{ touchAction: "none" }}
              >
                <defs>
                  <clipPath id={clipId}>
                    <polygon points={
                      (() => {
                        const cx = 120;
                        const tw = CUP_TOP_WIDTH / 2;
                        const bw = CUP_BOTTOM_WIDTH / 2;
                        const h = CUP_HEIGHT;
                        const top = CUP_PADDING_TOP;
                        return `${cx - tw},${top} ${cx + tw},${top} ${cx + bw},${h + top} ${cx - bw},${h + top}`;
                      })()
                    } />
                  </clipPath>
                  {/* Steam gradient */}
                  <linearGradient id="steamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                <g transform={`translate(0, ${CUP_PADDING_TOP})`}>
                  {/* Layers */}
                  <g clipPath={`url(#${clipId})`}>
                    {stackedLayers.map(({ key, pct, startPct }) => {
                      const layer = LAYERS.find(l => l.key === key);
                      const poly = layerPolygon(startPct, pct);
                      if (!poly) return null;
                      return (
                        <polygon
                          key={key}
                          points={poly}
                          fill={layer.color}
                          opacity={pct > 0 ? 1 : 0}
                          onClick={() => setActiveLayer(key === activeLayer ? null : key)}
                          style={{ cursor: "pointer" }}
                        />
                      );
                    })}
                    {/* Shine overlay */}
                    <polygon
                      points={(() => {
                        const cx = 120;
                        const tw = CUP_TOP_WIDTH / 2;
                        const bw = CUP_BOTTOM_WIDTH / 2;
                        return `${cx - tw + 5},0 ${cx - tw + 25},0 ${cx - bw + 15},${CUP_HEIGHT} ${cx - bw + 5},${CUP_HEIGHT}`;
                      })()}
                      fill="white"
                      opacity="0.07"
                      style={{ pointerEvents: "none" }}
                    />
                  </g>

                  {/* Cup outline */}
                  <polygon
                    points={(() => {
                      const cx = 120;
                      const tw = CUP_TOP_WIDTH / 2;
                      const bw = CUP_BOTTOM_WIDTH / 2;
                      return `${cx - tw},0 ${cx + tw},0 ${cx + bw},${CUP_HEIGHT} ${cx - bw},${CUP_HEIGHT}`;
                    })()}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />

                  {/* Draggable dividers */}
                  {dividers.map(({ key, y, x1, x2 }) => {
                    const layer = LAYERS.find(l => l.key === key);
                    return (
                      <g key={key}>
                        {/* Invisible hit area */}
                        <line
                          x1={x1 - 4} y1={y} x2={x2 + 4} y2={y}
                          stroke="transparent"
                          strokeWidth={18}
                          style={{ cursor: "ns-resize" }}
                          onMouseDown={e => handleDividerMouseDown(e, key)}
                          onTouchStart={e => handleDividerMouseDown(e, key)}
                        />
                        {/* Visual line */}
                        <line
                          x1={x1} y1={y} x2={x2} y2={y}
                          stroke={layer.dark}
                          strokeWidth={2.5}
                          strokeDasharray="4 3"
                          style={{ pointerEvents: "none" }}
                        />
                        {/* Handle circles */}
                        <circle cx={x1 - 6} cy={y} r={5} fill={layer.dark} style={{ pointerEvents: "none" }} />
                        <circle cx={x2 + 6} cy={y} r={5} fill={layer.dark} style={{ pointerEvents: "none" }} />
                      </g>
                    );
                  })}

                  {/* Labels inside layers */}
                  {stackedLayers.map(({ key, pct, startPct }) => {
                    if (pct < 8) return null;
                    const layer = LAYERS.find(l => l.key === key);
                    const midPct = startPct + pct / 2;
                    const y = pctToY(midPct);
                    return (
                      <text
                        key={key}
                        x={120}
                        y={y + 4}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight="600"
                        fill={layer.dark}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {layer.label} {pct}%
                      </text>
                    );
                  })}
                </g>

                {/* Steam lines when hot */}
                {temp === "Hot" && (
                  <g opacity="0.5">
                    {[100, 115, 130].map((x, i) => (
                      <motion.path
                        key={i}
                        d={`M${x} ${CUP_PADDING_TOP - 5} Q${x + 6} ${CUP_PADDING_TOP - 15} ${x} ${CUP_PADDING_TOP - 25}`}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        animate={{ opacity: [0.3, 0.8, 0.3], y: [-2, -8, -2] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                      />
                    ))}
                  </g>
                )}
              </svg>
            </div>

            {/* Layer legend */}
            <div className="flex flex-wrap gap-2 justify-center">
              {LAYERS.map(layer => {
                const Icon = layer.icon;
                const pct = layers[layer.key];
                return (
                  <button
                    key={layer.key}
                    onClick={() => setActiveLayer(layer.key === activeLayer ? null : layer.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      activeLayer === layer.key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: layer.color, border: `1.5px solid ${layer.dark}` }} />
                    <Icon className="w-3 h-3" />
                    {layer.label}
                    <span className="font-mono text-[10px]">{pct}%</span>
                  </button>
                );
              })}
            </div>

            {/* Active layer fine control */}
            {activeLayer && (
              <motion.div
                key={activeLayer}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-muted/60 rounded-xl p-3"
              >
                <p className="text-xs font-semibold mb-2 capitalize text-muted-foreground">
                  {activeLayer} amount
                </p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={layers[activeLayer]}
                  onChange={e => {
                    const val = Number(e.target.value);
                    const diff = val - layers[activeLayer];
                    // Adjust neighbouring layers
                    setLayers(prev => {
                      const idx = order.indexOf(activeLayer);
                      const nextKey = order[idx + 1] || order[idx - 1];
                      if (!nextKey) return prev;
                      const newNext = Math.max(0, prev[nextKey] - diff);
                      const realDiff = prev[nextKey] - newNext;
                      return { ...prev, [activeLayer]: prev[activeLayer] + realDiff, [nextKey]: newNext };
                    });
                  }}
                  className="w-full accent-amber-600"
                />
                {/* Milk type selector if milk layer active */}
                {activeLayer === "milk" && layers.milk > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Milk type</p>
                    <div className="flex flex-wrap gap-1">
                      {MILK_TYPES.filter(m => m !== "None").map(m => (
                        <button
                          key={m}
                          onClick={() => setMilkType(m)}
                          className={`text-[11px] px-2 py-1 rounded-full border transition-all ${
                            milkType === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Right: Settings */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-sm font-medium">Preference Name</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Morning Latte"
                className="mt-1 h-10 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Coffee Type</label>
              <Input
                value={coffeeType}
                onChange={e => setCoffeeType(e.target.value)}
                placeholder="e.g. Latte, Espresso"
                className="mt-1 h-10 rounded-xl"
              />
            </div>

            {/* Strength */}
            <div>
              <label className="text-sm font-medium block mb-2">Strength</label>
              <div className="flex gap-2 flex-wrap">
                {STRENGTHS.map(s => (
                  <button
                    key={s}
                    onClick={() => setStrength(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      strength === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="text-sm font-medium block mb-2">Temperature</label>
              <div className="flex gap-2">
                {TEMPS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTemp(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                      temp === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {t === "Hot" ? "🔥" : t === "Warm" ? "☀️" : "🧊"} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Extra hot, no foam"
                className="mt-1 h-10 rounded-xl"
              />
            </div>

            {/* Summary */}
            <div className="bg-muted/40 rounded-xl p-4 text-sm space-y-1">
              <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Summary</p>
              {stackedLayers.filter(l => l.pct > 0).reverse().map(({ key, pct }) => {
                const layer = LAYERS.find(l => l.key === key);
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: layer.color, border: `1.5px solid ${layer.dark}` }} />
                      <span className="capitalize text-foreground">{key === "milk" && layers.milk > 0 ? `${milkType} Milk` : layer.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: layer.dark }} />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
              {total < 100 && (
                <p className="text-xs text-amber-600 mt-1">⚠️ {100 - total}% of the cup is empty</p>
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={!name || !coffeeType}
              className="w-full h-11 rounded-xl font-semibold bg-primary text-primary-foreground"
            >
              <Check className="w-4 h-4 mr-2" /> Save Preference
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
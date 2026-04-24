import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageGallery from "./ImageGallery";

// ── Cup visual constants ──────────────────────────────────────────────
const CUP_H = 220;
const CUP_TOP_W = 140;
const CUP_BOT_W = 86;
const CX = 100;

const LAYER_DEF = [
  { key: "water",  label: "Water",  color: "#a8d5f5", dark: "#4a90c4" },
  { key: "milk",   label: "Milk",   color: "#f5e6c8", dark: "#c49a3a" },
  { key: "coffee", label: "Coffee", color: "#6b3a1f", dark: "#3d1f08" },
  { key: "foam",   label: "Foam",   color: "#f0ede8", dark: "#9e9086" },
];
const ORDER = ["water", "milk", "coffee", "foam"];

const ESPRESSO_DOSES = [
  { value: "1", label: "Single", desc: "1 × 36ml", emoji: "☕", coffeePct: 30 },
  { value: "2", label: "Double", desc: "2 × 36ml", emoji: "☕☕", coffeePct: 50 },
  { value: "3", label: "Triple", desc: "3 × 36ml", emoji: "☕☕☕", coffeePct: 70 },
];
const MILKS     = ["None", "Whole", "Skim", "Oat", "Almond", "Soy", "Coconut"];
const SUGARS    = ["None", "Half", "1 tsp", "2 tsp", "3 tsp"];
const TEMPS     = ["Extra Hot", "Hot", "Warm", "Iced"];

// vessel type: affects shape ratio (top/bottom widths)
const VESSELS = [
  { value: "mug",   label: "Mug",    emoji: "🫖", topW: 130, botW: 110 }, // nearly straight
  { value: "glass", label: "Glass",  emoji: "🥛", topW: 120, botW: 100 }, // slight taper
  { value: "ta",    label: "TA",     emoji: "📄", topW: 100, botW: 80  }, // paper cup taper
];

// size: totalMl = total cup volume, cupH = visual SVG height of the cup
// coffee shot = 36ml fixed. other layers fill the rest proportionally.
const SIZES = [
  { value: "small", label: "Small", totalMl: 150, cupH: 160 },
  { value: "large", label: "Large", totalMl: 300, cupH: 220 },
];

function pctToY(pct) { return CUP_H - (pct / 100) * CUP_H; }
function yToPct(y)   { return ((CUP_H - Math.max(0, Math.min(CUP_H, y))) / CUP_H) * 100; }

function xAtY(y) {
  const t = 1 - y / CUP_H;
  return CUP_BOT_W / 2 + (CUP_TOP_W / 2 - CUP_BOT_W / 2) * t;
}

function layerPoints(startPct, pct) {
  if (pct <= 0) return null;
  const yB = pctToY(startPct);
  const yT = pctToY(startPct + pct);
  const xBhalf = xAtY(yB);
  const xThalf = xAtY(yT);
  return `${CX - xBhalf},${yB} ${CX + xBhalf},${yB} ${CX + xThalf},${yT} ${CX - xThalf},${yT}`;
}

function defaultLayers(editing) {
  return {
    water:  editing?.water_pct  ?? 0,
    milk:   editing?.milk_pct   ?? 20,
    coffee: editing?.coffee_pct ?? 60,
    foam:   editing?.foam_pct   ?? 20,
  };
}

// ── CupVisual sub-component ───────────────────────────────────────────
function CupVisual({ layers, setLayers, temp, vessel = "mug", size = "large" }) {
  const svgRef  = useRef(null);
  const dragging = useRef(null);

  const vesselDef = VESSELS.find(v => v.value === vessel) || VESSELS[0];
  const sizeDef   = SIZES.find(s => s.value === size) || SIZES[1];
  const TOP_W = vesselDef.topW;
  const BOT_W = vesselDef.botW;
  const cupH  = sizeDef.cupH;   // visual height of cup SVG
  const fillH = cupH;            // liquid fills full cup height

  function xAtYDynamic(y) {
    const t = 1 - y / cupH;
    return BOT_W / 2 + (TOP_W / 2 - BOT_W / 2) * t;
  }

  function layerPointsDynamic(startPct, pct) {
    if (pct <= 0) return null;
    const yB = cupH - (startPct / 100) * fillH;
    const yT = cupH - ((startPct + pct) / 100) * fillH;
    const xBhalf = xAtYDynamic(yB);
    const xThalf = xAtYDynamic(yT);
    return `${CX - xBhalf},${yB} ${CX + xBhalf},${yB} ${CX + xThalf},${yT} ${CX - xThalf},${yT}`;
  }

  const stacked = (() => {
    let cum = 0;
    return ORDER.map(key => {
      const startPct = cum;
      cum += layers[key];
      return { key, pct: layers[key], startPct };
    });
  })();

  const dividers = stacked.slice(0, -1).map(({ key, startPct, pct }) => {
    const cum = startPct + pct;
    if (cum <= 0 || cum >= 100) return null;
    const y   = cupH - (cum / 100) * fillH;
    const xH  = xAtYDynamic(y);
    return { key, y, x1: CX - xH, x2: CX + xH, cumPct: cum };
  }).filter(Boolean);

  const onDividerDown = useCallback((e, key) => {
    e.preventDefault();
    dragging.current = key;
  }, []);

  const onMove = useCallback((e) => {
    if (!dragging.current || !svgRef.current) return;
    const rect     = svgRef.current.getBoundingClientRect();
    const clientY  = e.touches ? e.touches[0].clientY : e.clientY;
    const svgY     = clientY - rect.top;
    const newCum   = Math.round(((cupH - svgY) / fillH) * 100);
    const key      = dragging.current;
    const idx      = ORDER.indexOf(key);
    const nextKey  = ORDER[idx + 1];
    if (!nextKey) return;

    // Coffee amount is locked — skip dividers that would affect it
    if (key === "coffee" || nextKey === "coffee") return;

    setLayers(prev => {
      let cumBelow = 0;
      for (let i = 0; i <= idx; i++) cumBelow += prev[ORDER[i]];
      const delta      = newCum - cumBelow;
      const newCurrent = Math.max(0, prev[key]   + delta);
      const newNext    = Math.max(0, prev[nextKey] - delta);
      if (newCurrent + newNext > prev[key] + prev[nextKey] + 0.5) return prev;
      return { ...prev, [key]: Math.round(newCurrent), [nextKey]: Math.round(newNext) };
    });
  }, [setLayers, fillH, cupH]);

  const onUp = useCallback(() => { dragging.current = null; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend",  onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onUp);
    };
  }, [onMove, onUp]);

  const cupPoly = `${CX - TOP_W/2},0 ${CX + TOP_W/2},0 ${CX + BOT_W/2},${cupH} ${CX - BOT_W/2},${cupH}`;

  return (
    <div className="flex flex-col items-center">
      <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
        Drag lines to adjust amounts
      </p>
      <svg ref={svgRef} width={200} height={cupH + 16} style={{ touchAction: "none", display: "block" }}>
        <defs>
          <clipPath id="cup-clip">
            <polygon points={cupPoly} />
          </clipPath>
        </defs>

        {/* Filled layers */}
        <g clipPath="url(#cup-clip)">
          {stacked.map(({ key, pct, startPct }) => {
            const ld    = LAYER_DEF.find(l => l.key === key);
            const pts   = layerPointsDynamic(startPct, pct);
            if (!pts) return null;
            return <polygon key={key} points={pts} fill={ld.color} />;
          })}
          {/* Shine */}
          <polygon
            points={`${CX - TOP_W/2 + 5},0 ${CX - TOP_W/2 + 22},0 ${CX - BOT_W/2 + 14},${cupH} ${CX - BOT_W/2 + 5},${cupH}`}
            fill="white" opacity="0.08" style={{ pointerEvents: "none" }}
          />
        </g>

        {/* Cup outline */}
        <polygon points={cupPoly} fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" strokeLinejoin="round" />

        {/* Draggable dividers */}
        {dividers.map(({ key, y, x1, x2 }) => {
          const ld = LAYER_DEF.find(l => l.key === key);
          const midX = (x1 + x2) / 2;
          return (
            <g key={key}>
              {/* Large invisible touch/click area */}
              <line x1={x1 - 10} y1={y} x2={x2 + 10} y2={y}
                stroke="transparent" strokeWidth={32} style={{ cursor: "ns-resize" }}
                onMouseDown={e => onDividerDown(e, key)}
                onTouchStart={e => onDividerDown(e, key)} />
              {/* Solid divider line */}
              <line x1={x1} y1={y} x2={x2} y2={y}
                stroke="white" strokeWidth={2.5} strokeOpacity={0.85}
                style={{ pointerEvents: "none" }} />
              {/* Center drag pill */}
              <rect
                x={midX - 18} y={y - 9}
                width={36} height={18} rx={9}
                fill={ld.dark} style={{ pointerEvents: "none" }} />
              <text x={midX} y={y + 4.5}
                textAnchor="middle" fontSize={10} fill="white" fontWeight="700"
                style={{ pointerEvents: "none", userSelect: "none" }}>
                ⇅
              </text>
            </g>
          );
        })}

        {/* Layer labels */}
        {stacked.map(({ key, pct, startPct }) => {
          if (pct < 9) return null;
          const ld  = LAYER_DEF.find(l => l.key === key);
          const midY = cupH - ((startPct + pct / 2) / 100) * fillH;
          return (
            <text key={key} x={CX} y={midY + 4}
              textAnchor="middle" fontSize={10} fontWeight="600" fill={ld.dark}
              style={{ pointerEvents: "none", userSelect: "none" }}>
              {ld.label} {pct}%
            </text>
          );
        })}

        {/* Steam */}
        {(temp === "Hot" || temp === "Extra Hot") && [88, 100, 112].map((x, i) => (
          <motion.path key={i}
            d={`M${x} -2 Q${x + 5} -10 ${x} -20`}
            stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round"
            animate={{ opacity: [0.2, 0.7, 0.2], y: [-1, -6, -1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }} />
        ))}
      </svg>

      {/* Layer controls */}
      <div className="w-full mt-3 space-y-1.5">
        {LAYER_DEF.map(ld => {
          const pct = layers[ld.key];
          function adjust(delta) {
            setLayers(prev => {
              const idx = ORDER.indexOf(ld.key);
              // Find a neighbour to steal from / give to
              const candidates = ORDER.filter((k, i) => i !== idx);
              // Prefer taking from the last layer with surplus
              let donor = null;
              if (delta > 0) {
                // We want to increase ld.key → take from the last candidate that has > 0
                for (let i = candidates.length - 1; i >= 0; i--) {
                  if (prev[candidates[i]] >= delta) { donor = candidates[i]; break; }
                }
              } else {
                // We want to decrease ld.key → give to the next layer
                if (prev[ld.key] + delta < 0) return prev;
                donor = candidates[candidates.length - 1];
              }
              if (!donor) return prev;
              const newVal = Math.max(0, prev[ld.key] + delta);
              const realDelta = newVal - prev[ld.key];
              return { ...prev, [ld.key]: newVal, [donor]: Math.max(0, prev[donor] - realDelta) };
            });
          }
          return (
            <div key={ld.key} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: ld.color, border: `1.5px solid ${ld.dark}` }} />
              <span className="text-[11px] text-muted-foreground w-10 font-medium">{ld.label}</span>
              <div className="flex items-center gap-1 flex-1">
                <button type="button" onClick={() => adjust(-5)} disabled={ld.key === "coffee"}
                  className="w-6 h-6 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted text-xs font-bold leading-none flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">−</button>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ld.dark }} />
                </div>
                <button type="button" onClick={() => adjust(5)} disabled={ld.key === "coffee"}
                  className="w-6 h-6 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted text-xs font-bold leading-none flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                <span className="text-[11px] font-mono text-muted-foreground w-7 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main PreferenceForm ───────────────────────────────────────────────
export default function PreferenceForm({ profile, editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:        editing?.name        || "",
    coffee_type: editing?.coffee_type || "",
    strength:    editing?.strength    || "1",
    milk:        editing?.milk        || "None",
    sugar:       editing?.sugar       || "None",
    temperature: editing?.temperature || "Hot",
    notes:       editing?.notes       || "",
    image_url:   editing?.image_url   || "",
    is_default:  editing?.is_default  || false,
    vessel:      editing?.vessel      || "mug",
    size:        editing?.size        || "large",
  });
  const [layers, setLayers]     = useState(defaultLayers(editing));
  const [saving, setSaving]     = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  // Keep milk layer in sync with milk form field
  useEffect(() => {
    if (form.milk === "None") setLayers(l => ({ ...l, milk: 0 }));
  }, [form.milk]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      milk: layers.milk > 0 ? (form.milk === "None" ? "Whole" : form.milk) : "None",
      profile_id: profile.id,
      user_email: profile.user_email,
      water_pct:  layers.water,
      milk_pct:   layers.milk,
      coffee_pct: layers.coffee,
      foam_pct:   layers.foam,
      vessel:     form.vessel,
      size:       form.size,
    };
    if (editing) {
      await base44.entities.CoffeePreference.update(editing.id, data);
    } else {
      await base44.entities.CoffeePreference.create(data);
    }
    await onSaved();
    onClose();
    setSaving(false);
  }

  function Chip({ value, onChange, options }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              value === opt
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/50"
            }`}>
            {opt}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[94vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur px-5 py-4 flex items-center justify-between border-b border-border z-10">
          <h3 className="font-semibold text-lg">{editing ? "Edit Preference" : "New Preference"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">

          {/* ── Espresso Dose ── */}
          <div>
            <Label className="mb-2 block">Espresso Dose</Label>
            <div className="flex gap-2">
              {ESPRESSO_DOSES.map(({ value, label, desc, emoji, coffeePct }) => (
                <button key={value} type="button"
                  onClick={() => {
                    setForm(f => ({ ...f, strength: value }));
                    setLayers(prev => {
                      const total = prev.water + prev.milk + prev.coffee + prev.foam;
                      const remaining = total - coffeePct;
                      const nonCoffeeTotal = prev.water + prev.milk + prev.foam;
                      if (nonCoffeeTotal === 0) {
                        return { ...prev, coffee: coffeePct, foam: Math.max(0, total - coffeePct) };
                      }
                      const scale = remaining / nonCoffeeTotal;
                      return {
                        water:  Math.round(prev.water * scale),
                        milk:   Math.round(prev.milk  * scale),
                        coffee: coffeePct,
                        foam:   Math.round(prev.foam  * scale),
                      };
                    });
                  }}
                  className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    form.strength === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}>
                  <span className="text-lg mb-0.5">{emoji}</span>
                  <span className="font-semibold">{label}</span>
                  <span className="text-[11px] font-mono opacity-70">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Vessel & Size ── */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="mb-2 block">Cup Type</Label>
              <div className="flex gap-2">
                {VESSELS.map(({ value, label, emoji }) => (
                  <button key={value} type="button"
                    onClick={() => setForm(f => ({ ...f, vessel: value }))}
                    className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border-2 transition-all text-xs font-medium ${
                      form.vessel === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}>
                    <span className="text-xl mb-0.5">{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Size</Label>
              <div className="flex gap-2">
                {SIZES.map(({ value, label, totalMl }) => (
                  <button key={value} type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, size: value }));
                      // Recalculate proportions: coffee shot(s) fixed at 36ml per dose
                      const doses = parseInt(form.strength) || 1;
                      const coffeeMl = doses * 36;
                      const coffeePct = Math.round((coffeeMl / totalMl) * 100);
                      const remainingPct = 100 - coffeePct;
                      setLayers(prev => {
                        const nonCoffeeTotal = prev.water + prev.milk + prev.foam;
                        if (nonCoffeeTotal === 0) {
                          return { ...prev, coffee: coffeePct, foam: remainingPct };
                        }
                        const scale = remainingPct / nonCoffeeTotal;
                        return {
                          water:  Math.round(prev.water * scale),
                          milk:   Math.round(prev.milk  * scale),
                          coffee: coffeePct,
                          foam:   Math.round(prev.foam  * scale),
                        };
                      });
                    }}
                    className={`flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all text-xs font-medium ${
                      form.size === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Visual cup editor ── */}
          <div className="bg-muted/30 rounded-2xl p-4">
            <CupVisual layers={layers} setLayers={setLayers} temp={form.temperature} vessel={form.vessel} size={form.size} />
          </div>

          {/* ── Name & type ── */}
          <div>
            <Label>Preference Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Morning Latte" className="mt-1 h-11 rounded-xl" required />
          </div>

          <div>
            <Label>Coffee Type</Label>
            <Input value={form.coffee_type} onChange={e => setForm(f => ({ ...f, coffee_type: e.target.value }))}
              placeholder="e.g. Latte, Espresso, Flat White" className="mt-1 h-11 rounded-xl" required />
          </div>

          {/* ── Milk ── */}
          <div>
            <Label className="mb-2 block">Milk</Label>
            <Chip value={form.milk} onChange={v => {
              setForm(f => ({ ...f, milk: v }));
              // If switching from None to a type, give milk some percentage
              if (v !== "None" && layers.milk === 0) {
                setLayers(l => {
                  const take = Math.min(20, l.coffee);
                  return { ...l, milk: take, coffee: l.coffee - take };
                });
              }
            }} options={MILKS} />
          </div>

          {/* ── Sugar ── */}
          <div>
            <Label className="mb-2 block">Sugar</Label>
            <Chip value={form.sugar} onChange={v => setForm(f => ({ ...f, sugar: v }))} options={SUGARS} />
          </div>

          {/* ── Temperature ── */}
          <div>
            <Label className="mb-2 block">Temperature</Label>
            <Chip value={form.temperature} onChange={v => setForm(f => ({ ...f, temperature: v }))} options={TEMPS} />
          </div>

          {/* ── Notes ── */}
          <div>
            <Label>Special Notes</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Extra hot, no foam" className="mt-1 h-11 rounded-xl" />
          </div>

          {/* ── Default toggle ── */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setForm(f => ({ ...f, is_default: !f.is_default }))}
              className={`w-10 h-6 rounded-full transition-colors ${form.is_default ? "bg-amber-500" : "bg-muted"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form.is_default ? "translate-x-4" : ""}`} />
            </div>
            <span className="text-sm font-medium">Set as default preference</span>
          </label>

          <Button type="submit" disabled={saving}
            className="w-full h-12 rounded-xl font-semibold bg-primary text-primary-foreground">
            {saving ? "Saving..." : (editing ? "Save Changes" : "Add Preference")}
          </Button>
        </form>

        {showGallery && (
          <ImageGallery
            onSelect={url => { setForm(f => ({ ...f, image_url: url })); setShowGallery(false); }}
            onClose={() => setShowGallery(false)}
          />
        )}
      </motion.div>
    </div>
  );
}
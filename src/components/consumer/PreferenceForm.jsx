import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageGallery from "./ImageGallery";

// ─── Cup constants ────────────────────────────────────────────────────────────
const CUP_H = 220;
const CUP_TOP_W = 140;
const CUP_BOT_W = 88;
const CX = 100;

const LAYER_DEFS = [
  { key: "water",  label: "Water",  fill: "#a8d5f5", stroke: "#5ba8e0" },
  { key: "milk",   label: "Milk",   fill: "#f5e6c8", stroke: "#c8943a" },
  { key: "coffee", label: "Coffee", fill: "#6b3a1f", stroke: "#3d1f08" },
  { key: "foam",   label: "Foam",   fill: "#f0ede8", stroke: "#a89880" },
];
const ORDER = ["water", "milk", "coffee", "foam"];

const STRENGTHS = ["Light", "Regular", "Strong", "Extra Strong"];
const MILKS     = ["None", "Whole", "Skim", "Oat", "Almond", "Soy", "Coconut"];
const SUGARS    = ["None", "Half", "1 tsp", "2 tsp", "3 tsp"];
const TEMPS     = ["Hot", "Warm", "Iced"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pctToY(pct) { return CUP_H - (pct / 100) * CUP_H; }
function yToPct(y)   { return ((CUP_H - Math.max(0, Math.min(CUP_H, y))) / CUP_H) * 100; }

function cupEdgeX(y) {
  // half-width at svg-y inside cup
  return CUP_BOT_W / 2 + (CUP_TOP_W / 2 - CUP_BOT_W / 2) * (1 - y / CUP_H);
}

function layerPoints(startPct, pct) {
  const yB = pctToY(startPct);
  const yT = pctToY(startPct + pct);
  const xBL = CX - cupEdgeX(yB), xBR = CX + cupEdgeX(yB);
  const xTL = CX - cupEdgeX(yT), xTR = CX + cupEdgeX(yT);
  return `${xBL},${yB} ${xBR},${yB} ${xTR},${yT} ${xTL},${yT}`;
}

function cupOutlinePoints() {
  return `${CX - CUP_TOP_W/2},0 ${CX + CUP_TOP_W/2},0 ${CX + CUP_BOT_W/2},${CUP_H} ${CX - CUP_BOT_W/2},${CUP_H}`;
}

// ─── Visual Cup ───────────────────────────────────────────────────────────────
function CoffeeCup({ layers, setLayers, temp }) {
  const svgRef = useRef(null);
  const dragging = useRef(null);

  // Build stacked layers
  const stacked = (() => {
    let cum = 0;
    return ORDER.map(key => { const p = { key, pct: layers[key], startPct: cum }; cum += layers[key]; return p; });
  })();

  // Divider lines between adjacent layers (all except very top)
  const dividers = stacked.slice(0, -1).map((l) => {
    const cum = l.startPct + l.pct;
    if (cum <= 0 || cum >= 100) return null;
    const y = pctToY(cum);
    const hw = cupEdgeX(y);
    return { key: l.key, y, x1: CX - hw, x2: CX + hw };
  }).filter(Boolean);

  const onDividerDown = useCallback((e, key) => {
    e.preventDefault();
    dragging.current = key;
  }, []);

  const onMove = useCallback((e) => {
    if (!dragging.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const svgY = clientY - rect.top;
    const newCum = Math.round(yToPct(svgY));

    const key = dragging.current;
    const idx = ORDER.indexOf(key);
    const nextKey = ORDER[idx + 1];
    if (!nextKey) return;

    setLayers(prev => {
      let below = 0;
      for (let i = 0; i <= idx; i++) below += prev[ORDER[i]];
      const delta = newCum - below;
      const newCur  = Math.max(0, prev[key] + delta);
      const newNext = Math.max(0, prev[nextKey] - delta);
      if (newCur + newNext !== prev[key] + prev[nextKey]) {
        const total = prev[key] + prev[nextKey];
        return { ...prev, [key]: Math.min(total, newCur), [nextKey]: Math.max(0, total - Math.min(total, newCur)) };
      }
      return { ...prev, [key]: newCur, [nextKey]: newNext };
    });
  }, [setLayers]);

  const onUp = useCallback(() => { dragging.current = null; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [onMove, onUp]);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-muted-foreground">Drag the lines to adjust layers</p>
      <svg ref={svgRef} width={200} height={CUP_H + 10} style={{ touchAction: "none", userSelect: "none" }}>
        <defs>
          <clipPath id="cup-clip-pf">
            <polygon points={cupOutlinePoints()} />
          </clipPath>
        </defs>

        {/* Filled layers */}
        <g clipPath="url(#cup-clip-pf)">
          {stacked.map(({ key, pct, startPct }) => {
            if (pct <= 0) return null;
            const def = LAYER_DEFS.find(d => d.key === key);
            return <polygon key={key} points={layerPoints(startPct, pct)} fill={def.fill} />;
          })}
          {/* Shine */}
          <polygon
            points={`${CX - CUP_TOP_W/2 + 4},0 ${CX - CUP_TOP_W/2 + 18},0 ${CX - CUP_BOT_W/2 + 10},${CUP_H} ${CX - CUP_BOT_W/2 + 3},${CUP_H}`}
            fill="white" opacity="0.08" style={{ pointerEvents: "none" }}
          />
        </g>

        {/* Cup outline */}
        <polygon points={cupOutlinePoints()} fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" strokeLinejoin="round" />

        {/* Dividers */}
        {dividers.map(({ key, y, x1, x2 }) => {
          const def = LAYER_DEFS.find(d => d.key === key);
          return (
            <g key={key}>
              <line x1={x1 - 4} y1={y} x2={x2 + 4} y2={y} stroke="transparent" strokeWidth={16}
                style={{ cursor: "ns-resize" }}
                onMouseDown={e => onDividerDown(e, key)}
                onTouchStart={e => onDividerDown(e, key)}
              />
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={def.stroke} strokeWidth={2}
                strokeDasharray="4 3" style={{ pointerEvents: "none" }} />
              <circle cx={x1 - 5} cy={y} r={4} fill={def.stroke} style={{ pointerEvents: "none" }} />
              <circle cx={x2 + 5} cy={y} r={4} fill={def.stroke} style={{ pointerEvents: "none" }} />
            </g>
          );
        })}

        {/* Layer labels */}
        {stacked.map(({ key, pct, startPct }) => {
          if (pct < 8) return null;
          const def = LAYER_DEFS.find(d => d.key === key);
          const y = pctToY(startPct + pct / 2);
          return (
            <text key={key} x={CX} y={y + 4} textAnchor="middle" fontSize={10} fontWeight="600"
              fill={def.stroke} style={{ pointerEvents: "none" }}>
              {def.label} {pct}%
            </text>
          );
        })}

        {/* Steam */}
        {temp === "Hot" && [85, 100, 115].map((x, i) => (
          <motion.path key={i}
            d={`M${x} -4 Q${x + 5} -12 ${x} -20`}
            stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round"
            animate={{ opacity: [0.2, 0.7, 0.2], y: [-1, -5, -1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </svg>

      {/* Layer badges */}
      <div className="flex flex-wrap gap-2 justify-center">
        {LAYER_DEFS.map(def => (
          <div key={def.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: def.fill, border: `1.5px solid ${def.stroke}` }} />
            {def.label}
            <span className="font-mono font-semibold text-foreground">{layers[def.key]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function PreferenceForm({ profile, editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:        editing?.name        || "",
    coffee_type: editing?.coffee_type || "",
    strength:    editing?.strength    || "Regular",
    milk:        editing?.milk        || "None",
    sugar:       editing?.sugar       || "None",
    temperature: editing?.temperature || "Hot",
    notes:       editing?.notes       || "",
    image_url:   editing?.image_url   || "",
    is_default:  editing?.is_default  || false,
  });

  // Derive initial layer percentages from saved form values
  const [layers, setLayers] = useState(() => {
    const hasMilk = editing?.milk && editing.milk !== "None";
    return {
      water:  editing?.water_pct  ?? 0,
      milk:   editing?.milk_pct   ?? (hasMilk ? 25 : 0),
      coffee: editing?.coffee_pct ?? 60,
      foam:   editing?.foam_pct   ?? (hasMilk ? 15 : 40),
    };
  });

  const [saving, setSaving] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  // Sync milk type to form when layer goes to 0
  useEffect(() => {
    if (layers.milk === 0) setForm(f => ({ ...f, milk: "None" }));
    else if (form.milk === "None") setForm(f => ({ ...f, milk: "Whole" }));
  }, [layers.milk]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      profile_id: profile.id,
      user_email: profile.user_email,
      water_pct:  layers.water,
      milk_pct:   layers.milk,
      coffee_pct: layers.coffee,
      foam_pct:   layers.foam,
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
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
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
        className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur px-5 py-4 flex items-center justify-between border-b border-border">
          <h3 className="font-semibold text-lg">{editing ? "Edit Preference" : "New Preference"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">

          {/* ── Visual Cup Editor ── */}
          <div className="bg-muted/30 rounded-2xl py-5 px-3">
            <CoffeeCup layers={layers} setLayers={setLayers} temp={form.temperature} />
          </div>

          {/* ── Sliders for fine control ── */}
          <div className="space-y-2">
            {LAYER_DEFS.map(def => (
              <div key={def.key} className="flex items-center gap-3">
                <span className="w-12 text-xs font-medium text-muted-foreground text-right capitalize">{def.label}</span>
                <input type="range" min={0} max={100} value={layers[def.key]}
                  onChange={e => {
                    const val = Number(e.target.value);
                    const idx = ORDER.indexOf(def.key);
                    const nextKey = ORDER[idx + 1] || ORDER[idx - 1];
                    setLayers(prev => {
                      const diff = val - prev[def.key];
                      const newNext = Math.max(0, prev[nextKey] - diff);
                      const realDiff = prev[nextKey] - newNext;
                      return { ...prev, [def.key]: prev[def.key] + realDiff, [nextKey]: newNext };
                    });
                  }}
                  className="flex-1 accent-amber-600 h-1.5"
                />
                <span className="w-8 text-xs font-mono text-right">{layers[def.key]}%</span>
              </div>
            ))}
          </div>

          {/* ── Image picker ── */}
          <div>
            <Label className="mb-2 block">Coffee Image</Label>
            <button type="button" onClick={() => setShowGallery(true)}
              className="w-full h-28 rounded-2xl overflow-hidden border-2 border-dashed border-border hover:border-amber-400 transition-colors">
              {form.image_url ? (
                <img src={form.image_url} alt="Selected" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <span className="text-2xl mb-1">📷</span>
                  <span className="text-xs">Tap to pick image</span>
                </div>
              )}
            </button>
          </div>

          {/* ── Name & Type ── */}
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

          {/* ── Strength ── */}
          <div>
            <Label className="mb-2 block">Strength</Label>
            <Chip value={form.strength} onChange={v => setForm(f => ({ ...f, strength: v }))} options={STRENGTHS} />
          </div>

          {/* ── Milk ── */}
          <div>
            <Label className="mb-2 block">Milk Type</Label>
            <Chip value={form.milk} onChange={v => {
              setForm(f => ({ ...f, milk: v }));
              if (v !== "None" && layers.milk === 0) setLayers(l => ({ ...l, milk: 20, foam: Math.max(0, l.foam - 20) }));
              if (v === "None") setLayers(l => ({ ...l, milk: 0, coffee: Math.min(100, l.coffee + l.milk) }));
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

          <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl font-semibold bg-primary text-primary-foreground">
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
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageGallery from "./ImageGallery";
import LayerComposer from "./LayerComposer";

const ESPRESSO_DOSES = [
  { value: "1", label: "Single", desc: "1 × 36ml", emoji: "☕", coffeePct: 30 },
  { value: "2", label: "Double", desc: "2 × 36ml", emoji: "☕☕", coffeePct: 50 },
  { value: "3", label: "Triple", desc: "3 × 36ml", emoji: "☕☕☕", coffeePct: 70 },
];
const MILKS     = ["None", "Whole", "Skim", "Oat", "Almond", "Soy", "Coconut"];
const SUGARS    = ["None", "Half", "1 tsp", "2 tsp", "3 tsp"];
const TEMPS     = ["Extra Hot", "Hot", "Warm", "Iced"];

// vessel type: affects shape ratio (top/bottom widths)
const MUG_SVG = (
  <svg viewBox="0 0 56 56" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {/* Steam lines */}
    <path d="M17 12 Q19 8 17 4"/>
    <path d="M23 12 Q25 8 23 4"/>
    {/* Mug body */}
    <rect x="8" y="14" width="28" height="26" rx="3"/>
    {/* Handle */}
    <path d="M36 20 Q46 20 46 27 Q46 34 36 34"/>
    {/* Bottom base */}
    <line x1="8" y1="40" x2="36" y2="40"/>
  </svg>
);
const GLASS_SVG = (
  <svg viewBox="0 0 56 56" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {/* Glass body - slight inward curve at middle */}
    <path d="M10 6 L46 6 L40 50 L16 50 Z"/>
    {/* Vertical ribs */}
    <line x1="20" y1="10" x2="18" y2="46"/>
    <line x1="28" y1="10" x2="28" y2="46"/>
    <line x1="36" y1="10" x2="38" y2="46"/>
    {/* Water line wave */}
    <path d="M14 22 Q19 18 24 22 Q29 26 34 22 Q39 18 43 22"/>
  </svg>
);
const TA_SVG = (
  <svg viewBox="0 0 56 56" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {/* Lid */}
    <rect x="10" y="8" width="36" height="7" rx="3.5"/>
    {/* Lid top bump */}
    <path d="M20 8 Q28 4 36 8"/>
    {/* Cup body */}
    <path d="M13 15 L15 50 L41 50 L43 15 Z"/>
    {/* Circle logo */}
    <circle cx="28" cy="32" r="6"/>
  </svg>
);

const VESSELS = [
  { value: "mug",   label: "Mug",    svg: MUG_SVG,   topW: 140, botW: 130 }, // nearly cylindrical
  { value: "glass", label: "Glass",  svg: GLASS_SVG, topW: 140, botW: 90  }, // wider top, narrower bottom
  { value: "ta",    label: "TA",     svg: TA_SVG,    topW: 120, botW: 80  }, // paper cup taper
];

// size: totalMl = total cup volume, cupH = visual SVG height of the cup
// coffee shot = 36ml fixed. other layers fill the rest proportionally.
const SIZES = [
  { value: "small", label: "Small", totalMl: 150, cupH: 160 },
  { value: "large", label: "Large", totalMl: 300, cupH: 220 },
];

function defaultLayers(editing) {
  return {
    water:  editing?.water_pct  ?? 0,
    milk:   editing?.milk_pct   ?? 20,
    coffee: editing?.coffee_pct ?? 60,
    foam:   editing?.foam_pct   ?? 20,
  };
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

          {/* ── Vessel & Size ── */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="mb-2 block">Cup Type</Label>
              <div className="flex gap-2">
                {VESSELS.map(({ value, label, svg }) => (
                  <button key={value} type="button"
                    onClick={() => setForm(f => ({ ...f, vessel: value }))}
                    className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border-2 transition-all text-xs font-medium ${
                      form.vessel === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}>
                    <span className="mb-0.5">{svg}</span>
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

          {/* ── Visual cup editor ── */}
          <div className="bg-muted/30 rounded-2xl p-4">
            <LayerComposer
              layers={layers}
              onChange={setLayers}
              vessel={form.vessel}
              size={form.size}
              temp={form.temperature}
              milk={form.milk}
              onMilkChange={(v) => setForm(f => ({ ...f, milk: v }))}
            />
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
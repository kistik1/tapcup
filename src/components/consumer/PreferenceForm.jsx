import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageGallery from "./ImageGallery";

const STRENGTHS = ["Light", "Regular", "Strong", "Extra Strong"];
const MILKS = ["None", "Whole", "Skim", "Oat", "Almond", "Soy", "Coconut"];
const SUGARS = ["None", "Half", "1 tsp", "2 tsp", "3 tsp"];
const TEMPS = ["Hot", "Warm", "Iced"];

export default function PreferenceForm({ profile, editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: editing?.name || "",
    coffee_type: editing?.coffee_type || "",
    strength: editing?.strength || "Regular",
    milk: editing?.milk || "None",
    sugar: editing?.sugar || "None",
    temperature: editing?.temperature || "Hot",
    notes: editing?.notes || "",
    image_url: editing?.image_url || "",
    is_default: editing?.is_default || false,
  });
  const [saving, setSaving] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, profile_id: profile.id, user_email: profile.user_email };
    if (editing) {
      await base44.entities.CoffeePreference.update(editing.id, data);
    } else {
      await base44.entities.CoffeePreference.create(data);
    }
    await onSaved();
    onClose();
    setSaving(false);
  }

  function Chip({ label, value, onChange, options }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              value === opt
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
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
        className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur px-5 py-4 flex items-center justify-between border-b border-border">
          <h3 className="font-semibold text-lg">{editing ? "Edit Preference" : "New Preference"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
          {/* Image picker */}
          <div>
            <Label className="mb-2 block">Coffee Image</Label>
            <button
              type="button"
              onClick={() => setShowGallery(true)}
              className="w-full h-36 rounded-2xl overflow-hidden border-2 border-dashed border-border hover:border-amber-400 transition-colors"
            >
              {form.image_url ? (
                <img src={form.image_url} alt="Selected" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <span className="text-3xl mb-1">📷</span>
                  <span className="text-xs">Tap to pick image</span>
                </div>
              )}
            </button>
          </div>

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

          <div>
            <Label className="mb-2 block">Strength</Label>
            <Chip value={form.strength} onChange={v => setForm(f => ({ ...f, strength: v }))} options={STRENGTHS} />
          </div>

          <div>
            <Label className="mb-2 block">Milk</Label>
            <Chip value={form.milk} onChange={v => setForm(f => ({ ...f, milk: v }))} options={MILKS} />
          </div>

          <div>
            <Label className="mb-2 block">Sugar</Label>
            <Chip value={form.sugar} onChange={v => setForm(f => ({ ...f, sugar: v }))} options={SUGARS} />
          </div>

          <div>
            <Label className="mb-2 block">Temperature</Label>
            <Chip value={form.temperature} onChange={v => setForm(f => ({ ...f, temperature: v }))} options={TEMPS} />
          </div>

          <div>
            <Label>Special Notes</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Extra hot, no foam" className="mt-1 h-11 rounded-xl" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, is_default: !f.is_default }))}
              className={`w-10 h-6 rounded-full transition-colors ${form.is_default ? "bg-amber-500" : "bg-muted"}`}
            >
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
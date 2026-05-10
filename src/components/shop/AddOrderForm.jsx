import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddOrderForm({ profile, preferences, shopName = "Coffee Shop", onClose, onSaved }) {
  const defaultPref = preferences.find(p => p.is_default);
  const [selectedPrefId, setSelectedPrefId] = useState(defaultPref?.id || (preferences[0]?.id || ""));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const pref = preferences.find(p => p.id === selectedPrefId);
    await base44.entities.Order.create({
      profile_id: profile.id,
      user_email: profile.user_email,
      preference_id: selectedPrefId || null,
      preference_snapshot: pref || null,
      shop_name: shopName,
      barista_notes: notes,
      status: "Completed",
      ordered_at: new Date().toISOString(),
    });
    onSaved();
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Add Order</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div>
            <Label className="mb-2 block">Preference Used</Label>
            {preferences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No preferences on file</p>
            ) : (
              <div className="flex flex-col gap-2">
                {preferences.map(pref => (
                  <button
                    key={pref.id}
                    type="button"
                    onClick={() => setSelectedPrefId(pref.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selectedPrefId === pref.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {pref.image_url ? (
                      <img src={pref.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">☕</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{pref.name}</p>
                      <p className="text-xs text-muted-foreground">{pref.coffee_type}</p>
                    </div>
                    {pref.is_default && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Default</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Barista Notes (optional)</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Extra shot added"
              className="mt-1 h-11 rounded-xl"
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl font-semibold bg-primary text-primary-foreground">
            {saving ? "Saving..." : "Log Order"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

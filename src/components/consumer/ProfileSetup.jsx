import { useState } from "react";
import { motion } from "framer-motion";
import { Coffee } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfileSetup({ user, onCreated }) {
  const [form, setForm] = useState({
    display_name: user?.full_name || "",
    phone: "",
    nfc_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function generateNfcId() {
    const id = "NFC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setForm(f => ({ ...f, nfc_id: id }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.display_name || !form.nfc_id) {
      setError("Name and NFC ID are required");
      return;
    }
    setSaving(true);
    await base44.entities.CoffeeProfile.create({
      ...form,
      user_email: user.email,
    });
    await onCreated();
    setSaving(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-800 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-playfair text-2xl font-bold">Set Up Your Profile</h2>
          <p className="text-muted-foreground text-sm mt-1">Create your TapCup coffee profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Your Name</Label>
            <Input
              value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              placeholder="e.g. Alex Johnson"
              className="mt-1 h-12 rounded-xl"
            />
          </div>

          <div>
            <Label>Phone (optional)</Label>
            <Input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+1 555 000 0000"
              className="mt-1 h-12 rounded-xl"
            />
          </div>

          <div>
            <Label>NFC ID</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={form.nfc_id}
                onChange={e => setForm(f => ({ ...f, nfc_id: e.target.value }))}
                placeholder="NFC-XXXXXX"
                className="h-12 rounded-xl font-mono"
              />
              <Button type="button" variant="outline" onClick={generateNfcId} className="h-12 px-4 rounded-xl text-xs">
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This ID links to your physical NFC keychain</p>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={saving}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold mt-2"
          >
            {saving ? "Creating..." : "Create Profile"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
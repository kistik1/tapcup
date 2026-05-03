import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function generateNfcId() {
  return "NFC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CreateProfilePrompt({
  prefillPhone = "",
  prefillNfcId = "",
  onCreated,
  onClose,
  title = "Profile Not Found",
  description = "Create a new profile to get started",
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(prefillPhone);
  const [nfcId, setNfcId] = useState(prefillNfcId || generateNfcId());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPhone(prefillPhone || "");
    setNfcId(prefillNfcId || generateNfcId());
    setName("");
    setError("");
  }, [prefillPhone, prefillNfcId]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const profile = await base44.entities.CoffeeProfile.create({
        display_name: name,
        phone,
        nfc_id: nfcId,
        user_email: phone || nfcId,
      });
      onCreated(profile);
    } catch (err) {
      setError(err?.message || "Failed to create profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-6 shadow-2xl"
      >
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-5">{description}</p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="create-profile-name" className="text-sm font-medium">Name</label>
            <Input
              id="create-profile-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              required
              className="mt-1 h-11 rounded-xl"
            />
          </div>

          <div>
            <label htmlFor="create-profile-phone" className="text-sm font-medium">Phone</label>
            <Input
              id="create-profile-phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              className="mt-1 h-11 rounded-xl"
            />
          </div>

          <div>
            <label htmlFor="create-profile-nfc-id" className="text-sm font-medium">Personal ID</label>
            <Input
              id="create-profile-nfc-id"
              value={nfcId}
              onChange={e => setNfcId(e.target.value)}
              placeholder="Personal ID"
              className="mt-1 h-11 rounded-xl font-mono text-sm"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" disabled={saving || !name} className="w-full h-11 rounded-xl">
            {saving ? "Creating..." : "Create Profile"}
          </Button>

          <button type="button" onClick={onClose} className="w-full text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </form>
      </motion.div>
    </div>
  );
}

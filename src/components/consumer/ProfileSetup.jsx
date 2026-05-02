import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Wifi, CheckCircle, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NfcScanOverlay from "@/components/shared/NfcScanOverlay";

export default function ProfileSetup({ user, onCreated }) {
  const [form, setForm] = useState({
    display_name: user?.full_name || "",
    phone: "",
  });
  const [nfcId, setNfcId] = useState("");
  const [nfcStatus, setNfcStatus] = useState("idle"); // idle | waiting | success | error
  const [nfcMessage, setNfcMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleNfcTap() {
    setNfcStatus("waiting");
    setNfcMessage("Generating chip ID for this profile...");
    setTimeout(() => {
      const id = "NFC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      setNfcId(id);
      setNfcStatus("success");
      setNfcMessage("Chip ID generated and ready for the physical tag");
    }, 600);
  }

  function cancelNfcScan() {
    setNfcStatus("idle");
    setNfcMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.display_name) { setError("Name is required"); return; }
    if (!nfcId) { setError("Please tap your NFC keychain first"); return; }
    setSaving(true);
    await base44.entities.CoffeeProfile.create({
      display_name: form.display_name,
      phone: form.phone,
      nfc_id: nfcId,
      user_email: user.email,
    });
    await onCreated();
    setSaving(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <NfcScanOverlay
        visible={nfcStatus === "waiting"}
        onCancel={cancelNfcScan}
        message="Hold your NFC keychain near the top of your device"
      />
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

        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* NFC Tap Section */}
          <div>
            <Label className="mb-3 block">NFC Keychain</Label>

            <AnimatePresence mode="wait">
              {nfcStatus === "idle" && (
                <motion.button
                  key="idle"
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleNfcTap}
                  className="w-full flex flex-col items-center gap-3 py-8 border-2 border-dashed border-border rounded-2xl hover:border-amber-400 hover:bg-amber-50/50 transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Wifi className="w-7 h-7 text-amber-700" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground text-sm">Tap your NFC keychain</p>
                    <p className="text-xs text-muted-foreground mt-0.5">to add it to this profile</p>
                  </div>
                </motion.button>
              )}

              {nfcStatus === "waiting" && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center gap-3 py-8 border-2 border-amber-400 bg-amber-50 rounded-2xl"
                >
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-amber-300 animate-ping opacity-40" />
                    <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                      <Wifi className="w-7 h-7 text-amber-600 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-sm text-amber-700 font-medium">{nfcMessage}</p>
                </motion.div>
              )}

              {nfcStatus === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center gap-3 py-6 border-2 border-emerald-400 bg-emerald-50 rounded-2xl"
                >
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                  <div className="text-center">
                    <p className="font-semibold text-emerald-800 text-sm">Keychain linked!</p>
                    <p className="font-mono text-xs text-emerald-600 mt-1 bg-emerald-100 px-3 py-1 rounded-full">{nfcId}</p>
                    {nfcMessage && (
                      <p className="text-xs text-emerald-600/70 mt-1">{nfcMessage}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setNfcStatus("idle"); setNfcId(""); setNfcMessage(""); }}
                    className="text-xs text-emerald-600 underline"
                  >
                    Tap a different keychain
                  </button>
                </motion.div>
              )}

              {nfcStatus === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center gap-3 py-6 border-2 border-destructive/30 bg-destructive/5 rounded-2xl"
                >
                  <AlertCircle className="w-10 h-10 text-destructive" />
                  <p className="text-sm text-destructive text-center">{nfcMessage}</p>
                  <button
                    type="button"
                    onClick={() => setNfcStatus("idle")}
                    className="text-xs text-destructive/70 underline"
                  >
                    Try again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={saving || !nfcId}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            {saving ? "Creating..." : "Create Profile"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

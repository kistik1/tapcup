import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Wifi, Phone, Search, KeyRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NfcScanOverlay from "@/components/shared/NfcScanOverlay";

export default function IdentifyScreen({ onIdentified }) {
  const [phoneInput, setPhoneInput] = useState("");
  const [nfcInput, setNfcInput] = useState("");
  const [nfcStatus, setNfcStatus] = useState("idle"); // idle | scanning | error
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [notFoundPhone, setNotFoundPhone] = useState("");

  async function lookupByPhone(phone) {
    setError("");
    setSearching(true);
    const results = await base44.entities.CoffeeProfile.filter({ phone });
    setSearching(false);
    if (results.length === 0) {
      setNotFoundPhone(phone);
      setShowCreate(true);
    } else {
      onIdentified(results[0]);
    }
  }

  async function lookupByNfcId(nfcId) {
    setError("");
    const results = await base44.entities.CoffeeProfile.filter({ nfc_id: nfcId });
    if (results.length === 0) {
      setNotFoundPhone("");
      setShowCreate(true);
    } else {
      onIdentified(results[0]);
    }
  }

  async function startNfcScan() {
    if (!("NDEFReader" in window)) {
      setError("Web NFC is not supported on this device/browser. Use manual entry.");
      return;
    }
    try {
      setNfcStatus("scanning");
      setError("");
      const ndef = new window.NDEFReader();
      await ndef.scan();
      ndef.addEventListener("reading", async ({ serialNumber, message }) => {
        let id = null;
        for (const record of message.records) {
          if (record.recordType === "text") {
            const text = new TextDecoder().decode(record.data);
            if (text.startsWith("TAPCUP:")) { id = text.replace("TAPCUP:", ""); break; }
          }
        }
        if (!id && serialNumber) {
          id = "NFC-" + serialNumber.replace(/:/g, "").substring(0, 6).toUpperCase();
        }
        if (id) {
          setNfcStatus("idle");
          await lookupByNfcId(id);
        }
      });
      ndef.addEventListener("readingerror", () => {
        setNfcStatus("error");
        setError("Could not read NFC tag. Please try again.");
      });
    } catch (err) {
      setNfcStatus("idle");
      setError(err.message || "NFC scan failed.");
    }
  }

  async function handleManualNfc() {
    const q = nfcInput.trim();
    if (!q) return;
    setSearching(true);
    await lookupByNfcId(q);
    setSearching(false);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <NfcScanOverlay
        visible={nfcStatus === "scanning"}
        onCancel={() => { setNfcStatus("idle"); setError(""); }}
        message="Hold your NFC keychain near the top of your device"
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-800 to-amber-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Coffee className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-playfair text-2xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground text-sm mt-1">Identify yourself to access your profile</p>
      </motion.div>

      <div className="w-full max-w-sm space-y-6">
        {/* NFC Tap */}
        <motion.button
          onClick={startNfcScan}
          disabled={nfcStatus === "scanning"}
          whileTap={{ scale: 0.97 }}
          className={`relative w-full flex flex-col items-center justify-center gap-4 py-10 rounded-2xl border-2 transition-all cursor-pointer select-none
            ${nfcStatus === "scanning"
              ? "border-amber-400 bg-amber-50"
              : "border-border bg-card hover:border-amber-400 hover:bg-amber-50/40"
            }`}
        >
          {nfcStatus === "scanning" && (
            <div className="absolute inset-0 rounded-2xl border-4 border-amber-400 animate-ping opacity-20" />
          )}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${nfcStatus === "scanning" ? "bg-amber-100" : "bg-muted"}`}>
            <Wifi className={`w-8 h-8 ${nfcStatus === "scanning" ? "text-amber-600 animate-pulse" : "text-muted-foreground"}`} />
          </div>
          <div className="text-center">
            <p className="font-bold">{nfcStatus === "scanning" ? "Scanning..." : "Tap NFC"}</p>
            <p className="text-sm text-muted-foreground">Hold your NFC keychain near the device</p>
          </div>
        </motion.button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Phone input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">Phone Number</span>
          </div>
          <Input
            value={phoneInput}
            onChange={e => setPhoneInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && lookupByPhone(phoneInput.trim())}
            placeholder="+972 50 000 0000"
            type="tel"
            className="h-11 rounded-xl"
          />
          <Button
            onClick={() => lookupByPhone(phoneInput.trim())}
            disabled={searching || !phoneInput.trim()}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground"
          >
            {searching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Search className="w-4 h-4 mr-1" /> Sign In</>

            )}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or manual NFC ID</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Manual NFC ID */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">NFC ID</span>
          </div>
          <Input
            value={nfcInput}
            onChange={e => setNfcInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleManualNfc()}
            placeholder="NFC-ABC123"
            className="h-11 rounded-xl font-mono text-sm"
          />
          <Button
            onClick={handleManualNfc}
            disabled={searching || !nfcInput.trim()}
            variant="outline"
            className="w-full h-11 rounded-xl"
          >
            {searching ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Search className="w-4 h-4 mr-1" /> Search by NFC ID</>

            )}
          </Button>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm text-center">
            {error}
          </motion.p>
        )}
      </div>

      {/* Create profile modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateProfilePrompt
            prefillPhone={notFoundPhone}
            onCreated={onIdentified}
            onClose={() => setShowCreate(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline mini-form for creating a new profile
function CreateProfilePrompt({ prefillPhone, onCreated, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(prefillPhone || "");
  const [nfcId] = useState("NFC-" + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [saving, setSaving] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    const profile = await base44.entities.CoffeeProfile.create({
      display_name: name,
      phone,
      nfc_id: nfcId,
      user_email: phone || nfcId,
    });
    onCreated(profile);
    setSaving(false);
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
        <h3 className="font-semibold text-lg mb-1">Profile Not Found</h3>
        <p className="text-sm text-muted-foreground mb-5">Create a new profile to get started</p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              required
              className="mt-1 w-full h-11 px-3 rounded-xl border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              className="mt-1 w-full h-11 px-3 rounded-xl border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <p className="text-xs text-muted-foreground font-mono">NFC ID: {nfcId}</p>
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
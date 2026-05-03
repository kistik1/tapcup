import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Coffee, Phone, Search, KeyRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CreateProfilePrompt from "@/components/consumer/CreateProfilePrompt";
import NfcScanOverlay from "@/components/shared/NfcScanOverlay";
import { getSavedPersonalId, setSavedPersonalId } from "@/lib/personal-id";

export default function IdentifyScreen({ onIdentified }) {
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState("");
  const [nfcInput, setNfcInput] = useState("");
  const [nfcLoading, setNfcLoading] = useState(false);
  const [scanVisible, setScanVisible] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [createSeed, setCreateSeed] = useState(null);
  const scanTimerRef = useRef(null);

  function clearScanTimer() {
    if (scanTimerRef.current) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }

  async function lookupByPhone(phone) {
    setError("");
    setSearching(true);
    try {
      const results = await base44.entities.CoffeeProfile.filter({ phone });
      if (results.length === 0) {
        setCreateSeed({ prefillPhone: phone, prefillNfcId: "" });
      } else {
        setSavedPersonalId(results[0].nfc_id);
        onIdentified(results[0]);
      }
    } catch (err) {
      setError(err?.message || "Unable to look up profile");
    } finally {
      setSearching(false);
    }
  }

  async function lookupByNfcId(nfcId) {
    setError("");
    try {
      const results = await base44.entities.CoffeeProfile.filter({ nfc_id: nfcId });
      if (results.length === 0) {
        setCreateSeed({ prefillPhone: "", prefillNfcId: nfcId });
      } else {
        setSavedPersonalId(results[0].nfc_id);
        onIdentified(results[0]);
      }
    } catch (err) {
      setError(err?.message || "Unable to look up profile");
    }
  }

  async function openSavedChip() {
    setError("");
    clearScanTimer();
    setScanMessage("Waiting for NFC scan...");
    setScanVisible(true);
    setNfcLoading(true);

    scanTimerRef.current = window.setTimeout(() => {
      const savedPersonalId = getSavedPersonalId();
      if (!savedPersonalId) {
        setScanMessage("No saved chip ID yet. Tap X to exit or use phone/manual NFC ID below.");
        return;
      }

      setScanMessage("NFC detected. Redirecting...");
      navigate(`/consumer?personal_id=${encodeURIComponent(savedPersonalId)}`, { replace: true });
    }, 20000);
  }

  async function handleManualNfc() {
    const q = nfcInput.trim();
    if (!q) return;
    setSearching(true);
    try {
      await lookupByNfcId(q);
    } finally {
      setSearching(false);
    }
  }

  function closeScanOverlay() {
    clearScanTimer();
    setScanVisible(false);
    setScanMessage("");
    setNfcLoading(false);
  }

  useEffect(() => {
    return () => {
      clearScanTimer();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <NfcScanOverlay
        visible={scanVisible}
        onCancel={closeScanOverlay}
        message={scanMessage || "Hold the NFC keychain near the top of your device"}
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
          onClick={openSavedChip}
          disabled={nfcLoading}
          data-testid="consumer-tap-nfc"
          whileTap={{ scale: 0.97 }}
          className={`relative w-full flex flex-col items-center justify-center gap-4 py-10 rounded-2xl border-2 transition-all cursor-pointer select-none
            ${nfcLoading
              ? "border-amber-400 bg-amber-50"
              : "border-border bg-card hover:border-amber-400 hover:bg-amber-50/40"
            }`}
        >
          {nfcLoading && (
            <div className="absolute inset-0 rounded-2xl border-4 border-amber-400 animate-ping opacity-20" />
          )}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${nfcLoading ? "bg-amber-100" : "bg-muted"}`}>
            <span className={`text-2xl ${nfcLoading ? "animate-pulse" : ""}`}>↗</span>
          </div>
          <div className="text-center">
            <p className="font-bold">{nfcLoading ? "Redirecting..." : "Tap NFC"}</p>
            <p className="text-sm text-muted-foreground">
              {nfcLoading ? "Opening the saved chip link" : "Use the stored personal ID"}
            </p>
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
            placeholder="Personal ID"
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

      {createSeed && (
        <CreateProfilePrompt
          prefillPhone={createSeed.prefillPhone}
          prefillNfcId={createSeed.prefillNfcId}
          onCreated={(profile) => {
            setCreateSeed(null);
            setSavedPersonalId(profile.nfc_id);
            onIdentified(profile);
          }}
          onClose={() => setCreateSeed(null)}
        />
      )}
    </div>
  );
}

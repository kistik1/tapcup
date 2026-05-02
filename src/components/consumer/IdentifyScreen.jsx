import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Coffee, Wifi, Phone, Search, KeyRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingOverlay from "@/components/shared/LoadingOverlay";
import CreateProfilePrompt from "@/components/consumer/CreateProfilePrompt";

export default function IdentifyScreen({ onIdentified }) {
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState("");
  const [nfcInput, setNfcInput] = useState("");
  const [nfcStatus, setNfcStatus] = useState("idle"); // idle | loading | scanning | error
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [createSeed, setCreateSeed] = useState(null);
  const scanSessionRef = useRef(0);

  async function lookupByPhone(phone) {
    setError("");
    setSearching(true);
    try {
      const results = await base44.entities.CoffeeProfile.filter({ phone });
      if (results.length === 0) {
        setCreateSeed({ prefillPhone: phone, prefillNfcId: "" });
      } else {
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
        onIdentified(results[0]);
      }
    } catch (err) {
      setError(err?.message || "Unable to look up profile");
    }
  }

  async function startNfcScan() {
    if (!("NDEFReader" in window)) {
      setError("Web NFC is not supported on this device/browser. Use manual entry.");
      return;
    }
    try {
      const sessionId = ++scanSessionRef.current;
      setNfcStatus("loading");
      setError("");
      const ndef = new window.NDEFReader();
      await ndef.scan();
      if (scanSessionRef.current !== sessionId) return;
      setNfcStatus("scanning");

      ndef.addEventListener("reading", async ({ serialNumber, message }) => {
        if (scanSessionRef.current !== sessionId) return;

        let personalId = null;
        for (const record of message.records) {
          if (record.recordType === "text") {
            const text = new TextDecoder().decode(record.data).trim();
            if (text.startsWith("TAPCUP:")) {
              personalId = text.replace("TAPCUP:", "").trim();
            } else if (text) {
              personalId = text;
            }
            if (personalId) {
              break;
            }
          }
        }

        if (!personalId && serialNumber) {
          personalId = "NFC-" + serialNumber.replace(/:/g, "").substring(0, 6).toUpperCase();
        }

        if (!personalId) {
          setNfcStatus("error");
          setError("Could not read NFC tag. Please try again.");
          return;
        }

        setNfcStatus("idle");
        navigate(`/consumer?personal_id=${encodeURIComponent(personalId)}`, { replace: true });
      });

      ndef.addEventListener("readingerror", () => {
        if (scanSessionRef.current !== sessionId) return;
        setNfcStatus("error");
        setError("Could not read NFC tag. Please try again.");
      });
    } catch (err) {
      scanSessionRef.current += 1;
      setNfcStatus("idle");
      setError(err.message || "NFC scan failed.");
    }
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <LoadingOverlay
        visible={nfcStatus === "loading" || nfcStatus === "scanning"}
        title={nfcStatus === "loading" ? "Preparing NFC reader" : "Scanning NFC tag"}
        message={nfcStatus === "loading"
          ? "Please wait while we open the reader."
          : "Hold your NFC keychain near the top of your device."}
        onCancel={() => {
          scanSessionRef.current += 1;
          setNfcStatus("idle");
          setError("");
        }}
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
          disabled={nfcStatus === "loading" || nfcStatus === "scanning"}
          whileTap={{ scale: 0.97 }}
          className={`relative w-full flex flex-col items-center justify-center gap-4 py-10 rounded-2xl border-2 transition-all cursor-pointer select-none
            ${nfcStatus === "loading" || nfcStatus === "scanning"
              ? "border-amber-400 bg-amber-50"
              : "border-border bg-card hover:border-amber-400 hover:bg-amber-50/40"
            }`}
        >
          {(nfcStatus === "loading" || nfcStatus === "scanning") && (
            <div className="absolute inset-0 rounded-2xl border-4 border-amber-400 animate-ping opacity-20" />
          )}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${(nfcStatus === "loading" || nfcStatus === "scanning") ? "bg-amber-100" : "bg-muted"}`}>
            <Wifi className={`w-8 h-8 ${(nfcStatus === "loading" || nfcStatus === "scanning") ? "text-amber-600 animate-pulse" : "text-muted-foreground"}`} />
          </div>
          <div className="text-center">
            <p className="font-bold">
              {nfcStatus === "loading"
                ? "Loading..."
                : nfcStatus === "scanning"
                  ? "Scanning..."
                  : "Tap NFC"}
            </p>
            <p className="text-sm text-muted-foreground">
              {nfcStatus === "loading"
                ? "Opening the NFC reader"
                : "Hold your NFC keychain near the device"}
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

      {createSeed && (
        <CreateProfilePrompt
          prefillPhone={createSeed.prefillPhone}
          prefillNfcId={createSeed.prefillNfcId}
          onCreated={(profile) => {
            setCreateSeed(null);
            onIdentified(profile);
          }}
          onClose={() => setCreateSeed(null)}
        />
      )}
    </div>
  );
}

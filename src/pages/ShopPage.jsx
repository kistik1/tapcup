import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Wifi, Search, KeyRound, Phone, Settings } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomerProfileView from "@/components/shop/CustomerProfileView";
import NfcScanOverlay from "@/components/shared/NfcScanOverlay";
import CupSizeManager from "@/components/shop/CupSizeManager";

export default function ShopPage() {
  const [manualInput, setManualInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [phoneSearching, setPhoneSearching] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState("");
  const [nfcStatus, setNfcStatus] = useState("idle"); // idle | scanning | error
  const [showSettings, setShowSettings] = useState(false);
  const [shopId, setShopId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => { if (u) setShopId(u.email); }).catch(() => {});
  }, []);

  async function lookupByNfcId(nfcId) {
    setError("");
    setCustomer(null);
    const results = await base44.entities.CoffeeProfile.filter({ nfc_id: nfcId });
    if (results.length === 0) {
      setError("No customer found with that NFC ID");
    } else {
      setCustomer(results[0]);
    }
  }

  async function lookupByPhone(phone) {
    setError("");
    setCustomer(null);
    const results = await base44.entities.CoffeeProfile.filter({ phone });
    if (results.length === 0) {
      setError("No customer found with that phone number");
    } else {
      setCustomer(results[0]);
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
      // Overlay is now shown — NFC reader is active

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
        setError("Could not read NFC tag. Try again.");
      });

    } catch (err) {
      setNfcStatus("idle");
      setError(err.message || "NFC scan failed.");
    }
  }

  function cancelNfcScan() {
    setNfcStatus("idle");
    setError("");
  }

  async function handleManualSearch() {
    const q = manualInput.trim();
    if (!q) return;
    setScanning(true);
    await lookupByNfcId(q);
    setScanning(false);
  }

  async function handlePhoneSearch() {
    const q = phoneInput.trim();
    if (!q) return;
    setPhoneSearching(true);
    await lookupByPhone(q);
    setPhoneSearching(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <NfcScanOverlay
        visible={nfcStatus === "scanning"}
        onCancel={cancelNfcScan}
        message="Hold the customer's NFC keychain near the top of your device"
      />
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <Wifi className="w-5 h-5 text-primary" />
          <span className="font-semibold">Coffee Shop</span>
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className={`p-2 rounded-xl transition-colors ${showSettings ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          title="Cup Size Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Cup Size Settings Panel */}
      <AnimatePresence>
        {showSettings && shopId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-border bg-muted/20"
          >
            <div className="max-w-lg mx-auto px-4 py-5">
              <CupSizeManager shopId={shopId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!customer ? (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col md:flex-row min-h-[calc(100vh-56px)]"
          >
            {/* Main: NFC Scan */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
              <motion.button
                onClick={startNfcScan}
                disabled={nfcStatus === "scanning"}
                whileTap={{ scale: 0.97 }}
                className={`relative flex flex-col items-center justify-center gap-6 w-64 h-64 rounded-full border-4 transition-all shadow-xl cursor-pointer select-none
                  ${nfcStatus === "scanning"
                    ? "border-amber-400 bg-amber-50"
                    : "border-border bg-card hover:border-amber-400 hover:bg-amber-50/40"
                  }`}
              >
                {nfcStatus === "scanning" && (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-amber-400 animate-ping opacity-20" />
                    <div className="absolute inset-4 rounded-full border-2 border-amber-300 animate-ping opacity-15" />
                  </>
                )}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors
                  ${nfcStatus === "scanning" ? "bg-amber-100" : "bg-muted"}`}>
                  <Wifi className={`w-12 h-12 transition-colors ${nfcStatus === "scanning" ? "text-amber-600 animate-pulse" : "text-muted-foreground"}`} />
                </div>
                <div className="text-center px-4">
                  <p className="font-bold text-lg leading-tight">
                    {nfcStatus === "scanning" ? "Scanning..." : "Tap to Scan"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {nfcStatus === "scanning" ? "Hold NFC keychain near device" : "Hold customer's NFC keychain"}
                  </p>
                </div>
              </motion.button>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-destructive text-sm mt-6 text-center max-w-xs"
                >
                  {error}
                </motion.p>
              )}
            </div>

            {/* Sidebar: Manual Entry */}
            <div className="md:w-80 border-t md:border-t-0 md:border-l border-border bg-muted/30 p-6 flex flex-col justify-center gap-6">
              {/* NFC ID lookup */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">NFC ID</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    value={manualInput}
                    onChange={e => setManualInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleManualSearch()}
                    placeholder="NFC-ABC123"
                    className="h-11 rounded-xl font-mono text-sm"
                  />
                  <Button
                    onClick={handleManualSearch}
                    disabled={scanning || !manualInput.trim()}
                    className="h-11 rounded-xl bg-primary text-primary-foreground"
                  >
                    {scanning ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Search className="w-4 h-4 mr-1" /> Search by NFC</>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Phone number lookup */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Phone Number</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handlePhoneSearch()}
                    placeholder="+1 555 000 0000"
                    type="tel"
                    className="h-11 rounded-xl text-sm"
                  />
                  <Button
                    onClick={handlePhoneSearch}
                    disabled={phoneSearching || !phoneInput.trim()}
                    variant="outline"
                    className="h-11 rounded-xl"
                  >
                    {phoneSearching ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Search className="w-4 h-4 mr-1" /> Search by Phone</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-lg mx-auto px-4 pt-8 pb-24"
          >
            <button
              onClick={() => { setCustomer(null); setManualInput(""); setPhoneInput(""); setError(""); setNfcStatus("idle"); }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Scan again
            </button>
            <CustomerProfileView profile={customer} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
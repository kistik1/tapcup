import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Link2, Search, KeyRound, Phone, Settings } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomerProfileView from "@/components/shop/CustomerProfileView";
import NfcScanOverlay from "@/components/shared/NfcScanOverlay";
import useAutoDismissOnHidden from "@/components/shared/use-auto-dismiss-on-hidden";
import ShopLoginGate from "@/components/shop/ShopLoginGate";
import { assignChipToProfile } from "@/lib/chip-assignment";
import { buildCanonicalChipUrl, generatePersonalId, getSavedPersonalId, setCachedRoleContext, setSavedPersonalId } from "@/lib/personal-id";
import { isSimulatorMode } from "@/lib/simulator/runtime";

export default function ShopPage() {
  return (
    <ShopLoginGate>
      {({ shop, onSignOut }) => (
        <ShopExperience shop={shop} onSignOut={onSignOut} />
      )}
    </ShopLoginGate>
  );
}

function ShopExperience({ shop, onSignOut }) {
  const [searchParams] = useSearchParams();
  const personalId = searchParams.get("personal_id");
  const [manualInput, setManualInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [resolving, setResolving] = useState(false);
  const [scanVisible, setScanVisible] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [phoneSearching, setPhoneSearching] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState("");
  const [scanInProgress, setScanInProgress] = useState(false);
  const resolveTimerRef = useRef(null);

  const [chipMgmtId, setChipMgmtId] = useState(() => generatePersonalId());
  const [chipMgmtPhone, setChipMgmtPhone] = useState("");
  const [chipMgmtProfile, setChipMgmtProfile] = useState(null);
  const [chipMgmtSaving, setChipMgmtSaving] = useState(false);
  const [chipMgmtMessage, setChipMgmtMessage] = useState("");
  const [chipMgmtConflict, setChipMgmtConflict] = useState(null);
  const [chipMgmtSearching, setChipMgmtSearching] = useState(false);

  function clearResolveTimer() {
    if (resolveTimerRef.current) {
      window.clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = null;
    }
  }

  async function lookupByNfcId(nfcId) {
    setError("");
    setCustomer(null);
    const results = await base44.entities.CoffeeProfile.filter({ nfc_id: nfcId });
    if (results.length === 0) {
      setError("No customer found with that NFC ID");
      return null;
    } else {
      setSavedPersonalId(results[0].nfc_id);
      setCustomer(results[0]);
      return results[0];
    }
  }

  async function lookupByPhone(phone) {
    setError("");
    setCustomer(null);
    const results = await base44.entities.CoffeeProfile.filter({ phone });
    if (results.length === 0) {
      setError("No customer found with that phone number");
      return null;
    } else {
      setSavedPersonalId(results[0].nfc_id);
      setCustomer(results[0]);
      return results[0];
    }
  }

  async function resolveChipLink() {
    clearResolveTimer();
    setResolving(true);
    setError("");
    setScanMessage("Waiting for NFC scan...");
    setScanVisible(true);
    setScanInProgress(true);
    resolveTimerRef.current = window.setTimeout(async () => {
      try {
        const savedPersonalId = getSavedPersonalId();
        if (!savedPersonalId) {
          setScanMessage("No saved chip ID yet. Tap X to close or use manual NFC ID/phone.");
          setScanInProgress(false);
          return;
        }

        const result = await lookupByNfcId(savedPersonalId);
        if (result) {
          setScanMessage("NFC detected. Opening customer profile...");
          setScanVisible(false);
          setScanInProgress(false);
        } else {
          setScanMessage("No customer found. Tap X to close or use manual NFC ID/phone.");
          setScanInProgress(false);
        }
      } finally {
        resolveTimerRef.current = null;
        setResolving(false);
      }
    }, 20000);
  }

  async function handleManualSearch() {
    const q = manualInput.trim();
    if (!q) return;
    setResolving(true);
    try {
      await lookupByNfcId(q);
    } finally {
      setResolving(false);
    }
  }

  async function handlePhoneSearch() {
    const q = phoneInput.trim();
    if (!q) return;
    setPhoneSearching(true);
    try {
      await lookupByPhone(q);
    } finally {
      setPhoneSearching(false);
    }
  }

  async function handleChipMgmtPhoneSearch() {
    const q = chipMgmtPhone.trim();
    if (!q) return;
    setChipMgmtSearching(true);
    setChipMgmtProfile(null);
    setChipMgmtMessage("");
    setChipMgmtConflict(null);
    try {
      const results = await base44.entities.CoffeeProfile.filter({ phone: q });
      if (results.length === 0) {
        setChipMgmtMessage("No customer found with that phone number.");
      } else {
        setChipMgmtProfile(results[0]);
      }
    } finally {
      setChipMgmtSearching(false);
    }
  }

  async function handleChipMgmtAssign(confirmedReassignment = false) {
    if (!chipMgmtProfile) return;
    setChipMgmtSaving(true);
    setChipMgmtMessage("");
    setChipMgmtConflict(null);
    try {
      const result = await assignChipToProfile({
        profile: chipMgmtProfile,
        personalId: chipMgmtId,
        actorRole: "shop",
        actorLabel: shop?.name || "Coffee Shop",
        confirmedReassignment,
      });
      setCustomer(result.profile);
    } catch (err) {
      if (err.code === "chip_conflict") {
        setChipMgmtConflict(err.profile);
      } else {
        setChipMgmtMessage(err?.message || "Failed to assign chip.");
      }
    } finally {
      setChipMgmtSaving(false);
    }
  }

  function closeScanOverlay() {
    clearResolveTimer();
    setScanVisible(false);
    setScanMessage("");
    setResolving(false);
    setScanInProgress(false);
  }

  useAutoDismissOnHidden(scanInProgress, closeScanOverlay);

  useEffect(() => {
    setCachedRoleContext("shop", "/shop");
    return () => {
      clearResolveTimer();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveIncomingPersonalId() {
      if (!personalId) return;
      setManualInput(personalId);
      setResolving(true);
      setError("");
      try {
        const results = await base44.entities.CoffeeProfile.filter({ nfc_id: personalId });
        if (cancelled) return;
        if (results.length === 0) {
          setCustomer(null);
          setError("No customer found with that personal ID");
          setScanInProgress(false);
          return;
        }
        setSavedPersonalId(results[0].nfc_id);
        setCustomer(results[0]);
        setScanInProgress(false);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to resolve personal ID");
      } finally {
        if (!cancelled) setResolving(false);
      }
    }

    resolveIncomingPersonalId();

    return () => {
      cancelled = true;
    };
  }, [personalId]);

  return (
    <div className="min-h-screen bg-background">
      <NfcScanOverlay
        visible={scanVisible}
        onCancel={closeScanOverlay}
        message={scanMessage || "Hold the NFC keychain near the top of your device"}
      />
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <Link2 className="w-5 h-5 text-primary" />
          <div className="min-w-0">
            <span className="font-semibold block truncate">{shop?.name || "Coffee Shop"}</span>
            {shop?.login_username && (
              <span className="text-xs text-muted-foreground block truncate">@{shop.login_username}</span>
            )}
          </div>
        </div>
        <Button type="button" variant="outline" onClick={onSignOut} className="ml-auto h-9 rounded-xl px-3 text-xs">
          Sign Out
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {!customer ? (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col md:flex-row min-h-[calc(100vh-56px)]"
          >
            {/* Main: ID Resolve */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
              <motion.button
                onClick={resolveChipLink}
                disabled={resolving}
                data-testid="shop-tap-nfc"
                whileTap={{ scale: 0.97 }}
                className={`relative flex flex-col items-center justify-center gap-6 w-64 h-64 rounded-full border-4 transition-all shadow-xl cursor-pointer select-none
                  ${resolving
                    ? "border-amber-400 bg-amber-50"
                    : "border-border bg-card hover:border-amber-400 hover:bg-amber-50/40"
                  }`}
              >
                {resolving && (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-amber-400 animate-ping opacity-20" />
                    <div className="absolute inset-4 rounded-full border-2 border-amber-300 animate-ping opacity-15" />
                  </>
                )}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors
                  ${resolving ? "bg-amber-100" : "bg-muted"}`}>
                  <Link2 className={`w-12 h-12 transition-colors ${resolving ? "text-amber-600 animate-pulse" : "text-muted-foreground"}`} />
                </div>
                <div className="text-center px-4">
                  <p className="font-bold text-lg leading-tight">
                    {resolving ? "Redirecting..." : "Tap NFC"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {resolving ? "Opening the chip-linked customer record" : "Use the stored personal ID"}
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
              {!isSimulatorMode && (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Shop Settings</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Manage the shop's shared username and password in Settings.
                  </p>
                  <Button asChild variant="outline" className="h-10 rounded-xl w-full">
                    <Link to="/settings">Open Settings</Link>
                  </Button>
                </div>
              )}

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
                    placeholder="Personal ID"
                    className="h-11 rounded-xl font-mono text-sm"
                  />
                  <Button
                    onClick={handleManualSearch}
                    disabled={resolving || !manualInput.trim()}
                    className="h-11 rounded-xl bg-primary text-primary-foreground"
                  >
                    {resolving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Search className="w-4 h-4 mr-1" /> Resolve ID</>
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

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">chip setup</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Chip Management */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-semibold">Set Up New Chip</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Personal ID</label>
                  <div className="flex gap-2 mt-1">
                    <p
                      data-testid="shop-chip-mgmt-personal-id"
                      className="flex-1 text-xs font-mono bg-muted rounded-xl px-3 py-2 break-all"
                    >
                      {chipMgmtId}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      data-testid="shop-chip-mgmt-generate"
                      onClick={() => {
                        setChipMgmtId(generatePersonalId());
                        setChipMgmtProfile(null);
                        setChipMgmtMessage("");
                        setChipMgmtConflict(null);
                      }}
                      className="h-9 rounded-xl px-3 shrink-0"
                    >
                      ↻
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Chip URL</label>
                  <p className="mt-1 text-[10px] font-mono break-all text-muted-foreground bg-muted rounded-xl px-3 py-2">
                    {buildCanonicalChipUrl(chipMgmtId)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={chipMgmtPhone}
                    onChange={e => { setChipMgmtPhone(e.target.value); setChipMgmtProfile(null); setChipMgmtMessage(""); }}
                    onKeyDown={e => e.key === "Enter" && handleChipMgmtPhoneSearch()}
                    placeholder="Customer phone"
                    type="tel"
                    className="h-9 rounded-xl text-sm"
                    data-testid="shop-chip-mgmt-phone"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleChipMgmtPhoneSearch}
                    disabled={chipMgmtSearching || !chipMgmtPhone.trim()}
                    className="h-9 rounded-xl px-3 shrink-0"
                  >
                    {chipMgmtSearching
                      ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      : <Search className="w-3 h-3" />
                    }
                  </Button>
                </div>

                {chipMgmtProfile && (
                  <div className="rounded-xl bg-muted px-3 py-2 text-sm">
                    <p className="font-medium" data-testid="shop-chip-mgmt-found-name">{chipMgmtProfile.display_name}</p>
                    <p className="text-xs text-muted-foreground">{chipMgmtProfile.phone}</p>
                  </div>
                )}

                {chipMgmtConflict && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-900">
                      This chip is assigned to {chipMgmtConflict.display_name}.
                    </p>
                    <p className="text-xs text-amber-800 mt-1">
                      Confirming will move the chip here and give the old profile a replacement ID.
                    </p>
                    <Button
                      type="button"
                      onClick={() => handleChipMgmtAssign(true)}
                      disabled={chipMgmtSaving}
                      className="mt-2 h-8 rounded-xl bg-amber-700 text-white hover:bg-amber-800 text-xs"
                    >
                      Confirm reassignment
                    </Button>
                  </div>
                )}

                {chipMgmtMessage && (
                  <p className="text-xs text-muted-foreground">{chipMgmtMessage}</p>
                )}

                <Button
                  type="button"
                  onClick={() => handleChipMgmtAssign(false)}
                  disabled={chipMgmtSaving || !chipMgmtProfile}
                  className="w-full h-9 rounded-xl text-sm"
                  data-testid="shop-chip-mgmt-assign"
                >
                  {chipMgmtSaving ? "Assigning..." : "Confirm Assign"}
                </Button>
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
              onClick={() => { setCustomer(null); setManualInput(""); setPhoneInput(""); setError(""); }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Scan again
            </button>
            <CustomerProfileView
              profile={customer}
              enableChipSetup
              shopName={shop?.name || "Coffee Shop"}
              onProfileUpdated={(updatedProfile) => setCustomer(updatedProfile)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

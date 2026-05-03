import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Link2, Search, KeyRound, Phone, Settings } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomerProfileView from "@/components/shop/CustomerProfileView";
import NfcScanOverlay from "@/components/shared/NfcScanOverlay";
import ShopLoginGate from "@/components/shop/ShopLoginGate";
import { getSavedPersonalId, setCachedRoleContext, setSavedPersonalId } from "@/lib/personal-id";
import { isSimulatorMode } from "@/lib/simulator/runtime";

export default function ShopPage() {
  return (
    <ShopLoginGate>
      {({ shop, onShopUpdated, onSignOut }) => (
        <ShopExperience shop={shop} onShopUpdated={onShopUpdated} onSignOut={onSignOut} />
      )}
    </ShopLoginGate>
  );
}

function ShopExperience({ shop, onShopUpdated, onSignOut }) {
  const [searchParams] = useSearchParams();
  const personalId = searchParams.get("personal_id");
  const [manualInput, setManualInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [usernameInput, setUsernameInput] = useState(shop?.login_username || "");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState("");
  const [resolving, setResolving] = useState(false);
  const [scanVisible, setScanVisible] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [phoneSearching, setPhoneSearching] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState("");
  const resolveTimerRef = useRef(null);

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
    resolveTimerRef.current = window.setTimeout(async () => {
      try {
        const savedPersonalId = getSavedPersonalId();
        if (!savedPersonalId) {
          setScanMessage("No saved chip ID yet. Tap X to close or use manual NFC ID/phone.");
          return;
        }

        const result = await lookupByNfcId(savedPersonalId);
        if (result) {
          setScanMessage("NFC detected. Opening customer profile...");
          setScanVisible(false);
        } else {
          setScanMessage("No customer found. Tap X to close or use manual NFC ID/phone.");
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

  async function createAuditLog(action, entityType, entityId, details = {}) {
    if (!base44.entities.AdminAuditLog) return;
    await base44.entities.AdminAuditLog.create({
      actor_role: "shop",
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
    });
  }

  async function handleUsernameUpdate(event) {
    event.preventDefault();
    const nextUsername = usernameInput.trim();
    if (!nextUsername || nextUsername === shop.login_username) return;

    setUsernameSaving(true);
    setUsernameMessage("");
    setError("");

    try {
      const duplicates = await base44.entities.Shop.filter({ login_username: nextUsername });
      const duplicate = duplicates.find((record) => record.id !== shop.id && record.status !== "inactive");
      if (duplicate) {
        setError("That username is already used by another shop.");
        return;
      }

      const updatedShop = await base44.entities.Shop.update(shop.id, {
        login_username: nextUsername,
        credentials_updated_at: new Date().toISOString(),
        username_updated_by_role: "shop",
      });
      await createAuditLog("shop_update_username", "Shop", shop.id, {
        previous_username: shop.login_username,
        next_username: nextUsername,
      });
      onShopUpdated(updatedShop);
      setUsernameMessage("Username updated.");
    } catch (err) {
      setError(err?.message || "Unable to update username.");
    } finally {
      setUsernameSaving(false);
    }
  }

  function closeScanOverlay() {
    clearResolveTimer();
    setScanVisible(false);
    setScanMessage("");
    setResolving(false);
  }

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
          return;
        }
        setSavedPersonalId(results[0].nfc_id);
        setCustomer(results[0]);
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
                <form onSubmit={handleUsernameUpdate} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Shop Username</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Input
                      value={usernameInput}
                      onChange={(event) => {
                        setUsernameInput(event.target.value);
                        setUsernameMessage("");
                      }}
                      placeholder="Username"
                      className="h-10 rounded-xl text-sm"
                      autoComplete="username"
                    />
                    <Button
                      type="submit"
                      disabled={usernameSaving || !usernameInput.trim() || usernameInput.trim() === shop?.login_username}
                      variant="outline"
                      className="h-10 rounded-xl"
                    >
                      {usernameSaving ? "Saving..." : "Update Username"}
                    </Button>
                  </div>
                  {usernameMessage && <p className="text-xs text-emerald-700 mt-2">{usernameMessage}</p>}
                </form>
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

import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Star, LogOut, Share2, Pencil, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import IdentifyScreen from "@/components/consumer/IdentifyScreen";
import PreferenceFormStepper from "@/components/consumer/PreferenceFormStepper";
import PreferenceList from "@/components/consumer/PreferenceList";
import PreferenceCard from "@/components/consumer/PreferenceCard";
import PreferenceEmptyState from "@/components/consumer/PreferenceEmptyState";
import ShareOrderSheet from "@/components/consumer/ShareOrderSheet";
import OrderHistoryList from "@/components/shared/OrderHistoryList";
import LoadingOverlay from "@/components/shared/LoadingOverlay";
import CreateProfilePrompt from "@/components/consumer/CreateProfilePrompt";
import { setCachedRoleContext, setSavedPersonalId } from "@/lib/personal-id";

export default function ConsumerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const personalId = searchParams.get("personal_id");
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvingPersonalId, setResolvingPersonalId] = useState(false);
  const [missingPersonalId, setMissingPersonalId] = useState("");
  const [showPrefForm, setShowPrefForm] = useState(false);
  const [editingPref, setEditingPref] = useState(null);
  const [tab, setTab] = useState("prefs"); // prefs | history
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [shopFilter, setShopFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [reorderInitialValues, setReorderInitialValues] = useState(null);

  useEffect(() => {
    setCachedRoleContext("consumer", "/consumer");
  }, []);

  async function loadProfileData(p) {
    setLoading(true);
    try {
      const prefs = await base44.entities.CoffeePreference.filter({ profile_id: p.id });
      setPreferences(prefs);
      const ords = await base44.entities.Order.filter({ profile_id: p.id });
      setOrders(ords.sort((a, b) => new Date(b.ordered_at || b.created_date).getTime() - new Date(a.ordered_at || a.created_date).getTime()));
    } finally {
      setLoading(false);
    }
  }

  async function handleIdentified(p) {
    setProfile(p);
    setSavedPersonalId(p.nfc_id);
    await loadProfileData(p);
  }

  function clearPersonalIdRoute() {
    navigate("/consumer", { replace: true });
  }

  function handleSignOut() {
    setProfile(null);
    setPreferences([]);
    setOrders([]);
    setTab("prefs");
    if (personalId) {
      clearPersonalIdRoute();
    }
  }

  async function setDefault(pref) {
    await Promise.all(preferences.map(p =>
      base44.entities.CoffeePreference.update(p.id, { is_default: p.id === pref.id })
    ));
    await loadProfileData(profile);
  }

  async function deletePref(pref) {
    await base44.entities.CoffeePreference.delete(pref.id);
    await loadProfileData(profile);
  }

  useEffect(() => {
    let cancelled = false;

    async function resolvePersonalId() {
      if (!personalId) {
        setResolvingPersonalId(false);
        setMissingPersonalId("");
        return;
      }

      setResolvingPersonalId(true);
      setMissingPersonalId("");
      setProfile(null);
      setPreferences([]);
      setOrders([]);
      setTab("prefs");

      try {
        const results = await base44.entities.CoffeeProfile.filter({ nfc_id: personalId });
        if (cancelled) return;

        if (results.length === 0) {
          setMissingPersonalId(personalId);
          return;
        }

        await handleIdentified(results[0]);
      } catch {
        if (!cancelled) {
          setMissingPersonalId(personalId);
        }
      } finally {
        if (!cancelled) {
          setResolvingPersonalId(false);
        }
      }
    }

    resolvePersonalId();

    return () => {
      cancelled = true;
    };
  }, [personalId]);

  if (!profile) {
    if (resolvingPersonalId) {
      return (
        <LoadingOverlay
          visible
          title="Loading your TapCup profile"
          message="We found your chip ID and are opening your profile now."
        />
      );
    }

    if (missingPersonalId) {
      return (
        <CreateProfilePrompt
          prefillNfcId={missingPersonalId}
          onCreated={async (createdProfile) => {
            setMissingPersonalId("");
            setProfile(createdProfile);
            setSavedPersonalId(createdProfile.nfc_id);
            await loadProfileData(createdProfile);
          }}
          onClose={clearPersonalIdRoute}
          title="Profile Not Found"
          description="Create a new profile for this chip ID."
        />
      );
    }

    return <IdentifyScreen onIdentified={handleIdentified} />;
  }

  if (loading) return (
    <LoadingOverlay
      visible
      title="Loading profile data"
      message="Please wait while we fetch preferences and order history."
    />
  );

  function nfcIdToColorClass(nfcId) {
    if (!nfcId) return "bg-amber-600";
    let h = 0;
    for (let i = 0; i < nfcId.length; i++) h = nfcId.charCodeAt(i) + ((h << 5) - h);
    const palette = ["bg-amber-600","bg-violet-600","bg-teal-600","bg-rose-600","bg-sky-600","bg-lime-600"];
    return palette[Math.abs(h) % palette.length];
  }

  function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function mostFrequent(arr) {
    const counts = {};
    let max = 0, result = null;
    for (const v of arr) {
      if (!v) continue;
      counts[v] = (counts[v] || 0) + 1;
      if (counts[v] > max) { max = counts[v]; result = v; }
    }
    return result;
  }

  async function handleSaveName() {
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await base44.entities.CoffeeProfile.update(profile.id, { display_name: nameInput.trim() });
      setProfile(p => ({ ...p, display_name: nameInput.trim() }));
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePhone() {
    setSavingPhone(true);
    try {
      await base44.entities.CoffeeProfile.update(profile.id, { phone: phoneInput.trim() });
      setProfile(p => ({ ...p, phone: phoneInput.trim() }));
      setEditingPhone(false);
    } finally {
      setSavingPhone(false);
    }
  }

  function handleReorder(snapshot) {
    setReorderInitialValues(snapshot);
    setEditingPref(null);
    setShowPrefForm(true);
  }

  const uniqueShops = [...new Set(orders.map(o => o.shop_name).filter(Boolean))];
  const now = Date.now();
  const filteredOrders = orders.filter(o => {
    if (shopFilter && o.shop_name !== shopFilter) return false;
    if (dateFilter === "7") return new Date(o.ordered_at || o.created_date).getTime() >= now - 7 * 86400000;
    if (dateFilter === "30") return new Date(o.ordered_at || o.created_date).getTime() >= now - 30 * 86400000;
    return true;
  });
  const favDrink = mostFrequent(orders.map(o => o.preference_snapshot?.name ?? o.preference_snapshot?.coffee_type));

  const defaultPref = preferences.find(p => p.is_default);
  const otherPrefs = preferences.filter(p => !p.is_default);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <p className="font-semibold text-sm">{profile.display_name}</p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span
              data-testid="consumer-chip-status-badge"
              className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                profile.nfc_id ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
              }`}
            >
              {profile.nfc_id ? "Chip Linked" : "No Chip"}
            </span>
            <span data-testid="consumer-profile-nfc-id" className="text-xs text-muted-foreground font-mono">
              NFC: {profile.nfc_id}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {defaultPref && profile.nfc_id && (
            <button
              onClick={() => setShowShareSheet(true)}
              aria-label="Share my order"
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Share my order"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleSignOut}
            data-testid="consumer-sign-out"
            aria-label="Sign out"
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="יציאה"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Dialog open={showReplacementModal} onOpenChange={setShowReplacementModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Request Chip Replacement</DialogTitle>
            <DialogDescription>
              Visit any participating TapCup shop and ask the shop team to re-program a new chip to your profile.
              They will generate a new ID and assign it — your preferences and order history stay intact.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowReplacementModal(false)} className="w-full rounded-xl mt-2">Got it</Button>
        </DialogContent>
      </Dialog>

      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-2xl p-4 mt-4 mb-2">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-full ${nfcIdToColorClass(profile.nfc_id)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
              {getInitials(profile.display_name)}
            </div>
            <div className="flex-1 min-w-0">
              {/* Inline name edit */}
              <div className="group flex items-center gap-1.5 mb-1.5">
                {editingName ? (
                  <>
                    <input
                      autoFocus
                      className="text-sm font-semibold bg-transparent border-b border-primary outline-none flex-1 min-w-0"
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                      data-testid="consumer-profile-name-input"
                    />
                    <button onClick={handleSaveName} disabled={savingName} className="text-emerald-600 text-xs font-medium">
                      {savingName ? "…" : "Save"}
                    </button>
                    <button onClick={() => setEditingName(false)} className="text-muted-foreground text-xs">Cancel</button>
                  </>
                ) : (
                  <>
                    <span data-testid="consumer-profile-display-name" className="text-sm font-semibold">{profile.display_name}</span>
                    <button
                      onClick={() => { setNameInput(profile.display_name || ""); setEditingName(true); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-0.5"
                      aria-label="Edit name"
                      data-testid="consumer-profile-name-edit-btn"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
              {/* Inline phone edit */}
              <div className="group flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                {editingPhone ? (
                  <>
                    <input
                      autoFocus
                      type="tel"
                      className="text-xs bg-transparent border-b border-primary outline-none flex-1 min-w-0"
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSavePhone(); if (e.key === "Escape") setEditingPhone(false); }}
                      placeholder="+1234567890"
                      data-testid="consumer-profile-phone-input"
                    />
                    <button onClick={handleSavePhone} disabled={savingPhone} className="text-emerald-600 text-xs font-medium">
                      {savingPhone ? "…" : "Save"}
                    </button>
                    <button onClick={() => setEditingPhone(false)} className="text-muted-foreground text-xs">Cancel</button>
                  </>
                ) : (
                  <button
                    onClick={() => { setPhoneInput(profile.phone || ""); setEditingPhone(true); }}
                    className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-left"
                    data-testid="consumer-profile-phone"
                  >
                    {profile.phone || <span className="italic text-muted-foreground/60">Add phone</span>}
                  </button>
                )}
              </div>
            </div>
          </div>
          {profile.nfc_id && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground font-mono">ID: NFC-••••{profile.nfc_id.slice(-4)}</span>
              <button onClick={() => setShowReplacementModal(true)} className="text-xs text-amber-700 underline underline-offset-2">
                Request Replacement
              </button>
            </div>
          )}
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-5 mb-6 bg-muted rounded-xl p-1">
          {[["prefs", "My Coffees"], ["history", "History"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key ? "bg-white shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "prefs" && (
          <div>
            {preferences.length === 0 ? (
              <PreferenceEmptyState onAdd={() => { setEditingPref(null); setShowPrefForm(true); }} />
            ) : (
              <>
                {/* Default preference — large hero card, no swipe gestures */}
                {defaultPref && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-semibold text-amber-700">Default Order</span>
                    </div>
                    <PreferenceCard
                      pref={defaultPref}
                      isDefault
                      onEdit={() => { setEditingPref(defaultPref); setShowPrefForm(true); }}
                      onSetDefault={() => setDefault(defaultPref)}
                      onDelete={() => deletePref(defaultPref)}
                      large
                    />
                  </div>
                )}

                {/* Other preferences — swipeable, draggable */}
                {otherPrefs.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Other Preferences</p>
                    <PreferenceList
                      preferences={otherPrefs}
                      onEdit={pref => { setEditingPref(pref); setShowPrefForm(true); }}
                      onSetDefault={setDefault}
                      onDelete={deletePref}
                      onAdd={() => { setEditingPref(null); setShowPrefForm(true); }}
                      onReorder={() => loadProfileData(profile)}
                    />
                  </div>
                )}

                {preferences.length < 5 && (
                  <Button
                    onClick={() => { setEditingPref(null); setShowPrefForm(true); }}
                    className="w-full mt-6 bg-primary text-primary-foreground rounded-xl h-12 font-semibold"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Coffee Preference
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {tab === "history" && (
          <div>
            {/* Stats bar */}
            {orders.length > 0 && (
              <p className="text-xs text-muted-foreground mb-3" data-testid="consumer-order-stats">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
                {favDrink ? ` · Favourite: ${favDrink}` : ""}
              </p>
            )}
            {/* Filters */}
            {(uniqueShops.length > 1 || orders.length > 0) && (
              <div className="flex gap-2 mb-4">
                {uniqueShops.length > 0 && (
                  <select
                    value={shopFilter}
                    onChange={e => setShopFilter(e.target.value)}
                    className="flex-1 text-xs rounded-xl border border-border bg-background px-3 py-2 text-foreground"
                    data-testid="consumer-filter-shop"
                  >
                    <option value="">All shops</option>
                    {uniqueShops.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="flex-1 text-xs rounded-xl border border-border bg-background px-3 py-2 text-foreground"
                  data-testid="consumer-filter-date"
                >
                  <option value="all">All time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                </select>
              </div>
            )}
            <OrderHistoryList orders={filteredOrders} preferences={preferences} onReorder={handleReorder} />
          </div>
        )}
      </div>

      {/* Preference Form Modal */}
      {showPrefForm && (
        <PreferenceFormStepper
          profile={profile}
          editing={editingPref}
          initialValues={reorderInitialValues}
          onClose={() => { setShowPrefForm(false); setEditingPref(null); setReorderInitialValues(null); }}
          onSaved={() => loadProfileData(profile)}
        />
      )}

      {showShareSheet && defaultPref && (
        <ShareOrderSheet
          profile={profile}
          preference={defaultPref}
          open={showShareSheet}
          onClose={() => setShowShareSheet(false)}
        />
      )}
    </div>
  );
}

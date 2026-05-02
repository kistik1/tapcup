import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Star, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import IdentifyScreen from "@/components/consumer/IdentifyScreen";
import PreferenceCard from "@/components/consumer/PreferenceCard";
import PreferenceForm from "@/components/consumer/PreferenceForm";
import OrderHistoryList from "@/components/shared/OrderHistoryList";
import LoadingOverlay from "@/components/shared/LoadingOverlay";
import CreateProfilePrompt from "@/components/consumer/CreateProfilePrompt";

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

  async function loadProfileData(p) {
    setLoading(true);
    try {
      const prefs = await base44.entities.CoffeePreference.filter({ profile_id: p.id });
      setPreferences(prefs);
      const ords = await base44.entities.Order.filter({ profile_id: p.id });
      setOrders(ords.sort((a, b) => new Date(b.ordered_at || b.created_date) - new Date(a.ordered_at || a.created_date)));
    } finally {
      setLoading(false);
    }
  }

  async function handleIdentified(p) {
    setProfile(p);
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
          <p className="text-xs text-muted-foreground font-mono">NFC: {profile.nfc_id}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
          title="יציאה"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24">
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
            {/* Default preference */}
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

            {/* Other preferences */}
            {otherPrefs.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Other Preferences</p>
                <div className="flex flex-col gap-3">
                  {otherPrefs.map(pref => (
                    <PreferenceCard
                      key={pref.id}
                      pref={pref}
                      onEdit={() => { setEditingPref(pref); setShowPrefForm(true); }}
                      onSetDefault={() => setDefault(pref)}
                      onDelete={() => deletePref(pref)}
                    />
                  ))}
                </div>
              </div>
            )}

            {preferences.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">☕</div>
                <p className="text-muted-foreground">No preferences yet</p>
                <p className="text-sm text-muted-foreground/70">Add your first coffee preference below</p>
              </div>
            )}

            <Button
              onClick={() => { setEditingPref(null); setShowPrefForm(true); }}
              className="w-full mt-6 bg-primary text-primary-foreground rounded-xl h-12 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Coffee Preference
            </Button>
          </div>
        )}

        {tab === "history" && (
          <OrderHistoryList orders={orders} preferences={preferences} />
        )}
      </div>

      {/* Preference Form Modal */}
      {showPrefForm && (
        <PreferenceForm
          profile={profile}
          editing={editingPref}
          onClose={() => { setShowPrefForm(false); setEditingPref(null); }}
          onSaved={() => loadProfileData(profile)}
        />
      )}


    </div>
  );
}

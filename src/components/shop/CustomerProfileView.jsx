import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PreferenceCard from "@/components/consumer/PreferenceCard";
import OrderHistoryList from "@/components/shared/OrderHistoryList";
import AddOrderForm from "./AddOrderForm";

export default function CustomerProfileView({ profile, compact }) {
  const [preferences, setPreferences] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("default");
  const [showAddOrder, setShowAddOrder] = useState(false);

  useEffect(() => { loadData(); }, [profile.id]);

  async function loadData() {
    setLoading(true);
    const prefs = await base44.entities.CoffeePreference.filter({ profile_id: profile.id });
    setPreferences(prefs);
    const ords = await base44.entities.Order.filter({ profile_id: profile.id });
    setOrders(ords.sort((a, b) => new Date(b.ordered_at || b.created_date) - new Date(a.ordered_at || a.created_date)));
    setLoading(false);
  }

  const defaultPref = preferences.find(p => p.is_default);
  const otherPrefs = preferences.filter(p => !p.is_default);

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Customer header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-700 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
          {profile.display_name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg leading-tight">{profile.display_name}</p>
          {profile.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
          <p className="text-xs font-mono text-muted-foreground/60">{profile.nfc_id}</p>
        </div>
        <Button
          onClick={() => setShowAddOrder(true)}
          className="bg-primary text-primary-foreground rounded-xl h-9 px-3 text-sm"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Order
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted rounded-xl p-1">
        {[["default", "Default"], ["all", "All Prefs"], ["history", "History"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === key ? "bg-white shadow text-foreground" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "default" && (
        <div>
          {defaultPref ? (
            <PreferenceCard pref={defaultPref} isDefault large />
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">No default preference set</p>
              {preferences.length > 0 && (
                <p className="text-xs text-muted-foreground/70 mt-1">Check "All Prefs" tab</p>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "all" && (
        <div className="space-y-3">
          {preferences.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">No preferences saved</p>
          ) : (
            preferences.map(pref => (
              <PreferenceCard key={pref.id} pref={pref} isDefault={pref.is_default} />
            ))
          )}
        </div>
      )}

      {tab === "history" && (
        <OrderHistoryList orders={orders} preferences={preferences} />
      )}

      {showAddOrder && (
        <AddOrderForm
          profile={profile}
          preferences={preferences}
          onClose={() => setShowAddOrder(false)}
          onSaved={() => { loadData(); setShowAddOrder(false); }}
        />
      )}
    </div>
  );
}

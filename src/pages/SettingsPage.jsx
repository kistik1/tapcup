import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut, LogIn, User, Coffee } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    setLoading(true);
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      const me = await base44.auth.me();
      setUser(me);
      const profiles = await base44.entities.CoffeeProfile.filter({ user_email: me.email });
      if (profiles.length > 0) setProfile(profiles[0]);
    }
    setLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/consumer" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-semibold">Settings</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Profile card */}
        {user ? (
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-700 to-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {profile?.display_name?.[0]?.toUpperCase() || user.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-semibold text-lg leading-tight">{profile?.display_name || user.full_name || "User"}</p>
              {profile?.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
              {profile?.nfc_id && <p className="text-xs font-mono text-muted-foreground/60 mt-0.5">{profile.nfc_id}</p>}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <User className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Not signed in</p>
              <p className="text-sm text-muted-foreground">Sign in to access your profile</p>
            </div>
          </div>
        )}

        {/* App info */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <Coffee className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium">TapCup</span>
            <span className="ml-auto text-xs text-muted-foreground">NFC Coffee Ordering</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              TapCup lets you tap your NFC keychain at any participating coffee shop to instantly place your favourite order — no app needed at the counter.
            </p>
          </div>
        </div>

        {/* Sign in / Sign out */}
        <div className="pt-2">
          {user ? (
            <Button
              onClick={() => { base44.auth.logout(); setUser(null); setProfile(null); }}
              variant="outline"
              className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          ) : (
            <Button
              onClick={() => base44.auth.redirectToLogin("/consumer")}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold"
            >
              <LogIn className="w-4 h-4 mr-2" /> Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
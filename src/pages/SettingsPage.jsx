import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut, LogIn, User, Coffee, Store, Settings } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearShopSession, readShopSession, writeShopSession } from "@/components/shop/ShopLoginGate";
import { isSimulatorMode } from "@/lib/simulator/runtime";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [shop, setShop] = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [savingShopCredentials, setSavingShopCredentials] = useState(false);
  const [shopMessage, setShopMessage] = useState("");
  const [shopError, setShopError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    setLoading(true);
    const currentShop = readShopSession();
    setShop(currentShop);
    if (currentShop) {
      setUsernameInput(currentShop.login_username || "");
      setLoading(false);
      return;
    }

    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      const me = await base44.auth.me();
      setUser(me);
      const profiles = await base44.entities.CoffeeProfile.filter({ user_email: me.email });
      if (profiles.length > 0) setProfile(profiles[0]);
    }
    setLoading(false);
  }

  async function handleShopCredentialsUpdate(event) {
    event.preventDefault();
    if (!shop) return;

    const nextUsername = usernameInput.trim();
    const nextPassword = passwordInput.trim();
    const usernameChanged = nextUsername && nextUsername !== shop.login_username;
    const passwordChanged = Boolean(nextPassword);

    if (!usernameChanged && !passwordChanged) return;

    setSavingShopCredentials(true);
    setShopMessage("");
    setShopError("");

    try {
      if (usernameChanged) {
        const duplicates = await base44.entities.Shop.filter({ login_username: nextUsername });
        const duplicate = duplicates.find((record) => record.id !== shop.id && record.status !== "inactive");
        if (duplicate) {
          setShopError("That username is already used by another shop.");
          return;
        }
      }

      const matches = await base44.entities.Shop.filter({});
      const currentShop = matches.find((record) => record.id === shop.id);
      if (!currentShop) {
        setShopError("Shop session is no longer valid.");
        return;
      }

      const updatedShop = await base44.entities.Shop.update(shop.id, {
        login_username: usernameChanged ? nextUsername : currentShop.login_username,
        login_password: passwordChanged ? nextPassword : currentShop.login_password,
        credentials_updated_at: new Date().toISOString(),
        username_updated_by_role: "shop",
      });

      if (base44.entities.AdminAuditLog) {
        await base44.entities.AdminAuditLog.create({
          actor_role: "shop",
          action: "shop_update_shared_credentials",
          entity_type: "Shop",
          entity_id: shop.id,
          details: {
            previous_username: currentShop.login_username,
            next_username: usernameChanged ? nextUsername : currentShop.login_username,
            password_changed: passwordChanged,
          },
          created_at: new Date().toISOString(),
        });
      }

      const nextSession = writeShopSession(updatedShop);
      setShop(nextSession);
      setUsernameInput(nextSession.login_username || "");
      setPasswordInput("");
      setShopMessage("Shared shop credentials updated.");
    } catch (err) {
      setShopError(err?.message || "Unable to update shared shop credentials.");
    } finally {
      setSavingShopCredentials(false);
    }
  }

  function handleShopSignOut() {
    clearShopSession();
    setShop(null);
    setUsernameInput("");
    setPasswordInput("");
    setShopMessage("");
    setShopError("");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin" />
    </div>
  );

  const backTarget = shop ? "/shop" : "/consumer";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to={backTarget} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-semibold">Settings</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {shop ? (
          <>
            <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-700 to-amber-500 flex items-center justify-center text-white shadow-md">
                <Store className="w-7 h-7" />
              </div>
              <div>
                <p className="font-semibold text-lg leading-tight">{shop.name || "Coffee Shop"}</p>
                {shop.login_username && <p className="text-sm text-muted-foreground">@{shop.login_username}</p>}
                <p className="text-xs text-muted-foreground/70 mt-0.5">Shared shop account</p>
              </div>
            </div>

            {!isSimulatorMode && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium">Shared Shop Credentials</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Anyone at this shop can use the full shop app with this shared username and password.
                </p>
                <form onSubmit={handleShopCredentialsUpdate} className="space-y-3">
                  <Input
                    value={usernameInput}
                    onChange={(event) => {
                      setUsernameInput(event.target.value);
                      setShopMessage("");
                      setShopError("");
                    }}
                    placeholder="Username"
                    className="h-11 rounded-xl"
                    autoComplete="username"
                  />
                  <Input
                    value={passwordInput}
                    onChange={(event) => {
                      setPasswordInput(event.target.value);
                      setShopMessage("");
                      setShopError("");
                    }}
                    type="password"
                    placeholder="New shared password"
                    className="h-11 rounded-xl"
                    autoComplete="new-password"
                  />
                  {shopError && <p className="text-sm text-destructive">{shopError}</p>}
                  {shopMessage && <p className="text-xs text-emerald-700">{shopMessage}</p>}
                  <Button
                    type="submit"
                    disabled={savingShopCredentials || (!passwordInput.trim() && (!usernameInput.trim() || usernameInput.trim() === shop.login_username))}
                    variant="outline"
                    className="w-full h-11 rounded-xl"
                  >
                    {savingShopCredentials ? "Saving..." : "Update Shared Credentials"}
                  </Button>
                </form>
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={handleShopSignOut}
                variant="outline"
                className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          </>
        ) : (
          <>
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
                  onClick={() => { setUser(null); setProfile(null); }}
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
          </>
        )}
      </div>
    </div>
  );
}

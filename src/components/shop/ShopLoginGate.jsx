import { useState } from "react";
import { LockKeyhole, Store } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSimulatorMode } from "@/lib/simulator/runtime";

const SHOP_SESSION_KEY = "tapcup_shop_session";
const SIMULATOR_SHOP = {
  id: "sim-shop",
  name: "Coffee Shop",
  login_username: "sim-shop",
};

function getSessionStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function readShopSession() {
  if (isSimulatorMode) return SIMULATOR_SHOP;
  const raw = getSessionStorage()?.getItem(SHOP_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    getSessionStorage()?.removeItem(SHOP_SESSION_KEY);
    return null;
  }
}

function writeShopSession(shop) {
  const session = {
    id: shop.id,
    name: shop.name || "Coffee Shop",
    login_username: shop.login_username || "",
  };
  getSessionStorage()?.setItem(SHOP_SESSION_KEY, JSON.stringify(session));
  return session;
}

export default function ShopLoginGate({ children }) {
  const [shopSession, setShopSession] = useState(readShopSession);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (shopSession) {
    return children({
      shop: shopSession,
      onShopUpdated: (shop) => setShopSession(writeShopSession(shop)),
      onSignOut: () => {
        getSessionStorage()?.removeItem(SHOP_SESSION_KEY);
        setShopSession(null);
      },
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) return;

    setLoading(true);
    setError("");

    try {
      const shopApi = base44.entities.Shop;
      if (!shopApi) {
        setError("Shop login is not configured yet.");
        return;
      }

      const matches = await shopApi.filter({ login_username: cleanUsername });
      const shop = matches.find((record) => record.status !== "inactive");

      if (!shop || shop.login_password !== password) {
        setError("Username or password is incorrect.");
        return;
      }

      setShopSession(writeShopSession(shop));
    } catch (err) {
      setError(err?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border border-border bg-card rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <LockKeyhole className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Shop Access</h1>
            <p className="text-sm text-muted-foreground">Sign in with your shop credentials.</p>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="h-11 rounded-xl"
            autoComplete="username"
          />
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
            className="h-11 rounded-xl"
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-sm text-destructive mt-3">{error}</p>}

        <Button type="submit" disabled={loading || !username.trim() || !password} className="w-full h-11 rounded-xl mt-4">
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <Store className="w-3.5 h-3.5" />
          Credentials are issued by your TapCup admin.
        </div>
      </form>
    </div>
  );
}

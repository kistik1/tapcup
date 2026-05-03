import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSimulatorMode } from "@/lib/simulator/runtime";

function getSession() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function isPasswordSessionActive(sessionKey) {
  if (isSimulatorMode) return true;
  const storage = getSession();
  return Boolean(storage?.getItem(sessionKey));
}

export function clearPasswordSession(sessionKey) {
  const storage = getSession();
  storage?.removeItem(sessionKey);
}

export default function PasswordGate({
  title,
  description,
  password,
  sessionKey,
  children,
}) {
  const [unlocked, setUnlocked] = useState(() => isPasswordSessionActive(sessionKey));
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  if (isSimulatorMode || unlocked) return children;

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!password) {
      setError("Access password is not configured.");
      return;
    }

    if (value !== password) {
      setError("Incorrect password.");
      return;
    }

    getSession()?.setItem(sessionKey, "true");
    setUnlocked(true);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border border-border bg-card rounded-2xl p-6 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
          <LockKeyhole className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-5">{description}</p>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          type="password"
          placeholder="Password"
          className="h-11 rounded-xl"
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        <Button type="submit" className="w-full h-11 rounded-xl mt-4">
          Continue
        </Button>
      </form>
    </div>
  );
}

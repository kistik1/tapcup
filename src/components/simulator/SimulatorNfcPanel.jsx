import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSavedPersonalId, setSavedPersonalId } from "@/lib/personal-id";
import { clearSimulatorBrowserState, getSimulatorConsumerRoute, normalizeSimulatorChipPayload } from "@/lib/simulator/chip-url";
import { isSimulatorMode } from "@/lib/simulator/runtime";

export default function SimulatorNfcPanel() {
  const navigate = useNavigate();
  const chipUrlFlag =
    import.meta.env.VITE_TAPCUP_SIMULATOR_CHIP_URL?.trim()
    || import.meta.env.VITE_TAPCUP_SIMULATOR_CONSUMER_CHIP_ID?.trim()
    || "";
  const sideFlag = import.meta.env.VITE_TAPCUP_SIMULATOR_SIDE?.trim() || "consumer";
  const initialChipPayload = normalizeSimulatorChipPayload(chipUrlFlag || getSavedPersonalId() || "");
  const [chipUrl, setChipUrl] = useState(() => initialChipPayload.canonicalUrl || "");
  const [side, setSide] = useState(sideFlag === "shop" ? "shop" : "consumer");
  const [status, setStatus] = useState("");

  if (!isSimulatorMode) return null;

  function simulateRead() {
    const payload = normalizeSimulatorChipPayload(chipUrl);
    if (!payload.personalId) {
      setStatus("Enter a canonical chip URL first.");
      return;
    }

    clearSimulatorBrowserState();
    setStatus("Cleared cached chip state.");
    setSavedPersonalId(payload.personalId);

    if (side === "consumer") {
      navigate(getSimulatorConsumerRoute(payload.personalId));
      setStatus(`Simulated consumer chip scan for ${payload.personalId}.`);
      return;
    }

    if (side === "shop") {
      navigate("/shop");
      setStatus(`Simulated shop chip scan for ${payload.personalId}.`);
      return;
    }

    setStatus(`Saved ${payload.personalId} to local storage.`);
  }

  return (
    <div
      data-testid="simulator-nfc-panel"
      className="fixed bottom-4 left-4 z-[60] w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-amber-200 bg-white/95 backdrop-blur shadow-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <p className="font-semibold text-sm">Simulator NFC</p>
          <p className="text-xs text-muted-foreground">Push a manual chip read into the app</p>
          {chipUrlFlag && (
            <p data-testid="simulator-consumer-chip-flag" className="text-[11px] text-amber-700 font-medium mt-1">
              Canonical chip URL flag active
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Canonical chip URL</label>
          <Input
            data-testid="simulator-nfc-chip"
            value={chipUrl}
            onChange={(e) => setChipUrl(e.target.value)}
            placeholder="https://tap-cup.base44.app/consumer?personal_id=NFC-AJV32A"
            className="h-10 rounded-xl font-mono text-xs"
          />
          <p className="mt-1 text-[11px] text-muted-foreground break-all">
            personal_id: <span data-testid="simulator-nfc-personal-id">{normalizeSimulatorChipPayload(chipUrl).personalId || "n/a"}</span>
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Side</label>
          <select
            data-testid="simulator-nfc-side"
            value={side}
            onChange={(e) => setSide(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
          >
            <option value="consumer">Consumer side</option>
            <option value="shop">Shop side</option>
          </select>
        </div>

        <Button
          data-testid="simulator-nfc-run"
          onClick={simulateRead}
          className="w-full h-10 rounded-xl bg-primary text-primary-foreground"
        >
          {side === "consumer" ? "Simulate Consumer Chip Scan" : "Simulate Shop Chip Scan"}
        </Button>

        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </div>
    </div>
  );
}

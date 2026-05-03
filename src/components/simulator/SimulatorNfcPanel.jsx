import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSavedPersonalId, setSavedPersonalId } from "@/lib/personal-id";
import { isSimulatorMode } from "@/lib/simulator/runtime";

export default function SimulatorNfcPanel() {
  const navigate = useNavigate();
  const consumerChipFlag = import.meta.env.VITE_TAPCUP_SIMULATOR_CONSUMER_CHIP_ID?.trim() || "";
  const [chipId, setChipId] = useState(() => consumerChipFlag || getSavedPersonalId() || "");
  const [target, setTarget] = useState("consumer");
  const [status, setStatus] = useState("");

  if (!isSimulatorMode) return null;

  function simulateRead() {
    const value = chipId.trim();
    if (!value) {
      setStatus("Enter a chip ID first.");
      return;
    }

    setSavedPersonalId(value);

    if (target === "consumer") {
      navigate(`/consumer?personal_id=${encodeURIComponent(value)}`);
      setStatus(consumerChipFlag ? `Simulated consumer chip scan for ${value}.` : `Sent ${value} to consumer.`);
      return;
    }

    if (target === "shop") {
      navigate("/shop");
      setStatus(`Saved ${value} for shop.`);
      return;
    }

    setStatus(`Saved ${value} to local storage.`);
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
          {consumerChipFlag && (
            <p data-testid="simulator-consumer-chip-flag" className="text-[11px] text-amber-700 font-medium mt-1">
              Consumer chip flag active
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Chip ID</label>
          <Input
            data-testid="simulator-nfc-chip"
            value={chipId}
            onChange={(e) => setChipId(e.target.value)}
            placeholder="SIM-111111"
            className="h-10 rounded-xl font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Target</label>
          <select
            data-testid="simulator-nfc-target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
          >
            <option value="consumer">Consumer</option>
            <option value="shop">Shop</option>
            <option value="store">Store only</option>
          </select>
        </div>

        <Button
          data-testid="simulator-nfc-run"
          onClick={simulateRead}
          className="w-full h-10 rounded-xl bg-primary text-primary-foreground"
        >
          {consumerChipFlag && target === "consumer" ? "Simulate Consumer Chip Scan" : "Simulate NFC Read"}
        </Button>

        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </div>
    </div>
  );
}

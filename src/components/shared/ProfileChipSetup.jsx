import { useMemo, useState } from "react";
import { KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { assignChipToProfile } from "@/lib/chip-assignment";
import { buildCanonicalChipUrl, generatePersonalId } from "@/lib/personal-id";

export default function ProfileChipSetup({
  profile,
  actorRole,
  actorLabel,
  onAssigned,
  compact = false,
}) {
  const [personalId, setPersonalId] = useState(profile?.nfc_id || "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(null);

  const canonicalUrl = useMemo(() => buildCanonicalChipUrl(personalId), [personalId]);

  if (!profile) return null;

  function generateChipId() {
    const next = generatePersonalId();
    setPersonalId(next);
    setMessage("");
    setError("");
    setConflict(null);
  }

  async function saveChip(confirmedReassignment = false) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await assignChipToProfile({
        profile,
        personalId,
        actorRole,
        actorLabel,
        notes,
        confirmedReassignment,
      });
      setConflict(null);
      setMessage(`Chip assigned. URL: ${result.canonicalUrl}`);
      onAssigned?.(result.profile);
    } catch (err) {
      if (err.code === "chip_conflict") {
        setConflict(err.profile);
        setError("");
      } else {
        setError(err?.message || "Failed to assign chip.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`border border-border bg-card rounded-2xl ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="w-4 h-4 text-amber-600" />
        <h3 className="font-semibold text-sm">NFC Chip Setup</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Personal ID</label>
          <div className="flex gap-2 mt-1">
            <Input
              value={personalId}
              onChange={(event) => {
                setPersonalId(event.target.value);
                setConflict(null);
              }}
              placeholder="NFC-ABC123"
              className="h-10 rounded-xl font-mono text-sm"
            />
            <Button type="button" variant="outline" onClick={generateChipId} className="h-10 rounded-xl px-3">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Canonical chip URL</label>
          <p className="mt-1 text-xs font-mono break-all rounded-xl bg-muted px-3 py-2">{canonicalUrl}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Notes</label>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Assignment notes"
            className="mt-1 rounded-xl text-sm"
          />
        </div>

        {conflict && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-900">
              This chip is assigned to {conflict.display_name}.
            </p>
            <p className="text-xs text-amber-800 mt-1">
              Confirming will move the chip here and give the old profile a replacement ID.
            </p>
            <Button
              type="button"
              onClick={() => saveChip(true)}
              disabled={saving}
              className="mt-3 h-9 rounded-xl bg-amber-700 text-white hover:bg-amber-800"
            >
              Confirm reassignment
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-xs text-emerald-700 break-all">{message}</p>}

        <Button
          type="button"
          onClick={() => saveChip(false)}
          disabled={saving || !personalId.trim()}
          className="w-full h-10 rounded-xl"
        >
          {saving ? "Assigning..." : "Assign Chip"}
        </Button>
      </div>
    </div>
  );
}

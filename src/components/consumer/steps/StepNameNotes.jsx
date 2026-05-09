import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function StepNameNotes({ form, setForm, saving, onSave, editing }) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Preference Name</Label>
        <Input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Morning Latte"
          className="mt-1 h-12 rounded-xl text-base"
          required
          autoFocus
        />
      </div>

      <div>
        <Label>Coffee Type</Label>
        <Input
          value={form.coffee_type}
          onChange={e => setForm(f => ({ ...f, coffee_type: e.target.value }))}
          placeholder="e.g. Latte, Espresso, Flat White"
          className="mt-1 h-12 rounded-xl text-base"
        />
      </div>

      <div>
        <Label>Special Notes</Label>
        <Input
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="e.g. Extra hot, no foam"
          className="mt-1 h-12 rounded-xl text-base"
        />
      </div>

      {/* Set as default toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => setForm(f => ({ ...f, is_default: !f.is_default }))}
          className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.is_default ? "bg-amber-500" : "bg-muted"}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form.is_default ? "translate-x-5" : ""}`} />
        </div>
        <span className="text-sm font-medium">Set as default preference</span>
      </label>

      <Button
        type="button"
        onClick={onSave}
        disabled={saving || !form.name.trim()}
        className="w-full h-12 rounded-xl font-semibold bg-primary text-primary-foreground"
      >
        {saving ? "Saving..." : (editing ? "Save Changes" : "Add Preference")}
      </Button>
    </div>
  );
}

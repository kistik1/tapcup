import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImagePlus, Images, Trash2 } from "lucide-react";

export default function StepNameNotes({
  form,
  setForm,
  saving,
  onSave,
  editing,
  onOpenGallery,
  onPhotoUpload,
  onRemovePhoto,
}) {
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
        <Label>Special Notes</Label>
        <Input
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="e.g. Extra hot, no foam"
          className="mt-1 h-12 rounded-xl text-base"
        />
      </div>

      <div className="space-y-3">
        <Label>Preference Photo</Label>

        {form.image_url ? (
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            <img
              src={form.image_url}
              alt={form.name || form.coffee_type || "Preference photo"}
              className="w-full h-44 object-cover"
            />
            <div className="flex gap-2 p-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onPhotoUpload?.(event.target.files?.[0])}
                />
                <span className="flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-background text-sm font-medium cursor-pointer hover:bg-muted transition-colors">
                  <ImagePlus className="w-4 h-4" />
                  Change Photo
                </span>
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={onRemovePhoto}
                className="h-11 rounded-xl px-4"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center justify-center gap-2 h-24 rounded-2xl border border-dashed border-border bg-card text-sm font-medium cursor-pointer hover:border-primary/40 hover:bg-muted/40 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => onPhotoUpload?.(event.target.files?.[0])}
              />
              <ImagePlus className="w-4 h-4" />
              Upload Photo
            </label>

            <button
              type="button"
              onClick={onOpenGallery}
              className="flex items-center justify-center gap-2 h-24 rounded-2xl border border-dashed border-border bg-card text-sm font-medium hover:border-primary/40 hover:bg-muted/40 transition-colors"
            >
              <Images className="w-4 h-4" />
              Choose Gallery Image
            </button>
          </div>
        )}
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

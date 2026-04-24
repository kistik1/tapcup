import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CupSizeManager({ shopId }) {
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newMl, setNewMl] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadSizes(); }, [shopId]);

  async function loadSizes() {
    setLoading(true);
    const results = await base44.entities.CupSize.filter({ shop_id: shopId });
    setSizes(results.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim() || !newMl) return;
    setAdding(true);
    await base44.entities.CupSize.create({
      shop_id: shopId,
      name: newName.trim(),
      ml: Number(newMl),
      sort_order: sizes.length,
    });
    setNewName("");
    setNewMl("");
    await loadSizes();
    setAdding(false);
  }

  async function handleDelete(id) {
    await base44.entities.CupSize.delete(id);
    setSizes(s => s.filter(x => x.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Cup Sizes</h3>
        <span className="text-xs text-muted-foreground">{sizes.length} sizes defined</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {sizes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No cup sizes yet. Add your first one below.</p>
          )}
          {sizes.map(size => (
            <div key={size.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
              <span className="flex-1 font-medium text-sm">{size.name}</span>
              <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">{size.ml} ml</span>
              <button
                onClick={() => handleDelete(size.id)}
                className="text-destructive/50 hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new size */}
      <form onSubmit={handleAdd} className="flex gap-2 pt-2">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Size name (e.g. Large)"
          className="h-10 rounded-xl flex-1"
        />
        <Input
          value={newMl}
          onChange={e => setNewMl(e.target.value)}
          placeholder="ml"
          type="number"
          min="1"
          className="h-10 rounded-xl w-24"
        />
        <Button type="submit" disabled={adding || !newName.trim() || !newMl} className="h-10 rounded-xl px-3">
          <Plus className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
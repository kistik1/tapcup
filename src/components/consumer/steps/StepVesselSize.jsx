import LayerComposer from "../LayerComposer";
import { VESSEL_DEFS, VESSEL_SVGS, SIZE_DEFS } from "../cup-constants.jsx";

export default function StepVesselSize({ form, setForm, layers, setLayers }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Cup type</p>
        <div className="grid grid-cols-3 gap-2">
          {VESSEL_DEFS.map(v => (
            <button
              key={v.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, vessel: v.value }))}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all text-sm font-medium ${
                form.vessel === v.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              <span>{VESSEL_SVGS[v.value]}</span>
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Size</p>
        <div className="grid grid-cols-2 gap-2">
          {SIZE_DEFS.map(s => (
            <button
              key={s.value}
              type="button"
              aria-pressed={form.size === s.value}
              onClick={() => setForm(f => ({ ...f, size: s.value }))}
              className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all text-sm font-medium ${
                form.size === s.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              <span className="font-bold text-lg">{s.label}</span>
              <span className="text-[11px] opacity-70 font-mono">{s.totalMl}ml</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Layer composition</p>
        <LayerComposer
          layers={layers}
          onChange={setLayers}
          vessel={form.vessel}
          size={form.size}
          temp={form.temperature}
          milk={form.milk}
          onMilkChange={(value) => setForm((current) => ({ ...current, milk: value }))}
        />
      </div>
    </div>
  );
}

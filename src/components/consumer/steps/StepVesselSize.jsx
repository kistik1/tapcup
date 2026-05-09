import { VESSEL_DEFS, VESSEL_SVGS, SIZE_DEFS, ESPRESSO_DOSES } from "../cup-constants.jsx";

export default function StepVesselSize({ form, setForm, layers, setLayers }) {
  function handleSizeChange(sizeDef) {
    setForm(f => ({ ...f, size: sizeDef.value }));
    const doses     = parseInt(form.strength) || 2;
    const coffeeMl  = doses * 36;
    const coffeePct = Math.round((coffeeMl / sizeDef.totalMl) * 100);
    setLayers(prev => {
      const nonCoffeeTotal = (prev.water || 0) + (prev.milk || 0) + (prev.foam || 0);
      const remaining = 100 - coffeePct;
      if (nonCoffeeTotal === 0) return { ...prev, coffee: coffeePct, foam: remaining };
      const scale = remaining / nonCoffeeTotal;
      return {
        water:  Math.round((prev.water || 0) * scale),
        milk:   Math.round((prev.milk  || 0) * scale),
        coffee: coffeePct,
        foam:   Math.round((prev.foam  || 0) * scale),
      };
    });
  }

  function handleDoseChange(dose) {
    setForm(f => ({ ...f, strength: dose.value }));
    setLayers(prev => {
      const total         = (prev.water || 0) + (prev.milk || 0) + (prev.coffee || 0) + (prev.foam || 0);
      const nonCoffeeTotal = (prev.water || 0) + (prev.milk || 0) + (prev.foam || 0);
      const remaining     = total - dose.coffeePct;
      if (nonCoffeeTotal === 0) {
        return { ...prev, coffee: dose.coffeePct, foam: Math.max(0, total - dose.coffeePct) };
      }
      const scale = remaining / nonCoffeeTotal;
      return {
        water:  Math.round((prev.water || 0) * scale),
        milk:   Math.round((prev.milk  || 0) * scale),
        coffee: dose.coffeePct,
        foam:   Math.round((prev.foam  || 0) * scale),
      };
    });
  }

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
              onClick={() => handleSizeChange(s)}
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
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Espresso dose</p>
        <div className="grid grid-cols-3 gap-2">
          {ESPRESSO_DOSES.map(d => (
            <button
              key={d.value}
              type="button"
              onClick={() => handleDoseChange(d)}
              className={`flex flex-col items-center py-3 rounded-2xl border-2 transition-all text-sm font-medium ${
                form.strength === d.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              <span className="text-xl mb-0.5">{d.emoji}</span>
              <span className="font-semibold">{d.label}</span>
              <span className="text-[10px] font-mono opacity-70">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

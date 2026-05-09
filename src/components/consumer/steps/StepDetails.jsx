import { MILK_TYPES, SUGARS, TEMPS } from "../cup-constants.jsx";

function ChipGroup({ label, value, options, onChange }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              value === opt
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function StepDetails({ form, setForm, layers, setLayers }) {
  function handleMilkChange(v) {
    setForm(f => ({ ...f, milk: v }));
    if (v === "None") {
      setLayers(l => ({ ...l, milk: 0 }));
    } else if (layers.milk === 0) {
      setLayers(l => {
        const take = Math.min(20, l.coffee || 0);
        return { ...l, milk: take, coffee: (l.coffee || 0) - take };
      });
    }
  }

  return (
    <div className="space-y-6">
      <ChipGroup label="Milk" value={form.milk} options={MILK_TYPES} onChange={handleMilkChange} />
      <ChipGroup label="Sugar" value={form.sugar} options={SUGARS} onChange={v => setForm(f => ({ ...f, sugar: v }))} />
      <ChipGroup label="Temperature" value={form.temperature} options={TEMPS} onChange={v => setForm(f => ({ ...f, temperature: v }))} />
    </div>
  );
}

import { MILK_TYPES, SUGARS, TEMPS, STRENGTH_OPTIONS, formatStrengthLabel } from "../cup-constants.jsx";

function ChipGroup({ label, value, options, onChange }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            aria-pressed={value === opt}
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Strength</p>
        <div className="grid grid-cols-2 gap-2">
          {STRENGTH_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={form.strength === option.value}
              data-testid={`strength-option-${option.value}`}
              onClick={() => setForm((current) => ({ ...current, strength: option.value }))}
              className={`rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                form.strength === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="text-xs opacity-80">{option.doseLabel}</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Saved as {formatStrengthLabel(form.strength)} strength.
        </p>
      </div>
      <ChipGroup label="Milk" value={form.milk} options={MILK_TYPES} onChange={handleMilkChange} />
      <ChipGroup label="Sugar" value={form.sugar} options={SUGARS} onChange={v => setForm(f => ({ ...f, sugar: v }))} />
      <ChipGroup label="Temperature" value={form.temperature} options={TEMPS} onChange={v => setForm(f => ({ ...f, temperature: v }))} />
    </div>
  );
}

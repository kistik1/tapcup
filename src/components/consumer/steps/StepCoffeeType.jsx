import { Input } from "@/components/ui/input";
import { COFFEE_TYPE_OPTIONS, OTHER_COFFEE_TYPE, resolveCoffeeTypeOption } from "../cup-constants.jsx";

export default function StepCoffeeType({ form, setForm }) {
  const selectedType = form.coffee_type_mode || resolveCoffeeTypeOption(form.coffee_type);
  const isOther = selectedType === OTHER_COFFEE_TYPE;

  function handleSelect(option) {
    setForm((current) => ({
      ...current,
      coffee_type_mode: option,
      coffee_type: option === OTHER_COFFEE_TYPE
        ? (selectedType === OTHER_COFFEE_TYPE ? current.coffee_type : "")
        : option,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Coffee type</p>
        <div className="grid grid-cols-2 gap-2">
          {COFFEE_TYPE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={selectedType === option}
              onClick={() => handleSelect(option)}
              className={`min-h-[52px] rounded-2xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                selectedType === option
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={isOther}
            onClick={() => handleSelect(OTHER_COFFEE_TYPE)}
            className={`min-h-[52px] rounded-2xl border-2 px-4 py-3 text-sm font-medium transition-all ${
              isOther
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            Other
          </button>
        </div>
      </div>

      {isOther && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Custom coffee type</p>
          <Input
            value={form.coffee_type}
            onChange={(event) => setForm((current) => ({ ...current, coffee_type: event.target.value }))}
            placeholder="Enter coffee type"
            className="h-12 rounded-xl text-base"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

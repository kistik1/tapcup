import LayerComposer from "../LayerComposer";

export default function StepLayerEditor({ form, setForm, layers, setLayers }) {
  return (
    <div className="py-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Layer composition
      </p>
      <LayerComposer
        layers={layers}
        onChange={setLayers}
        vessel={form.vessel}
        size={form.size}
        temp={form.temperature}
        milk={form.milk}
        onMilkChange={(v) => setForm(f => ({ ...f, milk: v }))}
      />
    </div>
  );
}

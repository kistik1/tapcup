import CupDragEditor from "../CupDragEditor";

export default function StepLayerEditor({ form, layers, setLayers }) {
  return (
    <div className="flex flex-col items-center py-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 self-start">
        Layer composition
      </p>
      <CupDragEditor
        layers={layers}
        setLayers={setLayers}
        vessel={form.vessel}
        size={form.size}
        temp={form.temperature}
        clipId="cup-stepper-drag"
      />
    </div>
  );
}

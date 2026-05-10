import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { savePreferenceDraft, loadPreferenceDraft, clearPreferenceDraft } from "@/lib/preference-draft";
import { DEFAULT_LAYERS } from "./cup-constants.jsx";
import StepVesselSize  from "./steps/StepVesselSize";
import StepLayerEditor from "./steps/StepLayerEditor";
import StepDetails     from "./steps/StepDetails";
import StepNameNotes   from "./steps/StepNameNotes";
import ImageGallery from "./ImageGallery";

const STEP_LABELS = ["Cup & Size", "Layers", "Details", "Name & Save"];

const DEFAULT_FORM = {
  name:        "",
  coffee_type: "",
  strength:    "2",
  milk:        "Oat",
  sugar:       "None",
  temperature: "Hot",
  notes:       "",
  image_url:   "",
  is_default:  false,
  vessel:      "mug",
  size:        "large",
};

function formFromEditing(editing) {
  if (!editing) return DEFAULT_FORM;
  return {
    name:        editing.name        || "",
    coffee_type: editing.coffee_type || "",
    strength:    editing.strength    || "2",
    milk:        editing.milk        || "None",
    sugar:       editing.sugar       || "None",
    temperature: editing.temperature || "Hot",
    notes:       editing.notes       || "",
    image_url:   editing.image_url   || "",
    is_default:  editing.is_default  || false,
    vessel:      editing.vessel      || "mug",
    size:        editing.size        || "large",
  };
}

function layersFromEditing(editing) {
  if (!editing) return { ...DEFAULT_LAYERS };
  return {
    coffee: editing.coffee_pct ?? DEFAULT_LAYERS.coffee,
    water:  editing.water_pct  ?? DEFAULT_LAYERS.water,
    milk:   editing.milk_pct   ?? DEFAULT_LAYERS.milk,
    foam:   editing.foam_pct   ?? DEFAULT_LAYERS.foam,
  };
}

export default function PreferenceFormStepper({ profile, editing, initialValues, onClose, onSaved }) {
  // Try to restore draft for new preferences (not for edits or reorders)
  const draft = (!editing && !initialValues) ? loadPreferenceDraft(profile.id, null) : null;
  const seed = editing || initialValues;

  const [form, setForm]     = useState(() => draft?.form || formFromEditing(seed));
  const [layers, setLayers] = useState(() => draft?.layers || layersFromEditing(seed));
  const [step, setStep]     = useState(0);
  const [dir, setDir]       = useState(1);  // 1 = forward, -1 = backward
  const [saving, setSaving] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const draftTimer = useRef(null);

  // Debounced draft save (500ms) — new preferences only, not edits or reorders
  useEffect(() => {
    if (editing || initialValues) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      savePreferenceDraft(profile.id, null, { form, layers });
    }, 500);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [form, layers, editing, initialValues, profile.id]);

  function goNext() {
    setDir(1);
    setStep(s => Math.min(s + 1, STEP_LABELS.length - 1));
  }

  function goBack() {
    setDir(-1);
    setStep(s => Math.max(s - 1, 0));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const data = {
      ...form,
      milk:       layers.milk > 0 ? (form.milk === "None" ? "Whole" : form.milk) : "None",
      profile_id: profile.id,
      user_email: profile.user_email,
      water_pct:  layers.water,
      milk_pct:   layers.milk,
      coffee_pct: layers.coffee,
      foam_pct:   layers.foam,
    };
    try {
      if (editing) {
        await base44.entities.CoffeePreference.update(editing.id, data);
      } else {
        await base44.entities.CoffeePreference.create(data);
      }
      clearPreferenceDraft(profile.id, null);
      await onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handlePhotoUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((current) => ({ ...current, image_url: result }));
    };
    reader.readAsDataURL(file);
  }

  const stepProps = { form, setForm, layers, setLayers };

  const STEPS = [
    <StepVesselSize  key="vessel"  {...stepProps} />,
    <StepLayerEditor key="layers"  {...stepProps} />,
    <StepDetails     key="details" {...stepProps} />,
    <StepNameNotes
      key="name"
      {...stepProps}
      saving={saving}
      onSave={handleSave}
      editing={editing}
      onOpenGallery={() => setShowGallery(true)}
      onPhotoUpload={handlePhotoUpload}
      onRemovePhoto={() => setForm((current) => ({ ...current, image_url: "" }))}
    />,
  ];

  const variants = {
    enter: d => ({ x: d * 40, opacity: 0 }),
    center:    { x: 0, opacity: 1 },
    exit:  d => ({ x: d * -40, opacity: 0 }),
  };

  const isLast  = step === STEP_LABELS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[94vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur px-5 pt-4 pb-3 border-b border-border z-10 rounded-t-3xl sm:rounded-t-3xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button onClick={goBack} className="text-muted-foreground hover:text-foreground p-1 rounded-lg">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h3 className="font-semibold text-base">
                {editing ? "Edit Preference" : "New Preference"}
              </h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1">
            {STEP_LABELS.map((label, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
            Step {step + 1} of {STEP_LABELS.length} — {STEP_LABELS[step]}
          </p>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {STEPS[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav — show Next button on all steps except the last */}
        {!isLast && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur px-5 pb-5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={goNext}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              Next — {STEP_LABELS[step + 1]}
            </button>
          </div>
        )}

        {showGallery && (
          <ImageGallery
            onSelect={(url) => {
              setForm((current) => ({ ...current, image_url: url }));
              setShowGallery(false);
            }}
            onClose={() => setShowGallery(false)}
          />
        )}
      </motion.div>
    </div>
  );
}

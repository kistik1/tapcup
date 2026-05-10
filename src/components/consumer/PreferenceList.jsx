import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { base44 } from "@/api/base44Client";
import SwipeablePreferenceCard from "./SwipeablePreferenceCard";

const MAX_PREFS = 5;

export default function PreferenceList({
  preferences,
  onEdit,
  onSetDefault,
  onDelete,
  onAdd,
  onReorder,
}) {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const persistRef = useRef(null);

  useEffect(() => {
    if (!persistRef.current) setLocalPrefs(preferences);
  }, [preferences]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  async function handleDuplicate(pref) {
    await base44.entities.CoffeePreference.create({
      profile_id:  pref.profile_id,
      user_email:  pref.user_email,
      name:        `${pref.name} (copy)`,
      coffee_type: pref.coffee_type,
      strength:    pref.strength,
      milk:        pref.milk,
      sugar:       pref.sugar,
      temperature: pref.temperature,
      notes:       pref.notes,
      image_url:   pref.image_url,
      is_default:  false,
      water_pct:   pref.water_pct,
      milk_pct:    pref.milk_pct,
      coffee_pct:  pref.coffee_pct,
      foam_pct:    pref.foam_pct,
      vessel:      pref.vessel,
      size:        pref.size,
      sort_order:  localPrefs.length + 1,
    });
    onReorder?.();
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const oldIdx = localPrefs.findIndex(p => p.id === active.id);
    const newIdx = localPrefs.findIndex(p => p.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(localPrefs, oldIdx, newIdx);
    setLocalPrefs(reordered);

    if (persistRef.current) clearTimeout(persistRef.current);
    persistRef.current = setTimeout(async () => {
      persistRef.current = null;
      try {
        await Promise.all(
          reordered.map((p, i) =>
            base44.entities.CoffeePreference.update(p.id, { sort_order: i + 1 })
          )
        );
      } catch (_) { /* silent rollback via onReorder */ }
      onReorder?.();
    }, 300);
  }

  const atLimit = localPrefs.length >= MAX_PREFS;

  if (localPrefs.length === 0) return null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={localPrefs.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {localPrefs.map(pref => (
              <SwipeablePreferenceCard
                key={pref.id}
                pref={pref}
                onEdit={() => onEdit?.(pref)}
                onSetDefault={() => onSetDefault?.(pref)}
                onDelete={() => onDelete?.(pref)}
                onDuplicate={atLimit ? undefined : () => handleDuplicate(pref)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {atLimit && (
        <p className="text-xs text-muted-foreground text-center mt-4 px-4 py-2 bg-muted rounded-xl">
          You've reached the 5-preference limit. Remove one to add another.
        </p>
      )}
    </>
  );
}

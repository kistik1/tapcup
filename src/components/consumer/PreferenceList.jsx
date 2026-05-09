import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
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
      sort_order:  preferences.length + 1,
    });
    onReorder?.();
  }

  async function handleDragEnd(result) {
    if (!result.destination) return;
    const fromIdx = result.source.index;
    const toIdx   = result.destination.index;
    if (fromIdx === toIdx) return;

    const reordered = Array.from(preferences);
    const [moved]   = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    // Persist new sort_order to each affected record
    await Promise.all(
      reordered.map((p, i) => base44.entities.CoffeePreference.update(p.id, { sort_order: i + 1 }))
    );
    onReorder?.();
  }

  const atLimit = preferences.length >= MAX_PREFS;

  if (preferences.length === 0) return null;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="prefs">
        {provided => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-3">
            {preferences.map((pref, index) => (
              <Draggable key={pref.id} draggableId={pref.id} index={index}>
                {(draggableProvided) => (
                  <div
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.draggableProps}
                  >
                    <SwipeablePreferenceCard
                      pref={pref}
                      onEdit={() => onEdit?.(pref)}
                      onSetDefault={() => onSetDefault?.(pref)}
                      onDelete={() => onDelete?.(pref)}
                      onDuplicate={atLimit ? undefined : () => handleDuplicate(pref)}
                      dragHandleProps={draggableProvided.dragHandleProps}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {atLimit && (
        <p className="text-xs text-muted-foreground text-center mt-4 px-4 py-2 bg-muted rounded-xl">
          You've reached the 5-preference limit. Remove one to add another.
        </p>
      )}
    </DragDropContext>
  );
}

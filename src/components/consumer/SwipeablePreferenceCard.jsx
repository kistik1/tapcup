import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Star, Copy, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PreferenceCard from "./PreferenceCard";
import CoffeeCupSvg from "./CoffeeCupSvg";

const SWIPE_THRESHOLD = 60;
const LONG_PRESS_MS   = 500;

export default function SwipeablePreferenceCard({
  pref,
  onEdit,
  onSetDefault,
  onDelete,
  onDuplicate,
  dragHandleProps,
}) {
  const [expanded, setExpanded]           = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOverlay, setShowOverlay]     = useState(false);
  const longPressTimer                    = useRef(null);
  const dragStartX                        = useRef(null);
  const wasDragged                        = useRef(false);

  const layers = {
    coffee: pref.coffee_pct || 0,
    water:  pref.water_pct  || 0,
    milk:   pref.milk_pct   || 0,
    foam:   pref.foam_pct   || 0,
  };
  const hasLayerData = Object.values(layers).some(v => v > 0);

  // Long press detection
  function handlePointerDown(e) {
    if (e.button && e.button !== 0) return;
    dragStartX.current = e.clientX ?? e.touches?.[0]?.clientX;
    wasDragged.current = false;
    longPressTimer.current = setTimeout(() => {
      setShowOverlay(true);
      longPressTimer.current = null;
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e) {
    if (longPressTimer.current === null) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    if (x !== undefined && Math.abs(x - dragStartX.current) > 8) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      wasDragged.current = true;
    }
  }

  function handlePointerUp() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTap() {
    if (wasDragged.current || showOverlay) return;
    setExpanded(e => !e);
  }

  function handleDragEnd(_, info) {
    wasDragged.current = true;
    const ox = info.offset.x;
    if (ox < -SWIPE_THRESHOLD) {
      setShowDeleteConfirm(true);
    } else if (ox > SWIPE_THRESHOLD) {
      onSetDefault?.();
    }
  }

  const details = [
    pref.milk && pref.milk !== "None" && `${pref.milk} milk`,
    pref.sugar && pref.sugar !== "None" && `${pref.sugar} sugar`,
    pref.temperature,
  ].filter(Boolean);

  return (
    <>
      <div className="relative">
        {/* Background action hints */}
        <div className="absolute inset-0 rounded-2xl flex items-center justify-between px-5 pointer-events-none">
          <div className="flex items-center gap-2 text-white bg-amber-500 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <Star className="w-3.5 h-3.5 fill-white" /> Default
          </div>
          <div className="flex items-center gap-2 text-white bg-destructive px-3 py-1.5 rounded-xl text-xs font-semibold">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </div>
        </div>

        {/* Drag grip for DnD reorder */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center z-10 cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none" }}
            onPointerDown={e => e.stopPropagation()}
          >
            <div className="flex flex-col gap-0.5">
              <div className="w-4 h-0.5 bg-muted-foreground/40 rounded" />
              <div className="w-4 h-0.5 bg-muted-foreground/40 rounded" />
              <div className="w-4 h-0.5 bg-muted-foreground/40 rounded" />
            </div>
          </div>
        )}

        {/* Swipeable card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -90, right: 90 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleTap}
          className={dragHandleProps ? "pl-8" : ""}
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          <PreferenceCard
            pref={pref}
            onEdit={onEdit}
            onSetDefault={onSetDefault}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        </motion.div>

        {/* Long-press quick actions overlay */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-20 bg-background/95 border border-border rounded-2xl shadow-xl flex items-center justify-around px-4"
              onClick={() => setShowOverlay(false)}
            >
              {[
                { icon: Edit2,  label: "Edit",      action: onEdit,      color: "text-foreground" },
                { icon: Star,   label: "Default",   action: onSetDefault, color: "text-amber-600" },
                { icon: Copy,   label: "Duplicate", action: onDuplicate,  color: "text-primary" },
                { icon: Trash2, label: "Delete",    action: () => setShowDeleteConfirm(true), color: "text-destructive" },
              ].map(({ icon: Icon, label, action, color }) => (
                <button
                  key={label}
                  onClick={e => { e.stopPropagation(); setShowOverlay(false); action?.(); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-muted transition-colors ${color}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Inline expand — shows full cup SVG + details */}
      <AnimatePresence>
        {expanded && !showOverlay && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-muted/40 rounded-b-2xl -mt-2 pt-4 pb-4 px-4 flex gap-4 items-start">
              <CoffeeCupSvg
                layers={hasLayerData ? layers : { coffee: 50, water: 0, milk: 20, foam: 30 }}
                vessel={pref.vessel || "mug"}
                size={pref.size || "large"}
                temp={pref.temperature}
                width={100}
                showLabels={true}
                clipId={`cup-expanded-${pref.id}`}
              />
              <div className="flex-1 text-sm space-y-1">
                {details.map((d, i) => (
                  <span key={i} className="block text-xs text-muted-foreground bg-card border border-border rounded-full px-2.5 py-1 inline-flex mr-1 mb-1">
                    {d}
                  </span>
                ))}
                {pref.notes && <p className="text-xs text-muted-foreground italic mt-2">"{pref.notes}"</p>}
                <button
                  onClick={() => { setExpanded(false); onEdit?.(); }}
                  className="mt-2 text-xs text-primary underline underline-offset-2"
                >
                  Edit preference
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{pref.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This preference will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowDeleteConfirm(false); onDelete?.(); }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

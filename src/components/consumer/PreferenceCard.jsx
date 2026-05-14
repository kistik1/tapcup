import { Star, Edit2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import CoffeeCupSvg from "./CoffeeCupSvg";
import { formatStrengthLabel } from "./cup-constants.jsx";

export default function PreferenceCard({ pref, isDefault, onEdit, onSetDefault, onDelete, large }) {
  const hasLayerData = (pref.coffee_pct || 0) + (pref.water_pct || 0) + (pref.milk_pct || 0) + (pref.foam_pct || 0) > 0;
  const layers = {
    coffee: pref.coffee_pct || 0,
    water:  pref.water_pct  || 0,
    milk:   pref.milk_pct   || 0,
    foam:   pref.foam_pct   || 0,
  };

  const details = [
    pref.strength && `${formatStrengthLabel(pref.strength)} strength`,
    pref.milk && pref.milk !== "None" && `${pref.milk} milk`,
    pref.sugar && pref.sugar !== "None" && `${pref.sugar} sugar`,
    pref.temperature && `${pref.temperature}`,
  ].filter(Boolean);

  if (large) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-amber-400/30"
      >
        {/* Hero cup area */}
        <div className="relative h-56 w-full bg-gradient-to-br from-amber-950 to-amber-800 flex items-center justify-center">
          {pref.image_url ? (
            <>
              <img src={pref.image_url} alt={pref.coffee_type} className="w-full h-full object-cover absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </>
          ) : (
            <>
              <CoffeeCupSvg
                layers={hasLayerData ? layers : { coffee: 50, water: 0, milk: 20, foam: 30 }}
                vessel={pref.vessel || "mug"}
                size={pref.size || "large"}
                temp={pref.temperature}
                width={140}
                clipId={`cup-large-${pref.id}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </>
          )}

          {/* Default badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
            <Star className="w-3 h-3 fill-white" /> DEFAULT
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white font-bold text-xl leading-tight">{pref.name}</p>
            <p className="text-amber-200 text-sm font-medium">{pref.coffee_type}</p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-card px-4 py-3">
          {details.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {details.map((d, i) => (
                <span key={i} className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                  {d}
                </span>
              ))}
            </div>
          )}
          {pref.notes && (
            <p className="text-sm text-muted-foreground italic mb-3">"{pref.notes}"</p>
          )}
          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <button onClick={onEdit} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete} className="flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Compact card
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex items-center gap-3 bg-card border border-border rounded-2xl overflow-hidden hover:border-amber-300 transition-all"
    >
      {/* Cup preview */}
      <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-amber-950 to-amber-800 flex items-center justify-center overflow-hidden">
        {pref.image_url ? (
          <img src={pref.image_url} alt={pref.coffee_type} className="w-full h-full object-cover" />
        ) : (
          <CoffeeCupSvg
            layers={hasLayerData ? layers : { coffee: 50, water: 0, milk: 20, foam: 30 }}
            vessel={pref.vessel || "mug"}
            size={pref.size || "large"}
            temp={pref.temperature}
            width={58}
            clipId={`cup-compact-${pref.id}`}
          />
        )}
      </div>

      <div className="flex-1 py-3 pr-3 min-w-0">
        <p className="font-semibold text-sm leading-tight">{pref.name}</p>
        <p className="text-xs text-muted-foreground">{pref.coffee_type}</p>
        {details.length > 0 && (
          <p className="text-xs text-muted-foreground/70 mt-1 truncate">{details.join(" · ")}</p>
        )}
      </div>

      {(onEdit || onSetDefault || onDelete) && (
        <div className="flex flex-col gap-1 pr-3">
          {onEdit && (
            <button onClick={onEdit} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onSetDefault && (
            <button onClick={onSetDefault} className="text-amber-500 hover:text-amber-600 p-1.5 rounded-lg hover:bg-amber-50 transition-colors" title="Set as default">
              <Star className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="text-destructive/50 hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

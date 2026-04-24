import { Star, Edit2, Trash2, Check } from "lucide-react";
import { motion } from "framer-motion";

const VESSEL_EMOJI = { mug: "🫖", glass: "🥛", ta: "📄" };

export default function PreferenceCard({ pref, isDefault, onEdit, onSetDefault, onDelete, large }) {
  const vesselEmoji = VESSEL_EMOJI[pref.vessel] || "☕";
  const details = [
    pref.strength && `${pref.strength}`,
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
        {/* Big image */}
        <div className="relative h-56 w-full">
          {pref.image_url ? (
            <img src={pref.image_url} alt={pref.coffee_type} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-900 to-amber-600 flex items-center justify-center">
              <span className="text-6xl">{vesselEmoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* Default badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
            <Star className="w-3 h-3 fill-white" /> DEFAULT
          </div>
          {/* Title */}
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white font-playfair text-xl font-bold leading-tight">{pref.name}</p>
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
          <div className="flex gap-2">
            <button onClick={onEdit} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
              <Edit2 className="w-3 h-3" /> Edit
            </button>
            <button onClick={onDelete} className="flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          </div>
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
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0">
        {pref.image_url ? (
          <img src={pref.image_url} alt={pref.coffee_type} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-800 to-amber-500 flex items-center justify-center">
            <span className="text-2xl">{vesselEmoji}</span>
          </div>
        )}
      </div>

      <div className="flex-1 py-3 pr-3 min-w-0">
        <p className="font-semibold text-sm leading-tight">{pref.name}</p>
        <p className="text-xs text-muted-foreground">{pref.coffee_type}</p>
        {details.length > 0 && (
          <p className="text-xs text-muted-foreground/70 mt-1 truncate">{details.join(" · ")}</p>
        )}
      </div>

      <div className="flex flex-col gap-1 pr-3">
        <button onClick={onEdit} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onSetDefault} className="text-amber-500 hover:text-amber-600 p-1.5 rounded-lg hover:bg-amber-50 transition-colors" title="Set as default">
          <Star className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="text-destructive/50 hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
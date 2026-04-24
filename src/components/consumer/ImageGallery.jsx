import { motion } from "framer-motion";
import { X } from "lucide-react";

const COFFEE_IMAGES = [
  { url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80", label: "Espresso" },
  { url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80", label: "Latte Art" },
  { url: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80", label: "Cappuccino" },
  { url: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&q=80", label: "Flat White" },
  { url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80", label: "Pour Over" },
  { url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80", label: "Cold Brew" },
  { url: "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=600&q=80", label: "Iced Coffee" },
  { url: "https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=600&q=80", label: "Macchiato" },
  { url: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600&q=80", label: "Mocha" },
  { url: "https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=600&q=80", label: "Americano" },
  { url: "https://images.unsplash.com/photo-1490718720478-364a07a997cd?w=600&q=80", label: "Filter Coffee" },
  { url: "https://images.unsplash.com/photo-1547414368-ac947d00b91d?w=600&q=80", label: "Ristretto" },
  { url: "https://i.pinimg.com/736x/74/77/02/747702a72bba1a296558e36542592bbb.jpg", label: "Latte" },
  { url: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&q=80", label: "Coffee & Milk" },
  { url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80", label: "Drip Coffee" },
  { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", label: "Frappe" },
];

export default function ImageGallery({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Pick a Coffee Image</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-2.5">
            {COFFEE_IMAGES.map((img, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(img.url)}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-amber-400 transition-all"
              >
                <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                  <p className="text-white text-[10px] font-medium text-center">{img.label}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
import { Droplets, Coffee, Layers, Wind } from "lucide-react";

// Canonical stacking order: coffee at base, foam at top
export const LAYER_ORDER = ["coffee", "water", "milk", "foam"];

export const LAYER_DEFS = [
  { key: "coffee", label: "Coffee", color: "#6b3a1f", dark: "#3d1f08", icon: Coffee },
  { key: "water",  label: "Water",  color: "#a8d5f5", dark: "#4a90c4", icon: Droplets },
  { key: "milk",   label: "Milk",   color: "#f5e6c8", dark: "#c49a3a", icon: Layers },
  { key: "foam",   label: "Foam",   color: "#f0ede8", dark: "#9e9086", icon: Wind },
];

export const VESSEL_DEFS = [
  { value: "mug",   label: "Mug",   topW: 140, botW: 130 },
  { value: "glass", label: "Glass", topW: 140, botW: 90  },
  { value: "ta",    label: "TA",    topW: 120, botW: 80  },
];

export const SIZE_DEFS = [
  { value: "small", label: "Small", totalMl: 150, cupH: 160 },
  { value: "large", label: "Large", totalMl: 300, cupH: 220 },
];

export const ESPRESSO_DOSES = [
  { value: "1", label: "Single", desc: "1 × 36ml", emoji: "☕",     coffeePct: 30 },
  { value: "2", label: "Double", desc: "2 × 36ml", emoji: "☕☕",   coffeePct: 50 },
  { value: "3", label: "Triple", desc: "3 × 36ml", emoji: "☕☕☕", coffeePct: 70 },
];

export const MILK_TYPES  = ["None", "Whole", "Skim", "Oat", "Almond", "Soy", "Coconut"];
export const SUGARS      = ["None", "Half", "1 tsp", "2 tsp", "3 tsp"];
export const TEMPS       = ["Extra Hot", "Hot", "Warm", "Iced"];

export const DEFAULT_LAYERS = { coffee: 60, water: 0, milk: 20, foam: 20 };

export const MUG_SVG = (
  <svg viewBox="0 0 56 56" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 12 Q19 8 17 4"/>
    <path d="M23 12 Q25 8 23 4"/>
    <rect x="8" y="14" width="28" height="26" rx="3"/>
    <path d="M36 20 Q46 20 46 27 Q46 34 36 34"/>
    <line x1="8" y1="40" x2="36" y2="40"/>
  </svg>
);

export const GLASS_SVG = (
  <svg viewBox="0 0 56 56" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 6 L46 6 L40 50 L16 50 Z"/>
    <line x1="20" y1="10" x2="18" y2="46"/>
    <line x1="28" y1="10" x2="28" y2="46"/>
    <line x1="36" y1="10" x2="38" y2="46"/>
    <path d="M14 22 Q19 18 24 22 Q29 26 34 22 Q39 18 43 22"/>
  </svg>
);

export const TA_SVG = (
  <svg viewBox="0 0 56 56" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="10" y="8" width="36" height="7" rx="3.5"/>
    <path d="M20 8 Q28 4 36 8"/>
    <path d="M13 15 L15 50 L41 50 L43 15 Z"/>
    <circle cx="28" cy="32" r="6"/>
  </svg>
);

export const VESSEL_SVGS = { mug: MUG_SVG, glass: GLASS_SVG, ta: TA_SVG };

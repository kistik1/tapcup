import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import CoffeeCupSvg from "./CoffeeCupSvg";

const ANIM_LAYERS_KEYFRAMES = [
  { coffee: 0, water: 0, milk: 0, foam: 0 },
  { coffee: 50, water: 0, milk: 0, foam: 0 },
  { coffee: 50, water: 0, milk: 20, foam: 0 },
  { coffee: 50, water: 0, milk: 20, foam: 30 },
];

export default function PreferenceEmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      {/* Animated cup — static at final state since CoffeeCupSvg is presentational;
          the motion wrapper adds a subtle float animation */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mb-6"
      >
        <CoffeeCupSvg
          layers={{ coffee: 50, water: 0, milk: 20, foam: 30 }}
          vessel="mug"
          size="large"
          temp="Hot"
          width={120}
          clipId="cup-empty-state"
        />
      </motion.div>

      <h2 className="text-xl font-bold mb-2">Your first coffee is on us</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        Tell us how you like it and we'll remember forever
      </p>

      <Button
        onClick={onAdd}
        className="h-12 px-8 rounded-2xl font-semibold bg-primary text-primary-foreground"
      >
        Create My First Order
      </Button>
    </div>
  );
}

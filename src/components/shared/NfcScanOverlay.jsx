import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import ReadyToScanCup from "@/components/shared/ReadyToScanCup";

export default function NfcScanOverlay({ visible, onCancel, message }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="nfc-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-100 px-6"
        >
          {/* Close (X) */}
          <button
            onClick={onCancel}
            aria-label="Close NFC scan overlay"
            data-testid="nfc-scan-close"
            className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-card rounded-3xl shadow-2xl border border-border px-8 py-10 max-w-sm w-full flex flex-col items-center"
          >
            <ReadyToScanCup size={180} />
            <h2 className="font-playfair text-xl font-semibold text-foreground mt-6">Ready to Scan</h2>
            <p className="text-muted-foreground text-sm text-center mt-2 leading-relaxed">
              {message || "Hold the NFC keychain near the top of your device"}
            </p>
          </motion.div>

          {/* Cancel pill */}
          <motion.button
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-muted-foreground hover:text-foreground text-sm border border-border bg-card px-6 py-2 rounded-full transition-colors"
          >
            Cancel
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

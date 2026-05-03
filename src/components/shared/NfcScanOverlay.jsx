import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function NfcScanOverlay({ visible, onCancel, message }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="nfc-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
        >
          {/* Cancel button */}
          <button
            onClick={onCancel}
            aria-label="Close NFC scan overlay"
            data-testid="nfc-scan-close"
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* NFC icon + rings */}
          <div className="relative flex items-center justify-center mb-10">
            {/* Outer ring 1 */}
            <motion.div
              className="absolute w-64 h-64 rounded-full border border-white/10"
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.05, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Outer ring 2 */}
            <motion.div
              className="absolute w-48 h-48 rounded-full border border-white/20"
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
            {/* Middle ring */}
            <motion.div
              className="absolute w-36 h-36 rounded-full border-2 border-white/30"
              animate={{ scale: [1, 1.08, 1], opacity: [0.7, 0.2, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            />
            {/* Center circle */}
            <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/40 flex items-center justify-center shadow-2xl backdrop-blur">
              {/* NFC signal icon as SVG */}
              <svg viewBox="0 0 48 48" className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {/* NFC "N" shape waves */}
                <path d="M18 14 L18 34 L30 14 L30 34" stroke="white" strokeWidth="3" fill="none"/>
                <path d="M8 24 Q8 8 24 8" stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
                <path d="M40 24 Q40 8 24 8" stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
                <path d="M8 24 Q8 40 24 40" stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
                <path d="M40 24 Q40 40 24 40" stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
              </svg>
            </div>
          </div>

          {/* Text */}
          <motion.div
            className="text-center px-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-white text-2xl font-semibold mb-2">Ready to Scan</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              {message || "Hold the NFC keychain near the top of your device"}
            </p>
          </motion.div>

          {/* Cancel button at bottom */}
          <motion.button
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-10 text-white/50 hover:text-white/80 text-sm border border-white/20 px-6 py-2 rounded-full transition-colors"
          >
            Cancel
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

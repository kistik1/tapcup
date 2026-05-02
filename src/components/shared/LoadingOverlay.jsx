import { AnimatePresence, motion } from "framer-motion";

export default function LoadingOverlay({ visible, title = "Loading", message, onCancel }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md px-6"
        >
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          )}

          <div className="w-14 h-14 rounded-full border-4 border-white/20 border-t-white animate-spin" />
          <h2 className="mt-6 text-white text-xl font-semibold text-center">{title}</h2>
          {message && (
            <p className="mt-2 text-white/65 text-sm leading-relaxed text-center max-w-sm">
              {message}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

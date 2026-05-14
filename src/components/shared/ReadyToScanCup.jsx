import { motion } from "framer-motion";

export default function ReadyToScanCup({ size = 200, className = "" }) {
  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Cup image — static */}
      <img
        src="/ready-scan-cup.png"
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain select-none"
      />

      {/* Steam — stays in world frame above the cup, rising straight up */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 200"
        style={{ overflow: "visible" }}
      >
        {[82, 100, 118].map((x, i) => (
          <motion.path
            key={i}
            d={`M${x} 56 Q${x + 6} 44 ${x - 3} 32 Q${x - 9} 20 ${x} 6`}
            stroke="#9ba3a8"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            animate={{ opacity: [0.15, 0.6, 0.15], y: [0, -8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          />
        ))}
      </svg>
    </div>
  );
}

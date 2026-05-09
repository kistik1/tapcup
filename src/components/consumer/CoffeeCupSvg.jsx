import { motion } from "framer-motion";
import { LAYER_DEFS, LAYER_ORDER, VESSEL_DEFS, SIZE_DEFS } from "./cup-constants.jsx";

const CX = 100;

/**
 * Pure presentational SVG coffee cup.
 * No state, no drag — just renders layers.
 *
 * @param {Object} props
 * @param {{ coffee, water, milk, foam }} props.layers  - percentages 0–100
 * @param {"mug"|"glass"|"ta"} props.vessel
 * @param {"small"|"large"} props.size
 * @param {string} [props.temp]
 * @param {number} [props.width=120]
 * @param {boolean} [props.showLabels=false]
 * @param {string} props.clipId - REQUIRED, unique per instance to avoid SVG clip-path collision
 */
export default function CoffeeCupSvg({
  layers,
  vessel = "mug",
  size = "large",
  temp,
  width = 120,
  showLabels = false,
  clipId,
}) {
  const vesselDef = VESSEL_DEFS.find(v => v.value === vessel) || VESSEL_DEFS[0];
  const sizeDef   = SIZE_DEFS.find(s => s.value === size)     || SIZE_DEFS[1];
  const TOP_W = vesselDef.topW;
  const BOT_W = vesselDef.botW;
  const cupH  = sizeDef.cupH;

  const safeClipId = clipId || "cup-clip-default";

  // Scale: the SVG internal viewBox is 200 wide; width prop scales it
  const viewBoxW = 200;
  const scale    = width / viewBoxW;
  const svgH     = (cupH + 20) * scale;

  function xAtY(y) {
    const t = 1 - y / cupH;
    return BOT_W / 2 + (TOP_W / 2 - BOT_W / 2) * t;
  }

  function layerPoints(startPct, pct) {
    if (pct <= 0) return null;
    const yB    = cupH - (startPct / 100) * cupH;
    const yT    = cupH - ((startPct + pct) / 100) * cupH;
    const xBh   = xAtY(yB);
    const xTh   = xAtY(yT);
    return `${CX - xBh},${yB} ${CX + xBh},${yB} ${CX + xTh},${yT} ${CX - xTh},${yT}`;
  }

  // Compute stacked layers
  const hasLayers = layers && LAYER_ORDER.some(k => (layers[k] || 0) > 0);

  const stacked = (() => {
    let cum = 0;
    return LAYER_ORDER.map(key => {
      const startPct = cum;
      const pct = layers?.[key] || 0;
      cum += pct;
      return { key, pct, startPct };
    });
  })();

  const cupPoly = `${CX - TOP_W/2},0 ${CX + TOP_W/2},0 ${CX + BOT_W/2},${cupH} ${CX - BOT_W/2},${cupH}`;
  const isHot   = temp === "Hot" || temp === "Extra Hot";

  return (
    <svg
      width={width}
      height={svgH}
      viewBox={`0 0 ${viewBoxW} ${cupH + 20}`}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <clipPath id={safeClipId}>
          <polygon points={cupPoly} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${safeClipId})`}>
        {hasLayers ? (
          stacked.map(({ key, pct, startPct }) => {
            const ld  = LAYER_DEFS.find(l => l.key === key);
            const pts = layerPoints(startPct, pct);
            if (!pts) return null;
            return <polygon key={key} points={pts} fill={ld.color} />;
          })
        ) : (
          // Fallback gradient for legacy records with no layer data
          <polygon points={cupPoly} fill="#f5e6c8" opacity="0.6" />
        )}

        {/* Shine overlay */}
        <polygon
          points={`${CX - TOP_W/2 + 5},0 ${CX - TOP_W/2 + 22},0 ${CX - BOT_W/2 + 14},${cupH} ${CX - BOT_W/2 + 5},${cupH}`}
          fill="white" opacity="0.08"
          style={{ pointerEvents: "none" }}
        />
      </g>

      {/* Cup outline */}
      <polygon
        points={cupPoly}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Layer labels (editor mode only) */}
      {showLabels && stacked.map(({ key, pct, startPct }) => {
        if (pct < 9) return null;
        const ld   = LAYER_DEFS.find(l => l.key === key);
        const midY = cupH - ((startPct + pct / 2) / 100) * cupH;
        return (
          <text
            key={key} x={CX} y={midY + 4}
            textAnchor="middle" fontSize={10} fontWeight="600" fill={ld.dark}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {ld.label} {pct}%
          </text>
        );
      })}

      {/* Steam for hot drinks */}
      {isHot && [88, 100, 112].map((x, i) => (
        <motion.path
          key={i}
          d={`M${x} -2 Q${x + 5} -10 ${x} -20`}
          stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round"
          animate={{ opacity: [0.2, 0.7, 0.2], y: [-1, -6, -1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}
    </svg>
  );
}

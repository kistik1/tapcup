import { motion } from "framer-motion";
import { LAYER_DEFS, LAYER_ORDER, VESSEL_DEFS, SIZE_DEFS } from "./cup-constants.jsx";

const CX = 100;

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
  const shineId    = `${safeClipId}-shine`;

  const viewBoxW = 200;
  const svgH     = (cupH + 32) * (width / viewBoxW);

  const left     = CX - TOP_W / 2;
  const right    = CX + TOP_W / 2;
  const botLeft  = CX - BOT_W / 2;
  const botRight = CX + BOT_W / 2;

  function xAtY(y) {
    const t = 1 - y / cupH;
    return BOT_W / 2 + (TOP_W / 2 - BOT_W / 2) * t;
  }

  // ── Vessel-specific cup outline path ────────────────────────────────
  function getCupPath() {
    if (vessel === "mug") {
      const r = 9;
      // Rounded top corners, straight tapered sides, flat bottom
      return [
        `M ${left + r},0`,
        `L ${right - r},0`,
        `Q ${right},0 ${right},${r}`,
        `L ${botRight},${cupH}`,
        `L ${botLeft},${cupH}`,
        `L ${left},${r}`,
        `Q ${left},0 ${left + r},0`,
        "Z",
      ].join(" ");
    }
    if (vessel === "glass") {
      // Slightly curved sides — cubic bezier gives a subtle concave glass shape
      return [
        `M ${left},0`,
        `L ${right},0`,
        `C ${right - 3},${cupH * 0.38} ${botRight + 3},${cupH * 0.62} ${botRight},${cupH}`,
        `L ${botLeft},${cupH}`,
        `C ${left + 3},${cupH * 0.62} ${left - 3},${cupH * 0.38} ${left},0`,
        "Z",
      ].join(" ");
    }
    // TA / paper cup — straight trapezoid
    return `M ${left},0 L ${right},0 L ${botRight},${cupH} L ${botLeft},${cupH} Z`;
  }

  const cupPath = getCupPath();
  const isHot   = temp === "Hot" || temp === "Extra Hot";

  // ── Stacked layer computation ────────────────────────────────────────
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

  // ── Layer shapes ─────────────────────────────────────────────────────
  function layerShape(key, startPct, pct) {
    if (pct <= 0) return null;
    const yB  = cupH - (startPct / 100) * cupH;
    const yT  = cupH - ((startPct + pct) / 100) * cupH;
    const xBh = xAtY(yB);
    const xTh = xAtY(yT);
    const ld  = LAYER_DEFS.find(l => l.key === key);
    if (!ld) return null;

    if (key === "foam") {
      // Wavy top edge via quadratic bezier
      const d = [
        `M ${CX - xTh},${yT}`,
        `Q ${CX},${yT - 7} ${CX + xTh},${yT}`,
        `L ${CX + xBh},${yB}`,
        `L ${CX - xBh},${yB}`,
        "Z",
      ].join(" ");
      return <path key={key} d={d} fill={ld.color} />;
    }
    return (
      <polygon
        key={key}
        points={`${CX - xBh},${yB} ${CX + xBh},${yB} ${CX + xTh},${yT} ${CX - xTh},${yT}`}
        fill={ld.color}
      />
    );
  }

  // ── Layer boundary separators ────────────────────────────────────────
  const separators = stacked.slice(0, -1).map(({ pct: p1, startPct }, j) => {
    if (p1 === 0 || stacked[j + 1].pct === 0) return null;
    const cum = startPct + p1;
    const y   = cupH - (cum / 100) * cupH;
    const xH  = xAtY(y);
    return { key: cum, y, xH };
  }).filter(Boolean);

  return (
    <svg
      width={width}
      height={svgH}
      viewBox={`0 0 ${viewBoxW} ${cupH + 32}`}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <clipPath id={safeClipId}>
          <path d={cupPath} />
        </clipPath>
        <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="white" stopOpacity="0.20" />
          <stop offset="50%"  stopColor="white" stopOpacity="0.04" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Mug handle — drawn first so it sits behind the cup body */}
      {vessel === "mug" && (() => {
        const rx = botRight;
        const y1 = cupH * 0.30;
        const y2 = cupH * 0.68;
        return (
          <path
            d={`M ${rx},${y1} C ${rx + 34},${y1} ${rx + 34},${y2} ${rx},${y2}`}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={7}
            strokeLinecap="round"
          />
        );
      })()}

      {/* Liquid fill, clipped to cup shape */}
      <g clipPath={`url(#${safeClipId})`}>
        {hasLayers
          ? stacked.map(({ key, pct, startPct }) => layerShape(key, startPct, pct))
          : <path d={cupPath} fill="#f5e6c8" opacity="0.6" />
        }

        {/* Layer separators */}
        {separators.map(({ key, y, xH }) => (
          <line key={key} x1={CX - xH} y1={y} x2={CX + xH} y2={y}
            stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
        ))}

        {/* Gradient shine */}
        <rect
          x={left} y={0} width={TOP_W * 0.36} height={cupH}
          fill={`url(#${shineId})`}
          style={{ pointerEvents: "none" }}
        />

        {/* Glass side highlights */}
        {vessel === "glass" && <>
          <line x1={left + 9}  y1={2}  x2={botLeft + 7}  y2={cupH - 2}
            stroke="white" strokeOpacity="0.14" strokeWidth={4} strokeLinecap="round" />
          <line x1={left + 19} y1={2}  x2={botLeft + 14} y2={cupH - 2}
            stroke="white" strokeOpacity="0.07" strokeWidth={2} strokeLinecap="round" />
        </>}
      </g>

      {/* Cup outline */}
      <path
        d={cupPath}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* TA lid */}
      {vessel === "ta" && (
        <rect
          x={left + 3} y={-9} width={TOP_W - 6} height={11} rx={4}
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth={1.5}
        />
      )}

      {/* Layer labels */}
      {showLabels && stacked.map(({ key, pct, startPct }) => {
        if (pct < 9) return null;
        const ld   = LAYER_DEFS.find(l => l.key === key);
        const midY = cupH - ((startPct + pct / 2) / 100) * cupH;
        return (
          <text key={key} x={CX} y={midY + 4}
            textAnchor="middle" fontSize={10} fontWeight="600" fill={ld?.dark}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {ld?.label} {pct}%
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

/**
 * 원점 (0, 0)에 표시하는 십자 마크
 */
export function OriginCross() {
  const size = 12;
  const stroke = 2;
  const half = size / 2;
  return (
    <div
      className="origin-cross"
      style={{
        position: "absolute",
        left: -half,
        top: -half,
        width: size,
        height: size,
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <line
          x1={half}
          y1={0}
          x2={half}
          y2={size}
          stroke="var(--origin-color, #888)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <line
          x1={0}
          y1={half}
          x2={size}
          y2={half}
          stroke="var(--origin-color, #888)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

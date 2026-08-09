/* ============================================================
   CINEVERSE — SVG Charts (no external library)
   Exports: LineChart, BarChart, DonutChart, MiniSpark, KPICard
   ============================================================ */

/* ---------------- LineChart ---------------- */
function LineChart({ data = [], width = 600, height = 180, color = "var(--gold)", label = "Revenue" }) {
  if (!data.length) return null;
  const pad = { t: 12, r: 16, b: 32, l: 56 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals) * 0.9;
  const max = Math.max(...vals) * 1.05;
  const span = (max - min) || 1;                  // tránh chia 0 khi mọi giá trị bằng nhau
  const x = i => data.length === 1                 // tránh chia 0 khi chỉ 1 điểm
    ? pad.l + W / 2
    : pad.l + (i / (data.length - 1)) * W;
  const y = v => pad.t + H - ((v - min) / span) * H;
  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const areaPath = `M ${x(0)},${y(data[0].value)} ${data.map((d, i) => `L ${x(i)},${y(d.value)}`).join(" ")} L ${x(data.length - 1)},${pad.t + H} L ${x(0)},${pad.t + H} Z`;
  const linePath = `M ${x(0)},${y(data[0].value)} ${data.map((d, i) => `L ${x(i)},${y(d.value)}`).join(" ")}`;

  // pick ~5 labels spread across data
  const labelEvery = Math.max(1, Math.floor(data.length / 5));
  const labelIndices = data.map((_, i) => i).filter((_, i) => i % labelEvery === 0 || i === data.length - 1);

  // y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => min + t * (max - min));
  const C = window.CINE;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="lgfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* grid lines */}
      {ticks.map((t, i) => (
        <line key={i} x1={pad.l} x2={pad.l + W} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* y labels */}
      {ticks.filter((_, i) => i % 2 === 0).map((t, i) => (
        <text key={i} x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.3)">{C.formatCompact(t)}</text>
      ))}
      {/* area fill */}
      <path d={areaPath} fill="url(#lgfill)" />
      {/* line */}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {/* dots on hover-able points */}
      {data.map((d, i) => (
        labelIndices.includes(i) && (
          <circle key={i} cx={x(i)} cy={y(d.value)} r="3.5" fill={color} stroke="var(--surface)" strokeWidth="2" />
        )
      ))}
      {/* x labels */}
      {labelIndices.map(i => (
        <text key={i} x={x(i)} y={pad.t + H + 18} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.35)">{data[i].label}</text>
      ))}
    </svg>
  );
}

/* ---------------- BarChart ---------------- */
function BarChart({ data = [], height = 180, color = "var(--gold)" }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value));
  const C = window.CINE;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, width: "100%", paddingBottom: 24, position: "relative" }}>
      {data.map((d, i) => {
        const pct = max > 0 ? d.value / max : 0;
        const barH = pct * (height - 24);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}
            title={`${d.label}: ${C.formatCompact(d.value)}`}>
            <div style={{
              width: "100%", height: barH, borderRadius: "4px 4px 0 0",
              // dùng backgroundImage chồng lên màu nền: ${color} có thể là var(--x)
              // nên không nối chuỗi alpha "99" vào được (sẽ thành màu không hợp lệ).
              background: color,
              backgroundImage: "linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0))",
              transition: "height 0.4s ease",
              minHeight: 2,
            }} />
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center" }}>
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- DonutChart ---------------- */
function DonutChart({ segments = [], size = 120, thickness = 26 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (!total) return null;
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let cumulative = 0;
  const arcs = segments.map(seg => {
    const frac = seg.value / total;
    const dash = frac * circ;
    const gap = circ - dash;
    const offset = circ * (1 - cumulative) - circ * 0.25;
    cumulative += frac;
    return { ...seg, dash, gap, offset };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width={size} height={size} style={{ flex: "none" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth={thickness}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={arc.offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        ))}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, flex: "none" }} />
            <span className="muted">{seg.label}</span>
            <span style={{ marginLeft: "auto", fontWeight: 600, paddingLeft: 8 }}>{Math.round(seg.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- MiniSpark ---------------- */
function MiniSpark({ data = [], color = "var(--gold)", height = 36, width = 80 }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`
  ).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- KPI Card ---------------- */
function KPICard({ label, value, sub, trend, color = "var(--gold)", icon, spark }) {
  const up = trend >= 0;
  return (
    <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: color + "22", display: "grid", placeItems: "center" }}>
          <Icon name={icon} size={20} color={color} />
        </div>
        {spark && <MiniSpark data={spark} color={color} />}
      </div>
      <div>
        <div style={{ fontFamily: "var(--ff-head)", fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{label}</div>
      </div>
      {trend !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
          <span style={{ color: up ? "var(--mint)" : "var(--coral)", fontWeight: 600 }}>
            {up ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
          <span className="muted-2">{sub}</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { LineChart, BarChart, DonutChart, MiniSpark, KPICard });

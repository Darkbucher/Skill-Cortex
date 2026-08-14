/**
 * components/ProgressTimeline.jsx — Phase 4
 *
 * Renders a recharts LineChart that plots the number of missing skills over
 * time for the current student, using the gap_snapshots history returned by
 * GET /students/{id}/gap/history.
 *
 * Props:
 *   history  – Array<{ id, missing_skills: string[], computed_at: string }>
 *              in ascending chronological order (as returned by the API).
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0].payload;
  return (
    <div
      style={{
        background: "#1F2430",
        border: "1px solid #2D3546",
        borderRadius: 10,
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        minWidth: 180,
      }}
    >
      <p style={{ color: "#A0A9C0", fontSize: 12, marginBottom: 6 }}>{label}</p>
      <p style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 600, margin: 0 }}>
        {point.missingCount}{" "}
        <span style={{ color: "#A0A9C0", fontWeight: 400, fontSize: 12 }}>
          skill{point.missingCount !== 1 ? "s" : ""} missing
        </span>
      </p>
      {point.skills && point.skills.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ color: "#A0A9C0", fontSize: 11, marginBottom: 4 }}>Still missing:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {point.skills.slice(0, 6).map((s) => (
              <span
                key={s}
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#FCA5A5",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: 10,
                }}
              >
                {s}
              </span>
            ))}
            {point.skills.length > 6 && (
              <span style={{ color: "#A0A9C0", fontSize: 10 }}>
                +{point.skills.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProgressTimeline({ history }) {
  if (!history || history.length === 0) {
    return (
      <div
        style={{
          background: "white",
          borderRadius: 12,
          border: "1px solid #E5E7EB",
          padding: "32px 24px",
          marginTop: 24,
          textAlign: "center",
          color: "#6B7280",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📈</div>
        <p style={{ fontWeight: 500, marginBottom: 4 }}>No history yet</p>
        <p style={{ fontSize: 13 }}>
          Compute your skill gap a few times to see your progress over time.
        </p>
      </div>
    );
  }

  // Transform API data into chart-friendly format
  const chartData = history.map((snap) => ({
    date: formatDate(snap.computed_at),
    missingCount: snap.missing_skills.length,
    skills: snap.missing_skills,
  }));

  const maxMissing = Math.max(...chartData.map((d) => d.missingCount), 1);
  const latestCount = chartData[chartData.length - 1].missingCount;
  const firstCount = chartData[0].missingCount;
  const improved = firstCount - latestCount;
  const trend = improved > 0 ? "improving" : improved < 0 ? "regressing" : "steady";

  const trendConfig = {
    improving: { color: "#10B981", label: `↓ ${improved} skills closed`, bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
    regressing: { color: "#EF4444", label: `↑ ${Math.abs(improved)} skills added`, bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
    steady: { color: "#6366F1", label: "→ No change yet", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)" },
  };
  const tc = trendConfig[trend];

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        border: "1px solid #E5E7EB",
        padding: "28px",
        marginTop: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F2430", margin: 0, marginBottom: 4 }}>
            Progress Timeline
          </h3>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
            Missing skills over time · {history.length} snapshot{history.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Trend badge */}
        <div
          style={{
            background: tc.bg,
            border: `1px solid ${tc.border}`,
            borderRadius: 8,
            padding: "6px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 2,
          }}
        >
          <span style={{ fontSize: 12, color: tc.color, fontWeight: 600 }}>{tc.label}</span>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>
            {latestCount} skill{latestCount !== 1 ? "s" : ""} remaining
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            domain={[0, maxMissing + 1]}
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Zero line — visual goal marker */}
          {maxMissing > 0 && (
            <ReferenceLine y={0} stroke="#10B981" strokeDasharray="4 4" strokeOpacity={0.4} />
          )}

          <Area
            type="monotone"
            dataKey="missingCount"
            stroke="#6366F1"
            strokeWidth={2.5}
            fill="url(#gapGradient)"
            dot={{ r: 4, fill: "#6366F1", stroke: "white", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#6366F1", stroke: "white", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Footer note */}
      {latestCount === 0 && (
        <div
          style={{
            marginTop: 16,
            padding: "10px 16px",
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🎉</span>
          <span style={{ fontSize: 13, color: "#059669", fontWeight: 500 }}>
            You've closed all skill gaps — role-ready!
          </span>
        </div>
      )}
    </div>
  );
}

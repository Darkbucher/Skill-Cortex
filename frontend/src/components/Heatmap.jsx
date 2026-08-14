/**
 * components/Heatmap.jsx — Phase 4
 *
 * Admin-facing cohort skill-gap heatmap.
 * Refactored for premium aesthetics using Tailwind CSS.
 */

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── Colour helpers ────────────────────────────────────────────────────────────

/** Map a 0–100 percentage to an amber fill for the heatmap cell. */
function cellColor(pct) {
  if (pct === 0) return "rgba(244, 245, 247, 1)"; // neutral-100
  // Scale from a light amber to deep amber.
  // Amber base: #E9A23B (rgb: 233, 162, 59)
  const alpha = 0.15 + (pct / 100) * 0.85;
  return `rgba(233, 162, 59, ${alpha})`;
}

function cellTextColor(pct) {
  // If the background is too dark, use white text.
  return pct >= 60 ? "#ffffff" : "#785012"; // Dark amber for readability
}

// ── Bar tooltip ───────────────────────────────────────────────────────────────

function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#f4f3ef] dark:bg-espresso-card border border-[#dcdcdc] dark:border-neutral-800 p-5 shadow-card rounded-card min-w-[200px]">
      <p className="font-serif font-bold text-lg text-neutral-900 dark:text-neutral-50 mb-2">{d.skill}</p>
      <div className="space-y-1.5">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          <span className="font-medium text-neutral-900 dark:text-neutral-200">{d.missing_count}</span> student{d.missing_count !== 1 ? "s" : ""} below target
        </p>
        <div className="pt-3 mt-3 border-t border-[#dcdcdc] dark:border-neutral-800 flex items-center gap-2">
          <span className="text-amber-700 dark:text-amber-500 text-xs font-semibold uppercase tracking-wider bg-amber/10 px-2 py-1 rounded">
            {d.percentage}% cohort mismatch
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Heatmap({ api }) {
  const [data, setData] = useState(null);       // list<HeatmapRoleAggregate>
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cohort, setCohort] = useState("");      // year filter input
  const [activeRole, setActiveRole] = useState(null); // selected role for bar drill-down

  const fetchHeatmap = async (cohortYear = "") => {
    setLoading(true);
    setError(null);
    try {
      const qs = cohortYear ? `?cohort=${encodeURIComponent(cohortYear)}` : "";
      const result = await api.get(`/admin/heatmap${qs}`);
      setData(result);
      if (result.length > 0 && !activeRole) {
        setActiveRole(result[0].role_id);
      }
    } catch (err) {
      setError(err.message || "Failed to load heatmap data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmap(cohort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCohortFilter = (e) => {
    e.preventDefault();
    fetchHeatmap(cohort);
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-neutral-500 dark:text-neutral-500 dark:text-neutral-500">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading cohort data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-danger/10 border border-danger/20 rounded-card text-danger dark:text-danger text-sm font-medium flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-24 bg-surface dark:bg-neutral-900 rounded-card border border-dashed border-border shadow-sm transition-colors">
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 transition-colors dark:bg-neutral-800 transition-colors dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-body font-semibold text-neutral-900 dark:text-neutral-100 mb-1">No data available</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 max-w-sm mx-auto">
          Students need to compute their skill gap at least once before the heatmap is populated.
        </p>
      </div>
    );
  }

  const selectedRole = data.find((r) => r.role_id === activeRole) ?? data[0];

  // Collect all unique skills across all roles (for the matrix rows)
  const allSkills = Array.from(
    new Set(data.flatMap((r) => r.skills.map((s) => s.skill)))
  );

  // Build a lookup map: roleId → { skill → { missing_count, percentage } }
  const skillLookup = {};
  for (const role of data) {
    skillLookup[role.role_id] = {};
    for (const s of role.skills) {
      skillLookup[role.role_id][s.skill] = s;
    }
  }

  return (
    <div className="space-y-8 animate-fade-up pb-12">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-h1 font-serif font-bold text-neutral-900 dark:text-neutral-50 mb-1 tracking-tight">
            Cohort Heatmap
          </h2>
          <p className="text-body text-neutral-500 dark:text-neutral-500 dark:text-neutral-500">
            Identify overarching skill gaps across your current student cohorts.
          </p>
        </div>

        <form onSubmit={handleCohortFilter} className="flex items-center gap-2">
          <div className="relative">
            <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <select
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              className="pl-9 pr-8 py-2 bg-neutral-50 dark:bg-neutral-800/50 dark:text-white border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 w-48 appearance-none"
            >
              <option value="">All Cohorts</option>
              <option value="1">First Year</option>
              <option value="2">Second Year</option>
              <option value="3">Third Year</option>
              <option value="4">Final Year</option>
            </select>
            {/* Custom dropdown arrow to replace the native appearance-none one */}
            <svg className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded-btn transition-colors shadow-sm"
          >
            Apply
          </button>
          {cohort && (
            <button
              type="button"
              onClick={() => { setCohort(""); fetchHeatmap(""); }}
              className="px-4 py-2 text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:text-neutral-100 text-sm font-medium rounded-btn transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {data.map((role) => {
          const isActive = activeRole === role.role_id;
          return (
            <button
              key={role.role_id}
              onClick={() => setActiveRole(role.role_id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                isActive
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-surface dark:bg-neutral-900 text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 border-border hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              {role.role_name}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 dark:bg-neutral-800 transition-colors dark:bg-neutral-800 transition-colors dark:bg-neutral-800 text-neutral-500 dark:text-neutral-500 dark:text-neutral-500"
                }`}
              >
                {role.total_students}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bar Chart Drill-down */}
      {selectedRole && selectedRole.skills.length > 0 && (
        <div className="bg-surface dark:bg-neutral-900 rounded-card border border-border shadow-card p-6 transition-colors">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h3 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                {selectedRole.role_name} — Gap Distribution
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 dark:text-neutral-500">
                Displaying skills missing across {selectedRole.total_students} targeted student{selectedRole.total_students !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={selectedRole.skills}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 120, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#52525B" opacity={0.3} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 12, fill: "#71717A" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="skill"
                  tick={{ fontSize: 13, fill: "currentColor", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                  className="text-neutral-900 dark:text-neutral-300"
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(113, 113, 122, 0.1)" }} />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1000} animationEasing="ease-out">
                  {selectedRole.skills.map((entry) => (
                    <Cell key={entry.skill} fill={cellColor(entry.percentage)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cross-Role Comparison Matrix */}
      {data.length > 1 && (
        <div className="bg-surface dark:bg-neutral-900 rounded-card border border-border shadow-card overflow-hidden transition-colors">
          <div className="px-6 py-5 border-b border-border bg-neutral-50/50 dark:bg-neutral-950/50 flex justify-between items-center transition-colors">
            <h3 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-100">
              Cross-Role Comparison Matrix
            </h3>
            
            {/* Legend */}
            <div className="flex items-center gap-3 bg-surface dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-border shadow-sm transition-colors">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-500 dark:text-neutral-500">Gap Severity:</span>
              <div className="flex items-center gap-2">
                {[0, 25, 50, 75, 100].map((v) => (
                  <div key={v} className="flex items-center gap-1.5">
                    <div
                      className="w-3.5 h-3.5 rounded-sm shadow-sm"
                      style={{ background: cellColor(v) }}
                    />
                    {v === 0 || v === 100 ? (
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 font-medium">{v}%</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr>
                  <th className="py-4 px-6 text-sm font-semibold text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 uppercase tracking-wider bg-surface dark:bg-neutral-900 border-b-2 border-border sticky top-0 left-0 z-30 shadow-[2px_2px_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
                    Skill Requirement
                  </th>
                  {data.map((role) => (
                    <th
                      key={role.role_id}
                      className="py-4 px-6 text-center bg-surface dark:bg-neutral-900 border-b-2 border-border sticky top-0 z-20 shadow-[0_2px_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors"
                    >
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">
                        {role.role_name}
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 font-medium">
                        n={role.total_students}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allSkills.map((skill) => (
                  <tr key={skill} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group">
                    <td className="py-3 px-6 text-sm font-medium text-neutral-900 dark:text-neutral-200 bg-surface dark:bg-neutral-900 group-hover:bg-neutral-50/50 dark:group-hover:bg-neutral-800/50 transition-colors sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-none">
                      {skill}
                    </td>
                    {data.map((role) => {
                      const cell = skillLookup[role.role_id][skill];
                      const pct = cell?.percentage ?? 0;
                      const count = cell?.missing_count ?? 0;
                      
                      return (
                        <td key={role.role_id} className="py-3 px-6 text-center">
                          {pct > 0 ? (
                            <div className="flex justify-center">
                              <span
                                className="tabular-nums inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-md text-xs font-bold shadow-sm transition-transform hover:scale-110 cursor-default"
                                style={{
                                  background: cellColor(pct),
                                  color: cellTextColor(pct),
                                  border: `1px solid ${pct >= 60 ? 'rgba(0,0,0,0.1)' : 'rgba(233,162,59,0.2)'}`
                                }}
                                title={`${count} student${count !== 1 ? "s" : ""} missing this skill`}
                              >
                                {pct}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-300 font-medium">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

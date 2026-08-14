// src/pages/MentorDashboard.jsx
// Mentor-facing dashboard with two tabs:
//   Queue    — all students who have gap data, with roadmap status
//   Roadmaps — all roadmaps the mentor can view/edit/approve

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApiClient } from "../hooks/useApiClient";
import RoadmapCard from "../components/RoadmapCard";

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  draft: { label: "Draft", cls: "bg-neutral-100 text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 border-neutral-300" },
  edited: { label: "Edited", cls: "bg-amber-50 text-amber-700 border-amber-300" },
  approved: { label: "Approved", cls: "bg-teal-50 text-teal-700 border-teal-300" },
};

function StatusBadge({ status }) {
  const badge = STATUS_BADGE[status] ?? {
    label: "No Roadmap",
    cls: "bg-neutral-50 dark:bg-neutral-800/50 transition-colors text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 border-neutral-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {badge.label}
    </span>
  );
}

// ── Gap Context Display ───────────────────────────────────────────────────────

function GapContextView({ student }) {
  if (!student || (student.gap_count === 0 && student.level_gap_count === 0)) return null;

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 space-y-3 mb-4">
      {student.missing_skills?.length > 0 && (
        <div>
          <span className="font-semibold block mb-1">Missing Skills ({student.gap_count}):</span>
          <div className="flex flex-wrap gap-1.5">
            {student.missing_skills.map((s, i) => (
              <span key={i} className="bg-white/60 dark:bg-neutral-800/60 px-2 py-0.5 rounded border border-amber-200/50 text-xs">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {student.level_gap_skills?.length > 0 && (
        <div>
          <span className="font-semibold block mb-1">Below Required Level ({student.level_gap_count}):</span>
          <div className="flex flex-wrap gap-1.5">
            {student.level_gap_skills.map((s, i) => (
              <span key={i} className="bg-white/60 dark:bg-neutral-800/60 px-2 py-0.5 rounded border border-amber-200/50 text-xs">
                {typeof s === "string" ? s : s.skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ── Write Roadmap modal ───────────────────────────────────────────────────────

function WriteRoadmapModal({ student, onClose, onCreated, api }) {
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const roadmap = await api.post(`/mentors/students/${student.student_id}/roadmap`, {
        draft_text: text.trim(),
      });
      // Pass the roadmap AND the student context back so RoadmapsTab knows who it belongs to
      onCreated({ ...roadmap, student });
    } catch (err) {
      setError(err.message || "Failed to create roadmap.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface dark:bg-neutral-900 transition-colors rounded-card shadow-card border border-border w-full max-w-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-h2 font-semibold text-neutral-900 dark:text-neutral-100">Write Roadmap</h3>
            <p className="text-caption text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 mt-0.5">
              For <span className="font-medium text-neutral-700 dark:text-neutral-300">{student.name}</span>
              {student.target_role && (
                <> · targeting <span className="font-medium">{student.target_role}</span></>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">{error}</div>
          )}

          {/* Detailed Gap context */}
          <GapContextView student={student} />

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Roadmap Content
            </label>
            <textarea
              id="write-roadmap-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder={`Write a personalised learning roadmap for ${student.name}…\n\nTip: Include:\n• Short-term goals (1–2 months)\n• Recommended resources\n• Skills to prioritise\n• Long-term milestones`}
              required
              className="w-full border border-border rounded-lg px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:text-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="write-roadmap-submit-btn"
              type="submit"
              disabled={isSaving || !text.trim()}
              className="px-5 py-2 bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-sm font-semibold rounded-btn transition-colors disabled:opacity-50"
            >
              {isSaving ? "Creating…" : "Create Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Queue Tab ─────────────────────────────────────────────────────────────────

function QueueTab({ api, onAction }) {
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const data = await api.get("/mentors/queue");
        if (!cancelled) setQueue(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load student queue.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [api]);

  if (isLoading) {
    return (
      <div className="text-center py-16 text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 text-sm">Loading queue…</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-danger/10 text-danger rounded-lg text-sm">{error}</div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-800/50 transition-colors rounded-card border border-dashed border-border">
        <p className="text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 text-sm">No students have run a gap analysis yet.</p>
        <p className="text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 text-xs mt-1">
          Students appear here after computing their first skill gap.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface dark:bg-neutral-900 transition-colors rounded-card shadow-card border border-border overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-neutral-50 dark:bg-neutral-800/50 transition-colors">
            <th className="py-3 px-5 text-xs font-semibold text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
              Student
            </th>
            <th className="py-3 px-5 text-xs font-semibold text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
              Target Role
            </th>
            <th className="py-3 px-5 text-xs font-semibold text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 uppercase tracking-wider text-center">
              Gaps
            </th>
            <th className="py-3 px-5 text-xs font-semibold text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
              Roadmap
            </th>
            <th className="py-3 px-5 text-xs font-semibold text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 uppercase tracking-wider text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {queue.map((student) => (
            <tr
              key={student.student_id}
              className="border-b border-border last:border-0 hover:bg-neutral-50 dark:bg-neutral-800/50 transition-colors"
            >
              <td className="py-3 px-5">
                <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">{student.name}</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 dark:text-neutral-500">{student.email}</p>
              </td>
              <td className="py-3 px-5 text-sm text-neutral-600 dark:text-neutral-500 dark:text-neutral-500">
                {student.target_role ?? <span className="text-neutral-400 dark:text-neutral-500 dark:text-neutral-500">Not set</span>}
              </td>
              <td className="py-3 px-5 text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-danger/10 text-danger text-xs font-bold">
                  {student.gap_count}
                </span>
              </td>
              <td className="py-3 px-5">
                <StatusBadge status={student.roadmap_status} />
              </td>
              <td className="py-3 px-5 text-right">
                <button
                  id={`write-roadmap-btn-${student.student_id}`}
                  onClick={() => onAction(student)}
                  className="text-primary hover:text-primary-light text-sm font-medium transition-colors"
                >
                  {student.roadmap_status ? "View / Edit" : "Write Roadmap"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Roadmaps Tab ──────────────────────────────────────────────────────────────

function RoadmapsTab({ api, initialContext }) {
  const [selected, setSelected] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // If initialContext is passed, fetch the roadmap and add it to our "recently viewed" list
  useEffect(() => {
    if (!initialContext) {
      setIsLoading(false);
      return;
    }

    // Is it a newly created roadmap (already has id)? Or just a student we need to fetch for?
    if (initialContext.id) {
      // It's a populated roadmap with .student attached (from WriteRoadmapModal)
      setRoadmaps((prev) => {
        const exists = prev.find((r) => r.id === initialContext.id);
        if (!exists) return [initialContext, ...prev];
        return prev;
      });
      setSelected(initialContext);
      setIsLoading(false);
    } else {
      // It's just a student object (from "View / Edit" button). We need to fetch the roadmap.
      setIsLoading(true);
      api
        .get(`/mentors/students/${initialContext.student_id}/roadmap`)
        .then((roadmap) => {
          const enriched = { ...roadmap, student: initialContext };
          setRoadmaps((prev) => {
            const exists = prev.find((r) => r.id === enriched.id);
            if (!exists) return [enriched, ...prev];
            return prev;
          });
          setSelected(enriched);
        })
        .catch((err) => {
          alert("Failed to load roadmap.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [initialContext, api]);

  const handleSave = async (newText) => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const updated = await api.put(`/mentors/roadmaps/${selected.id}`, {
        draft_text: newText,
      });
      const enriched = { ...updated, student: selected.student };
      setSelected(enriched);
      setRoadmaps((prev) => prev.map((r) => (r.id === enriched.id ? enriched : r)));
    } catch (err) {
      alert(err.message || "Failed to save roadmap.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    setIsApproving(true);
    try {
      const approved = await api.post(`/mentors/roadmaps/${selected.id}/approve`);
      const enriched = { ...approved, student: selected.student };
      setSelected(enriched);
      setRoadmaps((prev) => prev.map((r) => (r.id === enriched.id ? enriched : r)));
    } catch (err) {
      alert(err.message || "Failed to approve roadmap.");
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-16 text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 text-sm">Loading…</div>;
  }

  if (roadmaps.length === 0) {
    return (
      <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-800/50 transition-colors rounded-card border border-dashed border-border">
        <p className="text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 text-sm">No roadmaps loaded yet.</p>
        <p className="text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 text-xs mt-1">
          Go to the Queue tab and click "View / Edit" or "Write Roadmap" for a student.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* List panel */}
      <div className="lg:col-span-1 bg-surface dark:bg-neutral-900 transition-colors rounded-card shadow-card border border-border overflow-hidden self-start">
        <div className="px-4 py-3 border-b border-border bg-neutral-50 dark:bg-neutral-800/50 transition-colors">
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
            Recently Viewed ({roadmaps.length})
          </p>
        </div>
        <ul>
          {roadmaps.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => setSelected(r)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors ${
                  selected?.id === r.id ? "bg-primary/5" : "hover:bg-neutral-50 dark:bg-neutral-800/50 transition-colors"
                }`}
              >
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {r.student?.name || `Student #${r.student_id}`}
                </p>
                <div className="mt-0.5">
                  <StatusBadge status={r.status} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Detail panel */}
      <div className="lg:col-span-2">
        {selected ? (
          <div>
            {/* Show gaps inline so the mentor can reference them while editing */}
            {selected.student && <GapContextView student={selected.student} />}
            <RoadmapCard
              roadmap={selected}
              mode="mentor"
              onSave={handleSave}
              onApprove={handleApprove}
              isSaving={isSaving}
              isApproving={isApproving}
            />
          </div>
        ) : (
          <div className="text-center py-16 text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 text-sm">
            Select a roadmap from the list to edit.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main MentorDashboard ──────────────────────────────────────────────────────

export default function MentorDashboard({ user }) {
  const api = useApiClient();
  const [activeTab, setActiveTab] = useState("queue");

  // This can be either:
  // 1. A student object from the Queue (if they clicked "View / Edit")
  // 2. A newly created roadmap object with `.student` attached (if they clicked "Write Roadmap" and submitted)
  const [roadmapsTabContext, setRoadmapsTabContext] = useState(null);

  // Target for the creation modal
  const [writeTarget, setWriteTarget] = useState(null);

  const handleQueueAction = (student) => {
    if (student.roadmap_status) {
      // Roadmap exists — jump to Roadmaps tab to edit it
      setRoadmapsTabContext(student);
      setActiveTab("roadmaps");
    } else {
      // No roadmap yet — open creation modal
      setWriteTarget(student);
    }
  };

  const handleRoadmapCreated = (roadmapWithStudent) => {
    setWriteTarget(null);
    setRoadmapsTabContext(roadmapWithStudent);
    setActiveTab("roadmaps");
  };

  return (
    <div className="space-y-8 animate-fade-up pb-12">
      {/* Header */}
      <div className="bg-surface dark:bg-neutral-900 transition-colors rounded-card shadow-card border border-border p-6 mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-h1 font-serif font-bold text-neutral-900 dark:text-neutral-50 mb-1 tracking-tight">
            Mentor Dashboard
          </h2>
          <p className="text-body text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 mt-1">
            Review student skill gaps and write personalised roadmaps.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber/10 text-amber-700 border border-amber/30">
          Mentor
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {[
          { id: "queue", label: "Student Queue" },
          { id: "roadmaps", label: "Roadmaps" },
        ].map(({ id, label }) => (
          <button
            key={id}
            id={`mentor-tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:text-neutral-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "queue" ? (
            <QueueTab api={api} onAction={handleQueueAction} />
          ) : (
            <RoadmapsTab api={api} initialContext={roadmapsTabContext} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Write Roadmap Modal */}
      {writeTarget && (
        <WriteRoadmapModal
          student={writeTarget}
          api={api}
          onClose={() => setWriteTarget(null)}
          onCreated={handleRoadmapCreated}
        />
      )}
    </div>
  );
}

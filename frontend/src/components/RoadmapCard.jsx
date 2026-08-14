// src/components/RoadmapCard.jsx
// Renders a roadmap in either mentor (editable) or student (read-only) mode.
//
// Props:
//   roadmap      — the roadmap object from the API
//   mode         — "mentor" | "student"
//   onSave       — (newText: string) => Promise<void>   (mentor mode)
//   onApprove    — () => Promise<void>                   (mentor mode)
//   isSaving     — bool (mentor mode)
//   isApproving  — bool (mentor mode)

import { useState, useEffect } from "react";

const STATUS_BADGE = {
  draft: {
    label: "Draft",
    cls: "bg-neutral-100 text-neutral-500 border-neutral-300",
  },
  edited: {
    label: "Edited",
    cls: "bg-amber/10 text-amber-text dark:text-amber border-amber/30",
  },
  approved: {
    label: "Approved",
    cls: "bg-teal/10 text-teal-text dark:text-teal border-teal/30",
  },
};

export default function RoadmapCard({
  roadmap,
  mode = "student",
  onSave,
  onApprove,
  isSaving = false,
  isApproving = false,
}) {
  const [editText, setEditText] = useState(roadmap?.draft_text ?? "");
  const [isDirty, setIsDirty] = useState(false);

  // Reset when roadmap changes (e.g. after save/approve)
  useEffect(() => {
    setEditText(roadmap?.draft_text ?? "");
    setIsDirty(false);
  }, [roadmap?.id, roadmap?.draft_text]);

  const badge = STATUS_BADGE[roadmap?.status] ?? STATUS_BADGE.draft;

  const handleTextChange = (e) => {
    setEditText(e.target.value);
    setIsDirty(e.target.value !== roadmap?.draft_text);
  };

  const handleSave = async () => {
    if (!isDirty || !onSave) return;
    await onSave(editText);
    setIsDirty(false);
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    await onApprove();
  };

  // ── Read-only student view ────────────────────────────────────────────────
  if (mode === "student") {
    return (
      <div
        id="roadmap-card-student"
        className="bg-surface/80 dark:bg-neutral-900/80 rounded-card shadow-card border border-border p-8 h-full backdrop-blur-xl transition-colors animate-fade-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-h2 font-serif text-neutral-900 dark:text-neutral-50 font-semibold">Your Roadmap</h3>
            <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-1">
              Written by your mentor •{" "}
              {roadmap?.approved_at
                ? `Approved ${new Date(roadmap.approved_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}`
                : ""}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {badge.label}
          </span>
        </div>

        {/* Content */}
        <div className="prose prose-neutral max-w-none">
          <pre
            className="whitespace-pre-wrap font-sans text-body text-neutral-800 dark:text-neutral-200 leading-relaxed bg-neutral-50/50 dark:bg-neutral-950/50 backdrop-blur-md rounded-lg p-6 border border-border"
            style={{ fontFamily: "inherit" }}
          >
            {roadmap?.draft_text}
          </pre>
        </div>
      </div>
    );
  }

  // ── Mentor editable view ──────────────────────────────────────────────────
  return (
    <div
      id="roadmap-card-mentor"
      className="bg-surface/80 dark:bg-neutral-900/80 rounded-card shadow-card border border-border overflow-hidden backdrop-blur-xl transition-colors animate-fade-up"
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border bg-neutral-50/50 dark:bg-neutral-950/50 backdrop-blur-md">
        <div>
          <p className="text-caption text-neutral-500 dark:text-neutral-400 font-medium">Roadmap</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            Created {new Date(roadmap?.created_at).toLocaleDateString("en-IN")}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
          {badge.label}
        </span>
      </div>

      {/* Editable textarea */}
      <div className="p-6">
        <textarea
          id="roadmap-editor"
          value={editText}
          onChange={handleTextChange}
          disabled={roadmap?.status === "approved" || isSaving || isApproving}
          rows={12}
          placeholder="Write the student's learning roadmap here…"
          className="w-full bg-transparent border border-border rounded-lg px-4 py-3 text-body text-neutral-800 dark:text-neutral-200 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:bg-neutral-50/50 disabled:dark:bg-neutral-800/50 disabled:text-neutral-500 disabled:cursor-not-allowed font-mono text-sm"
        />
        {roadmap?.status === "approved" && (
          <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
            This roadmap is approved — it is read-only. Create a new one if edits are needed.
          </p>
        )}
      </div>

      {/* Action bar */}
      {roadmap?.status !== "approved" && (
        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button
            id="roadmap-save-btn"
            onClick={handleSave}
            disabled={!isDirty || isSaving || isApproving}
            className="px-4 py-2 rounded-btn text-sm font-medium border border-border text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
          <button
            id="roadmap-approve-btn"
            onClick={handleApprove}
            disabled={isDirty || isApproving || isSaving}
            className="px-5 py-2 rounded-btn text-sm font-semibold bg-teal hover:opacity-90 text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isApproving ? "Approving…" : "Approve & Publish"}
          </button>
          {isDirty && (
            <span className="text-xs text-amber-text dark:text-amber ml-1">Save changes before approving</span>
          )}
        </div>
      )}
    </div>
  );
}

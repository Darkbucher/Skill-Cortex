// src/pages/AdminMentors.jsx
// Admin UI for managing mentor accounts in the role_allowlist.
// Displays a table of current mentors with Add / Revoke actions.

import { useState, useEffect, useCallback } from "react";
import { useApiClient } from "../hooks/useApiClient";

export default function AdminMentors() {
  const api = useApiClient();
  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add-mentor form state
  const [addEmail, setAddEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null);

  // Revoke state
  const [revokingEmail, setRevokingEmail] = useState(null);

  const fetchMentors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get("/admin/mentors");
      setMentors(data);
    } catch (err) {
      setError(err.message || "Failed to load mentors.");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const email = addEmail.trim().toLowerCase();
    if (!email) return;

    setIsAdding(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      await api.post("/admin/mentors", { email });
      setAddEmail("");
      setAddSuccess(`${email} has been granted mentor access.`);
      await fetchMentors();
    } catch (err) {
      setAddError(err.message || "Failed to add mentor.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRevoke = async (email) => {
    if (!window.confirm(`Revoke mentor access for ${email}? They will be treated as a student on next login.`)) {
      return;
    }
    setRevokingEmail(email);
    try {
      await api.delete(`/admin/mentors/${encodeURIComponent(email)}`);
      setMentors((prev) => prev.filter((m) => m.email !== email));
    } catch (err) {
      alert(err.message || "Failed to revoke mentor.");
    } finally {
      setRevokingEmail(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      {/* Page header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-h2 font-serif text-neutral-900 dark:text-neutral-100 font-bold mb-2">Mentors</h2>
          <p className="text-body text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 mt-1">
            Grant or revoke mentor access for college staff accounts.
            Mentors sign in with their Google Workspace account.
          </p>
        </div>
      </div>

      {/* Add Mentor form */}
      <div className="bg-surface dark:bg-neutral-900 transition-colors rounded-card shadow-card border border-border p-6 mb-8">
        <h3 className="text-body font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Add Mentor</h3>
        <form onSubmit={handleAdd} className="flex gap-3 items-start">
          <div className="flex-1">
            <input
              id="add-mentor-email-input"
              type="email"
              value={addEmail}
              onChange={(e) => {
                setAddEmail(e.target.value);
                setAddError(null);
                setAddSuccess(null);
              }}
              placeholder="mentor.new@knit.ac.in"
              className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-btn px-4 py-2.5 text-body text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:focus:ring-white/20 transition-all duration-300"
              required
            />
            {addError && (
              <p className="mt-1.5 text-xs text-danger">{addError}</p>
            )}
            {addSuccess && (
              <p className="mt-1.5 text-xs text-teal-600">{addSuccess}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="px-5 py-2 bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-sm font-semibold rounded-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isAdding ? "Adding…" : "+ Add Mentor"}
          </button>
        </form>
        <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500 dark:text-neutral-500">
          Email must end with <code className="bg-neutral-100 dark:bg-neutral-800 transition-colors dark:bg-neutral-800 transition-colors px-1 rounded">@knit.ac.in</code>.
          The mentor account must already exist in Google Workspace.
        </p>
      </div>

      {/* Mentors table */}
      <div className="bg-surface dark:bg-neutral-900 transition-colors rounded-card shadow-card border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-neutral-50 dark:bg-neutral-800/50 transition-colors flex items-center justify-between">
          <h3 className="text-body font-semibold text-neutral-700 dark:text-neutral-300">
            Current Mentors
            {!isLoading && (
              <span className="ml-2 text-xs font-normal text-neutral-400 dark:text-neutral-500 dark:text-neutral-500">
                ({mentors.length})
              </span>
            )}
          </h3>
        </div>

        {error && (
          <div className="p-4 text-sm text-danger bg-danger/5 border-b border-border">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 text-sm">Loading…</div>
        ) : mentors.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 text-sm">
            No mentor accounts yet. Add one above.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-6 text-xs font-semibold text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
                  Added By
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
                  Date Added
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {mentors.map((mentor) => (
                <tr
                  key={mentor.email}
                  className="border-b border-border last:border-0 hover:bg-neutral-50 dark:bg-neutral-800/50 transition-colors"
                >
                  <td className="py-3 px-6 font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                    {mentor.email}
                  </td>
                  <td className="py-3 px-6 text-sm text-neutral-500 dark:text-neutral-500 dark:text-neutral-500">
                    {mentor.added_by ?? "—"}
                  </td>
                  <td className="py-3 px-6 text-sm text-neutral-500 dark:text-neutral-500 dark:text-neutral-500">
                    {mentor.added_at
                      ? new Date(mentor.added_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button
                      id={`revoke-mentor-${mentor.email}`}
                      onClick={() => handleRevoke(mentor.email)}
                      disabled={revokingEmail === mentor.email}
                      className="text-danger hover:text-red-700 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {revokingEmail === mentor.email ? "Revoking…" : "Revoke"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

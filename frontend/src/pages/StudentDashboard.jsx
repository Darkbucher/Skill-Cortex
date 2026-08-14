// src/pages/StudentDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useApiClient } from "../hooks/useApiClient";
import { Map } from "lucide-react";
import GapBreakdown from "../components/GapBreakdown";
import ProgressTimeline from "../components/ProgressTimeline";
import RoadmapCard from "../components/RoadmapCard";

export default function StudentDashboard({ user }) {
  const api = useApiClient();

  const [activeTab, setActiveTab] = useState("gap"); // "gap" or "roadmap"

  // Gap state
  const [gapData, setGapData] = useState(null);
  const [isComputing, setIsComputing] = useState(false);
  const [gapError, setGapError] = useState(null);

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Roadmap state
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  // Fetch history whenever user changes (and on mount)
  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    setHistoryLoading(true);
    try {
      const data = await api.get(`/students/${user.id}/gap/history`);
      setHistory(data);
    } catch {
      // History is non-critical — silently ignore failures
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [api, user?.id]);

  // Fetch approved roadmap
  const fetchRoadmap = useCallback(async () => {
    if (!user?.id) return;
    setRoadmapLoading(true);
    try {
      const data = await api.get(`/students/${user.id}/roadmap`);
      setRoadmap(data);
    } catch {
      // 404 means no roadmap yet — that's fine
      setRoadmap(null);
    } finally {
      setRoadmapLoading(false);
    }
  }, [api, user?.id]);

  useEffect(() => {
    fetchHistory();
    fetchRoadmap();
  }, [fetchHistory, fetchRoadmap]);

  const handleComputeGap = async () => {
    setIsComputing(true);
    setGapError(null);
    try {
      const data = await api.post(`/students/${user.id}/gap`);
      setGapData(data);
      // Refresh history after computing a new snapshot
      await fetchHistory();
    } catch (err) {
      setGapError(
        err.message || "Failed to compute gap. Ensure your profile has a target role set."
      );
    } finally {
      setIsComputing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      {/* Header card with Compute button */}
      <div className="bg-surface dark:bg-neutral-900 p-8 rounded-card shadow-card border border-border flex justify-between items-center transition-colors">
        <div>
          <h2 className="text-h2 font-serif text-neutral-900 dark:text-neutral-100 mb-2 font-bold">
            Welcome back, {user?.name?.split(" ")[0]}!
          </h2>
          <p className="text-body text-neutral-500 dark:text-neutral-500">
            Track your progress toward your target role.
          </p>
        </div>
        <button
          onClick={handleComputeGap}
          disabled={isComputing}
          className="bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-medium py-3 px-6 rounded-btn transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          {isComputing ? "Computing…" : "Compute Skill Gap"}
        </button>
      </div>

      {gapError && (
        <div className="p-4 bg-danger/10 text-danger dark:text-danger rounded-card border border-danger/20">{gapError}</div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-border">
        <button
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "gap"
              ? "border-primary text-primary"
              : "border-transparent text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
          onClick={() => setActiveTab("gap")}
        >
          Skill Gap
        </button>
        <button
          className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "roadmap"
              ? "border-primary text-primary"
              : "border-transparent text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
          onClick={() => setActiveTab("roadmap")}
        >
          My Roadmap
        </button>
      </div>

      {activeTab === "gap" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1 flex flex-col h-full">
            {gapData ? (
              <GapBreakdown gapData={gapData} />
            ) : !gapError && history.length === 0 && !historyLoading ? (
              <div className="text-center py-16 bg-surface dark:bg-neutral-900 rounded-card border border-dashed border-border flex-1 flex flex-col items-center justify-center transition-colors">
                <p className="text-neutral-500 dark:text-neutral-500">
                  Click &ldquo;Compute Skill Gap&rdquo; to analyze your current progress.
                </p>
              </div>
            ) : null}
          </div>
          
          <div className="lg:col-span-1 flex flex-col h-full">
            {historyLoading ? (
              <div className="flex flex-col gap-4 animate-pulse p-8 bg-surface dark:bg-espresso-card rounded-card border border-border h-full min-h-[400px]">
                <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3"></div>
                <div className="space-y-6 mt-4">
                  <div className="h-24 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg"></div>
                  <div className="h-24 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg"></div>
                  <div className="h-24 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg"></div>
                </div>
              </div>
            ) : history.length > 0 ? (
              <ProgressTimeline history={history} />
            ) : null}
          </div>
        </div>
      )}

      {activeTab === "roadmap" && (
        <div className="w-full h-full">
          {roadmapLoading ? (
            <div className="w-full animate-pulse p-8 bg-surface dark:bg-espresso-card rounded-card border border-border flex flex-col gap-8 h-[500px]">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4"></div>
              <div className="space-y-4">
                <div className="h-32 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl"></div>
                <div className="h-32 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl"></div>
                <div className="h-32 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl"></div>
              </div>
            </div>
          ) : roadmap ? (
            <RoadmapCard roadmap={roadmap} mode="student" />
          ) : (
            <div className="text-center py-20 bg-[#f4f3ef] dark:bg-espresso-card rounded-card border border-[#dcdcdc] dark:border-neutral-800 h-full flex flex-col items-center justify-center transition-colors shadow-sm">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800/50 rounded-full flex items-center justify-center mb-5 border border-[#dcdcdc] dark:border-neutral-700">
                <Map className="w-8 h-8 text-neutral-400 dark:text-neutral-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-h3 text-neutral-900 dark:text-neutral-100 font-serif font-bold mb-2">No Roadmap Yet</h3>
              <p className="text-body text-neutral-500 dark:text-neutral-400 max-w-[280px] mx-auto text-sm">
                Your mentor hasn't written a roadmap for you yet. Ensure your skill gap is computed.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

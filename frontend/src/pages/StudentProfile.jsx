import { useState, useEffect } from "react";
import { useApiClient } from "../hooks/useApiClient";
import { FloatingInput, FloatingSelect } from "../components/FloatingInput";

const LEVELS = ["beginner", "intermediate", "advanced"];

const LEVEL_BADGE = {
  beginner:     { bg: "bg-neutral-100 dark:bg-neutral-800 transition-colors dark:bg-neutral-800 transition-colors",  text: "text-neutral-500 dark:text-neutral-500 dark:text-neutral-500", border: "border-neutral-200",  label: "Beginner"     },
  intermediate: { bg: "bg-amber-50",     text: "text-amber-600",   border: "border-amber-200",    label: "Intermediate" },
  advanced:     { bg: "bg-teal-50",      text: "text-teal-600",    border: "border-teal-200",     label: "Advanced"     },
};

function SkillChip({ entry, onRemove }) {
  const badge = LEVEL_BADGE[entry.level] ?? LEVEL_BADGE.beginner;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:scale-[1.02]
        ${badge.bg} ${badge.text} ${badge.border}`}
    >
      {entry.skill}
      <span className={`text-xs opacity-70 font-normal`}>· {badge.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(entry.skill)}
          className="ml-1 hover:opacity-60 transition-opacity leading-none"
          aria-label={`Remove ${entry.skill}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

export default function StudentProfile() {
  const api = useApiClient();
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form state
  const [year, setYear] = useState("");
  const [targetRoleId, setTargetRoleId] = useState("");
  const [skills, setSkills] = useState([]);   // list[{skill, level}]
  const [newSkill, setNewSkill] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("beginner");

  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileData, rolesData] = await Promise.all([
          api.get("/students/me"),
          api.get("/students/roles").catch(() => [])
        ]);
        setProfile(profileData);
        setYear(profileData.year || "");
        setTargetRoleId(profileData.target_role_id || "");
        setSkills(profileData.skills || []);
        setRoles(rolesData);
      } catch (err) {
        setError("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [api]);

  const knownSkills = Array.from(
    new Set(roles.flatMap((r) => (r.required_skills || []).map((s) => s.skill)))
  ).sort();

  const suggestions = newSkill.trim().length >= 2
    ? knownSkills.filter(s => s.toLowerCase().includes(newSkill.trim().toLowerCase()) && !skills.some(es => es.skill.toLowerCase() === s.toLowerCase()))
    : [];

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    // Prevent duplicate skill names (case-insensitive)
    if (skills.some(s => s.skill.toLowerCase() === trimmed.toLowerCase())) return;
    setSkills([...skills, { skill: trimmed, level: newSkillLevel }]);
    setNewSkill("");
    setNewSkillLevel("beginner");
  };

  const handleRemoveSkill = (skillName) => {
    setSkills(skills.filter(s => s.skill !== skillName));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await api.put("/students/me", {
        year: year ? parseInt(year) : null,
        target_role_id: targetRoleId ? parseInt(targetRoleId) : null,
        skills
      });
      setProfile(updated);
      setSuccessMsg("Profile saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-center p-10">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-surface dark:bg-neutral-900 transition-colors rounded-card shadow-card border border-border p-8 animate-fade-up">
      <h2 className="text-h2 font-serif mb-6 text-neutral-900 dark:text-neutral-100">My Profile</h2>
      
      {error && <div className="mb-4 p-3 bg-danger/10 text-danger rounded">{error}</div>}
      {successMsg && <div className="mb-4 p-3 bg-teal/10 text-teal rounded">{successMsg}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <FloatingSelect
            id="year"
            label="Academic Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={[
              { value: "1", label: "1st Year" },
              { value: "2", label: "2nd Year" },
              { value: "3", label: "3rd Year" },
              { value: "4", label: "Final Year" },
            ]}
          />
          
          <FloatingSelect
            id="targetRole"
            label="Target Role"
            value={targetRoleId}
            onChange={(e) => setTargetRoleId(e.target.value)}
            options={roles.map(role => ({ value: role.id, label: role.role_name }))}
          />
        </div>

        <div>
          <label className="block text-body font-medium mb-2">My Skills</label>

          {/* Add skill row — skill name + level dropdown */}
          <div className="flex gap-2 mb-4 items-stretch">
            <div className="flex-1 relative">
              <FloatingInput 
                id="newSkill"
                label="Skill Name (e.g. React, Python)"
                value={newSkill}
                onChange={(e) => {
                  setNewSkill(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-surface dark:bg-neutral-900 border border-border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {suggestions.map(s => (
                    <li 
                      key={s}
                      className="px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-800 dark:text-neutral-200"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setNewSkill(s);
                        setShowSuggestions(false);
                      }}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="w-40">
              <FloatingSelect
                id="newSkillLevel"
                label="Level"
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value)}
                options={LEVELS.map(l => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))}
              />
            </div>
            <button 
              type="button"
              onClick={handleAddSkill}
              className="bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 px-6 rounded-btn text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>

          {/* Legend */}
          <div className="flex gap-3 mb-3 text-xs text-neutral-500 dark:text-neutral-500 dark:text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neutral-300" /> Beginner
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Intermediate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-400" /> Advanced
            </span>
          </div>
          
          {/* Skill chips */}
          <div className="flex flex-wrap gap-2">
            {skills.map(entry => (
              <SkillChip
                key={entry.skill}
                entry={entry}
                onRemove={handleRemoveSkill}
              />
            ))}
            {skills.length === 0 && (
              <span className="text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 text-sm">No skills added yet.</span>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className="w-full bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-medium py-3 rounded-btn transition-transform active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

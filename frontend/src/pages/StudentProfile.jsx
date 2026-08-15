import { useState, useEffect, useMemo } from "react";
import { useApiClient } from "../hooks/useApiClient";
import { FloatingSelect } from "../components/FloatingInput";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { techSkills } from "../utils/techSkills";

const LEVELS = ["beginner", "intermediate", "advanced"];

const LEVEL_BADGE = {
  beginner:     { bg: "bg-neutral-100 dark:bg-neutral-800",  text: "text-neutral-500 dark:text-neutral-400", border: "border-neutral-200 dark:border-neutral-700",  label: "Beginner"     },
  intermediate: { bg: "bg-amber-50 dark:bg-amber-900/20",     text: "text-amber-600 dark:text-amber-400",   border: "border-amber-200 dark:border-amber-800",    label: "Intermediate" },
  advanced:     { bg: "bg-teal-50 dark:bg-teal-900/20",      text: "text-teal-600 dark:text-teal-400",    border: "border-teal-200 dark:border-teal-800",     label: "Advanced"     },
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

// Reusable styling for react-select to match Tailwind dark/light theme
const reactSelectStyles = {
  control: (state) => `bg-surface dark:bg-neutral-900 border ${state.isFocused ? 'border-neutral-400 dark:border-neutral-600 ring-1 ring-neutral-400 dark:ring-neutral-600' : 'border-border'} rounded-md p-1.5 transition-colors cursor-text`,
  menu: () => `bg-surface dark:bg-neutral-900 border border-border shadow-lg rounded-md mt-1 z-50`,
  option: (state) => `p-2 cursor-pointer ${state.isFocused ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`,
  singleValue: () => `text-neutral-900 dark:text-neutral-100`,
  input: () => `text-neutral-900 dark:text-neutral-100`,
  placeholder: () => `text-neutral-500`,
  menuList: () => `max-h-60 overflow-y-auto`,
  noOptionsMessage: () => `p-2 text-neutral-500`,
};

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
  const [targetRoleObj, setTargetRoleObj] = useState(null); // stores {value, label}
  const [skills, setSkills] = useState([]);   // list[{skill, level}]
  const [selectedSkillObj, setSelectedSkillObj] = useState(null);
  const [newSkillLevel, setNewSkillLevel] = useState("beginner");

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileData, rolesData] = await Promise.all([
          api.get("/students/me"),
          api.get("/students/roles").catch(() => [])
        ]);
        setProfile(profileData);
        setYear(profileData.year || "");
        setSkills(profileData.skills || []);
        setRoles(rolesData);

        if (profileData.target_role_id) {
          const role = rolesData.find(r => r.id === profileData.target_role_id);
          if (role) {
            setTargetRoleObj({ value: role.id, label: role.role_name });
          }
        }
      } catch (err) {
        setError("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [api]);

  const roleOptions = useMemo(() => {
    return roles.map(r => ({ value: r.id, label: r.role_name }));
  }, [roles]);

  const skillOptions = useMemo(() => {
    // Exclude already added skills from the dropdown
    const addedSkills = new Set(skills.map(s => s.skill.toLowerCase()));
    return techSkills
      .filter(skill => !addedSkills.has(skill.toLowerCase()))
      .map(skill => ({ value: skill, label: skill }));
  }, [skills]);

  const handleAddSkill = (e) => {
    e?.preventDefault();
    if (!selectedSkillObj) return;
    
    const skillName = selectedSkillObj.value.trim();
    if (!skillName) return;
    
    // Prevent duplicate skill names (case-insensitive)
    if (skills.some(s => s.skill.toLowerCase() === skillName.toLowerCase())) return;
    
    setSkills([...skills, { skill: skillName, level: newSkillLevel }]);
    setSelectedSkillObj(null);
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
        target_role_id: targetRoleObj ? parseInt(targetRoleObj.value) : null,
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

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-2 gap-6 items-start">
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
          
          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Target Role</label>
            <Select
              options={roleOptions}
              value={targetRoleObj}
              onChange={setTargetRoleObj}
              placeholder="Search roles..."
              classNames={reactSelectStyles}
              unstyled
              isClearable
            />
          </div>
        </div>

        <div>
          <label className="block text-body font-medium mb-3">My Skills</label>

          <div className="flex flex-col sm:flex-row gap-3 mb-5 items-stretch">
            <div className="flex-1 relative">
               <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">Skill Name</label>
               <CreatableSelect
                  options={skillOptions}
                  value={selectedSkillObj}
                  onChange={setSelectedSkillObj}
                  placeholder="Type to search or add..."
                  classNames={reactSelectStyles}
                  unstyled
                  isClearable
                  formatCreateLabel={(inputValue) => `Add custom skill "${inputValue}"`}
                  onKeyDown={(e) => {
                    // Automatically add if they press enter while an option is selected
                    if (e.key === 'Enter' && selectedSkillObj) {
                      handleAddSkill(e);
                    }
                  }}
               />
            </div>
            <div className="w-full sm:w-40">
              <FloatingSelect
                id="newSkillLevel"
                label="Level"
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value)}
                options={LEVELS.map(l => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))}
              />
            </div>
            <div className="flex items-end">
              <button 
                type="button"
                onClick={handleAddSkill}
                disabled={!selectedSkillObj}
                className="h-[52px] bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 px-6 rounded-btn text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" /> Beginner
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 dark:bg-amber-600" /> Intermediate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 dark:bg-teal-600" /> Advanced
            </span>
          </div>
          
          {/* Skill chips */}
          <div className="flex flex-wrap gap-2 p-4 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg border border-neutral-100 dark:border-neutral-800/50 min-h-[100px] items-start content-start">
            {skills.map(entry => (
              <SkillChip
                key={entry.skill}
                entry={entry}
                onRemove={handleRemoveSkill}
              />
            ))}
            {skills.length === 0 && (
              <span className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">No skills added yet. Type above to add your first skill!</span>
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

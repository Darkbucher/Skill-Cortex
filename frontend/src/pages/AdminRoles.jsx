import { useState, useEffect } from "react";
import { useApiClient } from "../hooks/useApiClient";

const MIN_LEVELS = ["beginner", "intermediate", "advanced"];

const LEVEL_LABEL = {
  beginner:     "Beginner",
  intermediate: "Intermediate",
  advanced:     "Advanced",
};

const LEVEL_CHIP_STYLE = {
  beginner:     "bg-neutral-100 text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 border-neutral-200",
  intermediate: "bg-amber-50   text-amber-600  border-amber-200",
  advanced:     "bg-teal-50    text-teal-600   border-teal-200",
};

export default function AdminRoles() {
  const api = useApiClient();
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for creating/editing
  const [isEditing, setIsEditing] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [roleName, setRoleName] = useState("");
  const [source, setSource] = useState("");
  const [skills, setSkills] = useState([]);       // list[{skill, min_level}]
  const [newSkill, setNewSkill] = useState("");
  const [newSkillMinLevel, setNewSkillMinLevel] = useState("intermediate");
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [api]);

  const fetchRoles = async () => {
    try {
      const data = await api.get("/admin/roles");
      setRoles(data);
    } catch (err) {
      setError("Failed to load roles.");
    } finally {
      setIsLoading(false);
    }
  };

  const [showSuggestions, setShowSuggestions] = useState(false);

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
    if (skills.some(s => s.skill.toLowerCase() === trimmed.toLowerCase())) return;
    setSkills([...skills, { skill: trimmed, min_level: newSkillMinLevel }]);
    setNewSkill("");
    setNewSkillMinLevel("intermediate");
  };

  const handleRemoveSkill = (skillName) => {
    setSkills(skills.filter(s => s.skill !== skillName));
  };

  const handleEdit = (role) => {
    setCurrentRole(role);
    setRoleName(role.role_name);
    setSource(role.source || "");
    // required_skills are already {skill, min_level} objects from the API
    setSkills(role.required_skills || []);
    setIsEditing(true);
    setFormError(null);
  };

  const handleCreateNew = () => {
    setCurrentRole(null);
    setRoleName("");
    setSource("");
    setSkills([]);
    setNewSkill("");
    setNewSkillMinLevel("intermediate");
    setIsEditing(true);
    setFormError(null);
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    try {
      await api.delete(`/admin/roles/${roleId}`);
      setRoles(roles.filter(r => r.id !== roleId));
    } catch (err) {
      alert(err.message || "Failed to delete role.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setFormError("Role name is required.");
      return;
    }
    
    setIsSaving(true);
    setFormError(null);
    
    const payload = {
      role_name: roleName.trim(),
      source: source.trim() || null,
      required_skills: skills   // already in {skill, min_level} format
    };

    try {
      if (currentRole) {
        const updated = await api.put(`/admin/roles/${currentRole.id}`, payload);
        setRoles(roles.map(r => r.id === currentRole.id ? updated : r));
      } else {
        const created = await api.post("/admin/roles", payload);
        setRoles([...roles, created]);
      }
      setIsEditing(false);
    } catch (err) {
      setFormError(err.message || "Failed to save role.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-center p-10">Loading roles...</div>;

  if (isEditing) {
    return (
      <div className="max-w-3xl mx-auto bg-surface dark:bg-neutral-900 rounded-card shadow-card border border-border p-8 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-h2 text-neutral-900 dark:text-neutral-100">{currentRole ? "Edit Role" : "Create New Role"}</h2>
          <button 
            onClick={() => setIsEditing(false)}
            className="text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Cancel
          </button>
        </div>
        
        {formError && <div className="mb-4 p-3 bg-danger/10 text-danger rounded">{formError}</div>}
        
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-body font-medium mb-1 text-neutral-900 dark:text-neutral-200">Role Name</label>
            <input 
              type="text" 
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Software Development Engineer"
              className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              required
            />
          </div>

          <div>
            <label className="block text-body font-medium mb-1">Source (Optional)</label>
            <input 
              type="text" 
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Industry Survey 2024"
              className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded px-3 py-2 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          
          <div>
            <label className="block text-body font-medium mb-2">Required Skills</label>
            {/* Add skill row — skill name + min_level dropdown */}
            <div className="flex gap-2 mb-3 items-start">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={newSkill}
                  onChange={(e) => {
                    setNewSkill(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="e.g. React, Python"
                  className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {suggestions.map(s => (
                      <li 
                        key={s}
                        className="px-3 py-2 text-sm hover:bg-neutral-100 dark:bg-neutral-800 transition-colors dark:bg-neutral-800 transition-colors cursor-pointer text-neutral-800 dark:text-neutral-200"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent focus from leaving the input immediately
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
              <select
                value={newSkillMinLevel}
                onChange={(e) => setNewSkillMinLevel(e.target.value)}
                className="border border-border rounded px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 h-[38px] text-neutral-900 dark:text-neutral-100"
                aria-label="Minimum level"
              >
                {MIN_LEVELS.map(l => (
                  <option key={l} value={l}>min: {LEVEL_LABEL[l]}</option>
                ))}
              </select>
              <button 
                type="button"
                onClick={handleAddSkill}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {skills.map(entry => (
                <span
                  key={entry.skill}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border
                    ${LEVEL_CHIP_STYLE[entry.min_level] ?? LEVEL_CHIP_STYLE.intermediate}`}
                >
                  {entry.skill}
                  <span className="text-xs opacity-60 font-normal">
                    · min: {LEVEL_LABEL[entry.min_level]}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveSkill(entry.skill)}
                    className="ml-1 hover:opacity-60 transition-opacity leading-none font-bold"
                    aria-label={`Remove ${entry.skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {skills.length === 0 && <span className="text-neutral-400 dark:text-neutral-500 dark:text-neutral-500 text-sm">No skills added yet.</span>}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-medium py-3 rounded-btn transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Role"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-h2 font-serif text-neutral-900 dark:text-neutral-100 font-bold">Manage Roles</h2>
        <button 
          onClick={handleCreateNew}
          className="bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded-btn transition-colors text-sm font-medium"
        >
          + Create New Role
        </button>
      </div>
      
      {error && <div className="mb-4 p-3 bg-danger/10 text-danger rounded">{error}</div>}

      <div className="bg-surface dark:bg-neutral-900 rounded-card shadow-card border border-border overflow-hidden transition-colors">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-100 dark:bg-neutral-800 transition-colors dark:bg-neutral-800 transition-colors dark:bg-neutral-800 border-b border-border transition-colors">
              <th className="py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-500 dark:text-neutral-500">Role Name</th>
              <th className="py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-500 dark:text-neutral-500">Source</th>
              <th className="py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-500 dark:text-neutral-500">Required Skills</th>
              <th className="py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-500 dark:text-neutral-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-neutral-500 dark:text-neutral-500 dark:text-neutral-500">
                  No roles defined yet. Create one to get started.
                </td>
              </tr>
            ) : (
              roles.map(role => (
                <tr key={role.id} className="border-b border-border last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-neutral-900 dark:text-neutral-200">{role.role_name}</td>
                  <td className="py-3 px-4 text-sm text-neutral-500 dark:text-neutral-500 dark:text-neutral-500">{role.source || "-"}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-md">
                       {(role.required_skills || []).slice(0, 5).map(entry => (
                        <span
                          key={entry.skill}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium
                            ${LEVEL_CHIP_STYLE[entry.min_level] ?? LEVEL_CHIP_STYLE.intermediate}`}
                        >
                          {entry.skill}
                          <span className="opacity-60">· min: {LEVEL_LABEL[entry.min_level]}</span>
                        </span>
                      ))}
                      {(role.required_skills || []).length > 5 && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-500 dark:text-neutral-500 py-1">
                          +{role.required_skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(role)}
                      className="text-primary hover:text-primary-light text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(role.id)}
                      className="text-danger hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

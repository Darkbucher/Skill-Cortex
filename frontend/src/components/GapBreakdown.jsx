export default function GapBreakdown({ gapData }) {
  if (!gapData) return null;

  const { missing_skills = [], level_gap_skills = [], acquired_skills = [], computed_at } = gapData;
  const isReady = missing_skills.length === 0 && level_gap_skills.length === 0;

  return (
    <div className="bg-surface/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-card shadow-card border border-border p-8 h-full transition-colors flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-h2 text-neutral-900 dark:text-neutral-50 font-bold">Skill Gap Breakdown</h3>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          Computed at: {new Date(computed_at).toLocaleString()}
        </span>
      </div>

      {isReady ? (
        <div className="p-4 bg-teal/10 dark:bg-teal/20 border border-teal/20 dark:border-teal/30 rounded-md mb-6 flex items-start gap-3 transition-colors">
          <div className="text-teal-text dark:text-teal text-xl">🎉</div>
          <div>
            <h4 className="font-bold text-teal-text dark:text-teal mb-1">You're ready!</h4>
            <p className="text-sm text-teal-text/80 dark:text-teal/90">You possess all the required skills for this role at the required level.</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">

        {/* ── Column 1: Missing skills ── */}
        <div>
          <h4 className="text-lg font-semibold text-danger dark:text-danger mb-4 flex items-center gap-2">
            Missing Skills
            <span className="bg-danger/10 dark:bg-danger/20 text-danger text-xs px-2 py-1 rounded-full">
              {missing_skills.length}
            </span>
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">Skills you don't have yet</p>
          <div className="flex flex-wrap gap-2">
            {missing_skills.length > 0 ? (
              missing_skills.map(skill => (
                <span
                  key={skill}
                  className="bg-danger/10 dark:bg-danger/20 border border-danger/30 text-danger px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-neutral-400 dark:text-neutral-500 text-sm">None! Great job.</span>
            )}
          </div>
        </div>

        {/* ── Column 2: Level gaps ── */}
        <div>
          <h4 className="text-lg font-semibold text-amber-text dark:text-amber mb-4 flex items-center gap-2">
            Level Gaps
            <span className="bg-amber/10 dark:bg-amber/20 text-amber-text dark:text-amber text-xs px-2 py-1 rounded-full">
              {level_gap_skills.length}
            </span>
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">Skills you have, but need to level up</p>
          <div className="flex flex-col gap-2">
            {level_gap_skills.length > 0 ? (
              level_gap_skills.map(entry => (
                <div
                  key={entry.skill}
                  className="bg-amber/10 dark:bg-amber/20 border border-amber/30 rounded-md px-3 py-2 transition-colors"
                >
                  <div className="text-sm font-semibold text-amber-text dark:text-amber mb-1.5 break-words">{entry.skill}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-amber-text dark:text-amber">
                    <span className="capitalize bg-amber/10 dark:bg-amber/20 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {entry.student_level}
                    </span>
                    <span className="text-amber-text dark:text-amber">→</span>
                    <span className="capitalize bg-amber/20 dark:bg-amber/30 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                      {entry.required_level}
                    </span>
                    <span className="ml-auto text-amber-text dark:text-amber text-base">↑</span>
                  </div>
                </div>
              ))
            ) : (
              <span className="text-neutral-400 dark:text-neutral-500 text-sm">No level gaps — you're at the right level!</span>
            )}
          </div>
        </div>

        {/* ── Column 3: Acquired skills ── */}
        <div>
          <h4 className="text-lg font-semibold text-teal-text dark:text-teal mb-4 flex items-center gap-2">
            Acquired ✅
            <span className="bg-teal/10 dark:bg-teal/20 text-teal-text dark:text-teal text-xs px-2 py-1 rounded-full">
              {acquired_skills.length}
            </span>
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">Skills you have at the required level</p>
          <div className="flex flex-wrap gap-2">
            {acquired_skills.length > 0 ? (
              acquired_skills.map(skill => (
                <span
                  key={skill}
                  className="bg-teal/10 dark:bg-teal/20 border border-teal/30 text-teal-text dark:text-teal px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition-colors duration-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-text dark:bg-teal" />
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-neutral-400 dark:text-neutral-500 text-sm">None matching the target role yet.</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

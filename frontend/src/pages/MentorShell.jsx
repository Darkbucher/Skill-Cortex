// src/pages/MentorShell.jsx
// Layout shell for the mentor portal — sidebar navigation + main content area.

import { useClerk } from "@clerk/clerk-react";
import { LayoutDashboard } from "lucide-react";
import MentorDashboard from "./MentorDashboard";
import ThemeToggle from "../components/ThemeToggle";

export default function MentorShell({ user }) {
  const { signOut } = useClerk();

  return (
    <div className="flex h-screen bg-[#f4f3ef] dark:bg-espresso transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-espresso-card flex flex-col transition-colors border-r border-[#dcdcdc] dark:border-neutral-800">
        <div className="p-6 flex justify-between items-start">
          <div>
            <h2 className="text-h2 font-bold mb-1 text-neutral-900 dark:text-neutral-50">SkillCortex</h2>
            <span className="text-caption text-neutral-500">Mentor Portal</span>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {/* Single-page mentor dashboard — sub-tabs are rendered inside */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-btn text-body bg-neutral-100 text-neutral-900 font-bold dark:bg-neutral-800 dark:text-neutral-100 cursor-default">
            <LayoutDashboard size={18} strokeWidth={1.5} />
            Dashboard
          </div>
        </nav>

        <div className="p-4 border-t border-[#dcdcdc] dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber font-bold">
              {user?.name?.charAt(0) || "M"}
            </div>
            <div className="overflow-hidden">
              <p className="text-body font-medium truncate text-neutral-900 dark:text-neutral-100">{user?.name}</p>
              <p className="text-caption text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            id="mentor-signout-btn"
            onClick={() => signOut()}
            className="w-full py-2 px-4 rounded-btn border border-[#dcdcdc] dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors text-caption font-medium"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <MentorDashboard user={user} />
      </main>
    </div>
  );
}

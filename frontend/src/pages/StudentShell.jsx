import { useState } from "react";
import { useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, User } from "lucide-react";
import StudentProfile from "./StudentProfile";
import StudentDashboard from "./StudentDashboard";

import ThemeToggle from "../components/ThemeToggle";

export default function StudentShell({ user }) {
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="flex h-screen bg-[#f4f3ef] dark:bg-espresso transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-espresso-card flex flex-col transition-colors border-r border-[#dcdcdc] dark:border-neutral-800">
        <div className="p-6 flex justify-between items-start">
          <div>
            <h2 className="text-h2 font-bold mb-1 text-neutral-900 dark:text-neutral-50">SkillCortex</h2>
            <span className="text-caption text-neutral-500">Student Portal</span>
          </div>
          <ThemeToggle />
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <div 
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-btn text-body cursor-pointer transition-colors ${activeTab === 'dashboard' ? 'bg-neutral-100 text-neutral-900 font-bold dark:bg-neutral-800 dark:text-neutral-100' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-300'}`}
          >
            <LayoutDashboard size={18} strokeWidth={1.5} />
            Dashboard
          </div>
          <div 
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-btn text-body cursor-pointer transition-colors ${activeTab === 'profile' ? 'bg-neutral-100 text-neutral-900 font-bold dark:bg-neutral-800 dark:text-neutral-100' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-300'}`}
          >
            <User size={18} strokeWidth={1.5} />
            My Profile
          </div>
        </nav>

        <div className="p-4 border-t border-[#dcdcdc] dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold">
              {user?.name?.charAt(0) || "S"}
            </div>
            <div className="overflow-hidden">
              <p className="text-body font-medium truncate text-neutral-900 dark:text-neutral-100">{user?.name}</p>
              <p className="text-caption text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full py-2 px-4 rounded-btn border border-[#dcdcdc] dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors text-caption font-medium"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === "profile" && <StudentProfile />}
            {activeTab === "dashboard" && <StudentDashboard user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// src/pages/AdminShell.jsx
import { useState } from "react";
import { useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApiClient } from "../hooks/useApiClient";
import AdminRoles from "./AdminRoles";
import AdminMentors from "./AdminMentors";
import Heatmap from "../components/Heatmap";

import ThemeToggle from "../components/ThemeToggle";

import { BarChart3, Shield, Users } from "lucide-react";

const NAV_ITEMS = [
  { id: "heatmap", label: "Cohort Heatmap", Icon: BarChart3 },
  { id: "roles",   label: "Manage Roles", Icon: Shield },
  { id: "mentors", label: "Mentors", Icon: Users },
];

export default function AdminShell({ user }) {
  const { signOut } = useClerk();
  const api = useApiClient();
  const [activeTab, setActiveTab] = useState("heatmap");

  return (
    <div className="flex h-screen bg-[#f4f3ef] dark:bg-espresso transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-espresso-card flex flex-col transition-colors border-r border-[#dcdcdc] dark:border-neutral-800">
        <div className="p-6 flex justify-between items-start">
          <div>
            <h2 className="text-h2 font-bold mb-1 text-neutral-900 dark:text-neutral-50">SkillCortex</h2>
            <span className="text-caption text-neutral-500">Admin Portal</span>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <div
              key={id}
              id={`tab-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-btn text-body cursor-pointer transition-colors ${
                activeTab === id 
                  ? "bg-neutral-100 text-neutral-900 font-bold dark:bg-neutral-800 dark:text-neutral-100" 
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-300"
              }`}
            >
              <Icon size={18} strokeWidth={1.5} />
              {label}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[#dcdcdc] dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber font-bold">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-body font-medium truncate text-neutral-900 dark:text-neutral-100">{user?.name}</p>
              <p className="text-caption text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            id="admin-signout-btn"
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
            {activeTab === "roles" ? (
              <AdminRoles />
            ) : activeTab === "mentors" ? (
              <AdminMentors />
            ) : (
              <div className="max-w-5xl mx-auto">
                <Heatmap api={api} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// src/App.jsx
import { useCurrentUser } from "./hooks/useCurrentUser";
import LoginPage from "./pages/LoginPage";
import StudentShell from "./pages/StudentShell";
import AdminShell from "./pages/AdminShell";
import MentorShell from "./pages/MentorShell";

export default function App() {
  const { user, role, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-800 transition-colors flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // If there's an error (e.g. non-college domain), show it but still render Login
  if (error || !user) {
    return (
      <>
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-danger text-white px-6 py-3 rounded-card shadow-card flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-body">{error}</span>
          </div>
        )}
        <LoginPage />
      </>
    );
  }

  // Role routing
  if (role === "admin") {
    return <AdminShell user={user} />;
  }

  if (role === "mentor") {
    return <MentorShell user={user} />;
  }

  // Default to student
  return <StudentShell user={user} />;
}

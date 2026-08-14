// src/pages/LoginPage.jsx
// Two sign-in paths:
//   1. "Sign in with Google"     — students (college domain OAuth)
//   2. "Sign in with password"   — mentors / staff (email+password, no inbox needed)
//
// The password path uses Clerk's useSignIn hook with the "password" strategy.
// This avoids the "new device email OTP" flow that blocks mentor accounts.

import { useState } from "react";
import { SignInButton, useSignIn } from "@clerk/clerk-react";

const BG_IMAGES = [
  'https://framerusercontent.com/images/9QlnapAihHW1oGrVsD5wiMBlU0.png?width=1024&height=1024',
  'https://images.unsplash.com/photo-1506259091721-347e791bab0f?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1786603735052-fb4223ee82ed?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1707058665477-560297ffe913?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1504333638930-c8787321eee0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://media.istockphoto.com/id/607502930/photo/the-great-orion-nebula.jpg?s=612x612&w=0&k=20&c=1m7HA57mFssVuVTGw5ag6E8lzrOnEkhfIu8GiF-fyYc='
];

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  
  // Pick a random background image on initial mount
  const [randomBg] = useState(() => BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)]);

  // Toggle between main view and password form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState(null);

  const handlePasswordSignIn = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setIsSigningIn(true);
    setError(null);

    try {
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password: password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        // App will re-render via useCurrentUser hook automatically
      } else {
        // Should not happen for pure password auth, but surface it if it does
        setError(`Sign-in incomplete: ${result.status}. Please contact your admin.`);
      }
    } catch (err) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid email or password.";
      setError(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f3ef] dark:bg-espresso transition-colors flex">
      {/* Left Column */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 relative max-w-2xl mx-auto lg:mx-0 lg:max-w-none w-full">
        {/* Logo */}
        <div className="absolute top-8 left-8 sm:top-12 sm:left-12 flex items-center gap-3">
          {/* Subtle layer icon matching screenshot */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-900 dark:text-neutral-100">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-bold text-xl text-neutral-900 dark:text-neutral-100 tracking-tight">SkillCortex</span>
        </div>

        {/* Content Container */}
        <div className="max-w-[400px] w-full mt-16 lg:mt-0">
          {!showPasswordForm ? (
            <>
              <p className="text-sm font-medium text-neutral-500 mb-2 tracking-wide">Student Portal</p>
              <h1 className="text-5xl lg:text-[56px] font-serif text-neutral-900 dark:text-neutral-100 leading-[1.1] mb-10">
                Where Skills<br />Meet Industry
              </h1>

              {/* Google OAuth — for students */}
              <SignInButton mode="modal">
                <button
                  id="google-signin-btn"
                  className="w-full flex items-center justify-center gap-3 bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-medium py-3.5 px-4 rounded-xl transition-colors mb-6 shadow-sm"
                >
                  {/* Google icon */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </button>
              </SignInButton>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                <span className="text-xs text-neutral-400 font-medium">or</span>
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
              </div>

              {/* Password sign-in — for mentors/staff */}
              <button
                id="password-signin-toggle-btn"
                onClick={() => setShowPasswordForm(true)}
                className="w-full py-3.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-sm font-medium"
              >
                Sign in with email &amp; password
              </button>

              <p className="text-xs text-neutral-400 text-center mt-6">
                For mentor / staff accounts assigned by your admin
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-serif text-neutral-900 dark:text-neutral-100 mb-2">Staff Portal</h2>
              <p className="text-sm text-neutral-500 mb-6">
                Sign in with your assigned staff email and password.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-danger/10 text-danger text-sm rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handlePasswordSignIn} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mentor.01@knit.ac.in"
                    required
                    autoComplete="username"
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-colors"
                  />
                </div>

                <button
                  id="password-signin-submit-btn"
                  type="submit"
                  disabled={isSigningIn || !isLoaded}
                  className="w-full bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-medium py-3.5 px-4 rounded-xl mt-4 transition-colors disabled:opacity-50"
                >
                  {isSigningIn ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setError(null);
                  setEmail("");
                  setPassword("");
                }}
                className="w-full mt-6 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors"
              >
                ← Back to Student portal
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right Column (Visual) */}
      <div className="hidden lg:block lg:w-1/2 p-4 xl:p-6">
        <div className="w-full h-full rounded-[32px] overflow-hidden relative shadow-2xl bg-neutral-200 dark:bg-neutral-800">
          {/* Using a moody, abstract foggy/ocean Unsplash placeholder as seen in the screenshot */}
          <img 
            src={randomBg} 
            alt="Abstract background" 
            className="w-full h-full object-cover absolute inset-0 mix-blend-multiply opacity-90 dark:opacity-70 dark:mix-blend-lighten"
          />
        </div>
      </div>
    </div>
  );
}

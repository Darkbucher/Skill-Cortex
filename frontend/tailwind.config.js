/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind which files to scan for class names (purges unused CSS in prod)
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // SkillCortex design tokens
      colors: {
        // Primary — Soft Indigo
        primary: {
          DEFAULT: "#3B3F76",
          light: "#6366A8",
        },
        accent: {
          DEFAULT: "#2A9D8F",
        },
        // Accent — Teal (acquired skills, positive progress)
        teal: {
          DEFAULT: "#2A9D8F",
          text: "#228175", // Derived for light mode WCAG 4.65:1
        },
        // Espresso — Dark tones
        espresso: {
          DEFAULT: "#161412",
          card: "#1c1a18",
        },
        // Accent — Amber (missing skills, "to-do" tone — NOT danger)
        amber: {
          DEFAULT: "#E9A23B",
          text: "#9A6B27", // Derived for light mode WCAG 4.65:1
        },
        // Danger — Muted Red (API errors only — NEVER for skill gaps)
        danger: {
          DEFAULT: "#C15C5C",
        },
        // Neutrals (Zinc base)
        neutral: {
          900: "#1F2430",
          500: "#6B7280",
          100: "#F4F5F7",
        },
        // Surface / borders
        surface: "var(--color-surface)",
        border: "var(--color-border)",
      },
      fontFamily: {
        // Inter throughout — see Design.md §3
        sans: ["Inter", "system-ui", "sans-serif"],
        // Playfair Display for premium headings
        serif: ["Playfair Display", "serif"],
      },
      fontSize: {
        // Design.md §3 type scale
        "h1": ["30px", { fontWeight: "700", lineHeight: "1.2" }],
        "h2": ["23px", { fontWeight: "600", lineHeight: "1.3" }],
        "h3": ["18px", { fontWeight: "600", lineHeight: "1.4" }],
        "body": ["15px", { fontWeight: "400", lineHeight: "1.6" }],
        "caption": ["13px", { fontWeight: "500", letterSpacing: "0.02em", lineHeight: "1.4" }],
      },
      borderRadius: {
        // Exaggerated soft rounding
        card: "16px",
        btn: "12px",
      },
      boxShadow: {
        // Premium diffused card shadow with inner highlight
        card: "0px 10px 40px -10px rgba(0,0,0,0.06), inset 0px 1px 0px 0px rgba(255,255,255,0.5)",
      },
      spacing: {
        // Base spacing unit: 4px — Design.md §4
        // Standard Tailwind scale already does this (4 = 1rem = 16px is off,
        // but Tailwind's default 4 = 16px is fine; just use multiples of 1/2/3/4/6/8)
      },
    },
  },
  plugins: [],
};

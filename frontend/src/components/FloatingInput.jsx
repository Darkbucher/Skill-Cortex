import React from "react";

export function FloatingInput({ id, label, value, onChange, type = "text", disabled, ...props }) {
  return (
    <div className="relative group w-full">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="peer w-full bg-neutral-50 dark:bg-espresso px-4 pt-6 pb-2 border-b-2 border-[#dcdcdc] dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-neutral-100 rounded-t-btn text-body text-neutral-900 dark:text-neutral-50 focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed placeholder-transparent"
        placeholder={label}
        {...props}
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 transition-all peer-placeholder-shown:text-body peer-placeholder-shown:top-4 peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-neutral-900 dark:peer-focus:text-neutral-100 cursor-text pointer-events-none"
      >
        {label}
      </label>
    </div>
  );
}

export function FloatingSelect({ id, label, value, onChange, options, disabled, ...props }) {
  return (
    <div className="relative group w-full">
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="peer w-full bg-neutral-50 dark:bg-espresso px-4 pt-6 pb-2 border-b-2 border-[#dcdcdc] dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-neutral-100 rounded-t-btn text-body text-neutral-900 dark:text-neutral-50 focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
        {...props}
      >
        <option value="" disabled hidden></option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <label
        htmlFor={id}
        className="absolute left-4 top-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 transition-all peer-focus:text-neutral-900 dark:peer-focus:text-neutral-100 pointer-events-none"
      >
        {label}
      </label>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

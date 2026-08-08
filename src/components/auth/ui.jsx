import React, { forwardRef, useId } from "react";
import Logo from "../Logo";
import { Input } from "../ui/input";

export const AuthHeader = ({ title }) => (
  <div className="flex flex-col items-center text-center mb-8">
    <Logo className="w-10 h-10 mb-5 text-neutral-800 dark:text-neutral-200" />
    <h1 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 tracking-tight">
      {title}
    </h1>
  </div>
);

// Wraps a child with the staggered auth entrance animation
export const Rise = ({ delay = 0, className = "", children, ...props }) => (
  <div
    className={`animate-auth-rise ${className}`}
    style={{ animationDelay: `${delay}ms` }}
    {...props}
  >
    {children}
  </div>
);

const inputBase =
  "h-auto w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border rounded-lg text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const inputBorderNormal =
  "border-neutral-200 dark:border-neutral-700 focus:border-neutral-400 dark:focus:border-neutral-500";

const inputBorderError =
  "border-red-400/70 dark:border-red-500/60 focus:border-red-500 dark:focus:border-red-500";

// Kept for any callers that render raw inputs (non-Field)
export const inputClass = `${inputBase} ${inputBorderNormal}`;

export const primaryButtonClass =
  "h-auto w-full px-4 py-2.5 text-sm font-medium bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-900 dark:hover:bg-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

export const linkButtonClass =
  "h-auto p-0 text-neutral-800 dark:text-neutral-200 font-medium hover:underline underline-offset-4 transition-colors";

export const Field = forwardRef(function Field(
  { label, error, labelRight, suffix, className = "", ...inputProps },
  ref,
) {
  const reactId = useId();
  const id = inputProps.id || reactId;
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={id}
          className="text-xs font-medium text-neutral-600 dark:text-neutral-400"
        >
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative">
        <Input
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
          className={`${inputBase} ${error ? inputBorderError : inputBorderNormal} ${suffix ? "pr-10" : ""}`}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p
          id={errorId}
          className="mt-1.5 text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
});

// Form-level error (server/network) — centered, shakes in
export const FormError = ({ message }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="text-center text-xs text-red-600 dark:text-red-400 animate-shake"
    >
      {message}
    </div>
  );
};

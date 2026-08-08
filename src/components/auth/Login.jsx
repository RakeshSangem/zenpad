import React, { useState } from "react";
import { useAppStore } from "../../store";
import {
  AuthHeader,
  Rise,
  Field,
  FormError,
  primaryButtonClass,
  linkButtonClass,
} from "./ui";
import { validateLogin } from "./validation";
import { Button } from "../ui/button";

const Login = ({ onNavigate }) => {
  const login = useAppStore((state) => state.login);
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const setField = (key) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (formError) setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validateLogin(values);
    setErrors(v);
    setFormError("");
    if (Object.keys(v).length) return;

    setLoading(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
    } catch (err) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Rise delay={0}>
        <AuthHeader title="Sign in to Zenpad" />
      </Rise>

      <Rise delay={60} className="space-y-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          value={values.email}
          onChange={setField("email")}
          placeholder="you@example.com"
          disabled={loading}
          error={errors.email}
        />

        <Field
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={values.password}
          onChange={setField("password")}
          placeholder="••••••••"
          disabled={loading}
          error={errors.password}
          labelRight={
            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={() => onNavigate("forgot")}
              className="text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            >
              Forgot?
            </Button>
          }
          suffix={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword((s) => !s)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="flex items-center px-3 h-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              {showPassword ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </Button>
          }
        />
      </Rise>

      <FormError message={formError} />

      <Rise delay={130}>
        <Button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Signing in…
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </Rise>

      <Rise delay={190}>
        <p className="text-center text-sm text-neutral-500 dark:text-neutral-500">
          New to Zenpad?{" "}
          <Button
            type="button"
            variant="link"
            size="xs"
            onClick={() => onNavigate("register")}
            className={linkButtonClass}
          >
            Sign up
          </Button>
        </p>
      </Rise>
    </form>
  );
};

export default Login;

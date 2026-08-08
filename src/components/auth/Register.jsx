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
import { validateRegister } from "./validation";
import { Button } from "../ui/button";

const Register = ({ onNavigate }) => {
  const register = useAppStore((state) => state.register);
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const setField = (key) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (formError) setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validateRegister(values);
    setErrors(v);
    setFormError("");
    if (Object.keys(v).length) return;

    setLoading(true);
    try {
      const result = await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      if (result?.needsVerification) setNeedsVerification(true);
    } catch (err) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="space-y-5">
        <Rise delay={0}>
          <AuthHeader title="Verify your email" />
        </Rise>
        <Rise delay={60}>
          <p className="text-sm text-center text-neutral-500 dark:text-neutral-500 -mt-2">
            We sent a confirmation link to{" "}
            <span className="text-neutral-700 dark:text-neutral-300">
              {values.email.trim()}
            </span>
            . Click it to finish signing up.
          </p>
        </Rise>
        <Rise delay={130}>
          <Button
            type="button"
            onClick={() => onNavigate("login")}
            className={primaryButtonClass}
          >
            Back to sign in
          </Button>
        </Rise>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Rise delay={0}>
        <AuthHeader title="Sign up for Zenpad" />
      </Rise>

      <Rise delay={60} className="space-y-4">
        <Field
          label="Name"
          type="text"
          autoComplete="name"
          autoFocus
          value={values.name}
          onChange={setField("name")}
          placeholder="Your name"
          disabled={loading}
          error={errors.name}
        />

        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={setField("email")}
          placeholder="you@example.com"
          disabled={loading}
          error={errors.email}
        />

        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={setField("password")}
          placeholder="At least 8 characters"
          disabled={loading}
          error={errors.password}
        />

        <Field
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={values.confirm}
          onChange={setField("confirm")}
          placeholder="Repeat password"
          disabled={loading}
          error={errors.confirm}
        />
      </Rise>

      <FormError message={formError} />

      <Rise delay={130}>
        <Button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Signing up…
            </span>
          ) : (
            "Sign up"
          )}
        </Button>
      </Rise>

      <Rise delay={190}>
        <p className="text-center text-sm text-neutral-500 dark:text-neutral-500">
          Already have an account?{" "}
          <Button
            type="button"
            variant="link"
            size="xs"
            onClick={() => onNavigate("login")}
            className={linkButtonClass}
          >
            Sign in
          </Button>
        </p>
      </Rise>
    </form>
  );
};

export default Register;

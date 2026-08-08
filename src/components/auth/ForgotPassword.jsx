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
import { validateForgot } from "./validation";
import { Button } from "../ui/button";

const ForgotPassword = ({ onNavigate }) => {
  const forgotPassword = useAppStore((state) => state.forgotPassword);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
    if (formError) setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validateForgot({ email });
    setEmailError(v.email || "");
    setFormError("");
    if (v.email) return;

    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-5">
        <Rise delay={0}>
          <AuthHeader title="Check your inbox" />
        </Rise>
        <Rise delay={60}>
          <p className="text-sm text-center text-neutral-500 dark:text-neutral-500 -mt-2">
            If an account exists for{" "}
            <span className="text-neutral-700 dark:text-neutral-300">
              {email}
            </span>
            , you'll receive a reset link shortly.
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
        <AuthHeader title="Reset your password" />
      </Rise>

      <Rise delay={60}>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={handleChange}
          placeholder="you@example.com"
          disabled={loading}
          error={emailError}
        />
      </Rise>

      <FormError message={formError} />

      <Rise delay={130}>
        <Button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Sending…
            </span>
          ) : (
            "Send reset link"
          )}
        </Button>
      </Rise>

      <Rise delay={190}>
        <p className="text-center text-sm text-neutral-500 dark:text-neutral-500">
          Remembered it?{" "}
          <Button
            type="button"
            variant="link"
            size="xs"
            onClick={() => onNavigate("login")}
            className={linkButtonClass}
          >
            Back to sign in
          </Button>
        </p>
      </Rise>
    </form>
  );
};

export default ForgotPassword;

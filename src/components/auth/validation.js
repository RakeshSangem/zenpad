const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!email.trim()) errors.email = "Please enter your email";
  if (!password) errors.password = "Please enter your password";
  return errors;
};

export const validateRegister = ({ name, email, password, confirm }) => {
  const errors = {};
  if (!name.trim()) errors.name = "Please enter your name";

  if (!email.trim()) errors.email = "Please enter your email";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email";

  if (!password) errors.password = "Please enter a password";
  else if (password.length < 8)
    errors.password = "Must be at least 8 characters";

  if (!confirm) errors.confirm = "Please confirm your password";
  else if (password && password !== confirm)
    errors.confirm = "Passwords do not match";

  return errors;
};

export const validateForgot = ({ email }) => {
  const errors = {};
  if (!email.trim()) errors.email = "Please enter your email";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email";
  return errors;
};

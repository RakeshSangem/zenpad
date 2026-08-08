import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import { Button } from "../ui/button";

const AuthLayout = ({ onClose }) => {
  const [view, setView] = useState("login");

  const renderView = () => {
    switch (view) {
      case "register":
        return <Register onNavigate={setView} />;
      case "forgot":
        return <ForgotPassword onNavigate={setView} />;
      case "login":
      default:
        return <Login onNavigate={setView} />;
    }
  };

  return (
    <div className="relative min-h-130 w-full flex items-center justify-center bg-neutral-50 dark:bg-[#1a1a1a] px-6 py-12 overflow-y-auto">
      {onClose && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close account dialog"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Button>
      )}
      <div key={view} className="w-full max-w-90">
        {renderView()}
      </div>
    </div>
  );
};

export default AuthLayout;

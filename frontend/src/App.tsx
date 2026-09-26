import React, { useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { SignupForm } from "./components/SignupForm";
import { ForgotPasswordFlow } from "./components/ForgotPasswordFlow";
import { ShieldCheck } from "lucide-react";

export type AuthView = "login" | "signup" | "forgot-password";

export const App: React.FC = () => {
  const [view, setView] = useState<AuthView>("login");

  return (
    <>
      {/* Soft atmospheric blue-white ambient glow orbs */}
      <div className="auth-ambient-orb-1" aria-hidden="true" />
      <div className="auth-ambient-orb-2" aria-hidden="true" />

      {/* Main centered authentication container */}
      <main className="auth-container">
        {view === "login" && (
          <LoginForm
            onNavigateToSignup={() => setView("signup")}
            onNavigateToForgotPassword={() => setView("forgot-password")}
          />
        )}

        {view === "signup" && (
          <SignupForm onNavigateToLogin={() => setView("login")} />
        )}

        {view === "forgot-password" && (
          <ForgotPasswordFlow onNavigateToLogin={() => setView("login")} />
        )}

        {/* Minimal Enterprise Security Footer */}
        <footer className="auth-brand-footer">
          <span>
            <ShieldCheck size={14} color="#0284c7" />
            StockSense Double-Entry Engine
          </span>
          <span>•</span>
          <span>Enterprise Secure Session</span>
        </footer>
      </main>
    </>
  );
};

export default App;

import React, { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { LoginForm } from "./components/LoginForm";
import { SignupForm } from "./components/SignupForm";
import { ForgotPasswordFlow } from "./components/ForgotPasswordFlow";
import { ProtectedPlaceholder } from "./components/ProtectedPlaceholder";
import { ShieldCheck } from "lucide-react";

export type AuthView = "login" | "signup" | "forgot-password";

const AuthAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<AuthView>("login");

  return (
    <>
      {/* Soft atmospheric blue-white ambient glow orbs */}
      <div className="auth-ambient-orb-1" aria-hidden="true" />
      <div className="auth-ambient-orb-2" aria-hidden="true" />

      {/* Main centered authentication container */}
      <main className="auth-container">
        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              color: "var(--text-muted)",
              fontSize: "13.5px",
            }}
          >
            <div
              className="spinner"
              style={{
                width: "28px",
                height: "28px",
                borderWidth: "3px",
                borderTopColor: "#0284c7",
                borderColor: "rgba(2, 132, 199, 0.2)",
              }}
            />
            <span>Verifying session...</span>
          </div>
        ) : user ? (
          /* Protected Placeholder shown when authenticated */
          <ProtectedPlaceholder />
        ) : (
          /* Public Authentication Forms */
          <>
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
          </>
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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthAppContent />
    </AuthProvider>
  );
};

export default App;

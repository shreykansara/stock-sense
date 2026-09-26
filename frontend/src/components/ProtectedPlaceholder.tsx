import React, { useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { useAuth } from "../context/useAuth";
import { LogOut, ShieldCheck, User, Mail, Sparkles } from "lucide-react";

export const ProtectedPlaceholder: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="auth-card" style={{ maxWidth: "480px" }}>
      <div className="auth-header">
        <BrandLogo />
        <h1 className="auth-heading">Authenticated Workspace</h1>
        <p className="auth-subtitle">
          Welcome back, <strong>{user.name}</strong>
        </p>
      </div>

      <div
        style={{
          background: "rgba(241, 245, 249, 0.7)",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "18px 20px",
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12.5px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <User size={14} /> Account Role
          </span>
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              padding: "3px 9px",
              borderRadius: "20px",
              background: "#e0f2fe",
              color: "#0369a1",
              border: "1px solid #bae6fd",
            }}
          >
            {user.role}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12.5px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Mail size={14} /> Email
          </span>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
            {user.email}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12.5px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={14} color="#10b981" /> Session
          </span>
          <span style={{ fontSize: "11.5px", fontWeight: 500, color: "#047857" }}>
            HTTP-only JWT Verified
          </span>
        </div>
      </div>

      {/* Notice about Asim's dashboard development */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "12px",
          padding: "12px 14px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          fontSize: "12.5px",
          lineHeight: "1.45",
          color: "#166534",
        }}
      >
        <Sparkles size={16} style={{ flexShrink: 0, marginTop: "2px", color: "#16a34a" }} />
        <span>
          Authentication is verified and your secure session is active. Full dashboard integration will be connected by Asim.
        </span>
      </div>

      {/* Logout Action */}
      <button
        type="button"
        className="btn-primary"
        onClick={handleLogout}
        disabled={isLoggingOut}
        style={{ background: "#334155" }}
      >
        {isLoggingOut ? (
          <span className="spinner" />
        ) : (
          <>
            <LogOut size={16} />
            <span>Sign Out</span>
          </>
        )}
      </button>
    </div>
  );
};

import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { GoogleButton } from "./GoogleButton";
import { useAuth } from "../context/useAuth";

interface LoginFormProps {
  onNavigateToSignup: () => void;
  onNavigateToForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onNavigateToSignup,
  onNavigateToForgotPassword,
}) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      await login(trimmedEmail, password);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid credentials. Please verify and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim().length > 0 && password.length > 0;

  return (
    <div className="auth-card">
      <div className="auth-header">
        <BrandLogo />
        <h1 className="auth-heading">Sign in to StockSense</h1>
        <p className="auth-subtitle">
          Enter your work email to access the inventory workspace
        </p>
      </div>

      {errorMessage && (
        <div className="alert-banner error" role="alert">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            Work Email
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Mail size={16} />
            </span>
            <input
              id="login-email"
              type="email"
              className="input-field"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              autoComplete="email"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <button
              type="button"
              className="form-link"
              onClick={onNavigateToForgotPassword}
            >
              Forgot password?
            </button>
          </div>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Lock size={16} />
            </span>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              autoComplete="current-password"
              required
              style={{ paddingRight: "36px" }}
            />
            <button
              type="button"
              className="input-action-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary"
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? <span className="spinner" /> : "Sign In"}
        </button>
      </form>

      {/* Social Divider */}
      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">or continue with</span>
        <div className="auth-divider-line" />
      </div>

      {/* Google Sign In */}
      <GoogleButton
        label="Sign in with Google"
        onSuccess={async (idToken) => {
          await loginWithGoogle(idToken);
        }}
        onError={(err) => {
          setErrorMessage(err);
        }}
        disabled={isLoading}
      />

      {/* Footer Switch */}
      <div className="auth-footer-switch">
        <span>Don't have an account?</span>
        <button type="button" onClick={onNavigateToSignup}>
          Sign up
        </button>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { GoogleButton } from "./GoogleButton";

interface SignupFormProps {
  onNavigateToLogin: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onNavigateToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute password strength (weak, fair, good)
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/\d/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0, 1, 2, 3
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid work email address.");
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setIsLoading(true);

    // Simulate registration local UI flow
    setTimeout(() => {
      setIsLoading(false);
      alert(`[StockSense Auth Demo]\nAccount created for ${trimmedName} (${trimmedEmail}${trimmedPhone ? `, ${trimmedPhone}` : ""}).\n(Visual state verified. Ready for backend hookup.)`);
      onNavigateToLogin();
    }, 900);
  };

  const isFormValid =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    confirmPassword.length >= 8;

  return (
    <div className="auth-card" style={{ maxWidth: "450px" }}>
      <div className="auth-header">
        <BrandLogo />
        <h1 className="auth-heading">Create your StockSense account</h1>
        <p className="auth-subtitle">
          Get started with real-time double-entry stock intelligence
        </p>
      </div>

      {errorMessage && (
        <div className="alert-banner error" role="alert">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-name">
            Full Name
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <User size={16} />
            </span>
            <input
              id="signup-name"
              type="text"
              className="input-field"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              autoComplete="name"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-email">
            Work Email
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Mail size={16} />
            </span>
            <input
              id="signup-email"
              type="email"
              className="input-field"
              placeholder="alex@company.com"
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

        {/* Phone */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="signup-phone">
              Mobile Phone
            </label>
            <span style={{ fontSize: "11px", color: "var(--text-light)" }}>
              Optional / For SMS OTP
            </span>
          </div>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Phone size={16} />
            </span>
            <input
              id="signup-phone"
              type="tel"
              className="input-field"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-password">
            Password (min 8 characters)
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Lock size={16} />
            </span>
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              className="input-field"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              autoComplete="new-password"
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

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="password-strength-bar" aria-label="Password strength">
              <div
                className={`strength-segment ${
                  strength >= 1 ? (strength === 1 ? "active-weak" : strength === 2 ? "active-fair" : "active-good") : ""
                }`}
              />
              <div
                className={`strength-segment ${
                  strength >= 2 ? (strength === 2 ? "active-fair" : "active-good") : ""
                }`}
              />
              <div
                className={`strength-segment ${strength >= 3 ? "active-good" : ""}`}
              />
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-confirm-password">
            Confirm Password
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <Lock size={16} />
            </span>
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              className="input-field"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              autoComplete="new-password"
              required
              style={{ paddingRight: "36px" }}
            />
            <button
              type="button"
              className="input-action-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary"
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? <span className="spinner" /> : "Create Account"}
        </button>
      </form>

      {/* Social Divider */}
      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">or sign up with</span>
        <div className="auth-divider-line" />
      </div>

      <GoogleButton
        label="Sign up with Google"
        onClick={() => {
          alert("[Google OAuth]\nGoogle button clicked. Ready for Google Identity Services.");
        }}
        disabled={isLoading}
      />

      {/* Footer Switch */}
      <div className="auth-footer-switch">
        <span>Already have an account?</span>
        <button type="button" onClick={onNavigateToLogin}>
          Sign in
        </button>
      </div>
    </div>
  );
};

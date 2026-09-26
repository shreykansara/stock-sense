import React, { useState, useRef, useEffect } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";

interface ForgotPasswordFlowProps {
  onNavigateToLogin: () => void;
}

type Step = "REQUEST_OTP" | "VERIFY_OTP" | "RESET_PASSWORD" | "SUCCESS";

export const ForgotPasswordFlow: React.FC<ForgotPasswordFlowProps> = ({
  onNavigateToLogin,
}) => {
  const [step, setStep] = useState<Step>("REQUEST_OTP");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend Countdown Timer (starts when reaching VERIFY_OTP)
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: any = null;
    if (step === "VERIFY_OTP" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Mask contact for display (e.g. alex@gmail.com -> al***@gmail.com)
  const getMaskedContact = (val: string) => {
    if (!val) return "";
    if (val.includes("@")) {
      const [user, domain] = val.split("@");
      const masked = user.length > 2 ? `${user.slice(0, 2)}***` : `${user}***`;
      return `${masked}@${domain}`;
    }
    return val.length > 4 ? `${val.slice(0, 3)}******${val.slice(-2)}` : val;
  };

  // OTP box key handler
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Take only last character typed
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtp(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Step 1: Request OTP Submission
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = contact.trim();
    if (!trimmed) {
      setErrorMessage("Please enter your registered email or phone number.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("VERIFY_OTP");
      setTimer(59);
      setCanResend(false);
    }, 700);
  };

  // Resend OTP handler
  const handleResendOtp = () => {
    if (!canResend) return;
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setTimer(59);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    }, 500);
  };

  // Step 2: Verify OTP Submission
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullCode = otp.join("");
    if (fullCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("RESET_PASSWORD");
    }, 700);
  };

  // Step 3: Reset Password Submission
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("SUCCESS");
    }, 800);
  };

  return (
    <div className="auth-card">
      {/* Top back navigation */}
      {step !== "SUCCESS" && (
        <button
          type="button"
          className="back-btn"
          onClick={() => {
            if (step === "VERIFY_OTP") setStep("REQUEST_OTP");
            else if (step === "RESET_PASSWORD") setStep("VERIFY_OTP");
            else onNavigateToLogin();
          }}
        >
          <ArrowLeft size={15} />
          <span>
            {step === "REQUEST_OTP" ? "Back to sign in" : "Back"}
          </span>
        </button>
      )}

      {/* Step Tracker */}
      {step !== "SUCCESS" && (
        <div className="step-tracker">
          <div className={`step-dot ${step === "REQUEST_OTP" ? "active" : ""}`} />
          <div className={`step-dot ${step === "VERIFY_OTP" ? "active" : ""}`} />
          <div className={`step-dot ${step === "RESET_PASSWORD" ? "active" : ""}`} />
        </div>
      )}

      {/* Card Header */}
      <div className="auth-header">
        <BrandLogo />

        {step === "REQUEST_OTP" && (
          <>
            <h1 className="auth-heading">Forgot Password</h1>
            <p className="auth-subtitle">
              Enter your email or phone number to receive a one-time verification code
            </p>
          </>
        )}

        {step === "VERIFY_OTP" && (
          <>
            <h1 className="auth-heading">Enter Verification Code</h1>
            <p className="auth-subtitle">
              We sent a 6-digit verification code to{" "}
              <strong>{getMaskedContact(contact)}</strong>
            </p>
          </>
        )}

        {step === "RESET_PASSWORD" && (
          <>
            <h1 className="auth-heading">Create New Password</h1>
            <p className="auth-subtitle">
              Set a strong password to protect your StockSense account
            </p>
          </>
        )}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="alert-banner error" role="alert">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Request OTP Form */}
      {step === "REQUEST_OTP" && (
        <form className="auth-form" onSubmit={handleRequestOtp} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reset-contact">
              Work Email or Phone Number
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Mail size={16} />
              </span>
              <input
                id="reset-contact"
                type="text"
                className="input-field"
                placeholder="name@company.com or +1 (555) 000-0000"
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!contact.trim() || isLoading}
          >
            {isLoading ? <span className="spinner" /> : "Send Verification Code"}
          </button>
        </form>
      )}

      {/* STEP 2: Verify OTP Form */}
      {step === "VERIFY_OTP" && (
        <form className="auth-form" onSubmit={handleVerifyOtp} noValidate>
          <div className="form-group">
            <label className="form-label" style={{ textAlign: "center" }}>
              6-Digit Code
            </label>
            <div className="otp-grid">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="otp-box"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  autoFocus={idx === 0}
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Resend Timer */}
          <div style={{ textAlign: "center", fontSize: "12.5px", color: "var(--text-muted)", margin: "4px 0 10px" }}>
            {canResend ? (
              <button
                type="button"
                className="form-link"
                onClick={handleResendOtp}
                disabled={isLoading}
                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <RefreshCw size={12} />
                <span>Resend Code</span>
              </button>
            ) : (
              <span>Resend code in <strong>0:{timer < 10 ? `0${timer}` : timer}</strong></span>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={otp.join("").length !== 6 || isLoading}
          >
            {isLoading ? <span className="spinner" /> : "Verify Code"}
          </button>
        </form>
      )}

      {/* STEP 3: Reset Password Form */}
      {step === "RESET_PASSWORD" && (
        <form className="auth-form" onSubmit={handleResetPassword} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reset-new-password">
              New Password (min 8 characters)
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={16} />
              </span>
              <input
                id="reset-new-password"
                type={showPassword ? "text" : "password"}
                className="input-field"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoFocus
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

          <div className="form-group">
            <label className="form-label" htmlFor="reset-confirm-password">
              Confirm New Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon-left">
                <Lock size={16} />
              </span>
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className="input-field"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
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

          <button
            type="submit"
            className="btn-primary"
            disabled={newPassword.length < 8 || confirmPassword.length < 8 || isLoading}
          >
            {isLoading ? <span className="spinner" /> : "Reset Password"}
          </button>
        </form>
      )}

      {/* STEP 4: Success State */}
      {step === "SUCCESS" && (
        <div className="success-view">
          <div className="success-icon-badge">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="auth-heading" style={{ marginBottom: "8px" }}>
            Password Reset Complete
          </h2>
          <p className="auth-subtitle" style={{ marginBottom: "24px" }}>
            Your account credentials have been updated securely. You can now sign in with your new password.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={onNavigateToLogin}
          >
            Back to Sign In
          </button>
        </div>
      )}
    </div>
  );
};

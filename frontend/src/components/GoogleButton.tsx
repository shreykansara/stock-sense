import React, { useEffect, useRef, useState } from "react";
import { authApi } from "../api/auth.api";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (notification?: any) => void;
        };
      };
    };
  }
}

interface GoogleButtonProps {
  label?: string;
  onSuccess: (idToken: string) => Promise<void>;
  onError: (errorMsg: string) => void;
  disabled?: boolean;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  label = "Continue with Google",
  onSuccess,
  onError,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState<boolean>(
    () => typeof window !== "undefined" && Boolean(window.google?.accounts?.id)
  );

  // 1. Fetch Google Client ID from backend or Vite environment
  useEffect(() => {
    let isMounted = true;
    async function loadClientId() {
      try {
        const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
        if (envClientId) {
          if (isMounted) setClientId(envClientId);
          return;
        }

        const data = await authApi.getGoogleClientId();
        if (isMounted && data.clientId) {
          setClientId(data.clientId);
        }
      } catch {
        // Fallback silently if offline or unconfigured
      }
    }
    loadClientId();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Detect Google Identity Services library on window
  useEffect(() => {
    if (isGsiLoaded) return;

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setIsGsiLoaded(true);
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isGsiLoaded]);

  // 3. Initialize GIS and render Google's official compliant button into containerRef
  useEffect(() => {
    if (!isGsiLoaded || !clientId || !containerRef.current) {
      return;
    }

    try {
      window.google?.accounts?.id?.initialize({
        client_id: clientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) {
            onError("Google sign-in was canceled or failed to provide credentials.");
            return;
          }

          setIsLoading(true);
          try {
            await onSuccess(response.credential);
          } catch (err: any) {
            onError(err.message || "Failed to authenticate with Google");
          } finally {
            setIsLoading(false);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render official Google button matching our container width
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        window.google?.accounts?.id?.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: label.includes("Sign up") ? "signup_with" : "signin_with",
          logo_alignment: "left",
          width: containerRef.current.offsetWidth || 368,
        });
      }
    } catch (err) {
      console.warn("[Google Identity] Initialization notice:", err);
    }
  }, [isGsiLoaded, clientId, label, onSuccess, onError]);

  // Fallback click handler if clicked before iframe renders or when testing
  const handleManualClick = () => {
    if (!clientId) {
      onError("Google Client ID is not configured in backend/.env yet. Please check your environment configuration.");
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log("[Google Prompt]", notification.getNotDisplayedReason?.());
        }
      });
    } else {
      onError("Google Identity Services script is still loading. Please try again in a moment.");
    }
  };

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {/* Container for Google's official rendered button */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          display: clientId && isGsiLoaded ? "flex" : "none",
          justifyContent: "center",
          minHeight: "42px",
        }}
      />

      {/* Styled visual fallback if Google GIS is still initializing or client ID is pending */}
      {(!clientId || !isGsiLoaded) && (
        <button
          type="button"
          className="btn-google"
          onClick={handleManualClick}
          disabled={disabled || isLoading}
          aria-label={label}
        >
          <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>{isLoading ? "Signing in..." : label}</span>
        </button>
      )}
    </div>
  );
};

import { Resend } from "resend";
import { config } from "../../config/index.js";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailProvider {
  sendEmail(payload: EmailPayload): Promise<boolean>;
}

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length === 2) {
    const name = parts[0];
    const masked = name.length > 2 ? `${name.slice(0, 2)}***` : `${name}***`;
    return `${masked}@${parts[1]}`;
  }
  return "***";
}

/**
 * Console Email Provider
 * Safely outputs transactional emails to the terminal during local development and testing.
 */
export class ConsoleEmailProvider implements IEmailProvider {
  async sendEmail(payload: EmailPayload): Promise<boolean> {
    const timestamp = new Date().toISOString();
    console.log(`\n================== [EMAIL DISPATCH] ==================`);
    console.log(`Time:    ${timestamp}`);
    console.log(`From:    ${config.emailFrom}`);
    console.log(`To:      ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Content: ${payload.text || payload.html}`);
    console.log(`======================================================\n`);
    return true;
  }
}

/**
 * Resend Email Provider
 * Delivers real transactional emails via Resend API.
 */
export class ResendEmailProvider implements IEmailProvider {
  private resend: Resend | null = null;

  constructor(apiKey?: string) {
    const key = (apiKey || config.resendApiKey || "").trim();
    if (key) {
      this.resend = new Resend(key);
    }
  }

  async sendEmail(payload: EmailPayload): Promise<boolean> {
    if (!this.resend) {
      console.error(
        `[ResendEmailProvider] ❌ EMAIL_PROVIDER is set to 'resend' but RESEND_API_KEY is not configured in backend/.env`
      );
      throw new Error(
        "EMAIL_PROVIDER is set to 'resend' but RESEND_API_KEY is missing or empty in backend/.env"
      );
    }

    console.log(`[ResendEmailProvider] Attempting to dispatch email via Resend API:`);
    console.log(`[ResendEmailProvider]   From:    ${config.emailFrom}`);
    console.log(`[ResendEmailProvider]   To:      ${maskEmail(payload.to)}`);
    console.log(`[ResendEmailProvider]   Subject: ${payload.subject}`);

    let response: any;
    try {
      response = await this.resend.emails.send({
        from: config.emailFrom,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
    } catch (networkError: any) {
      console.error(`[ResendEmailProvider] ❌ Network/connection error contacting Resend API:`, networkError?.message || networkError);
      throw new Error(`Resend network failure: ${networkError?.message || "Unknown error"}`);
    }

    const { data, error } = response || {};

    if (error) {
      console.error(`[ResendEmailProvider] ❌ Resend API rejected email dispatch:`);
      console.error(`[ResendEmailProvider]   Error Name:    ${error.name || "Error"}`);
      console.error(`[ResendEmailProvider]   Error Message: ${error.message}`);
      if (error.message && error.message.includes("testing emails to your own email address")) {
        console.error(
          `[ResendEmailProvider] 💡 Notice: Resend's free tier with 'onboarding@resend.dev' only permits sending emails to the email address registered on your Resend account. To send to any recipient, verify a domain in the Resend dashboard.`
        );
      }
      throw new Error(`Resend Delivery Failed (${error.name || "api_error"}): ${error.message}`);
    }

    console.log(`[ResendEmailProvider] ✅ Email successfully accepted by Resend!`);
    console.log(`[ResendEmailProvider]   Message ID: ${data?.id}`);
    return true;
  }
}

let activeEmailProvider: IEmailProvider | null = null;

export function setEmailProvider(provider: IEmailProvider | null): void {
  activeEmailProvider = provider;
}

export function getEmailProvider(): IEmailProvider {
  if (activeEmailProvider) return activeEmailProvider;

  const providerType = config.emailProvider;
  console.log(`[EmailProvider] Selected email provider: ${providerType}`);

  if (providerType === "resend") {
    activeEmailProvider = new ResendEmailProvider();
  } else {
    activeEmailProvider = new ConsoleEmailProvider();
  }

  return activeEmailProvider;
}

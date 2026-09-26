import { config } from "../../config/index.js";

export interface ISmsProvider {
  sendSms(to: string, message: string): Promise<boolean>;
}

/**
 * Console SMS Provider
 * Safely logs SMS messages to the console for local development and testing
 * when external SMS credentials (e.g. Twilio) are not configured.
 */
export class ConsoleSmsProvider implements ISmsProvider {
  async sendSms(to: string, message: string): Promise<boolean> {
    const timestamp = new Date().toISOString();
    console.log(`\n================== [SMS DISPATCH] ==================`);
    console.log(`Time:    ${timestamp}`);
    console.log(`To:      ${to}`);
    console.log(`Message: ${message}`);
    console.log(`====================================================\n`);
    return true;
  }
}

/**
 * Twilio SMS Provider Stub
 * Ready for Twilio integration once production credentials are supplied.
 */
export class TwilioSmsProvider implements ISmsProvider {
  async sendSms(to: string, message: string): Promise<boolean> {
    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
      console.warn(
        `[TwilioSmsProvider] Twilio credentials missing. Falling back to console dispatch for ${to}: ${message}`
      );
      return true;
    }

    // When Twilio SDK or REST API is plugged in:
    // const client = twilio(config.twilioAccountSid, config.twilioAuthToken);
    // await client.messages.create({ body: message, from: config.twilioPhoneNumber, to });
    console.log(`[TwilioSmsProvider] Dispatched SMS to ${to}`);
    return true;
  }
}

let activeProvider: ISmsProvider | null = null;

export function getSmsProvider(): ISmsProvider {
  if (activeProvider) return activeProvider;

  if (config.smsProvider === "twilio") {
    activeProvider = new TwilioSmsProvider();
  } else {
    activeProvider = new ConsoleSmsProvider();
  }

  return activeProvider;
}

import * as dotenv from 'dotenv';
dotenv.config();

/** Test data and environment values - the config.properties equivalent. */
export const config = {
  vendorNumber: process.env.VENDOR_NUMBER ?? '9519519514',
  opsNumber: process.env.OPS_NUMBER ?? '',
  branch: process.env.BRANCH ?? 'Bluedart_Onboarding',

  /**
   * Blue Dart onboarding moved to an approval flow (staff land in
   * titan.bluedart_approval_request as PENDING, not in the staff list), so its
   * tests are paused. RUN_BLUEDART=true runs them anyway.
   */
  bluedartPaused: process.env.RUN_BLUEDART !== 'true',

  /** Amazon Now vendor - org "Amazon Tez Bangalore". No consent screen on login. */
  amazon: {
    vendorNumber: process.env.AMAZON_VENDOR_NUMBER ?? '9843996388',
    branch: process.env.AMAZON_BRANCH ?? 'Amazon Tez Bangalore',
  },

  /**
   * Aadhaar / PAN numbers for the KYC number + Save step. Staging test values
   * from the backend team / KYC provider only - never a real person's ID.
   * Set them in .env (gitignored) or the environment; when unset the step is
   * skipped. Never commit them, log them, or put them in reports.
   */
  kycTestNumbers: {
    aadhaar: process.env.AADHAAR_TEST_NUMBER ?? '',
    pan: process.env.PAN_TEST_NUMBER ?? '',
  },

  /**
   * Steps that log in as the rider through the rider-app API (profile picture,
   * KYC selfie). Off by default: this is dashboard automation, and staging's
   * rider-app login now refuses scripted logins ("Please update the Rider app").
   * RIDER_APP_STEPS=true turns them back on.
   */
  riderAppSteps: process.env.RIDER_APP_STEPS === 'true',

  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_NAME ?? 'titan',
  },
};

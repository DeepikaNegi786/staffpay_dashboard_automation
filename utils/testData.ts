import type { RiderProfile } from './riderApi';
import { config } from './config';
/** Shape of one Add-Staff form submission. */
export interface StaffData {
  name: string;
  staffType: string;
  contactNumber: string;
  dateOfBirth: Date;
  gender: string;
  serviceCentreCode: string;
  employeeMode: string;
  rollCode: string;
  mot: string;
  educationalQualification: string;
  emailId: string;
  shirtSize: string;
  trouserSize: string;
  shoeSize: string;
  hubName: string;
  shiftName: string;
}

/**
 * Phone number and email have to be unique per run or the API rejects the
 * staff as a duplicate, so both are seeded from the clock.
 */
export function buildStaff(overrides: Partial<StaffData> = {}): StaffData {
  const seed = String(Date.now()).slice(-7);

  return {
    name: `QA Auto ${seed}`,
    staffType: 'Delivery Staff',
    contactNumber: `9${seed}${seed.slice(0, 2)}`.slice(0, 10),
    dateOfBirth: new Date(1995, 0, 15),
    gender: 'Male',
    serviceCentreCode: 'AAG',
    employeeMode: 'MPC',
    rollCode: 'Delivery - All Products',
    mot: 'Driver-Delivery Boy',
    educationalQualification: '12th Pass (Higher Secondary / PUC)',
    emailId: `qa.auto.${seed}@example.com`,
    shirtSize: 'L',
    trouserSize: '32',
    shoeSize: '9',
    hubName: 'Test Store Hub',
    shiftName: 'Morning shift',
    ...overrides,
  };
}

/** Shape of one Amazon Now Add-Staff submission (org Amazon Tez Bangalore). */
export interface AmazonStaffData {
  name: string;
  staffType: string;
  contactNumber: string;
  dateOfJoining: Date;
  dateOfBirth: Date;
  vehicleType: string;
  vehicleNumber: string;
  riderSource: string;
  businessType: string;
  business: string;
  hubName: string;
  shiftName: string;
  zone: string;
}

/**
 * Amazon staff are named "Auto QA amzuser <3 random digits>" and get a
 * 10-digit number starting 421. The name suffix is only for reading the
 * list; the phone is what must be unique, so its last 7 digits come from
 * the clock. Defaults match a staff created by hand in the dashboard.
 */
export function buildAmazonStaff(overrides: Partial<AmazonStaffData> = {}): AmazonStaffData {
  const contactNumber = `421${String(Date.now()).slice(-7)}`;

  return {
    name: `Auto QA amzuser ${Math.floor(100 + Math.random() * 900)}`,
    staffType: 'Delivery Boy',
    contactNumber,
    dateOfJoining: new Date(),
    dateOfBirth: new Date(1995, 0, 15),
    vehicleType: 'Bike',
    // Bike is BIKE_AMZ, which requires a vehicle number; manual runs reuse the phone.
    vehicleNumber: contactNumber,
    riderSource: 'Referral',
    businessType: 'FOOD',
    business: 'Amazon',
    hubName: 'TBI1_AMZ HSR Store',
    shiftName: 'TEST Full Day',
    zone: 'Koramangala and HSR',
    ...overrides,
  };
}

/**
 * Profile picture the test rider uploads: a generated placeholder (grey and
 * purple shapes), not anyone's photo. Never use a real rider's picture.
 */
export const TEST_PROFILE_IMAGE_FILE = process.env.PROFILE_IMAGE ?? 'test-assets/test-profile.png';

/**
 * Aadhaar / PAN numbers typed into the vendor portal's KYC cards. Generated
 * fresh per run (a reused number is rejected as DUPLICATE_REJECTED, "Documents
 * are linked to another user") and deliberately impossible, so they can never
 * be a real person's ID:
 *  - Aadhaar: staging only accepts numbers starting 2-9, so these do too,
 *    but they always fail UIDAI's Verhoeff checksum, which every real
 *    Aadhaar passes.
 *  - A PAN's 4th letter is the holder type (P, C, H, F, A, T, B, L, J, G) -
 *    these use E, which is none.
 * Staging test numbers from the backend team, if set in .env
 * (AADHAAR_TEST_NUMBER / PAN_TEST_NUMBER), are used instead - unless `fresh`:
 * a BGV Discrepant result blacklists the documents (is_blacklisted = 1,
 * "Blacklisted document"), and any later rider saving the same numbers is
 * rejected at once, so negative BGV tests must never use the fixed numbers.
 */
/** Verhoeff checksum - every real Aadhaar number passes it. */
function passesVerhoeff(num: string): boolean {
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];
  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 7, 8, 0, 6], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ];
  let c = 0;
  [...num].reverse().forEach((digit, i) => (c = d[c][p[i % 8][Number(digit)]]));
  return c === 0;
}

/**
 * 12 digits that fail the Verhoeff checksum: look valid, belong to no one.
 * Staging rejects arbitrary 2-9 numbers ("Please enter valid Aadhar number")
 * but accepts ones shaped like the team's test number, so keep its prefix.
 */
function impossibleAadhaar(prefix = '50051789'): string {
  while (true) {
    const n = prefix + Array.from({ length: 12 - prefix.length }, () => Math.floor(Math.random() * 10)).join('');
    if (!passesVerhoeff(n)) return n;
  }
}

export function buildKycNumbers({ fresh = false }: { fresh?: boolean } = {}): { aadhaar: string; pan: string } {
  const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
  const letters = (n: number) =>
    Array.from({ length: n }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
  return {
    aadhaar: (!fresh && config.kycTestNumbers.aadhaar) || impossibleAadhaar(),
    pan: (!fresh && config.kycTestNumbers.pan) || `${letters(3)}E${letters(1)}${digits(4)}${letters(1)}`,
  };
}

/**
 * KYC document images: generated samples marked "SAMPLE - TEST ONLY" with
 * made-up names and masked numbers. Never use real Aadhaar / PAN images.
 */
export const SAMPLE_KYC_DOCUMENTS = {
  aadhaarFront: process.env.AADHAAR_FRONT_IMAGE ?? 'test-assets/testingaadhar.png',
  aadhaarBack: process.env.AADHAAR_BACK_IMAGE ?? 'test-assets/testingaadharback.png',
  pan: process.env.PAN_IMAGE ?? 'test-assets/testngPAN.png',
};

/**
 * Selfie the test rider uploads for KYC: the placeholder, unless a run is
 * pointed at a real face explicitly with SELFIE_IMAGE=<path>. Nothing is
 * picked up from disk automatically - a real face must be one its owner has
 * agreed to, and chosen on purpose for that run. Never commit one.
 */
export const TEST_SELFIE_IMAGE_FILE = process.env.SELFIE_IMAGE ?? TEST_PROFILE_IMAGE_FILE;

/**
 * What the new rider fills on the rider app's profile screen. All test values.
 * `s3ProfileLink` is the link RiderApi.uploadImage() returned.
 */
export function buildRiderProfile(staff: AmazonStaffData, s3ProfileLink: string): RiderProfile {
  return {
    name: staff.name,
    contactNumber: staff.contactNumber,
    dob: staff.dateOfBirth
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/ /g, '-'),
    s3ProfileLink,
    address: 'QA test address, HSR Layout, Bangalore',
    pincode: '560102',
    emergencyContactName: 'QA Auto contact',
    // 421 prefix like the rider numbers - not a real Indian mobile range.
    emergencyContactNumber: `421${staff.contactNumber.slice(-7)}`.replace(/.$/, d => String((Number(d) + 1) % 10)),
  };
}

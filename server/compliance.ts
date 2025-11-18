import { eq } from "drizzle-orm";
import crypto from "crypto";
import { getDb } from "./db";
import {
  parentalConsentRequests,
  emailVerifications,
  privacySettings,
  dataAccessLogs,
  users,
} from "../drizzle/schema";

/**
 * Calculate age from birthdate
 */
export function calculateAge(birthdate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Determine if user is a minor (under 18)
 */
export function isMinor(birthdate: Date): boolean {
  return calculateAge(birthdate) < 18;
}

/**
 * Determine if user needs parental consent (13-17 years old)
 */
export function needsParentalConsent(birthdate: Date): boolean {
  const age = calculateAge(birthdate);
  return age >= 13 && age < 18;
}

/**
 * Determine if user is too young (under 13 - COPPA restriction)
 */
export function isTooYoung(birthdate: Date): boolean {
  return calculateAge(birthdate) < 13;
}

/**
 * Generate secure random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create parental consent request
 */
export async function createParentalConsentRequest(
  userId: number,
  parentEmail: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  await db.insert(parentalConsentRequests).values({
    userId,
    parentEmail,
    verificationToken: token,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return token;
}

/**
 * Verify parental consent token and approve
 */
export async function approveParentalConsent(token: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [request] = await db
    .select()
    .from(parentalConsentRequests)
    .where(eq(parentalConsentRequests.verificationToken, token))
    .limit(1);

  if (!request) return false;
  if (request.status !== "pending") return false;
  if (new Date() > request.expiresAt) {
    // Mark as expired
    await db
      .update(parentalConsentRequests)
      .set({ status: "expired" })
      .where(eq(parentalConsentRequests.id, request.id));
    return false;
  }

  // Approve consent
  const now = new Date();
  await db
    .update(parentalConsentRequests)
    .set({ status: "approved", respondedAt: now })
    .where(eq(parentalConsentRequests.id, request.id));

  // Update user record
  await db
    .update(users)
    .set({
      parentalConsentGiven: true,
      parentalConsentDate: now,
      accountType: "minor_with_consent",
    })
    .where(eq(users.id, request.userId));

  return true;
}

/**
 * Create email verification
 */
export async function createEmailVerification(
  userId: number,
  email: string
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration

  await db.insert(emailVerifications).values({
    userId,
    email,
    verificationToken: token,
    expiresAt,
  });

  return token;
}

/**
 * Verify email token
 */
export async function verifyEmail(token: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [verification] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.verificationToken, token))
    .limit(1);

  if (!verification) return false;
  if (verification.verified) return true; // Already verified
  if (new Date() > verification.expiresAt) return false;

  // Mark as verified
  const now = new Date();
  await db
    .update(emailVerifications)
    .set({ verified: true, verifiedAt: now })
    .where(eq(emailVerifications.id, verification.id));

  // Update user record
  await db
    .update(users)
    .set({ emailVerified: true, emailVerifiedAt: now })
    .where(eq(users.id, verification.userId));

  return true;
}

/**
 * Create default privacy settings for user
 */
export async function createDefaultPrivacySettings(
  userId: number,
  consentVersion: string = "1.0"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(privacySettings).values({
    userId,
    dataProcessingConsent: true, // Required for account creation
    marketingConsent: false,
    analyticsConsent: false,
    thirdPartySharing: false,
    consentVersion,
  });
}

/**
 * Log data access for GDPR compliance
 */
export async function logDataAccess(
  userId: number,
  accessType: "view" | "export" | "delete" | "update",
  dataCategory: string,
  accessedBy?: number,
  ipAddress?: string,
  userAgent?: string,
  details?: object
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(dataAccessLogs).values({
    userId,
    accessType,
    dataCategory,
    accessedBy,
    ipAddress,
    userAgent,
    details: details ? JSON.stringify(details) : null,
  });
}

/**
 * Export user data for GDPR compliance
 */
export async function exportUserData(userId: number): Promise<object> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get user data
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user) throw new Error("User not found");

  // Log the export
  await logDataAccess(userId, "export", "all_data", userId);

  // Return sanitized user data
  return {
    personal_information: {
      name: user.name,
      email: user.email,
      birthdate: user.birthdate,
      created_at: user.createdAt,
    },
    account_information: {
      account_type: user.accountType,
      email_verified: user.emailVerified,
      role: user.role,
    },
    consent_information: {
      parental_consent_given: user.parentalConsentGiven,
      parental_consent_date: user.parentalConsentDate,
      data_processing_consent: user.dataProcessingConsent,
      marketing_consent: user.marketingConsent,
    },
    // Add more data categories as needed
  };
}

/**
 * Delete user data for GDPR "right to be forgotten"
 */
export async function deleteUserData(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Log the deletion
  await logDataAccess(userId, "delete", "all_data", userId);

  // Delete user data (cascade delete should handle related records)
  await db.delete(users).where(eq(users.id, userId));
}

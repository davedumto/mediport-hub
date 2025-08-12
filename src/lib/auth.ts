import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import speakeasy from "speakeasy";
import prisma from "./db";
import { AppError, ErrorCodes } from "../utils/errors";
import { JWT_ACCESS_TOKEN_EXPIRY } from "../utils/constants";
import logger from "./logger";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const BCRYPT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT token generation
export function generateTokens(
  payload: Omit<JWTPayload, "sessionId">
): AuthTokens {
  const sessionId = crypto.randomUUID();

  const accessToken = jwt.sign({ ...payload, sessionId }, JWT_SECRET, {
    expiresIn: JWT_ACCESS_TOKEN_EXPIRY,
    issuer: "ehr-system",
    audience: "ehr-api",
  });

  const refreshToken = jwt.sign(
    { userId: payload.userId, sessionId },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d", issuer: "ehr-system", audience: "ehr-api" }
  );

  return { accessToken, refreshToken };
}

// JWT token verification
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: "ehr-system",
      audience: "ehr-api",
    }) as JWTPayload;
  } catch (error) {
    throw new AppError(
      ErrorCodes.INVALID_TOKEN,
      "Invalid or expired access token",
      401
    );
  }
}

export function verifyRefreshToken(token: string): {
  userId: string;
  sessionId: string;
} {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: "ehr-system",
      audience: "ehr-api",
    }) as { userId: string; sessionId: string };
  } catch (error) {
    throw new AppError(
      ErrorCodes.INVALID_TOKEN,
      "Invalid or expired refresh token",
      401
    );
  }
}

// MFA utilities
export function generateMFASecret(): string {
  return speakeasy.generateSecret({
    name: "EHR System",
    issuer: "EHR Healthcare",
  }).base32;
}

export function verifyMFACode(secret: string, code: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: code,
    window: 10, // Allow 10 time steps tolerance (5 minutes: 10 × 30s = 300s)
  });
}

// Account lockout utilities
export async function checkAccountLockout(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true, failedLoginAttempts: true },
  });

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(
      ErrorCodes.ACCOUNT_LOCKED,
      `Account locked until ${user.lockedUntil.toISOString()}`,
      423
    );
  }
}

// Password history validation
export async function validatePasswordHistory(
  userId: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHistory: true },
  });

  if (!user) return;

  const passwordHistory = (user.passwordHistory as string[]) || [];

  for (const oldPasswordHash of passwordHistory) {
    if (await verifyPassword(newPassword, oldPasswordHash)) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "Cannot reuse recent passwords",
        400
      );
    }
  }
}

// Update password history
export async function updatePasswordHistory(
  userId: string,
  newPasswordHash: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHistory: true, passwordHash: true },
  });

  if (!user) return;

  const passwordHistory = (user.passwordHistory as string[]) || [];
  passwordHistory.unshift(user.passwordHash); // Add current password to history

  // Keep only last 5 passwords
  const updatedHistory = passwordHistory.slice(0, 5);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHistory: updatedHistory },
  });
}

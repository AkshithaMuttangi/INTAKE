import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthUser } from "../types";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "intake_access_token_super_secret_key_2026_!@#$%^";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "intake_refresh_token_super_secret_key_2026_!@#$%^";

export class AuthService {
  /**
   * Hashes token before saving in database to prevent plaintext token leaks.
   */
  private static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  public static generateAccessToken(user: AuthUser): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );
  }

  public static generateRefreshToken(userId: string): { token: string; expiresAt: Date } {
    const token = jwt.sign({ userId, jti: crypto.randomUUID() }, REFRESH_SECRET, {
      expiresIn: "7d",
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    return { token, expiresAt };
  }

  public static async register({
    email,
    password,
    name,
    department = "General",
    role = Role.END_USER,
  }: {
    email: string;
    password: string;
    name: string;
    department?: string;
    role?: Role;
  }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("Email is already registered", 409, "EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        department,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    };

    const accessToken = this.generateAccessToken(authUser);
    const { token: refreshToken, expiresAt } = this.generateRefreshToken(user.id);

    // Save hashed refresh token in database
    await prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId: user.id,
        expiresAt,
      },
    });

    return { user: authUser, accessToken, refreshToken };
  }

  public static async login({ email, password }: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    };

    const accessToken = this.generateAccessToken(authUser);
    const { token: refreshToken, expiresAt } = this.generateRefreshToken(user.id);

    // Save refresh token record
    await prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId: user.id,
        expiresAt,
      },
    });

    return { user: authUser, accessToken, refreshToken };
  }

  public static async refreshAccessToken(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new AppError("Refresh token missing", 401, "REFRESH_TOKEN_REQUIRED");
    }

    let decoded: any;
    try {
      decoded = jwt.verify(rawRefreshToken, REFRESH_SECRET);
    } catch (_err) {
      throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      // If token is reused after revocation, invalidate all tokens for that user (token reuse detection)
      if (storedToken?.revoked) {
        await prisma.refreshToken.updateMany({
          where: { userId: storedToken.userId },
          data: { revoked: true },
        });
      }
      throw new AppError("Refresh token has been revoked or expired", 401, "TOKEN_REVOKED");
    }

    // Rotate token: revoke current token and issue a fresh pair
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const authUser: AuthUser = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      name: storedToken.user.name,
      role: storedToken.user.role,
      department: storedToken.user.department,
    };

    const newAccessToken = this.generateAccessToken(authUser);
    const { token: newRefreshToken, expiresAt } = this.generateRefreshToken(storedToken.user.id);

    await prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(newRefreshToken),
        userId: storedToken.user.id,
        expiresAt,
      },
    });

    return {
      user: authUser,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  public static async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    }
    return { success: true };
  }

  public static async getMe(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, department: true },
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return user as AuthUser;
  }
}

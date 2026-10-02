import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { AuthenticatedRequest, AuthUser } from "../types";
import { AppError } from "./errorHandler";
import { prisma } from "../config/prisma";

interface AccessTokenPayload {
  userId: string;
  email: string;
  role: Role;
  department: string;
}

export const authenticateJWT = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError("Authentication required: Missing access token", 401, "UNAUTHORIZED");
    }

    const secret = process.env.JWT_ACCESS_SECRET || "intake_access_token_super_secret_key_2026_!@#$%^";

    let payload: AccessTokenPayload;
    try {
      payload = jwt.verify(token, secret) as AccessTokenPayload;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new AppError("Access token expired", 401, "TOKEN_EXPIRED");
      }
      throw new AppError("Invalid access token", 401, "INVALID_TOKEN");
    }

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, department: true },
    });

    if (!user) {
      throw new AppError("User belonging to this token no longer exists", 401, "USER_NOT_FOUND");
    }

    req.user = user as AuthUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401, "UNAUTHORIZED"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' lacks permission for this resource. Required: [${allowedRoles.join(
            ", "
          )}]`,
          403,
          "FORBIDDEN"
        )
      );
    }

    next();
  };
};

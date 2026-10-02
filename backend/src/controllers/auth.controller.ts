import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AuthenticatedRequest } from "../types";

const REFRESH_COOKIE_NAME = "refreshToken";

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name, department, role } = req.body;
      const result = await AuthService.register({ email, password, name, department, role });

      // Set refresh token in secure, httpOnly cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 3600 * 1000,
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 3600 * 1000,
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      const result = await AuthService.refreshAccessToken(rawToken);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 3600 * 1000,
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      await AuthService.logout(rawToken);

      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.status(200).json({
        success: true,
        message: "Successfully logged out",
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getMe(req.user!.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}

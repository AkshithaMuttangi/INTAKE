import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthenticatedRequest } from "../types";
import { logger } from "../utils/logger";

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR", details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: AuthenticatedRequest,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const correlationId = req.correlationId || "unknown";

  if (err instanceof AppError) {
    logger.warn(`Handled application error: ${err.message}`, {
      correlationId,
      code: err.code,
      statusCode: err.statusCode,
      path: req.originalUrl,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || null,
      },
      correlationId,
    });
    return;
  }

  if (err instanceof ZodError) {
    logger.warn("Validation error occurred", {
      correlationId,
      issues: err.issues,
      path: req.originalUrl,
    });

    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload or query parameters",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      correlationId,
    });
    return;
  }

  // Fallback for unhandled / unexpected exceptions
  logger.error(`Unhandled internal error: ${err.message || err}`, {
    correlationId,
    stack: err.stack,
    path: req.originalUrl,
  });

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred on the server",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    },
    correlationId,
  });
};

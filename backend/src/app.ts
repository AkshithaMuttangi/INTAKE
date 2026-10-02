import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";

import routes from "./routes";
import { correlationIdMiddleware } from "./middleware/correlationId";
import { errorHandler, AppError } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

const app: Application = express();

// 1. Security & Core Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-correlation-id"],
  })
);

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 2. Correlation ID & Logging
app.use(correlationIdMiddleware);

// Morgan HTTP request stream to Winston
const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    stream: morganStream,
  })
);

// 3. Static Files (Uploads)
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");
app.use("/uploads", express.static(uploadDir));

// 4. API Routes
app.use("/api", routes);

// 5. 404 Handler for undefined routes
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404, "NOT_FOUND"));
});

// 6. Centralized Error Handler
app.use(errorHandler);

export default app;

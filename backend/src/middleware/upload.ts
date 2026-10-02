import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "./errorHandler";

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "text/plain",
  "text/x-log",
  "application/octet-stream", // for raw .log files
];

const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".log", ".txt"];

export const uploadAttachment = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_BYTES || "10485760", 10), // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowedExt = allowedExtensions.includes(ext);
    const isAllowedMime = allowedMimeTypes.includes(file.mimetype);

    if (isAllowedExt || isAllowedMime) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `Invalid file format '${ext}'. Allowed types: PDF, PNG, JPEG, LOG, TXT`,
          400,
          "UNSUPPORTED_FILE_TYPE"
        )
      );
    }
  },
});

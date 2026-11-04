import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { AppError } from "./errors.js";

export const MAX_IMAGES_PER_POINT = 5; // RN11
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB por arquivo
export const PUBLIC_URL_PREFIX = "/uploads/points";
export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "points");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Campo multipart: "images" (até 5 arquivos JPEG, PNG ou WebP).
export const uploadPointImages = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      cb(null, `${crypto.randomUUID()}${ALLOWED_TYPES[file.mimetype] ?? ""}`);
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE, files: MAX_IMAGES_PER_POINT },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in ALLOWED_TYPES) {
      cb(null, true);
    } else {
      cb(new AppError(400, "Formato inválido. Use JPEG, PNG ou WebP."));
    }
  },
}).array("images", MAX_IMAGES_PER_POINT);
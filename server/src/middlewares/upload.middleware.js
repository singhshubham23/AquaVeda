import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { ValidationError } from "../utils/AppError.js";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
const processedDir = path.join(uploadDir, "processed");
const thumbnailsDir = path.join(uploadDir, "thumbnails");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export const enforceImageUploadRange = (min = 1, max = 3) => (req, _res, next) => {
  const contentType = req.headers["content-type"] || "";
  const isMultipart = contentType.includes("multipart/form-data");

  // Keep JSON flows (seeded/suggested issue creation) backward compatible.
  if (!isMultipart) {
    return next();
  }

  const count = Array.isArray(req.files) ? req.files.length : 0;
  if (count < min || count > max) {
    return next(new ValidationError(`Please upload between ${min} and ${max} images.`));
  }

  return next();
};

export const processUploadedIssueImages = async (files = []) => {
  const processed = [];

  for (const file of files) {
    const baseName = path.parse(file.filename).name;
    const processedName = `${baseName}.webp`;
    const thumbName = `${baseName}-thumb.webp`;
    const processedPath = path.join(processedDir, processedName);
    const thumbPath = path.join(thumbnailsDir, thumbName);

    await sharp(file.path)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true, fit: "inside" })
      .webp({ quality: 78 })
      .toFile(processedPath);

    await sharp(file.path)
      .rotate()
      .resize({ width: 420, height: 420, fit: "cover" })
      .webp({ quality: 70 })
      .toFile(thumbPath);

    fs.unlinkSync(file.path);

    processed.push({
      imageUrl: `/uploads/processed/${processedName}`,
      thumbnailUrl: `/uploads/thumbnails/${thumbName}`,
    });
  }

  return processed;
};

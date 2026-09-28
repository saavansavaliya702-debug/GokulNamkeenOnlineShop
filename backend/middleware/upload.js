// backend/middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, safe);
  },
});

const ALLOWED_MIME = /^image\/(jpeg|jpg|png|gif|webp|avif|svg\+xml|bmp|heic|heif)$/i;
const ALLOWED_EXT = /\.(jpe?g|png|gif|webp|avif|svg|bmp|heic|heif)$/i;

const fileFilter = (req, file, cb) => {
  console.log("📁 Upload attempt:", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
  });

  const extOk = ALLOWED_EXT.test(file.originalname);
  const mimeOk = ALLOWED_MIME.test(file.mimetype);

  if (extOk && mimeOk) return cb(null, true);

  // Some browsers send `application/octet-stream` for valid images.
  // Fall back to extension-only check in that case.
  if (file.mimetype === "application/octet-stream" && extOk) {
    return cb(null, true);
  }

  cb(new Error("Only image files allowed"));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
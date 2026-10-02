import { BACKEND_URL } from "../config/api";

export const getImageUrl = (path) => {
  if (!path) return "";

  // Already a full URL (external or base64)
  if (
    path.startsWith("http") ||
    path.startsWith("data:") ||
    path.startsWith("https")
  ) {
    return path;
  }

  // Relative path like "/uploads/abc.jpg"
  return BACKEND_URL + path;
};

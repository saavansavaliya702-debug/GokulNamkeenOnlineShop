const BACKEND = "https://gokulnamkeenonlineshop-backend.onrender.com";

export const getImageUrl = (path) => {
  if (!path) return "";

  // Already a full URL (external or base64)
  if (path.startsWith("http") || path.startsWith("data:")) {
    return path;
  }

  // Relative path like "/uploads/abc.jpg"
  return BACKEND + path;
};

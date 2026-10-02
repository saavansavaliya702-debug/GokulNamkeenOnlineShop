const DEFAULT_API_URL = import.meta.env.DEV
  ? "http://localhost:7070/api"
  : "https://gokulnamkeenonlineshop-backend.onrender.com/api";

export const API_URL = (
  import.meta.env.VITE_API_URL || DEFAULT_API_URL
).replace(/\/+$/, "");

export const BACKEND_URL = API_URL.replace(/\/api$/, "");

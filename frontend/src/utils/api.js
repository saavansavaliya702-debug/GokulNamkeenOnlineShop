// src/utils/api.js
// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:7070/api",
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token"); // ⚠️ key name matters
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default api;


// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:7070/api",   // 👈 FIXED
// });

// // 🔍 debug
// api.interceptors.request.use((config) => {
//   console.log("📤 →", (config.baseURL || "") + config.url);
//   return config;
// });

// api.interceptors.response.use(
  //   (res) => res,
//   (err) => {
//     console.error(
//       "❌ ←",
//       err.config?.baseURL + err.config?.url,
//       err.response?.status,
//       err.response?.data,
//     );
//     return Promise.reject(err);
//   },
// );

// export default api;

import axios from "axios";

const api = axios.create({
  baseURL: "https://gokulnamkeenonlineshop-backend.onrender.com/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

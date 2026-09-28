// src/utils/auth.js
export const getToken = () => localStorage.getItem("token");

export const getUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw || raw === "undefined" || raw === "null") return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const isLoggedIn = () => !!getToken() && !!getUser();

export const isAdmin = () => getUser()?.isAdmin === true;

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("isAdmin");
};
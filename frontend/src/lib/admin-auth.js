const ADMIN_TOKEN_KEY = "posefit_admin_token";
const ADMIN_USER_KEY = "posefit_admin_user";

export const setAdminToken = (token) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const getAdminToken = () => {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const removeAdminToken = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const setAdminUser = (user) => {
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
};

export const getAdminUser = () => {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const removeAdminUser = () => {
  localStorage.removeItem(ADMIN_USER_KEY);
};

export const isAdminLoggedIn = () => {
  return !!getAdminToken();
};

export const clearAdminAuth = () => {
  removeAdminToken();
  removeAdminUser();
};

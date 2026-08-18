const PRO_TOKEN_KEY = "posefit_pro_token";
const PRO_USER_KEY = "posefit_pro_user";

export const setProToken = (token) => {
  localStorage.setItem(PRO_TOKEN_KEY, token);
};

export const getProToken = () => {
  return localStorage.getItem(PRO_TOKEN_KEY);
};

export const removeProToken = () => {
  localStorage.removeItem(PRO_TOKEN_KEY);
};

export const setProUser = (user) => {
  localStorage.setItem(PRO_USER_KEY, JSON.stringify(user));
};

export const getProUser = () => {
  try {
    const raw = localStorage.getItem(PRO_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const removeProUser = () => {
  localStorage.removeItem(PRO_USER_KEY);
};

export const isProLoggedIn = () => {
  return !!getProToken();
};

export const clearProAuth = () => {
  removeProToken();
  removeProUser();
};

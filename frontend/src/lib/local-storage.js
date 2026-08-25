export const setToken = (token) => {
  localStorage.setItem("pose-fit", token);
};

export const getToken = () => {
  return localStorage.getItem("pose-fit");
};

export const deleteToken = () => {
  localStorage.removeItem("pose-fit");
};

export const setUser = (user) => {
  localStorage.setItem("pose-fit-user", JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem("pose-fit-user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    console.error("User data parse error:", error);
    return null;
  }
};

export const deleteUser = () => {
  localStorage.removeItem("pose-fit-user");
};

export const getUserRole = () => {
  const user = getUser();
  return user?.role || null;
};